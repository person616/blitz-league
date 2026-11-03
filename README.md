# Blitz League

**Play the game:** [https://person616.github.io/blitz-league/](https://person616.github.io/blitz-league/)

Blitz League is a turn-based soccer tactics game featuring MLS-inspired players, campaign matches, quickplay, and a season pass.

Player ratings and ability values are gameplay estimates, not official MLS statistics. Ability is a numeric stat and is weighted twice when calculating OVR: `(base rating + 2 × ability) / 3`. Player selection uses this OVR, while abilities also affect their matching gameplay actions. Season-pass player rewards are ordered from lower to higher modeled win impact, with 90+ OVR milestone players at levels 21 (Mukhtar), 41 (Puig), 61 (Messi), 81 (Bouanga), 101 (Vela), 121 (Bürki), 141 (Cucho), and 161 (Suárez).

The reward balance model was tested on seeded, synthetic self-play—not real MLS match data. It used 36,000 simulated matches to fit a logistic win-probability model, then compared individual player upgrades against 320 held-out lineups and tested top-player pairs. These results guide game balance only and should not be read as real-world player rankings. Players start in their listed positions; unlocked players can be repositioned in the Locker Room. Set or unbind the end-turn key in Settings.

Season-pass levels require 1,000 XP each. Regular match wins grant 100 XP; campaign wins grant 100 XP per campaign stage. The campaign has 55 levels, with Street 3v3 unlocking at pass level 10 and Golden Goal at level 20.

The Store has four daily player offers, coin-to-XP purchases at 4 XP per coin, and Basic, Blitz, and Thanksgiving crates. Every crate includes a random club color; duplicate colors convert to coins. The Thanksgiving crate is available through November 30, 2026. Locker Room saves separate colors for your team and the opposition and warns when they are too similar. Purchases, crate rewards, and kit selections are stored in the browser's local save.

The Locker Room player roster can be sorted by name, position, club, OVR, base rating, ability, mean stats, Season Pass unlock order, and unlocked/locked status.

The current save version performs a one-time season reset for returning browsers: older saves start with the regular starting XI, base progression, and default club kits; subsequent progress is saved normally. Since saves are stored locally in each browser, the reset takes effect the next time a returning player visits the site.

For local development only, run `npm run dev` and open `http://localhost:5173/blitz-league/?blitz-dev=tools` to enable developer controls (all unlocks, unlimited/free store purchases, and a force-win button). Developer mode is gated by Vite's development flag, skips saved progress, and is unavailable in production builds and on the public website.

## Run locally

1. Install Node.js.
2. Run `npm install`.
3. Run `npm run dev` and open the local URL Vite prints.

The public website is deployed from the `main` branch using GitHub Pages.
