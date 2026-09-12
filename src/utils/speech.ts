const languageCodes: Record<string, string> = {
  en: 'en-US',
  hi: 'hi-IN',
  ta: 'ta-IN',
  bho: 'hi-IN'
};

declare global {
  interface Window {
    AgroLoopSpeech?: {
      speak: (text: string, language: string) => void;
      stop: () => void;
    };
  }
}

const speakWithAvailableVoice = (text: string, lang: string) => {
  const utterance = new SpeechSynthesisUtterance(text);
  const targetLanguage = languageCodes[lang] || languageCodes.en;
  utterance.lang = targetLanguage;
  utterance.rate = 0.9;
  utterance.pitch = 1.0;

  const voices = window.speechSynthesis.getVoices();
  const voice = voices.find((candidate) => candidate.lang.toLowerCase() === targetLanguage.toLowerCase())
    || voices.find((candidate) => candidate.lang.toLowerCase().startsWith(targetLanguage.slice(0, 2).toLowerCase()));
  if (voice) utterance.voice = voice;

  window.speechSynthesis.speak(utterance);
};

export const speakText = (text: string, lang: string = 'en', isEnabled: boolean = true) => {
  if (!isEnabled) return;
  if (!text.trim()) return;

  if (window.AgroLoopSpeech) {
    window.AgroLoopSpeech.speak(text, lang);
    return;
  }
  if (!('speechSynthesis' in window)) return;

  window.speechSynthesis.cancel();
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    speakWithAvailableVoice(text, lang);
    return;
  }

  // Chrome and Android load installed voices asynchronously.
  const handleVoicesChanged = () => {
    window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
    speakWithAvailableVoice(text, lang);
  };
  window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged, { once: true });
};