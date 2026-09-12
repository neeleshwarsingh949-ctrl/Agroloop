import React from "react";
import { useTranslation } from "react-i18next";
import { Recycle, Globe, Leaf, LogOut } from "lucide-react";
import { speakText } from "../utils/speech";
import { UserSession } from "./AuthScreen";

interface HeaderProps {
  isVoiceEnabled: boolean;
  user?: UserSession | null;
  onOpenAuth?: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isVoiceEnabled, user, onOpenAuth, onLogout }) => {
  const { t, i18n } = useTranslation();

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value;
    i18n.changeLanguage(newLang);
    const langNames: Record<string, string> = {
      hi: "हिंदी भाषा चुनी गई",
      en: "English language selected",
      ta: "தமிழ் மொழி தேர்ந்தெடுக்கப்பட்டது",
      bho: "भोजपुरी भाषा चुनल गइल"
    };
    speakText(langNames[newLang] || "", newLang, isVoiceEnabled);
  };

  return (
    <header className="bg-emerald-950 text-white border-b border-emerald-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="bg-emerald-600 p-2.5 rounded-xl shadow-lg">
            <Recycle className="h-7 w-7 text-white animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-wider text-emerald-400">{t("appName")}</h1>
              <span className="bg-amber-500/20 text-amber-300 text-xs font-semibold px-2 py-0.5 rounded border border-amber-500/40">
                NCSC-2026
              </span>
            </div>
            <p className="text-xs text-emerald-200/80 flex items-center gap-1">
              <Leaf className="w-3 h-3 text-emerald-400" />
              {t("tagline")}
            </p>
          </div>
        </div>

        {/* User Session Info & Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-emerald-900/60 px-3 py-1.5 rounded-xl border border-emerald-700">
            {user ? (
              <>
                <div className="text-right">
                  <div className="text-xs font-bold text-emerald-300">{user.name}</div>
                  <div className="text-[10px] text-amber-300 uppercase font-semibold">{user.role}</div>
                </div>
                <button
                  onClick={onLogout}
                  title="Logout"
                  className="p-1.5 text-slate-300 hover:text-rose-400 hover:bg-rose-500/20 rounded-lg transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={onOpenAuth}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition"
              >
                Log In / Sign Up
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 bg-emerald-900 px-3 py-1.5 rounded-lg border border-emerald-700">
            <Globe className="w-4 h-4 text-emerald-400" />
            <select
              value={i18n.language}
              onChange={handleLanguageChange}
              className="bg-transparent text-white text-sm focus:outline-none cursor-pointer font-medium"
            >
              <option value="hi" className="bg-emerald-900 text-white">हिंदी (Hindi)</option>
              <option value="en" className="bg-emerald-900 text-white">English</option>
              <option value="ta" className="bg-emerald-900 text-white">தமிழ் (Tamil)</option>
              <option value="bho" className="bg-emerald-900 text-white">भोजपुरी (Bhojpuri)</option>
            </select>
          </div>
        </div>

      </div>
    </header>
  );
};