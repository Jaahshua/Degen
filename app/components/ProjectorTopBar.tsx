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
    <header className="projector-bar sticky top-0 z-50 h-14 md:h-[68px]">
      <div className="projector-beam" aria-hidden />
      <div className="projector-spot" aria-hidden />
      <div className="projector-grain" aria-hidden />
      <div className="projector-dust" aria-hidden>
        {Array.from({ length: 14 }).map((_, i) => (
          <span
            key={i}
            style={{
              top: `${((i * 41) + 17) % 90 + 5}%`,
              right: `${((i * 67) + 7) % 60 + 3}%`,
              animationDelay: `${(i * 0.32) % 5}s`,
              animationDuration: `${7 + (i % 4) * 1.6}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 h-full flex items-center gap-3 md:gap-4 px-4 md:px-6">
        {/* Logo */}
        <a href="#" className="font-display font-black text-xl md:text-2xl tracking-mega shrink-0 select-none shadow-glow-pink">
          <span className="text-sunset">DEGEN</span><span className="text-white/95">SEA</span>
        </a>

        {/* Search — desktop */}
        <div className="hidden md:block relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" size={14} />
          <input
            value={search}
            onChange={e => onSearch(e.target.value)}
            placeholder="Search tickers, drops, tokens…"
            className="w-full bg-white/4 border border-white/8 hover:border-white/15 focus:border-pink-400/50 transition pl-9 pr-8 py-2 rounded-xl outline-none text-xs font-mono placeholder:text-white/25"
          />
          {search && (
            <button onClick={() => onSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/35 hover:text-white" aria-label="Clear">
              <X size={13} />
            </button>
          )}
        </div>

        <div className="flex-1" />

        {/* Tabs — desktop */}
        <nav className="hidden md:flex items-center gap-1">
          {TABS.map(t => {
            const active = t.id === view;
            return (
              <button
                key={t.id}
                onClick={() => onView(t.id)}
                className={`projector-item ${active ? 'active' : ''} flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-display font-bold tracking-[0.14em] uppercase`}
              >
                <t.icon size={14} />
                {t.label}
              </button>
            );
          })}
        </nav>

        {/* Mobile right-side bell */}
        <button className="md:hidden projector-item p-2 rounded-lg" aria-label="Notifications">
          <Bell size={18} />
        </button>

        {/* Wallet — desktop */}
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
