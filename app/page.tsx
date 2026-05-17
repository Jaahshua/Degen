'use client';

import { useState } from 'react';
import Marquee from './components/Marquee';
import SearchBar from './components/SearchBar';
import RippedMenu from './components/RippedMenu';
import MarketsView from './components/MarketsView';
import DropsView from './components/DropsView';
import LaunchpadView from './components/LaunchpadView';
import { LineChart, Flame, Rocket } from 'lucide-react';

export type View = 'markets' | 'drops' | 'launchpad';

const TABS: { id: View; label: string; icon: any }[] = [
  { id: 'markets',   label: 'Markets',   icon: LineChart },
  { id: 'drops',     label: 'Drops',     icon: Flame     },
  { id: 'launchpad', label: 'Launchpad', icon: Rocket    },
];

export default function DegenSea() {
  const [view, setView] = useState<View>('markets');
  const [search, setSearch] = useState('');

  const searchPlaceholder =
    view === 'markets'   ? 'Search collections (PUNKS, BAYC, MILADY…)' :
    view === 'drops'     ? 'Search drops or artists…' :
                           'Search launchpad tokens…';

  return (
    <div className="min-h-screen relative">
      <RippedMenu view={view} onView={setView} />

      <Marquee />

      <header className="px-5 md:px-10 pt-7 pb-3 pr-[60px]">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div>
            <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight leading-none">
              <span className="text-sunset">DEGEN</span><span className="text-white">SEA</span>
            </h1>
            <div className="mt-2 text-[11px] uppercase tracking-[0.22em] text-pink-300/80 font-mono">
              No JPEGs. No lore. Just sunset & degen action.
            </div>
          </div>
          <SearchBar value={search} onChange={setSearch} placeholder={searchPlaceholder} />
        </div>

        <nav className="mt-6 flex items-center gap-1.5 bg-white/3 border border-white/8 backdrop-blur rounded-xl p-1 w-fit">
          {TABS.map(t => {
            const active = t.id === view;
            return (
              <button
                key={t.id}
                onClick={() => setView(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-display tracking-tight transition ${
                  active ? 'btn-sunset' : 'text-white/65 hover:text-white hover:bg-white/5'
                }`}
              >
                <t.icon size={15} />
                {t.label}
              </button>
            );
          })}
        </nav>
      </header>

      <main className="px-5 md:px-10 pb-16 pt-4">
        {view === 'markets'   && <MarketsView   search={search} />}
        {view === 'drops'     && <DropsView     search={search} />}
        {view === 'launchpad' && <LaunchpadView search={search} />}
      </main>
    </div>
  );
}
