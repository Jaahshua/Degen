'use client';

import { useEffect, useState } from 'react';
import TopBar from './components/TopBar';
import Markets from './components/Markets';
import Drops from './components/Drops';
import Launchpad from './components/Launchpad';
import BottomNav from './components/BottomNav';
import LoadingScreen from './components/LoadingScreen';
import Toast from './components/Toast';

export type View = 'markets' | 'drops' | 'launchpad';

const KEY = 'degensea-entered-v3';

export default function DegenSea() {
  const [view, setView] = useState<View>('markets');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try { if (sessionStorage.getItem(KEY) === '1') setLoading(false); } catch {}
  }, []);

  const finish = () => {
    try { sessionStorage.setItem(KEY, '1'); } catch {}
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      {loading && <LoadingScreen onDone={finish} />}

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
