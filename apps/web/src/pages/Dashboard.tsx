import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import LinearProgress from '@mui/material/LinearProgress';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import { useTheme, alpha } from '@mui/material/styles';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TableChartIcon from '@mui/icons-material/TableChart';
import SearchIcon from '@mui/icons-material/Search';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import DonutLargeIcon from '@mui/icons-material/DonutLarge';
import {
    ResponsiveContainer,
    PieChart, Pie, Cell,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
    ReferenceLine, LabelList,
} from 'recharts';
import { useAuthStore }      from '../store/useAuthStore';
import { useMarketStore }    from '../store/useMarketStore';
import { usePortfolioStore } from '../store/usePortfolioStore';
import { useScreenerStore }  from '../store/useScreenerStore';
import type { Holding, Position, Margin } from '../types';
import {
    NIFTY_TOKEN,
    BANK_NIFTY_TOKEN,
    INDIA_VIX_TOKEN,
} from '../hooks/useKiteTicker';

// ─── Colour palettes ──────────────────────────────────────────────────────────

const CHART_COLORS = [
    '#6366f1', '#22c55e', '#f59e0b', '#3b82f6', '#ec4899',
    '#14b8a6', '#f97316', '#8b5cf6', '#06b6d4', '#84cc16',
];

const UP_COLOR   = '#22c55e';
const DOWN_COLOR = '#ef4444';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number, d = 2) {
    return n.toLocaleString('en-IN', { maximumFractionDigits: d, minimumFractionDigits: d });
}
function fmtCr(n: number): string {
    const abs = Math.abs(n);
    const sign = n < 0 ? '-' : '';
    if (abs >= 1e7) return `${sign}₹${(abs / 1e7).toFixed(2)} Cr`;
    if (abs >= 1e5) return `${sign}₹${(abs / 1e5).toFixed(2)} L`;
    return `${sign}₹${fmt(abs)}`;
}
function fmtShort(n: number): string {
    const abs = Math.abs(n);
    const sign = n < 0 ? '-' : '';
    if (abs >= 1e7) return `${sign}₹${(abs / 1e7).toFixed(1)}Cr`;
    if (abs >= 1e5) return `${sign}₹${(abs / 1e5).toFixed(1)}L`;
    if (abs >= 1e3) return `${sign}₹${(abs / 1e3).toFixed(1)}K`;
    return `${sign}₹${abs.toFixed(0)}`;
}

function vixColor(v: number)  { return v < 12 ? '#22c55e' : v < 15 ? '#86efac' : v < 18 ? '#facc15' : v < 22 ? '#fb923c' : '#ef4444'; }
function vixLabel(v: number)  { return v < 12 ? 'Calm' : v < 15 ? 'Normal' : v < 18 ? 'Cautious' : v < 22 ? 'Fearful' : 'Panic'; }
function biasBadge(vix: number, ok: boolean): { label: string; color: string } {
    if (!ok)      return { label: 'CONNECT KITE',       color: '#64748b' };
    if (vix === 0) return { label: 'LOADING…',          color: '#64748b' };
    if (vix < 15)  return { label: 'BULLISH',           color: '#22c55e' };
    if (vix < 18)  return { label: 'CAUTIOUSLY BEARISH',color: '#facc15' };
    if (vix < 22)  return { label: 'BEARISH',           color: '#fb923c' };
    return              { label: 'STRONGLY BEARISH',color: '#ef4444' };
}
function recColor(r: string) {
    return r === 'STRONG BUY' ? '#22c55e' : r === 'BUY' ? '#86efac' : r === 'WATCH' ? '#facc15' : '#94a3b8';
}

// ─── Section wrapper ───────────────────────────────────────────────────────────

function Section({ title, icon, children, action }: {
    title: string; icon?: React.ReactNode;
    children: React.ReactNode; action?: React.ReactNode;
}) {
    return (
        <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {icon && <Box sx={{ color: 'text.disabled', display: 'flex' }}>{icon}</Box>}
                    <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 2 }}>
                        {title}
                    </Typography>
                </Box>
                {action}
            </Box>
            {children}
        </Box>
    );
}

// ─── Chart Paper ──────────────────────────────────────────────────────────────

function ChartCard({ title, sub, children, height = 240 }: {
    title: string; sub?: string; children: React.ReactNode; height?: number;
}) {
    const theme  = useTheme();
    const isDark = theme.palette.mode === 'dark';
    return (
        <Paper sx={{
            p: 2, borderRadius: 2, height: '100%',
            background: isDark ? 'rgba(30,30,40,0.65)' : 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(8px)',
            border: '1px solid', borderColor: 'divider',
        }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.25 }}>{title}</Typography>
            {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
            <Box sx={{ height, mt: 1 }}>{children}</Box>
        </Paper>
    );
}

// ─── Index Card ───────────────────────────────────────────────────────────────

function IndexCard({ label, ltp, change, isVix = false, connected }: {
    label: string; ltp: number; change?: number; isVix?: boolean; connected: boolean;
}) {
    const theme  = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const chg    = change ?? 0;
    const pos    = chg >= 0;
    const vc     = isVix && ltp > 0 ? vixColor(ltp) : undefined;
    const pc     = isVix ? vc : (pos ? UP_COLOR : DOWN_COLOR);
    return (
        <Paper sx={{
            p: 2.5, borderRadius: 2, height: '100%',
            background: isDark ? 'rgba(30,30,40,0.65)' : 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(8px)',
            border: '1px solid',
            borderColor: isVix && ltp > 0 ? `${vc}55` : 'divider',
        }}>
            <Typography variant="caption" color="text.secondary"
                sx={{ textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: 600 }}>
                {label}
            </Typography>
            {!connected ? (
                <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>— Connect Kite</Typography>
            ) : ltp === 0 ? (
                <Box sx={{ mt: 1.5 }}><CircularProgress size={20} /></Box>
            ) : (
                <>
                    <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, color: pc, fontVariantNumeric: 'tabular-nums' }}>
                        {isVix ? ltp.toFixed(2) : fmt(ltp, 2)}
                    </Typography>
                    {isVix ? (
                        <Chip label={vixLabel(ltp)} size="small" sx={{ mt: 0.5, bgcolor: `${vc}22`, color: vc, fontWeight: 700, border: `1px solid ${vc}44` }} />
                    ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                            {pos ? <TrendingUpIcon sx={{ fontSize: 15, color: UP_COLOR }} /> : <TrendingDownIcon sx={{ fontSize: 15, color: DOWN_COLOR }} />}
                            <Typography variant="caption" sx={{ color: pos ? UP_COLOR : DOWN_COLOR, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                                {pos ? '+' : ''}{chg.toFixed(2)}%
                            </Typography>
                        </Box>
                    )}
                </>
            )}
        </Paper>
    );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color, icon }: {
    label: string; value: string; sub?: string; color?: string; icon?: React.ReactNode;
}) {
    const theme  = useTheme();
    const isDark = theme.palette.mode === 'dark';
    return (
        <Paper sx={{
            p: 2, borderRadius: 2, height: '100%',
            background: isDark ? 'rgba(30,30,40,0.65)' : 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(8px)',
            border: '1px solid', borderColor: 'divider',
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.5 }}>
                {icon && <Box sx={{ color: 'text.disabled', display: 'flex', fontSize: '1rem' }}>{icon}</Box>}
                <Typography variant="caption" color="text.secondary"
                    sx={{ textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>
                    {label}
                </Typography>
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: color || 'text.primary', fontVariantNumeric: 'tabular-nums' }}>
                {value}
            </Typography>
            {sub && <Typography variant="caption" color={color || 'text.secondary'}>{sub}</Typography>}
        </Paper>
    );
}

// ─── Custom recharts tooltip ───────────────────────────────────────────────────

function CustomTooltip({ active, payload, label, formatter }: any) {
    const theme = useTheme();
    if (!active || !payload?.length) return null;
    const v = payload[0]?.value ?? 0;
    const display = formatter ? formatter(v) : fmtShort(v);
    return (
        <Paper sx={{ p: 1.2, border: '1px solid', borderColor: 'divider', minWidth: 100 }}>
            <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: payload[0]?.fill || 'text.primary' }}>
                {display}
            </Typography>
        </Paper>
    );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────

export const Dashboard = () => {
    const navigate   = useNavigate();
    const theme      = useTheme();
    const isDark     = theme.palette.mode === 'dark';

    const user            = useAuthStore(s => s.user);
    const isKiteConnected = useAuthStore(s => s.isKiteConnected);
    const ticks           = useMarketStore(s => s.ticks);
    const screenerResult  = useScreenerStore(s => s.result);
    const { holdings, positions, margins, fetchHoldings, fetchPositions, fetchMargins } = usePortfolioStore();

    useEffect(() => {
        if (isKiteConnected) { fetchHoldings(); fetchPositions(); fetchMargins(); }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isKiteConnected]);

    // ── Live ticks ─────────────────────────────────────────────────────────
    const niftyLTP   = ticks[NIFTY_TOKEN]?.last_price     ?? 0;
    const bankLTP    = ticks[BANK_NIFTY_TOKEN]?.last_price ?? 0;
    const vixLTP     = ticks[INDIA_VIX_TOKEN]?.last_price  ?? 0;
    const niftyChg   = ticks[NIFTY_TOKEN]?.change          ?? 0;
    const bankChg    = ticks[BANK_NIFTY_TOKEN]?.change      ?? 0;

    // ── Portfolio calculations ──────────────────────────────────────────────
    const { totalInvested, totalCurrent, overallPL, overallPLPct, dayPL, availableMargin, marginUtilPct } = useMemo(() => {
        let ti = 0, tc = 0;
        (holdings as Holding[]).forEach(h => {
            ti += Number(h.average_price || 0) * Number(h.quantity || 0);
            tc += Number(h.last_price    || 0) * Number(h.quantity || 0);
        });
        const pl     = tc - ti;
        const plPct  = ti > 0 ? (pl / ti) * 100 : 0;
        let dPL = 0;
        ((positions.net || []) as Position[]).forEach(p => { dPL += Number(p.pnl || 0); });
        const eq = (margins as Margin | null)?.equity;
        const cash = eq?.available?.cash ?? 0;
        const net  = eq?.net ?? 0;
        const util = eq?.utilised;
        const utilTotal = util ? (
            (util.debits || 0) + (util.exposure || 0) + (util.span || 0) +
            (util.m2m_realised || 0) + (util.m2m_unrealised || 0) + (util.option_premium || 0)
        ) : 0;
        const utilPct = (cash + utilTotal) > 0 ? (utilTotal / (cash + utilTotal)) * 100 : 0;
        return {
            totalInvested: ti, totalCurrent: tc, overallPL: pl, overallPLPct: plPct,
            dayPL: dPL, availableMargin: cash, marginUtilPct: utilPct,
        };
    }, [holdings, positions, margins]);

    // ── Chart: Holdings P&L (bar, top 12 by absolute P&L) ─────────────────
    const holdingsPLData = useMemo(() => {
        return [...(holdings as Holding[])]
            .filter(h => h.quantity > 0)
            .map(h => ({
                name:  h.tradingsymbol,
                pnl:   Number(h.pnl || 0),
                pct:   (Number(h.average_price) > 0)
                    ? ((Number(h.last_price) - Number(h.average_price)) / Number(h.average_price)) * 100
                    : 0,
            }))
            .sort((a, b) => Math.abs(b.pnl) - Math.abs(a.pnl))
            .slice(0, 12);
    }, [holdings]);

    // ── Chart: Day Change % ────────────────────────────────────────────────
    const dayChangeData = useMemo(() => {
        return [...(holdings as Holding[])]
            .filter(h => h.quantity > 0)
            .map(h => ({ name: h.tradingsymbol, chg: Number(h.day_change_percentage || 0) }))
            .sort((a, b) => b.chg - a.chg);
    }, [holdings]);

    // ── Chart: Portfolio allocation (top 8 + Others) ───────────────────────
    const allocationData = useMemo(() => {
        const items = [...(holdings as Holding[])]
            .filter(h => h.quantity > 0)
            .map(h => ({
                name: h.tradingsymbol,
                value: Number(h.average_price || 0) * Number(h.quantity || 0),
            }))
            .sort((a, b) => b.value - a.value);
        if (items.length <= 8) return items;
        const top8  = items.slice(0, 8);
        const other = items.slice(8).reduce((s, i) => s + i.value, 0);
        return [...top8, { name: 'Others', value: other }];
    }, [holdings]);

    // ── Chart: Margin breakdown ────────────────────────────────────────────
    const marginData = useMemo(() => {
        const eq   = (margins as Margin | null)?.equity;
        const util = eq?.utilised;
        const cash = eq?.available?.cash ?? 0;
        if (!eq) return [];
        const items = [
            { name: 'Available Cash', value: cash },
            { name: 'Debits',         value: util?.debits ?? 0 },
            { name: 'Span Margin',    value: util?.span ?? 0 },
            { name: 'Exposure',       value: util?.exposure ?? 0 },
            { name: 'M2M Realised',   value: util?.m2m_realised ?? 0 },
            { name: 'M2M Unrealised', value: util?.m2m_unrealised ?? 0 },
            { name: 'Option Premium', value: util?.option_premium ?? 0 },
            { name: 'Collateral',     value: eq.available?.collateral ?? 0 },
        ].filter(i => i.value > 0);
        return items;
    }, [margins]);

    // ── Chart: Open positions P&L ─────────────────────────────────────────
    const positionsPLData = useMemo(() => {
        return [...((positions.net || []) as Position[])]
            .filter(p => p.quantity !== 0)
            .map(p => ({ name: p.tradingsymbol, pnl: Number(p.pnl || 0) }))
            .sort((a, b) => Math.abs(b.pnl) - Math.abs(a.pnl))
            .slice(0, 10);
    }, [positions]);

    // ── Chart: Screener recommendations distribution ───────────────────────
    const screenerDistData = useMemo(() => {
        if (!screenerResult?.stocks?.length) return [];
        const counts: Record<string, number> = {};
        screenerResult.stocks.forEach(s => {
            counts[s.recommendation] = (counts[s.recommendation] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [screenerResult]);

    const bias       = biasBadge(vixLTP, isKiteConnected);
    const topStocks  = screenerResult?.stocks?.slice(0, 10) ?? [];
    const gridColor  = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    const axisColor  = isDark ? '#94a3b8' : '#64748b';
    const hasHoldings = (holdings as Holding[]).filter(h => h.quantity > 0).length > 0;
    const hasPositions = ((positions.net || []) as Position[]).filter(p => p.quantity !== 0).length > 0;

    // ── Custom pie label renderer ──────────────────────────────────────────
    const renderPieLabel = ({ name, percent }: any) =>
        percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : '';

    return (
        <Box sx={{ px: 3, pb: 5, pt: 3, maxWidth: 1440, mx: 'auto' }}>

            {/* ── Header ──────────────────────────────────────────────────── */}
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>Dashboard</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Welcome back, {user?.name || 'Trader'} · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </Typography>
                </Box>
                <Chip
                    label={bias.label}
                    sx={{ bgcolor: `${bias.color}20`, color: bias.color, fontWeight: 800, fontSize: '0.8rem', px: 1.5, border: `1px solid ${bias.color}55`, letterSpacing: 0.5 }}
                />
            </Box>

            {/* ── 1. Live Market ───────────────────────────────────────────── */}
            <Section title="Live Market" icon={<ShowChartIcon fontSize="small" />}>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                        <IndexCard label="Nifty 50"   ltp={niftyLTP} change={niftyChg} connected={isKiteConnected} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <IndexCard label="Bank Nifty" ltp={bankLTP}  change={bankChg}  connected={isKiteConnected} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <IndexCard label="India VIX"  ltp={vixLTP}   isVix             connected={isKiteConnected} />
                    </Grid>
                </Grid>
            </Section>

            {/* ── 2. Portfolio Summary Stat Cards ─────────────────────────── */}
            {isKiteConnected && (
                <Section title="Portfolio" icon={<AccountBalanceWalletIcon fontSize="small" />}>
                    <Grid container spacing={2}>
                        <Grid item xs={6} sm={4} md={2}>
                            <StatCard label="Invested"    value={fmtCr(totalInvested)}  icon={<AccountBalanceWalletIcon fontSize="inherit" />} />
                        </Grid>
                        <Grid item xs={6} sm={4} md={2}>
                            <StatCard label="Current"     value={fmtCr(totalCurrent)}   icon={<AssessmentIcon fontSize="inherit" />} />
                        </Grid>
                        <Grid item xs={6} sm={4} md={2}>
                            <StatCard
                                label="P&L"
                                value={`${overallPL >= 0 ? '+' : ''}${fmtCr(overallPL)}`}
                                sub={`${overallPLPct >= 0 ? '+' : ''}${overallPLPct.toFixed(2)}%`}
                                color={overallPL >= 0 ? UP_COLOR : DOWN_COLOR}
                                icon={overallPL >= 0 ? <TrendingUpIcon fontSize="inherit" /> : <TrendingDownIcon fontSize="inherit" />}
                            />
                        </Grid>
                        <Grid item xs={6} sm={4} md={2}>
                            <StatCard
                                label="Day P&L"
                                value={`${dayPL >= 0 ? '+' : ''}${fmtCr(dayPL)}`}
                                color={dayPL >= 0 ? UP_COLOR : DOWN_COLOR}
                                icon={dayPL >= 0 ? <TrendingUpIcon fontSize="inherit" /> : <TrendingDownIcon fontSize="inherit" />}
                            />
                        </Grid>
                        <Grid item xs={6} sm={4} md={2}>
                            <StatCard label="Avail. Margin" value={fmtCr(availableMargin)} icon={<AccountBalanceWalletIcon fontSize="inherit" />} />
                        </Grid>
                        <Grid item xs={6} sm={4} md={2}>
                            <StatCard
                                label="Margin Used"
                                value={`${marginUtilPct.toFixed(1)}%`}
                                sub="of total margin"
                                color={marginUtilPct > 80 ? DOWN_COLOR : marginUtilPct > 60 ? '#f59e0b' : UP_COLOR}
                            />
                        </Grid>
                    </Grid>
                </Section>
            )}

            {/* ── 3. Holdings Charts ───────────────────────────────────────── */}
            {isKiteConnected && hasHoldings && (
                <Section title="Holdings Analysis" icon={<TableChartIcon fontSize="small" />}>
                    <Grid container spacing={2}>

                        {/* Holdings P&L Bar Chart */}
                        <Grid item xs={12} md={7}>
                            <ChartCard title="Holdings P&L" sub="Top 12 by absolute gain/loss" height={260}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={holdingsPLData}
                                        layout="vertical"
                                        margin={{ top: 0, right: 60, bottom: 0, left: 0 }}
                                    >
                                        <CartesianGrid horizontal={false} stroke={gridColor} />
                                        <XAxis
                                            type="number"
                                            tick={{ fill: axisColor, fontSize: 11 }}
                                            tickFormatter={v => fmtShort(v)}
                                            axisLine={false} tickLine={false}
                                        />
                                        <YAxis
                                            type="category" dataKey="name" width={80}
                                            tick={{ fill: axisColor, fontSize: 11 }}
                                            axisLine={false} tickLine={false}
                                        />
                                        <RTooltip
                                            content={<CustomTooltip formatter={(v: number) => `${v >= 0 ? '+' : ''}${fmtShort(v)} (${holdingsPLData.find(h => h.pnl === v)?.pct?.toFixed(2) ?? ''}%)`} />}
                                            cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}
                                        />
                                        <ReferenceLine x={0} stroke={isDark ? '#475569' : '#cbd5e1'} strokeDasharray="3 3" />
                                        <Bar dataKey="pnl" radius={[0, 3, 3, 0]} maxBarSize={18}>
                                            {holdingsPLData.map((entry, i) => (
                                                <Cell key={i} fill={entry.pnl >= 0 ? UP_COLOR : DOWN_COLOR} fillOpacity={0.85} />
                                            ))}
                                            <LabelList dataKey="pnl" position="right"
                                                formatter={(v: number) => fmtShort(v)}
                                                style={{ fill: axisColor, fontSize: 10 }}
                                            />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </ChartCard>
                        </Grid>

                        {/* Portfolio Allocation Donut */}
                        <Grid item xs={12} md={5}>
                            <ChartCard title="Portfolio Allocation" sub="By invested value" height={260}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={allocationData}
                                            cx="50%" cy="50%"
                                            innerRadius="52%" outerRadius="75%"
                                            paddingAngle={2}
                                            dataKey="value"
                                            labelLine={false}
                                            label={renderPieLabel}
                                        >
                                            {allocationData.map((_, i) => (
                                                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <RTooltip
                                            formatter={(v: number, _: any, props: any) =>
                                                [`${fmtShort(v)} (${((v / totalInvested) * 100).toFixed(1)}%)`, props.payload.name]
                                            }
                                            contentStyle={{
                                                background: isDark ? '#1e1e2e' : '#fff',
                                                border: '1px solid rgba(128,128,128,0.2)',
                                                borderRadius: 8, fontSize: 12,
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                {/* Legend */}
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mt: 0.5 }}>
                                    {allocationData.slice(0, 8).map((d, i) => (
                                        <Box key={d.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: CHART_COLORS[i % CHART_COLORS.length], flexShrink: 0 }} />
                                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
                                                {d.name}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </ChartCard>
                        </Grid>

                        {/* Day Change % Bar */}
                        <Grid item xs={12} md={7}>
                            <ChartCard title="Today's Performance" sub="Day change % per holding" height={200}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={dayChangeData} margin={{ top: 4, right: 20, bottom: 0, left: 0 }}>
                                        <CartesianGrid vertical={false} stroke={gridColor} />
                                        <XAxis dataKey="name" tick={{ fill: axisColor, fontSize: 10 }} axisLine={false} tickLine={false} interval={0} angle={-35} textAnchor="end" height={45} />
                                        <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                                        <RTooltip
                                            content={<CustomTooltip formatter={(v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`} />}
                                            cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}
                                        />
                                        <ReferenceLine y={0} stroke={isDark ? '#475569' : '#cbd5e1'} />
                                        <Bar dataKey="chg" radius={[3, 3, 0, 0]} maxBarSize={28}>
                                            {dayChangeData.map((e, i) => (
                                                <Cell key={i} fill={e.chg >= 0 ? UP_COLOR : DOWN_COLOR} fillOpacity={0.8} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </ChartCard>
                        </Grid>

                        {/* Margin Breakdown Pie */}
                        <Grid item xs={12} md={5}>
                            <ChartCard title="Margin Breakdown" sub="Equity margin utilization" height={200}>
                                {marginData.length === 0 ? (
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                        <Typography variant="body2" color="text.disabled">No margin data</Typography>
                                    </Box>
                                ) : (
                                    <>
                                        <ResponsiveContainer width="100%" height="85%">
                                            <PieChart>
                                                <Pie
                                                    data={marginData} cx="50%" cy="50%"
                                                    innerRadius="48%" outerRadius="72%"
                                                    paddingAngle={2} dataKey="value"
                                                    labelLine={false} label={renderPieLabel}
                                                >
                                                    {marginData.map((_, i) => (
                                                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <RTooltip
                                                    formatter={(v: number, _: any, props: any) => [fmtShort(v), props.payload.name]}
                                                    contentStyle={{
                                                        background: isDark ? '#1e1e2e' : '#fff',
                                                        border: '1px solid rgba(128,128,128,0.2)',
                                                        borderRadius: 8, fontSize: 12,
                                                    }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                                            {marginData.map((d, i) => (
                                                <Box key={d.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                                                    <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: CHART_COLORS[i % CHART_COLORS.length], flexShrink: 0 }} />
                                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                                                        {d.name}
                                                    </Typography>
                                                </Box>
                                            ))}
                                        </Box>
                                    </>
                                )}
                            </ChartCard>
                        </Grid>
                    </Grid>
                </Section>
            )}

            {/* ── 4. Open Positions P&L ─────────────────────────────────── */}
            {isKiteConnected && hasPositions && (
                <Section title="Open Positions" icon={<AssessmentIcon fontSize="small" />}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={7}>
                            <ChartCard title="Position P&L" sub="Current unrealised profit/loss" height={Math.max(160, positionsPLData.length * 32 + 20)}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={positionsPLData}
                                        layout="vertical"
                                        margin={{ top: 0, right: 60, bottom: 0, left: 0 }}
                                    >
                                        <CartesianGrid horizontal={false} stroke={gridColor} />
                                        <XAxis type="number" tick={{ fill: axisColor, fontSize: 11 }} tickFormatter={v => fmtShort(v)} axisLine={false} tickLine={false} />
                                        <YAxis type="category" dataKey="name" width={85} tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                                        <RTooltip
                                            content={<CustomTooltip formatter={(v: number) => `${v >= 0 ? '+' : ''}${fmtShort(v)}`} />}
                                            cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}
                                        />
                                        <ReferenceLine x={0} stroke={isDark ? '#475569' : '#cbd5e1'} strokeDasharray="3 3" />
                                        <Bar dataKey="pnl" radius={[0, 3, 3, 0]} maxBarSize={18}>
                                            {positionsPLData.map((e, i) => (
                                                <Cell key={i} fill={e.pnl >= 0 ? UP_COLOR : DOWN_COLOR} fillOpacity={0.85} />
                                            ))}
                                            <LabelList dataKey="pnl" position="right"
                                                formatter={(v: number) => fmtShort(v)}
                                                style={{ fill: axisColor, fontSize: 10 }}
                                            />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </ChartCard>
                        </Grid>

                        {/* Positions summary table */}
                        <Grid item xs={12} md={5}>
                            <Paper sx={{
                                borderRadius: 2, overflow: 'hidden', height: '100%',
                                border: '1px solid', borderColor: 'divider',
                                background: isDark ? 'rgba(30,30,40,0.65)' : 'rgba(255,255,255,0.85)',
                            }}>
                                <Box sx={{ px: 2, py: 1.5 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Position Summary</Typography>
                                </Box>
                                <Divider />
                                <Box sx={{ px: 2 }}>
                                    {((positions.net || []) as Position[]).filter(p => p.quantity !== 0).map(p => {
                                        const pnl = Number(p.pnl || 0);
                                        return (
                                            <Box key={p.tradingsymbol} sx={{
                                                py: 1.2,
                                                borderBottom: '1px solid',
                                                borderColor: 'divider',
                                                '&:last-child': { borderBottom: 'none' },
                                            }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{p.tradingsymbol}</Typography>
                                                    <Typography variant="body2" sx={{ fontWeight: 700, color: pnl >= 0 ? UP_COLOR : DOWN_COLOR }}>
                                                        {pnl >= 0 ? '+' : ''}{fmtShort(pnl)}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {p.quantity > 0 ? 'LONG' : 'SHORT'} {Math.abs(p.quantity)}q @ ₹{fmt(p.average_price)}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">LTP ₹{fmt(p.last_price)}</Typography>
                                                </Box>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={Math.min(Math.abs(pnl / (Number(p.average_price) * Math.abs(p.quantity) || 1)) * 1000, 100)}
                                                    sx={{
                                                        mt: 0.5, height: 3, borderRadius: 1,
                                                        bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                                                        '& .MuiLinearProgress-bar': { bgcolor: pnl >= 0 ? UP_COLOR : DOWN_COLOR, borderRadius: 1 },
                                                    }}
                                                />
                                            </Box>
                                        );
                                    })}
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>
                </Section>
            )}

            {/* ── 5. Screener Results ──────────────────────────────────────── */}
            {topStocks.length > 0 && (
                <Section
                    title={`Screener · ${screenerResult?.version?.toUpperCase() ?? ''}`}
                    icon={<SearchIcon fontSize="small" />}
                    action={
                        <Button size="small" onClick={() => navigate('/screener')} sx={{ textTransform: 'none', fontSize: '0.75rem' }}>
                            Run New Scan →
                        </Button>
                    }
                >
                    <Grid container spacing={2}>
                        {/* Screener table */}
                        <Grid item xs={12} md={8}>
                            <Paper sx={{
                                borderRadius: 2, overflow: 'hidden',
                                border: '1px solid', borderColor: 'divider',
                                background: isDark ? 'rgba(30,30,40,0.65)' : 'rgba(255,255,255,0.85)',
                            }}>
                                {/* Header */}
                                <Box sx={{
                                    display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 2.5fr 1.2fr',
                                    px: 2, py: 1.2,
                                    bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                                    borderBottom: '1px solid', borderColor: 'divider',
                                }}>
                                    {['Stock', 'Price', 'Score', 'Signal Strength', 'Rec.'].map(h => (
                                        <Typography key={h} variant="caption" color="text.secondary"
                                            sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                                            {h}
                                        </Typography>
                                    ))}
                                </Box>
                                {/* Rows */}
                                {topStocks.map((stock: any, idx: number) => (
                                    <Box key={stock.symbol} sx={{
                                        display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 2.5fr 1.2fr',
                                        px: 2, py: 1.2, alignItems: 'center',
                                        borderBottom: idx < topStocks.length - 1 ? '1px solid' : 'none',
                                        borderColor: 'divider',
                                        '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' },
                                    }}>
                                        <Box>
                                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{stock.symbol}</Typography>
                                            <Typography variant="caption" color="text.secondary">{stock.sector}</Typography>
                                        </Box>
                                        <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                                            ₹{fmt(stock.currentPrice)}
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 700, color: recColor(stock.recommendation) }}>
                                            {stock.score}
                                        </Typography>
                                        {/* Score progress bar */}
                                        <Box sx={{ pr: 2 }}>
                                            <LinearProgress
                                                variant="determinate"
                                                value={stock.score}
                                                sx={{
                                                    height: 6, borderRadius: 3,
                                                    bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                                                    '& .MuiLinearProgress-bar': {
                                                        bgcolor: recColor(stock.recommendation),
                                                        borderRadius: 3,
                                                    },
                                                }}
                                            />
                                            {/* V2 layer breakdown */}
                                            {stock.indicators?.fundamentalScore !== undefined && (
                                                <Box sx={{ display: 'flex', gap: 1, mt: 0.4 }}>
                                                    <Typography variant="caption" sx={{ fontSize: '0.62rem', color: '#6366f1' }}>
                                                        F:{stock.indicators.fundamentalScore}/11
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ fontSize: '0.62rem', color: '#22c55e' }}>
                                                        T:{stock.indicators.technicalScore}/9
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ fontSize: '0.62rem', color: '#f59e0b' }}>
                                                        P:{stock.indicators.priceActionScore}/4
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Box>
                                        <Chip
                                            label={stock.recommendation}
                                            size="small"
                                            sx={{
                                                bgcolor: `${recColor(stock.recommendation)}1a`,
                                                color:   recColor(stock.recommendation),
                                                fontWeight: 700, fontSize: '0.65rem',
                                                border: `1px solid ${recColor(stock.recommendation)}44`,
                                                maxWidth: 100,
                                            }}
                                        />
                                    </Box>
                                ))}
                            </Paper>
                        </Grid>

                        {/* Recommendation distribution chart */}
                        <Grid item xs={12} md={4}>
                            <ChartCard title="Recommendations" sub={`${screenerResult?.totalScanned ?? 0} stocks scanned`} height={220}>
                                {screenerDistData.length > 0 ? (
                                    <>
                                        <ResponsiveContainer width="100%" height="80%">
                                            <PieChart>
                                                <Pie
                                                    data={screenerDistData}
                                                    cx="50%" cy="50%"
                                                    innerRadius="45%" outerRadius="70%"
                                                    paddingAngle={3} dataKey="value"
                                                    labelLine={false}
                                                    label={({ name, value }) => `${value}`}
                                                >
                                                    {screenerDistData.map((entry) => (
                                                        <Cell key={entry.name} fill={recColor(entry.name)} fillOpacity={0.85} />
                                                    ))}
                                                </Pie>
                                                <RTooltip
                                                    formatter={(v: number, _: any, props: any) => [`${v} stocks`, props.payload.name]}
                                                    contentStyle={{
                                                        background: isDark ? '#1e1e2e' : '#fff',
                                                        border: '1px solid rgba(128,128,128,0.2)',
                                                        borderRadius: 8, fontSize: 12,
                                                    }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5 }}>
                                            {screenerDistData.map(d => (
                                                <Box key={d.name} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: recColor(d.name) }} />
                                                        <Typography variant="caption" color="text.secondary">{d.name}</Typography>
                                                    </Box>
                                                    <Typography variant="caption" sx={{ fontWeight: 700, color: recColor(d.name) }}>{d.value}</Typography>
                                                </Box>
                                            ))}
                                        </Box>
                                    </>
                                ) : (
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                        <Typography variant="body2" color="text.disabled">Run a scan to see distribution</Typography>
                                    </Box>
                                )}
                            </ChartCard>
                        </Grid>
                    </Grid>
                </Section>
            )}

            {/* ── 6. Quick Actions ─────────────────────────────────────────── */}
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button variant="outlined" startIcon={<SearchIcon />}
                    onClick={() => navigate('/screener')} sx={{ borderRadius: 2, textTransform: 'none' }}>
                    Run Screener
                </Button>
                <Button variant="outlined" startIcon={<TableChartIcon />}
                    onClick={() => navigate('/holdings')} sx={{ borderRadius: 2, textTransform: 'none' }}>
                    Holdings
                </Button>
                <Button variant="outlined" startIcon={<AssessmentIcon />}
                    onClick={() => navigate('/positions')} sx={{ borderRadius: 2, textTransform: 'none' }}>
                    Positions
                </Button>
            </Box>

            {/* ── Not connected ────────────────────────────────────────────── */}
            {!isKiteConnected && (
                <Paper sx={{
                    p: 4, mt: 3, textAlign: 'center', borderRadius: 2,
                    border: '1px dashed', borderColor: 'divider', background: 'transparent',
                }}>
                    <DonutLargeIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                    <Typography variant="body1" color="text.secondary">
                        Connect your Kite account to see live market data, portfolio analytics, and charts.
                    </Typography>
                </Paper>
            )}
        </Box>
    );
};
