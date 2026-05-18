'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Send, Bell } from 'lucide-react';

export default function TopBar() {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        height: 56,
        background: '#000',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 12,
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
          fontWeight: 900,
          fontSize: 22,
          letterSpacing: '-0.03em',
          textDecoration: 'none',
          textShadow: '0 0 16px rgba(255,61,138,0.45)',
        }}
      >
        <span className="text-sunset">DEGEN</span>
        <span style={{ color: '#fff' }}>SEA</span>
      </a>

      <div style={{ flex: 1 }} />

      <button
        aria-label="Activity"
        style={{
          position: 'relative',
          width: 36,
          height: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(255,255,255,0.85)',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <Send size={18} />
      </button>

      <button
        aria-label="Notifications"
        style={{
          position: 'relative',
          width: 36,
          height: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(255,255,255,0.85)',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <Bell size={18} />
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
