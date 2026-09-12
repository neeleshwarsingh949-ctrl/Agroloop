import React from "react";
import { useTranslation } from "react-i18next";
import { Scale, CloudOff, IndianRupee } from "lucide-react";
import { StubbleListing } from "../types";

interface ImpactDashboardProps {
  listings: StubbleListing[];
  currentUserRole?: string;
  currentUserPhone?: string;
}

export const ImpactDashboard: React.FC<ImpactDashboardProps> = ({ listings, currentUserRole, currentUserPhone }) => {
  const { t } = useTranslation();

  // Role-specific filtering: farmers see only their own confirmed listings for payouts
  const confirmedAll = listings.filter((item) => item.status === "CONFIRMED");
  const confirmedForFarmer = currentUserRole === "farmer" && currentUserPhone
    ? confirmedAll.filter((item) => item.phone === currentUserPhone)
    : confirmedAll;

  const totalWasteDiverted = confirmedForFarmer.reduce((sum, item) => sum + (Number(item.wasteKg) || 0), 0);
  const totalCo2Prevented = (totalWasteDiverted * 1.45).toFixed(1);
  const totalPayouts = confirmedForFarmer.reduce((sum, item) => sum + (Number(item.wasteKg) * Number(item.pricePerKg) || 0), 0);

  // Transporter-specific metric: count of confirmed orders (ready to pickup)
  const transporterConfirmedCount = confirmedAll.length;
  const transporterTotalKg = confirmedAll.reduce((sum, item) => sum + (Number(item.wasteKg) || 0), 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div className="bg-slate-800/80 border border-emerald-800/60 rounded-xl p-5 shadow-lg relative overflow-hidden backdrop-blur-sm">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Scale className="w-24 h-24 text-emerald-400" />
        </div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
            <Scale className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-300">{t("totalDiverted")}</h3>
        </div>
        <p className="text-3xl font-black text-emerald-400 mt-1">
          {totalWasteDiverted.toLocaleString()} <span className="text-lg font-normal text-slate-400">kg</span>
        </p>
      </div>

      <div className="bg-slate-800/80 border border-emerald-800/60 rounded-xl p-5 shadow-lg relative overflow-hidden backdrop-blur-sm">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <CloudOff className="w-24 h-24 text-teal-400" />
        </div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-teal-500/20 rounded-lg text-teal-400">
            <CloudOff className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-300">{t("co2Prevented")}</h3>
        </div>
        <p className="text-3xl font-black text-teal-300 mt-1">
          {Number(totalCo2Prevented).toLocaleString()} <span className="text-lg font-normal text-slate-400">kg CO₂</span>
        </p>
      </div>

      <div className="bg-slate-800/80 border border-emerald-800/60 rounded-xl p-5 shadow-lg relative overflow-hidden backdrop-blur-sm">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <IndianRupee className="w-24 h-24 text-amber-400" />
        </div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400">
            <IndianRupee className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-300">{currentUserRole === "transporter" ? t("confirmedPickups") : t("farmerPayouts")}</h3>
        </div>
        {currentUserRole === "transporter" ? (
          <p className="text-3xl font-black text-amber-400 mt-1">{transporterConfirmedCount} orders • {transporterTotalKg.toLocaleString()} kg</p>
        ) : (
          <p className="text-3xl font-black text-amber-400 mt-1">₹{totalPayouts.toLocaleString()}</p>
        )}
      </div>
    </div>
  );
};