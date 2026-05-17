'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { LineChart, Flame, Rocket, Search, X, Bell } from 'lucide-react';
import type { View } from '../page';

const TABS: { id: View; label: string; icon: any }[] = [
  { id: 'markets',   label: 'MARKETS',   icon: LineChart },
  { id: 'drops',     label: 'DROPS',     icon: Flame     },
  { id: 'launchpad', label: 'LAUNCHPAD', icon: Rocket    },
];

export default function ProjectorTopBar({
  view, onView, search, onSearch,
}: {
  view: View;
  onView: (v: View) => void;
  search: string;
  onSearch: (s: string) => void;
}) {
  return (
    <header className="projector-bar sticky top-0 z-50 h-14 md:h-16">
      <div className="projector-beam" aria-hidden />
      <div className="projector-spot" aria-hidden />
      <div className="projector-grain" aria-hidden />

      <div className="relative z-10 h-full flex items-center gap-3 md:gap-4 px-4 md:px-5">
        {/* LEFT — logo */}
        <a href="#" className="font-display font-bold text-lg md:text-xl tracking-tight shrink-0 select-none">
          <span className="text-sunset">DEGEN</span><span className="text-white/95">SEA</span>
        </a>

        {/* SEARCH (desktop only — mobile uses the bottom-nav search tab) */}
        <div className="hidden md:block relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" size={14} />
          <input
            value={search}
            onChange={e => onSearch(e.target.value)}
            placeholder="Search collections, drops, tokens…"
            className="w-full bg-white/3 border border-white/8 hover:border-white/15 focus:border-pink-400/40 transition pl-9 pr-8 py-2 rounded-lg outline-none text-xs font-mono placeholder:text-white/25"
          />
          {search && (
            <button onClick={() => onSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/35 hover:text-white" aria-label="Clear">
              <X size={13} />
            </button>
          )}
        </div>

        <div className="flex-1" />

        {/* NAV (desktop only) */}
        <nav className="hidden md:flex items-center gap-1">
          {TABS.map(t => {
            const active = t.id === view;
            return (
              <button
                key={t.id}
                onClick={() => onView(t.id)}
                className={`projector-item ${active ? 'active' : ''} flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-display font-semibold tracking-[0.12em] uppercase`}
              >
                <t.icon size={14} />
                {t.label}
              </button>
            );
          })}
        </nav>

        {/* Mobile right icons */}
        <button
          className="md:hidden projector-item p-2 rounded-lg"
          aria-label="Notifications"
        >
          <Bell size={18} />
        </button>

        {/* WALLET — projector hot-spot */}
        <div className="relative z-10 shrink-0 ml-1 hidden md:block">
          <ConnectButton
            showBalance={false}
            chainStatus="icon"
            accountStatus={{ smallScreen: 'avatar', largeScreen: 'address' }}
          />
        </div>
      </div>
    </header>
  );
}
