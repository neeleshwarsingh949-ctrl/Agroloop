import React from "react";
import { useTranslation } from "react-i18next";
import { Volume2, VolumeX } from "lucide-react";
import { speakText } from "../utils/speech";

interface VoicePaletteProps {
  isVoiceEnabled: boolean;
  setIsVoiceEnabled: React.Dispatch<React.SetStateAction<boolean>>;
}

export const VoicePalette: React.FC<VoicePaletteProps> = ({ isVoiceEnabled, setIsVoiceEnabled }) => {
  const { t, i18n } = useTranslation();

  const toggleVoice = () => {
    const nextState = !isVoiceEnabled;
    setIsVoiceEnabled(nextState);
    const msg = nextState ? t("voiceEnabledMsg") : t("voiceDisabledMsg");
    speakText(msg, i18n.language, true);
  };

  return (
    <div className="bg-emerald-900/90 border-b border-emerald-700/60 text-emerald-100 py-2 px-4 shadow-inner">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-sm font-medium">
        <div className="flex items-center gap-2">
          {isVoiceEnabled ? (
            <Volume2 className="w-5 h-5 text-emerald-400 animate-pulse" />
          ) : (
            <VolumeX className="w-5 h-5 text-emerald-400/60" />
          )}
          <span>{t("voiceBannerQuestion")}</span>
        </div>

        <button
          onClick={toggleVoice}
          className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold transition-all ${
            isVoiceEnabled
              ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
              : "bg-emerald-950 text-emerald-400 border border-emerald-700"
          }`}
        >
          {isVoiceEnabled ? "ON / चालू" : "OFF / बंद"}
        </button>
      </div>
    </div>
  );
};