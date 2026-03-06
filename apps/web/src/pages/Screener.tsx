import { useEffect, useState } from 'react';
import {
    Box, Paper, Typography, Button, Select, MenuItem, FormControl,
    InputLabel, Chip, CircularProgress, Alert, Dialog, DialogContent,
    DialogTitle, IconButton, Table, TableBody, TableCell, TableHead,
    TableRow, LinearProgress, Grid,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useTheme } from '@mui/material/styles';
import { useScreenerStore } from '../store/useScreenerStore';
import type { ScreenerStock, SRLevel, FuturesContract } from '../api/screener';
import { screenerApi } from '../api/screener';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function getScoreColor(score: number) {
    if (score >= 75) return '#4caf50';
    if (score >= 60) return '#64b5f6';
    if (score >= 45) return '#ffa726';
    return '#ef5350';
}
function getRecoColor(r: string) {
    if (r === 'STRONG BUY') return '#4caf50';
    if (r === 'BUY')        return '#64b5f6';
    if (r === 'WATCH')      return '#ffa726';
    return '#9e9e9e';
}
function getSigColor(s: string) {
    if (['bullish','surge','near_high','strong','uptrend','strong_bullish','moderate_bullish','accumulation'].includes(s)) return '#4caf50';
    if (['bearish','near_low','weak','downtrend','strong_bearish','distribution'].includes(s)) return '#ef5350';
    return '#ffa726';
}

// ─── Indicator Badge ──────────────────────────────────────────────────────────
function Badge({ label, signal, value }: { label: string; signal: string; value?: string }) {
    const c = getSigColor(signal);
    return (
        <Chip
            label={value ? `${label}: ${value}` : label}
            size="small"
            sx={{
                background: `${c}18`,
                border: `1px solid ${c}40`,
                color: c,
                fontSize: '11px',
                fontFamily: 'monospace',
                height: '22px',
            }}
        />
    );
}

// ─── S/R Level Bar ────────────────────────────────────────────────────────────
function SRBar({ level, rangeMin, rangeMax }: { level: SRLevel; currentPrice: number; rangeMin: number; rangeMax: number }) {
    const range  = rangeMax - rangeMin;
    const pct    = range > 0 ? ((level.price - rangeMin) / range) * 100 : 50;
    const color  = level.type === 'support' ? '#4caf50' : '#ef5350';
    const width  = level.strength === 'strong' ? 3 : level.strength === 'moderate' ? 2 : 1;
    return (
        <Box sx={{ position: 'relative', height: '18px', display: 'flex', alignItems: 'center' }}>
            <Box sx={{ position: 'absolute', left: `${Math.min(Math.max(pct, 2), 98)}%`, top: 0, bottom: 0, width: `${width}px`, background: color, opacity: 0.7, transform: 'translateX(-50%)' }} />
            <Typography sx={{ position: 'absolute', left: `${Math.min(Math.max(pct, 2), 95)}%`, fontSize: '9px', color, fontFamily: 'monospace', whiteSpace: 'nowrap', pl: '4px' }}>
                ₹{fmt(level.price)} {level.source === 'swing' ? `(${level.touchCount}x)` : `[${level.source}]`}
            </Typography>
        </Box>
    );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function DetailModal({ stock, onClose }: { stock: ScreenerStock; onClose: () => void }) {
    const theme = useTheme();
    const ind   = stock.indicators;
    const sr    = ind.supportResistance;
    const pp    = ind.pivotPoints;
    const price = stock.currentPrice;

    const [futures, setFutures]               = useState<FuturesContract[]>([]);
    const [futuresLoading, setFuturesLoading] = useState(true);

    useEffect(() => {
        setFuturesLoading(true);
        screenerApi.getUpcomingFutures(stock.symbol)
            .then(res => setFutures(res.data.data))
            .catch(() => setFutures([]))
            .finally(() => setFuturesLoading(false));
    }, [stock.symbol]);

    const allPrices = [sr.nearestSupport * 0.97, sr.nearestResistance * 1.03, price];
    const rangeMin  = Math.min(...allPrices);
    const rangeMax  = Math.max(...allPrices);
    const scoreColor = getScoreColor(stock.score);

    const DataRow = ({ label, value, color }: { label: string; value: string; color?: string }) => (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', py: '4px', borderBottom: `1px solid ${theme.palette.divider}` }}>
            <Typography sx={{ fontSize: '12px', color: 'text.secondary', fontFamily: 'monospace' }}>{label}</Typography>
            <Typography sx={{ fontSize: '12px', color: color || 'text.primary', fontFamily: 'monospace', fontWeight: 500 }}>{value}</Typography>
        </Box>
    );

    return (
        <Dialog open onClose={onClose} maxWidth="md" fullWidth slotProps={{ paper: { sx: { borderTop: `3px solid ${scoreColor}`, bgcolor: 'background.paper' } } }}>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pb: 1 }}>
                <Box>
                    <Typography variant="h5" sx={{ fontFamily: 'monospace', fontWeight: 900, letterSpacing: '0.06em' }}>{stock.symbol}</Typography>
                    <Typography variant="body2" color="text.secondary">{stock.name} · {stock.sector}</Typography>
                    <Typography sx={{ color: getRecoColor(stock.recommendation), fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, mt: '4px', letterSpacing: '0.1em' }}>
                        {stock.recommendation}
                    </Typography>
                </Box>
                <Box sx={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                    <Typography sx={{ fontFamily: 'monospace', fontSize: '2rem', fontWeight: 900, color: scoreColor, lineHeight: 1 }}>{stock.score}</Typography>
                    <Typography sx={{ fontSize: '10px', color: 'text.secondary', fontFamily: 'monospace' }}>SCORE / 100</Typography>
                    <Typography sx={{ fontSize: '1.1rem', fontFamily: 'monospace' }}>₹{fmt(price)}</Typography>
                    <IconButton onClick={onClose} size="small"><CloseIcon fontSize="small" /></IconButton>
                </Box>
            </DialogTitle>
            <DialogContent dividers>
                <Grid container spacing={2}>
                    {/* LEFT — Core Indicators */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography sx={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.2em', color: 'primary.main', textTransform: 'uppercase', mb: 1 }}>// Core Indicators</Typography>
                        <DataRow label="RSI (14)"       value={`${ind.rsi.value}`}                                          color={getSigColor(ind.rsi.signal)} />
                        <DataRow label="MACD Hist"      value={`${ind.macd.histogram > 0 ? '+' : ''}${ind.macd.histogram.toFixed(2)} (${ind.macd.momentum})`} color={getSigColor(ind.macd.signal)} />
                        <DataRow label="EMA 20"         value={`₹${fmt(ind.ema.ema20)}`}                                    color={getSigColor(ind.ema.signal)} />
                        <DataRow label="EMA 50"         value={`₹${fmt(ind.ema.ema50)}`} />
                        <DataRow label="EMA 200"        value={`₹${fmt(ind.ema.ema200)}`} />
                        <DataRow label="BB Upper"       value={`₹${fmt(ind.bollingerBands.upper)}`} />
                        <DataRow label="BB Lower"       value={`₹${fmt(ind.bollingerBands.lower)}`} />
                        <DataRow label="ADX (14)"       value={`${ind.adx.value}  +DI: ${ind.adx.plusDI} / -DI: ${ind.adx.minusDI}`} color={getSigColor(ind.adx.signal)} />
                        <DataRow label="Stoch %K / %D"  value={`${ind.stochastic.k} / ${ind.stochastic.d}`}                 color={getSigColor(ind.stochastic.signal)} />
                        <DataRow label="ATR (14)"       value={`₹${fmt(ind.atr.value)} (${ind.atr.pct}%)`} />
                        <DataRow label="Volume"         value={`${ind.volume.ratio.toFixed(2)}x — ${ind.volume.direction}`}  color={getSigColor(ind.volume.direction)} />
                        <DataRow label="Trend"          value={`${ind.trendStrength.direction} / ${ind.trendStrength.strength}`} color={getSigColor(ind.trendStrength.direction)} />
                        <DataRow label="Candle Pattern" value={ind.candlePattern.pattern}                                   color={getSigColor(ind.candlePattern.signal)} />
                        <DataRow label="52W High"       value={`₹${fmt(ind.fiftyTwoWeek.high)} (${ind.fiftyTwoWeek.currentPct.toFixed(1)}%)${ind.fiftyTwoWeek.isBreakout ? ' 🔥 BREAKOUT' : ''}`} color={ind.fiftyTwoWeek.isBreakout ? '#4caf50' : undefined} />
                    </Grid>

                    {/* RIGHT — S/R + Pivot Points */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography sx={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.2em', color: 'primary.main', textTransform: 'uppercase', mb: 1 }}>// Support & Resistance</Typography>
                        <DataRow label="Nearest Support"    value={`₹${fmt(sr.nearestSupport)}`}    color="#4caf50" />
                        <DataRow label="Nearest Resistance" value={`₹${fmt(sr.nearestResistance)}`} color="#ef5350" />
                        <DataRow label="Risk:Reward"        value={`${sr.riskRewardRatio}x`}         color={sr.riskRewardRatio >= 2 ? '#4caf50' : sr.riskRewardRatio >= 1.5 ? '#ffa726' : '#ef5350'} />
                        <DataRow label="Price Position"     value={sr.pricePosition.replace('_', ' ').toUpperCase()} color={getSigColor(sr.signal)} />

                        {/* S/R visual chart */}
                        <Box sx={{ mt: 1.5, mb: 1 }}>
                            <Typography sx={{ fontFamily: 'monospace', fontSize: '10px', color: 'text.disabled', mb: '4px' }}>S/R MAP (price ◆)</Typography>
                            <Box sx={{ position: 'relative', height: '8px', bgcolor: 'action.hover', borderRadius: 1, mb: '20px' }}>
                                <Box sx={{
                                    position: 'absolute',
                                    left: `${Math.min(Math.max(((price - rangeMin) / (rangeMax - rangeMin)) * 100, 2), 98)}%`,
                                    top: '-4px', color: '#ffa726', fontSize: '14px',
                                    transform: 'translateX(-50%)', fontFamily: 'monospace', lineHeight: 1,
                                }}>◆</Box>
                            </Box>
                            <Box sx={{ position: 'relative', height: `${Math.min(sr.levels.length * 20, 200)}px`, bgcolor: 'background.default', borderRadius: 1, overflow: 'hidden', p: '4px 0' }}>
                                {sr.levels.slice(0, 10).map((l, i) => (
                                    <SRBar key={i} level={l} currentPrice={price} rangeMin={rangeMin} rangeMax={rangeMax} />
                                ))}
                            </Box>
                        </Box>

                        {/* Pivot Points */}
                        <Typography sx={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.2em', color: 'primary.main', textTransform: 'uppercase', mt: 1.5, mb: 1 }}>// Pivot Points</Typography>
                        <DataRow label="R3" value={`₹${fmt(pp.r3)}`} color="#ef5350" />
                        <DataRow label="R2" value={`₹${fmt(pp.r2)}`} color="#e57373" />
                        <DataRow label="R1" value={`₹${fmt(pp.r1)}`} color="#ef9a9a" />
                        <DataRow label="PP (Pivot)" value={`₹${fmt(pp.pp)}`} color="#ffa726" />
                        <DataRow label="S1" value={`₹${fmt(pp.s1)}`} color="#a5d6a7" />
                        <DataRow label="S2" value={`₹${fmt(pp.s2)}`} color="#4caf50" />
                        <DataRow label="S3" value={`₹${fmt(pp.s3)}`} color="#388e3c" />
                    </Grid>
                </Grid>

                {/* Active Signals */}
                {stock.signals.length > 0 && (
                    <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                        <Typography sx={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.2em', color: 'primary.main', textTransform: 'uppercase', mb: 1 }}>// Active Signals</Typography>
                        {stock.signals.map((s, i) => (
                            <Typography key={i} sx={{ fontSize: '12px', color: '#4caf50', fontFamily: 'monospace', py: '3px' }}>✓ {s}</Typography>
                        ))}
                    </Box>
                )}

                {/* Upcoming Futures Contracts */}
                <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                    <Typography sx={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.2em', color: 'primary.main', textTransform: 'uppercase', mb: 1.5 }}>// Upcoming Futures Contracts</Typography>
                    {futuresLoading ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CircularProgress size={16} />
                            <Typography variant="body2" color="text.secondary">Loading futures...</Typography>
                        </Box>
                    ) : futures.length === 0 ? (
                        <Alert severity="info" variant="outlined" sx={{ fontSize: '12px' }}>No upcoming futures found. Ensure instruments are synced.</Alert>
                    ) : (
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    {['Symbol', 'Expiry', 'Days', 'Lot Size', 'LTP'].map(h => (
                                        <TableCell key={h} sx={{ fontFamily: 'monospace', fontSize: '11px', color: 'text.secondary', letterSpacing: '0.1em', textTransform: 'uppercase', py: 0.75 }}>{h}</TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {futures.map((f, i) => {
                                    const expDate  = new Date(f.expiry);
                                    const daysLeft = Math.ceil((expDate.getTime() - Date.now()) / 86400000);
                                    const dayColor = daysLeft <= 7 ? '#ef5350' : daysLeft <= 30 ? '#ffa726' : '#4caf50';
                                    return (
                                        <TableRow key={i} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                                            <TableCell sx={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 600, py: 0.75 }}>{f.tradingsymbol}</TableCell>
                                            <TableCell sx={{ fontFamily: 'monospace', fontSize: '11px', color: 'text.secondary', py: 0.75 }}>{expDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}</TableCell>
                                            <TableCell sx={{ fontFamily: 'monospace', fontSize: '11px', color: dayColor, fontWeight: 700, py: 0.75 }}>{daysLeft}d</TableCell>
                                            <TableCell sx={{ fontFamily: 'monospace', fontSize: '11px', color: 'text.secondary', py: 0.75 }}>{f.lot_size ?? '—'}</TableCell>
                                            <TableCell sx={{ fontFamily: 'monospace', fontSize: '11px', color: 'text.secondary', py: 0.75 }}>{f.last_price ? `₹${fmt(f.last_price)}` : '—'}</TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </Box>
            </DialogContent>
        </Dialog>
    );
}

// ─── Stock Card ───────────────────────────────────────────────────────────────
function StockCard({ stock, onClick }: { stock: ScreenerStock; onClick: () => void }) {
    const scoreColor = getScoreColor(stock.score);
    const recoColor  = getRecoColor(stock.recommendation);
    const ind        = stock.indicators;
    const sr         = ind.supportResistance;

    return (
        <Paper
            onClick={onClick}
            elevation={2}
            sx={{
                borderTop: `2px solid ${scoreColor}`,
                p: 2,
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: 8 },
            }}
        >
            {/* Top row */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Box>
                    <Typography sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1.1rem', letterSpacing: '0.06em' }}>{stock.symbol}</Typography>
                    <Typography variant="caption" color="text.secondary">{stock.name}</Typography>
                    <Box sx={{ mt: 0.5 }}>
                        <Chip label={stock.sector} size="small" sx={{ fontSize: '11px', fontFamily: 'monospace', height: '20px' }} />
                    </Box>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                    <Typography sx={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '2rem', lineHeight: 1, color: scoreColor }}>{stock.score}</Typography>
                    <Typography sx={{ fontSize: '10px', color: 'text.secondary', fontFamily: 'monospace', letterSpacing: '0.1em', mt: '2px' }}>SCORE</Typography>
                </Box>
            </Box>

            {/* Price + Reco */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography sx={{ fontFamily: 'monospace', fontSize: '1rem' }}>₹{fmt(stock.currentPrice)}</Typography>
                <Chip label={stock.recommendation} size="small" sx={{ background: `${recoColor}18`, border: `1px solid ${recoColor}50`, color: recoColor, fontFamily: 'monospace', fontWeight: 700, height: '24px' }} />
            </Box>

            {/* Score bar */}
            <LinearProgress variant="determinate" value={stock.score} sx={{ mb: 1.5, height: 3, borderRadius: 1, bgcolor: 'action.hover', '& .MuiLinearProgress-bar': { bgcolor: scoreColor } }} />

            {/* Core indicator badges */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '4px', mb: 1.5 }}>
                <Badge label="RSI"   signal={ind.rsi.signal}            value={ind.rsi.value.toFixed(0)} />
                <Badge label="MACD"  signal={ind.macd.signal}           value={ind.macd.momentum === 'expanding' ? '▲' : ind.macd.momentum === 'contracting' ? '▼' : '—'} />
                <Badge label="EMA"   signal={ind.ema.signal} />
                <Badge label="ADX"   signal={ind.adx.signal}            value={ind.adx.value.toFixed(0)} />
                <Badge label="STOCH" signal={ind.stochastic.signal}     value={ind.stochastic.k.toFixed(0)} />
                <Badge label="VOL"   signal={ind.volume.direction !== 'neutral' ? ind.volume.direction : ind.volume.signal} value={`${ind.volume.ratio.toFixed(1)}x`} />
                {ind.fiftyTwoWeek.isBreakout && <Badge label="52W BREAKOUT" signal="bullish" />}
                <Badge label={ind.candlePattern.pattern !== 'None' ? ind.candlePattern.pattern : 'CANDLE'} signal={ind.candlePattern.signal} />
            </Box>

            {/* S/R Summary */}
            <Paper variant="outlined" sx={{ p: 1, mb: 1.5, bgcolor: 'background.default' }}>
                <Typography sx={{ fontFamily: 'monospace', fontSize: '9px', color: 'text.disabled', letterSpacing: '0.15em', textTransform: 'uppercase', mb: 0.5 }}>Support / Resistance</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography sx={{ fontSize: '10px', color: 'text.secondary', fontFamily: 'monospace' }}>SUPPORT</Typography>
                        <Typography sx={{ fontSize: '13px', color: '#4caf50', fontFamily: 'monospace', fontWeight: 700 }}>₹{fmt(sr.nearestSupport)}</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography sx={{ fontSize: '10px', color: 'text.secondary', fontFamily: 'monospace' }}>R:R</Typography>
                        <Typography sx={{ fontSize: '13px', color: sr.riskRewardRatio >= 2 ? '#4caf50' : sr.riskRewardRatio >= 1.5 ? '#ffa726' : '#ef5350', fontFamily: 'monospace', fontWeight: 700 }}>{sr.riskRewardRatio}x</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                        <Typography sx={{ fontSize: '10px', color: 'text.secondary', fontFamily: 'monospace' }}>RESISTANCE</Typography>
                        <Typography sx={{ fontSize: '13px', color: '#ef5350', fontFamily: 'monospace', fontWeight: 700 }}>₹{fmt(sr.nearestResistance)}</Typography>
                    </Box>
                </Box>
                {/* Mini S/R position bar */}
                <Box sx={{ mt: 0.75, height: '4px', bgcolor: 'action.hover', borderRadius: 1, position: 'relative', overflow: 'visible' }}>
                    <Box sx={{ position: 'absolute', height: '4px', background: 'linear-gradient(90deg,rgba(76,175,80,0.25),rgba(239,83,80,0.25))', borderRadius: 1, left: 0, right: 0 }} />
                    <Box sx={{
                        position: 'absolute',
                        left: `${Math.min(Math.max(((stock.currentPrice - sr.nearestSupport) / (sr.nearestResistance - sr.nearestSupport || 1)) * 100, 2), 98)}%`,
                        top: '-3px', width: '10px', height: '10px',
                        bgcolor: '#ffa726', borderRadius: '50%',
                        transform: 'translateX(-50%)',
                        boxShadow: '0 0 6px rgba(255,167,38,0.8)',
                    }} />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: '2px' }}>
                    <Typography sx={{ fontSize: '9px', color: 'text.disabled', fontFamily: 'monospace' }}>S</Typography>
                    <Typography sx={{ fontSize: '9px', color: '#ffa726', fontFamily: 'monospace' }}>◆ {sr.pricePosition.replace('_', ' ')}</Typography>
                    <Typography sx={{ fontSize: '9px', color: 'text.disabled', fontFamily: 'monospace' }}>R</Typography>
                </Box>
            </Paper>

            {/* Pivot + Trend row */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                <Typography sx={{ fontSize: '11px', fontFamily: 'monospace', color: 'text.secondary' }}>PP: <span style={{ color: '#ffa726' }}>₹{fmt(ind.pivotPoints.pp)}</span></Typography>
                <Typography sx={{ fontSize: '11px', fontFamily: 'monospace', color: 'text.secondary' }}>Trend: <span style={{ color: getSigColor(ind.trendStrength.direction) }}>{ind.trendStrength.direction} / {ind.trendStrength.strength}</span></Typography>
                <Typography sx={{ fontSize: '11px', fontFamily: 'monospace', color: 'text.secondary' }}>ATR: {ind.atr.pct}%</Typography>
            </Box>

            {/* Signals */}
            {stock.signals.length > 0 && (
                <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 0.75 }}>
                    {stock.signals.slice(0, 2).map((s, i) => (
                        <Typography key={i} sx={{ fontSize: '11px', color: '#4caf50', fontFamily: 'monospace', mb: '2px' }}>✓ {s}</Typography>
                    ))}
                    {stock.signals.length > 2 && (
                        <Typography sx={{ fontSize: '11px', color: 'primary.main', fontFamily: 'monospace', cursor: 'pointer' }}>+ {stock.signals.length - 2} more — click to view</Typography>
                    )}
                </Box>
            )}
        </Paper>
    );
}

// ─── Main Screener Page ───────────────────────────────────────────────────────
export function Screener() {
    const { result, sectors, isScanning, error, selectedSector, minScore, limit, runScan, fetchSectors, setSelectedSector, setMinScore, setLimit } = useScreenerStore();
    const [selected, setSelected] = useState<ScreenerStock | null>(null);

    useEffect(() => { fetchSectors(); }, [fetchSectors]);

    const fmtDuration = (ms: number) => ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;

    return (
        <Box sx={{ px: 3, pt: 3, pb: 4 }}>

            {selected && <DetailModal stock={selected} onClose={() => setSelected(null)} />}

            {/* Header */}
            <Box sx={{ mb: 3, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography sx={{ fontFamily: 'monospace', fontSize: '11px', letterSpacing: '0.25em', color: 'primary.main', mb: '4px', textTransform: 'uppercase' }}>// Technical Analysis</Typography>
                <Typography variant="h4" sx={{ fontFamily: 'monospace', fontWeight: 900, letterSpacing: '0.04em' }}>
                    Futures <Box component="span" sx={{ color: 'primary.main' }}>Screener</Box>
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    RSI · MACD · EMA · Bollinger · ADX · Stochastic · ATR · Support/Resistance · Pivot Points · Candlestick Patterns
                </Typography>
            </Box>

            {/* Controls */}
            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="flex-end">
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel sx={{ fontFamily: 'monospace', fontSize: '12px' }}>Sector</InputLabel>
                            <Select value={selectedSector} label="Sector" onChange={e => setSelectedSector(e.target.value)} sx={{ fontFamily: 'monospace', fontSize: '13px' }}>
                                {sectors.length ? sectors.map(s => <MenuItem key={s} value={s} sx={{ fontFamily: 'monospace', fontSize: '13px' }}>{s}</MenuItem>) : <MenuItem value="ALL">ALL</MenuItem>}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel sx={{ fontFamily: 'monospace', fontSize: '12px' }}>Min Score: {minScore}</InputLabel>
                            <Select value={minScore} label={`Min Score: ${minScore}`} onChange={e => setMinScore(Number(e.target.value))} sx={{ fontFamily: 'monospace', fontSize: '13px' }}>
                                {[20, 30, 40, 50, 60, 70].map(v => <MenuItem key={v} value={v} sx={{ fontFamily: 'monospace', fontSize: '13px' }}>{v}+</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel sx={{ fontFamily: 'monospace', fontSize: '12px' }}>Show Top</InputLabel>
                            <Select value={limit} label="Show Top" onChange={e => setLimit(Number(e.target.value))} sx={{ fontFamily: 'monospace', fontSize: '13px' }}>
                                {[10, 20, 30, 50].map(v => <MenuItem key={v} value={v} sx={{ fontFamily: 'monospace', fontSize: '13px' }}>Top {v}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Button fullWidth variant="outlined" onClick={runScan} disabled={isScanning} sx={{ fontFamily: 'monospace', letterSpacing: '0.15em', fontWeight: 700 }}>
                            {isScanning ? '⟳ SCANNING...' : '▶ RUN SCAN'}
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {/* Scanning indicator */}
            {isScanning && (
                <Paper variant="outlined" sx={{ p: 1.5, mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <CircularProgress size={16} />
                    <Typography sx={{ fontFamily: 'monospace', fontSize: '12px', color: 'text.secondary' }}>
                        Fetching 1yr historical data · Computing 10 technical indicators per stock · Building S/R levels...
                    </Typography>
                </Paper>
            )}

            {/* Error */}
            {error && <Alert severity="error" sx={{ mb: 3 }}>⚠ {error}</Alert>}

            {/* Results meta */}
            {result && !isScanning && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                    <Typography sx={{ fontFamily: 'monospace', fontSize: '11px', color: 'text.secondary' }}>
                        <Box component="span" sx={{ color: 'primary.main' }}>{result.stocks.length}</Box> stocks found · {result.totalScanned} scanned · {fmtDuration(result.scanDurationMs)}
                    </Typography>
                    <Typography sx={{ fontFamily: 'monospace', fontSize: '11px', color: 'text.secondary' }}>Click any card for full S/R + indicator detail</Typography>
                </Box>
            )}

            {/* Empty state */}
            {!result && !isScanning && !error && (
                <Box sx={{ textAlign: 'center', py: 10, color: 'text.disabled' }}>
                    <Typography sx={{ fontSize: '2rem', mb: 1, opacity: 0.4 }}>◎</Typography>
                    <Typography sx={{ fontFamily: 'monospace', fontSize: '13px' }}>Configure filters and click RUN SCAN to find bullish futures opportunities</Typography>
                </Box>
            )}

            {/* Stock grid */}
            {result && result.stocks.length > 0 && (
                <Grid container spacing={2}>
                    {result.stocks.map(stock => (
                        <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={stock.symbol}>
                            <StockCard stock={stock} onClick={() => setSelected(stock)} />
                        </Grid>
                    ))}
                </Grid>
            )}

            {result && result.stocks.length === 0 && !isScanning && (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Typography sx={{ fontFamily: 'monospace', fontSize: '13px', color: 'text.disabled' }}>No stocks matched filters. Try lowering the minimum score.</Typography>
                </Box>
            )}

            <Alert severity="warning" variant="outlined" sx={{ mt: 4, fontFamily: 'monospace', fontSize: '11px' }}>
                Educational purposes only. Not financial advice. Futures trading involves substantial risk of loss. Always use stop-losses.
            </Alert>
        </Box>
    );
}
