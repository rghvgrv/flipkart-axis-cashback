import { useEffect, useState } from 'react';
import {
  RATES,
  QUARTER_CAP,
  DEFAULT_STATEMENT_DAY,
  calculate,
  quarterStatus,
  statementPeriod,
  fmtDate,
  fmtRange,
  monthName,
  addMonths,
} from './cashback';
import * as I from './Icons';
import './App.css';

const inr = (n) =>
  n.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const days = (n) => `${n} ${n === 1 ? 'day' : 'days'}`;
const load = (k, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(k)) ?? fallback;
  } catch {
    return fallback;
  }
};

const prefersDark = () => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;

export default function App() {
  // 'system' until the user flips the switch, then an explicit 'light' / 'dark'.
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'system');
  const [systemDark, setSystemDark] = useState(prefersDark);
  const [day, setDay] = useState(() => load('statementDay', DEFAULT_STATEMENT_DAY));
  const [earned, setEarned] = useState(() => load('earnedByMonth', {})); // { 'YYYY-MM': '202' }

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e) => setSystemDark(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);
  useEffect(() => localStorage.setItem('statementDay', JSON.stringify(day)), [day]);
  useEffect(() => localStorage.setItem('earnedByMonth', JSON.stringify(earned)), [earned]);

  const status = quarterStatus(new Date(), day);
  const rows = status.issued
    .filter((m) => earned[m] !== undefined && earned[m] !== '')
    .map((m) => ({ month: m, earned: Number(earned[m]) || 0 }));

  const quarter = calculate(rows, day).find((x) => x.q.key === status.q.key);
  const totals = quarter?.totals ?? {
    earned: 0,
    eligible: 0,
    forfeited: 0,
    capLeft: QUARTER_CAP,
    spendLeft: Object.fromEntries(RATES.map((r) => [r.key, QUARTER_CAP / r.rate])),
  };
  const missing = status.issued.length - rows.length;
  const pct = Math.min(100, (totals.eligible / QUARTER_CAP) * 100);
  const dark = theme === 'system' ? systemDark : theme === 'dark';

  return (
    <main>
      <div className="top">
        <div className="logo">
          <I.Spark />
        </div>
        <div>
          <h1>Flipkart Axis Cashback</h1>
          <div className="sub">{inr(QUARTER_CAP)} every 3 months</div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={dark}
          aria-label="Dark mode"
          className={`switch${dark ? ' on' : ''}`}
          title={theme === 'system' ? 'Matching your device' : `Set to ${theme} mode`}
          onClick={() => setTheme(dark ? 'light' : 'dark')}
        >
          <I.Sun />
          <I.Moon />
          <span className="knob" />
        </button>
      </div>

      <section className="card">
        <h2>
          <I.Calendar /> When does your bill come? <span className="step">Step 1</span>
        </h2>
        <div className="row">
          <label className="narrow">
            <span>Bill date every month</span>
            <input
              type="number"
              min="1"
              max="31"
              inputMode="numeric"
              value={day}
              onChange={(e) => setDay(Math.min(31, Math.max(1, Number(e.target.value) || 1)))}
            />
          </label>
          <div className="detected">
            <em>
              <I.Clock />
              <span>
                This bill covers <strong>{fmtRange(status.period)}</strong> ·{' '}
                {days(status.daysLeftInPeriod)} to go
              </span>
            </em>
            <em>
              <I.Target />
              <span>
                Your {inr(QUARTER_CAP)} limit runs <strong>{fmtRange(status.q)}</strong> · resets in{' '}
                {days(status.daysLeftInQuarter)}
              </span>
            </em>
            <em>
              <I.Wallet />
              <span>
                Cashback you earn now arrives on your{' '}
                <strong>{monthName(addMonths(status.open, 1))}</strong> bill
              </span>
            </em>
          </div>
        </div>
      </section>

      <section className="card">
        <h2>
          <I.Receipt /> Cashback so far <span className="step">Step 2</span>
        </h2>
        {status.issued.length === 0 ? (
          <p className="empty">
            Your 3 months just started on {fmtDate(status.q.start)}. Nothing used yet — all{' '}
            {inr(QUARTER_CAP)} is still yours.
          </p>
        ) : (
          <>
            <p className="hint">
              Copy the <strong>“Cashback Earned”</strong> number from each bill. Not “Cashback
              Credited” — that one is last month’s money arriving.
            </p>
            <div className="grid">
              {status.issued.map((m) => (
                <label key={m}>
                  <span>
                    {monthName(m)} bill <i className="tag">{fmtRange(statementPeriod(m, day))}</i>
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    placeholder="0"
                    value={earned[m] ?? ''}
                    onChange={(e) => setEarned((s) => ({ ...s, [m]: e.target.value }))}
                  />
                  <em>paid to you on the {monthName(addMonths(m, 1))} bill</em>
                </label>
              ))}
            </div>
          </>
        )}
        {status.pending.length > 0 && (
          <p className="hint">
            Next bill{status.pending.length > 1 ? 's' : ''}:{' '}
            {status.pending.map((m) => fmtDate(statementPeriod(m, day).end)).join(' · ')}
          </p>
        )}
      </section>

      <section className="card">
        <h2>
          <I.Target /> What you get <span className="step">Step 3</span>
        </h2>

        <div className="summary">
          <div>
            <span>
              <I.Receipt /> Earned
            </span>
            <strong>{inr(totals.earned)}</strong>
          </div>
          <div className="good">
            <span>
              <I.Check /> You’ll get
            </span>
            <strong>{inr(totals.eligible)}</strong>
          </div>
          <div className={totals.forfeited > 0 ? 'bad' : ''}>
            <span>
              <I.Alert /> Wasted
            </span>
            <strong>{inr(totals.forfeited)}</strong>
          </div>
          <div>
            <span>
              <I.Wallet /> Left
            </span>
            <strong>{inr(totals.capLeft)}</strong>
          </div>
        </div>

        <div className="capbar">
          <div className="bar">
            <div style={{ width: `${pct}%` }} />
          </div>
          <small>
            {inr(totals.eligible)} of {inr(QUARTER_CAP)} used
          </small>
          {missing > 0 && (
            <small className="warnline">
              Fill in {missing === 1 ? 'the last bill' : `${missing} more bills`} for the real number.
            </small>
          )}
        </div>

        {totals.capLeft > 0 ? (
          <div className="headroom">
            <h3>
              <I.Spark /> You can still earn {inr(totals.capLeft)} — until {fmtDate(status.q.end)}
            </h3>
            <p className="big">
              Shop <strong>{inr(totals.spendLeft.flipkart)}</strong> on Flipkart to get all of it.
            </p>
            <ul>
              {RATES.map((r) => (
                <li key={r.key}>
                  <strong>{inr(totals.spendLeft[r.key])}</strong>
                  <span>
                    on {r.label} · {(r.rate * 100).toFixed(0)}% back
                  </span>
                </li>
              ))}
            </ul>
            <small>
              Any one of these gets you the full {inr(totals.capLeft)} — not all together.
            </small>
          </div>
        ) : (
          <p className="headroom done">
            <I.Alert />
            <span>
              You’ve hit the {inr(QUARTER_CAP)} limit. No more cashback until {fmtDate(status.q.end)}{' '}
              — then it starts fresh.
            </span>
          </p>
        )}

        {quarter && (
          <div className="scroller">
            <table>
              <thead>
                <tr>
                  <th>Bill</th>
                  <th>Earned</th>
                  <th>You get</th>
                  <th>Wasted</th>
                  <th>Paid on</th>
                </tr>
              </thead>
              <tbody>
                {quarter.statements.map((s) => (
                  <tr key={s.month}>
                    <td>{monthName(s.month)}</td>
                    <td>{inr(s.earned)}</td>
                    <td>
                      <strong>{inr(s.eligible)}</strong>
                    </td>
                    <td className={s.forfeited > 0 ? 'bad' : ''}>{inr(s.forfeited)}</td>
                    <td>{monthName(s.creditMonth)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <footer>
        No cashback on fuel, rent, wallet top-ups, EMIs, gold or government payments. The bank can
        take up to 90 days to pay a delayed amount, so it may arrive later than shown.
        {Object.keys(earned).length > 0 && (
          <>
            <br />
            <button type="button" className="ghost" onClick={() => setEarned({})}>
              Clear my numbers
            </button>
          </>
        )}
      </footer>
    </main>
  );
}
