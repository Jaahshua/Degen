'use client';

import { LineChart, Flame, Search, Rocket, User } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import type { View } from '../page';

export default function BottomNav({
  view, onView,
}: {
  view: View;
  onView: (v: View) => void;
}) {
  return (
    <div
      className="md:hidden"
      style={{
        position: 'fixed',
        left: 0, right: 0, bottom: 0,
        zIndex: 40,
      }}
    >
      {/* Deposit bar */}
      <div
        style={{
          background: 'rgba(2,0,10,0.95)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 12px', borderRadius: 999,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            fontSize: 14,
          }}
        >
          <span className="pulse-dot" style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--up)', display: 'inline-block' }} />
          <span style={{ fontFamily: 'var(--font-mono), monospace', fontWeight: 700 }}>$0.00</span>
        </div>

        <ConnectButton.Custom>
          {({ account, openConnectModal, openAccountModal, mounted }) => {
            if (!mounted) return <div style={{ width: 96, height: 32, borderRadius: 999, background: 'rgba(255,255,255,0.05)' }} />;
            if (!account) {
              return (
                <button
                  onClick={openConnectModal}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 999,
                    background: 'linear-gradient(135deg, #d63384 0%, #ff3d8a 50%, #ff7e5f 100%)',
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 900,
                    letterSpacing: '0.04em',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 8px 24px -10px rgba(255,61,138,0.7)',
                  }}
                >
                  $ Deposit
                </button>
              );
            }
            return (
              <button
                onClick={openAccountModal}
                style={{
                  padding: '6px 16px',
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#fff',
                  fontSize: 14,
                  fontFamily: 'var(--font-mono), monospace',
                  cursor: 'pointer',
                }}
              >
                {account.displayName}
              </button>
            );
          }}
        </ConnectButton.Custom>
      </div>

      {/* Tab row */}
      <nav
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          background: 'rgba(0,0,0,0.95)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          paddingTop: 8,
          paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
        }}
      >
        <Tab icon={<LineChart size={20}/>} label="Markets" active={view === 'markets'} onClick={() => onView('markets')} />
        <Tab icon={<Flame size={20}/>}     label="Drops"   active={view === 'drops'}    onClick={() => onView('drops')} />
        <CenterTab active={view === 'launchpad'} onClick={() => onView('launchpad')} />
        <Tab icon={<Search size={20}/>}    label="Search"  onClick={() => {}} />
        <Tab icon={<User size={20}/>}      label="Account" onClick={() => {}} />
      </nav>
    </div>
  );
}

function Tab({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
        padding: '6px 0',
        background: 'transparent', border: 'none', cursor: 'pointer',
        color: active ? '#ff3d8a' : 'rgba(255,255,255,0.55)',
      }}
    >
      {icon}
      <span
        style={{
          fontSize: 9,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          fontWeight: 700,
        }}
      >
        {label}
      </span>
    </button>
  );
}

function CenterTab({ active, onClick }: { active?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: -22,
        background: 'transparent', border: 'none', cursor: 'pointer',
      }}
    >
      <div
        style={{
          width: 50, height: 50, borderRadius: 999,
          background: 'linear-gradient(135deg, #d63384 0%, #ff3d8a 50%, #ff7e5f 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 24px -8px rgba(255,61,138,0.7)',
          border: active ? '2px solid rgba(255,255,255,0.4)' : 'none',
        }}
      >
        <Rocket size={22} color="#fff" />
      </div>
      <span
        style={{
          fontSize: 9,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          fontWeight: 700,
          color: active ? '#ff3d8a' : 'rgba(255,255,255,0.55)',
          marginTop: 4,
        }}
      >
        Launch
      </span>
    </button>
  );
}
