'use client';

import { useEffect, useState } from 'react';
import Marquee from './components/Marquee';
import ProjectorTopBar from './components/ProjectorTopBar';
import MarketsView from './components/MarketsView';
import DropsView from './components/DropsView';
import LaunchpadView from './components/LaunchpadView';
import LoadingScreen from './components/LoadingScreen';
import BottomNav from './components/BottomNav';
import MobileSearchOverlay from './components/MobileSearchOverlay';

export type View = 'markets' | 'drops' | 'launchpad';

const KEY = 'degensea-entered-v2';

export default function DegenSea() {
  const [view, setView] = useState<View>('markets');
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (sessionStorage.getItem(KEY) === '1') setLoading(false);
    } catch {}
  }, []);

  const finish = () => {
    try { sessionStorage.setItem(KEY, '1'); } catch {}
    setLoading(false);
  };

  return (
    <div className="min-h-screen">
      {loading && <LoadingScreen onDone={finish} />}

      <ProjectorTopBar view={view} onView={setView} search={search} onSearch={setSearch} />
      <Marquee />

      <main className="pb-24 md:pb-12">
        {view === 'markets'   && <MarketsView   search={search} />}
        {view === 'drops'     && <DropsView     search={search} />}
        {view === 'launchpad' && <LaunchpadView search={search} />}
      </main>

      <BottomNav view={view} onView={setView} onSearch={() => setSearchOpen(true)} />
      <MobileSearchOverlay
        open={searchOpen}
        value={search}
        onChange={setSearch}
        onClose={() => setSearchOpen(false)}
      />
    </div>
  );
}
