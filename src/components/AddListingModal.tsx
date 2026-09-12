import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { ref, push } from "firebase/database";
import { db, auth } from "../firebase";
import { CropType } from "../types";
import { normalizePhone } from "../utils/phone";
import { X, PlusCircle } from "lucide-react";
import { speakText } from "../utils/speech";

interface AddListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  isVoiceEnabled: boolean;
}

export const AddListingModal: React.FC<AddListingModalProps> = ({ isOpen, onClose, isVoiceEnabled }) => {
  const { t, i18n } = useTranslation();

  const [farmerName, setFarmerName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [cropType, setCropType] = useState<CropType>("mustard");
  const [wasteKg, setWasteKg] = useState("");
  const [pricePerKg, setPricePerKg] = useState("");
  const [isMadeProduct, setIsMadeProduct] = useState(false);
  const [productName, setProductName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    if (!farmerName || !phone || !location || !wasteKg || !pricePerKg) {
      setErrorMsg("Please fill all fields.");
      return;
    }
    if (isMadeProduct && !productName.trim()) {
      setErrorMsg("Please provide product name for made product.");
      return;
    }

    setIsSubmitting(true);
    try {
      const stubbleRef = ref(db, "listings");
      const normalized = normalizePhone(phone);
      const user = auth.currentUser;
      if (!user) {
        setErrorMsg("Your session has expired. Please sign in again.");
        return;
      }
      const listing = {
        farmerName,
        phone,
        phoneNormalized: normalized,
        location,
        cropType,
        wasteKg: Number(wasteKg),
        pricePerKg: Number(pricePerKg),
        status: "AVAILABLE",
        createdAt: Date.now(),
        ownerUid: user.uid,
        ...(isMadeProduct
          ? { isMadeProduct: true, productName: productName.trim() }
          : {})
      };
      const result = await push(stubbleRef, listing);

      console.log('Listing pushed:', result.key, result);
      setSuccessMsg('Listing published successfully');
      speakText("पराली सफलतापूर्वक दर्ज की गई", i18n.language, isVoiceEnabled);
      // clear form
      setFarmerName("");
      setPhone("");
      setLocation("");
      setWasteKg("");
      setPricePerKg("");
      setIsMadeProduct(false);
      setProductName("");
      // close after short delay so user sees message
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      console.error("Error adding listing:", err);
      const msg = err?.message || String(err);
      setErrorMsg(msg.includes('permission') ? 'Permission denied: check your Realtime Database rules' : msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-700">
          <h2 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
            <PlusCircle className="w-5 h-5" />
            {t("modalAddTitle")}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        {errorMsg && (
          <div className="mt-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs p-2.5 rounded-lg">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="mt-4 bg-emerald-600/10 border border-emerald-600/30 text-emerald-300 text-xs p-2.5 rounded-lg">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">{t("farmerName")}</label>
            <input
              type="text"
              required
              value={farmerName}
              onChange={(e) => setFarmerName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              placeholder="e.g. Ramesh Kumar"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">{t("phone")}</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              placeholder="10-digit mobile number"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">{t("location")}</label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              placeholder="e.g. Karnal, Haryana"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">{t("filterCrop")}</label>
            <select
              value={cropType}
              onChange={(e) => setCropType(e.target.value as CropType)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="mustard">{t("mustard")}</option>
              <option value="paddy">{t("paddy")}</option>
              <option value="wheat">{t("wheat")}</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">{t("quantity")} (kg)</label>
              <input
                type="number"
                required
                min="1"
                value={wasteKg}
                onChange={(e) => setWasteKg(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                placeholder="5000"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">{t("price")} (₹/kg)</label>
              <input
                type="number"
                required
                step="0.1"
                min="0.1"
                value={pricePerKg}
                onChange={(e) => setPricePerKg(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                placeholder="2.5"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isMadeProduct} onChange={(e) => setIsMadeProduct(e.target.checked)} className="accent-emerald-500" />
              <span className="text-xs text-slate-300">This is a product made from agricultural waste</span>
            </label>
          </div>

          {isMadeProduct && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Product Name</label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                placeholder="e.g. Biochar bricks"
              />
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-lg transition-colors text-sm shadow-lg disabled:opacity-50"
            >
              {isSubmitting ? "Publishing..." : t("submitListing")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};