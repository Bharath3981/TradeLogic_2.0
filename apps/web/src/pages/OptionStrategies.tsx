import { useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { useTheme } from '@mui/material/styles';

interface Strategy {
  name: string;
  outlook: string;
  risk: string;
  instr: string;
  exp: string;
  badge: string;
  desc: string;
  profit: string;
  loss: string;
  when: string;
  details: string;
  steps: string[];
  pros: string[];
  cons: string[];
}

const strategiesData: Strategy[] = [
  {
    name: "Long Call",
    outlook: "bullish",
    risk: "risk-med",
    instr: "options",
    exp: "beginner",
    badge: "Bullish",
    desc: "Buy a call option expecting the stock to rise above the strike price before expiry.",
    profit: "Unlimited",
    loss: "Premium Paid",
    when: "Strong upside expected",
    details: "You pay a premium to buy the right (not obligation) to purchase a stock at a fixed price. If the stock rises significantly, profits can be large. Max loss is capped at the premium paid.",
    steps: [
      "Identify a stock with strong bullish momentum or upcoming catalyst.",
      "Choose a strike price slightly above current market price (slightly OTM).",
      "Pick an expiry 30–60 days out to balance time decay and movement.",
      "Buy the call option and set a stop-loss if premium falls 40–50%."
    ],
    pros: ["Limited downside (only premium lost)", "High leverage vs buying shares", "Simple to execute"],
    cons: ["Time decay (theta) works against you", "Requires meaningful price move to profit", "OTM calls often expire worthless"]
  },
  {
    name: "Long Put",
    outlook: "bearish",
    risk: "risk-med",
    instr: "options",
    exp: "beginner",
    badge: "Bearish",
    desc: "Buy a put option to profit when the underlying falls below the strike price.",
    profit: "Large (stock → 0)",
    loss: "Premium Paid",
    when: "Expecting sharp decline",
    details: "A long put gives you the right to sell at the strike price. Ideal when you expect a stock to fall, or to hedge an existing long position. Premium is the max loss.",
    steps: [
      "Identify an overvalued stock or one with negative catalysts.",
      "Select a strike slightly below the current price (slightly OTM).",
      "Prefer shorter expiry (2–4 weeks) for faster decay capture.",
      "Exit once target profit (50–80%) is achieved or stop out at 40–50% loss of premium."
    ],
    pros: ["Profits from falling market", "Limited downside risk", "Great hedging tool"],
    cons: ["Time decay erodes value daily", "Needs a strong downward move", "Premium can be expensive in volatile markets"]
  },
  {
    name: "Covered Call",
    outlook: "neutral",
    risk: "risk-low",
    instr: "options",
    exp: "beginner",
    badge: "Neutral",
    desc: "Hold shares and sell a call option against them to earn premium income.",
    profit: "Premium + Limited Upside",
    loss: "Stock Decline",
    when: "Flat to mildly bullish",
    details: "You own 100 shares and sell a call at a higher strike. You keep the premium regardless. If stock stays below strike, you profit from premium. If it rises above, your upside is capped.",
    steps: [
      "Own at least 1 lot of the underlying stock.",
      "Sell an OTM call option 5–10% above current price.",
      "Choose monthly expiry to capture theta decay.",
      "Repeat each month to generate consistent income."
    ],
    pros: ["Regular income generation", "Reduces cost basis of holdings", "Low additional risk"],
    cons: ["Caps upside if stock rallies hard", "Doesn't protect fully from large drops", "Requires owning the underlying"]
  },
  {
    name: "Bull Call Spread",
    outlook: "bullish",
    risk: "risk-med",
    instr: "options",
    exp: "intermediate",
    badge: "Bullish",
    desc: "Buy a lower-strike call and sell a higher-strike call to reduce cost and define risk.",
    profit: "Capped",
    loss: "Net Debit",
    when: "Moderately bullish view",
    details: "Buy a call at strike A and sell a call at strike B (B > A). Max profit = B – A – net premium. Max loss = net premium paid. Cheaper than buying a naked call.",
    steps: [
      "Identify stock you expect to rise moderately (5–15%).",
      "Buy ATM call (Strike A) and sell OTM call (Strike B) same expiry.",
      "Ensure B is near your target price.",
      "Exit near expiry or when 60–70% of max profit is achieved."
    ],
    pros: ["Lower cost than naked long call", "Defined max risk and max reward", "Works well in moderately bullish markets"],
    cons: ["Profit is capped", "Requires stock to move to profit", "More complex than a single option"]
  },
  {
    name: "Bear Put Spread",
    outlook: "bearish",
    risk: "risk-med",
    instr: "options",
    exp: "intermediate",
    badge: "Bearish",
    desc: "Buy a higher-strike put and sell a lower-strike put to limit cost and define profit zone.",
    profit: "Capped",
    loss: "Net Debit",
    when: "Moderately bearish outlook",
    details: "Buy a put at strike A, sell a put at strike B (B < A). You benefit when price falls between the two strikes. Risk and reward are both defined.",
    steps: [
      "Identify stock or index you expect to fall 5–15%.",
      "Buy ATM/slightly OTM put (Strike A), sell lower put (Strike B).",
      "Set B near your downside target.",
      "Close position when 60–70% of max profit is achieved."
    ],
    pros: ["Cheaper than a naked long put", "Defined max loss", "Profits from modest decline"],
    cons: ["Profit capped if stock crashes further", "Requires downward move", "Two-leg trade adds execution risk"]
  },
  {
    name: "Iron Condor",
    outlook: "neutral",
    risk: "risk-low",
    instr: "options",
    exp: "intermediate",
    badge: "Neutral",
    desc: "Sell an OTM call spread and OTM put spread simultaneously. Profit if price stays in a range.",
    profit: "Net Premium",
    loss: "Spread - Premium",
    when: "Low volatility, range-bound",
    details: "Combines a bull put spread + bear call spread. Profit zone is between the two short strikes. Ideal in low-volatility environments like before earnings or in sideways markets.",
    steps: [
      "Select an index or stock with low implied volatility.",
      "Sell OTM put (Strike B), buy further OTM put (Strike A). A < B.",
      "Sell OTM call (Strike C), buy further OTM call (Strike D). C < D.",
      "Collect net credit. Profit if price stays between B and C at expiry."
    ],
    pros: ["Profits from time decay in quiet markets", "Defined risk on both sides", "Can be adjusted if market moves"],
    cons: ["Limited profit potential", "Risk if sharp move in either direction", "Requires active monitoring near wings"]
  },
  {
    name: "Straddle",
    outlook: "neutral",
    risk: "risk-high",
    instr: "options",
    exp: "intermediate",
    badge: "Neutral",
    desc: "Buy both a call and put at the same strike. Profit from large moves in either direction.",
    profit: "Unlimited",
    loss: "Premiums Paid",
    when: "Big move expected, direction unknown",
    details: "Perfect before major events like earnings, RBI policy, or budget. You pay for both options. A large enough move in either direction covers both premiums and profits beyond.",
    steps: [
      "Identify event with high volatility potential (earnings, macro data).",
      "Buy ATM call + ATM put at same strike, same expiry.",
      "Enter before the event (but not too early — IV crush risk).",
      "Exit after event once large move materialises."
    ],
    pros: ["Profits from either upside or downside", "No directional bias needed", "Great for event-driven plays"],
    cons: ["Expensive (two premiums)", "Time decay hurts if no move", "IV crush after event can reduce value even if price moves"]
  },
  {
    name: "Strangle",
    outlook: "neutral",
    risk: "risk-high",
    instr: "options",
    exp: "intermediate",
    badge: "Neutral",
    desc: "Buy OTM call and OTM put. Cheaper than straddle but needs a bigger price move to profit.",
    profit: "Unlimited",
    loss: "Premiums Paid",
    when: "Expecting large volatile move",
    details: "Similar to straddle but both legs are OTM, making it cheaper. Requires a larger move to become profitable. Good when you expect extreme volatility but want to save on premium.",
    steps: [
      "Buy OTM call at Strike C (above market) and OTM put at Strike P (below market).",
      "Same expiry for both legs.",
      "Wider strikes = cheaper but needs bigger move.",
      "Exit when sufficient profit on either side materialises."
    ],
    pros: ["Cheaper than straddle", "Profits from large moves either way", "Flexible strike selection"],
    cons: ["Needs very large move to be profitable", "Time decay is the enemy", "Both legs must be managed"]
  },
  {
    name: "Long Futures",
    outlook: "bullish",
    risk: "risk-high",
    instr: "futures",
    exp: "beginner",
    badge: "Bullish",
    desc: "Buy a futures contract expecting the price to rise. Leveraged play with unlimited upside and downside.",
    profit: "Unlimited",
    loss: "Unlimited",
    when: "Strong directional bullish view",
    details: "Futures offer high leverage — small margin controls a large position. Profits and losses are magnified vs spot. MTM is settled daily. Use strict stop-losses.",
    steps: [
      "Identify bullish stock/index with technical confirmation.",
      "Calculate margin required and ensure 2x–3x buffer.",
      "Enter near support with clear stop-loss below key level.",
      "Trail stop-loss upward as position profits. Exit before expiry or roll over."
    ],
    pros: ["High leverage — large positions with small margin", "No time decay unlike options", "Direct market exposure"],
    cons: ["Unlimited loss potential", "Daily MTM can drain margin", "Gap-up/gap-down risk can exceed stops"]
  },
  {
    name: "Short Futures",
    outlook: "bearish",
    risk: "risk-high",
    instr: "futures",
    exp: "intermediate",
    badge: "Bearish",
    desc: "Sell a futures contract expecting price to fall. Leveraged short position.",
    profit: "Large (to 0)",
    loss: "Unlimited",
    when: "Strong bearish conviction",
    details: "Shorting futures is common for hedging a stock portfolio or expressing a bearish view. Risk is theoretically unlimited as prices can rise sharply. Requires active management.",
    steps: [
      "Identify stock/index showing clear bearish signal (breakdown, negative catalyst).",
      "Sell the futures contract and define stop-loss level above resistance.",
      "Maintain margin buffer to handle adverse MTM swings.",
      "Cover (buy back) when target is reached or stop is hit."
    ],
    pros: ["Profit from falling markets", "Highly liquid in index futures", "Can hedge long portfolio"],
    cons: ["Unlimited upside risk if market rallies", "Short squeezes can be violent", "Requires constant monitoring"]
  },
  {
    name: "Protective Put",
    outlook: "hedging",
    risk: "risk-low",
    instr: "combo",
    exp: "beginner",
    badge: "Hedging",
    desc: "Own shares + buy a put option to insure against downside loss. Like portfolio insurance.",
    profit: "Upside from shares",
    loss: "Premium Cost",
    when: "Holding stocks, fear of correction",
    details: "Buying a put on your stock holdings gives you the right to sell at the strike price if the market falls. You pay a premium (cost of insurance) but your downside is capped.",
    steps: [
      "Identify positions you want to protect (ideally large holdings with good profits).",
      "Buy ATM or slightly OTM put options corresponding to your holding.",
      "Choose expiry covering the risk period (budget, results, global events).",
      "Let the put expire if market stays up; exercise/sell if market falls."
    ],
    pros: ["Limits downside loss on holdings", "Peace of mind during volatile periods", "Can stay invested without panic selling"],
    cons: ["Premium cost reduces overall returns", "Can be expensive during high-volatility periods", "Over-hedging leads to drag on portfolio"]
  },
  {
    name: "Calendar Spread",
    outlook: "neutral",
    risk: "risk-med",
    instr: "options",
    exp: "advanced",
    badge: "Neutral",
    desc: "Sell near-term option and buy far-term option at same strike. Profit from time decay difference.",
    profit: "Limited",
    loss: "Net Debit",
    when: "Low near-term IV, expecting future volatility",
    details: "Sells front-month option (faster decay) and buys back-month option (slower decay) at same strike. Profits when near-term volatility is low and far-term IV rises or stock stays still.",
    steps: [
      "Select a stock with stable price but upcoming future catalyst.",
      "Sell current month ATM option, buy next month same strike.",
      "Profit zone is near the strike at near-term expiry.",
      "Close the spread before near-month expiry to capture max theta decay."
    ],
    pros: ["Profits from time decay difference", "Lower capital requirement vs outright positions", "Benefits from volatility increase in back month"],
    cons: ["Complex to manage", "Sensitive to underlying price movement", "Requires understanding of IV dynamics"]
  }
];

export const OptionStrategies = () => {
    const theme = useTheme();
    const [outlook, setOutlook] = useState('all');
    const [risk, setRisk] = useState('all');
    const [instr, setInstr] = useState('all');
    const [exp, setExp] = useState('all');

    const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);

    const filteredStrategies = useMemo(() => {
        return strategiesData.filter(s =>
            (outlook === 'all' || s.outlook === outlook) &&
            (risk === 'all' || s.risk === risk) &&
            (instr === 'all' || s.instr === instr) &&
            (exp === 'all' || s.exp === exp)
          );
    }, [outlook, risk, instr, exp]);

    const getOutlookColor = (type: string) => {
      switch(type) {
        case 'bullish': return theme.palette.success.main;
        case 'bearish': return theme.palette.error.main;
        case 'neutral': return theme.palette.warning.main;
        case 'hedging': return theme.palette.info.main;
        default: return theme.palette.text.primary;
      }
    };

    const getOutlookContrastText = (type: string) => {
      switch(type) {
        case 'bullish': return theme.palette.success.contrastText;
        case 'bearish': return theme.palette.error.contrastText;
        case 'neutral': return theme.palette.warning.contrastText;
        case 'hedging': return theme.palette.info.contrastText;
        default: return theme.palette.background.paper;
      }
    };

    return (
        <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
            {/* Header section */}
            <Box sx={{ mb: 4, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="overline" color="primary" sx={{ letterSpacing: 2, fontWeight: 'bold' }}>
                    Strategy Reference Tool
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                    F&O <Box component="span" sx={{ color: 'primary.main' }}>Strategy</Box> Finder
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                    Filter by outlook, risk appetite & instrument type — click any card for details
                </Typography>
            </Box>

            {/* Filters */}
            <Paper sx={{ p: 2, mb: 4, bgcolor: 'background.paper' }} elevation={0} variant="outlined">
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 'bold', textTransform: 'uppercase' }}>Market Outlook</Typography>
                  <FormControl fullWidth size="small">
                    <Select value={outlook} onChange={(e) => setOutlook(e.target.value)}>
                      <MenuItem value="all">All Outlooks</MenuItem>
                      <MenuItem value="bullish">Bullish</MenuItem>
                      <MenuItem value="bearish">Bearish</MenuItem>
                      <MenuItem value="neutral">Neutral / Sideways</MenuItem>
                      <MenuItem value="hedging">Hedging</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 'bold', textTransform: 'uppercase' }}>Risk Level</Typography>
                  <FormControl fullWidth size="small">
                    <Select value={risk} onChange={(e) => setRisk(e.target.value)}>
                      <MenuItem value="all">Any Risk</MenuItem>
                      <MenuItem value="risk-low">Low Risk</MenuItem>
                      <MenuItem value="risk-med">Medium Risk</MenuItem>
                      <MenuItem value="risk-high">High Risk</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 'bold', textTransform: 'uppercase' }}>Instrument</Typography>
                  <FormControl fullWidth size="small">
                    <Select value={instr} onChange={(e) => setInstr(e.target.value)}>
                      <MenuItem value="all">All Instruments</MenuItem>
                      <MenuItem value="options">Options</MenuItem>
                      <MenuItem value="futures">Futures</MenuItem>
                      <MenuItem value="combo">Combo</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 'bold', textTransform: 'uppercase' }}>Experience</Typography>
                  <FormControl fullWidth size="small">
                    <Select value={exp} onChange={(e) => setExp(e.target.value)}>
                      <MenuItem value="all">All Levels</MenuItem>
                      <MenuItem value="beginner">Beginner</MenuItem>
                      <MenuItem value="intermediate">Intermediate</MenuItem>
                      <MenuItem value="advanced">Advanced</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Paper>

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2, letterSpacing: 1 }}>
                <Box component="span" sx={{ color: 'primary.main', fontWeight: 'bold' }}>{filteredStrategies.length}</Box> strategies shown
            </Typography>

            {/* Grid */}
            <Grid container spacing={3}>
                {filteredStrategies.length === 0 ? (
                    <Grid size={12}>
                        <Box sx={{ textAlign: 'center', py: 8 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                                // no strategies match your filters — try adjusting
                            </Typography>
                        </Box>
                    </Grid>
                ) : (
                    filteredStrategies.map((s) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={s.name}>
                            <Paper 
                                elevation={0}
                                variant="outlined"
                                onClick={() => setSelectedStrategy(s)}
                                sx={{ 
                                    p: 3, 
                                    height: '100%',
                                    position: 'relative',
                                    cursor: 'pointer',
                                    overflow: 'hidden',
                                    transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: theme.shadows[4],
                                        borderColor: getOutlookColor(s.outlook)
                                    },
                                    '&::before': {
                                        content: '""',
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        height: 4,
                                        bgcolor: getOutlookColor(s.outlook)
                                    }
                                }}
                            >
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>{s.name}</Typography>
                                    <Box sx={{ 
                                        px: 1.5, 
                                        py: 0.5, 
                                        borderRadius: 4, 
                                        bgcolor: getOutlookColor(s.outlook),
                                        color: getOutlookContrastText(s.outlook),
                                        fontSize: '0.65rem',
                                        fontWeight: 'bold',
                                        textTransform: 'uppercase',
                                        letterSpacing: 1
                                    }}>
                                        {s.badge}
                                    </Box>
                                </Box>
                                
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                                    {s.desc}
                                </Typography>

                                <Grid container spacing={1} sx={{ mb: 2, display: 'flex', alignItems: 'stretch' }}>
                                    <Grid size={4}>
                                        <Box sx={{ bgcolor: 'background.default', p: 1, borderRadius: 1, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                            <Typography variant="caption" sx={{ display: 'block', fontSize: '0.6rem', color: 'text.secondary', textTransform: 'uppercase', mb: 0.5 }}>Max Profit</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main', fontSize: '0.75rem' }}>{s.profit}</Typography>
                                        </Box>
                                    </Grid>
                                    <Grid size={4}>
                                        <Box sx={{ bgcolor: 'background.default', p: 1, borderRadius: 1, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                            <Typography variant="caption" sx={{ display: 'block', fontSize: '0.6rem', color: 'text.secondary', textTransform: 'uppercase', mb: 0.5 }}>Max Loss</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'error.main', fontSize: '0.75rem' }}>{s.loss}</Typography>
                                        </Box>
                                    </Grid>
                                    <Grid size={4}>
                                        <Box sx={{ bgcolor: 'background.default', p: 1, borderRadius: 1, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                            <Typography variant="caption" sx={{ display: 'block', fontSize: '0.6rem', color: 'text.secondary', textTransform: 'uppercase', mb: 0.5 }}>Use When</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'info.main', fontSize: '0.65rem', lineHeight: 1.1 }}>{s.when}</Typography>
                                        </Box>
                                    </Grid>
                                </Grid>

                                <Box sx={{ width: '100%', height: 4, bgcolor: 'divider', borderRadius: 2, mt: 2, overflow: 'hidden' }}>
                                    <Box sx={{ 
                                        height: '100%', 
                                        width: s.risk === 'risk-low' ? '25%' : s.risk === 'risk-med' ? '60%' : '90%',
                                        bgcolor: s.risk === 'risk-low' ? 'success.main' : s.risk === 'risk-med' ? 'warning.main' : 'error.main',
                                        transition: 'width 0.5s'
                                    }} />
                                </Box>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    Risk: {s.risk === 'risk-low' ? 'Low' : s.risk === 'risk-med' ? 'Medium' : 'High'} · {s.exp} · {s.instr}
                                </Typography>
                            </Paper>
                        </Grid>
                    ))
                )}
            </Grid>

            {/* Disclaimer */}
            <Box sx={{ mt: 6, p: 2, bgcolor: theme.palette.mode === 'dark' ? 'error.main' + '11' : 'error.light', border: 1, borderColor: theme.palette.mode === 'dark' ? 'error.main' + '33' : 'error.main', borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary">
                    <Box component="strong" sx={{ color: 'error.main' }}>⚠ Disclaimer:</Box> This tool is for <strong>educational purposes only</strong>. Futures & options trading involves substantial risk of loss. Past performance does not guarantee future results. Always consult a SEBI-registered financial advisor before trading. I am not a financial advisor.
                </Typography>
            </Box>

            {/* Modal */}
            <Dialog 
                open={!!selectedStrategy} 
                onClose={() => setSelectedStrategy(null)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: 3, overflow: 'hidden' }
                }}
            >
                {selectedStrategy && (
                    <>
                        <Box sx={{ 
                            position: 'relative', 
                            p: 3, 
                            pb: 0,
                            borderTop: 4, 
                            borderColor: getOutlookColor(selectedStrategy.outlook)
                        }}>
                            <IconButton 
                                onClick={() => setSelectedStrategy(null)}
                                sx={{ position: 'absolute', right: 8, top: 8 }}
                            >
                                <CloseIcon />
                            </IconButton>

                            <Box sx={{ 
                                display: 'inline-block',
                                px: 1.5, 
                                py: 0.5, 
                                borderRadius: 1, 
                                bgcolor: getOutlookColor(selectedStrategy.outlook),
                                color: getOutlookContrastText(selectedStrategy.outlook),
                                fontSize: '0.7rem',
                                fontWeight: 'bold',
                                textTransform: 'uppercase',
                                letterSpacing: 1,
                                mb: 2
                            }}>
                                {selectedStrategy.badge}
                            </Box>
                            
                            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                                {selectedStrategy.name}
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                                {selectedStrategy.desc}
                            </Typography>
                        </Box>

                        <DialogContent sx={{ p: 3, pt: 0 }}>
                            <Grid container spacing={2} sx={{ mb: 4 }}>
                                <Grid size={4}>
                                    <Box sx={{ bgcolor: 'background.default', p: 1.5, borderRadius: 2, textAlign: 'center' }}>
                                        <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', textTransform: 'uppercase', fontWeight: 'bold', mb: 0.5 }}>Max Profit</Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'success.main' }}>{selectedStrategy.profit}</Typography>
                                    </Box>
                                </Grid>
                                <Grid size={4}>
                                    <Box sx={{ bgcolor: 'background.default', p: 1.5, borderRadius: 2, textAlign: 'center' }}>
                                        <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', textTransform: 'uppercase', fontWeight: 'bold', mb: 0.5 }}>Max Loss</Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'error.main' }}>{selectedStrategy.loss}</Typography>
                                    </Box>
                                </Grid>
                                <Grid size={4}>
                                    <Box sx={{ bgcolor: 'background.default', p: 1.5, borderRadius: 2, textAlign: 'center' }}>
                                        <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', textTransform: 'uppercase', fontWeight: 'bold', mb: 0.5 }}>Risk Level</Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                                            {selectedStrategy.risk === 'risk-low' ? 'Low' : selectedStrategy.risk === 'risk-med' ? 'Medium' : 'High'}
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>

                            <Box sx={{ mb: 4 }}>
                                <Typography variant="overline" color="primary" sx={{ display: 'block', fontWeight: 'bold', letterSpacing: 1, mb: 1 }}>How It Works</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>{selectedStrategy.details}</Typography>
                            </Box>

                            <Box sx={{ mb: 4 }}>
                                <Typography variant="overline" color="primary" sx={{ display: 'block', fontWeight: 'bold', letterSpacing: 1, mb: 2 }}>Execution Steps</Typography>
                                {selectedStrategy.steps.map((step, i) => (
                                    <Box key={i} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'flex-start' }}>
                                        <Box sx={{ 
                                            width: 24, 
                                            height: 24, 
                                            borderRadius: '50%', 
                                            bgcolor: 'primary.main', 
                                            color: 'primary.contrastText',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '0.8rem',
                                            fontWeight: 'bold',
                                            flexShrink: 0
                                        }}>
                                            {i + 1}
                                        </Box>
                                        <Typography variant="body2" color="text.secondary" sx={{ pt: 0.5, lineHeight: 1.5 }}>
                                            {step}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>

                            <Grid container spacing={3}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="overline" color="success.main" sx={{ display: 'block', fontWeight: 'bold', letterSpacing: 1, mb: 1 }}>Pros</Typography>
                                    <Box component="ul" sx={{ m: 0, pl: 2, color: 'text.secondary', '& li': { mb: 1, typography: 'body2' } }}>
                                        {selectedStrategy.pros.map((p, i) => <li key={i}>{p}</li>)}
                                    </Box>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="overline" color="error.main" sx={{ display: 'block', fontWeight: 'bold', letterSpacing: 1, mb: 1 }}>Cons & Risks</Typography>
                                    <Box component="ul" sx={{ m: 0, pl: 2, color: 'text.secondary', '& li': { mb: 1, typography: 'body2' } }}>
                                        {selectedStrategy.cons.map((c, i) => <li key={i}>{c}</li>)}
                                    </Box>
                                </Grid>
                            </Grid>
                        </DialogContent>
                    </>
                )}
            </Dialog>
        </Box>
    );
};
