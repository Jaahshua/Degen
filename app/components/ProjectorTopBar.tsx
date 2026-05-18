'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { LineChart, Flame, Rocket, Bell, Send } from 'lucide-react';
import type { View } from '../page';

const TABS: { id: View; label: string; icon: any }[] = [
  { id: 'markets',   label: 'MARKETS',   icon: LineChart },
  { id: 'drops',     label: 'DROPS',     icon: Flame     },
  { id: 'launchpad', label: 'LAUNCHPAD', icon: Rocket    },
];

export default function ProjectorTopBar({
  view, onView,
}: {
  view: View;
  onView: (v: View) => void;
}) {
  return (
    <header className="projector-bar sticky top-0 z-50 h-14 md:h-[60px]">
      <div className="projector-beam" aria-hidden />
      <div className="projector-spot" aria-hidden />
      <div className="projector-grain" aria-hidden />
      <div className="projector-dust" aria-hidden>
        {Array.from({ length: 12 }).map((_, i) => (
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

      <div className="relative z-10 h-full flex items-center gap-3 px-4 md:px-6 max-w-3xl mx-auto md:max-w-none">
        {/* Logo */}
        <a href="#" className="font-display font-black text-xl md:text-2xl tracking-mega shrink-0 select-none shadow-glow-pink">
          <span className="text-sunset">DEGEN</span><span className="text-white/95">SEA</span>
        </a>

        <div className="flex-1" />

        {/* Desktop tabs */}
        <nav className="hidden md:flex items-center gap-1 mr-2">
          {TABS.map(t => {
            const active = t.id === view;
            return (
              <button
                key={t.id}
                onClick={() => onView(t.id)}
                className={`projector-item ${active ? 'active' : ''} flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-display font-bold tracking-[0.14em] uppercase`}
              >
                <t.icon size={13} />
                {t.label}
              </button>
            );
          })}
        </nav>

        {/* Right-side icons */}
        <button className="projector-item p-1.5 rounded-lg" aria-label="Activity">
          <Send size={17} />
        </button>
        <button className="projector-item p-1.5 rounded-lg" aria-label="Notifications">
          <Bell size={17} />
        </button>

        {/* Wallet — desktop only (mobile uses the deposit bar at the bottom) */}
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
