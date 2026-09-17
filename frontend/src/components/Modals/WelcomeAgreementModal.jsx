import React, { useState, useEffect } from 'react';
import { useUIStore } from '../../store/useUIStore';
import { ShieldCheck, Check, Sparkles, PenTool, Cloud, Layers } from 'lucide-react';

export function WelcomeAgreementModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [agreed, setAgreed] = useState(true);
  const { addToast } = useUIStore();

  useEffect(() => {
    const hasAgreed = localStorage.getItem('noteflow_terms_agreed');
    if (!hasAgreed) {
      setIsOpen(true);
    }
  }, []);

  if (!isOpen) return null;

  const handleAgreeAndContinue = () => {
    localStorage.setItem('noteflow_terms_agreed', 'true');
    localStorage.setItem('noteflow_agreed_at', new Date().toISOString());
    setIsOpen(false);
    addToast('Welcome to NoteFlow! Your workspace is ready.', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-lg bg-[#1a1b1f] border border-neutral-700/80 rounded-3xl shadow-floating overflow-hidden text-neutral-100 flex flex-col animate-in zoom-in-95 duration-200">
        {/* Top Branding Banner */}
        <div className="relative p-6 pb-4 bg-gradient-to-b from-[#204272]/50 to-transparent flex flex-col items-center text-center border-b border-neutral-800">
          <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-xl mb-3 border border-white/10 bg-white/5 flex items-center justify-center">
            <img src="/logo.png" alt="NoteFlow Logo" className="w-full h-full object-cover" />
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Digital Notebook Software v1.0</span>
          </div>

          <h1 className="text-xl font-bold tracking-tight text-white">Welcome to NoteFlow</h1>
          <p className="text-xs text-neutral-400 mt-1 max-w-sm">
            Please review and accept the software agreement to initialize your workspace on this device.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-3 gap-2 px-6 py-3 bg-neutral-900/40 border-b border-neutral-800/80 text-center">
          <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white/[0.02]">
            <PenTool className="w-4 h-4 text-blue-400" />
            <span className="text-[11px] font-semibold text-neutral-200">Natural Ink</span>
            <span className="text-[9px] text-neutral-400 leading-tight">Goodnotes-smooth drawing</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white/[0.02]">
            <Cloud className="w-4 h-4 text-emerald-400" />
            <span className="text-[11px] font-semibold text-neutral-200">Cloud Sync</span>
            <span className="text-[9px] text-neutral-400 leading-tight">Live MongoDB persistence</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white/[0.02]">
            <Layers className="w-4 h-4 text-purple-400" />
            <span className="text-[11px] font-semibold text-neutral-200">Offline Store</span>
            <span className="text-[9px] text-neutral-400 leading-tight">Zero data-loss architecture</span>
          </div>
        </div>

        {/* Scrollable License Agreement Body */}
        <div className="p-5 flex-1 max-h-48 overflow-y-auto bg-neutral-950/60 rounded-xl mx-6 my-4 border border-neutral-800 text-[11px] text-neutral-300 leading-relaxed font-sans flex flex-col gap-2.5">
          <div className="font-semibold text-white text-xs flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>End-User License Agreement & Terms of Use</span>
          </div>

          <p>
            <strong>1. Software License:</strong> NoteFlow grants you a personal, non-exclusive license to use this digital note-taking software on your desktop and mobile devices.
          </p>
          <p>
            <strong>2. Data Privacy & Notes Ownership:</strong> All handwritten vectors, text notes, shapes, and uploaded documents belong 100% to you. Data is stored securely in your synchronized database and persistent offline local caches.
          </p>
          <p>
            <strong>3. System Storage & Offline Execution:</strong> NoteFlow uses local device storage to ensure uninterrupted handwriting performance even when disconnected from the network.
          </p>
          <p>
            <strong>4. Performance:</strong> By continuing, you authorize NoteFlow to initialize local database caches and hardware-accelerated 2D canvas drawing contexts on your machine.
          </p>
        </div>

        {/* Checkbox Agreement & Continue Button */}
        <div className="p-6 pt-2 border-t border-neutral-800 flex flex-col gap-3">
          <label className="flex items-center gap-2.5 cursor-pointer text-xs text-neutral-300 select-none">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
            />
            <span>I have read and agree to the License Agreement & Privacy Terms</span>
          </label>

          <button
            onClick={handleAgreeAndContinue}
            disabled={!agreed}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition-all active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Check className="w-4 h-4" />
            <span>Agree and Continue</span>
          </button>
        </div>
      </div>
    </div>
  );
}
