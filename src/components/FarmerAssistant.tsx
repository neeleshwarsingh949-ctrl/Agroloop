import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { speakText } from "../utils/speech";

interface FarmerAssistantProps {
  isVoiceEnabled: boolean;
  farmerName?: string;
}

export const FarmerAssistant: React.FC<FarmerAssistantProps> = ({ isVoiceEnabled, farmerName }) => {
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState<{ from: "user" | "assistant"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const replyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (replyTimer.current) clearTimeout(replyTimer.current);
  }, []);

  const send = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages((m) => [...m, { from: "user", text: userMsg }]);
    setInput("");

    const response = generateAssistantReply(userMsg, farmerName, t);
    setIsReplying(true);
    replyTimer.current = setTimeout(() => {
      setMessages((m) => [...m, { from: "assistant", text: response }]);
      speakText(response, i18n.language, isVoiceEnabled);
      setIsReplying(false);
    }, 700);
  };

  return (
    <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-emerald-300 mb-2">{t("assistantTitle")}</h3>
      <div className="h-40 overflow-y-auto bg-slate-800 p-3 rounded-md space-y-2 text-xs text-slate-300 mb-3">
        {messages.length === 0 ? (
          <div className="text-slate-500">{t("assistantEmpty")}</div>
        ) : (
          messages.map((m, idx) => (
            <div key={idx} className={`p-2 rounded ${m.from === 'user' ? 'bg-slate-700 text-white text-right' : 'bg-slate-800 text-slate-300 text-left'}`}>
              {m.text}
            </div>
          ))
        )}
        {isReplying && <div className="p-2 rounded bg-slate-800 text-emerald-300 text-left">{t("assistantThinking")}</div>}
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
          placeholder={t("assistantPlaceholder")}
          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
        />
        <button onClick={send} disabled={isReplying || !input.trim()} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-lg text-sm disabled:opacity-50">{t("assistantSend")}</button>
      </div>
    </div>
  );
};

function generateAssistantReply(userMsg: string, farmerName: string | undefined, t: (key: string, options?: Record<string, unknown>) => string) {
  const lower = userMsg.toLowerCase();
  if (lower.includes('briq') || lower.includes('brik') || lower.includes('brique') || lower.includes('ब्रिकेट') || lower.includes('ब्रिक्वेट') || lower.includes('பிரிகெட்')) {
    return t("assistantBriquetteReply");
  }
  if (lower.includes('gamla') || lower.includes('gamala') || lower.includes('planter') || lower.includes('flower pot') || lower.includes('गमला') || lower.includes('गमले') || lower.includes('பானை')) {
    return t("assistantPlanterReply");
  }
  if (lower.includes('product') || lower.includes('make') || lower.includes('convert') || lower.includes('उत्पाद') || lower.includes('बनावे') || lower.includes('பொருள்') || lower.includes('தயார') || lower.includes('उत्पाद')) {
    return t("assistantProductReply");
  }
  if (lower.includes('price') || lower.includes('sell') || lower.includes('दाम') || lower.includes('बेच') || lower.includes('விலை') || lower.includes('விற்க') || lower.includes('भाव')) {
    return t("assistantPriceReply");
  }
  if (lower.includes('how') || lower.includes('help') || lower.includes('कैसे') || lower.includes('मदद') || lower.includes('எப்படி') || lower.includes('உதவி') || lower.includes('काise') || lower.includes('कइसे')) {
    return t("assistantHelpReply", { name: farmerName || t("farmer") });
  }
  return t("assistantDefaultReply");
}

export default FarmerAssistant;
