import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DATA_REVISION = "4b73468fc5b0f1950f9f66fada70ad3a4f9327cb";
const DATA_ROOT = `https://raw.githubusercontent.com/hudl/open-data/${DATA_REVISION}/data`;
const SOURCE_URL = "https://github.com/hudl/open-data";
const ACTIONS = ["pass", "carry", "shot"];
const FEATURE_NAMES = ["bias", "attackProgress", "centrality", "underPressure", "scoreDifference", "matchProgress"];
const VALIDATION_SAMPLE_LIMIT = 50000;
const CONCURRENCY = 6;

const outputPath = resolve(fileURLToPath(new URL("../real-match-policy.json", import.meta.url)));
const maxMatchesArg = process.argv.find((arg) => arg.startsWith("--max-matches="));
const maxMatches = maxMatchesArg ? Number(maxMatchesArg.slice("--max-matches=".length)) : Infinity;
if (!(maxMatches > 0)) throw new Error("--max-matches must be a positive number.");

async function fetchJson(url) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(url);
    if (response.ok) return response.json();
    if (response.status === 404) return null;
    if (attempt === 3) {
      throw new Error(`Request failed (${response.status}) for ${url}`);
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 500 * (2 ** attempt)));
  }
  throw new Error(`Unable to fetch ${url}`);
}

async function mapWithConcurrency(items, limit, callback) {
  const results = new Array(items.length);
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await callback(items[index], index);
    }
  });
  await Promise.all(workers);
  return results;
}

function hashNumber(value) {
  let hash = 2166136261;
  for (const char of String(value)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function averageShotX(events, teamName, period) {
  let total = 0;
  let count = 0;
  for (const event of events) {
    if (event.type?.name === "Shot" && event.team?.name === teamName
      && event.period === period && Array.isArray(event.location)) {
      total += event.location[0];
      count += 1;
    }
  }
  return count ? total / count : null;
}

function extractExamples(events, match, consume) {
  const homeName = match.home_team.home_team_name;
  const awayName = match.away_team.away_team_name;
  const homeFirstHalfX = averageShotX(events, homeName, 1);
  const homeSecondHalfX = averageShotX(events, homeName, 2);
  const homeAttacksRightFirstHalf = homeFirstHalfX !== null
    ? homeFirstHalfX >= 60
    : homeSecondHalfX !== null ? homeSecondHalfX < 60 : true;
  let homeScore = 0;
  let awayScore = 0;
  for (const event of events) {
    const eventType = event.type?.name;
    const teamName = event.team?.name;
    if (["Pass", "Carry", "Shot"].includes(eventType) && Array.isArray(event.location)
      && Number.isFinite(event.location[0]) && Number.isFinite(event.location[1])) {
      const isHome = teamName === homeName;
      const periodIsFirstHalf = event.period % 2 === 1;
      const teamAttacksRight = isHome
        ? (periodIsFirstHalf ? homeAttacksRightFirstHalf : !homeAttacksRightFirstHalf)
        : (periodIsFirstHalf ? !homeAttacksRightFirstHalf : homeAttacksRightFirstHalf);
      const x = teamAttacksRight ? event.location[0] : 120 - event.location[0];
      const y = event.location[1];
      const ownScore = isHome ? homeScore : awayScore;
      const opponentScore = isHome ? awayScore : homeScore;
      const action = eventType.toLowerCase();
      const features = [
        1,
        Math.max(0, Math.min(1, x / 120)),
        Math.max(0, Math.min(1, 1 - Math.abs(y - 40) / 40)),
        event.under_pressure ? 1 : 0,
        Math.max(-1, Math.min(1, (ownScore - opponentScore) / 3)),
        Math.max(0, Math.min(1, (event.minute + (event.second ?? 0) / 60) / 90)),
      ];
      consume(action, features);
    }
    if (eventType === "Shot" && event.shot?.outcome?.name === "Goal") {
      if (teamName === homeName) homeScore += 1;
      else if (teamName === awayName) awayScore += 1;
    }
  }
}

function probabilities(weights, features) {
  const logits = weights.map((row) => row.reduce((sum, weight, index) =>
    sum + weight * features[index], 0));
  const maxLogit = Math.max(...logits);
  const exponents = logits.map((value) => Math.exp(value - maxLogit));
  const total = exponents.reduce((sum, value) => sum + value, 0);
  return exponents.map((value) => value / total);
}

function trainExample(weights, features, label, count) {
  const prediction = probabilities(weights, features);
  const learningRate = 0.025 / Math.sqrt(1 + count / 20000);
  for (let action = 0; action < ACTIONS.length; action += 1) {
    const error = prediction[action] - (ACTIONS[action] === label ? 1 : 0);
    for (let feature = 0; feature < FEATURE_NAMES.length; feature += 1) {
      const regularization = feature === 0 ? 0 : weights[action][feature] * 0.00005;
      weights[action][feature] -= learningRate * (error * features[feature] + regularization);
    }
  }
}

async function main() {
  const competitions = await fetchJson(`${DATA_ROOT}/competitions.json`);
  if (!Array.isArray(competitions)) throw new Error("StatsBomb competitions data was not an array.");
  const matchLists = await mapWithConcurrency(competitions, CONCURRENCY, async (competition) =>
    fetchJson(`${DATA_ROOT}/matches/${competition.competition_id}/${competition.season_id}.json`),
  );
  const matches = matchLists.flatMap((list) => Array.isArray(list) ? list : [])
    .sort((a, b) => a.match_id - b.match_id)
    .slice(0, maxMatches);
  if (!matches.length) throw new Error("No public matches were listed by StatsBomb Open Data.");
  console.log(`Pinned StatsBomb Open Data revision ${DATA_REVISION}`);
  console.log(`Processing up to ${matches.length.toLocaleString()} public match files with ${CONCURRENCY} concurrent downloads.`);

  const weights = ACTIONS.map(() => Array(FEATURE_NAMES.length).fill(0));
  const trainingCounts = Object.fromEntries(ACTIONS.map((action) => [action, 0]));
  const validationCounts = Object.fromEntries(ACTIONS.map((action) => [action, 0]));
  const validationSamples = [];
  let matchesWithEvents = 0;
  let unavailableMatches = 0;
  let trainingExampleCount = 0;
  let validationSeen = 0;

  await mapWithConcurrency(matches, CONCURRENCY, async (match, index) => {
    const events = await fetchJson(`${DATA_ROOT}/events/${match.match_id}.json`);
    if (!Array.isArray(events)) {
      unavailableMatches += 1;
      return;
    }
    matchesWithEvents += 1;
    const isValidationMatch = hashNumber(match.match_id) % 5 === 0;
    extractExamples(events, match, (action, features) => {
      if (!ACTIONS.includes(action)) return;
      if (isValidationMatch) {
        validationCounts[action] += 1;
        validationSeen += 1;
        if (validationSamples.length < VALIDATION_SAMPLE_LIMIT) {
          validationSamples.push({ action, features });
        } else {
          const replacementIndex = hashNumber(`${match.match_id}:${validationSeen}`) % validationSeen;
          if (replacementIndex < VALIDATION_SAMPLE_LIMIT) {
            validationSamples[replacementIndex] = { action, features };
          }
        }
        return;
      }
      trainExample(weights, features, action, trainingExampleCount);
      trainingCounts[action] += 1;
      trainingExampleCount += 1;
    });
    if ((index + 1) % 100 === 0 || index + 1 === matches.length) {
      console.log(`Processed ${index + 1}/${matches.length} match files; ${matchesWithEvents} contained events.`);
    }
  });

  if (!Object.values(trainingCounts).some((count) => count > 0)) {
    throw new Error("No pass, carry, or shot training examples were found.");
  }

  let correct = 0;
  const confusion = ACTIONS.map(() => Array(ACTIONS.length).fill(0));
  for (const sample of validationSamples) {
    const predicted = probabilities(weights, sample.features)
      .reduce((best, probability, index, values) => probability > values[best] ? index : best, 0);
    const actual = ACTIONS.indexOf(sample.action);
    confusion[actual][predicted] += 1;
    if (predicted === actual) correct += 1;
  }

  const artifact = {
    version: 1,
    source: "StatsBomb Open Data",
    sourceUrl: SOURCE_URL,
    termsUrl: "https://github.com/hudl/open-data#terms--conditions",
    dataRevision: DATA_REVISION,
    competitions: competitions.length,
    listedMatches: matches.length,
    matchesWithEvents,
    unavailableMatches,
    actions: ACTIONS,
    features: FEATURE_NAMES,
    trainingExamples: trainingCounts,
    validationExamples: validationCounts,
    validationSampleSize: validationSamples.length,
    validationAccuracy: validationSamples.length ? correct / validationSamples.length : null,
    validationConfusionMatrix: confusion,
    weights,
  };
  await writeFile(outputPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  console.log(`Saved trained policy to ${outputPath}`);
  console.log(`Training examples: ${JSON.stringify(trainingCounts)}`);
  console.log(`Validation examples: ${JSON.stringify(validationCounts)}; sampled accuracy: ${
    validationSamples.length ? `${(100 * correct / validationSamples.length).toFixed(1)}%` : "not available"
  }`);
  console.log(`Matches with event data: ${matchesWithEvents}; unavailable event files: ${unavailableMatches}.`);
}

await main();
