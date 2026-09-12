import React, { useState } from 'react';
import { UserRole } from '../types';
import { UserCheck, Truck, Factory, LogIn } from 'lucide-react';
import { auth } from '../firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

interface AuthModalProps {
  isOpen: boolean;
  onLogin: (role: UserRole, name: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onLogin }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('farmer');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState<'enter' | 'verify'>('enter');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [code, setCode] = useState('');

  if (!isOpen) return null;

  const setupRecaptcha = () => {
    try {
      // Create invisible reCAPTCHA
      // If a verifier already exists, clear it by reassigning
      // @ts-ignore
      if ((window as any).recaptchaVerifier) {
        try { (window as any).recaptchaVerifier.clear(); } catch {}
      }
      // @ts-ignore
      (window as any).recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', { size: 'invisible' }, auth);
      return (window as any).recaptchaVerifier;
    } catch (err) {
      console.error('Recaptcha setup error', err);
      return null;
    }
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!phone || phone.trim().length < 6) return;
    const verifier = setupRecaptcha();
    try {
      const confirmation = await signInWithPhoneNumber(auth, phone, verifier);
      setConfirmationResult(confirmation);
      setStep('verify');
    } catch (err) {
      console.error('SMS not sent', err);
      alert('Failed to send OTP. Please check the phone number.');
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) return;
    try {
      const result = await confirmationResult.confirm(code);
      // Signed in
      onLogin(selectedRole, name || result.user.phoneNumber || 'User');
    } catch (err) {
      console.error('OTP verify error', err);
      alert('Invalid code, please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center gap-2 mb-4">
          <LogIn className="w-6 h-6 text-emerald-400" />
          <h2 className="text-xl font-bold text-white">Login to AgroLoop</h2>
        </div>

        <form className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Your Name / Name of Enterprise</label>
            <input
              type="text"
              required
              placeholder="e.g. Ramesh Kumar / Green Bio Power"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-2">Select Your Role</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedRole('farmer')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs transition ${
                  selectedRole === 'farmer'
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400 font-bold'
                    : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                <UserCheck className="w-5 h-5" />
                Farmer
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('transporter')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs transition ${
                  selectedRole === 'transporter'
                    ? 'bg-amber-600/20 border-amber-500 text-amber-400 font-bold'
                    : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                <Truck className="w-5 h-5" />
                Transporter
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('recycler')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs transition ${
                  selectedRole === 'recycler'
                    ? 'bg-cyan-600/20 border-cyan-500 text-cyan-400 font-bold'
                    : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                <Factory className="w-5 h-5" />
                Recycler
              </button>
            </div>
          </div>
          {/* Phone number / OTP flow */}
          {step === 'enter' && (
            <div>
              <label className="block text-xs text-slate-400 mb-1">Phone number (with country code)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +919876543210"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
              <div id="recaptcha-container" />
              <button
                onClick={handleSendOtp}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl transition shadow-lg text-sm mt-4"
              >
                Send OTP
              </button>
            </div>
          )}

          {step === 'verify' && (
            <div>
              <label className="block text-xs text-slate-400 mb-1">Enter OTP</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={handleVerify}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl transition shadow-lg text-sm mt-4"
              >
                Verify OTP
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
