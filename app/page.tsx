'use client';

import { useState } from 'react';
import TopBar from './components/TopBar';
import Markets from './components/Markets';
import Bubbles from './components/Bubbles';
import Sniper from './components/Sniper';
import BottomNav from './components/BottomNav';
import LoadingScreen from './components/LoadingScreen';
import Toast from './components/Toast';

export type View = 'markets' | 'bubbles' | 'sniper';

export default function DegenSea() {
  const [view, setView] = useState<View>('markets');
  const [loading, setLoading] = useState(true);

  return (
    <div style={{ minHeight: '100vh' }}>
      {loading && <LoadingScreen onDone={() => setLoading(false)} />}

      <TopBar />

      <main style={{ paddingBottom: 16 }}>
        {view === 'markets' && <Markets />}
        {view === 'bubbles' && <Bubbles />}
        {view === 'sniper'  && <Sniper />}
      </main>

      <BottomNav view={view} onView={setView} />
      <Toast />
    </div>
  );
}
