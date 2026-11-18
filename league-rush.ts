// League Rush event data.
//
// Every ability is a small, capped modifier on a real match roll. Effects are
// summed per team and clamped by `rushModCaps`, so no combination (run buffs
// plus the ability of the game) can push a single roll past its balance cap.

export type RushRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export type RushEffectKey =
  | "shot"
  | "shotRange"
  | "move"
  | "passRange"
  | "steal"
  | "intercept"
  | "nutmeg"
  | "keeper"
  | "clear";

export type RushEffects = Partial<Record<RushEffectKey, number>>;

export type RushAbility = {
  id: string;
  name: string;
  rarity: RushRarity;
  blurb: string;
  effects: RushEffects;
};

export type RushMods = Record<RushEffectKey, number>;

export const rushRarityMeta: Record<RushRarity, { label: string; color: string; weight: number }> = {
  common: { label: "Common", color: "#9aa7ad", weight: 1 },
  uncommon: { label: "Uncommon", color: "#5bd68a", weight: 2 },
  rare: { label: "Rare", color: "#5aa9ff", weight: 3 },
  epic: { label: "Epic", color: "#b47cff", weight: 4 },
  legendary: { label: "Legendary", color: "#f2c14e", weight: 5 },
};

export const rushRarityOrder: RushRarity[] = ["common", "uncommon", "rare", "epic", "legendary"];

// Hard ceilings after summing every source for one team.
export const rushModCaps: Record<RushEffectKey, { min: number; max: number }> = {
  shot: { min: -8, max: 8 },
  shotRange: { min: 0, max: 1 },
  move: { min: 0, max: 1 },
  passRange: { min: 0, max: 1 },
  steal: { min: -8, max: 8 },
  intercept: { min: -8, max: 8 },
  nutmeg: { min: -8, max: 8 },
  keeper: { min: -8, max: 8 },
  clear: { min: -10, max: 10 },
};

export const emptyRushMods = (): RushMods => ({
  shot: 0,
  shotRange: 0,
  move: 0,
  passRange: 0,
  steal: 0,
  intercept: 0,
  nutmeg: 0,
  keeper: 0,
  clear: 0,
});

export const rushAbilities: RushAbility[] = [
  // ------------------------------- COMMON -------------------------------
  { id: "steady-boots", name: "Steady Boots", rarity: "common", blurb: "Cleaner contact: a little extra shooting accuracy.", effects: { shot: 3 } },
  { id: "quick-press", name: "Quick Press", rarity: "common", blurb: "Close the carrier faster, slightly better steals.", effects: { steal: 3 } },
  { id: "lane-reader", name: "Lane Reader", rarity: "common", blurb: "Reads the pass early for a small interception edge.", effects: { intercept: 3 } },
  { id: "safe-hands", name: "Safe Hands", rarity: "common", blurb: "A calmer keeper narrows the shooter's angle.", effects: { keeper: 3 } },
  { id: "close-control", name: "Close Control", rarity: "common", blurb: "Tighter feet on the nutmeg attempt.", effects: { nutmeg: 3 } },
  { id: "long-cleat", name: "Long Cleat", rarity: "common", blurb: "Extra reach on goalkeeper clearances.", effects: { clear: 5 } },
  { id: "balanced-stance", name: "Balanced Stance", rarity: "common", blurb: "Small shooting and pressing gains.", effects: { shot: 2, steal: 1 } },
  { id: "cover-shadow", name: "Cover Shadow", rarity: "common", blurb: "Blocks a lane and nicks the ball.", effects: { intercept: 2, steal: 1 } },
  { id: "deep-breath", name: "Deep Breath", rarity: "common", blurb: "Composure in front of goal and on the ball.", effects: { shot: 2, nutmeg: 1 } },
  { id: "press-trigger", name: "Press Trigger", rarity: "common", blurb: "Steps out to press and read the next pass.", effects: { steal: 2, intercept: 1 } },
  { id: "tidy-touch", name: "Tidy Touch", rarity: "common", blurb: "Neat on the ball and alert off it.", effects: { nutmeg: 2, intercept: 1 } },
  { id: "wall-hands", name: "Wall Hands", rarity: "common", blurb: "Keeper parries more and clears longer.", effects: { keeper: 2, clear: 3 } },
  { id: "front-foot", name: "Front Foot", rarity: "common", blurb: "Aggressive first step into the challenge.", effects: { steal: 2, nutmeg: 1 } },
  { id: "anchored", name: "Anchored", rarity: "common", blurb: "Holds position and covers the goal.", effects: { intercept: 2, keeper: 1 } },
  { id: "calm-finish", name: "Calm Finish", rarity: "common", blurb: "Places the shot and tracks it at the other end.", effects: { shot: 2, keeper: 1 } },
  { id: "short-circuit", name: "Short Circuit", rarity: "common", blurb: "Pokes at the ball and jockeys the carrier.", effects: { nutmeg: 2, steal: 1 } },

  // ------------------------------ UNCOMMON ------------------------------
  { id: "rifle-range", name: "Rifle Range", rarity: "uncommon", blurb: "Drills low and hard, raising shooting accuracy.", effects: { shot: 5 } },
  { id: "hunting-press", name: "Hunting Press", rarity: "uncommon", blurb: "Hunts the carrier for a real steal boost.", effects: { steal: 5 } },
  { id: "anticipation", name: "Anticipation", rarity: "uncommon", blurb: "Reads the lane a beat earlier.", effects: { intercept: 5 } },
  { id: "shot-stopper", name: "Shot Stopper", rarity: "uncommon", blurb: "Gets a strong hand to more shots.", effects: { keeper: 5 } },
  { id: "elastic-touch", name: "Elastic Touch", rarity: "uncommon", blurb: "Wriggles through tight gaps on the nutmeg.", effects: { nutmeg: 5 } },
  { id: "launch-pad", name: "Launch Pad", rarity: "uncommon", blurb: "Clearances carry further and land truer.", effects: { clear: 7 } },
  { id: "poachers-instinct", name: "Poacher's Instinct", rarity: "uncommon", blurb: "Lives for the finish, still handy in a duel.", effects: { shot: 4, nutmeg: 1 } },
  { id: "counter-trap", name: "Counter Trap", rarity: "uncommon", blurb: "Springs the trap and steps into the lane.", effects: { steal: 4, intercept: 2 } },
  { id: "tight-marking", name: "Tight Marking", rarity: "uncommon", blurb: "Sticks to the runner and pinches possession.", effects: { intercept: 4, steal: 2 } },
  { id: "brave-block", name: "Brave Block", rarity: "uncommon", blurb: "Throws the body in front of shots and clears.", effects: { keeper: 4, clear: 2 } },
  { id: "feint-artist", name: "Feint Artist", rarity: "uncommon", blurb: "Sells the nutmeg and finishes the move.", effects: { nutmeg: 4, shot: 1 } },
  { id: "hunter", name: "Hunter", rarity: "uncommon", blurb: "A rounded ball-winner: press, lane, and touch.", effects: { steal: 3, intercept: 1, nutmeg: 1 } },
  { id: "deep-sitter", name: "Deep Sitter", rarity: "uncommon", blurb: "Screens the goal and cuts the passing lane.", effects: { keeper: 3, intercept: 2 } },
  { id: "press-pack", name: "Press Pack", rarity: "uncommon", blurb: "Two players press as one.", effects: { steal: 3, intercept: 2 } },
  { id: "first-touch", name: "First Touch", rarity: "uncommon", blurb: "Kills the ball dead, then goes at the defender.", effects: { nutmeg: 3, shot: 2 } },

  // -------------------------------- RARE --------------------------------
  { id: "sniper", name: "Sniper", rarity: "rare", blurb: "Picks a corner: a big shooting accuracy step.", effects: { shot: 7 } },
  { id: "ball-winner", name: "Ball Winner", rarity: "rare", blurb: "Wins the ball back far more often.", effects: { steal: 7 } },
  { id: "roadblock", name: "Roadblock", rarity: "rare", blurb: "Shuts the passing lane with a wide body.", effects: { intercept: 7 } },
  { id: "cat-reflexes", name: "Cat Reflexes", rarity: "rare", blurb: "Sharp reactions to deny clean strikes.", effects: { keeper: 7 } },
  { id: "nutmeg-merchant", name: "Nutmeg Merchant", rarity: "rare", blurb: "The signature move, near-perfected.", effects: { nutmeg: 7 } },
  { id: "field-flipper", name: "Field Flipper", rarity: "rare", blurb: "Turns defence into attack with one clearance.", effects: { clear: 9 } },
  { id: "range-finder", name: "Range Finder", rarity: "rare", blurb: "One extra tile of passing range.", effects: { passRange: 1 } },
  { id: "one-touch-link", name: "One-Touch Link", rarity: "rare", blurb: "Longer passing range and a cleaner strike.", effects: { passRange: 1, shot: 1 } },
  { id: "sharpshooter", name: "Sharpshooter", rarity: "rare", blurb: "Composed finishing with a tight first touch.", effects: { shot: 5, nutmeg: 2 } },
  { id: "sweeper-keeper", name: "Sweeper Keeper", rarity: "rare", blurb: "Goalkeeper saves and starts the counter.", effects: { keeper: 5, clear: 5 } },
  { id: "pocket-press", name: "Pocket Press", rarity: "rare", blurb: "Squeezes the carrier and the next lane.", effects: { steal: 5, intercept: 3 } },
  { id: "silk-feet", name: "Silk Feet", rarity: "rare", blurb: "Glides past challenges and finishes well.", effects: { nutmeg: 5, shot: 3 } },
  { id: "choke-lane", name: "Choke Lane", rarity: "rare", blurb: "Cuts the lane and guards the near post.", effects: { intercept: 5, keeper: 2 } },
  { id: "double-pivot", name: "Double Pivot", rarity: "rare", blurb: "Two holding midfielders screen the middle.", effects: { steal: 4, intercept: 4 } },

  // -------------------------------- EPIC --------------------------------
  { id: "marauder", name: "Marauder", rarity: "epic", blurb: "One extra dribble tile, plus a stronger challenge.", effects: { move: 1, steal: 2 } },
  { id: "fast-break", name: "Fast Break", rarity: "epic", blurb: "One extra dribble tile and a better finish at the end of it.", effects: { move: 1, shot: 2 } },
  { id: "golden-boot", name: "Golden Boot", rarity: "epic", blurb: "Elite finishing: the maximum shooting boost.", effects: { shot: 8 } },
  { id: "destroyer", name: "Destroyer", rarity: "epic", blurb: "Wins nearly every 50/50 challenge.", effects: { steal: 8 } },
  { id: "iron-curtain", name: "Iron Curtain", rarity: "epic", blurb: "Nothing travels through the middle.", effects: { intercept: 8 } },
  { id: "brick-wall", name: "Brick Wall", rarity: "epic", blurb: "The maximum goalkeeper boost.", effects: { keeper: 8 } },
  { id: "ghost", name: "Ghost", rarity: "epic", blurb: "Disappears past the defender at will.", effects: { nutmeg: 8 } },
  { id: "rocket-arm", name: "Rocket Arm", rarity: "epic", blurb: "A clearance that lands on a teammate.", effects: { clear: 10 } },
  { id: "playmaker", name: "Playmaker", rarity: "epic", blurb: "Extra passing range and a real shot threat.", effects: { passRange: 1, shot: 3 } },
  { id: "tiki-taka", name: "Tiki-Taka", rarity: "epic", blurb: "Extra passing range with quick feet.", effects: { passRange: 1, nutmeg: 3 } },
  { id: "clinical-touch", name: "Clinical Touch", rarity: "epic", blurb: "Deadly in the box, tidy in the duel.", effects: { shot: 6, nutmeg: 2 } },
  { id: "press-monster", name: "Press Monster", rarity: "epic", blurb: "Relentless pressure through the middle.", effects: { steal: 6, intercept: 2 } },

  // ----------------------------- LEGENDARY ------------------------------
  { id: "total-football", name: "Total Football", rarity: "legendary", blurb: "One extra dribble tile and a maximum-tier shot.", effects: { move: 1, shot: 3 } },
  { id: "midfield-general", name: "Midfield General", rarity: "legendary", blurb: "Extra passing range and dominant pressing.", effects: { passRange: 1, steal: 4 } },
  { id: "the-wall", name: "The Wall", rarity: "legendary", blurb: "Elite keeper with a lane-screening bonus.", effects: { keeper: 8, intercept: 3 } },
  { id: "risk-taker", name: "Risk Taker", rarity: "legendary", blurb: "Big shooting and passing gains, but the keeper is exposed.", effects: { shot: 6, passRange: 1, keeper: -4 } },
  { id: "bunker", name: "Bunker", rarity: "legendary", blurb: "Maximum keeper protection at the cost of cutting edge.", effects: { keeper: 8, shot: -4 } },
  { id: "overdrive", name: "Overdrive", rarity: "legendary", blurb: "One extra dribble tile and brutal pressing, but looser lanes.", effects: { move: 1, steal: 4, intercept: -3 } },
  { id: "gegenpress", name: "Gegenpress", rarity: "legendary", blurb: "Suffocating interceptions and counter-pressing, weaker clearances.", effects: { intercept: 8, steal: 3, clear: -4 } },
  { id: "one-club-legend", name: "One Club Legend", rarity: "legendary", blurb: "A complete attacker: finishing plus close control.", effects: { shot: 7, nutmeg: 4 } },
  { id: "iron-lungs", name: "Iron Lungs", rarity: "legendary", blurb: "Never stops running: pressing and lane coverage.", effects: { steal: 5, intercept: 5 } },
  { id: "golden-gloves", name: "Golden Gloves", rarity: "legendary", blurb: "A keeper who saves it and starts the attack.", effects: { keeper: 7, clear: 8 } },
];

export const rushAbilityById = (id: string | null | undefined) =>
  (id ? rushAbilities.find((ability) => ability.id === id) : undefined) ?? null;

const effectLabels: Record<RushEffectKey, { label: string; suffix: string; per: number }> = {
  shot: { label: "Shooting accuracy", suffix: " pts", per: 1 },
  steal: { label: "Steal chance", suffix: "%", per: 1 },
  intercept: { label: "Interception", suffix: "%", per: 1 },
  nutmeg: { label: "Nutmeg chance", suffix: "%", per: 1 },
  keeper: { label: "Keeper save", suffix: "%", per: 1 },
  clear: { label: "Clearance accuracy", suffix: "%", per: 1 },
  shotRange: { label: "Shot range", suffix: " tile", per: 1 },
  passRange: { label: "Pass range", suffix: " tile", per: 1 },
  move: { label: "Dribble range", suffix: " tile", per: 1 },
};

export const rushEffectLabels = (ability: RushAbility) =>
  (Object.entries(ability.effects) as [RushEffectKey, number][]).map(([key, value]) => {
    const meta = effectLabels[key];
    const amount = value * meta.per;
    return {
      key,
      label: meta.label,
      value: amount,
      text: `${amount > 0 ? "+" : ""}${amount}${meta.suffix} ${meta.label}`,
    };
  });

export const rushEffectSummary = (ability: RushAbility) =>
  rushEffectLabels(ability).map((item) => item.text).join(" · ");

const effectWeights: Record<RushEffectKey, number> = {
  shot: 1,
  steal: 1,
  intercept: 1,
  nutmeg: 1,
  keeper: 1,
  clear: 0.6,
  shotRange: 7,
  passRange: 7,
  move: 9,
};

// Rough power score used by the balance test and the draft weighting.
export const rushAbilityPower = (ability: RushAbility) =>
  Math.round((Object.entries(ability.effects) as [RushEffectKey, number][])
    .reduce((total, [key, value]) => total + value * effectWeights[key], 0) * 10) / 10;

// Positive-only spend, so tradeoff abilities can be rated by what they give
// up rather than by their (intentionally lower) net value.
export const rushAbilitySpend = (ability: RushAbility) =>
  Math.round((Object.entries(ability.effects) as [RushEffectKey, number][])
    .reduce((total, [key, value]) => total + (value > 0 ? value * effectWeights[key] : 0), 0) * 10) / 10;

export const rushModsFor = (ids: (string | null | undefined)[]): RushMods => {
  const mods = emptyRushMods();
  ids.forEach((id) => {
    const ability = rushAbilityById(id);
    if (!ability) return;
    (Object.entries(ability.effects) as [RushEffectKey, number][]).forEach(([key, value]) => {
      mods[key] += value;
    });
  });
  (Object.keys(mods) as RushEffectKey[]).forEach((key) => {
    mods[key] = Math.max(rushModCaps[key].min, Math.min(rushModCaps[key].max, mods[key]));
  });
  return mods;
};

const rarityWeightsForLevel = (level: number): Record<RushRarity, number> => {
  const progress = Math.max(0, Math.min(1, (level - 75) / 25));
  const atFloor: Record<RushRarity, number> = { common: 42, uncommon: 33, rare: 19, epic: 5, legendary: 1 };
  const atCeiling: Record<RushRarity, number> = { common: 10, uncommon: 22, rare: 31, epic: 25, legendary: 12 };
  return {
    common: atFloor.common + (atCeiling.common - atFloor.common) * progress,
    uncommon: atFloor.uncommon + (atCeiling.uncommon - atFloor.uncommon) * progress,
    rare: atFloor.rare + (atCeiling.rare - atFloor.rare) * progress,
    epic: atFloor.epic + (atCeiling.epic - atFloor.epic) * progress,
    legendary: atFloor.legendary + (atCeiling.legendary - atFloor.legendary) * progress,
  };
};

const rollRarity = (rng: () => number, level: number): RushRarity => {
  const weights = rarityWeightsForLevel(level);
  const total = rushRarityOrder.reduce((sum, rarity) => sum + weights[rarity], 0);
  let ticket = rng() * total;
  for (const rarity of rushRarityOrder) {
    ticket -= weights[rarity];
    if (ticket <= 0) return rarity;
  }
  return "common";
};

export const rollRushAbilities = (
  rng: () => number,
  count: number,
  level = 75,
  exclude: string[] = [],
): RushAbility[] => {
  const taken = new Set(exclude);
  const picks: RushAbility[] = [];
  let guard = 0;
  while (picks.length < count && guard < 400) {
    guard += 1;
    const rarity = rollRarity(rng, level);
    const pool = rushAbilities.filter((ability) => ability.rarity === rarity && !taken.has(ability.id));
    const fallback = rushAbilities.filter((ability) => !taken.has(ability.id));
    const source = pool.length ? pool : fallback;
    if (!source.length) break;
    const ability = source[Math.floor(rng() * source.length) % source.length];
    taken.add(ability.id);
    picks.push(ability);
  }
  return picks;
};

export const rushDifficultyForGame = (game: number) =>
  Math.max(75, Math.min(100, 75 + (Math.max(1, game) - 1) * 5));

export const LEAGUE_RUSH_GOAL_TARGET = 3;
export const LEAGUE_RUSH_CONCEDE_LIMIT = 5;
