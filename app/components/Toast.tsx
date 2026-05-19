'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

let setOuter: ((msg: string | null) => void) | null = null;

export function toast(msg: string) {
  setOuter?.(msg);
}

export default function Toast() {
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    setOuter = setMsg;
    return () => { setOuter = null; };
  }, []);

  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 3200);
    return () => clearTimeout(t);
  }, [msg]);

  if (!msg) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 'calc(120px + env(safe-area-inset-bottom))',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 200,
        padding: '12px 18px',
        borderRadius: 999,
        background: '#fef5e0',
        color: '#2a0a0a',
        border: '2px solid #4a1818',
        boxShadow:
          '0 0 0 1px rgba(220,38,38,0.25), 0 16px 36px -10px rgba(220,38,38,0.6)',
        fontFamily: 'var(--font-mono), monospace',
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        maxWidth: '90vw',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
      className="fade-in"
    >
      <CheckCircle2 size={16} color="#16a34a" />
      <span>{msg}</span>
    </div>
  );
}
