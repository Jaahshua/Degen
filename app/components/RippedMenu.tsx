'use client';

import { useEffect, useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { LineChart, Rocket, Flame, ChevronRight, X, Sparkles } from 'lucide-react';
import type { View } from '../page';

const ITEMS: { id: View; label: string; icon: any; sub: string }[] = [
  { id: 'markets',   label: 'MARKETS',   icon: LineChart, sub: 'Floors & charts' },
  { id: 'drops',     label: 'DROPS',     icon: Flame,     sub: 'Mint countdowns' },
  { id: 'launchpad', label: 'LAUNCHPAD', icon: Rocket,    sub: 'pump.fun mode' },
];

export default function RippedMenu({
  view, onView,
}: {
  view: View;
  onView: (v: View) => void;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      {/* CORNER TAB — always visible upper right, ripped paper */}
      <button
        onClick={() => setOpen(true)}
        className={`fixed top-0 right-0 z-40 transition-all duration-300 ${open ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        aria-label="Open menu"
      >
        <div className="relative w-[260px] h-[180px] bg-sunset ripped-corner glow-pink float paper-texture">
          <div className="absolute inset-0 p-5 pt-4 pl-7 pr-6 flex flex-col text-white">
            <div className="flex items-center justify-between mb-2">
              <div className="font-display font-bold text-lg tracking-tight leading-none drop-shadow">
                DEGEN<span className="opacity-80">SEA</span>
              </div>
              <Sparkles size={16} className="opacity-90" />
            </div>
            <div className="text-[10px] uppercase tracking-[0.18em] opacity-80 mb-3">Sunset Terminal</div>

            <div className="space-y-1.5 mt-auto">
              {ITEMS.map(it => (
                <div key={it.id} className="flex items-center gap-2 text-sm font-medium drop-shadow-sm">
                  <it.icon size={14} className="opacity-90" />
                  <span className="opacity-95">{it.label}</span>
                </div>
              ))}
              <div className="flex items-center gap-1 text-[11px] opacity-80 pt-1 font-mono">
                Tap to open <ChevronRight size={12} />
              </div>
            </div>
          </div>
        </div>
      </button>

      {/* BACKDROP */}
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${open ? 'bg-black/55 backdrop-blur-sm opacity-100' : 'opacity-0 pointer-events-none'}`}
      />

      {/* DRAWER — opens from the right, styled as a torn page */}
      <aside
        className={`fixed top-0 right-0 z-50 h-full w-[420px] max-w-[92vw] transition-transform duration-500 ease-out ${open ? 'translate-x-0' : 'translate-x-full'}`}
        aria-hidden={!open}
      >
        <div className="relative h-full bg-sunset-vertical ripped-drawer paper-texture glow-pink">
          <div className="relative h-full overflow-y-auto px-8 pl-12 py-8 text-white">
            <div className="flex items-start justify-between mb-8">
              <div>
                <div className="font-display font-bold text-3xl tracking-tight leading-none drop-shadow">
                  DEGEN<span className="opacity-80">SEA</span>
                </div>
                <div className="mt-2 text-[11px] uppercase tracking-[0.22em] opacity-85">Pure Sunset Terminal</div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-2 bg-white/15 hover:bg-white/25 backdrop-blur transition"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2 mb-8">
              {ITEMS.map(it => {
                const active = view === it.id;
                return (
                  <button
                    key={it.id}
                    onClick={() => { onView(it.id); setOpen(false); }}
                    className={`w-full flex items-center justify-between rounded-2xl px-4 py-4 text-left transition border ${
                      active ? 'bg-white/95 text-purple-900 border-white shadow-xl' : 'bg-white/10 hover:bg-white/20 border-white/15'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`p-2 rounded-xl ${active ? 'bg-pink-100' : 'bg-white/15'}`}>
                        <it.icon size={18} />
                      </span>
                      <div>
                        <div className="font-display font-bold tracking-tight">{it.label}</div>
                        <div className={`text-[11px] uppercase tracking-wider ${active ? 'opacity-60' : 'opacity-75'}`}>{it.sub}</div>
                      </div>
                    </div>
                    <ChevronRight size={16} className={active ? 'opacity-50' : 'opacity-70'} />
                  </button>
                );
              })}
            </div>

            <div className="mb-6">
              <div className="text-[10px] uppercase tracking-[0.22em] opacity-80 mb-3">Wallet</div>
              <div className="bg-black/25 rounded-2xl p-3 border border-white/15">
                <ConnectButton showBalance={{ smallScreen: false, largeScreen: true }} chainStatus="icon" />
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <div className="text-[10px] uppercase tracking-[0.22em] opacity-80">Activity</div>
              {[
                { who: '0x4f3a…b21c', what: 'minted',  what2: 'NEONSUN',  v: '0.069 Ξ', t: '12s' },
                { who: '0x91ee…02f9', what: 'swept 3 of', what2: 'PUNKS',    v: '127 Ξ',  t: '38s' },
                { who: '0xa0c1…7711', what: 'bought',  what2: 'VICEINU', v: '$1.2k',  t: '1m'  },
                { who: '0xdead…beef', what: 'listed',  what2: 'BAYC',    v: '11.6 Ξ', t: '2m'  },
              ].map((a, i) => (
                <div key={i} className="flex items-center justify-between text-xs font-mono bg-white/8 rounded-xl px-3 py-2 border border-white/10">
                  <div className="flex items-center gap-2 truncate">
                    <span className="opacity-70">{a.who}</span>
                    <span className="opacity-90">{a.what}</span>
                    <span className="font-bold">{a.what2}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span>{a.v}</span>
                    <span className="opacity-60">{a.t}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 pt-6 border-t border-white/20 text-[10px] uppercase tracking-[0.18em] opacity-70">
              v0.2 — Sunset Edition
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
