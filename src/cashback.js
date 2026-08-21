// Flipkart Axis Bank Credit Card — cashback rules.
//
// A statement shows two figures:
//   "Cashback Earned"   — what this statement's spends earned; it is credited in the NEXT cycle.
//   "Cashback Credited" — what the PREVIOUS statement earned, arriving now.
// Earning is capped at Rs 4,000 per statement quarter on Flipkart / Cleartrip / Myntra spends.

export const QUARTER_CAP = 4000;
export const DEFAULT_STATEMENT_DAY = 15;

// Only used to translate leftover cap into "spend this much more" guidance.
export const RATES = [
  { key: 'flipkart', label: 'Flipkart', rate: 0.05 },
  { key: 'myntra', label: 'Myntra', rate: 0.04 },
  { key: 'cleartrip', label: 'Cleartrip', rate: 0.04 },
  { key: 'partner', label: 'partner brands (PVR, Uber, cult.fit)', rate: 0.04 },
  { key: 'other', label: 'anything else', rate: 0.01 },
];

/** Any user input -> a usable statement day. Empty/garbage falls back, out of range snaps. */
export const clampDay = (text) => {
  const n = parseInt(text, 10);
  if (!Number.isFinite(n)) return DEFAULT_STATEMENT_DAY;
  return Math.min(31, Math.max(1, n));
};

const round2 = (n) => Math.round(n * 100) / 100;
const daysIn = (y, m) => new Date(y, m, 0).getDate(); // m is 1-indexed
const ymParts = (ym) => ym.split('-').map(Number);
const toYm = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
export const addMonths = (ym, n) => {
  const [y, m] = ymParts(ym);
  return toYm(new Date(y, m - 1 + n, 1));
};

/** Statement generated on `day` of `ym` closes a period that started the day after the previous one. */
export function statementPeriod(ym, day) {
  const [y, m] = ymParts(ym);
  const end = new Date(y, m - 1, Math.min(day, daysIn(y, m)));
  const [py, pm] = ymParts(addMonths(ym, -1));
  const start = new Date(py, pm - 1, Math.min(day, daysIn(py, pm)));
  start.setDate(start.getDate() + 1);
  return { start, end };
}

/** First statement month of the quarter that a statement belongs to: Apr / Jul / Oct / Jan. */
const quarterFirstMonth = (m) => ((Math.floor(((m - 4 + 12) % 12) / 3) * 3 + 3) % 12) + 1;

/**
 * Statement quarters are anchored to the statement date, not the calendar.
 * With a 15th statement date: Q1 = 16 Mar–15 Jun, Q2 = 16 Jun–15 Sep, Q3 = 16 Sep–15 Dec, Q4 = 16 Dec–15 Mar.
 */
export function statementQuarter(ym, day) {
  const [y, m] = ymParts(ym);
  const fm = quarterFirstMonth(m);
  const firstYm = `${y}-${String(fm).padStart(2, '0')}`;
  const lastYm = addMonths(firstYm, 2);
  return {
    key: firstYm,
    n: Math.floor(((fm - 4 + 12) % 12) / 3) + 1,
    months: [firstYm, addMonths(firstYm, 1), lastYm],
    start: statementPeriod(firstYm, day).start,
    end: statementPeriod(lastYm, day).end,
  };
}

const DMY = { day: 'numeric', month: 'short', year: 'numeric' };
export const fmtDate = (d) => d.toLocaleDateString('en-IN', DMY);
export const fmtRange = ({ start, end }) => `${fmtDate(start)} – ${fmtDate(end)}`;
export const monthName = (ym) => {
  const [y, m] = ymParts(ym);
  return new Date(y, m - 1, 1).toLocaleString('en-IN', { month: 'short', year: 'numeric' });
};

const DAY_MS = 86400000;
const midnight = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** The statement that will close the period `today` falls in — it has not been generated yet. */
export function openStatementMonth(today, day) {
  const ym = toYm(today);
  return midnight(today) <= statementPeriod(ym, day).end ? ym : addMonths(ym, 1);
}

/**
 * Where the card stands right now: which statements of the current quarter already exist,
 * which are still to come, and how long is left to use the remaining cap.
 */
export function quarterStatus(today = new Date(), day = DEFAULT_STATEMENT_DAY) {
  const t = midnight(today);
  const open = openStatementMonth(t, day);
  const q = statementQuarter(open, day);
  const issued = q.months.filter((m) => statementPeriod(m, day).end < t);
  const period = statementPeriod(open, day);
  return {
    q,
    open,
    period,
    issued,
    pending: q.months.filter((m) => !issued.includes(m)),
    daysLeftInPeriod: Math.max(0, Math.round((period.end - t) / DAY_MS)),
    daysLeftInQuarter: Math.max(0, Math.round((q.end - t) / DAY_MS)),
  };
}

/**
 * @param rows [{ month: 'YYYY-MM', earned: 202 }] — the "Cashback Earned" figure off each statement
 * @returns quarters, newest first, each with its statements and cap usage
 */
export function calculate(rows, day = DEFAULT_STATEMENT_DAY) {
  const sorted = [...rows].sort((a, b) => a.month.localeCompare(b.month));
  const groups = {};
  const eligibleByMonth = {};

  for (const row of sorted) {
    const q = statementQuarter(row.month, day);
    const g = (groups[q.key] ??= { q, statements: [], used: 0 });
    const earned = round2(Number(row.earned) || 0);
    const eligible = round2(Math.min(earned, Math.max(0, QUARTER_CAP - g.used)));
    g.used = round2(g.used + eligible);
    eligibleByMonth[row.month] = eligible;
    g.statements.push({
      month: row.month,
      period: statementPeriod(row.month, day),
      earned,
      eligible,
      forfeited: round2(earned - eligible),
      creditMonth: addMonths(row.month, 1),
      // What this statement's own "Cashback Credited" line should show: last month's eligible earn.
      credited: eligibleByMonth[addMonths(row.month, -1)] ?? null,
    });
  }

  return Object.values(groups)
    .map((g) => {
      const capLeft = round2(Math.max(0, QUARTER_CAP - g.used));
      return {
        q: g.q,
        statements: g.statements,
        totals: {
          earned: round2(g.statements.reduce((s, x) => s + x.earned, 0)),
          eligible: g.used,
          forfeited: round2(g.statements.reduce((s, x) => s + x.forfeited, 0)),
          capLeft,
          spendLeft: Object.fromEntries(RATES.map((r) => [r.key, round2(capLeft / r.rate)])),
          missing: g.q.months.filter((m) => !g.statements.some((s) => s.month === m)),
        },
      };
    })
    .sort((a, b) => b.q.key.localeCompare(a.q.key));
}
