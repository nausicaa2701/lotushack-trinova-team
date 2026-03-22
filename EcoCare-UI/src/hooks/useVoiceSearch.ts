import React from 'react';
import {
  getPreferredVoiceSearchMimeType,
  transcribeVoiceSearch,
  type VoiceSearchState,
} from '../lib/voiceSearch';

const DEFAULT_MAX_RECORDING_MS = 10_000;
const AUTO_STOP_SILENCE_MS = 1_500;
const NO_SPEECH_TIMEOUT_MS = 4_000;
const SPEECH_LEVEL_THRESHOLD = 0.08;
const MIN_RECORDING_MS = 700;
const MIN_AUDIO_BYTES = 2_048;
const TRANSIENT_MESSAGE_MS = 4_500;

type AudioContextLike = typeof AudioContext;

interface WindowWithWebkitAudioContext extends Window {
  webkitAudioContext?: AudioContextLike;
}

interface UseVoiceSearchOptions {
  maxRecordingMs?: number;
  onTranscript: (transcript: string) => void;
}

function getStartErrorMessage(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError' || error.name === 'SecurityError') {
      return 'Microphone access was blocked.';
    }
    if (error.name === 'NotFoundError') {
      return 'No microphone was found on this device.';
    }
  }

  return 'Voice search could not start.';
}

export function useVoiceSearch({
  maxRecordingMs = DEFAULT_MAX_RECORDING_MS,
  onTranscript,
}: UseVoiceSearchOptions) {
  const [message, setMessage] = React.useState<string | null>(null);
  const [state, setState] = React.useState<VoiceSearchState>('idle');
  const mountedRef = React.useRef(true);
  const ignoreNextStopRef = React.useRef(false);
  const messageTimerRef = React.useRef<number | null>(null);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const mediaStreamRef = React.useRef<MediaStream | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const stopTimerRef = React.useRef<number | null>(null);
  const audioContextRef = React.useRef<AudioContext | null>(null);
  const analyserRef = React.useRef<AnalyserNode | null>(null);
  const sourceNodeRef = React.useRef<MediaStreamAudioSourceNode | null>(null);
  const analysisFrameRef = React.useRef<number | null>(null);
  const heardSpeechRef = React.useRef(false);
  const silenceSinceRef = React.useRef<number | null>(null);
  const listeningStartedAtRef = React.useRef<number | null>(null);
  const recordingStartedAtRef = React.useRef<number | null>(null);
  const recordedBytesRef = React.useRef(0);

  const clearMessageTimer = React.useCallback(() => {
    if (messageTimerRef.current !== null) {
      window.clearTimeout(messageTimerRef.current);
      messageTimerRef.current = null;
    }
  }, []);

  const clearStopTimer = React.useCallback(() => {
    if (stopTimerRef.current !== null) {
      window.clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
  }, []);

  const clearAnalysisFrame = React.useCallback(() => {
    if (analysisFrameRef.current !== null) {
      window.cancelAnimationFrame(analysisFrameRef.current);
      analysisFrameRef.current = null;
    }
  }, []);

  const releaseAudioAnalysis = React.useCallback(() => {
    clearAnalysisFrame();
    sourceNodeRef.current?.disconnect();
    analyserRef.current?.disconnect();
    sourceNodeRef.current = null;
    analyserRef.current = null;

    if (audioContextRef.current) {
      void audioContextRef.current.close().catch(() => {
        // ignore close errors on teardown
      });
      audioContextRef.current = null;
    }

    heardSpeechRef.current = false;
    silenceSinceRef.current = null;
    listeningStartedAtRef.current = null;
  }, [clearAnalysisFrame]);

  const releaseMicrophone = React.useCallback(() => {
    releaseAudioAnalysis();
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
  }, [releaseAudioAnalysis]);

  const setPersistentMessage = React.useCallback(
    (nextMessage: string | null) => {
      clearMessageTimer();
      if (mountedRef.current) {
        setMessage(nextMessage);
      }
    },
    [clearMessageTimer]
  );

  const setTransientMessage = React.useCallback(
    (nextMessage: string) => {
      clearMessageTimer();

      if (!mountedRef.current) return;

      setMessage(nextMessage);
      messageTimerRef.current = window.setTimeout(() => {
        if (mountedRef.current) {
          setMessage((currentMessage) => (currentMessage === nextMessage ? null : currentMessage));
        }
        messageTimerRef.current = null;
      }, TRANSIENT_MESSAGE_MS);
    },
    [clearMessageTimer]
  );

  const stopVoiceSearch = React.useCallback(() => {
    clearStopTimer();

    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') return;

    recorder.stop();
  }, [clearStopTimer]);

  const startSilenceMonitor = React.useCallback(
    (stream: MediaStream) => {
      const AudioContextConstructor = window.AudioContext ?? (window as WindowWithWebkitAudioContext).webkitAudioContext;
      if (!AudioContextConstructor) {
        return;
      }

      releaseAudioAnalysis();

      const audioContext = new AudioContextConstructor();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      sourceNodeRef.current = source;
      heardSpeechRef.current = false;
      silenceSinceRef.current = null;
      listeningStartedAtRef.current = performance.now();

      const waveform = new Uint8Array(analyser.fftSize);

      const inspect = () => {
        const recorder = mediaRecorderRef.current;
        if (!mountedRef.current || !recorder || recorder.state === 'inactive') {
          clearAnalysisFrame();
          return;
        }

        analyser.getByteTimeDomainData(waveform);

        let peakAmplitude = 0;
        for (let index = 0; index < waveform.length; index += 1) {
          peakAmplitude = Math.max(peakAmplitude, Math.abs(waveform[index] - 128));
        }

        const now = performance.now();
        const normalizedPeak = peakAmplitude / 128;

        if (normalizedPeak >= SPEECH_LEVEL_THRESHOLD) {
          heardSpeechRef.current = true;
          silenceSinceRef.current = null;
        } else if (silenceSinceRef.current === null) {
          silenceSinceRef.current = now;
        }

        const silentFor = silenceSinceRef.current === null ? 0 : now - silenceSinceRef.current;
        const listeningFor = listeningStartedAtRef.current === null ? 0 : now - listeningStartedAtRef.current;

        if (
          (heardSpeechRef.current && silentFor >= AUTO_STOP_SILENCE_MS) ||
          (!heardSpeechRef.current && listeningFor >= NO_SPEECH_TIMEOUT_MS)
        ) {
          stopVoiceSearch();
          return;
        }

        analysisFrameRef.current = window.requestAnimationFrame(inspect);
      };

      analysisFrameRef.current = window.requestAnimationFrame(inspect);
    },
    [clearAnalysisFrame, releaseAudioAnalysis, stopVoiceSearch]
  );

  const finalizeRecording = React.useCallback(async () => {
    clearStopTimer();

    const recorder = mediaRecorderRef.current;
    const chunks = audioChunksRef.current;
    const recordedBytes = recordedBytesRef.current || chunks.reduce((total, chunk) => total + chunk.size, 0);
    const recordingDurationMs =
      recordingStartedAtRef.current === null ? 0 : performance.now() - recordingStartedAtRef.current;

    audioChunksRef.current = [];
    mediaRecorderRef.current = null;
    recordedBytesRef.current = 0;
    recordingStartedAtRef.current = null;
    releaseMicrophone();

    if (!chunks.length) {
      if (mountedRef.current) {
        setState('idle');
      }
      setTransientMessage('No audio was captured. Please try again.');
      return;
    }

    if (recordedBytes < MIN_AUDIO_BYTES || recordingDurationMs < MIN_RECORDING_MS) {
      if (mountedRef.current) {
        setState('idle');
      }
      setTransientMessage('Recording was too short. Speak for a moment before stopping.');
      return;
    }

    if (mountedRef.current) {
      setState('transcribing');
      setPersistentMessage('Transcribing voice search...');
    }

    try {
      const mimeType = chunks[0]?.type || recorder?.mimeType || getPreferredVoiceSearchMimeType() || 'audio/webm';
      const audioBlob = new Blob(chunks, { type: mimeType });
      const transcript = await transcribeVoiceSearch(audioBlob);

      onTranscript(transcript.text);

      if (mountedRef.current) {
        setState('idle');
        setPersistentMessage(null);
      }
    } catch (error) {
      if (mountedRef.current) {
        setState('idle');
      }

      setTransientMessage(error instanceof Error ? error.message : 'Voice transcription failed. Please try again.');
    }
  }, [clearStopTimer, onTranscript, releaseMicrophone, setPersistentMessage, setTransientMessage]);

  const startVoiceSearch = React.useCallback(async () => {
    if (
      typeof window === 'undefined' ||
      typeof navigator === 'undefined' ||
      typeof MediaRecorder === 'undefined' ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setTransientMessage('Voice search is not supported in this browser.');
      return;
    }

    try {
      if (mountedRef.current) {
        setState('starting');
        setPersistentMessage('Requesting microphone access...');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getPreferredVoiceSearchMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);

      ignoreNextStopRef.current = false;
      mediaStreamRef.current = stream;
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recordedBytesRef.current = 0;
      recordingStartedAtRef.current = performance.now();

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          recordedBytesRef.current += event.data.size;
        }
      };

      recorder.onerror = () => {
        ignoreNextStopRef.current = true;
        mediaRecorderRef.current = null;
        audioChunksRef.current = [];
        recordedBytesRef.current = 0;
        recordingStartedAtRef.current = null;
        releaseMicrophone();

        if (mountedRef.current) {
          setState('idle');
        }

        setTransientMessage('Unable to record audio. Please try again.');
      };

      recorder.onstop = () => {
        if (ignoreNextStopRef.current) {
          ignoreNextStopRef.current = false;
          return;
        }

        void finalizeRecording();
      };

      /* Timeslice helps some browsers emit audio chunks before stop(); improves reliability vs. a single blob on stop(). */
      recorder.start(250);
      startSilenceMonitor(stream);

      if (mountedRef.current) {
        setState('listening');
        setPersistentMessage('Listening... it will search after you finish speaking.');
      }

      stopTimerRef.current = window.setTimeout(() => {
        stopVoiceSearch();
      }, maxRecordingMs);
    } catch (error) {
      mediaRecorderRef.current = null;
      audioChunksRef.current = [];
      recordedBytesRef.current = 0;
      recordingStartedAtRef.current = null;
      releaseMicrophone();

      if (mountedRef.current) {
        setState('idle');
      }

      setTransientMessage(getStartErrorMessage(error));
    }
  }, [finalizeRecording, maxRecordingMs, releaseMicrophone, setPersistentMessage, setTransientMessage, startSilenceMonitor, stopVoiceSearch]);

  const toggleVoiceSearch = React.useCallback(async () => {
    if (state === 'starting' || state === 'transcribing') return;

    if (state === 'listening') {
      stopVoiceSearch();
      return;
    }

    await startVoiceSearch();
  }, [startVoiceSearch, state, stopVoiceSearch]);

  React.useEffect(() => {
    return () => {
      mountedRef.current = false;
      ignoreNextStopRef.current = true;
      clearMessageTimer();
      clearStopTimer();
      clearAnalysisFrame();

      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== 'inactive') {
        recorder.ondataavailable = null;
        recorder.onerror = null;
        recorder.onstop = null;

        try {
          recorder.stop();
        } catch {
          // no-op
        }
      }

      releaseMicrophone();
    };
  }, [clearAnalysisFrame, clearMessageTimer, clearStopTimer, releaseMicrophone]);

  const isSupported =
    typeof window === 'undefined'
      ? true
      : typeof MediaRecorder !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia);

  return {
    isSupported,
    message,
    state,
    toggleVoiceSearch,
  };
}
