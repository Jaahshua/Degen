'use client';

import { useState } from 'react';
import TopBar from './components/TopBar';
import Markets from './components/Markets';
import Bubbles from './components/Bubbles';
import Sniper from './components/Sniper';
import BottomNav from './components/BottomNav';
import LoadingScreen from './components/LoadingScreen';
import SearchOverlay from './components/SearchOverlay';
import Toast from './components/Toast';
import type { Collection } from './data';

export type View = 'markets' | 'bubbles' | 'sniper';

export default function DegenSea() {
  const [view, setView] = useState<View>('markets');
  const [loading, setLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [bubbleTarget, setBubbleTarget] = useState<Collection | null>(null);

  return (
    <div style={{ minHeight: '100vh' }}>
      {loading && <LoadingScreen onDone={() => setLoading(false)} />}

      <TopBar />

      <main style={{ paddingTop: 60, paddingBottom: 16 }}>
        {view === 'markets' && <Markets />}
        {view === 'bubbles' && <Bubbles target={bubbleTarget} />}
        {view === 'sniper'  && <Sniper />}
      </main>

      <BottomNav view={view} onView={setView} onSearch={() => setSearchOpen(true)} />

      <SearchOverlay
        open={searchOpen}
        view={view}
        onClose={() => setSearchOpen(false)}
        onTrace={(c) => { setBubbleTarget(c); setSearchOpen(false); }}
      />

      <Toast />
    </div>
  );
}
