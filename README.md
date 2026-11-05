# Blitz League

**Play the game:** [https://person616.github.io/blitz-league/](https://person616.github.io/blitz-league/)

Blitz League is a turn-based soccer tactics game featuring MLS-inspired players, campaign matches, quickplay, and a season pass.

Player ratings and ability values are gameplay estimates, not official MLS statistics. Ability is a numeric stat and is weighted twice when calculating OVR: `(base rating + 2 × ability) / 3`. Player selection uses this OVR, while abilities also affect their matching gameplay actions. Season-pass player rewards are ordered from lower to higher modeled win impact, with 90+ OVR milestone players at levels 21 (Mukhtar), 41 (Puig), 61 (Messi), 81 (Bouanga), 101 (Vela), 121 (Bürki), 141 (Cucho), and 161 (Suárez).

The reward balance model was tested on seeded, synthetic self-play—not real MLS match data. It used 36,000 simulated matches to fit a logistic win-probability model, then compared individual player upgrades against 320 held-out lineups and tested top-player pairs. These results guide game balance only and should not be read as real-world player rankings. The Locker Room includes a tactical pitch editor for selecting a formation and assigning exact players to roles such as LB, CB, CAM, and ST. Set or unbind the end-turn key in Settings.

Season-pass levels require 1,000 XP each. Regular match wins grant 100 XP; campaign wins grant 100 XP per campaign stage. The 105-stage campaign rotates match rules: every seventh stage is Golden Goal, and other stages divisible by five are Street 3v3. Street 3v3 and Golden Goal also unlock as Quickplay modes at pass levels 10 and 20.

The Store has four daily player offers, coin-to-XP purchases at 4 XP per coin, and Basic, Blitz, and Thanksgiving crates. Crates can award custom tactical formations as well as players; each crate includes a random club color, and duplicate colors convert to coins. The Thanksgiving crate is available through November 30, 2026. Locker Room saves separate colors for your team and the opposition and warns when they are too similar. Purchases, crate rewards, formation unlocks, and kit selections are stored in the browser's local save.

The Locker Room player roster can be sorted by name, position, club, OVR, base rating, ability, mean stats, Season Pass unlock order, and unlocked/locked status.

The current save version performs a one-time season reset for returning browsers: older saves start with the regular starting XI, base progression, and default club kits; subsequent progress is saved normally. Since saves are stored locally in each browser, the reset takes effect the next time a returning player visits the site.

## Online 1v1

The GitHub Pages site connects to a WebSocket room relay deployed on Render. Deploy the included `render.yaml` blueprint from this repository at [Render](https://render.com/deploy?repo=https://github.com/person616/blitz-league); it creates the `person616-blitz-league-match-relay` service. Once deployed, choose Quickplay → Online · 11v11, select Create Game, and share the seven-digit code. The other player enters that code and selects Join Game; they do not need a server address.

The free Render service may take a short time to wake when idle. Rooms are temporary and close if the creating player disconnects or the service restarts. Room codes are invitations, not account authentication; the relay is intended for casual matches and does not provide ranked-match anti-cheat or persistent sessions.

Goalkeepers have a separate Clearing stat and can use Clear only while controlling the ball inside their own penalty area. Clears are aimed at the team's most advanced outfield player, travel upfield, and become less accurate over longer distances; higher Clearing improves accuracy. Keepers stay back during team movement. Passing reach is five tiles, with a playmaking bonus extending it by one; nearby CPU defenders prioritize closing down and challenging the ball carrier.

The CPU combines hand-authored defensive positioning, local play-style adaptation, and a compact learned attack-action policy. The policy predicts pass, carry, or shot choices from field zone, pressure, score, and match time. Its logistic-regression weights are trained on the public StatsBomb Open Data event files, with held-out matches used for validation; defensive positioning remains rule-based because the open event files do not provide full-match player tracking. The pinned source revision lists 3,961 matches across 80 competition-seasons—not hundreds of thousands—and the game does not claim that broader coverage.

The model artifact contains only learned weights and aggregate training/validation counts, not raw match files. To reproduce it, run `npm run train:real-match-policy`; this downloads the event files from the pinned [StatsBomb Open Data](https://github.com/hudl/open-data) revision and writes `real-match-policy.json`. The source asks users to credit StatsBomb and use its logo when publishing analysis or insights based on the data; the game links the dataset and displays the official StatsBomb icon in the CPU difficulty panel.

Street 3v3 places the goalkeeper, midfielder, and forward in separate mirrored positions, with the midfielder taking kickoff. Fullscreen shows the complete pitch and scales player tokens and the ball relative to the pitch size.

For local development only, run `npm run dev` and open `http://localhost:5173/blitz-league/?blitz-dev=tools` to enable developer controls (all unlocks, unlimited/free store purchases, and a force-win button). Developer mode is gated by Vite's development flag, skips saved progress, and is unavailable in production builds and on the public website.

## Run locally

1. Install Node.js.
2. Run `npm install`.
3. Run `npm run dev` and open the local URL Vite prints.

The public website is deployed from the `main` branch using GitHub Pages.
