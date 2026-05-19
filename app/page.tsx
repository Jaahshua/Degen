'use client';

import { useState } from 'react';
import TopBar from './components/TopBar';
import Markets from './components/Markets';
import Drops from './components/Drops';
import Launchpad from './components/Launchpad';
import BottomNav from './components/BottomNav';
import LoadingScreen from './components/LoadingScreen';
import Toast from './components/Toast';

export type View = 'markets' | 'drops' | 'launchpad';

export default function DegenSea() {
  const [view, setView] = useState<View>('markets');
  // Always show the loading screen on every page refresh.
  const [loading, setLoading] = useState(true);

  return (
    <div style={{ minHeight: '100vh' }}>
      {loading && <LoadingScreen onDone={() => setLoading(false)} />}

      <TopBar />

      <main style={{ paddingBottom: 16 }}>
        {view === 'markets'   && <Markets />}
        {view === 'drops'     && <Drops />}
        {view === 'launchpad' && <Launchpad />}
      </main>

      <BottomNav view={view} onView={setView} />
      <Toast />
    </div>
  );
}

