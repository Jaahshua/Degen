'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Send, Bell } from 'lucide-react';
import Logo from './Logo';
import { toast } from './Toast';

export default function TopBar() {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        minHeight: 64,
        background: '#000',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        alignItems: 'center',
        padding: '8px 16px',
        gap: 10,
      }}
    >
      {/* Subtle sunset glow in corner */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: 220,
          background:
            'radial-gradient(ellipse at 95% 50%, rgba(255,61,138,0.18) 0%, rgba(251,191,36,0.06) 35%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <a
        href="#"
        style={{
          position: 'relative',
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
        }}
        aria-label="DEGENSEA"
      >
        <Logo height={34} />
      </a>

      <div style={{ flex: 1 }} />

      <button
        aria-label="Activity"
        onClick={() => toast('Activity feed coming soon')}
        style={{
          position: 'relative',
          width: 29,
          height: 29,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(255,255,255,0.85)',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <Send size={14} />
      </button>

      <button
        aria-label="Notifications"
        onClick={() => toast('No new alerts')}
        style={{
          position: 'relative',
          width: 29,
          height: 29,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(255,255,255,0.85)',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <Bell size={14} />
      </button>

      {/* Wallet button (desktop) */}
      <div style={{ position: 'relative' }} className="hidden md:block">
        <ConnectButton
          showBalance={false}
          chainStatus="icon"
          accountStatus={{ smallScreen: 'avatar', largeScreen: 'address' }}
        />
      </div>
    </header>
  );
}
