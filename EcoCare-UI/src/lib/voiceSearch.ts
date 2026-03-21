const VOICE_SEARCH_API_BASE = import.meta.env.VITE_VOICE_SEARCH_API_BASE_URL?.replace(/\/$/, '') ?? '';

export type VoiceSearchState = 'idle' | 'starting' | 'listening' | 'transcribing';

const preferredRecorderMimeTypes = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4;codecs=mp4a.40.2',
  'audio/mp4',
  'audio/ogg;codecs=opus',
];

interface VoiceSearchResponse {
  error?: string;
  languageCode?: string | null;
  text?: string;
}

function normalizeVoiceSearchError(message: string) {
  const normalizedMessage = message.trim();

  if (!normalizedMessage) {
    return 'Voice transcription failed. Please try again.';
  }

  if (
    normalizedMessage.toLowerCase().includes('corrupted') ||
    normalizedMessage.toLowerCase().includes('playable audio')
  ) {
    return 'Recording was too short or incomplete. Please speak a little longer before stopping.';
  }

  return normalizedMessage;
}

export function getPreferredVoiceSearchMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
    return undefined;
  }

  return preferredRecorderMimeTypes.find((mimeType) => MediaRecorder.isTypeSupported(mimeType));
}

async function parseVoiceSearchError(response: Response): Promise<string> {
  const fallbackMessage = 'Voice transcription failed. Please try again.';
  const rawResponse = await response.text();

  if (!rawResponse) return fallbackMessage;

  try {
    const payload = JSON.parse(rawResponse) as VoiceSearchResponse;
    return typeof payload.error === 'string' && payload.error.trim()
      ? normalizeVoiceSearchError(payload.error)
      : fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

export async function transcribeVoiceSearch(audioBlob: Blob): Promise<{ languageCode: string | null; text: string }> {
  let response: Response;

  try {
    response = await fetch(`${VOICE_SEARCH_API_BASE}/api/voice-search/transcribe`, {
      method: 'POST',
      headers: {
        'Content-Type': audioBlob.type || 'audio/webm',
      },
      body: audioBlob,
    });
  } catch {
    throw new Error('Voice transcription service is unavailable right now.');
  }

  if (!response.ok) {
    throw new Error(await parseVoiceSearchError(response));
  }

  const payload = (await response.json()) as VoiceSearchResponse;

  if (typeof payload.text !== 'string' || !payload.text.trim()) {
    throw new Error('No speech was detected. Please try again.');
  }

  return {
    languageCode: typeof payload.languageCode === 'string' ? payload.languageCode : null,
    text: payload.text.trim(),
  };
}
