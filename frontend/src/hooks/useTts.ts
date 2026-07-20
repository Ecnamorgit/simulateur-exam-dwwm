import { useState, useRef, useCallback } from 'react';
import { ttsUrl } from '../services/api';

/**
 * Synthèse vocale : lit un texte via le endpoint backend edge-tts (voix neurale
 * française), avec repli sur l'API Web Speech du navigateur si l'audio échoue.
 */
export function useTts() {
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const speak = useCallback((text: string) => {
    if (!ttsEnabled || !text || !text.trim()) return;

    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    const audio = new Audio(ttsUrl(text));
    currentAudioRef.current = audio;

    audio.play().then(() => {
      console.log('Playing neural TTS (fr-FR-HenriNeural)...');
    }).catch((err) => {
      console.warn('Neural TTS play error:', err);
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'fr-FR';
        utterance.rate = 0.95;
        const voices = window.speechSynthesis.getVoices();
        const maleVoice = voices.find(v => v.lang.startsWith('fr') && (
          v.name.toLowerCase().includes('henri') ||
          v.name.toLowerCase().includes('paul') ||
          v.name.toLowerCase().includes('gilles') ||
          v.name.toLowerCase().includes('male') ||
          v.name.toLowerCase().includes('homme')
        )) || voices.find(v => v.lang.startsWith('fr'));
        if (maleVoice) utterance.voice = maleVoice;
        window.speechSynthesis.speak(utterance);
      }
    });
  }, [ttsEnabled]);

  return { ttsEnabled, setTtsEnabled, speak };
}
