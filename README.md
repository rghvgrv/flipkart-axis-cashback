# Flipkart Axis Cashback

**[flipcash.rghvgrv.live](https://flipcash.rghvgrv.live)**

Tells you how much of your ₹4,000 quarterly cashback cap is left on the Flipkart Axis Bank credit
card, and how much you'd have to spend to actually use it before it resets.

## The problem it solves

The card's terms bury two details that make the cap hard to track by hand:

1. **The quarter follows your statement date, not the calendar.** If your bill comes on the 15th,
   your quarters are 16 Mar–15 Jun, 16 Jun–15 Sep, 16 Sep–15 Dec, 16 Dec–15 Mar. Someone billed on
   the 2nd has a completely different grid.
2. **Cashback earned on one bill is paid on the next one.** So the "Cashback Credited" figure on
   your statement is last month's earning arriving — not this month's. Adding up the wrong column
   gives you the wrong number.

Miss the cap and the excess is simply forfeited. There's no rollover.

## How to use it

1. Enter the day of the month your bill is generated.
2. It works out which quarter you're in, how many days are left, and which bills already exist in
   that quarter — then asks for the **"Cashback Earned"** figure from each of those.
3. You get back what you'll actually be paid, what the cap wasted, and how much more you can spend
   on Flipkart / Myntra / Cleartrip / partner brands to use up the rest.

Your figures are saved in the browser's `localStorage`. No account, no server, nothing leaves your
device.

## The rates

| Where you spend | Back | Counts toward the ₹4,000 cap |
| --- | --- | --- |
| Flipkart | 5% | yes |
| Myntra | 4% | yes |
| Cleartrip | 4% | yes |
| Partner brands (PVR, Uber, cult.fit) | 4% | no |
| Everything else | 1% | no |

No cashback at all on fuel, rent, wallet top-ups, EMIs, gold or government payments — leave those
out of the numbers you enter.

## Running it locally

```sh
npm install
npm run dev      # http://localhost:5173
npm run build    # production build into dist/
npm run lint
```

Node 22 or newer (Vite 8 requires `^20.19 || >=22.12`); `.nvmrc` pins it.

## The code

| File | What's in it |
| --- | --- |
| `src/cashback.js` | Every rule: rates, the ₹4,000 cap, quarter boundaries, the earn-now-credited-next chain. Change a rate here if the terms change. |
| `src/cashback.test.mjs` | Assertions covering the quarter math and the cap. `node src/cashback.test.mjs` — no test framework needed. |
| `src/App.jsx` | The three-step UI. |
| `src/Icons.jsx` | Inline SVGs, so there's no icon dependency. |

Run the checks before opening a PR:

```sh
node src/cashback.test.mjs && npm run build
```

## Deployment

Hosted on Cloudflare Workers as a static asset site. `wrangler.jsonc` serves `./dist` with SPA
not-found handling, so deep links and refreshes return the app rather than a 404.

Pushes to `main` build and deploy automatically; branches get their own preview URL.

## Contributing

`main` is protected — no direct pushes, every change goes through a pull request.

```sh
git checkout -b my-change
git push -u origin my-change
gh pr create --fill
```
