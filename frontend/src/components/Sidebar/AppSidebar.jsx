import React from 'react';
import { NavLink } from 'react-router-dom';
import { useUIStore } from '../../store/useUIStore';
import {
  Folder,
  Star,
  Users,
  Store,
  Trash2,
  Sparkles,
  Download,
  Laptop
} from 'lucide-react';

export function AppSidebar() {
  const { openModal } = useUIStore();
  const isDesktopApp = typeof window !== 'undefined' && (window.electronAPI || navigator.userAgent.toLowerCase().includes('electron'));

  const navItems = [
    { to: '/', label: 'Documents', icon: Folder },
    { to: '/favorites', label: 'Favorites', icon: Star },
    { to: '/shared', label: 'Shared', icon: Users },
    {
      to: '/marketplace',
      label: 'Marketplace',
      icon: Store,
      badge: '50+ Items for you'
    },
    { to: '/trash', label: 'Trash', icon: Trash2 }
  ];

  const handleDownloadApp = () => {
    window.open('https://github.com/Rohandede1825/noteflow/releases/latest', '_blank');
  };

  return (
    <aside className="w-64 h-full bg-[#1c1b1e] border-r border-white/5 flex flex-col justify-between p-4 select-none shrink-0">
      {/* 1. Header: NoteFlow Brand Logo */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2.5 px-2 pt-1">
          <img src="/icon.png" alt="NoteFlow Logo" className="w-7 h-7 rounded-lg shadow-sm" />
          <span className="font-bold text-xl tracking-tight text-white font-sans">
            NoteFlow
          </span>
        </div>

        {/* 2. Navigation Links */}
        <nav className="flex flex-col gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#1b58ca] text-white font-semibold shadow-sm'
                      : 'text-neutral-300 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span className="flex items-center gap-1 text-[10px] text-amber-300 bg-amber-400/10 px-1.5 py-0.5 rounded-full font-normal">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>{item.badge}</span>
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* 3. Bottom Section: Download Banner + Sync Status */}
      <div className="flex flex-col gap-3">
        {!isDesktopApp && (
          <div className="p-3.5 rounded-xl bg-gradient-to-br from-[#232634] to-[#1a1b24] border border-blue-500/20 text-white shadow-lg">
            <div className="flex items-center gap-2 mb-1.5">
              <Laptop className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold">NoteFlow for Windows</span>
            </div>
            <p className="text-[11px] text-neutral-400 mb-2.5 leading-tight">
              Get the standalone desktop app with zero lag and offline canvas.
            </p>
            <button
              onClick={handleDownloadApp}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-[#1b58ca] hover:bg-[#184ebd] active:scale-95 text-white text-xs font-semibold rounded-lg shadow transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .exe</span>
            </button>
          </div>
        )}

        {/* Sync Status Footer */}
        <div className="px-2 py-2 border-t border-white/5 flex items-center justify-between text-xs text-neutral-500">
          <span>NoteFlow Sync</span>
          <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Active
          </span>
        </div>
      </div>
    </aside>
  );
}
