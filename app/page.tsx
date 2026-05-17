'use client';

import { useState } from 'react';
import Marquee from './components/Marquee';
import ProjectorTopBar from './components/ProjectorTopBar';
import MarketsView from './components/MarketsView';
import DropsView from './components/DropsView';
import LaunchpadView from './components/LaunchpadView';

export type View = 'markets' | 'drops' | 'launchpad';

export default function DegenSea() {
  const [view, setView] = useState<View>('markets');
  const [search, setSearch] = useState('');

  return (
    <div className="min-h-screen">
      <ProjectorTopBar view={view} onView={setView} search={search} onSearch={setSearch} />
      <Marquee />
      <main className="pb-16">
        {view === 'markets'   && <MarketsView   search={search} />}
        {view === 'drops'     && <DropsView     search={search} />}
        {view === 'launchpad' && <LaunchpadView search={search} />}
      </main>
    </div>
  );
}
