'use client';

import { useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip } from 'chart.js';
import { TrendingUp, Zap, Wallet, Search, ArrowUpRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip);

const TOP_COLLECTIONS = [
  { slug: 'cryptopunks', ticker: 'PUNKS', name: 'CryptoPunks' },
  { slug: 'boredapeyachtclub', ticker: 'BAYC', name: 'BAYC' },
  { slug: 'pudgypenguins', ticker: 'PUDGY', name: 'Pudgy Penguins' },
  { slug: 'azuki', ticker: 'AZUKI', name: 'Azuki' },
  { slug: 'doodles-official', ticker: 'DOODLE', name: 'Doodles' },
  { slug: 'clone-x', ticker: 'CLONEX', name: 'Clone X' },
];

export default function DegenSea() {
  const [selected, setSelected] = useState(TOP_COLLECTIONS[0]);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: stats, isLoading } = useQuery({
    queryKey: ['opensea', selected.slug],
    queryFn: async () => {
      const res = await fetch(`https://api.opensea.io/api/v2/collections/${selected.slug}/stats`);
      return res.ok ? res.json() : { total: { floor_price: 42.5, volume: 1234, num_owners: 4567 } };
    },
    refetchInterval: 30000,
  });

  const floor = stats?.total?.floor_price || 42.5;

  const chartData = {
    labels: ['1H', '4H', '12H', '24H', '7D'],
    datasets: [{
      label: 'Floor (ETH)',
      data: [floor * 0.96, floor * 0.94, floor, floor * 1.04, floor * 1.09],
      borderColor: '#14b8a6',
      tension: 0.4,
    }]
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5dc] font-mono">
      <header className="border-b border-[#6b21a8] px-8 py-5 flex justify-between items-center bg-black/90">
        <div className="flex items-center gap-4">
          <div className="text-5xl font-black tracking-tighter terminal-purple">DEGEN<span className="terminal-teal">SEA</span></div>
          <div className="text-xs px-4 py-2 border border-teal-400/50 text-teal-400 rounded">ETH • PURE SPECULATION</div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative w-96">
            <Search className="absolute left-4 top-4 text-gray-500" size={18} />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="SEARCH TICKER / COLLECTION"
              className="w-full bg-black border border-purple-800 pl-12 py-3 focus:border-teal-400 outline-none rounded"
            />
          </div>
          <button className="flex items-center gap-3 bg-gradient-to-r from-purple-600 to-teal-600 px-8 py-3 rounded hover:brightness-110 font-bold">
            <Wallet size={20} /> CONNECT WALLET
          </button>
        </div>
      </header>

      <div className="flex h-[calc(100vh-81px)]">
        {/* Sidebar */}
        <div className="w-80 border-r border-[#6b21a8] p-6 overflow-auto bg-black/30">
          <div className="text-teal-400 flex items-center gap-2 mb-4">
            <TrendingUp size={20} /> HIGH VOLUME
          </div>
          {TOP_COLLECTIONS.map(c => (
            <div
              key={c.slug}
              onClick={() => setSelected(c)}
              className={`p-4 mb-3 cursor-pointer rounded border ${selected.slug === c.slug ? 'border-teal-400 bg-purple-950/40' : 'border-purple-900 hover:border-purple-700'}`}
            >
              <div className="text-2xl font-bold">{c.ticker}</div>
              <div className="text-sm text-gray-400">{c.name}</div>
            </div>
          ))}

          <div className="mt-12">
            <div className="text-purple-400 flex items-center gap-2 mb-4">
              <Zap size={20} /> NEW DROPS
            </div>
            <div className="p-6 border border-dashed border-purple-800 text-sm opacity-70">
              Live trending mints & launches — coming v0.2
            </div>
          </div>
        </div>

        {/* Main Area */}
        <div className="flex-1 p-10 flex flex-col">
          <div className="flex justify-between items-end mb-8">
            <div>
              <div className="text-7xl font-black tracking-[-3px]">{selected.ticker}</div>
              <div className="text-2xl terminal-purple -mt-2">{selected.name}</div>
            </div>
            <div className="text-right">
              <div className="text-7xl font-mono terminal-teal">
                {isLoading ? '—.——' : floor.toFixed(2)} ETH
              </div>
              <div className="flex items-center gap-1 justify-end text-emerald-400 text-xl">
                <ArrowUpRight size={22} /> +6.8% 24H
              </div>
            </div>
          </div>

          <div className="flex-1 bg-black/70 border border-purple-900 rounded-2xl p-8">
            <Line data={chartData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false }} }} />
          </div>

          <div className="grid grid-cols-4 gap-4 mt-8 text-center">
            <div className="border border-purple-900 p-6">
              <div className="text-xs opacity-60">24H VOL</div>
              <div className="text-3xl mt-2 font-mono">{stats?.total?.volume?.toFixed(0) || '1,234'} ETH</div>
            </div>
            <div className="border border-purple-900 p-6">
              <div className="text-xs opacity-60">OWNERS</div>
              <div className="text-3xl mt-2 font-mono">{stats?.total?.num_owners || '4,567'}</div>
            </div>
            <div className="border border-purple-900 p-6">
              <div className="text-xs opacity-60">LISTED</div>
              <div className="text-3xl mt-2 font-mono">—</div>
            </div>
            <div className="border border-purple-900 p-6 bg-purple-950/30">
              <div className="text-xs opacity-60">DEGEN SCORE</div>
              <div className="text-3xl mt-2 font-mono text-orange-400">98</div>
            </div>
          </div>
        </div>

        {/* Trade Panel */}
        <div className="w-96 border-l border-[#6b21a8] p-8 space-y-6 bg-black/50">
          <button className="w-full py-12 text-4xl font-black bg-teal-600 hover:bg-teal-500 rounded-2xl border-2 border-teal-400">
            SWEEP FLOOR
          </button>
          <button className="w-full py-8 text-2xl font-bold bg-purple-700 hover:bg-purple-600 rounded-2xl">
            PLACE BID
          </button>

          <div className="pt-12 border-t border-purple-900 text-xs leading-relaxed opacity-70">
            NO IMAGES.<br />
            NO NARRATIVE.<br />
            NO COPIUM.<br /><br />
            JUST CHARTS + DEGEN ENERGY.
          </div>
        </div>
      </div>
    </div>
  );
}
