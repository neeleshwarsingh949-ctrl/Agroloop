import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { ref, update } from "firebase/database";
import { db, auth } from "../firebase";
import { StubbleListing } from "../types";
import { X, ExternalLink, ShieldCheck } from "lucide-react";
import { speakText } from "../utils/speech";

interface PaymentModalProps {
  item: StubbleListing | null;
  onClose: () => void;
  isVoiceEnabled: boolean;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ item, onClose, isVoiceEnabled }) => {
  const { t, i18n } = useTranslation();
  const [utr, setUtr] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  if (!item) return null;

  const upiLink = `upi://pay?pa=patelmanju2003-1@okaxis=AgroLoop&am=1.00&cu=INR`;
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiLink)}`;

  const handleVerifyPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUtr = utr.trim();

    if (!/^\d{12}$/.test(cleanUtr)) {
      setErrorMsg(t("invalidUtr"));
      speakText(t("invalidUtr"), i18n.language, isVoiceEnabled);
      return;
    }

    setErrorMsg("");
    setIsVerifying(true);

    try {
      if (item.id) {
        const itemRef = ref(db, `listings/${item.id}`);
        await update(itemRef, {
          status: "CONFIRMED",
          utrNumber: cleanUtr,
          bookedByUid: auth.currentUser?.uid || null
        });

        speakText("बुकिंग पक्की हो गई है", i18n.language, isVoiceEnabled);
        onClose();
      }
    } catch (err) {
      console.error("Error confirming booking:", err);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-slate-100">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-700">
          <h2 className="text-base font-bold text-emerald-400 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            {t("paymentTitle")}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-300 mt-3 mb-4">{t("paymentSub")}</p>

        <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-4 flex flex-col items-center justify-center gap-3 mb-4">
          <div className="bg-white p-2 rounded-lg shadow">
            <img src={qrApiUrl} alt="AgroLoop UPI QR Code" className="w-40 h-40 object-contain" />
          </div>

          <a
            href={upiLink}
            className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-950 px-3 py-1.5 rounded-full border border-emerald-800"
          >
            <span>Open in UPI App (GPay / PhonePe / Paytm)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <form onSubmit={handleVerifyPayment} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {t("enterUtr")}
            </label>
            <input
              type="text"
              maxLength={12}
              required
              value={utr}
              onChange={(e) => setUtr(e.target.value.replace(/\D/g, ""))}
              placeholder={t("utrPlaceholder")}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-center font-mono tracking-widest text-emerald-300 focus:outline-none focus:border-emerald-500"
            />
            {errorMsg && <p className="text-rose-400 text-xs mt-1 text-center font-medium">{errorMsg}</p>}
          </div>

          <button
            type="submit"
            disabled={isVerifying}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-lg transition-colors text-sm shadow-md disabled:opacity-50"
          >
            {isVerifying ? "Verifying..." : t("verifyAndConfirm")}
          </button>
        </form>

      </div>
    </div>
  );
};