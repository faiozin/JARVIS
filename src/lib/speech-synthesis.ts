import type { Preferences, VoiceOption } from '@/types';
import { logger } from './logger';

function getSynth(): SpeechSynthesis | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  return window.speechSynthesis;
}

export function isSpeechSynthesisSupported(): boolean {
  return getSynth() !== null;
}

export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

export function isSafari(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent);
}

/**
 * Loads available voices. On Chrome the voices arrive asynchronously via
 * the `voiceschanged` event; on Safari they are usually available immediately
 * but can also arrive late. We resolve when voices appear or after a timeout.
 */
export function loadVoices(): Promise<VoiceOption[]> {
  return new Promise((resolve) => {
    const synth = getSynth();
    if (!synth) {
      resolve([]);
      return;
    }

    let resolved = false;
    const finish = () => {
      if (resolved) return;
      resolved = true;
      synth.removeEventListener('voiceschanged', finish);
      const voices = synth.getVoices().map((v) => ({
        voiceURI: v.voiceURI,
        name: v.name,
        lang: v.lang,
        localService: v.localService,
        default: v.default,
      }));
      logger.debug('voices loaded:', voices.length);
      resolve(voices);
    };

    const existing = synth.getVoices();
    if (existing.length > 0) {
      finish();
      return;
    }

    synth.addEventListener('voiceschanged', finish);
    setTimeout(finish, 2000);
  });
}

/**
 * Selects the best available voice with this priority:
 * 1. Brazilian Portuguese (pt-BR)
 * 2. Any Portuguese (pt-*)
 * 3. Browser default
 * 4. First available voice
 */
export function pickBrazilianVoice(voices: VoiceOption[]): VoiceOption | null {
  if (voices.length === 0) return null;

  const pt = voices.filter((v) => v.lang.toLowerCase().startsWith('pt'));
  if (pt.length > 0) {
    const br = pt.filter((v) => v.lang.toLowerCase().includes('br'));
    if (br.length > 0) {
      const preferredNames = ['luciana', 'google português do brasil', 'maria'];
      const named = br.find((v) =>
        preferredNames.some((n) => v.name.toLowerCase().includes(n))
      );
      return named ?? br[0];
    }
    return pt[0];
  }
  return voices.find((v) => v.default) ?? voices[0];
}

interface SpeakOptions {
  text: string;
  preferences: Preferences;
  voices: VoiceOption[];
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
  onBoundary?: (charIndex: number) => void;
}

/**
 * Safari/iOS bug: SpeechSynthesis stops firing onend after ~15 seconds of
 * speech. We work around this by splitting long text into chunks under the
 * limit and queueing them, and by using a keep-alive pause/resume timer.
 *
 * Also, iOS requires a small delay after cancel() before calling speak(),
 * otherwise the utterance is silently dropped.
 */
export function speak(opts: SpeakOptions): void {
  const synth = getSynth();
  if (!synth) {
    opts.onError?.('Síntese de voz não suportada neste navegador.');
    return;
  }

  const fullText = opts.text.trim();
  if (!fullText) {
    opts.onStart?.();
    opts.onEnd?.();
    return;
  }

  const chunks = splitForSafari(fullText);
  let chunkIndex = 0;
  let started = false;
  let keepAlive: ReturnType<typeof setInterval> | undefined;
  let ended = false;

  const cleanup = () => {
    if (keepAlive) {
      clearInterval(keepAlive);
      keepAlive = undefined;
    }
  };

  const finish = () => {
    if (ended) return;
    ended = true;
    cleanup();
    opts.onEnd?.();
  };

  const speakChunk = () => {
    if (ended) return;
    if (chunkIndex >= chunks.length) {
      finish();
      return;
    }

    const text = chunks[chunkIndex];
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = opts.preferences.language || 'pt-BR';
    utterance.rate = opts.preferences.speech_rate;
    utterance.pitch = opts.preferences.speech_pitch;
    utterance.volume = opts.preferences.volume;

    const voice = resolveVoice(opts);
    if (voice) {
      const match = synth.getVoices().find((v) => v.voiceURI === voice.voiceURI);
      if (match) utterance.voice = match;
    }

    utterance.onstart = () => {
      if (!started) {
        started = true;
        opts.onStart?.();
        if (isIOS()) {
          keepAlive = setInterval(() => {
            if (synth.speaking && !ended) {
              synth.pause();
              synth.resume();
            }
          }, 10000);
        }
      }
    };

    utterance.onend = () => {
      chunkIndex += 1;
      speakChunk();
    };

    utterance.onerror = (e) => {
      cleanup();
      const err = (e as SpeechSynthesisErrorEvent).error;
      if (err === 'interrupted' || err === 'canceled') {
        finish();
        return;
      }
      logger.warn('tts error:', err);
      opts.onError?.(err);
    };

    if (opts.onBoundary) {
      utterance.onboundary = (e) => opts.onBoundary?.(e.charIndex);
    }

    synth.speak(utterance);
  };

  const ios = isIOS();
  synth.cancel();
  setTimeout(speakChunk, ios ? 200 : 50);
}

function resolveVoice(opts: SpeakOptions): VoiceOption | null {
  if (opts.preferences.voice_uri) {
    const match = opts.voices.find((v) => v.voiceURI === opts.preferences.voice_uri);
    if (match) return match;
  }
  return pickBrazilianVoice(opts.voices);
}

/**
 * Splits text into chunks of ~200 characters on sentence boundaries.
 * Safari stops firing onend for utterances longer than ~15s of speech,
 * so keeping chunks short ensures onend always fires.
 */
function splitForSafari(text: string): string[] {
  const MAX = 200;
  if (text.length <= MAX) return [text];

  const parts = text.split(/(?<=[.!?…])\s+/);
  const chunks: string[] = [];
  let current = '';

  for (const part of parts) {
    if (current.length + part.length + 1 <= MAX) {
      current = current ? `${current} ${part}` : part;
    } else {
      if (current) chunks.push(current);
      if (part.length <= MAX) {
        current = part;
      } else {
        for (let i = 0; i < part.length; i += MAX) {
          chunks.push(part.slice(i, i + MAX));
        }
        current = '';
      }
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

export function stopSpeaking(): void {
  const synth = getSynth();
  if (synth) {
    synth.cancel();
  }
}

export function isSpeaking(): boolean {
  const synth = getSynth();
  return synth ? synth.speaking : false;
}
