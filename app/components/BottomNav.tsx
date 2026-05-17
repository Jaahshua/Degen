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
        className="grid grid-cols-5 bg-black/95 backdrop-blur border-t border-white/8 pt-1.5"
        style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}
      >
        <Tab icon={<LineChart size={20}/>} label="Markets"  active={view === 'markets'}   onClick={() => onView('markets')}   />
        <Tab icon={<Flame     size={20}/>} label="Drops"    active={view === 'drops'}     onClick={() => onView('drops')}     />
        <CenterTab active={view === 'launchpad'}                              onClick={() => onView('launchpad')} />
        <Tab icon={<Search    size={20}/>} label="Search"                                 onClick={onSearch}                  />
        <Tab icon={<User      size={20}/>} label="Account"  onClick={() => { /* opens wallet via deposit bar */ }} />
      </nav>
    </div>
  );
}

function Tab({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 py-1.5 ${active ? 'text-white' : 'text-white/55 hover:text-white/85'}`}
    >
      <span className={active ? 'text-sunset' : ''}>{icon}</span>
      <span className={`text-[10px] tracking-wider uppercase font-display ${active ? 'text-sunset' : ''}`}>{label}</span>
    </button>
  );
}

function CenterTab({ active, onClick }: { active?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center justify-end -mt-5">
      <div className={`relative w-12 h-12 rounded-full bg-sunset flex items-center justify-center shadow-[0_8px_24px_-6px_rgba(255,122,155,0.7)] ${active ? 'ring-2 ring-white/30' : ''}`}>
        <Rocket size={20} className="text-white" />
        <div className="absolute inset-0 rounded-full pointer-events-none" style={{
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35)',
        }} />
      </div>
      <span className={`text-[10px] tracking-wider uppercase font-display mt-0.5 ${active ? 'text-sunset' : 'text-white/55'}`}>Launch</span>
    </button>
  );
}

function DepositBar() {
  return (
    <div className="bg-[#05030a]/95 backdrop-blur border-t border-white/8 px-3 py-2 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/8 text-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-up" />
        <span className="font-mono">$0.00</span>
      </div>
      <ConnectButton.Custom>
        {({ account, openConnectModal, openAccountModal, mounted }) => {
          const ready = mounted;
          if (!ready) return <div className="w-24 h-9 rounded-full bg-white/5" />;
          if (!account) {
            return (
              <button
                onClick={openConnectModal}
                className="btn-sunset rounded-full px-4 py-1.5 text-sm font-display font-bold tracking-wider"
              >
                $ Deposit
              </button>
            );
          }
          return (
            <button
              onClick={openAccountModal}
              className="rounded-full px-4 py-1.5 text-sm font-mono bg-white/8 border border-white/12"
            >
              {account.displayName}
            </button>
          );
        }}
      </ConnectButton.Custom>
    </div>
  );
}
