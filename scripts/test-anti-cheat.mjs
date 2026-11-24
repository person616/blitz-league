// Integrity tests for the Blitz League save-protection layer.
//
// Run with:  npm run test:anticheat
// The real anti-cheat.ts is transpiled with the project TypeScript, then the
// tests exercise the exact wallet, ledger, envelope and guard code the game
// uses. Every failure below is a reason the public build should not ship.

import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, ".anticheat-test");
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const source = readFileSync(path.join(root, "anti-cheat.ts"), "utf8");
const transpiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
writeFileSync(path.join(outDir, "anti-cheat.mjs"), transpiled);

const {
  SECURITY_VERSION,
  STARTING_COINS,
  MAX_COIN_BALANCE,
  MAX_LEDGER_ENTRIES,
  TRANSACTION_RULES,
  createWallet,
  applyTransactions,
  validateWallet,
  encodeSave,
  decodeSave,
  encodeGuard,
  decodeGuard,
  checkGuard,
  walletFromLegacy,
  deriveSaveKey,
  sha256Hex,
  legacyCoinCapForXp,
  canonicalJson,
  createInstallId,
} = await import(new URL(`file://${path.join(outDir, "anti-cheat.mjs").replace(/\\/g, "/")}`).href);

const failures = [];
const checks = [];
const check = (name, condition, detail = "") => {
  checks.push({ name, ok: !!condition, detail });
  if (!condition) failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
};

const SECRET = "unit-test-secret";
const INSTALL = "install-1234567890";
const KEY = deriveSaveKey(SECRET, INSTALL);
const MAX_XP = 200_000;
const NOW = 1_750_000_000_000;
let idCounter = 0;
const tx = (reason, amount, extra = {}) => {
  const rule = TRANSACTION_RULES[reason];
  return {
    kind: rule.kind,
    currency: rule.currency,
    amount,
    reason,
    id: `tx-${++idCounter}`,
    at: NOW,
    ...extra,
  };
};
const apply = (wallet, transactions, options = {}) =>
  applyTransactions(wallet, transactions, KEY, { maxXp: MAX_XP, now: NOW, ...options });
const issueCode = (result) => result.ok ? "ok" : result.issue.code;
const payloadFor = (wallet, overrides = {}) => ({
  securityVersion: SECURITY_VERSION,
  progressionVersion: 3,
  saveCounter: 7,
  savedAt: NOW,
  installId: INSTALL,
  wallet,
  xp: wallet.xp,
  coins: wallet.coins,
  extra: "⚽ protected payload",
  ...overrides,
});

// ------------------------------- 1. hashing -------------------------------
check(
  "SHA-256 matches the NIST abc vector",
  sha256Hex("abc") === "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
  sha256Hex("abc"),
);
check(
  "SHA-256 matches the empty-string vector",
  sha256Hex("") === "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  sha256Hex(""),
);
check("canonical JSON sorts keys", canonicalJson({ b: 1, a: 2 }) === '{"a":2,"b":1}', canonicalJson({ b: 1, a: 2 }));
check("canonical JSON is stable for nested objects", canonicalJson({ z: { b: 2, a: 1 } }) === '{"z":{"a":1,"b":2}}');
check("derived keys are stable and install-specific", KEY === deriveSaveKey(SECRET, INSTALL) && KEY !== deriveSaveKey(SECRET, "other-install"));

// ------------------------------ 2. wallet ---------------------------------
const fresh = createWallet();
check("fresh wallet starts with the published starting coins", fresh.coins === STARTING_COINS, `${fresh.coins}`);
check("fresh wallet validates", validateWallet(fresh, { maxXp: MAX_XP, key: KEY }).ok);

const earned = apply(fresh, [tx("match-xp", 100), tx("match-coins", 35)]);
check("valid rewards apply", earned.ok, issueCode(earned));
if (earned.ok) {
  check("coin balance is conserved", earned.wallet.coins === STARTING_COINS + 35, `${earned.wallet.coins}`);
  check("XP balance tracks lifetime XP", earned.wallet.xp === 100 && earned.wallet.earnedXp === 100);
  check("ledger records both transactions", earned.wallet.ledger.length === 2 && earned.wallet.txCount === 2);
  check("wallet with ledger validates", validateWallet(earned.wallet, { maxXp: MAX_XP, key: KEY }).ok);
  check("wallet rejects the wrong signing key", !validateWallet(earned.wallet, { maxXp: MAX_XP, key: deriveSaveKey("wrong", INSTALL) }).ok);
}

const tamperedAmount = earned.ok
  ? { ...earned.wallet, ledger: earned.wallet.ledger.map((entry, index) =>
      index === 0 ? { ...entry, amount: entry.amount + 1 } : entry) }
  : fresh;
check("tampered ledger amount is rejected", !validateWallet(tamperedAmount, { maxXp: MAX_XP, key: KEY }).ok);

const tamperedHead = earned.ok ? { ...earned.wallet, lastHash: "f".repeat(64) } : fresh;
check("tampered wallet head is rejected", !validateWallet(tamperedHead, { maxXp: MAX_XP, key: KEY }).ok);

const tamperedConservation = earned.ok ? { ...earned.wallet, coins: earned.wallet.coins + 1 } : fresh;
check("tampered balance is rejected", !validateWallet(tamperedConservation, { maxXp: MAX_XP, key: KEY }).ok);

check("overspending is rejected", issueCode(apply(fresh, [tx("daily-offer-spend", 500)])) === "tx-overspend");
check("unknown reasons are rejected", issueCode(apply(fresh, [{
  kind: "earn", currency: "coins", amount: 100, reason: "free-money", id: "free-money", at: NOW,
}])) === "tx-reason");
check("zero amounts are rejected", issueCode(apply(fresh, [tx("match-coins", 0)])) === "tx-amount");
check("negative amounts are rejected", issueCode(apply(fresh, [tx("match-coins", -5)])) === "tx-amount");
check("fractional amounts are rejected", issueCode(apply(fresh, [tx("match-coins", 1.5)])) === "tx-amount");
check("per-reason ceilings are enforced", issueCode(apply(fresh, [tx("rush-coins", 6_001)])) === "tx-ceiling");
check("XP ceilings are enforced", issueCode(apply(fresh, [tx("tutorial-xp", 150)], { maxXp: 100 })) === "tx-xp-cap");
check("XP has no spend transaction rule", !Object.values(TRANSACTION_RULES).some((rule) =>
  rule.currency === "xp" && rule.kind === "spend") && issueCode(apply(fresh, [{
  kind: "spend", currency: "xp", amount: 10, reason: "tutorial-xp", id: "xp-spend", at: NOW,
}])) !== "ok");

const replayTx = tx("match-coins", 50);
const replayFirst = apply(fresh, [replayTx]);
const replaySecond = replayFirst.ok ? apply(replayFirst.wallet, [{ ...replayTx, id: replayTx.id }]) : { ok: true };
check("replayed transaction ids are rejected", !replaySecond.ok && replaySecond.issue.code === "tx-replay");

const atomicResult = apply(fresh, [tx("xp-purchase-spend", 25), tx("xp-purchase", 100)], { maxXp: 0 });
check("failed multi-transaction batches do not partially commit", !atomicResult.ok && atomicResult.wallet.coins === STARTING_COINS);

let many = fresh;
for (let index = 0; index < 140; index += 1) {
  const result = apply(many, [tx("tutorial-xp", 150)]);
  if (!result.ok) break;
  many = result.wallet;
}
check("ledger window stays bounded", many.ledger.length === MAX_LEDGER_ENTRIES, `${many.ledger.length}`);
check("pruned ledger still validates", validateWallet(many, { maxXp: MAX_XP, key: KEY }).ok, issueCode(validateWallet(many, { maxXp: MAX_XP, key: KEY })));
check("pruned ledger keeps a contiguous total", many.txCount === 140 && many.baseSeq === 140 - MAX_LEDGER_ENTRIES);

let capped = fresh;
let capFailure = null;
for (let index = 0; index < 60; index += 1) {
  const result = apply(capped, [tx("rush-coins", 6_000)]);
  if (!result.ok) { capFailure = result; break; }
  capped = result.wallet;
}
check("coin balance ceiling is enforced", !!capFailure && capFailure.issue.code === "tx-earned-cap", issueCode(capFailure ?? { ok: true }));

// ------------------------------ 3. legacy --------------------------------
const legacy = walletFromLegacy({ xp: 999_999, coins: 999_999_999 }, { maxXp: MAX_XP });
check("legacy XP is capped at the pass ceiling", legacy.wallet.xp === MAX_XP, `${legacy.wallet.xp}`);
check("legacy coins are capped by the XP bound", legacy.wallet.coins <= legacyCoinCapForXp(MAX_XP), `${legacy.wallet.coins}`);
check("legacy migration flags clamping", legacy.clampedCoins && legacy.clampedXp);
check("migrated wallet satisfies every invariant", validateWallet(legacy.wallet, { maxXp: MAX_XP, key: KEY }).ok);
check("fresh legacy saves still get starting coins", walletFromLegacy({}, { maxXp: MAX_XP }).wallet.coins === STARTING_COINS);
const spentLegacy = walletFromLegacy({ coins: 30, xp: 0 }, { maxXp: MAX_XP });
check("legacy saves below the starting balance can spend starting coins", spentLegacy.wallet.coins === 30 && validateWallet(spentLegacy.wallet, { maxXp: MAX_XP, key: KEY }).ok);
check("legacy coin cap never drops below the starting floor", legacyCoinCapForXp(0) >= STARTING_COINS);

// ------------------------------ 4. envelope -------------------------------
const signedPayload = payloadFor(earned.ok ? earned.wallet : fresh);
const encoded = encodeSave(signedPayload, SECRET);
const decoded = decodeSave(encoded, SECRET, { maxXp: MAX_XP, progressionVersion: 3 });
check("signed save round-trips", decoded.ok, decoded.ok ? "" : `${decoded.code}: ${decoded.detail}`);
if (decoded.ok) {
  check("signed save preserves wallet", decoded.payload.wallet.coins === signedPayload.wallet.coins);
  check("signed save preserves unicode payload", decoded.payload.extra === "⚽ protected payload");
  check("signed save exposes a digest", /^[a-f0-9]{64}$/.test(decoded.digest));
}

check("unsigned saves are labelled legacy", !decodeSave(JSON.stringify(signedPayload), SECRET, { maxXp: MAX_XP }).signed);
check("wrong secret is rejected", !decodeSave(encoded, "wrong-secret", { maxXp: MAX_XP }).ok);
const tamperedBody = encoded.slice(0, 5) + (encoded[5] === "A" ? "B" : "A") + encoded.slice(6);
check("tampered save body is rejected", !decodeSave(tamperedBody, SECRET, { maxXp: MAX_XP }).ok);
const tamperedSignature = encoded.slice(0, -1) + (encoded.endsWith("0") ? "1" : "0");
check("tampered signature is rejected", !decodeSave(tamperedSignature, SECRET, { maxXp: MAX_XP }).ok);

const mismatchedPayload = payloadFor(earned.ok ? earned.wallet : fresh, { coins: 999_999 });
const mismatchedEncoded = encodeSave(mismatchedPayload, SECRET);
check("balance mirror mismatches are rejected", decodeSave(mismatchedEncoded, SECRET, { maxXp: MAX_XP }).code === "save-mismatch");
check("unknown security versions are rejected", decodeSave(encodeSave({ ...signedPayload, securityVersion: 99 }, SECRET), SECRET, { maxXp: MAX_XP }).code === "save-version");
check("stale progression versions are rejected", decodeSave(encoded, SECRET, { maxXp: MAX_XP, progressionVersion: 2 }).code === "save-progression");
check("saves with another XP ceiling are rejected", decodeSave(encoded, SECRET, { maxXp: 1 }).code === "wallet-xp-cap");

// ------------------------------- 5. guard ---------------------------------
if (decoded.ok) {
  const guard = { installId: INSTALL, counter: 7, digest: decoded.digest, savedAt: NOW };
  const encodedGuard = encodeGuard(guard, SECRET);
  const decodedGuard = decodeGuard(encodedGuard, SECRET);
  check("guard round-trips", decodedGuard.ok);
  check("guard detects an older counter", checkGuard({ ...decoded.payload, saveCounter: 6 }, decoded.digest, guard).code === "rollback");
  check("guard accepts the same counter and digest", checkGuard({ ...decoded.payload, saveCounter: 7 }, decoded.digest, guard).ok);
  check("guard rejects replaced contents at the same counter", checkGuard({ ...decoded.payload, saveCounter: 7 }, "f".repeat(64), guard).code === "replaced");
  check("guard ignores a different install", checkGuard({ ...decoded.payload, installId: "another-install", saveCounter: 1 }, decoded.digest, guard).ok);
  const tamperedGuard = encodedGuard.slice(0, -1) + (encodedGuard.endsWith("0") ? "1" : "0");
  check("tampered guards are rejected", !decodeGuard(tamperedGuard, SECRET).ok);
}

// --------------------------- 6. shipped reasons ---------------------------
const requiredReasons = [
  "tutorial-xp", "tutorial-coins", "match-xp", "match-coins", "rush-xp", "rush-coins",
  "pass-coins", "crate-bonus", "duplicate-color", "xp-purchase", "xp-purchase-spend",
  "crate-spend", "daily-offer-spend",
];
for (const reason of requiredReasons) {
  check(`shipped reason ${reason} has a rule`, !!TRANSACTION_RULES[reason]);
}
check("every transaction rule is positive and bounded", Object.values(TRANSACTION_RULES).every((rule) =>
  Number.isSafeInteger(rule.maxAmount) && rule.maxAmount > 0 && rule.maxAmount <= 20_000));
check("every rule uses a known currency and direction", Object.values(TRANSACTION_RULES).every((rule) =>
  (rule.currency === "coins" || rule.currency === "xp") && (rule.kind === "earn" || rule.kind === "spend")));
check("save ceilings cover every reward ceiling", Object.values(TRANSACTION_RULES).every((rule) =>
  rule.currency !== "coins" || rule.kind !== "earn" || rule.maxAmount <= MAX_COIN_BALANCE));
check("install ids are non-trivial", createInstallId().length >= 8);

// ------------------------------- results ----------------------------------
const passed = checks.filter((entry) => entry.ok).length;
console.log(`Save protection: ${checks.length} checks across wallet, ledger, envelope, guard and migration.`);
for (const failure of failures) console.log(`FAIL  ${failure}`);
console.log(`${passed}/${checks.length} checks passed`);
if (failures.length) {
  process.exitCode = 1;
} else {
  rmSync(outDir, { recursive: true, force: true });
}
