import { logger } from './logger';
import { isIOS, isSafari } from './utils';

export function isMediaRecorderSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof MediaRecorder !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia
  );
}

export interface MediaRecorderController {
  start: () => Promise<boolean>;
  stop: () => void;
  isRunning: () => boolean;
}

interface CreateOptions {
  language: string;
  onResult: (transcript: string, isFinal: boolean) => void;
  onError: (error: string) => void;
  onStatus: (listening: boolean) => void;
}

/**
 * MediaRecorder-based fallback for browsers that don't support
 * SpeechRecognition (older Safari, some WebView browsers).
 *
 * Flow: record audio → stop → POST audio/webm to ai-transcribe
 * edge function → receive transcript text.
 *
 * This is a push-to-talk model: the user presses and holds (or toggles)
 * the mic button, then releases to stop and transcribe.
 */
export function createMediaRecorderController(opts: CreateOptions): MediaRecorderController | null {
  if (!isMediaRecorderSupported()) {
    logger.warn('MediaRecorder not supported as fallback either.');
    return null;
  }

  let recorder: MediaRecorder | null = null;
  let stream: MediaStream | null = null;
  let chunks: Blob[] = [];
  let running = false;
  let manualStop = false;

  const start = async (): Promise<boolean> => {
    if (running) return true;

    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      logger.warn('MediaRecorder getUserMedia failed:', err);
      opts.onError('permission');
      return false;
    }

    chunks = [];
    const mimeType = pickMimeType();
    try {
      recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
    } catch {
      logger.warn('MediaRecorder construction failed.');
      stream.getTracks().forEach((t) => t.stop());
      opts.onError('unknown');
      return false;
    }

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = async () => {
      running = false;
      opts.onStatus(false);
      stream?.getTracks().forEach((t) => t.stop());

      if (manualStop) return;

      const audioBlob = new Blob(chunks, { type: mimeType || 'audio/webm' });
      if (audioBlob.size === 0) {
        opts.onError('no-speech');
        return;
      }

      opts.onResult('', false);
      const transcript = await transcribeAudio(audioBlob, opts.language);
      if (transcript) {
        opts.onResult(transcript, true);
      } else {
        opts.onError('unknown');
      }
    };

    recorder.start();
    running = true;
    manualStop = false;
    opts.onStatus(true);
    logger.info('MediaRecorder started.');
    return true;
  };

  const stop = () => {
    manualStop = true;
    if (recorder && recorder.state !== 'inactive') {
      try {
        recorder.stop();
      } catch {
        /* already inactive */
      }
    }
    running = false;
  };

  return {
    start,
    stop,
    isRunning: () => running,
  };
}

function pickMimeType(): string | undefined {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
  ];
  for (const type of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return undefined;
}

/**
 * Sends audio blob to the ai-transcribe edge function which calls
 * OpenAI Whisper/GPT-4o-transcribe. Returns the transcript text.
 */
async function transcribeAudio(blob: Blob, language: string): Promise<string> {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v2/ai-transcribe`;
  const formData = new FormData();
  formData.append('audio', blob, 'recording.webm');
  formData.append('language', language);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      logger.warn('transcribe non-ok:', response.status);
      return '';
    }

    const data = await response.json() as { text?: string; error?: string };
    if (data.error) {
      logger.warn('transcribe error:', data.error);
      return '';
    }
    return data.text?.trim() ?? '';
  } catch (err) {
    logger.error('transcribe fetch failed:', err);
    return '';
  }
}

export { isIOS, isSafari };
