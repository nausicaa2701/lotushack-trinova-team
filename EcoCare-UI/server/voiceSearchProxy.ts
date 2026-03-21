import { readFile } from 'node:fs/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';

const ELEVENLABS_TRANSCRIPTION_URL = 'https://api.elevenlabs.io/v1/speech-to-text';
const ELEVENLABS_TRANSCRIPTION_MODEL = 'scribe_v2';
const DEFAULT_AUDIO_MIME_TYPE = 'audio/webm';
const MAX_AUDIO_BYTES = 12 * 1024 * 1024;

type NextFunction = (error?: unknown) => void;

const fileExtensionByMimeType: Record<string, string> = {
  'audio/mp4': 'm4a',
  'audio/mpeg': 'mp3',
  'audio/ogg': 'ogg',
  'audio/wav': 'wav',
  'audio/webm': 'webm',
  'audio/x-wav': 'wav',
  'video/webm': 'webm',
};

function normalizeMimeType(contentType?: string | string[]): string {
  const headerValue = Array.isArray(contentType) ? contentType[0] : contentType;
  const normalized = headerValue?.split(';', 1)[0]?.trim().toLowerCase();
  return normalized && normalized.length > 0 ? normalized : DEFAULT_AUDIO_MIME_TYPE;
}

function getAudioFilename(mimeType: string): string {
  const extension = fileExtensionByMimeType[mimeType] ?? 'webm';
  return `voice-search.${extension}`;
}

function parseJsonSafely<T>(rawText: string): T | null {
  if (!rawText) return null;

  try {
    return JSON.parse(rawText) as T;
  } catch {
    return null;
  }
}

function writeJson(res: ServerResponse, statusCode: number, payload: Record<string, unknown>) {
  if (res.writableEnded) return;

  res.statusCode = statusCode;
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function normalizeTranscriptionErrorMessage(message: string) {
  const normalizedMessage = message.trim();
  const lowered = normalizedMessage.toLowerCase();

  if (lowered.includes('corrupted') || lowered.includes('playable audio')) {
    return 'Recording was too short or incomplete. Please speak a little longer before stopping.';
  }

  return normalizedMessage || 'Voice transcription failed. Please try again.';
}

function isUserAudioError(message: string) {
  const lowered = message.toLowerCase();
  return (
    lowered.includes('corrupted') ||
    lowered.includes('playable audio') ||
    lowered.includes('no speech was detected') ||
    lowered.includes('too short or incomplete') ||
    lowered.includes('speak a little longer before stopping')
  );
}

let cachedKeytermsPromise: Promise<string[]> | null = null;

async function loadVoiceSearchKeyterms() {
  if (!cachedKeytermsPromise) {
    cachedKeytermsPromise = (async () => {
      try {
        const mockDataUrl = new URL('../public/mock/platform-data.json', import.meta.url);
        const raw = await readFile(mockDataUrl, 'utf8');
        const payload = JSON.parse(raw) as {
          providers?: Array<{ name?: string; branch?: string }>;
          vehicles?: Array<{ plateNumber?: string; make?: string; model?: string }>;
        };

        const keyterms = new Set<string>();

        payload.providers?.forEach((provider) => {
          if (provider.name) keyterms.add(provider.name);
          if (provider.branch) keyterms.add(provider.branch);
        });

        payload.vehicles?.forEach((vehicle) => {
          if (vehicle.plateNumber) keyterms.add(vehicle.plateNumber);
          if (vehicle.make && vehicle.model) {
            keyterms.add(`${vehicle.make} ${vehicle.model}`);
          }
        });

        return [...keyterms].filter((term) => term.length <= 50).slice(0, 100);
      } catch {
        return [];
      }
    })();
  }

  return cachedKeytermsPromise;
}

async function readRequestBody(req: IncomingMessage, maxBytes: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let totalBytes = 0;
    let finished = false;

    const rejectOnce = (error: Error) => {
      if (finished) return;
      finished = true;
      reject(error);
    };

    req.on('data', (chunk: Buffer | string) => {
      if (finished) return;

      const bufferChunk = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      totalBytes += bufferChunk.length;

      if (totalBytes > maxBytes) {
        rejectOnce(new Error('Recorded audio is too large. Please keep voice searches brief.'));
        return;
      }

      chunks.push(bufferChunk);
    });

    req.on('end', () => {
      if (finished) return;
      finished = true;
      resolve(Buffer.concat(chunks));
    });

    req.on('error', (error) => {
      rejectOnce(error instanceof Error ? error : new Error('Unable to read the uploaded audio.'));
    });
  });
}

function createTranscriptionFormData({
  audioBuffer,
  keyterms,
  mimeType,
}: {
  audioBuffer: Buffer;
  keyterms?: string[];
  mimeType: string;
}) {
  const formData = new FormData();

  formData.set('model_id', ELEVENLABS_TRANSCRIPTION_MODEL);
  formData.set('tag_audio_events', 'false');
  formData.set('file', new Blob([audioBuffer], { type: mimeType }), getAudioFilename(mimeType));

  keyterms?.forEach((keyterm) => {
    formData.append('keyterms', keyterm);
  });

  return formData;
}

async function requestTranscription({
  apiKey,
  audioBuffer,
  keyterms,
  mimeType,
}: {
  apiKey: string;
  audioBuffer: Buffer;
  keyterms?: string[];
  mimeType: string;
}) {
  const response = await fetch(ELEVENLABS_TRANSCRIPTION_URL, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
    },
    body: createTranscriptionFormData({ audioBuffer, keyterms, mimeType }),
  });

  return {
    rawResponse: await response.text(),
    response,
  };
}

async function transcribeAudio({
  apiKey,
  audioBuffer,
  mimeType,
}: {
  apiKey: string;
  audioBuffer: Buffer;
  mimeType: string;
}) {
  const keyterms = await loadVoiceSearchKeyterms();
  let { rawResponse, response } = await requestTranscription({ apiKey, audioBuffer, keyterms, mimeType });

  if (!response.ok && keyterms.length > 0 && (response.status === 400 || response.status === 422)) {
    ({ rawResponse, response } = await requestTranscription({ apiKey, audioBuffer, mimeType }));
  }

  if (!response.ok) {
    const errorPayload = parseJsonSafely<{ detail?: { message?: string } | string; error?: string }>(rawResponse);
    const message = normalizeTranscriptionErrorMessage(
      typeof errorPayload?.detail === 'string'
        ? errorPayload.detail
        : typeof errorPayload?.detail?.message === 'string'
          ? errorPayload.detail.message
          : typeof errorPayload?.error === 'string'
            ? errorPayload.error
            : `ElevenLabs transcription failed with status ${response.status}.`
    );

    throw new Error(message);
  }

  const payload = parseJsonSafely<{ language_code?: string; text?: string }>(rawResponse);

  if (!payload?.text?.trim()) {
    throw new Error('No speech was detected in the recording.');
  }

  return {
    languageCode: typeof payload.language_code === 'string' ? payload.language_code : null,
    text: payload.text.trim(),
  };
}

export function createVoiceSearchProxy(apiKey?: string) {
  return async (req: IncomingMessage, res: ServerResponse, next: NextFunction) => {
    const url = new URL(req.url ?? '/', 'http://localhost');

    if (url.pathname !== '/api/voice-search/transcribe') {
      next();
      return;
    }

    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.setHeader('Allow', 'OPTIONS, POST');
      res.end();
      return;
    }

    if (req.method !== 'POST') {
      writeJson(res, 405, { error: 'Method not allowed. Use POST for voice transcription.' });
      return;
    }

    if (!apiKey) {
      writeJson(res, 500, {
        error: 'Missing ELEVENLABS_API_KEY. Add it to your local environment before using voice search.',
      });
      return;
    }

    try {
      const audioBuffer = await readRequestBody(req, MAX_AUDIO_BYTES);

      if (audioBuffer.byteLength === 0) {
        writeJson(res, 400, { error: 'Empty recording received. Please try again.' });
        return;
      }

      const mimeType = normalizeMimeType(req.headers['content-type']);
      const transcript = await transcribeAudio({ apiKey, audioBuffer, mimeType });

      writeJson(res, 200, transcript);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Voice transcription failed. Please try again.';
      const statusCode = isUserAudioError(message) ? 400 : 502;

      if (statusCode === 400) {
        console.warn('Voice search rejected a short or silent recording.');
      } else {
        console.error('Voice search transcription failed:', error);
      }

      writeJson(res, statusCode, {
        error: message,
      });
    }
  };
}
