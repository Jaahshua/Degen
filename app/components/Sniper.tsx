'use client';

import { useEffect, useState } from 'react';
import {
  Crosshair, Plus, X, Pause, Trash2, Search as SearchIcon, Zap,
  ShieldCheck, Info, Target, MousePointerClick, BellRing, ChevronRight,
  Repeat, ShieldAlert, ArrowDownUp,
} from 'lucide-react';
import {
  readSnipers, writeSnipers, type Sniper as SniperT,
  type StrategyId, type StrategyKind,
  STRATEGIES, STRATEGY_MAP, collectionRiskScore,
  COLLECTIONS, fetchOpenSeaCollection, searchOpenSea, type Collection,
} from '../data';
import Thumb from './Thumb';
import { useWalletGate } from '../hooks/useWalletGate';
import { toast } from './Toast';

const ADVANCE_MS = 9_000;

const KIND_COLOR: Record<StrategyKind, string> = {
  buy: '#22c55e', sell: '#ef4444', flip: '#fbbf24',
};

function shortAddr(a: string) {
  return a.length > 12 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a;
}

function summary(s: SniperT): string {
  const meta = STRATEGY_MAP[s.strategy];
  switch (s.strategy) {
    case 'snipe-mint':      return 'When the mint opens';
    case 'buy-floor':       return `Floor ≤ ${s.value} Ξ`;
    case 'buy-underpriced': return `Listing ${s.value}% under floor`;
    case 'whale-copy':      return `Copies ${shortAddr(s.watchWallet || '0x…')}`;
    case 'dump-cascade':    return `Floor dumps ${s.value}% fast`;
    case 'flip':            return `Buy ≤ ${s.maxPrice} Ξ → relist +${s.value}%`;
    case 'take-profit':     return `Floor ≥ ${s.value} Ξ`;
    case 'stop-loss':       return `Floor ≤ ${s.value} Ξ`;
    case 'trailing-stop':   return `Trails ${s.value}% off peak`;
    case 'rug-guard':       return `Risk ≥ ${s.value}/100 → sell`;
    case 'offer-accept':    return `Offer ≥ ${s.value} Ξ`;
    default:                return meta?.blurb ?? '';
  }
}

export default function SniperView() {
  const [snipers, setSnipers] = useState<SniperT[]>([]);
  const [editing, setEditing] = useState<boolean>(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const gate = useWalletGate();

  useEffect(() => {
    // Drop any legacy entries that predate the strategy model.
    setSnipers(readSnipers().filter(s => !!(s as any).strategy));
  }, []);

  const persist = (list: SniperT[]) => { setSnipers(list); writeSnipers(list); };

  // Strategy-aware simulation loop. Flip walks buy→hold→sold with P&L;
  // Rug Guard re-evaluates the live risk score and fires if it crosses
  // the threshold; everything else uses a light random trigger.
  useEffect(() => {
    const id = setInterval(() => {
      const list = readSnipers().filter(s => !!(s as any).strategy);
      let changed = false;

      const next = list.map((s): SniperT => {
        if (s.status === 'stopped' || s.status === 'done') return s;

        // ---- FLIP (full) ----
        if (s.strategy === 'flip') {
          const leg = s.leg ?? 'buying';
          if (leg === 'buying' && Math.random() < 0.4) {
            changed = true;
            toast(`🟢 Flip filled · bought ${s.name} @ ${s.maxPrice} Ξ`);
            return { ...s, leg: 'holding', buyFill: s.maxPrice, status: 'watching' };
          }
          if (leg === 'holding' && Math.random() < 0.35) {
            const markup = (s.value ?? 15) / 100;
            const sellAt = +((s.buyFill ?? s.maxPrice) * (1 + markup)).toFixed(3);
            changed = true;
            toast(`💰 Flip sold · ${s.name} @ ${sellAt} Ξ (+${s.value}%)`);
            return { ...s, leg: 'sold', sellFill: sellAt, status: 'done', triggeredAt: Date.now() };
          }
          return s;
        }

        // ---- RUG GUARD (full) ----
        if (s.strategy === 'rug-guard') {
          const base = s.riskBaseline ?? 50;
          const jitter = Math.round((Math.random() - 0.35) * 14);
          const riskNow = Math.max(0, Math.min(100, base + jitter));
          if (riskNow >= (s.value ?? 75)) {
            changed = true;
            toast(`🛡️ Rug Guard tripped · sold ${s.name} (risk ${riskNow})`);
            return { ...s, riskNow, status: 'triggered', triggeredAt: Date.now() };
          }
          changed = true;
          return { ...s, riskNow };
        }

        // ---- everything else: light random fire ----
        if (s.status === 'watching' && Math.random() < 0.14) {
          changed = true;
          const kind = STRATEGY_MAP[s.strategy]?.kind;
          toast(`🎯 Sniper hit · ${kind === 'sell' ? 'sold' : 'bought'} ${s.quantity} ${s.name}`);
          return { ...s, status: 'triggered', triggeredAt: Date.now() };
        }
        return s;
      });

      if (changed) { writeSnipers(next); setSnipers(next); }
    }, ADVANCE_MS);
    return () => clearInterval(id);
  }, []);

  const stop   = (id: string) => persist(snipers.map(s => s.id === id ? { ...s, status: 'stopped' } : s));
  const resume = (id: string) => persist(snipers.map(s => s.id === id ? { ...s, status: 'watching' } : s));
  const remove = (id: string) => persist(snipers.filter(s => s.id !== id));

  const openNew = () => gate(() => setEditing(true));

  const save = (draft: SniperT) => {
    persist([draft, ...snipers]);
    setEditing(false);
    toast(`Sniper armed · ${STRATEGY_MAP[draft.strategy].label} on ${draft.name}`);
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(220,38,38,0.85)', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', fontFamily: 'var(--font-mono), monospace' }}>
            <Crosshair size={12} /> Sniper Bot
          </div>
          <button
            onClick={() => setInfoOpen(true)}
            aria-label="How it works"
            style={{ width: 24, height: 24, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.75)', cursor: 'pointer', padding: 0 }}
          >
            <Info size={13} />
          </button>
        </div>
        <h1 style={{ margin: '8px 0 6px', fontSize: 24, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
          Snipe, flip &amp; <span className="text-sunset">auto-exit</span>
        </h1>
        <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
          Eleven strategies across buy, flip and sell. Set the rule, set the cap —
          the bot watches and prepares the trade. Your wallet signs.
        </p>
        <button className="btn-blood" style={{ marginTop: 14, padding: '10px 18px', fontSize: 13 }} onClick={openNew}>
          <Plus size={13} /> <span>New sniper</span>
        </button>
      </div>

      {/* List */}
      {snipers.length === 0 ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 16 }}>
          <Crosshair size={32} style={{ color: 'rgba(255,255,255,0.25)', marginBottom: 10 }} />
          <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13 }}>
            No snipers yet. Hit <strong style={{ color: '#fff' }}>New sniper</strong> to arm one.
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {snipers.map(s => (
            <SniperCard key={s.id} s={s} onStop={() => stop(s.id)} onResume={() => resume(s.id)} onRemove={() => remove(s.id)} />
          ))}
        </div>
      )}

      {editing && <SniperForm onCancel={() => setEditing(false)} onSave={save} />}
      {infoOpen && <SniperInfo onClose={() => setInfoOpen(false)} />}
    </div>
  );
}

function SniperCard({ s, onStop, onResume, onRemove }: {
  s: SniperT; onStop: () => void; onResume: () => void; onRemove: () => void;
}) {
  const meta = STRATEGY_MAP[s.strategy];
  const statusMap = {
    watching:  { color: 'var(--up)',            pulse: true,  label: s.strategy === 'flip' && s.leg === 'holding' ? 'Holding' : 'Watching' },
    triggered: { color: '#fbbf24',              pulse: false, label: 'Triggered' },
    stopped:   { color: 'rgba(255,255,255,0.4)', pulse: false, label: 'Stopped' },
    done:      { color: 'var(--up)',            pulse: false, label: 'Sold' },
  };
  const stat = statusMap[s.status];
  const kindColor = KIND_COLOR[meta?.kind ?? 'buy'];

  const flipPnl = s.strategy === 'flip' && s.sellFill && s.buyFill
    ? +(s.sellFill - s.buyFill).toFixed(3) : null;

  return (
    <div style={{ padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: `hsl(${(s.slug.charCodeAt(0) * 23) % 360} 70% 45%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 14, flexShrink: 0 }}>
          {s.name.slice(0, 2).toUpperCase()}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>{s.name}</span>
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '1px 6px', borderRadius: 5, background: `${kindColor}26`, color: kindColor, fontFamily: 'var(--font-mono), monospace' }}>
              {meta?.label}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, color: stat.color, fontFamily: 'var(--font-mono), monospace', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              <span className={stat.pulse ? 'pulse-dot' : ''} style={{ width: 6, height: 6, borderRadius: 999, background: stat.color, display: 'inline-block' }} />
              {stat.label}
            </span>
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-mono), monospace', marginTop: 3 }}>
            {summary(s)}
          </div>
        </div>
      </div>

      {/* Flip legs */}
      {s.strategy === 'flip' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, fontSize: 11, fontFamily: 'var(--font-mono), monospace' }}>
          <Leg active={true} done={!!s.buyFill} label="BUY" value={`${s.maxPrice} Ξ`} color="#22c55e" />
          <ChevronRight size={12} style={{ color: 'rgba(255,255,255,0.3)' }} />
          <Leg active={!!s.buyFill} done={!!s.sellFill} label="RELIST" value={s.sellFill ? `${s.sellFill} Ξ` : `+${s.value}%`} color="#fbbf24" />
          {flipPnl !== null && (
            <span style={{ marginLeft: 'auto', color: flipPnl >= 0 ? 'var(--up)' : 'var(--down)', fontWeight: 800 }}>
              {flipPnl >= 0 ? '+' : ''}{flipPnl} Ξ
            </span>
          )}
        </div>
      )}

      {/* Rug-guard risk gauge */}
      {s.strategy === 'rug-guard' && (
        <div style={{ marginTop: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontFamily: 'var(--font-mono), monospace', color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
            <span>Risk now {s.riskNow ?? s.riskBaseline ?? '—'}/100</span>
            <span>Trips at {s.value}</span>
          </div>
          <div style={{ height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', position: 'relative' }}>
            <div style={{ height: '100%', width: `${s.riskNow ?? s.riskBaseline ?? 0}%`, background: (s.riskNow ?? 0) >= (s.value ?? 75) ? '#ef4444' : 'linear-gradient(90deg,#22c55e,#fbbf24,#f97316)' }} />
            <div style={{ position: 'absolute', top: -2, bottom: -2, left: `${s.value}%`, width: 2, background: '#fff' }} />
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, fontSize: 10, fontFamily: 'var(--font-mono), monospace', color: 'rgba(255,255,255,0.45)' }}>
        <span>gas: <strong style={{ color: '#fff' }}>{s.gas}</strong>  ·  net: <strong style={{ color: '#fff' }}>{s.network}</strong></span>
        <div style={{ display: 'flex', gap: 6 }}>
          {s.status === 'watching' ? (
            <button onClick={onStop} title="Pause" style={iconBtnStyle}><Pause size={13} /></button>
          ) : s.status === 'stopped' ? (
            <button onClick={onResume} title="Resume" style={iconBtnStyle}><Zap size={13} /></button>
          ) : null}
          <button onClick={onRemove} title="Remove" style={{ ...iconBtnStyle, color: 'rgba(239,68,68,0.8)' }}><Trash2 size={13} /></button>
        </div>
      </div>
    </div>
  );
}

function Leg({ active, done, label, value, color }: { active: boolean; done: boolean; label: string; value: string; color: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, opacity: active ? 1 : 0.4 }}>
      <span style={{ width: 7, height: 7, borderRadius: 999, background: done ? color : 'transparent', border: `1.5px solid ${color}` }} />
      <span style={{ color: 'rgba(255,255,255,0.7)' }}>{label}</span>
      <span style={{ color: '#fff', fontWeight: 700 }}>{value}</span>
    </span>
  );
}

const iconBtnStyle: React.CSSProperties = {
  width: 28, height: 28, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8, color: 'rgba(255,255,255,0.75)', cursor: 'pointer',
};

function SniperForm({ onCancel, onSave }: { onCancel: () => void; onSave: (s: SniperT) => void }) {
  const [step, setStep] = useState<'target' | 'strategy' | 'config'>('target');
  const [target, setTarget] = useState<Collection | null>(null);
  const [strategy, setStrategy] = useState<StrategyId | null>(null);
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<Collection[]>([]);
  const [value, setValue] = useState('');
  const [wallet, setWallet] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [gas, setGas] = useState<SniperT['gas']>('fast');
  const [network, setNetwork] = useState<SniperT['network']>('ethereum');

  const meta = strategy ? STRATEGY_MAP[strategy] : null;

  // Search results: curated + OpenSea fallback
  useEffect(() => {
    const q = search.trim().toLowerCase();
    if (!q) { setSuggestions(COLLECTIONS.slice(0, 8)); setSearching(false); return; }
    const local = COLLECTIONS.filter(c =>
      c.ticker.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q));
    setSuggestions(local);
    if (local.length === 0) {
      setSearching(true);
      const t = setTimeout(async () => {
        const r = await searchOpenSea(q);
        setSearching(false);
        if (r) setSuggestions([r]);
      }, 450);
      return () => clearTimeout(t);
    } else setSearching(false);
  }, [search]);

  const pickTarget = async (c: Collection) => {
    const live = await fetchOpenSeaCollection(c);
    setTarget(live);
    setStep('strategy');
  };

  const pickStrategy = (id: StrategyId) => {
    setStrategy(id);
    const m = STRATEGY_MAP[id];
    const floor = target?.floor ?? 1;
    // Seed sensible defaults.
    let v = '';
    if (m.valueUnit === 'eth') {
      v = (id === 'buy-floor'   ? floor * 0.9
        : id === 'take-profit'  ? floor * 1.5
        : id === 'stop-loss'    ? floor * 0.7
        : id === 'offer-accept' ? floor * 1.1
        : floor).toFixed(2);
    } else if (m.valueUnit === 'pct') {
      v = (id === 'flip' ? '15' : id === 'trailing-stop' ? '15' : '10');
    } else if (m.valueUnit === 'score') {
      v = '75';
    }
    setValue(v);
    setMaxPrice((m.kind === 'sell' ? floor * 0.98 : floor * 1.02).toFixed(2));
    setStep('config');
  };

  const needsValue = !!meta?.valueUnit;
  const needsWallet = meta?.extra === 'wallet';

  const canSave =
    !!target && !!strategy &&
    parseFloat(maxPrice) > 0 &&
    (!needsValue || parseFloat(value) > 0) &&
    (!needsWallet || /^0x[a-fA-F0-9]{40}$/.test(wallet.trim())) &&
    quantity > 0;

  const submit = () => {
    if (!target || !strategy || !canSave) return;
    const draft: SniperT = {
      id: Date.now().toString(),
      slug: target.slug,
      name: target.name,
      strategy,
      value: needsValue ? parseFloat(value) : undefined,
      watchWallet: needsWallet ? wallet.trim() : undefined,
      maxPrice: parseFloat(maxPrice),
      quantity,
      gas, network,
      createdAt: Date.now(),
      status: 'watching',
      leg: strategy === 'flip' ? 'buying' : undefined,
      riskBaseline: strategy === 'rug-guard' ? collectionRiskScore(target.slug, target.supply) : undefined,
    };
    onSave(draft);
  };

  const grouped: Record<StrategyKind, typeof STRATEGIES> = {
    buy: STRATEGIES.filter(s => s.kind === 'buy'),
    flip: STRATEGIES.filter(s => s.kind === 'flip'),
    sell: STRATEGIES.filter(s => s.kind === 'sell'),
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 90, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
      onClick={onCancel}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="slide-up"
        style={{ width: '100%', maxWidth: 480, background: '#05030a', borderTop: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px 20px 0 0', padding: '14px 14px', paddingBottom: 'max(20px, env(safe-area-inset-bottom))', maxHeight: '92vh', overflowY: 'auto' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Crosshair size={16} className="text-sunset" />
            <span style={{ fontSize: 14, fontWeight: 800 }}>
              {step === 'target' ? 'Pick a target' : step === 'strategy' ? 'Pick a strategy' : 'Configure'}
            </span>
          </div>
          <button onClick={onCancel} aria-label="Close" style={{ ...iconBtnStyle, width: 30, height: 30 }}><X size={14} /></button>
        </div>

        {/* STEP 1 — target */}
        {step === 'target' && (
          <>
            <div style={{ position: 'relative', marginBottom: 8 }}>
              <SearchIcon size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
              <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by slug or name…" autoCapitalize="off" autoCorrect="off" spellCheck={false}
                style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 16, fontFamily: 'var(--font-mono), monospace', outline: 'none' }}
              />
            </div>
            {searching && <div style={{ padding: '8px', fontSize: 11, textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-mono), monospace' }}>Searching OpenSea…</div>}
            <div style={{ maxHeight: '60vh', overflowY: 'auto', marginTop: 4 }}>
              {suggestions.map(c => (
                <button key={c.slug} onClick={() => pickTarget(c)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 6px', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', textAlign: 'left' }}>
                  <Thumb collection={c} size={40} radius={10} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ color: '#fff', fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                    <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, fontFamily: 'var(--font-mono), monospace' }}>{c.ticker} · {c.floor > 0 ? `${c.floor.toFixed(2)} Ξ floor` : 'no floor'}</div>
                  </div>
                  <ChevronRight size={16} style={{ color: 'rgba(255,255,255,0.3)' }} />
                </button>
              ))}
              {!searching && suggestions.length === 0 && <div style={{ padding: '16px', textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>No matches.</div>}
            </div>
          </>
        )}

        {/* STEP 2 — strategy */}
        {step === 'strategy' && target && (
          <>
            <TargetChip target={target} onChange={() => setStep('target')} />
            {(['buy', 'flip', 'sell'] as StrategyKind[]).map(kind => (
              <div key={kind} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: KIND_COLOR[kind], fontFamily: 'var(--font-mono), monospace', marginBottom: 6 }}>
                  {kind}
                </div>
                <div style={{ display: 'grid', gap: 6 }}>
                  {grouped[kind].map(st => (
                    <button key={st.id} onClick={() => pickStrategy(st.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', textAlign: 'left' }}>
                      <span style={{ flexShrink: 0, color: KIND_COLOR[kind] }}>{stratIcon(st.id)}</span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>{st.label}</span>
                          {st.full && <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.1em', padding: '1px 5px', borderRadius: 4, background: 'rgba(34,197,94,0.2)', color: 'var(--up)' }}>LIVE</span>}
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 1 }}>{st.blurb}</div>
                      </div>
                      <ChevronRight size={15} style={{ color: 'rgba(255,255,255,0.3)' }} />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}

        {/* STEP 3 — config */}
        {step === 'config' && target && meta && (
          <>
            <TargetChip target={target} onChange={() => setStep('strategy')} chipLabel={meta.label} />

            {needsValue && (
              <>
                <Label>{meta.valueLabel}{meta.valueUnit === 'eth' ? ' (Ξ)' : meta.valueUnit === 'pct' ? ' (%)' : ' (0–100)'}</Label>
                <NumInput value={value} onChange={setValue} placeholder={meta.valueUnit === 'eth' ? 'e.g. 39.50' : meta.valueUnit === 'score' ? 'e.g. 75' : 'e.g. 15'} />
              </>
            )}

            {needsWallet && (
              <>
                <Label>Wallet to copy</Label>
                <input value={wallet} onChange={e => setWallet(e.target.value)} placeholder="0x…" autoCapitalize="off" autoCorrect="off" spellCheck={false}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 16, fontFamily: 'var(--font-mono), monospace', outline: 'none', marginBottom: 12 }} />
              </>
            )}

            <Label>{meta.kind === 'sell' ? 'Min accept per item (Ξ)' : meta.id === 'flip' ? 'Buy at or below (Ξ)' : 'Max price per item (Ξ)'}</Label>
            <NumInput value={maxPrice} onChange={setMaxPrice} placeholder="e.g. 42.00" />

            <Label>Quantity</Label>
            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
              {[1, 2, 4, 8].map(n => (
                <button key={n} onClick={() => setQuantity(n)}
                  style={{ flex: 1, padding: '10px 0', borderRadius: 999, background: quantity === n ? 'rgba(34,197,94,0.5)' : 'rgba(16, 88, 50, 0.4)', border: quantity === n ? '2px solid var(--up)' : '1px solid rgba(34,197,94,0.4)', color: quantity === n ? '#fff' : 'var(--up)', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-mono), monospace' }}>
                  {n}
                </button>
              ))}
            </div>

            <Label>Gas priority</Label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 12 }}>
              {(['standard', 'fast', 'instant'] as const).map(g => <Toggle key={g} active={gas === g} onClick={() => setGas(g)} label={g.toUpperCase()} />)}
            </div>

            <Label>Network</Label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 14 }}>
              {(['ethereum', 'base'] as const).map(n => <Toggle key={n} active={network === n} onClick={() => setNetwork(n)} label={n.toUpperCase()} />)}
            </div>

            <div style={{ padding: '10px 12px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 12, fontSize: 11, color: 'rgba(255,255,255,0.7)', display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 14 }}>
              <ShieldCheck size={14} style={{ color: 'var(--up)', flexShrink: 0, marginTop: 1 }} />
              <span>When triggered, your wallet signs the {meta.kind === 'sell' ? 'sale' : meta.id === 'flip' ? 'buy & relist' : 'buy'}. Nothing executes without your approval.</span>
            </div>

            <button className="btn-blood" disabled={!canSave} onClick={submit}
              style={{ width: '100%', padding: '14px 0', fontSize: 14, opacity: canSave ? 1 : 0.5, cursor: canSave ? 'pointer' : 'not-allowed' }}>
              <span>Arm {meta.label}</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function stratIcon(id: StrategyId) {
  const sz = 16;
  switch (id) {
    case 'snipe-mint':      return <Target size={sz} />;
    case 'buy-floor':       return <ArrowDownUp size={sz} />;
    case 'buy-underpriced': return <Zap size={sz} />;
    case 'whale-copy':      return <MousePointerClick size={sz} />;
    case 'dump-cascade':    return <ArrowDownUp size={sz} />;
    case 'flip':            return <Repeat size={sz} />;
    case 'take-profit':     return <Target size={sz} />;
    case 'stop-loss':       return <ShieldAlert size={sz} />;
    case 'trailing-stop':   return <ArrowDownUp size={sz} />;
    case 'rug-guard':       return <ShieldCheck size={sz} />;
    case 'offer-accept':    return <BellRing size={sz} />;
    default:                return <Target size={sz} />;
  }
}

function TargetChip({ target, onChange, chipLabel }: { target: Collection; onChange: () => void; chipLabel?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, marginBottom: 14 }}>
      <Thumb collection={target} size={36} radius={10} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ color: '#fff', fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{target.name}</div>
        <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, fontFamily: 'var(--font-mono), monospace' }}>
          {chipLabel ? `${chipLabel} · ` : ''}Floor {target.floor.toFixed(2)} Ξ
        </div>
      </div>
      <button onClick={onChange} style={{ ...iconBtnStyle, padding: '4px 10px', width: 'auto', fontSize: 10, fontFamily: 'var(--font-mono), monospace' }}>CHANGE</button>
    </div>
  );
}

function SniperInfo({ onClose }: { onClose: () => void }) {
  const steps = [
    { icon: <Target size={16} />,            title: 'Pick a target', body: 'Any collection — from the list or by searching OpenSea.' },
    { icon: <MousePointerClick size={16} />, title: 'Pick a strategy', body: '11 plays across buy, flip and sell — from mint snipes to stop-losses.' },
    { icon: <Zap size={16} />,               title: 'Set your cap',   body: 'Price, quantity, gas. Each strategy seeds smart defaults off the live floor.' },
    { icon: <BellRing size={16} />,          title: 'It watches',     body: 'The bot watches floor, listings, offers and on-chain risk 24/7.' },
    { icon: <ShieldCheck size={16} />,       title: 'You approve',    body: 'Your wallet signs the final trade — nothing spends without your tap.' },
  ];
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 95, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', padding: 16 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="fade-in" style={{ width: '100%', maxWidth: 400, background: '#0a0512', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 18, padding: 18, maxHeight: '86vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Crosshair size={18} className="text-sunset" />
            <span style={{ fontSize: 17, fontWeight: 900, letterSpacing: '-0.02em' }}>How sniping works</span>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ ...iconBtnStyle, width: 30, height: 30 }}><X size={15} /></button>
        </div>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
          A sniper is a saved order that triggers itself. <strong style={{ color: '#fff' }}>Flip Bot</strong> and{' '}
          <strong style={{ color: '#fff' }}>Rug Guard</strong> run live today; the rest are armed and ready for the
          stream feed.
        </p>
        <div style={{ display: 'grid', gap: 12 }}>
          {steps.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)', color: '#fbbf24' }}>{s.icon}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono), monospace', marginRight: 6 }}>{i + 1}</span>{s.title}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, marginTop: 2 }}>{s.body}</div>
              </div>
            </div>
          ))}
        </div>
        <button className="btn-blood" style={{ width: '100%', marginTop: 16, padding: '12px 0', fontSize: 14 }} onClick={onClose}>
          <span>Got it</span>
        </button>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.16em', fontFamily: 'var(--font-mono), monospace', marginBottom: 6, marginTop: 2 }}>{children}</div>;
}

function Toggle({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick}
      style={{ padding: '9px 6px', borderRadius: 10, background: active ? 'rgba(34,197,94,0.18)' : 'rgba(255,255,255,0.04)', border: active ? '1px solid var(--up)' : '1px solid rgba(255,255,255,0.08)', color: active ? 'var(--up)' : 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', cursor: 'pointer', fontFamily: 'var(--font-mono), monospace' }}>
      {label}
    </button>
  );
}

function NumInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input type="text" inputMode="decimal" value={value} onChange={e => onChange(e.target.value.replace(/[^0-9.]/g, ''))} placeholder={placeholder}
      style={{ width: '100%', padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 16, fontFamily: 'var(--font-mono), monospace', outline: 'none', marginBottom: 12 }} />
  );
}
