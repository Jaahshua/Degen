'use client';

import { Search, X } from 'lucide-react';

export default function SearchBar({
  value, onChange, placeholder = 'Search collections, drops, tokens…',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative w-full max-w-xl">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-300/70" size={18} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white/5 border border-white/10 hover:border-pink-400/40 focus:border-pink-400/80 transition pl-11 pr-10 py-3 rounded-xl outline-none text-sm font-mono placeholder:text-white/30"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-pink-300"
          aria-label="Clear"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
