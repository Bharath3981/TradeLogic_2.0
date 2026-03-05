import { useEffect, useState } from 'react';
import { useScreenerStore } from '../store/useScreenerStore';
import type { ScreenerStock, SRLevel } from '../api/screener';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function getScoreColor(score: number) {
    if (score >= 75) return '#00ff88';
    if (score >= 60) return '#00d4ff';
    if (score >= 45) return '#ffcc00';
    return '#ff8800';
}
function getRecoColor(r: string) {
    if (r === 'STRONG BUY') return '#00ff88';
    if (r === 'BUY')        return '#00d4ff';
    if (r === 'WATCH')      return '#ffcc00';
    return '#888';
}
function getSigColor(s: string) {
    if (['bullish','surge','near_high','strong','uptrend'].includes(s)) return '#00ff88';
    if (['bearish','near_low','weak','downtrend'].includes(s))          return '#ff3355';
    return '#ffcc00';
}

// ─── Indicator Badge ──────────────────────────────────────────────────────────
function Badge({ label, signal, value }: { label: string; signal: string; value?: string }) {
    const c = getSigColor(signal);
    return (
        <span style={{ display:'inline-flex', alignItems:'center', padding:'2px 8px', borderRadius:'4px', background:`${c}18`, border:`1px solid ${c}40`, color:c, fontSize:'11px', fontFamily:'monospace', whiteSpace:'nowrap' }}>
            {label}{value ? `: ${value}` : ''}
        </span>
    );
}

// ─── S/R Level Bar ────────────────────────────────────────────────────────────
function SRBar({ level, currentPrice, rangeMin, rangeMax }: { level: SRLevel; currentPrice: number; rangeMin: number; rangeMax: number }) {
    const range  = rangeMax - rangeMin;
    const pct    = range > 0 ? ((level.price - rangeMin) / range) * 100 : 50;
    const color  = level.type === 'support' ? '#00ff88' : '#ff3355';
    const width  = level.strength === 'strong' ? 3 : level.strength === 'moderate' ? 2 : 1;
    return (
        <div style={{ position:'relative', height:'18px', display:'flex', alignItems:'center' }}>
            <div style={{ position:'absolute', left:`${Math.min(Math.max(pct,2),98)}%`, top:0, bottom:0, width:`${width}px`, background:color, opacity:0.7, transform:'translateX(-50%)' }} />
            <span style={{ position:'absolute', left:`${Math.min(Math.max(pct,2),95)}%`, fontSize:'9px', color, fontFamily:'monospace', whiteSpace:'nowrap', paddingLeft:'4px' }}>
                ₹{fmt(level.price)} {level.source === 'swing' ? `(${level.touchCount}x)` : `[${level.source}]`}
            </span>
        </div>
    );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function DetailModal({ stock, onClose }: { stock: ScreenerStock; onClose: () => void }) {
    const ind   = stock.indicators;
    const sr    = ind.supportResistance;
    const pp    = ind.pivotPoints;
    const price = stock.currentPrice;

    // Range for S/R chart
    const allPrices = [sr.nearestSupport * 0.97, sr.nearestResistance * 1.03, price];
    const rangeMin  = Math.min(...allPrices);
    const rangeMax  = Math.max(...allPrices);

    const scoreColor = getScoreColor(stock.score);

    const row = (label: string, value: string, color?: string) => (
        <div style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderBottom:'1px solid #1a2a38' }}>
            <span style={{ fontSize:'12px', color:'#4a6478', fontFamily:'monospace' }}>{label}</span>
            <span style={{ fontSize:'12px', color: color || '#c8dde8', fontFamily:'monospace', fontWeight:500 }}>{value}</span>
        </div>
    );

    return (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }} onClick={onClose}>
            <div style={{ background:'#101820', border:'1px solid #1a2a38', borderTop:`2px solid ${scoreColor}`, borderRadius:'16px', maxWidth:'720px', width:'100%', maxHeight:'90vh', overflowY:'auto', padding:'2rem' }} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.5rem' }}>
                    <div>
                        <div style={{ fontFamily:'monospace', fontWeight:900, fontSize:'1.8rem', color:'#e8eef4', letterSpacing:'0.06em' }}>{stock.symbol}</div>
                        <div style={{ color:'#4a6478', fontSize:'13px' }}>{stock.name} · {stock.sector}</div>
                        <div style={{ color:getRecoColor(stock.recommendation), fontFamily:'monospace', fontSize:'12px', fontWeight:700, marginTop:'4px', letterSpacing:'0.1em' }}>{stock.recommendation}</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                        <div style={{ fontFamily:'monospace', fontSize:'2rem', fontWeight:900, color:scoreColor }}>{stock.score}</div>
                        <div style={{ fontSize:'10px', color:'#4a6478', fontFamily:'monospace' }}>SCORE / 100</div>
                        <div style={{ fontSize:'1.1rem', color:'#c8dde8', fontFamily:'monospace', marginTop:'4px' }}>₹{fmt(price)}</div>
                        <button onClick={onClose} style={{ marginTop:'8px', background:'#1a2a38', border:'1px solid #2a3a48', color:'#c8dde8', borderRadius:'6px', padding:'4px 12px', cursor:'pointer', fontSize:'12px' }}>✕ Close</button>
                    </div>
                </div>

                {/* Grid layout */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem' }}>

                    {/* LEFT — Core Indicators */}
                    <div>
                        <div style={{ fontFamily:'monospace', fontSize:'10px', letterSpacing:'0.2em', color:'#00d4ff', textTransform:'uppercase', marginBottom:'8px' }}>// Core Indicators</div>
                        {row('RSI (14)',       `${ind.rsi.value}`,                         getSigColor(ind.rsi.signal))}
                        {row('MACD Hist',      `${ind.macd.histogram > 0 ? '+' : ''}${ind.macd.histogram.toFixed(2)}`, getSigColor(ind.macd.signal))}
                        {row('EMA 20',         `₹${fmt(ind.ema.ema20)}`,                   getSigColor(ind.ema.signal))}
                        {row('EMA 50',         `₹${fmt(ind.ema.ema50)}`)}
                        {row('EMA 200',        `₹${fmt(ind.ema.ema200)}`)}
                        {row('BB Upper',       `₹${fmt(ind.bollingerBands.upper)}`)}
                        {row('BB Lower',       `₹${fmt(ind.bollingerBands.lower)}`)}
                        {row('ADX (14)',        `${ind.adx.value}`,                         getSigColor(ind.adx.signal))}
                        {row('Stoch %K / %D',  `${ind.stochastic.k} / ${ind.stochastic.d}`,getSigColor(ind.stochastic.signal))}
                        {row('ATR (14)',        `₹${fmt(ind.atr.value)} (${ind.atr.pct}%)`)}
                        {row('Volume Ratio',   `${ind.volume.ratio.toFixed(2)}x`,           getSigColor(ind.volume.signal))}
                        {row('Trend',          `${ind.trendStrength.direction} / ${ind.trendStrength.strength}`, getSigColor(ind.trendStrength.direction))}
                        {row('Candle Pattern', ind.candlePattern.pattern,                   getSigColor(ind.candlePattern.signal))}
                        {row('52W High',       `₹${fmt(ind.fiftyTwoWeek.high)} (${ind.fiftyTwoWeek.currentPct.toFixed(1)}%)`)}
                    </div>

                    {/* RIGHT — S/R + Pivot Points */}
                    <div>
                        <div style={{ fontFamily:'monospace', fontSize:'10px', letterSpacing:'0.2em', color:'#00d4ff', textTransform:'uppercase', marginBottom:'8px' }}>// Support & Resistance</div>
                        {row('Nearest Support',    `₹${fmt(sr.nearestSupport)}`,    '#00ff88')}
                        {row('Nearest Resistance', `₹${fmt(sr.nearestResistance)}`, '#ff3355')}
                        {row('Risk:Reward',         `${sr.riskRewardRatio}x`,         sr.riskRewardRatio >= 2 ? '#00ff88' : sr.riskRewardRatio >= 1.5 ? '#ffcc00' : '#ff8800')}
                        {row('Price Position',      sr.pricePosition.replace('_', ' ').toUpperCase(), getSigColor(sr.signal))}

                        {/* S/R visual chart */}
                        <div style={{ marginTop:'12px', marginBottom:'8px' }}>
                            <div style={{ fontFamily:'monospace', fontSize:'10px', color:'#4a6478', marginBottom:'4px' }}>S/R MAP (price ◆)</div>
                            <div style={{ position:'relative', height:'8px', background:'#1a2a38', borderRadius:'4px', marginBottom:'20px' }}>
                                {/* Current price marker */}
                                <div style={{ position:'absolute', left:`${Math.min(Math.max(((price-rangeMin)/(rangeMax-rangeMin))*100,2),98)}%`, top:'-4px', color:'#ffcc00', fontSize:'14px', transform:'translateX(-50%)', fontFamily:'monospace' }}>◆</div>
                            </div>
                            {/* S/R level lines */}
                            <div style={{ position:'relative', height:`${Math.min(sr.levels.length * 20, 200)}px`, background:'#0c1218', borderRadius:'4px', overflow:'hidden', padding:'4px 0' }}>
                                {sr.levels.slice(0, 10).map((l, i) => (
                                    <SRBar key={i} level={l} currentPrice={price} rangeMin={rangeMin} rangeMax={rangeMax} />
                                ))}
                            </div>
                        </div>

                        {/* Pivot Points */}
                        <div style={{ fontFamily:'monospace', fontSize:'10px', letterSpacing:'0.2em', color:'#00d4ff', textTransform:'uppercase', margin:'12px 0 8px' }}>// Pivot Points</div>
                        {row('R3', `₹${fmt(pp.r3)}`, '#ff3355')}
                        {row('R2', `₹${fmt(pp.r2)}`, '#ff6677')}
                        {row('R1', `₹${fmt(pp.r1)}`, '#ff9999')}
                        {row('PP (Pivot)', `₹${fmt(pp.pp)}`, '#ffcc00')}
                        {row('S1', `₹${fmt(pp.s1)}`, '#88ff99')}
                        {row('S2', `₹${fmt(pp.s2)}`, '#00ff88')}
                        {row('S3', `₹${fmt(pp.s3)}`, '#00cc66')}
                    </div>
                </div>

                {/* Bullish Signals */}
                {stock.signals.length > 0 && (
                    <div style={{ marginTop:'1.5rem', borderTop:'1px solid #1a2a38', paddingTop:'1rem' }}>
                        <div style={{ fontFamily:'monospace', fontSize:'10px', letterSpacing:'0.2em', color:'#00d4ff', textTransform:'uppercase', marginBottom:'8px' }}>// Active Signals</div>
                        {stock.signals.map((s, i) => (
                            <div key={i} style={{ fontSize:'12px', color:'#4a7a5a', fontFamily:'monospace', padding:'3px 0' }}>✓ {s}</div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Stock Card ───────────────────────────────────────────────────────────────
function StockCard({ stock, onClick }: { stock: ScreenerStock; onClick: () => void }) {
    const scoreColor = getScoreColor(stock.score);
    const recoColor  = getRecoColor(stock.recommendation);
    const ind        = stock.indicators;
    const sr         = ind.supportResistance;

    return (
        <div onClick={onClick} style={{ background:'#101820', border:`1px solid #1a2a38`, borderTop:`2px solid ${scoreColor}`, borderRadius:'12px', padding:'1.25rem', cursor:'pointer', transition:'transform 0.2s, box-shadow 0.2s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform='translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow='0 8px 32px rgba(0,0,0,0.5)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform='translateY(0)';   (e.currentTarget as HTMLDivElement).style.boxShadow='none'; }}>

            {/* Top row */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'0.75rem' }}>
                <div>
                    <div style={{ fontFamily:'monospace', fontWeight:700, fontSize:'1.1rem', color:'#e8eef4', letterSpacing:'0.06em' }}>{stock.symbol}</div>
                    <div style={{ fontSize:'12px', color:'#4a6478', marginTop:'2px' }}>{stock.name}</div>
                    <div style={{ display:'inline-block', marginTop:'4px', padding:'2px 8px', background:'#1a2a38', borderRadius:'100px', fontSize:'11px', color:'#4a8aaa', fontFamily:'monospace' }}>{stock.sector}</div>
                </div>
                <div style={{ textAlign:'center' }}>
                    <div style={{ fontFamily:'monospace', fontWeight:900, fontSize:'2rem', lineHeight:1, color:scoreColor }}>{stock.score}</div>
                    <div style={{ fontSize:'10px', color:'#4a6478', fontFamily:'monospace', letterSpacing:'0.1em', marginTop:'2px' }}>SCORE</div>
                </div>
            </div>

            {/* Price + Reco */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.75rem' }}>
                <div style={{ fontFamily:'monospace', fontSize:'1rem', color:'#c8dde8' }}>₹{fmt(stock.currentPrice)}</div>
                <div style={{ padding:'3px 10px', borderRadius:'100px', background:`${recoColor}18`, border:`1px solid ${recoColor}50`, color:recoColor, fontSize:'11px', fontFamily:'monospace', fontWeight:700 }}>{stock.recommendation}</div>
            </div>

            {/* Score bar */}
            <div style={{ height:'3px', background:'#1a2a38', borderRadius:'2px', overflow:'hidden', marginBottom:'0.75rem' }}>
                <div style={{ height:'100%', width:`${stock.score}%`, background:`linear-gradient(90deg,${scoreColor},${scoreColor}88)`, borderRadius:'2px' }} />
            </div>

            {/* Core indicator badges */}
            <div style={{ display:'flex', flexWrap:'wrap', gap:'4px', marginBottom:'0.75rem' }}>
                <Badge label="RSI"   signal={ind.rsi.signal}            value={ind.rsi.value.toFixed(0)} />
                <Badge label="MACD"  signal={ind.macd.signal} />
                <Badge label="EMA"   signal={ind.ema.signal} />
                <Badge label="ADX"   signal={ind.adx.signal}            value={ind.adx.value.toFixed(0)} />
                <Badge label="STOCH" signal={ind.stochastic.signal}     value={ind.stochastic.k.toFixed(0)} />
                <Badge label="VOL"   signal={ind.volume.signal}         value={`${ind.volume.ratio.toFixed(1)}x`} />
                <Badge label={ind.candlePattern.pattern !== 'None' ? ind.candlePattern.pattern : 'CANDLE'} signal={ind.candlePattern.signal} />
            </div>

            {/* S/R Summary */}
            <div style={{ background:'#0c1218', borderRadius:'6px', padding:'8px 10px', marginBottom:'0.75rem' }}>
                <div style={{ fontFamily:'monospace', fontSize:'9px', color:'#4a6478', letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:'4px' }}>Support / Resistance</div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div style={{ textAlign:'center' }}>
                        <div style={{ fontSize:'10px', color:'#4a6478', fontFamily:'monospace' }}>SUPPORT</div>
                        <div style={{ fontSize:'13px', color:'#00ff88', fontFamily:'monospace', fontWeight:700 }}>₹{fmt(sr.nearestSupport)}</div>
                    </div>
                    <div style={{ textAlign:'center' }}>
                        <div style={{ fontSize:'10px', color:'#4a6478', fontFamily:'monospace' }}>R:R</div>
                        <div style={{ fontSize:'13px', color: sr.riskRewardRatio >= 2 ? '#00ff88' : sr.riskRewardRatio >= 1.5 ? '#ffcc00' : '#ff8800', fontFamily:'monospace', fontWeight:700 }}>{sr.riskRewardRatio}x</div>
                    </div>
                    <div style={{ textAlign:'center' }}>
                        <div style={{ fontSize:'10px', color:'#4a6478', fontFamily:'monospace' }}>RESISTANCE</div>
                        <div style={{ fontSize:'13px', color:'#ff3355', fontFamily:'monospace', fontWeight:700 }}>₹{fmt(sr.nearestResistance)}</div>
                    </div>
                </div>
                {/* Mini S/R position bar */}
                <div style={{ marginTop:'6px', height:'4px', background:'#1a2a38', borderRadius:'2px', position:'relative', overflow:'visible' }}>
                    <div style={{ position:'absolute', height:'4px', background:'linear-gradient(90deg,#00ff8840,#ff335540)', borderRadius:'2px', left:0, right:0 }} />
                    <div style={{
                        position:'absolute',
                        left:`${Math.min(Math.max(((stock.currentPrice - sr.nearestSupport) / (sr.nearestResistance - sr.nearestSupport || 1)) * 100, 2), 98)}%`,
                        top:'-3px', width:'10px', height:'10px',
                        background:'#ffcc00', borderRadius:'50%',
                        transform:'translateX(-50%)',
                        boxShadow:'0 0 6px rgba(255,204,0,0.8)',
                    }} />
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', marginTop:'2px' }}>
                    <span style={{ fontSize:'9px', color:'#4a6478', fontFamily:'monospace' }}>S</span>
                    <span style={{ fontSize:'9px', color:'#ffcc00', fontFamily:'monospace' }}>◆ {sr.pricePosition.replace('_',' ')}</span>
                    <span style={{ fontSize:'9px', color:'#4a6478', fontFamily:'monospace' }}>R</span>
                </div>
            </div>

            {/* Pivot + Trend row */}
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:'11px', fontFamily:'monospace', color:'#4a6478', marginBottom:'0.5rem' }}>
                <span>PP: <span style={{ color:'#ffcc00' }}>₹{fmt(ind.pivotPoints.pp)}</span></span>
                <span>Trend: <span style={{ color:getSigColor(ind.trendStrength.direction) }}>{ind.trendStrength.direction} / {ind.trendStrength.strength}</span></span>
                <span>ATR: <span style={{ color:'#c8dde8' }}>{ind.atr.pct}%</span></span>
            </div>

            {/* Signals */}
            {stock.signals.length > 0 && (
                <div style={{ borderTop:'1px solid #1a2a38', paddingTop:'0.5rem' }}>
                    {stock.signals.slice(0,2).map((s,i) => (
                        <div key={i} style={{ fontSize:'11px', color:'#4a7a5a', fontFamily:'monospace', marginBottom:'2px' }}>✓ {s}</div>
                    ))}
                    {stock.signals.length > 2 && (
                        <div style={{ fontSize:'11px', color:'#00d4ff', fontFamily:'monospace', cursor:'pointer' }}>+ {stock.signals.length - 2} more — click to view</div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Main Screener Page ───────────────────────────────────────────────────────
const sel: React.CSSProperties = { width:'100%', background:'#101820', border:'1px solid #1a2a38', borderRadius:'6px', color:'#c8dde8', fontFamily:'monospace', fontSize:'13px', padding:'0.5rem 0.75rem', cursor:'pointer', outline:'none' };

export function Screener() {
    const { result, sectors, isScanning, error, selectedSector, minScore, limit, runScan, fetchSectors, setSelectedSector, setMinScore, setLimit } = useScreenerStore();
    const [selected, setSelected] = useState<ScreenerStock | null>(null);

    useEffect(() => { fetchSectors(); }, [fetchSectors]);

    const fmtDuration = (ms: number) => ms >= 1000 ? `${(ms/1000).toFixed(1)}s` : `${ms}ms`;

    return (
        <div style={{ padding:'1.5rem', background:'#040608', minHeight:'100vh', color:'#c8dde8' }}>

            {selected && <DetailModal stock={selected} onClose={() => setSelected(null)} />}

            {/* Header */}
            <div style={{ marginBottom:'1.5rem', borderBottom:'1px solid #1a2a38', paddingBottom:'1rem' }}>
                <div style={{ fontFamily:'monospace', fontSize:'11px', letterSpacing:'0.25em', color:'#00d4ff', marginBottom:'4px', textTransform:'uppercase' }}>// Technical Analysis</div>
                <h1 style={{ fontFamily:'monospace', fontWeight:900, fontSize:'1.8rem', letterSpacing:'0.04em', color:'#e8eef4' }}>Futures <span style={{ color:'#00d4ff' }}>Screener</span></h1>
                <p style={{ color:'#4a6478', fontSize:'13px', marginTop:'4px' }}>RSI · MACD · EMA · Bollinger · ADX · Stochastic · ATR · Support/Resistance · Pivot Points · Candlestick Patterns</p>
            </div>

            {/* Controls */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px,1fr))', gap:'1rem', background:'#0c1218', border:'1px solid #1a2a38', borderRadius:'12px', padding:'1.25rem', marginBottom:'1.5rem' }}>
                <div>
                    <label style={{ display:'block', fontFamily:'monospace', fontSize:'10px', letterSpacing:'0.15em', color:'#4a6478', textTransform:'uppercase', marginBottom:'6px' }}>Sector</label>
                    <select value={selectedSector} onChange={e => setSelectedSector(e.target.value)} style={sel}>
                        {sectors.length ? sectors.map(s => <option key={s} value={s}>{s}</option>) : <option value="ALL">ALL</option>}
                    </select>
                </div>
                <div>
                    <label style={{ display:'block', fontFamily:'monospace', fontSize:'10px', letterSpacing:'0.15em', color:'#4a6478', textTransform:'uppercase', marginBottom:'6px' }}>Min Score: {minScore}</label>
                    <select value={minScore} onChange={e => setMinScore(Number(e.target.value))} style={sel}>
                        {[20,30,40,50,60,70].map(v => <option key={v} value={v}>{v}+</option>)}
                    </select>
                </div>
                <div>
                    <label style={{ display:'block', fontFamily:'monospace', fontSize:'10px', letterSpacing:'0.15em', color:'#4a6478', textTransform:'uppercase', marginBottom:'6px' }}>Show Top</label>
                    <select value={limit} onChange={e => setLimit(Number(e.target.value))} style={sel}>
                        {[10,20,30,50].map(v => <option key={v} value={v}>Top {v}</option>)}
                    </select>
                </div>
                <div style={{ display:'flex', alignItems:'flex-end' }}>
                    <button onClick={runScan} disabled={isScanning} style={{ width:'100%', padding:'0.6rem 1rem', background: isScanning ? 'transparent' : 'rgba(0,212,255,0.08)', border:'1px solid #00d4ff', borderRadius:'8px', color:'#00d4ff', fontFamily:'monospace', fontSize:'12px', fontWeight:700, letterSpacing:'0.15em', textTransform:'uppercase', cursor: isScanning ? 'not-allowed' : 'pointer', opacity: isScanning ? 0.6 : 1 }}>
                        {isScanning ? '⟳ SCANNING...' : '▶ RUN SCAN'}
                    </button>
                </div>
            </div>

            {/* Scanning indicator */}
            {isScanning && (
                <div style={{ background:'#0c1218', border:'1px solid #1a2a38', borderRadius:'8px', padding:'1rem 1.25rem', marginBottom:'1.5rem', fontFamily:'monospace', fontSize:'12px', color:'#00d4ff', display:'flex', alignItems:'center', gap:'10px' }}>
                    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                    <div style={{ width:'12px', height:'12px', border:'2px solid rgba(0,212,255,0.3)', borderTopColor:'#00d4ff', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
                    Fetching 1yr historical data · Computing 10 technical indicators per stock · Building S/R levels...
                </div>
            )}

            {/* Error */}
            {error && <div style={{ background:'rgba(255,51,85,0.08)', border:'1px solid rgba(255,51,85,0.3)', borderRadius:'8px', padding:'1rem 1.25rem', marginBottom:'1.5rem', color:'#ff3355', fontFamily:'monospace', fontSize:'13px' }}>⚠ {error}</div>}

            {/* Results meta */}
            {result && !isScanning && (
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem', flexWrap:'wrap', gap:'0.5rem' }}>
                    <div style={{ fontFamily:'monospace', fontSize:'11px', color:'#4a6478' }}>
                        <span style={{ color:'#00d4ff' }}>{result.stocks.length}</span> stocks found · {result.totalScanned} scanned · {fmtDuration(result.scanDurationMs)}
                    </div>
                    <div style={{ fontFamily:'monospace', fontSize:'11px', color:'#4a6478' }}>Click any card for full S/R + indicator detail</div>
                </div>
            )}

            {/* Empty state */}
            {!result && !isScanning && !error && (
                <div style={{ textAlign:'center', padding:'5rem 2rem', color:'#4a6478', fontFamily:'monospace', fontSize:'13px' }}>
                    <div style={{ fontSize:'2rem', marginBottom:'1rem', opacity:0.4 }}>◎</div>
                    Configure filters and click RUN SCAN to find bullish futures opportunities
                </div>
            )}

            {/* Stock grid */}
            {result && result.stocks.length > 0 && (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px,1fr))', gap:'1rem' }}>
                    {result.stocks.map(stock => <StockCard key={stock.symbol} stock={stock} onClick={() => setSelected(stock)} />)}
                </div>
            )}

            {result && result.stocks.length === 0 && !isScanning && (
                <div style={{ textAlign:'center', padding:'4rem 2rem', color:'#4a6478', fontFamily:'monospace', fontSize:'13px' }}>No stocks matched filters. Try lowering the minimum score.</div>
            )}

            <div style={{ marginTop:'2.5rem', padding:'0.75rem 1rem', background:'rgba(255,51,85,0.04)', border:'1px solid rgba(255,51,85,0.15)', borderRadius:'8px', fontSize:'11px', color:'#4a6478', fontFamily:'monospace' }}>
                ⚠ Educational purposes only. Not financial advice. Futures trading involves substantial risk of loss. Always use stop-losses.
            </div>
        </div>
    );
}
