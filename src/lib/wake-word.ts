import { WAKE_WORD } from '@/types';
import { normalizeText } from './utils';
import {
  isSpeechRecognitionSupported,
  createRecognition,
  type SpeechController,
  type SpeechRecognitionError,
} from './speech-recognition';
import type { Preferences } from '@/types';
import { logger } from './logger';

type DetectedHandler = (transcript: string) => void;
type StatusHandler = (active: boolean) => void;

export interface WakeWordController {
  start: () => void;
  stop: () => void;
  isActive: () => boolean;
}

export function isWakeWordSupported(): boolean {
  return isSpeechRecognitionSupported();
}

function containsWakeWord(text: string, sensitivity: number): boolean {
  const n = normalizeText(text);
  if (!n) return false;
  if (n.includes(WAKE_WORD)) return true;

  const variants = ['jarvis', 'jarviz', 'jarvys', 'jarbes', 'jarvisz', 'jar vi', 'jarves'];
  const maxDistance = Math.max(1, Math.round((1 - sensitivity) * 3));

  for (const v of variants) {
    if (n.includes(v)) return true;
    if (levenshtein(n.slice(0, Math.max(v.length + 4, 16)), v) <= maxDistance) {
      return true;
    }
  }
  return false;
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const prev = new Array(n + 1);
  const curr = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= n; j++) prev[j] = curr[j];
  }
  return prev[n];
}

/**
 * Creates a continuous wake-word listener.
 *
 * Guarantees:
 * - Only ONE SpeechController exists at a time — if one exists, start()
 *   reuses it instead of creating a duplicate.
 * - After detection, a 3s cooldown suppresses re-triggers from the same
 *   utterance.
 * - The controller's internal auto-restart (continuous=true) keeps listening
 *   after each onend, so we never get stuck silent.
 * - stop() permanently halts; start() on a stopped controller creates a
 *   fresh one (the old controller is aborted first).
 */
export function createWakeWordDetector(opts: {
  preferences: Preferences;
  onDetected: DetectedHandler;
  onStatus: StatusHandler;
}): WakeWordController | null {
  if (!isWakeWordSupported()) return null;

  let controller: SpeechController | null = null;
  let armed = true;
  let active = false;
  let stopped = true;
  let cooldown: ReturnType<typeof setTimeout> | undefined;

  const build = (): SpeechController | null => {
    return createRecognition({
      preferences: opts.preferences,
      continuous: true,
      onResult: (transcript, isFinal) => {
        if (!armed || !isFinal) return;
        if (containsWakeWord(transcript, opts.preferences.wake_word_sensitivity)) {
          logger.info('wake word detected:', transcript);
          armed = false;
          if (cooldown) clearTimeout(cooldown);
          cooldown = setTimeout(() => {
            armed = true;
          }, 3000);
          opts.onDetected(transcript);
        }
      },
      onError: (err: SpeechRecognitionError) => {
        if (err === 'permission') {
          stopped = true;
          active = false;
          opts.onStatus(false);
        }
        // network errors are handled internally by the controller (retry once).
        // All other errors: the controller auto-restarts or stops.
      },
      onStatus: (listening) => {
        active = listening;
        opts.onStatus(listening);
      },
    });
  };

  return {
    start: () => {
      if (!stopped) {
        // Already started — just ensure the controller is running.
        if (controller) {
          controller.start();
        }
        return;
      }
      stopped = false;
      armed = true;
      // Always destroy any previous controller to guarantee no duplicates.
      if (controller) {
        controller.abort();
        controller = null;
      }
      controller = build();
      controller?.start();
      logger.info('wake word listener started');
    },
    stop: () => {
      stopped = true;
      if (cooldown) clearTimeout(cooldown);
      if (controller) {
        controller.stop();
      }
      active = false;
      opts.onStatus(false);
      logger.info('wake word listener stopped');
    },
    isActive: () => active,
  };
}
