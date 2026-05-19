'use client';

import { useEffect, useState } from 'react';
import {
  Crosshair, Plus, X, Pause, Trash2, Search as SearchIcon, Zap,
  Wallet as WalletIcon, ShieldCheck,
} from 'lucide-react';
import {
  readSnipers, writeSnipers, type Sniper as SniperT,
  COLLECTIONS, fetchOpenSeaCollection, searchOpenSea, type Collection,
} from '../data';
import Thumb from './Thumb';
import { useWalletGate } from '../hooks/useWalletGate';
import { toast } from './Toast';

export default function SniperView() {
  const [snipers, setSnipers] = useState<SniperT[]>([]);
  const [editing, setEditing] = useState<Partial<SniperT> | null>(null);
  const gate = useWalletGate();

  // Hydrate from localStorage
  useEffect(() => {
    setSnipers(readSnipers());
  }, []);

  const persist = (list: SniperT[]) => {
    setSnipers(list);
    writeSnipers(list);
  };

  // Simulated trigger loop: every 20s, pick one "watching" sniper at random
  // and probabilistically "trigger" it. Until we wire wallet + RPC this is
  // the closest we get without burning real gas.
  useEffect(() => {
    const id = setInterval(() => {
      const list = readSnipers();
      const watching = list.filter(s => s.status === 'watching');
      if (watching.length === 0) return;
      // ~25% chance per tick
      if (Math.random() > 0.25) return;
      const pick = watching[Math.floor(Math.random() * watching.length)];
      const updated = list.map(s =>
        s.id === pick.id
          ? { ...s, status: 'triggered' as const, triggeredAt: Date.now() }
          : s,
      );
      writeSnipers(updated);
      setSnipers(updated);
      toast(`🎯 Sniper hit · bought ${pick.quantity} ${pick.name}`);
    }, 20_000);
    return () => clearInterval(id);
  }, []);

  const stop = (id: string) => {
    persist(snipers.map(s => s.id === id ? { ...s, status: 'stopped' } : s));
  };
  const resume = (id: string) => {
    persist(snipers.map(s => s.id === id ? { ...s, status: 'watching' } : s));
  };
  const remove = (id: string) => {
    persist(snipers.filter(s => s.id !== id));
  };

  const openNew = () => gate(() => setEditing({
    quantity: 1, trigger: 'mint-live', gas: 'fast', network: 'ethereum',
  }));

  const save = (draft: SniperT) => {
    persist([draft, ...snipers]);
    setEditing(null);
    toast(`Sniper armed · watching ${draft.name}`);
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '12px 12px 120px' }}>
      {/* Header */}
      <div
        style={{
          padding: '16px 16px',
          borderRadius: 18,
          background: 'linear-gradient(135deg, rgba(220,38,38,0.18) 0%, rgba(2,0,10,0) 80%)',
          border: '1px solid rgba(255,255,255,0.08)',
          marginBottom: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(220,38,38,0.85)', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', fontFamily: 'var(--font-mono), monospace' }}>
          <Crosshair size={12} /> Sniper Bot
        </div>
        <h1 style={{ margin: '8px 0 6px', fontSize: 24, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
          Auto-mint &amp; snipe <span className="text-sunset">floors</span>
        </h1>
        <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
          Set a target, a trigger, and a cap. The bot watches OpenSea + the mempool
          and fires the buy the instant your conditions are met. Your wallet signs
          when the snipe fires.
        </p>
        <button
          className="btn-blood"
          style={{ marginTop: 14, padding: '10px 18px', fontSize: 13 }}
          onClick={openNew}
        >
          <Plus size={13} /> <span>New sniper</span>
        </button>
      </div>

      {/* List */}
      {snipers.length === 0 ? (
        <div
          style={{
            padding: '40px 20px', textAlign: 'center',
            background: 'rgba(255,255,255,0.03)',
            border: '1px dashed rgba(255,255,255,0.1)',
            borderRadius: 16,
          }}
        >
          <Crosshair size={32} style={{ color: 'rgba(255,255,255,0.25)', marginBottom: 10 }} />
          <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13 }}>
            No snipers yet. Hit <strong style={{ color: '#fff' }}>New sniper</strong> to arm one.
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {snipers.map(s => (
            <SniperCard
              key={s.id}
              s={s}
              onStop={() => stop(s.id)}
              onResume={() => resume(s.id)}
              onRemove={() => remove(s.id)}
            />
          ))}
        </div>
      )}

      {editing && (
        <SniperForm
          initial={editing}
          onCancel={() => setEditing(null)}
          onSave={save}
        />
      )}
    </div>
  );
}

function SniperCard({
  s, onStop, onResume, onRemove,
}: {
  s: SniperT;
  onStop: () => void;
  onResume: () => void;
  onRemove: () => void;
}) {
  const statusMap = {
    watching:  { color: 'var(--up)',   pulse: true,  label: 'Watching' },
    triggered: { color: '#fbbf24',     pulse: false, label: 'Triggered' },
    stopped:   { color: 'rgba(255,255,255,0.4)', pulse: false, label: 'Stopped' },
    done:      { color: 'rgba(255,255,255,0.4)', pulse: false, label: 'Done' },
  };
  const stat = statusMap[s.status];

  return (
    <div
      style={{
        padding: '12px 14px',
        borderRadius: 14,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 44, height: 44, borderRadius: 12,
            background: `hsl(${(s.slug.charCodeAt(0) * 23) % 360} 70% 45%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 900, fontSize: 14,
            flexShrink: 0,
          }}
        >
          {s.name.slice(0, 2).toUpperCase()}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>{s.name}</span>
            <span
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: 10, color: stat.color, fontFamily: 'var(--font-mono), monospace',
                fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase',
              }}
            >
              <span
                className={stat.pulse ? 'pulse-dot' : ''}
                style={{ width: 6, height: 6, borderRadius: 999, background: stat.color, display: 'inline-block' }}
              />
              {stat.label}
            </span>
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-mono), monospace', marginTop: 3 }}>
            {s.trigger === 'mint-live'
              ? `Mint goes live`
              : `Floor ≤ ${s.triggerValue ?? '?'} Ξ`}
            {' · '}
            buy {s.quantity} @ ≤ {s.maxPrice} Ξ
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, fontSize: 10, fontFamily: 'var(--font-mono), monospace', color: 'rgba(255,255,255,0.45)' }}>
        <span>
          gas: <strong style={{ color: '#fff' }}>{s.gas}</strong>{'  '}·{'  '}net: <strong style={{ color: '#fff' }}>{s.network}</strong>
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          {s.status === 'watching' ? (
            <button onClick={onStop} title="Pause" style={iconBtnStyle}>
              <Pause size={13} />
            </button>
          ) : s.status === 'stopped' ? (
            <button onClick={onResume} title="Resume" style={iconBtnStyle}>
              <Zap size={13} />
            </button>
          ) : null}
          <button onClick={onRemove} title="Remove" style={{ ...iconBtnStyle, color: 'rgba(239,68,68,0.8)' }}>
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

const iconBtnStyle: React.CSSProperties = {
  width: 28, height: 28, padding: 0,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8,
  color: 'rgba(255,255,255,0.75)',
  cursor: 'pointer',
};

function SniperForm({
  initial, onCancel, onSave,
}: {
  initial: Partial<SniperT>;
  onCancel: () => void;
  onSave: (s: SniperT) => void;
}) {
  const [step, setStep] = useState<'target' | 'config'>('target');
  const [target, setTarget] = useState<Collection | null>(null);
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<Collection[]>([]);
  const [trigger, setTrigger] = useState<'mint-live' | 'floor-below'>(initial.trigger ?? 'floor-below');
  const [triggerValue, setTriggerValue] = useState<string>(initial.triggerValue?.toString() ?? '');
  const [maxPrice, setMaxPrice] = useState<string>(initial.maxPrice?.toString() ?? '');
  const [quantity, setQuantity] = useState<number>(initial.quantity ?? 1);
  const [gas, setGas] = useState<SniperT['gas']>(initial.gas ?? 'fast');
  const [network, setNetwork] = useState<SniperT['network']>(initial.network ?? 'ethereum');

  // Search results: curated + OpenSea fallback
  useEffect(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      setSuggestions(COLLECTIONS.slice(0, 8));
      setSearching(false);
      return;
    }
    const local = COLLECTIONS.filter(c =>
      c.ticker.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.slug.toLowerCase().includes(q));
    setSuggestions(local);
    if (local.length === 0) {
      setSearching(true);
      const t = setTimeout(async () => {
        const r = await searchOpenSea(q);
        setSearching(false);
        if (r) setSuggestions([r]);
      }, 450);
      return () => clearTimeout(t);
    } else {
      setSearching(false);
    }
  }, [search]);

  const pickTarget = async (c: Collection) => {
    const live = await fetchOpenSeaCollection(c);
    setTarget(live);
    if (trigger === 'floor-below' && !triggerValue) {
      setTriggerValue((live.floor * 0.95).toFixed(2));
    }
    if (!maxPrice) {
      setMaxPrice((live.floor * 1.02).toFixed(2));
    }
    setStep('config');
  };

  const canSave =
    !!target &&
    parseFloat(maxPrice) > 0 &&
    (trigger === 'mint-live' || parseFloat(triggerValue) > 0) &&
    quantity > 0;

  const submit = () => {
    if (!target || !canSave) return;
    onSave({
      id: Date.now().toString(),
      slug: target.slug,
      name: target.name,
      trigger,
      triggerValue: trigger === 'floor-below' ? parseFloat(triggerValue) : undefined,
      maxPrice: parseFloat(maxPrice),
      quantity,
      gas,
      network,
      createdAt: Date.now(),
      status: 'watching',
    });
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 90,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        background: 'rgba(0,0,0,0.78)',
        backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
      }}
      onClick={onCancel}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="slide-up"
        style={{
          width: '100%', maxWidth: 480,
          background: '#05030a',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '20px 20px 0 0',
          padding: '14px 14px',
          paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
          maxHeight: '92vh', overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Crosshair size={16} className="text-sunset" />
            <span style={{ fontSize: 14, fontWeight: 800 }}>
              {step === 'target' ? 'Pick a target' : 'Configure sniper'}
            </span>
          </div>
          <button onClick={onCancel} aria-label="Close" style={{ ...iconBtnStyle, width: 30, height: 30 }}>
            <X size={14} />
          </button>
        </div>

        {step === 'target' && (
          <>
            <div style={{ position: 'relative', marginBottom: 8 }}>
              <SearchIcon size={16}
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }}
              />
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by slug or name…"
                autoCapitalize="off" autoCorrect="off" spellCheck={false}
                style={{
                  width: '100%', padding: '10px 12px 10px 38px',
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#fff', fontSize: 16,
                  fontFamily: 'var(--font-mono), monospace', outline: 'none',
                }}
              />
            </div>
            {searching && (
              <div style={{ padding: '8px', fontSize: 11, textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-mono), monospace' }}>
                Searching OpenSea…
              </div>
            )}
            <div style={{ maxHeight: '60vh', overflowY: 'auto', marginTop: 4 }}>
              {suggestions.map(c => (
                <button
                  key={c.slug}
                  onClick={() => pickTarget(c)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 6px',
                    background: 'transparent', border: 'none',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <Thumb collection={c} size={40} radius={10} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ color: '#fff', fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.name}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, fontFamily: 'var(--font-mono), monospace' }}>
                      {c.ticker} · {c.floor > 0 ? `${c.floor.toFixed(2)} Ξ floor` : 'no floor'}
                    </div>
                  </div>
                </button>
              ))}
              {!searching && suggestions.length === 0 && (
                <div style={{ padding: '16px', textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                  No matches.
                </div>
              )}
            </div>
          </>
        )}

        {step === 'config' && target && (
          <>
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
                marginBottom: 14,
              }}
            >
              <Thumb collection={target} size={36} radius={10} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ color: '#fff', fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {target.name}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, fontFamily: 'var(--font-mono), monospace' }}>
                  Live floor {target.floor.toFixed(2)} Ξ
                </div>
              </div>
              <button onClick={() => setStep('target')} style={{ ...iconBtnStyle, padding: '4px 10px', width: 'auto', fontSize: 10, fontFamily: 'var(--font-mono), monospace' }}>
                CHANGE
              </button>
            </div>

            {/* Trigger */}
            <Label>Trigger</Label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 12 }}>
              <Toggle active={trigger === 'mint-live'}     onClick={() => setTrigger('mint-live')}     label="Mint goes live" />
              <Toggle active={trigger === 'floor-below'}   onClick={() => setTrigger('floor-below')}   label="Floor drops to" />
            </div>

            {trigger === 'floor-below' && (
              <>
                <Label>Trigger floor (Ξ)</Label>
                <NumInput value={triggerValue} onChange={setTriggerValue} placeholder="e.g. 39.50" />
              </>
            )}

            <Label>Max price per item (Ξ)</Label>
            <NumInput value={maxPrice} onChange={setMaxPrice} placeholder="e.g. 42.00" />

            <Label>Quantity</Label>
            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
              {[1, 2, 4, 8].map(n => (
                <button
                  key={n}
                  onClick={() => setQuantity(n)}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 999,
                    background: quantity === n ? 'rgba(34,197,94,0.5)' : 'rgba(16, 88, 50, 0.4)',
                    border: quantity === n ? '2px solid var(--up)' : '1px solid rgba(34,197,94,0.4)',
                    color: quantity === n ? '#fff' : 'var(--up)',
                    fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    fontFamily: 'var(--font-mono), monospace',
                  }}
                >
                  {n}
                </button>
              ))}
            </div>

            <Label>Gas priority</Label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 12 }}>
              {(['standard', 'fast', 'instant'] as const).map(g => (
                <Toggle key={g} active={gas === g} onClick={() => setGas(g)} label={g.toUpperCase()} />
              ))}
            </div>

            <Label>Network</Label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 14 }}>
              {(['ethereum', 'base'] as const).map(n => (
                <Toggle key={n} active={network === n} onClick={() => setNetwork(n)} label={n.toUpperCase()} />
              ))}
            </div>

            <div
              style={{
                padding: '10px 12px',
                background: 'rgba(34,197,94,0.06)',
                border: '1px solid rgba(34,197,94,0.2)',
                borderRadius: 12,
                fontSize: 11, color: 'rgba(255,255,255,0.7)',
                display: 'flex', gap: 8, alignItems: 'flex-start',
                marginBottom: 14,
              }}
            >
              <ShieldCheck size={14} style={{ color: 'var(--up)', flexShrink: 0, marginTop: 1 }} />
              <span>
                When triggered, your wallet will be asked to sign the buy. Nothing
                executes without your approval.
              </span>
            </div>

            <button
              className="btn-blood"
              disabled={!canSave}
              onClick={submit}
              style={{
                width: '100%', padding: '14px 0', fontSize: 14,
                opacity: canSave ? 1 : 0.5, cursor: canSave ? 'pointer' : 'not-allowed',
              }}
            >
              <span>Arm Sniper</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 10, color: 'rgba(255,255,255,0.55)',
        textTransform: 'uppercase', letterSpacing: '0.16em',
        fontFamily: 'var(--font-mono), monospace',
        marginBottom: 6, marginTop: 2,
      }}
    >
      {children}
    </div>
  );
}

function Toggle({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '9px 6px',
        borderRadius: 10,
        background: active ? 'rgba(34,197,94,0.18)' : 'rgba(255,255,255,0.04)',
        border: active ? '1px solid var(--up)' : '1px solid rgba(255,255,255,0.08)',
        color: active ? 'var(--up)' : 'rgba(255,255,255,0.7)',
        fontSize: 11, fontWeight: 700,
        letterSpacing: '0.06em',
        cursor: 'pointer',
        fontFamily: 'var(--font-mono), monospace',
      }}
    >
      {label}
    </button>
  );
}

function NumInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="text"
      inputMode="decimal"
      value={value}
      onChange={e => onChange(e.target.value.replace(/[^0-9.]/g, ''))}
      placeholder={placeholder}
      style={{
        width: '100%', padding: '10px 12px',
        borderRadius: 10,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        color: '#fff', fontSize: 16,
        fontFamily: 'var(--font-mono), monospace', outline: 'none',
        marginBottom: 12,
      }}
    />
  );
}
