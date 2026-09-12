import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { UserCheck, Truck, Factory, Recycle, Leaf, Globe, ArrowRight } from "lucide-react";
import { speakText } from "../utils/speech";
import { auth } from "../firebase";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";

export type UserRole = "farmer" | "transporter" | "recycler";

export interface UserSession {
  name: string;
  phone: string;
  role: UserRole;
}

interface AuthScreenProps {
  onLoginSuccess: (user: UserSession) => void;
  isVoiceEnabled: boolean;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess, isVoiceEnabled }) => {
  const { t, i18n } = useTranslation();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<UserRole>("farmer");
  const [error, setError] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const recaptchaVerifier = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => () => {
    recaptchaVerifier.current?.clear();
  }, []);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value;
    i18n.changeLanguage(newLang);
    const langNames: Record<string, string> = {
      hi: "हिंदी भाषा चुनी गई",
      en: "English language selected",
      ta: "தமிழ் மொழி தேர்ந்தெடுக்கப்பட்டது",
      bho: "भोजपुरी भाषा चुनल गइल",
      bn: "বাংলা ভাষা নির্বাচিত হয়েছে"
    };
    speakText(langNames[newLang] || "", newLang, isVoiceEnabled);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!/^\d{10}$/.test(phone)) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (isRegister && !name.trim()) {
      setError("Please enter your name.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (!confirmationResult) {
        if (!recaptchaVerifier.current) {
          recaptchaVerifier.current = new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" });
        }
        const confirmation = await signInWithPhoneNumber(auth, `+91${phone}`, recaptchaVerifier.current);
        setConfirmationResult(confirmation);
        setError("OTP sent. Enter it to continue.");
        return;
      }
      const result = await confirmationResult.confirm(verificationCode.trim());
      const userData: UserSession = {
        name: name.trim() || (role === "farmer" ? "Farmer User" : role === "transporter" ? "Transporter User" : "Recycler User"),
        phone: result.user.phoneNumber || `+91${phone}`,
        role
      };
      speakText(`Welcome ${userData.name}`, i18n.language, isVoiceEnabled);
      onLoginSuccess(userData);
    } catch (error: any) {
      recaptchaVerifier.current?.clear();
      recaptchaVerifier.current = null;
      const errorCode = error?.code || "";
      const messages: Record<string, string> = {
        "auth/operation-not-allowed": "Phone sign-in is disabled in Firebase Console. Enable Phone under Authentication > Sign-in method.",
        "auth/invalid-app-credential": "Firebase rejected the reCAPTCHA credential. Add this domain to Firebase Authentication authorized domains and use the Web app config.",
        "auth/captcha-check-failed": "reCAPTCHA failed. Check the authorized domain and browser privacy extensions, then try again.",
        "auth/internal-error": "Firebase returned CONFIGURATION_NOT_FOUND. Enable Phone Auth, add this domain to Authorized domains, and use the Web app configuration.",
        "auth/too-many-requests": "Too many attempts. Wait a while before requesting another OTP.",
        "auth/invalid-verification-code": "That OTP is invalid. Request a new code and try again."
      };
      setError(messages[errorCode] || `Authentication failed (${errorCode || "unknown error"}). Check Firebase Phone Auth configuration.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between items-center p-4">
      {/* Top Header */}
      <div className="w-full max-w-4xl flex justify-between items-center py-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-600 p-2 rounded-xl">
            <Recycle className="h-6 w-6 text-white animate-spin-slow" />
          </div>
          <span className="text-xl font-black text-emerald-400 tracking-wide">{t("appName")}</span>
        </div>

        {/* Language Picker */}
        <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700">
          <Globe className="w-4 h-4 text-emerald-400" />
          <select
            value={i18n.language}
            onChange={handleLanguageChange}
            className="bg-transparent text-white text-xs focus:outline-none cursor-pointer font-medium"
          >
            <option value="hi" className="bg-slate-900 text-white">हिंदी (Hindi)</option>
            <option value="en" className="bg-slate-900 text-white">English</option>
            <option value="ta" className="bg-slate-900 text-white">தமிழ் (Tamil)</option>
            <option value="bho" className="bg-slate-900 text-white">भोजपुरी (Bhojpuri)</option>
            <option value="bn" className="bg-slate-900 text-white">বাংলা (Bengali)</option>
          </select>
        </div>
      </div>

      {/* Login / Register Card */}
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 p-6 sm:p-8 rounded-2xl shadow-2xl my-auto">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-300 text-xs font-semibold px-3 py-1 rounded-full border border-amber-500/20 mb-3">
            <Leaf className="w-3.5 h-3.5 text-amber-400" /> NCSC-2026 | Mission LiFE
          </div>
          <h2 className="text-2xl font-bold text-white">
            {isRegister ? "Create Account" : "Welcome Back"}
          </h2>
          <p className="text-xs text-slate-400 mt-1">{t("tagline")}</p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs p-2.5 rounded-lg mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* User Role Selection */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">Select Your Role / भूमिका चुनें</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRole("farmer")}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs transition ${
                  role === "farmer"
                    ? "bg-emerald-600/20 border-emerald-500 text-emerald-400 font-bold shadow"
                    : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                }`}
              >
                <UserCheck className="w-5 h-5" />
                {t("farmer")}
              </button>

              <button
                type="button"
                onClick={() => setRole("transporter")}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs transition ${
                  role === "transporter"
                    ? "bg-amber-600/20 border-amber-500 text-amber-400 font-bold shadow"
                    : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                }`}
              >
                <Truck className="w-5 h-5" />
                Transporter
              </button>

              <button
                type="button"
                onClick={() => setRole("recycler")}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs transition ${
                  role === "recycler"
                    ? "bg-cyan-600/20 border-cyan-500 text-cyan-400 font-bold shadow"
                    : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                }`}
              >
                <Factory className="w-5 h-5" />
                Recycler
              </button>
            </div>
          </div>

          {confirmationResult && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Verification Code</label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                required
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 tracking-wide"
              />
            </div>
          )}
          <div id="recaptcha-container" />

          {/* Registration Name Field */}
          {isRegister && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Full Name / नाम</label>
              <input
                type="text"
                required
                placeholder="e.g. Ramesh Kumar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}

          {/* Phone Number Field */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Mobile Phone Number / मोबाइल नंबर</label>
            <input
              type="tel"
              required
              maxLength={10}
              placeholder="10-digit phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 tracking-wide"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 text-sm mt-2"
          >
            <span>{isSubmitting ? "Authenticating..." : confirmationResult ? "Verify & Enter Portal" : "Send OTP"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400">
          {isRegister ? "Already have an account?" : "Don't have an account?"} {" "}
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError("");
            }}
            className="text-emerald-400 font-semibold underline ml-1"
          >
            {isRegister ? "Log In" : "Register Now"}
          </button>
        </div>
      </div>

      <footer className="text-xs text-slate-500 py-4 text-center">
        © NCSC-2026 | AgroLoop - Waste to Wealth Innovation | Developed by Neeleshwar Singh
      </footer>
    </div>
  );
};
