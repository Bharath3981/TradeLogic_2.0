/**
 * nifty.indices.ts
 *
 * Fetches Nifty index constituents from niftyindices.com (NSE official source).
 * CSVs are updated on every index rebalancing (semi-annually for broad indices,
 * quarterly for sectoral). Results are cached in-process for 24 hours.
 *
 * CSV format (niftyindices.com):
 *   Company Name, Industry, Symbol, Series, ISIN Code
 */

import axios from 'axios';
import { logger } from '../../utils/logger';

const BASE_URL  = 'https://www.niftyindices.com/IndexConstituent';
const TTL_MS    = 24 * 60 * 60 * 1000; // 24 hours

// ─── Index catalogue ─────────────────────────────────────────────────────────
// key   → display name shown in the UI
// value → CSV filename on niftyindices.com
export const NIFTY_INDEX_FILES: Record<string, string> = {
    // Broad market
    'Nifty 50':              'ind_nifty50list.csv',
    'Nifty Next 50':         'ind_niftynext50list.csv',
    'Nifty 100':             'ind_nifty100list.csv',
    'Nifty 200':             'ind_nifty200list.csv',
    'Nifty 500':             'ind_nifty500list.csv',
    'Nifty Midcap 50':       'ind_niftymidcap50list.csv',
    'Nifty Midcap 100':      'ind_niftymidcap100list.csv',
    'Nifty Midcap 150':      'ind_niftymidcap150list.csv',
    'Nifty Smallcap 50':     'ind_niftysmallcap50list.csv',
    'Nifty Smallcap 100':    'ind_niftysmallcap100list.csv',
    'Nifty Smallcap 250':    'ind_niftysmallcap250list.csv',
    'Nifty LargeMidcap 250': 'ind_niftylargemidcap250list.csv',

    // Sectoral
    'Nifty Bank':                 'ind_niftybanklist.csv',
    'Nifty Financial Services':   'ind_niftyfinservicelist.csv',
    'Nifty IT':                   'ind_niftyit.csv',
    'Nifty Auto':                 'ind_niftyautolist.csv',
    'Nifty Pharma':               'ind_niftypharmalist.csv',
    'Nifty FMCG':                 'ind_niftyfmcglist.csv',
    'Nifty Metal':                'ind_niftymetallist.csv',
    'Nifty Energy':               'ind_niftyenergylist.csv',
    'Nifty Infra':                'ind_niftyinfralist.csv',
    'Nifty Media':                'ind_niftymedialist.csv',
    'Nifty Realty':               'ind_niftyrealtylist.csv',
    'Nifty Healthcare':           'ind_niftyhealthcarelist.csv',
    'Nifty Consumer Durables':    'ind_niftyconsumerdurableslist.csv',
    'Nifty Oil & Gas':            'ind_niftyoilgaslist.csv',
    'Nifty Defence':              'ind_niftyindiamfglist.csv',
};

// ─── In-process cache ─────────────────────────────────────────────────────────
interface CacheEntry {
    symbols:   Set<string>;
    fetchedAt: number;
}

const cache = new Map<string, CacheEntry>();

// ─── CSV parser ───────────────────────────────────────────────────────────────
function parseSymbolsFromCsv(csv: string): Set<string> {
    const lines   = csv.replace(/\r/g, '').split('\n');
    const symbols = new Set<string>();

    if (lines.length < 2) return symbols;

    // Strip BOM and find Symbol column index
    const header      = lines[0].replace(/^\uFEFF/, '');
    const columns     = header.split(',').map(c => c.trim());
    const symbolIndex = columns.findIndex(c => c === 'Symbol');

    if (symbolIndex === -1) {
        logger.warn({ msg: 'Symbol column not found in Nifty index CSV', header });
        return symbols;
    }

    for (let i = 1; i < lines.length; i++) {
        const cols   = lines[i].split(',');
        const symbol = cols[symbolIndex]?.trim();
        if (symbol) symbols.add(symbol);
    }

    return symbols;
}

// ─── Fetch a single index ─────────────────────────────────────────────────────
async function fetchIndex(indexName: string): Promise<Set<string>> {
    const cached = cache.get(indexName);
    if (cached && Date.now() - cached.fetchedAt < TTL_MS) {
        return cached.symbols;
    }

    const filename = NIFTY_INDEX_FILES[indexName];
    if (!filename) {
        throw new Error(`Unknown Nifty index: "${indexName}"`);
    }

    const url = `${BASE_URL}/${filename}`;
    logger.info({ msg: 'Fetching Nifty index constituents', index: indexName, url });

    const response = await axios.get<string>(url, {
        responseType: 'text',
        timeout:      15_000,
        headers: {
            'Referer':    'https://www.niftyindices.com',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept':     'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
    });

    const symbols = parseSymbolsFromCsv(response.data);
    cache.set(indexName, { symbols, fetchedAt: Date.now() });

    logger.info({ msg: 'Nifty index cached', index: indexName, count: symbols.size });
    return symbols;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Returns the set of NSE trading symbols in a given Nifty index */
export async function getIndexConstituents(indexName: string): Promise<Set<string>> {
    return fetchIndex(indexName);
}

/** Returns all available index names (for the dropdown) */
export function getIndexNames(): string[] {
    return Object.keys(NIFTY_INDEX_FILES);
}

/** Clears cached data for one or all indices */
export function clearIndexCache(indexName?: string) {
    if (indexName) {
        cache.delete(indexName);
    } else {
        cache.clear();
    }
    logger.info({ msg: 'Nifty index cache cleared', index: indexName ?? 'ALL' });
}
