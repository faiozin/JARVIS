import type { Preferences } from '@/types';
import { logger } from './logger';
import { isIOS, isSafari } from './utils';

type ResultHandler = (transcript: string, isFinal: boolean) => void;
type ErrorHandler = (error: SpeechRecognitionError) => void;
type StatusHandler = (listening: boolean) => void;

export type SpeechRecognitionError =
  | 'permission'
  | 'not-supported'
  | 'network'
  | 'no-speech'
  | 'aborted'
  | 'audio-capture'
  | 'language-not-supported'
  | 'unknown';

export interface SpeechController {
  start: () => boolean;
  stop: () => void;
  abort: () => void;
  isRunning: () => boolean;
}

interface CreateOptions {
  preferences: Preferences;
  continuous: boolean;
  onResult: ResultHandler;
  onError: ErrorHandler;
  onStatus: StatusHandler;
}

function getCtor(): SpeechRecognitionStatic | null {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function isSpeechRecognitionSupported(): boolean {
  return getCtor() !== null;
}

/**
 * Checks microphone permission via the Permissions API before starting
 * recognition. Returns 'granted', 'denied', or 'prompt' (not yet decided).
 * Falls back to 'prompt' if the Permissions API is unavailable (Safari).
 */
export async function checkMicPermission(): Promise<PermissionState> {
  if (typeof navigator === 'undefined' || !navigator.permissions) {
    return 'prompt';
  }
  try {
    const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
    return result.state;
  } catch {
    return 'prompt';
  }
}

/**
 * Requests microphone access via getUserMedia. This forces the browser
 * permission prompt. We stop the tracks immediately — the only goal is
 * to trigger the prompt and learn whether the user granted or denied.
 */
export async function requestMicPermission(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return true;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
    logger.info('mic permission granted');
    return true;
  } catch {
    logger.warn('mic permission denied');
    return false;
  }
}

function mapError(error: string): SpeechRecognitionError {
  switch (error) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'permission';
    case 'network':
      return 'network';
    case 'no-speech':
      return 'no-speech';
    case 'aborted':
      return 'aborted';
    case 'audio-capture':
      return 'audio-capture';
    case 'language-not-supported':
      return 'language-not-supported';
    default:
      return 'unknown';
  }
}

function platformInfo(): string {
  return `browser=${isSafari() ? 'Safari' : 'Other'} ios=${isIOS()} platform=${navigator.platform}`;
}

/**
 * Creates a robust SpeechRecognition controller.
 *
 * Critical guarantees:
 * - ONE SpeechRecognition instance at a time — build() is only called once
 *   and the same instance is reused for restarts (except after network errors,
 *   which require destroying and recreating the instance).
 * - start() is a no-op if already running.
 * - Restart waits 300ms to avoid Safari "already started" errors.
 * - network errors: destroy instance, recreate, retry ONCE after 2s — no loops.
 * - permission errors: stop permanently, notify the caller, never retry.
 */
export function createRecognition(opts: CreateOptions): SpeechController | null {
  const Ctor = getCtor();
  if (!Ctor) {
    logger.warn('SpeechRecognition not supported. ' + platformInfo());
    opts.onError('not-supported');
    return null;
  }

  let recognition: SpeechRecognition | null = null;
  let manualStop = true;
  let running = false;
  let restartTimer: ReturnType<typeof setTimeout> | undefined;
  let destroyed = false;
  let networkRetried = false;

  const clearTimeouts = () => {
    if (restartTimer) {
      clearTimeout(restartTimer);
      restartTimer = undefined;
    }
  };

  const destroyInstance = () => {
    if (recognition) {
      try {
        recognition.abort();
      } catch {
        /* already stopped */
      }
      recognition.onstart = null;
      recognition.onend = null;
      recognition.onerror = null;
      recognition.onresult = null;
      recognition = null;
    }
    running = false;
  };

  const build = (): SpeechRecognition => {
    const rec = new Ctor();
    rec.lang = opts.preferences.language || 'pt-BR';
    rec.continuous = opts.continuous;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      running = true;
      logger.info('Recognition started. ' + platformInfo());
      opts.onStatus(true);
    };

    rec.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let finalText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result.item(0).transcript;
        if (result.isFinal) finalText += transcript;
        else interim += transcript;
      }
      if (finalText) opts.onResult(finalText.trim(), true);
      else if (interim) opts.onResult(interim.trim(), false);
    };

    rec.onerror = (event: SpeechRecognitionErrorEvent) => {
      const mapped = mapError(event.error);
      logger.warn('Recognition error:', event.error, '→', mapped);

      if (mapped === 'no-speech' || mapped === 'aborted') {
        return;
      }
      if (mapped === 'permission') {
        manualStop = true;
        destroyInstance();
        opts.onError(mapped);
        return;
      }
      if (mapped === 'audio-capture' || mapped === 'language-not-supported') {
        manualStop = true;
        destroyInstance();
        opts.onError(mapped);
        return;
      }
      if (mapped === 'network') {
        if (networkRetried) {
          logger.error('Network error persisted after retry. Stopping.');
          manualStop = true;
          destroyInstance();
          opts.onError(mapped);
          return;
        }
        networkRetried = true;
        destroyInstance();
        opts.onError(mapped);
        // Retry once after 2 seconds with a fresh instance.
        restartTimer = setTimeout(() => {
          if (destroyed || manualStop) return;
          logger.info('Recognition restarting after network error.');
          doStart();
        }, 2000);
        return;
      }
      opts.onError(mapped);
    };

    rec.onend = () => {
      running = false;
      opts.onStatus(false);
      logger.info('Recognition ended; manualStop=' + manualStop);

      if (destroyed || manualStop) return;

      clearTimeouts();
      // Wait 300ms before restarting to avoid Safari "already started".
      restartTimer = setTimeout(() => {
        if (destroyed || manualStop) return;
        logger.info('Recognition restarted after end.');
        doStart();
      }, 300);
    };

    return rec;
  };

  const doStart = () => {
    if (destroyed || manualStop || running) return;

    if (recognition && !running) {
      // Reuse the existing instance if it was built but stopped.
      try {
        recognition.start();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.warn('Recognition start (reuse) threw:', msg);
        if (msg.includes('already started')) {
          return;
        }
        // Instance is broken — destroy and rebuild.
        destroyInstance();
        networkRetried = false;
        const rec = build();
        recognition = rec;
        try {
          rec.start();
        } catch (err2) {
          logger.error('Recognition start (rebuild) threw:', err2);
          manualStop = true;
          opts.onError('unknown');
        }
      }
      return;
    }

    try {
      recognition = build();
      recognition.start();
      networkRetried = false;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.warn('Recognition start threw:', msg);
      if (msg.includes('already started')) {
        return;
      }
      manualStop = true;
      opts.onError('unknown');
    }
  };

  return {
    start: () => {
      if (destroyed) return false;
      manualStop = false;
      if (running) {
        logger.debug('start() called but already running — skipping');
        return true;
      }
      doStart();
      return true;
    },
    stop: () => {
      manualStop = true;
      clearTimeouts();
      if (recognition && running) {
        try {
          recognition.stop();
          logger.info('Recognition stopped (manual).');
        } catch {
          /* already stopped */
        }
      }
    },
    abort: () => {
      manualStop = true;
      destroyed = true;
      clearTimeouts();
      destroyInstance();
      logger.info('Recognition aborted and destroyed.');
    },
    isRunning: () => running,
  };
}
