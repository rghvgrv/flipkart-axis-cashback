// Run: node src/cashback.test.mjs
import assert from 'node:assert/strict';
import {
  calculate, statementQuarter, statementPeriod, quarterStatus, fmtRange, fmtDate, QUARTER_CAP,
} from './cashback.js';

// Statement date 15th => Q1 is 16 Mar – 15 Jun.
assert.equal(fmtRange(statementPeriod('2026-04', 15)), '16 Mar 2026 – 15 Apr 2026');
const q1 = statementQuarter('2026-05', 15);
assert.equal(q1.n, 1);
assert.deepEqual(q1.months, ['2026-04', '2026-05', '2026-06']);
assert.equal(fmtRange(q1), '16 Mar 2026 – 15 Jun 2026');
assert.equal(fmtRange(statementQuarter('2026-09', 15)), '16 Jun 2026 – 15 Sept 2026');
assert.equal(fmtRange(statementQuarter('2026-12', 15)), '16 Sept 2026 – 15 Dec 2026');
// Q4 wraps the year: a Feb 2026 statement belongs to 16 Dec 2025 – 15 Mar 2026.
const q4 = statementQuarter('2026-02', 15);
assert.equal(q4.n, 4);
assert.deepEqual(q4.months, ['2026-01', '2026-02', '2026-03']);
assert.equal(fmtRange(q4), '16 Dec 2025 – 15 Mar 2026');
// Another statement date shifts the whole grid.
assert.equal(fmtRange(statementQuarter('2026-05', 2)), '3 Mar 2026 – 2 Jun 2026');
// A statement day past the end of a short month clamps.
assert.equal(fmtRange(statementPeriod('2026-03', 31)), '1 Mar 2026 – 31 Mar 2026');

// Earned this month is credited next month.
const [qa] = calculate([
  { month: '2026-07', earned: 202 },
  { month: '2026-08', earned: 500 },
]);
assert.equal(qa.statements[0].credited, null); // no prior statement entered
assert.equal(qa.statements[0].creditMonth, '2026-08');
assert.equal(qa.statements[1].credited, 202);  // Aug statement credits July's earn
assert.equal(qa.totals.earned, 702);
assert.equal(qa.totals.capLeft, 3298);
assert.equal(qa.totals.spendLeft.flipkart, 65960); // 3298 / 5%

// Quarter cap bites, and only the eligible part is ever credited.
const [qb] = calculate([
  { month: '2026-09', earned: 3000 },
  { month: '2026-07', earned: 3000 },
  { month: '2026-08', earned: 3000 },
]);
assert.deepEqual(qb.statements.map((s) => s.month), ['2026-07', '2026-08', '2026-09']);
assert.equal(qb.statements[0].eligible, 3000);
assert.equal(qb.statements[1].eligible, 1000);
assert.equal(qb.statements[1].forfeited, 2000);
assert.equal(qb.statements[2].eligible, 0);
assert.equal(qb.statements[2].credited, 1000); // Sept credits Aug's capped earn, not the 3000
assert.equal(qb.totals.eligible, QUARTER_CAP);
assert.equal(qb.totals.capLeft, 0);

// The cap resets per quarter, but the credit chain still crosses the boundary.
const qs = calculate([
  { month: '2026-06', earned: 4000 }, // last statement of Q1
  { month: '2026-07', earned: 100 },  // first statement of Q2
]);
assert.deepEqual(qs.map((x) => x.q.n), [2, 1]); // newest first
const jul = qs[0].statements[0];
assert.equal(jul.eligible, 100);          // fresh cap
assert.equal(jul.credited, 4000);         // credits June's earn from the previous quarter
assert.equal(qs[0].totals.capLeft, 3900);

// Missing statements in a quarter are reported.
assert.deepEqual(qs[1].totals.missing, ['2026-04', '2026-05']);

// Where the card stands "today", statement date 15th.
// 10 Sept: still inside the 16 Aug – 15 Sept period, so the quarter is 16 Jun – 15 Sept
// and the Jul + Aug statements already exist — exactly the two figures to ask for.
const mid = quarterStatus(new Date(2026, 8, 10), 15);
assert.equal(mid.q.n, 2);
assert.equal(mid.open, '2026-09');
assert.deepEqual(mid.issued, ['2026-07', '2026-08']);
assert.deepEqual(mid.pending, ['2026-09']);
assert.equal(fmtRange(mid.period), '16 Aug 2026 – 15 Sept 2026');
assert.equal(mid.daysLeftInPeriod, 5);
assert.equal(mid.daysLeftInQuarter, 5); // last period of the quarter

// 20 Sept: past the 15th, so a brand new quarter with nothing earned in it yet.
const fresh = quarterStatus(new Date(2026, 8, 20), 15);
assert.equal(fresh.q.n, 3);
assert.equal(fresh.open, '2026-10');
assert.deepEqual(fresh.issued, []);
assert.equal(fmtDate(fresh.q.start), '16 Sept 2026');
assert.equal(fresh.daysLeftInQuarter, 86);

// A different statement date moves the whole thing.
const d28 = quarterStatus(new Date(2026, 8, 20), 28);
assert.equal(d28.open, '2026-09');
assert.deepEqual(d28.issued, ['2026-07', '2026-08']);

console.log('all cashback checks passed');
