import { useCallback, useEffect, useRef, useState } from 'react';
import type { AssistantState, Message, Preferences, VoiceOption } from '@/types';
import {
  isSpeechRecognitionSupported,
  createRecognition,
  requestMicPermission,
  type SpeechController,
  type SpeechRecognitionError,
} from '@/lib/speech-recognition';
import {
  isMediaRecorderSupported,
  createMediaRecorderController,
  type MediaRecorderController,
} from '@/lib/media-recorder';
import {
  isSpeechSynthesisSupported,
  loadVoices,
  speak as synthSpeak,
  stopSpeaking,
} from '@/lib/speech-synthesis';
import {
  createWakeWordDetector,
  isWakeWordSupported,
  type WakeWordController,
} from '@/lib/wake-word';
import { sounds } from '@/lib/sounds';
import { streamChat, buildRequestMessages } from '@/lib/ai-client';
import { logger } from '@/lib/logger';

interface UseVoiceOptions {
  preferences: Preferences;
  history: Message[];
  memory: Record<string, string>;
  onAssistantMessage: (content: string) => void;
  onAssistantToken?: (token: string) => void;
  onUserMessage: (content: string) => void;
  onStateChange?: (state: AssistantState) => void;
  onError?: (message: string) => void;
}

export type VoiceMode = 'speech-recognition' | 'media-recorder' | 'unsupported';

/**
 * Central voice orchestration hook.
 *
 * Strategy:
 * - If SpeechRecognition is supported → use it (Chrome, Edge, Safari iOS 14.5+).
 * - If SpeechRecognition is unavailable but MediaRecorder is → fallback to
 *   push-to-talk MediaRecorder + Whisper transcription (older Safari, WebView).
 * - If neither is available → text-only mode.
 *
 * State machine:
 *   idle ──startListening──▶ listening ──finalResult──▶ thinking
 *   thinking ──response──▶ speaking ──onEnd──▶ idle (or listening if hands-free)
 *   idle: wake word listener runs in the background (if enabled)
 */
export function useVoice(opts: UseVoiceOptions) {
  const { preferences, history, memory, onAssistantMessage, onAssistantToken, onUserMessage, onStateChange, onError } = opts;

  const [state, setState] = useState<AssistantState>('idle');
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [interim, setInterim] = useState('');
  const [streamingText, setStreamingText] = useState('');

  const mode: VoiceMode = (() => {
    if (isSpeechRecognitionSupported()) return 'speech-recognition';
    if (isMediaRecorderSupported()) return 'media-recorder';
    return 'unsupported';
  })();

  const modeRef = useRef<VoiceMode>(mode);

  const recognitionRef = useRef<SpeechController | null>(null);
  const mediaRecRef = useRef<MediaRecorderController | null>(null);
  const wakeRef = useRef<WakeWordController | null>(null);
  const stateRef = useRef<AssistantState>('idle');
  const prefRef = useRef(preferences);
  const historyRef = useRef(history);
  const memoryRef = useRef(memory);
  const busyRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);
  const startListeningRef = useRef<() => boolean>(() => false);
  const voicesRef = useRef<VoiceOption[]>([]);

  prefRef.current = preferences;
  historyRef.current = history;
  memoryRef.current = memory;
  voicesRef.current = voices;

  const callbacksRef = useRef({
    onAssistantMessage,
    onAssistantToken,
    onUserMessage,
    onStateChange,
    onError,
  });
  callbacksRef.current = {
    onAssistantMessage,
    onAssistantToken,
    onUserMessage,
    onStateChange,
    onError,
  };

  const setSafeState = useCallback((next: AssistantState) => {
    if (!mountedRef.current) return;
    if (stateRef.current === next) return;
    logger.debug('state:', stateRef.current, '→', next);
    stateRef.current = next;
    setState(next);
    callbacksRef.current.onStateChange?.(next);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void loadVoices().then((v) => {
      if (!cancelled) {
        setVoices(v);
        voicesRef.current = v;
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    sounds.setVolume(preferences.volume);
  }, [preferences.volume]);

  const stopWakeWord = useCallback(() => {
    if (wakeRef.current) {
      wakeRef.current.stop();
      wakeRef.current = null;
    }
  }, []);

  const startWakeWord = useCallback(() => {
    if (!isWakeWordSupported() || !prefRef.current.wake_word_enabled) return;
    if (wakeRef.current) {
      wakeRef.current.start();
      return;
    }

    const detector = createWakeWordDetector({
      preferences: prefRef.current,
      onDetected: () => {
        sounds.play('wake');
        setSafeState('wake-detected');
        stopSpeaking();
        setTimeout(() => {
          if (mountedRef.current) startListeningRef.current();
        }, 500);
      },
      onStatus: () => {},
    });
    if (!detector) return;
    wakeRef.current = detector;
    detector.start();
    logger.info('wake word listener started');
  }, [setSafeState]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (mediaRecRef.current) {
      mediaRecRef.current.stop();
      mediaRecRef.current = null;
    }
    if (stateRef.current === 'listening') setSafeState('idle');
  }, [setSafeState]);

  const stopSpeakingNow = useCallback(() => {
    stopSpeaking();
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    if (stateRef.current === 'speaking') setSafeState('idle');
  }, [setSafeState]);

  const speakResponse = useCallback(
    (response: string) => {
      if (!isSpeechSynthesisSupported()) {
        setSafeState('idle');
        busyRef.current = false;
        if (prefRef.current.hands_free) {
          setTimeout(() => {
            if (mountedRef.current) startListeningRef.current();
          }, 400);
        }
        return;
      }
      setSafeState('speaking');
      sounds.play('speaking');
      synthSpeak({
        text: response,
        preferences: prefRef.current,
        voices: voicesRef.current,
        onEnd: () => {
          busyRef.current = false;
          if (!mountedRef.current) return;
          setSafeState('idle');
          if (prefRef.current.hands_free) {
            setTimeout(() => {
              if (mountedRef.current) startListeningRef.current();
            }, 400);
          } else {
            startWakeWord();
          }
        },
        onError: () => {
          busyRef.current = false;
          if (!mountedRef.current) return;
          setSafeState('idle');
          startWakeWord();
        },
      });
    },
    [setSafeState, startWakeWord]
  );

  const respond = useCallback(
    async (userText: string) => {
      const text = userText.trim();
      if (!text) return;
      if (busyRef.current) return;
      busyRef.current = true;

      callbacksRef.current.onUserMessage(text);
      setInterim('');
      setStreamingText('');
      setSafeState('thinking');

      const requestMessages = buildRequestMessages(
        historyRef.current,
        prefRef.current,
        memoryRef.current
      );

      const abort = new AbortController();
      abortRef.current = abort;
      let accumulated = '';

      await streamChat(
        {
          messages: requestMessages,
          preferences: prefRef.current,
          memory: memoryRef.current,
        },
        abort.signal,
        {
          onToken: (token) => {
            if (!mountedRef.current || abort.signal.aborted) return;
            accumulated += token;
            setStreamingText(accumulated);
            callbacksRef.current.onAssistantToken?.(token);
          },
          onDone: (full) => {
            if (!mountedRef.current || abort.signal.aborted) {
              busyRef.current = false;
              return;
            }
            const response = full || accumulated;
            if (!response) {
              setSafeState('idle');
              busyRef.current = false;
              return;
            }
            callbacksRef.current.onAssistantMessage(response);
            setStreamingText('');
            speakResponse(response);
          },
          onError: (message) => {
            if (!mountedRef.current) return;
            callbacksRef.current.onError?.(message);
            setSafeState('idle');
            busyRef.current = false;
          },
        }
      );
    },
    [setSafeState, speakResponse]
  );

  const handleRecognitionError = useCallback(
    (err: SpeechRecognitionError) => {
      busyRef.current = false;
      recognitionRef.current = null;
      const cb = callbacksRef.current;
      switch (err) {
        case 'permission':
          setSafeState('error');
          cb.onError?.(
            'Permissão de microfone negada. Conceda acesso ao microfone nas configurações do navegador.'
          );
          break;
        case 'not-supported':
          cb.onError?.('Reconhecimento de voz não suportado neste navegador.');
          break;
        case 'network':
          cb.onError?.('Erro de rede no reconhecimento de voz. Verifique sua conexão.');
          break;
        case 'audio-capture':
          cb.onError?.('Nenhum microfone encontrado. Conecte um microfone e tente novamente.');
          break;
        case 'language-not-supported':
          cb.onError?.('O idioma selecionado não é suportado pelo reconhecedor de voz.');
          break;
        default:
          break;
      }
    },
    [setSafeState]
  );

  const startListening = useCallback((): boolean => {
    if (busyRef.current) return false;
    if (stateRef.current === 'listening') return true;

    stopSpeaking();
    stopWakeWord();

    // Tear down any existing controller to prevent duplicates.
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    if (mediaRecRef.current) {
      mediaRecRef.current.stop();
      mediaRecRef.current = null;
    }

    if (modeRef.current === 'speech-recognition') {
      return startSpeechRecognition();
    }
    if (modeRef.current === 'media-recorder') {
      void startMediaRecorder();
      return true;
    }

    callbacksRef.current.onError?.(
      'Seu navegador não suporta reconhecimento de voz. Use o modo texto.'
    );
    return false;
  }, [stopWakeWord, setSafeState, respond]);

  const startSpeechRecognition = useCallback((): boolean => {
    const controller: SpeechController | null = createRecognition({
      preferences: { ...prefRef.current, hands_free: false },
      continuous: false,
      onResult: (transcript, isFinal) => {
        if (!isFinal) {
          setInterim(transcript);
          return;
        }
        setInterim('');
        if (!transcript) return;
        busyRef.current = true;
        controller?.stop();
        recognitionRef.current = null;
        void respond(transcript);
      },
      onError: handleRecognitionError,
      onStatus: (listening) => {
        if (listening) {
          setSafeState('listening');
          sounds.play('listening');
        }
      },
    });

    recognitionRef.current = controller;
    if (!controller) {
      setSafeState('idle');
      return false;
    }

    // Ask for microphone permission BEFORE calling start().
    void (async () => {
      const granted = await requestMicPermission();
      if (!granted) {
        handleRecognitionError('permission');
        return;
      }
      if (!mountedRef.current) return;
      const ok = controller.start();
      if (!ok) {
        setSafeState('idle');
        recognitionRef.current = null;
      }
    })();

    return true;
  }, [respond, handleRecognitionError, setSafeState]);

  const startMediaRecorder = useCallback(async (): Promise<boolean> => {
    const controller = createMediaRecorderController({
      language: prefRef.current.language || 'pt-BR',
      onResult: (transcript, isFinal) => {
        if (!isFinal) {
          setInterim('Gravando... solte para transcrever');
          return;
        }
        setInterim('');
        if (!transcript) return;
        busyRef.current = true;
        mediaRecRef.current = null;
        void respond(transcript);
      },
      onError: (err) => {
        busyRef.current = false;
        mediaRecRef.current = null;
        if (err === 'permission') {
          setSafeState('error');
          callbacksRef.current.onError?.(
            'Permissão de microfone negada. Conceda acesso ao microfone nas configurações.'
          );
        } else {
          callbacksRef.current.onError?.('Erro na gravação de áudio. Tente novamente.');
        }
      },
      onStatus: (listening) => {
        if (listening) {
          setSafeState('listening');
          sounds.play('listening');
        }
      },
    });

    if (!controller) {
      setSafeState('idle');
      return false;
    }

    mediaRecRef.current = controller;
    setSafeState('listening');
    sounds.play('listening');
    const ok = await controller.start();
    if (!ok) {
      setSafeState('idle');
      mediaRecRef.current = null;
    }
    return ok;
  }, [respond, setSafeState]);

  startListeningRef.current = startListening;

  const speakText = useCallback(
    (text: string) => {
      if (!isSpeechSynthesisSupported()) return;
      stopSpeaking();
      setSafeState('speaking');
      sounds.play('speaking');
      synthSpeak({
        text,
        preferences: prefRef.current,
        voices: voicesRef.current,
        onEnd: () => setSafeState('idle'),
        onError: () => setSafeState('idle'),
      });
    },
    [setSafeState]
  );

  // Wake word lifecycle: start when enabled & idle, stop when disabled or busy.
  useEffect(() => {
    if (!preferences.wake_word_enabled) {
      stopWakeWord();
      return;
    }
    if (stateRef.current === 'idle' && !busyRef.current && !wakeRef.current) {
      startWakeWord();
    }
  }, [preferences.wake_word_enabled, state, startWakeWord, stopWakeWord]);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      recognitionRef.current?.abort();
      mediaRecRef.current?.stop();
      stopWakeWord();
      stopSpeaking();
      if (abortRef.current) abortRef.current.abort();
    };
  }, [stopWakeWord]);

  return {
    state,
    voices,
    interim,
    streamingText,
    mode,
    supported: {
      recognition: isSpeechRecognitionSupported(),
      synthesis: isSpeechSynthesisSupported(),
      wakeWord: isWakeWordSupported(),
      mediaRecorder: isMediaRecorderSupported(),
    },
    startListening,
    stopListening,
    stopSpeaking: stopSpeakingNow,
    speakText,
    respond,
    startWakeWord,
    stopWakeWord,
  };
}
