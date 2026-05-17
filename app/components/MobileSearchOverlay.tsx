'use client';

import { useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

export default function MobileSearchOverlay({
  open, value, onChange, onClose,
}: {
  open: boolean;
  value: string;
  onChange: (s: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => ref.current?.focus(), 40);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] bg-[#05030a] md:hidden">
      <div className="px-4 pt-4 pb-3 flex items-center gap-2 border-b border-white/8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/45" size={16} />
          <input
            ref={ref}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder="Search collections, drops, tokens…"
            className="w-full bg-white/4 border border-white/8 focus:border-pink-400/50 transition pl-10 pr-3 py-2.5 rounded-lg outline-none text-sm font-mono"
          />
        </div>
        <button onClick={onClose} className="text-xs uppercase tracking-wider font-display text-white/60 px-2">
          Done
        </button>
      </div>
      <div className="p-6 text-center text-xs text-white/40 font-mono">
        {value
          ? <>Showing matches for <span className="text-sunset">"{value}"</span> in current view.</>
          : <>Start typing to filter Markets, Drops, or Launchpad.</>
        }
      </div>
    </div>
  );
}
