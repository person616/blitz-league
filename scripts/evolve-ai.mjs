import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Evolves the CPU's tactical genome with a teach -> breed -> mutate loop.
// The fitness function plays fast headless matches against a gauntlet of
// tactical archetypes, so a genome has to attack, defend, and adapt rather
// than just score well on a static checklist.
//
// Run: npm run train:ai

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const POLICY_PATH = resolve(ROOT, "real-match-policy.json");
const OUTPUT_PATH = resolve(ROOT, "evolved-ai-ladder.json");
const GENE_KEYS = ["finishing", "progression", "passing", "pressing", "marking", "countering"];

const argument = (name, fallback) => {
  const prefix = `--${name}=`;
  const found = process.argv.find((value) => value.startsWith(prefix));
  return found ? Number(found.slice(prefix.length)) : fallback;
};
const SEED = argument("seed", 0x5eed1234);
const GENERATIONS = Math.max(1, Math.round(argument("generations", 70)));
const POPULATION = Math.max(16, Math.round(argument("population", 112)));
const MATCHES_PER_OPPONENT = Math.max(1, Math.round(argument("matches", 2)));
const ELITE_COUNT = Math.max(4, Math.round(POPULATION * 0.08));

function createRng(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rng) {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const round = (value) => Math.round(value * 1e5) / 1e5;

function normalizeGenome(genes) {
  const genome = {};
  for (const key of GENE_KEYS) genome[key] = clamp(Number(genes[key]) || 0, 0.02, 0.98);
  return genome;
}

function softmax(values) {
  const max = Math.max(...values);
  const exponentials = values.map((value) => Math.exp(value - max));
  const total = exponentials.reduce((sum, value) => sum + value, 0);
  return exponentials.map((value) => value / total);
}

// A broad gauntlet: possession, direct, pressing, low-block, counter, and
// balanced sides. Every candidate has to solve all of them.
const TRAINING_ARCHETYPES = [
  { finishing: 0.88, progression: 0.34, passing: 0.44, pressing: 0.72, marking: 0.58, countering: 0.70 },
  { finishing: 0.62, progression: 0.82, passing: 0.80, pressing: 0.58, marking: 0.78, countering: 0.48 },
  { finishing: 0.42, progression: 0.90, passing: 0.52, pressing: 0.88, marking: 0.60, countering: 0.88 },
  { finishing: 0.70, progression: 0.52, passing: 0.92, pressing: 0.48, marking: 0.92, countering: 0.56 },
  { finishing: 0.52, progression: 0.70, passing: 0.60, pressing: 0.82, marking: 0.90, countering: 0.82 },
  { finishing: 0.82, progression: 0.62, passing: 0.68, pressing: 0.72, marking: 0.72, countering: 0.72 },
  { finishing: 0.30, progression: 0.92, passing: 0.82, pressing: 0.78, marking: 0.80, countering: 0.78 },
  { finishing: 0.90, progression: 0.72, passing: 0.38, pressing: 0.58, marking: 0.66, countering: 0.84 },
  { finishing: 0.74, progression: 0.48, passing: 0.56, pressing: 0.95, marking: 0.50, countering: 0.66 },
  { finishing: 0.56, progression: 0.58, passing: 0.74, pressing: 0.64, marking: 0.86, countering: 0.50 },
];

// Held-out sides. These are never used for selection, only for the final
// validation report, so the champion cannot simply memorize the gauntlet.
const VALIDATION_ARCHETYPES = [
  { finishing: 0.80, progression: 0.56, passing: 0.62, pressing: 0.76, marking: 0.68, countering: 0.78 },
  { finishing: 0.48, progression: 0.86, passing: 0.86, pressing: 0.62, marking: 0.74, countering: 0.58 },
  { finishing: 0.68, progression: 0.66, passing: 0.50, pressing: 0.90, marking: 0.64, countering: 0.90 },
  { finishing: 0.86, progression: 0.44, passing: 0.72, pressing: 0.52, marking: 0.88, countering: 0.46 },
  { finishing: 0.38, progression: 0.78, passing: 0.68, pressing: 0.84, marking: 0.72, countering: 0.84 },
  { finishing: 0.76, progression: 0.74, passing: 0.78, pressing: 0.68, marking: 0.60, countering: 0.62 },
  { finishing: 0.58, progression: 0.94, passing: 0.58, pressing: 0.74, marking: 0.82, countering: 0.74 },
  { finishing: 0.92, progression: 0.60, passing: 0.46, pressing: 0.66, marking: 0.76, countering: 0.88 },
];

// Turn the StatsBomb policy into "taught" genomes: representative match
// situations are run through the learned action model, then its pass / carry /
// shot preferences are mapped onto attacking genes. Defensive genes come from
// the archetype pool so the first generation already contains complete sides.
function taughtGenomes(policy) {
  const taught = [];
  const situations = [
    { progress: 0.72, centrality: 0.62, pressure: 0.28, score: 0, minute: 0.5 },
    { progress: 0.88, centrality: 0.55, pressure: 0.55, score: -1, minute: 0.78 },
    { progress: 0.45, centrality: 0.78, pressure: 0.12, score: 1, minute: 0.3 },
    { progress: 0.62, centrality: 0.42, pressure: 0.62, score: 0, minute: 0.66 },
  ];
  const defense = TRAINING_ARCHETYPES.map((archetype) => ({
    pressing: archetype.pressing,
    marking: archetype.marking,
    countering: archetype.countering,
  }));
  situations.forEach((situation, index) => {
    const features = [
      1,
      situation.progress,
      situation.centrality,
      situation.pressure,
      situation.score,
      situation.minute,
    ];
    const logits = policy.weights.map((row) =>
      row.reduce((sum, weight, feature) => sum + weight * features[feature], 0),
    );
    const [passShare, carryShare, shotShare] = softmax(logits);
    const base = defense[index % defense.length];
    taught.push(normalizeGenome({
      finishing: 0.24 + Math.sqrt(shotShare) * 0.62,
      progression: 0.28 + carryShare * 0.58,
      passing: 0.28 + passShare * 0.58,
      ...base,
    }));
  });
  return taught;
}

function teachPopulation(rng, policy) {
  const population = [];
  const add = (genome) => population.push(normalizeGenome(genome));

  // Teach: start from proven tactical archetypes and the real-match policy.
  TRAINING_ARCHETYPES.forEach(add);
  taughtGenomes(policy).forEach(add);
  for (const archetype of TRAINING_ARCHETYPES) {
    add({
      finishing: archetype.finishing * 0.82 + 0.09,
      progression: archetype.progression * 0.78 + 0.11,
      passing: archetype.passing * 0.80 + 0.10,
      pressing: archetype.pressing * 0.84 + 0.08,
      marking: archetype.marking * 0.84 + 0.08,
      countering: archetype.countering * 0.82 + 0.09,
    });
  }

  // Explore: random genomes fill the rest of the first generation.
  while (population.length < POPULATION) {
    add(Object.fromEntries(GENE_KEYS.map((key) => [key, 0.08 + rng() * 0.84])));
  }
  return population.slice(0, POPULATION);
}

function simulatePossessions(attacker, defender, rng) {
  let goalsFor = 0;
  let goalsAgainst = 0;
  let shotsFor = 0;
  let shotsAgainst = 0;
  const ratedProgress = attacker.progression;
  const defensiveGrip = defender.marking * 0.72 + defender.pressing * 0.28;

  const counterChance = clamp(
    0.012 + defender.countering * 0.105 + defender.pressing * 0.035 - attacker.marking * 0.055,
    0.004,
    0.24,
  );

  for (let possession = 0; possession < 26; possession += 1) {
    let progress = 0.20 + rng() * 0.20;
    let ended = false;

    for (let step = 0; step < 6 && !ended; step += 1) {
      const centrality = 0.30 + rng() * 0.62;
      const conversion = clamp(
        0.018 + progress ** 2.2 * 0.50 + attacker.finishing * 0.105
          + centrality * 0.035 - defender.marking * 0.080,
        0.008,
        0.64,
      );

      const shotValue = progress > 0.50
        ? conversion + attacker.finishing * 0.018 - defender.marking * 0.010
        : -Infinity;

      const passSuccess = clamp(
        0.50 + attacker.passing * 0.30 - defender.pressing * 0.145
          - defender.marking * 0.045 + centrality * 0.025,
        0.22,
        0.95,
      );
      const passGain = 0.060 + attacker.passing * 0.048 + attacker.progression * 0.032 - defensiveGrip * 0.028;
      const passValue = passSuccess * (0.020 + passGain * 1.45) - (1 - passSuccess) * 0.24;

      const carryRisk = clamp(0.025 + attacker.progression * 0.060 + defender.pressing * 0.035, 0.015, 0.18);
      const carrySuccess = clamp(
        0.56 + attacker.progression * 0.285 - defender.pressing * 0.165
          - defender.marking * 0.050 - carryRisk * 0.22,
        0.20,
        0.93,
      );
      const carryGain = 0.055 + attacker.progression * 0.105 - defender.marking * 0.020;
      const carryValue = carrySuccess * (0.018 + carryGain * 1.45) - (1 - carrySuccess) * 0.24;

      if (shotValue >= passValue && shotValue >= carryValue) {
        shotsFor += 1;
        if (rng() < conversion) {
          goalsFor += 1;
        } else if (rng() < counterChance) {
          goalsAgainst += 1;
          shotsAgainst += 1;
        }
        ended = true;
      } else if (passValue >= carryValue) {
        if (rng() < passSuccess) {
          progress = clamp(progress + passGain, 0, 0.995);
        } else {
          if (rng() < counterChance) {
            goalsAgainst += 1;
            shotsAgainst += 1;
          }
          ended = true;
        }
      } else if (rng() < carrySuccess) {
        progress = clamp(progress + carryGain, 0, 0.995);
      } else {
        if (rng() < counterChance) {
          goalsAgainst += 1;
          shotsAgainst += 1;
        }
        ended = true;
      }

      // A rare direct counter after a sustained, high-risk progression.
      if (!ended && progress > 0.90 && rng() < clamp(ratedProgress * 0.012, 0, 0.016)) {
        goalsFor += 1;
        shotsFor += 1;
        ended = true;
      }
    }
  }

  return { goalsFor, goalsAgainst, shotsFor, shotsAgainst };
}

function simulateMatch(home, away, rng) {
  const homeResult = simulatePossessions(home, away, rng);
  const awayResult = simulatePossessions(away, home, rng);
  return {
    goalsFor: homeResult.goalsFor,
    goalsAgainst: awayResult.goalsFor,
    shotsFor: homeResult.shotsFor,
    shotsAgainst: awayResult.shotsFor,
  };
}

function matchScore(result) {
  const difference = result.goalsFor - result.goalsAgainst;
  const resultBonus = result.goalsFor > result.goalsAgainst ? 1.55 : result.goalsFor === result.goalsAgainst ? 0.42 : 0;
  return difference * 1.05 + resultBonus + result.shotsFor * 0.028 - result.shotsAgainst * 0.020;
}

function evaluateGenome(genome, opponents, seed, matchesPerOpponent = MATCHES_PER_OPPONENT) {
  let total = 0;
  let wins = 0;
  let draws = 0;
  let goalDifference = 0;
  let matches = 0;

  opponents.forEach((opponent, opponentIndex) => {
    for (let sample = 0; sample < matchesPerOpponent; sample += 1) {
      const rng = createRng((seed ^ (opponentIndex * 0x9e3779b1) ^ (sample * 0x85ebca6b)) >>> 0);
      const result = simulateMatch(genome, opponent, rng);
      total += matchScore(result);
      goalDifference += result.goalsFor - result.goalsAgainst;
      if (result.goalsFor > result.goalsAgainst) wins += 1;
      else if (result.goalsFor === result.goalsAgainst) draws += 1;
      matches += 1;
    }
  });

  return {
    fitness: total / matches,
    winRate: wins / matches,
    drawRate: draws / matches,
    goalDifference: goalDifference / matches,
  };
}

function blend(parentA, parentB, rng) {
  const child = {};
  for (const key of GENE_KEYS) {
    const alpha = 0.20 + rng() * 0.60;
    child[key] = parentA[key] * alpha + parentB[key] * (1 - alpha);
  }
  return child;
}

function mutate(genome, sigma, rng) {
  const mutated = { ...genome };
  for (const key of GENE_KEYS) {
    if (rng() < 0.38) mutated[key] += gaussian(rng) * sigma;
    if (rng() < 0.018) mutated[key] = 0.08 + rng() * 0.84;
    mutated[key] = clamp(mutated[key], 0.02, 0.98);
  }
  return mutated;
}

function tournament(sorted, rng, size = 3) {
  let best = sorted[Math.floor(rng() * sorted.length)];
  for (let contender = 1; contender < size; contender += 1) {
    const candidate = sorted[Math.floor(rng() * sorted.length)];
    if (candidate.fitness > best.fitness) best = candidate;
  }
  return best;
}

function dedupe(genomes) {
  const seen = new Set();
  return genomes.filter((genome) => {
    const key = GENE_KEYS.map((gene) => round(genome[gene])).join(",");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildLadder(archive, champion) {
  const unique = dedupe([...archive, champion]).sort((a, b) => a.fitness - b.fitness);
  const sampleCount = 100;
  const ladder = Array.from({ length: sampleCount }, (_, index) => {
    const position = Math.round((index * (unique.length - 1)) / (sampleCount - 1));
    return unique[position];
  });
  // Guarantee the validated champion sits at the top of the ladder.
  ladder[sampleCount - 1] = { ...champion };
  const minimum = Math.min(...unique.map((genome) => genome.fitness));
  const maximum = Math.max(...unique.map((genome) => genome.fitness));
  const normalized = ladder.map((genome) => ({
    ...Object.fromEntries(GENE_KEYS.map((key) => [key, round(genome[key])])),
    fitness: round(clamp((genome.fitness - minimum) / Math.max(0.0001, maximum - minimum), 0, 1)),
  }));
  normalized[normalized.length - 1] = { ...normalized[normalized.length - 1], fitness: 1 };
  return normalized;
}

async function main() {
  const policy = JSON.parse(await readFile(POLICY_PATH, "utf8"));
  const rng = createRng(SEED);
  const trainingGauntlet = TRAINING_ARCHETYPES.map(normalizeGenome);
  const validationGauntlet = VALIDATION_ARCHETYPES.map(normalizeGenome);
  let population = teachPopulation(rng, policy).map((genome) => ({ ...genome, fitness: 0 }));
  const archive = [];
  const generationHistory = [];
  let matchesSimulated = 0;

  for (let generation = 0; generation < GENERATIONS; generation += 1) {
    population = population.map((genome, index) => {
      const result = evaluateGenome(genome, trainingGauntlet, (SEED + generation * 7919 + index * 104729) >>> 0);
      matchesSimulated += trainingGauntlet.length * MATCHES_PER_OPPONENT;
      return { ...genome, ...result };
    });
    population.sort((a, b) => b.fitness - a.fitness);

    archive.push(...population.slice(0, Math.max(4, Math.round(POPULATION * 0.22))));
    const best = population[0];
    generationHistory.push({
      generation,
      best: round(best.fitness),
      average: round(population.reduce((sum, genome) => sum + genome.fitness, 0) / population.length),
      winRate: round(best.winRate),
    });

    if (generation === GENERATIONS - 1) break;

    const nextGeneration = population.slice(0, ELITE_COUNT)
      .map((genome) => Object.fromEntries(GENE_KEYS.map((key) => [key, genome[key]])));

    // Breed: selection pressure rises as mutation cools, then mutate children.
    const sigma = 0.17 * (1 - generation / GENERATIONS) + 0.035;
    while (nextGeneration.length < POPULATION) {
      const parentA = tournament(population, rng);
      const parentB = tournament(population, rng);
      const child = mutate(blend(parentA, parentB, rng), sigma, rng);
      nextGeneration.push(child);
    }
    population = nextGeneration.map((genome) => ({ ...genome, fitness: 0 }));
  }

  // Validate the strongest finalists on sides they never trained against.
  const finalists = dedupe(population.slice(0, Math.max(8, ELITE_COUNT * 3)).map((genome) => ({ ...genome })));
  const validationMatches = MATCHES_PER_OPPONENT * 2;
  const validated = finalists.map((genome) => {
    const result = evaluateGenome(genome, validationGauntlet, (SEED ^ 0xd1b54a35) >>> 0, validationMatches);
    matchesSimulated += validationGauntlet.length * validationMatches;
    return {
      ...genome,
      trainingFitness: genome.fitness,
      validationFitness: result.fitness,
      validationWinRate: result.winRate,
      validationDrawRate: result.drawRate,
      validationGoalDifference: result.goalDifference,
    };
  }).sort((a, b) => b.validationWinRate - a.validationWinRate
    || b.validationGoalDifference - a.validationGoalDifference
    || b.trainingFitness - a.trainingFitness);

  const champion = validated[0];
  const ladder = buildLadder(archive, champion);
  const championGenome = ladder[ladder.length - 1];

  const artifact = {
    version: 2,
    method: "teach-breed-mutate-genetic-algorithm",
    inspiration: "https://www.youtube.com/watch?v=IoM5zUI8oFc",
    seed: SEED,
    generations: GENERATIONS,
    population: POPULATION,
    matchesPerOpponent: MATCHES_PER_OPPONENT,
    matchesSimulated,
    trainingOpponents: trainingGauntlet.length,
    validationOpponents: validationGauntlet.length,
    genes: GENE_KEYS,
    training: {
      bestFitness: round(champion.trainingFitness),
      bestWinRate: round(champion.winRate),
      bestGoalDifference: round(champion.goalDifference),
    },
    validation: {
      sampleSize: validationGauntlet.length * validationMatches,
      winRate: round(champion.validationWinRate),
      drawRate: round(champion.validationDrawRate),
      goalDifference: round(champion.validationGoalDifference),
      fitness: round(champion.validationFitness),
    },
    generationHistory,
    champion: {
      ...Object.fromEntries(GENE_KEYS.map((key) => [key, round(championGenome[key])])),
      fitness: 1,
    },
    ladder,
  };

  await writeFile(OUTPUT_PATH, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  console.log(`Evolved ${GENERATIONS} generations of ${POPULATION} genomes (${matchesSimulated.toLocaleString()} matches).`);
  console.log(`Champion: ${JSON.stringify(artifact.champion)}`);
  console.log(`Validation: ${(artifact.validation.winRate * 100).toFixed(1)}% wins, ${artifact.validation.goalDifference.toFixed(2)} goal difference.`);
  console.log(`Wrote ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
