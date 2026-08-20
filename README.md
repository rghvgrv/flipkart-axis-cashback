# Flipkart Axis Cashback

Tracks the ₹4,000 quarterly cashback cap on the Flipkart Axis Bank credit card, so you know how
much you can still earn before it resets — and how much to spend to actually get it.

The catch the card's terms bury: the quarter is anchored to **your statement date**, not the
calendar. With a bill on the 15th, the quarters are 16 Mar–15 Jun, 16 Jun–15 Sep, 16 Sep–15 Dec,
16 Dec–15 Mar. Cashback earned on a statement is paid on the *next* one.

## What it does

- Ask for your bill date, work out which quarter you're in and how many days are left.
- Ask only for the bills that already exist in that quarter — enter the "Cashback Earned" figure
  printed at the bottom of each.
- Show what you'll actually be paid, what the cap wasted, and how much you can still spend on
  Flipkart / Myntra / Cleartrip / partner brands to use the rest.

Everything is stored in your browser's `localStorage`. No accounts, no server, no data leaves the
device.

## Run it

```sh
npm install
npm run dev      # http://localhost:5173
npm run build    # production build into dist/
```

## The rules, in code

All of it lives in [`src/cashback.js`](src/cashback.js) — rates, the ₹4,000 cap, quarter
boundaries, and the credit-next-cycle chain. Change a rate there if the terms change.

```sh
node src/cashback.test.mjs   # asserts the quarter math and the cap
```

## Not covered

Excluded spends (fuel, rent, wallet loads, EMI, gold, government payments) earn nothing — leave
them out. Credits are processed against the merchant's MID/VPA, so a delayed one can take up to 90
days and land in a later cycle than shown.
