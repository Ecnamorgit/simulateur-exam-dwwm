import { useState, useEffect, useRef } from 'react';

// Type definitions for SpeechRecognition
interface SpeechRecognitionEvent extends Event {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
      isFinal: boolean;
    };
    length: number;
  };
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionHook = {
  transcript: string;
  isListening: boolean;
  hasSupport: boolean;
  startListening: () => void;
  stopListening: () => void;
  clearTranscript: () => void;
};

const useSpeechRecognition = (): SpeechRecognitionHook => {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [hasSupport, setHasSupport] = useState<boolean>(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const shouldListenRef = useRef<boolean>(false);

  useEffect(() => {
    const SpeechRecognitionConstructor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognitionConstructor) {
      const recognitionInstance = new SpeechRecognitionConstructor() as SpeechRecognition;
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'fr-FR';

      recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          finalTranscript += event.results[i][0].transcript;
        }
        setTranscript(finalTranscript);
      };

      recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech Recognition Error:', event.error);
        if (event.error === 'no-speech' || event.error === 'aborted') return;
      };

      recognitionInstance.onend = () => {
        if (shouldListenRef.current) {
          try {
            recognitionInstance.start();
            setIsListening(true);
            return;
          } catch (err) {
            console.warn('Auto-restart of speech recognition failed:', err);
          }
        }
        setIsListening(false);
      };

      recognitionRef.current = recognitionInstance;
      setHasSupport(true);
    } else {
      console.warn('Web Speech API is not supported in this browser.');
    }

    return () => {
      shouldListenRef.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startListening = () => {
    shouldListenRef.current = true;
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
      }
    }
  };

  const stopListening = () => {
    shouldListenRef.current = false;
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
        setIsListening(false);
      } catch (err) {
        console.error('Failed to stop speech recognition:', err);
      }
    }
  };

  const clearTranscript = () => {
    setTranscript('');
  };

  return { 
    transcript, 
    isListening, 
    hasSupport, 
    startListening, 
    stopListening,
    clearTranscript
  };
};

export default useSpeechRecognition;
