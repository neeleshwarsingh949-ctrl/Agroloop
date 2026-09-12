import React from "react";
import { useTranslation } from "react-i18next";
import { MapPin, User, CheckCircle, ArrowUpRight } from "lucide-react";
import { StubbleListing, UserRole } from "../types";
import { speakText } from "../utils/speech";
import { normalizePhone } from "../utils/phone";
import { db, auth } from "../firebase";
import { ref, update } from "firebase/database";

interface ListingCardProps {
  item: StubbleListing;
  onSelectBooking: (item: StubbleListing) => void;
  isVoiceEnabled: boolean;
  currentUserRole?: UserRole;
  currentUserPhone?: string;
}

export const ListingCard: React.FC<ListingCardProps> = ({ item, onSelectBooking, isVoiceEnabled, currentUserRole, currentUserPhone }) => {
  const { t, i18n } = useTranslation();

  const handleBook = () => {
    speakText(
      `${t(item.cropType)} ${t("bookBatch")}`,
      i18n.language,
      isVoiceEnabled
    );
    onSelectBooking(item);
  };

  const getCropBadgeColor = (crop: string) => {
    switch (crop) {
      case "mustard":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40";
      case "paddy":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      case "wheat":
        return "bg-orange-500/20 text-orange-300 border-orange-500/40";
      default:
        return "bg-slate-700 text-slate-300";
    }
  };

  const batchValue = item.wasteKg * item.pricePerKg;

  const showOwnerDetails = (() => {
    if (currentUserRole === "farmer") {
      const currentNorm = normalizePhone(currentUserPhone);
      const itemNorm = item.phoneNormalized || normalizePhone(item.phone);
      return currentNorm && itemNorm && currentNorm === itemNorm;
    }
    return false;
  })();

  return (
    <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-5 shadow-lg hover:border-emerald-500/60 transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${getCropBadgeColor(item.cropType)}`}>
            {t(item.cropType)}
          </span>
          {item.status === "CONFIRMED" ? (
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded">
              <CheckCircle className="w-3.5 h-3.5" />
              {t("confirmed")}
            </span>
          ) : (
            <span className="text-xs text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded">
              {t("available")}
            </span>
          )}
        </div>

        <div className="space-y-2 mb-4">
          {showOwnerDetails ? (
            <div className="flex items-center gap-2 text-slate-200 font-semibold text-base">
              <User className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{item.farmerName}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-200 font-semibold text-base">
              <User className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Farmer details hidden</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
            <span>{item.location}</span>
          </div>

          {item.isMadeProduct && (
            <div className="mt-2 text-xs text-emerald-300">
              <strong className="text-slate-200">Made Product:</strong> {item.productName}
            </div>
          )}
        </div>

        <div className="bg-slate-900/60 rounded-lg p-3 grid grid-cols-2 gap-2 text-xs mb-4 border border-slate-700/40">
          <div>
            <span className="text-slate-400 block">{t("quantity")}</span>
            <span className="text-slate-100 font-bold text-sm">{item.wasteKg.toLocaleString()} kg</span>
          </div>
          <div>
            <span className="text-slate-400 block">{t("price")}</span>
            <span className="text-emerald-400 font-bold text-sm">₹{item.pricePerKg}/kg</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-300 font-medium mb-4 px-1">
          <span>{t("totalPrice")}:</span>
          <span className="text-amber-400 font-bold text-sm">₹{batchValue.toLocaleString()}</span>
        </div>

        {showOwnerDetails && (
          <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 mb-4 text-xs">
            <span className="text-slate-400">{t("listingStatus")}</span>
            <span className={`font-bold ${item.status === "AVAILABLE" ? "text-amber-300" : item.status === "CONFIRMED" ? "text-emerald-300" : "text-cyan-300"}`}>
              {t(`status${item.status.charAt(0)}${item.status.slice(1).toLowerCase()}`)}
            </span>
          </div>
        )}
      </div>

      {currentUserRole === "transporter" && (item.status === "AVAILABLE" || item.status === "CONFIRMED" || item.status === "CLAIMED") ? (
        <ClaimButton item={item} currentUserPhone={currentUserPhone} />
      ) : item.status === "AVAILABLE" ? (
        <button
          onClick={handleBook}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-md text-sm"
        >
          <span>{t("bookBatch")}</span>
          <ArrowUpRight className="w-4 h-4" />
        </button>
      ) : (
        <button
          disabled
          className="w-full bg-slate-700/50 text-slate-400 font-medium py-2.5 px-4 rounded-lg cursor-not-allowed text-xs text-center border border-slate-600/40"
        >
          {t("confirmed")} (UTR: {item.utrNumber || "Verified"})
        </button>
      )}
    </div>
  );
};

interface ClaimButtonProps {
  item: StubbleListing;
  currentUserPhone?: string;
}

const ClaimButton: React.FC<ClaimButtonProps> = ({ item, currentUserPhone }) => {
  const [isClaiming, setIsClaiming] = React.useState(false);
  const { t } = useTranslation();

  const handleClaim = async () => {
    if (!item.id) return;
    setIsClaiming(true);
    try {
      const updateRef = ref(db, `listings/${item.id}`);
      if (item.status !== "CLAIMED") {
        await update(updateRef, {
          status: "CLAIMED",
          claimedByPhone: currentUserPhone || null,
          claimedByUid: auth.currentUser?.uid || null,
          claimedAt: Date.now()
        });
      }
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location)}`, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error('Claim failed', err);
      alert('Failed to accept order. Please try again.');
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <button
      onClick={handleClaim}
      disabled={isClaiming}
      className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-md text-sm"
    >
      {isClaiming ? t("accepting") : item.status === "CLAIMED" ? t("openMaps") : t("acceptOrder")}
    </button>
  );
};