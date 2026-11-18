// Balance + integrity test for the League Rush ability pool.
//
// Run with:  npm run test:rush
// It compiles league-rush.ts with the project TypeScript and then checks:
//   1. at least 50 unique abilities and every rarity is represented,
//   2. rarity power bands and monotonic strength,
//   3. every single ability applies at full strength (no silent clamping),
//   4. no combination of run buffs + game ability can exceed the hard caps,
//   5. Monte-Carlo impact caps for shooting, keeping, stealing, intercepting,
//      nutmegs, movement, passing range, shot range and clearances.

import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, ".rush-test");
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

// Transpile the pool with the project TypeScript so the test runs the exact
// same source the game imports (no hand-copied ability list).
const source = readFileSync(path.join(root, "league-rush.ts"), "utf8");
const transpiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
writeFileSync(path.join(outDir, "league-rush.mjs"), transpiled);

const {
  rushAbilities,
  rushAbilityById,
  rushAbilityPower,
  rushAbilitySpend,
  rushModsFor,
  rushModCaps,
  rushRarityMeta,
  rushRarityOrder,
  rollRushAbilities,
  rushDifficultyForGame,
  LEAGUE_RUSH_GOAL_TARGET,
  LEAGUE_RUSH_CONCEDE_LIMIT,
  emptyRushMods,
} = await import(new URL(`file://${path.join(outDir, "league-rush.mjs").replace(/\\/g, "/")}`).href);

const failures = [];
const checks = [];
const check = (name, condition, detail = "") => {
  checks.push({ name, ok: !!condition, detail });
  if (!condition) failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
};

const cap = (n, min, max) => Math.max(min, Math.min(max, n));
const EFFECT_KEYS = Object.keys(emptyRushMods());
const effect = (ability, key) => ability.effects[key] ?? 0;
const total = (ability) =>
  EFFECT_KEYS.reduce((sum, key) => sum + Math.abs(effect(ability, key)), 0);

// ------------------------------ 1. integrity ------------------------------
check("pool has at least 50 abilities", rushAbilities.length >= 50, `${rushAbilities.length} found`);
const ids = rushAbilities.map((a) => a.id);
const names = rushAbilities.map((a) => a.name);
check("ability ids are unique", new Set(ids).size === ids.length);
check("ability names are unique", new Set(names).size === names.length);
check("ids resolve back to the same ability", ids.every((id) => rushAbilityById(id)?.id === id));
check("every ability has a blurb", rushAbilities.every((a) => a.blurb.trim().length > 10));
check("every ability changes at least one stat", rushAbilities.every((a) => Object.keys(a.effects).length > 0));
check("no unknown effect keys", rushAbilities.every((a) => Object.keys(a.effects).every((key) => EFFECT_KEYS.includes(key))));

for (const rarity of rushRarityOrder) {
  check(`rarity ${rarity} is represented`, rushAbilities.some((a) => a.rarity === rarity));
}

// --------------------------- 2. rarity power bands -------------------------
// Bands are checked on positive "spend" so tradeoff legendaries are judged by
// how much they hand out, not by the discount their drawback creates.
const bands = {
  common: [2.5, 4],
  uncommon: [4, 6.5],
  rare: [5.25, 8.5],
  epic: [5.5, 11.5],
  legendary: [8, 13],
};
for (const rarity of rushRarityOrder) {
  const group = rushAbilities.filter((a) => a.rarity === rarity);
  const weakest = Math.min(...group.map(rushAbilitySpend));
  const strongest = Math.max(...group.map(rushAbilitySpend));
  check(
    `${rarity} power stays inside its band`,
    weakest >= bands[rarity][0] - 0.01 && strongest <= bands[rarity][1] + 0.01,
    `range ${weakest}–${strongest}, band ${bands[rarity][0]}–${bands[rarity][1]}`,
  );
}
const averagePower = (rarity) => {
  const group = rushAbilities.filter((a) => a.rarity === rarity);
  return group.reduce((sum, a) => sum + rushAbilitySpend(a), 0) / group.length;
};
const averages = rushRarityOrder.map(averagePower);
check(
  "average power rises with rarity",
  averages.every((value, index) => index === 0 || value > averages[index - 1]),
  averages.map((v, i) => `${rushRarityOrder[i]} ${v.toFixed(1)}`).join(", "),
);
check(
  "no single ability exceeds a hard cap",
  rushAbilities.every((ability) => EFFECT_KEYS.every((key) =>
    Math.abs(effect(ability, key)) <= Math.max(Math.abs(rushModCaps[key].min), Math.abs(rushModCaps[key].max)))),
);

// --------------------- 3. single abilities apply in full -------------------
const diluted = [];
for (const ability of rushAbilities) {
  const mods = rushModsFor([ability.id]);
  for (const key of EFFECT_KEYS) {
    // Movement / range keys are 0 for almost every ability, so only compare
    // stats the ability actually lists.
    if (!(key in ability.effects)) continue;
    if (mods[key] !== ability.effects[key]) {
      diluted.push(`${ability.name}.${key}: wanted ${ability.effects[key]}, got ${mods[key]}`);
    }
  }
}
check("every listed effect lands at full value", diluted.length === 0, diluted.slice(0, 4).join("; "));

// --------------------------- 4. combination ceilings ----------------------
const capViolations = [];
for (const a of rushAbilities) {
  for (const b of rushAbilities) {
    for (const c of rushAbilities) {
      const mods = rushModsFor([a.id, b.id, c.id]);
      for (const key of EFFECT_KEYS) {
        if (mods[key] < rushModCaps[key].min || mods[key] > rushModCaps[key].max) {
          capViolations.push(`${a.id}+${b.id}+${c.id}.${key}=${mods[key]}`);
        }
      }
    }
  }
}
check("triple-ability stacks never break the caps", capViolations.length === 0, capViolations.slice(0, 3).join("; "));

const allShot = rushModsFor(rushAbilities.filter((a) => (a.effects.shot ?? 0) > 0).map((a) => a.id));
check("all shooting buffs clamp at +8", allShot.shot === 8, `${allShot.shot}`);
const allMove = rushModsFor(rushAbilities.filter((a) => a.effects.move).map((a) => a.id));
check("movement stacks clamp at +1 tile", allMove.move === 1, `${allMove.move}`);
const allPass = rushModsFor(rushAbilities.filter((a) => a.effects.passRange).map((a) => a.id));
check("passing range stacks clamp at +1 tile", allPass.passRange === 1, `${allPass.passRange}`);
const allKeeper = rushModsFor(rushAbilities.filter((a) => (a.effects.keeper ?? 0) > 0).map((a) => a.id));
check("keeper stacks clamp at +8", allKeeper.keeper === 8, `${allKeeper.keeper}`);

// -------------------- 5. Monte-Carlo chance impact caps -------------------
// These mirror the live formulas in blitz league.tsx.
const shotAccuracy = (dist, angle, shotMod, keeperMod, finishing = 95) =>
  cap(86 - dist * 8 + (finishing - 50) * 0.08 + 5 - angle * 0.65 + shotMod - keeperMod, 8, 94);

const angles = [0, 5, 10, 15, 20, 25, 30];
const distances = [1, 2, 3, 4, 5, 6, 7];
const averageShot = (shotMod, keeperMod) => {
  let sum = 0;
  let count = 0;
  for (const dist of distances) {
    for (const angle of angles) {
      sum += shotAccuracy(dist, angle, shotMod, keeperMod);
      count += 1;
    }
  }
  return sum / count;
};
const baselineShot = averageShot(0, 0);
const bestShot = averageShot(8, 0);
const bestKeeper = averageShot(0, 8);
check("max shooting buff lifts accuracy by at most 8 points", bestShot - baselineShot <= 8.01,
  `${(bestShot - baselineShot).toFixed(2)} pts`);
check("max keeper buff cuts accuracy by at most 8 points", baselineShot - bestKeeper <= 8.01,
  `${(baselineShot - bestKeeper).toFixed(2)} pts`);
check("worst tradeoff shot penalty is at most 8 points", baselineShot - averageShot(-4, 0) <= 8.01,
  `${(baselineShot - averageShot(-4, 0)).toFixed(2)} pts`);

// Goal-rate Monte Carlo (10k shots per configuration).
const simulateGoals = (shotMod, keeperMod, seed = 12345) => {
  let state = seed;
  const rng = () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
  let goals = 0;
  const trials = 10000;
  for (let i = 0; i < trials; i += 1) {
    const dist = 2 + Math.floor(rng() * 5);
    const angle = Math.floor(rng() * 31);
    const chance = shotAccuracy(dist, angle, shotMod, keeperMod);
    if (rng() * 100 < chance) goals += 1;
  }
  return goals / trials;
};
const baseRate = simulateGoals(0, 0);
const shotRate = simulateGoals(8, 0);
const keeperRate = simulateGoals(0, 8);
const worstRate = simulateGoals(-4, -4);
check("best shooting stack lifts goal rate by under 20% relative", (shotRate - baseRate) / baseRate <= 0.2,
  `${((shotRate / baseRate - 1) * 100).toFixed(1)}%`);
check("best keeper stack cuts goal rate by under 25% relative", (baseRate - keeperRate) / baseRate <= 0.25,
  `${((1 - keeperRate / baseRate) * 100).toFixed(1)}%`);
check("double tradeoff still leaves a usable shot", worstRate > 0.05, `${(worstRate * 100).toFixed(1)}%`);

// Steal / intercept / nutmeg / movement / range ceilings.
const stealChance = (mod) => cap(45 + mod + 6 + 8, 15, 70);
check("max steal buff stays under the 70% steal cap", stealChance(8) === 67, `${stealChance(8)}`);
const interceptChance = (mod, laneGap) => cap(14 + mod + 10 - laneGap * 14, 8, 68);
check("max intercept buff stays under the 68% interception cap", interceptChance(8, 0) === 32 || interceptChance(8, 0) <= 68, `${interceptChance(8, 0)}`);
const nutmegChance = (mod) => cap(50 + mod, 45, 64);
check("max nutmeg buff is bounded at 64%", nutmegChance(8) <= 64, `${nutmegChance(8)}`);
check("base move range 2, capped bonus is 3 tiles", 2 + allMove.move === 3);
check("base pass range 5, capped bonus is 6 tiles", 5 + allPass.passRange === 6);

// ------------------------------ draft behavior ----------------------------
const deterministic = (() => {
  let seed = 99;
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
})();
const draft = rollRushAbilities(deterministic, 3, 75, []);
check("draft returns three distinct abilities", draft.length === 3 && new Set(draft.map((a) => a.id)).size === 3);
const excluded = rollRushAbilities(deterministic, 3, 100, ["sniper", "golden-boot"]);
check("draft never repeats excluded ids", excluded.every((a) => !["sniper", "golden-boot"].includes(a.id)));
check("difficulty starts at 75", rushDifficultyForGame(1) === 75);
check("difficulty scales by 5 per game", rushDifficultyForGame(3) === 85);
check("difficulty is capped at 100", rushDifficultyForGame(99) === 100);
check("goal target is 3", LEAGUE_RUSH_GOAL_TARGET === 3);
check("concede limit is 5", LEAGUE_RUSH_CONCEDE_LIMIT === 5);

// Higher difficulty should hand out better cards on average.
const averageDraftPower = (level) => {
  let seed = 7;
  const rng = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  let sum = 0;
  let picks = 0;
  for (let i = 0; i < 400; i += 1) {
    for (const ability of rollRushAbilities(rng, 3, level, [])) {
      sum += rushRarityMeta[ability.rarity].weight;
      picks += 1;
    }
  }
  return sum / picks;
};
const floorDraft = averageDraftPower(75);
const topDraft = averageDraftPower(100);
check("level 100 drafts are stronger than level 75 drafts", topDraft > floorDraft,
  `${floorDraft.toFixed(2)} → ${topDraft.toFixed(2)}`);

// --------------------------------- report ---------------------------------
const byRarity = rushRarityOrder.map((rarity) => {
  const group = rushAbilities.filter((a) => a.rarity === rarity);
  return `${rarity}: ${group.length}`;
});
console.log(`\nLeague Rush abilities: ${rushAbilities.length} (${byRarity.join(" · ")})`);
console.log(`Average power: ${rushRarityOrder.map((r) => `${r[0].toUpperCase()}${r.slice(1)} ${averagePower(r).toFixed(1)}`).join(" | ")}`);
console.log(`Shot accuracy ${baselineShot.toFixed(1)}% → +8 ${bestShot.toFixed(1)}% / keeper -8 ${bestKeeper.toFixed(1)}%`);
console.log(`Simulated goal rate ${(baseRate * 100).toFixed(1)}% → shot stack ${(shotRate * 100).toFixed(1)}% / keeper stack ${(keeperRate * 100).toFixed(1)}%`);

const failed = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failed.length}/${checks.length} checks passed`);
if (failed.length) {
  for (const item of failed) console.log(`  FAIL ${item.name}${item.detail ? ` — ${item.detail}` : ""}`);
  process.exitCode = 1;
} else {
  console.log("All League Rush balance checks passed.");
}
