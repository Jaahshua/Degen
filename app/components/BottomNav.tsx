'use client';

import { LineChart, Flame, Search, Rocket, User } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import type { View } from '../page';

export default function BottomNav({
  view, onView, onSearch,
}: {
  view: View;
  onView: (v: View) => void;
  onSearch: () => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 md:hidden">
      <DepositBar />
      <nav
        className="relative grid grid-cols-5 bg-black/95 backdrop-blur border-t border-white/8 pt-2"
        style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}
      >
        <Tab icon={<LineChart size={20}/>} label="Markets" active={view === 'markets'} onClick={() => onView('markets')} />
        <Tab icon={<Flame size={20}/>} label="Drops" active={view === 'drops'} onClick={() => onView('drops')} />
        <CenterTab active={view === 'launchpad'} onClick={() => onView('launchpad')} />
        <Tab icon={<Search size={20}/>} label="Search" onClick={onSearch} />
        <Tab icon={<User size={20}/>} label="Account" onClick={() => {}} />
      </nav>
    </div>
  );
}

function Tab({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="relative flex flex-col items-center gap-0.5 py-1.5"
    >
      <span className={active ? 'text-sunset' : 'text-white/55'}>{icon}</span>
      <span className={`text-[9px] tracking-[0.18em] uppercase font-display font-bold ${active ? 'text-sunset' : 'text-white/55'}`}>
        {label}
      </span>
      {active && <span className="absolute -top-1 w-1 h-1 rounded-full bg-pink-400 shadow-[0_0_8px_rgba(255,61,138,0.85)]" />}
    </button>
  );
}

function CenterTab({ active, onClick }: { active?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center justify-end -mt-6 relative">
      <div className={`relative w-13 h-13 w-[52px] h-[52px] rounded-full bg-sunset flex items-center justify-center pulse-glow ${active ? 'ring-2 ring-white/40 ring-offset-2 ring-offset-black' : ''}`}>
        <Rocket size={22} className="text-white drop-shadow" />
      </div>
      <span className={`text-[9px] tracking-[0.18em] uppercase font-display font-bold mt-1 ${active ? 'text-sunset' : 'text-white/55'}`}>
        Launch
      </span>
    </button>
  );
}

function DepositBar() {
  return (
    <div className="bg-[#02000a]/95 backdrop-blur border-t border-white/8 px-3 py-2.5 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/8 text-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-up pulse-dot" />
        <span className="font-mono font-bold">$0.00</span>
      </div>
      <ConnectButton.Custom>
        {({ account, openConnectModal, openAccountModal, mounted }) => {
          if (!mounted) return <div className="w-24 h-9 rounded-full bg-white/5" />;
          if (!account) {
            return (
              <button onClick={openConnectModal} className="btn-sunset rounded-full px-4 py-1.5 text-sm font-display font-black tracking-wider">
                $ Deposit
              </button>
            );
          }
          return (
            <button onClick={openAccountModal} className="rounded-full px-4 py-1.5 text-sm font-mono bg-white/8 border border-white/12">
              {account.displayName}
            </button>
          );
        }}
      </ConnectButton.Custom>
    </div>
  );
}
