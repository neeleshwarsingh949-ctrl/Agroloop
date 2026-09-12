import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ref, onValue } from "firebase/database";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { db, auth } from "./firebase";
import { StubbleListing } from "./types";
import { normalizePhone } from "./utils/phone";
import { AuthScreen, UserSession } from "./components/AuthScreen";
import { Header } from "./components/Header";
import { VoicePalette } from "./components/VoicePallete";
import { ImpactDashboard } from "./components/ImpactDashboard";
import { ListingCard } from "./components/ListingCard";
import FarmerAssistant from "./components/FarmerAssistant";
import { AddListingModal } from "./components/AddListingModal";
import { PaymentModal } from "./components/PaymentModal";
import { Filter, Plus, UserCheck, Truck, Factory } from "lucide-react";
import { speakText } from "./utils/speech";

export const App: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  
  const [listings, setListings] = useState<StubbleListing[]>([]);
  const [selectedCropFilter, setSelectedCropFilter] = useState<string>("all");
  const [showMyOnly, setShowMyOnly] = useState(true);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [bookingItem, setBookingItem] = useState<StubbleListing | null>(null);
  const previousAvailableCount = useRef(0);

  // Restore session on load
  useEffect(() => {
    const savedUser = localStorage.getItem("agroloop_user");
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser) as UserSession;
        setCurrentUser({ ...user, phone: normalizePhone(user.phone) });
      } catch (e) {
        localStorage.removeItem("agroloop_user");
      }
    }
  }, []);

  useEffect(() => {
    if (currentUser?.role !== "transporter") return;

    const availableCount = listings.filter((item) => item.status === "AVAILABLE").length;
    if (availableCount > previousAvailableCount.current) {
      speakText(t("newOrderAvailable"), i18n.language, isVoiceEnabled);
    }
    previousAvailableCount.current = availableCount;
  }, [currentUser?.role, i18n.language, isVoiceEnabled, listings, t]);

  // Firebase Realtime Listener
  useEffect(() => {
    const stubbleRef = ref(db, "listings");
    let unsubscribeListings: (() => void) | undefined;
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      unsubscribeListings?.();
      if (!firebaseUser) {
        setListings([]);
        return;
      }
      unsubscribeListings = onValue(stubbleRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const loadedListings: StubbleListing[] = Object.keys(data).map((key) => ({
            id: key,
            ...data[key]
          }));
          setListings(loadedListings.sort((a, b) => b.createdAt - a.createdAt));
        } else {
          setListings([]);
        }
      });
    });

    return () => {
      unsubscribeListings?.();
      unsubscribeAuth();
    };
  }, []);

  const handleLoginSuccess = (user: UserSession) => {
    const normalizedUser = { ...user, phone: normalizePhone(user.phone) };
    setCurrentUser(normalizedUser);
    localStorage.setItem("agroloop_user", JSON.stringify(normalizedUser));
  };

  const handleLogout = () => {
    void signOut(auth);
    setCurrentUser(null);
    localStorage.removeItem("agroloop_user");
  };

  if (!currentUser) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} isVoiceEnabled={isVoiceEnabled} />;
  }

  // Apply crop filter first
  const cropFiltered = listings.filter((item) => {
    if (selectedCropFilter === "all") return true;
    return item.cropType === selectedCropFilter;
  });

  // Role-based filtering
  let filteredListings = cropFiltered;
  if (currentUser.role === "farmer") {
    const myNorm = normalizePhone(currentUser.phone);
    if (showMyOnly) {
      filteredListings = cropFiltered.filter((item) => {
        const itemNorm = normalizePhone(item.phoneNormalized || item.phone);
        return myNorm && itemNorm && myNorm === itemNorm;
      });
    } else {
      filteredListings = cropFiltered;
    }
  } else if (currentUser.role === "transporter") {
    // Show open orders and keep the transporter's accepted orders visible.
    filteredListings = cropFiltered.filter((item) =>
      item.status === "AVAILABLE" ||
      item.status === "CONFIRMED" ||
      (item.status === "CLAIMED" && item.claimedByPhone === currentUser.phone)
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased">
      <Header
        isVoiceEnabled={isVoiceEnabled}
        user={currentUser}
        onLogout={handleLogout}
      />
      <VoicePalette isVoiceEnabled={isVoiceEnabled} setIsVoiceEnabled={setIsVoiceEnabled} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <ImpactDashboard listings={listings} currentUserRole={currentUser.role} currentUserPhone={currentUser.phone} />

        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Filter className="w-5 h-5 text-emerald-400 shrink-0" />
            <select
              value={selectedCropFilter}
              onChange={(e) => setSelectedCropFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 w-full sm:w-auto font-medium"
            >
              <option value="all">{t("allCrops")}</option>
              <option value="mustard">{t("mustard")}</option>
              <option value="paddy">{t("paddy")}</option>
              <option value="wheat">{t("wheat")}</option>
            </select>
          </div>

          {currentUser.role === "farmer" && (
            <>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-lg transition-all text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>{t("addListing")}</span>
              </button>

              <label className="flex items-center gap-2 ml-3 text-sm">
                <input
                  type="checkbox"
                  checked={showMyOnly}
                  onChange={(e) => setShowMyOnly(e.target.checked)}
                  className="accent-emerald-500"
                />
                <span className="text-xs text-slate-300">My Listings Only</span>
              </label>
            </>
          )}
        </div>

        {currentUser.role === "transporter" && filteredListings.some((item) => item.status === "AVAILABLE") && (
          <div className="mb-6 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-200">
            {t("newOrderAvailable")} ({filteredListings.filter((item) => item.status === "AVAILABLE").length})
          </div>
        )}

        {currentUser.role === "farmer" && (
          <div className="mb-6">
            <FarmerAssistant isVoiceEnabled={isVoiceEnabled} farmerName={currentUser.name} />
          </div>
        )}

        {/* Section Header tailored to logged-in user role */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
            {currentUser.role === "farmer" && <UserCheck className="w-5 h-5 text-emerald-400" />}
            {currentUser.role === "transporter" && <Truck className="w-5 h-5 text-amber-400" />}
            {currentUser.role === "recycler" && <Factory className="w-5 h-5 text-cyan-400" />}
            
            {currentUser.role === "farmer" && `Farmer Portal - ${t("availableListings")} (${filteredListings.length})`}
            {currentUser.role === "transporter" && `${t("transporterOverview")} (${filteredListings.length})`}
            {currentUser.role === "recycler" && `Recycler Marketplace (${filteredListings.length})`}
          </h2>
        </div>

        {/* Listings Feed */}
        {filteredListings.length === 0 ? (
          <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-12 text-center text-slate-400">
            <p className="text-base font-medium">No stubble listings found for this crop filter.</p>
            {currentUser.role === "farmer" && (
              <p className="text-xs text-slate-500 mt-1">Click "+ List Crop Waste" above to record a new batch.</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((item) => (
              <ListingCard
                key={item.id}
                item={item}
                onSelectBooking={(listing) => setBookingItem(listing)}
                isVoiceEnabled={isVoiceEnabled}
                currentUserRole={currentUser.role}
                currentUserPhone={currentUser.phone}
              />
            ))}
          </div>
        )}
      </main>

      <footer className="bg-slate-900 border-t border-slate-800 py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© NCSC-2026 | AgroLoop - Waste to Wealth Innovation | Developed by Neeleshwar Singh</p>
          <p className="text-emerald-400/80 font-medium">Supporting Mission LiFE & Sustainable Agriculture</p>
        </div>
      </footer>

      <AddListingModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        isVoiceEnabled={isVoiceEnabled}
      />

      <PaymentModal
        item={bookingItem}
        onClose={() => setBookingItem(null)}
        isVoiceEnabled={isVoiceEnabled}
      />
    </div>
  );
};

export default App;