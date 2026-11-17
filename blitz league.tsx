"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import realMatchPolicy from "./real-match-policy.json";
import evolvedAiFile from "./evolved-ai-ladder.json";

type Position = "FWD" | "MID" | "DEF" | "GK";
type AbilityType = "finishing" | "dribbling" | "pace" | "defending" | "playmaking" | "goalkeeping";
type FormatId = "classic" | "small-sided" | "golden-goal";
type FormationId = "4-3-3" | "4-4-2" | "3-5-2" | "4-2-3-1";
type CaptionSize = "small" | "medium" | "large";
type KitColor = { id: string; name: string; value: string };
type CrateReveal = { crate: "basic" | "blitz" | "thanksgiving"; color: KitColor; reward: string; bonusCoins: number };
type PlayerSort = "default" | "name-asc" | "name-desc" | "position" | "club" | "ovr-desc" | "ovr-asc" | "rating-desc" | "rating-asc" | "ability-desc" | "ability-asc" | "mean-desc" | "unlock-asc" | "unlock-desc" | "unlocked-first" | "locked-first";
type FormationSlot = { id: string; label: string; position: Position; x: number; y: number };
type TacticalFormation = { id: FormationId; name: string; description: string; slots: FormationSlot[] };
type Player = {
  id: string;
  name: string;
  club: string;
  position: Position;
  rating: number;
  ability: string;
  abilityType: AbilityType;
  abilityStat: number;
  clearing?: number;
  color: string;
  tacticalSlot?: string;
  tacticalX?: number;
  tacticalY?: number;
};
type Token = { player: Player; x: number; y: number; side: "home" | "away" };
type PitchFxKind = "pass" | "goal" | "shoot" | "steal" | "intercept" | "miss" | "move";
type PitchFx = {
  id: number;
  kind: PitchFxKind;
  from: { x: number; y: number };
  to: { x: number; y: number };
  label?: string;
  side?: "home" | "away";
};
type GoalBanner = { side: "home" | "away"; scorer: string };
type TutorialGuide = {
  title: string;
  detail: string;
  highlightTile?: { x: number; y: number };
  highlightTokenId?: string;
};
type LuckTrack = { successes: number; attempts: number };
type MatchLuck = { home: LuckTrack; away: LuckTrack };
export type Match = {
  format: FormatId;
  formationId: FormationId;
  tokens: Token[];
  ball: { x: number; y: number };
  turn: "home" | "away";
  score: [number, number];
  minute: number;
  half: 1 | 2;
  halftime: boolean;
  selected: string | null;
  message: string;
  campaignStage: number;
  extraAwayTurns: number;
  bonusTurnSide?: "home" | "away";
  stealProtectedSide?: "home" | "away";
  drivesUsed: number;
  actionsUsed: number;
  bonusDrives: number;
  bonusActions: number;
  luck: MatchLuck;
  finished?: boolean;
};

const roster: Player[] = [
  { id: "messi", name: "Lionel Messi", club: "Inter Miami CF", position: "FWD", rating: 91, ability: "Deadeye · elite close control", abilityType: "dribbling", abilityStat: 96, color: "#f36b87" },
  { id: "suarez", name: "Luis Suárez", club: "Inter Miami CF", position: "FWD", rating: 92, ability: "Poacher · sharp finishing", abilityType: "finishing", abilityStat: 95, color: "#f36b87" },
  { id: "alba", name: "Jordi Alba", club: "Inter Miami CF", position: "DEF", rating: 82, ability: "Overlap · pace on the flank", abilityType: "pace", abilityStat: 84, color: "#f36b87" },
  { id: "busquets", name: "Sergio Busquets", club: "Inter Miami CF", position: "MID", rating: 81, ability: "Metronome · passing range", abilityType: "playmaking", abilityStat: 89, color: "#f36b87" },
  { id: "bouanga", name: "Denis Bouanga", club: "LAFC", position: "FWD", rating: 91, ability: "Rapid · attacking pace", abilityType: "pace", abilityStat: 94, color: "#f5b942" },
  { id: "chiellini", name: "Giorgio Chiellini", club: "LAFC", position: "DEF", rating: 77, ability: "Anchor · defensive positioning", abilityType: "defending", abilityStat: 81, color: "#f5b942" },
  { id: "puig", name: "Riqui Puig", club: "LA Galaxy", position: "MID", rating: 91, ability: "Playmaker · progressive passing", abilityType: "playmaking", abilityStat: 95, color: "#8b73dc" },
  { id: "morris", name: "Jordan Morris", club: "Seattle Sounders FC", position: "FWD", rating: 81, ability: "Speedster · acceleration", abilityType: "pace", abilityStat: 87, color: "#36ad83" },
  { id: "roldan", name: "Cristian Roldan", club: "Seattle Sounders FC", position: "MID", rating: 76, ability: "Engine · work rate", abilityType: "pace", abilityStat: 78, color: "#36ad83" },
  { id: "frei", name: "Stefan Frei", club: "Seattle Sounders FC", position: "GK", rating: 80, ability: "Last line · shot stopping", abilityType: "goalkeeping", abilityStat: 86, clearing: 83, color: "#36ad83" },
  { id: "miles", name: "Miles Robinson", club: "FC Cincinnati", position: "DEF", rating: 79, ability: "Recovery · defensive coverage", abilityType: "defending", abilityStat: 84, color: "#ed794a" },
  { id: "moore", name: "DeAndre Yedlin", club: "Inter Miami CF", position: "DEF", rating: 72, ability: "Overlap · recovery pace", abilityType: "pace", abilityStat: 77, color: "#f36b87" },
  { id: "vela", name: "Carlos Vela", club: "LAFC", position: "FWD", rating: 91, ability: "Curling strike · shot placement", abilityType: "finishing", abilityStat: 94, color: "#f5b942" },
  { id: "pec", name: "Gabriel Pec", club: "LA Galaxy", position: "FWD", rating: 83, ability: "Quick feet · close control", abilityType: "dribbling", abilityStat: 86, color: "#8b73dc" },
  { id: "mukhtar", name: "Hany Mukhtar", club: "Nashville SC", position: "MID", rating: 91, ability: "MVP vision · chance creation", abilityType: "playmaking", abilityStat: 95, color: "#eac84b" },
  { id: "cucho", name: "Cucho Hernández", club: "Columbus Crew", position: "FWD", rating: 93, ability: "Clinical · finishing", abilityType: "finishing", abilityStat: 94, color: "#f1c94e" },
  { id: "benteke", name: "Christian Benteke", club: "D.C. United", position: "FWD", rating: 82, ability: "Target forward · finishing", abilityType: "finishing", abilityStat: 83, color: "#e4e8df" },
  { id: "burki", name: "Roman Bürki", club: "St. Louis CITY SC", position: "GK", rating: 93, ability: "Wall · shot stopping", abilityType: "goalkeeping", abilityStat: 97, clearing: 91, color: "#ef5145" },
  { id: "acosta", name: "Luciano Acosta", club: "FC Cincinnati", position: "MID", rating: 87, ability: "Creator · close control", abilityType: "dribbling", abilityStat: 89, color: "#ed794a" },
  { id: "almada", name: "Thiago Almada", club: "Atlanta United", position: "MID", rating: 84, ability: "Quick feet · creative passing", abilityType: "playmaking", abilityStat: 86, color: "#c93642" },
  { id: "evander", name: "Evander", club: "Portland Timbers", position: "MID", rating: 84, ability: "Long-range threat · shot placement", abilityType: "finishing", abilityStat: 85, color: "#37a86c" },
  { id: "insigne", name: "Lorenzo Insigne", club: "Toronto FC", position: "FWD", rating: 80, ability: "Curling finish · shot placement", abilityType: "finishing", abilityStat: 84, color: "#d84248" },
  { id: "dreyer", name: "Anders Dreyer", club: "San Diego FC", position: "FWD", rating: 85, ability: "Quick feet · attacking movement", abilityType: "dribbling", abilityStat: 85, color: "#59b9aa" },
];

const additionalMlsPlayers: [string, string, string, Position][] = [
  ["guzan", "Brad Guzan", "Atlanta United", "GK"], ["lennon", "Brooks Lennon", "Atlanta United", "DEF"], ["slisz", "Bartłomiej Ślisz", "Atlanta United", "MID"], ["lobjanidze", "Saba Lobjanidze", "Atlanta United", "FWD"], ["miranchuk", "Aleksey Miranchuk", "Atlanta United", "MID"],
  ["stuv", "Brad Stuver", "Austin FC", "GK"], ["gallagher", "Jon Gallagher", "Austin FC", "DEF"], ["ring", "Alexander Ring", "Austin FC", "MID"], ["pereira", "Dani Pereira", "Austin FC", "MID"], ["driussi", "Sebastián Driussi", "Austin FC", "FWD"],
  ["kahlina", "Kristijan Kahlina", "Charlotte FC", "GK"], ["byrne", "Nathan Byrne", "Charlotte FC", "DEF"], ["bronico", "Brandt Bronico", "Charlotte FC", "MID"], ["westwood", "Ashley Westwood", "Charlotte FC", "MID"], ["abada", "Liel Abada", "Charlotte FC", "FWD"],
  ["brady", "Chris Brady", "Chicago Fire FC", "GK"], ["gutierrez", "Brian Gutiérrez", "Chicago Fire FC", "MID"], ["cuypers", "Hugo Cuypers", "Chicago Fire FC", "FWD"], ["pineda", "Mauricio Pineda", "Chicago Fire FC", "DEF"], ["shaqiri", "Xherdan Shaqiri", "Chicago Fire FC", "MID"],
  ["steffen", "Zack Steffen", "Colorado Rapids", "GK"], ["rosenberry", "Keegan Rosenberry", "Colorado Rapids", "DEF"], ["bassett", "Cole Bassett", "Colorado Rapids", "MID"], ["mihailovic", "Djordje Mihailovic", "Colorado Rapids", "MID"], ["navarro", "Rafael Navarro", "Colorado Rapids", "FWD"],
  ["schulte", "Patrick Schulte", "Columbus Crew", "GK"], ["moreira", "Steven Moreira", "Columbus Crew", "DEF"], ["nagbe", "Darlington Nagbe", "Columbus Crew", "MID"], ["rossi", "Diego Rossi", "Columbus Crew", "FWD"], ["ramirez", "Christian Ramírez", "Columbus Crew", "FWD"],
  ["celentano", "Roman Celentano", "FC Cincinnati", "GK"], ["miazga", "Matt Miazga", "FC Cincinnati", "DEF"], ["nwobodo", "Obinna Nwobodo", "FC Cincinnati", "MID"], ["kubo", "Yuya Kubo", "FC Cincinnati", "MID"], ["santos", "Sergio Santos", "FC Cincinnati", "FWD"],
  ["paes", "Maarten Paes", "FC Dallas", "GK"], ["ferreira", "Jesús Ferreira", "FC Dallas", "FWD"], ["arriola", "Paul Arriola", "FC Dallas", "FWD"], ["pomykal", "Paxton Pomykal", "FC Dallas", "MID"], ["tafari", "Nkosi Tafari", "FC Dallas", "DEF"],
  ["clark", "Steve Clark", "Houston Dynamo FC", "GK"], ["dorsey", "Griffin Dorsey", "Houston Dynamo FC", "DEF"], ["herrera", "Héctor Herrera", "Houston Dynamo FC", "MID"], ["bassi", "Amine Bassi", "Houston Dynamo FC", "MID"], ["carrasquilla", "Adalberto Carrasquilla", "Houston Dynamo FC", "MID"],
  ["lloris", "Hugo Lloris", "LAFC", "GK"], ["hollingshead", "Ryan Hollingshead", "LAFC", "DEF"], ["atuesta", "Eduard Atuesta", "LAFC", "MID"], ["tillman", "Timothy Tillman", "LAFC", "MID"], ["giroud", "Olivier Giroud", "LAFC", "FWD"],
  ["mccarthy", "John McCarthy", "LA Galaxy", "GK"], ["yoshida", "Maya Yoshida", "LA Galaxy", "DEF"], ["reus", "Marco Reus", "LA Galaxy", "MID"], ["paintsil", "Joseph Paintsil", "LA Galaxy", "FWD"], ["delgado", "Marky Delgado", "LA Galaxy", "MID"],
  ["stclair", "Dayne St. Clair", "Minnesota United FC", "GK"], ["boxall", "Michael Boxall", "Minnesota United FC", "DEF"], ["lod", "Robin Lod", "Minnesota United FC", "MID"], ["trapp", "Wil Trapp", "Minnesota United FC", "MID"], ["pukki", "Teemu Pukki", "Minnesota United FC", "FWD"],
  ["sirois", "Jonathan Sirois", "CF Montréal", "GK"], ["waterman", "Joel Waterman", "CF Montréal", "DEF"], ["piette", "Samuel Piette", "CF Montréal", "MID"], ["choiniere", "Mathieu Choinière", "CF Montréal", "MID"], ["iankov", "Dominik Iankov", "CF Montréal", "MID"],
  ["willis", "Joe Willis", "Nashville SC", "GK"], ["zimmerman", "Walker Zimmerman", "Nashville SC", "DEF"], ["godoy", "Aníbal Godoy", "Nashville SC", "MID"], ["shaffelburg", "Jacob Shaffelburg", "Nashville SC", "FWD"], ["surridge", "Sam Surridge", "Nashville SC", "FWD"],
  ["turner", "Matt Turner", "New England Revolution", "GK"], ["gil", "Carles Gil", "New England Revolution", "MID"], ["wood", "Bobby Wood", "New England Revolution", "FWD"], ["bye", "Brandon Bye", "New England Revolution", "DEF"], ["campana", "Leonardo Campana", "New England Revolution", "FWD"],
  ["freese", "Matt Freese", "New York City FC", "GK"], ["sands", "James Sands", "New York City FC", "DEF"], ["moralez", "Maxi Moralez", "New York City FC", "MID"], ["santi", "Santiago Rodríguez", "New York City FC", "MID"], ["magno", "Talles Magno", "New York City FC", "FWD"],
  ["coronel", "Carlos Coronel", "New York Red Bulls", "GK"], ["tolkin", "John Tolkin", "New York Red Bulls", "DEF"], ["forsberg", "Emil Forsberg", "New York Red Bulls", "MID"], ["morgan", "Lewis Morgan", "New York Red Bulls", "FWD"], ["amaya", "Frankie Amaya", "New York Red Bulls", "MID"],
  ["gallese", "Pedro Gallese", "Orlando City SC", "GK"], ["araujo", "Facundo Torres", "Orlando City SC", "FWD"], ["ojeda", "Martín Ojeda", "Orlando City SC", "MID"], ["muriel", "Luis Muriel", "Orlando City SC", "FWD"], ["c-araujo", "César Araújo", "Orlando City SC", "MID"],
  ["blake", "Andre Blake", "Philadelphia Union", "GK"], ["glesnes", "Jakob Glesnes", "Philadelphia Union", "DEF"], ["bedoya", "Alejandro Bedoya", "Philadelphia Union", "MID"], ["gazdag", "Dániel Gazdag", "Philadelphia Union", "MID"], ["uhre", "Mikael Uhre", "Philadelphia Union", "FWD"],
  ["crepeau", "Maxime Crépeau", "Portland Timbers", "GK"], ["chara", "Diego Chará", "Portland Timbers", "MID"], ["williamson", "Eryk Williamson", "Portland Timbers", "MID"], ["moreno", "Santiago Moreno", "Portland Timbers", "FWD"], ["mora", "Felipe Mora", "Portland Timbers", "FWD"],
  ["macmath", "Zac MacMath", "Real Salt Lake", "GK"], ["glad", "Justen Glad", "Real Salt Lake", "DEF"], ["luna", "Diego Luna", "Real Salt Lake", "MID"], ["ruiz", "Pablo Ruiz", "Real Salt Lake", "MID"], ["anderson", "Anderson Julio", "Real Salt Lake", "FWD"],
  ["daniel", "Daniel", "San Jose Earthquakes", "GK"], ["yueill", "Jackson Yueill", "San Jose Earthquakes", "MID"], ["espinoza", "Cristian Espinoza", "San Jose Earthquakes", "FWD"], ["ebobisse", "Jeremy Ebobisse", "San Jose Earthquakes", "FWD"], ["rodrigues", "Rodrigues", "San Jose Earthquakes", "DEF"],
  ["ruidiaz", "Raúl Ruidíaz", "Seattle Sounders FC", "FWD"], ["rusnak", "Albert Rusnák", "Seattle Sounders FC", "MID"], ["joaopaulo", "João Paulo", "Seattle Sounders FC", "MID"], ["nouhou", "Nouhou Tolo", "Seattle Sounders FC", "DEF"], ["musovski", "Danny Musovski", "Seattle Sounders FC", "FWD"],
  ["pulskamp", "John Pulskamp", "Sporting Kansas City", "GK"], ["russell", "Johnny Russell", "Sporting Kansas City", "FWD"], ["salloi", "Dániel Sallói", "Sporting Kansas City", "FWD"], ["thommy", "Erik Thommy", "Sporting Kansas City", "MID"], ["fontas", "Andreu Fontàs", "Sporting Kansas City", "DEF"],
  ["lowen", "Eduard Löwen", "St. Louis CITY SC", "MID"], ["klauss", "João Klauss", "St. Louis CITY SC", "FWD"], ["vassilev", "Indiana Vassilev", "St. Louis CITY SC", "MID"], ["parker", "Tim Parker", "St. Louis CITY SC", "DEF"], ["adeniran", "Samuel Adeniran", "St. Louis CITY SC", "FWD"],
  ["bernardeschi", "Federico Bernardeschi", "Toronto FC", "FWD"], ["osorio", "Jonathan Osorio", "Toronto FC", "MID"], ["laryea", "Richie Laryea", "Toronto FC", "DEF"], ["petretta", "Raoul Petretta", "Toronto FC", "DEF"], ["johnson", "Sean Johnson", "Toronto FC", "GK"],
  ["gauld", "Ryan Gauld", "Vancouver Whitecaps FC", "MID"], ["white", "Brian White", "Vancouver Whitecaps FC", "FWD"], ["cubas", "Andrés Cubas", "Vancouver Whitecaps FC", "MID"], ["blackmon", "Tristan Blackmon", "Vancouver Whitecaps FC", "DEF"], ["raposo", "Ryan Raposo", "Vancouver Whitecaps FC", "MID"],
  ["callender", "Drake Callender", "Inter Miami CF", "GK"], ["gomez", "Diego Gómez", "Inter Miami CF", "MID"], ["farias", "Facundo Farías", "Inter Miami CF", "FWD"], ["cremaschi", "Benjamin Cremaschi", "Inter Miami CF", "MID"], ["fray", "Ian Fray", "Inter Miami CF", "DEF"],
  ["lozano", "Hirving Lozano", "San Diego FC", "FWD"], ["deLaTorre", "Luca de la Torre", "San Diego FC", "MID"], ["mcnair", "Paddy McNair", "San Diego FC", "DEF"], ["mcvey", "Christopher McVey", "San Diego FC", "DEF"], ["yaro", "Oscar Verhoeven", "San Diego FC", "DEF"],
];
const mlsColors = ["#4c91c5", "#e36c51", "#8e79d6", "#43a987", "#d0a33d", "#43a9bb"];
const ratingOverrides: Record<string, number> = {
  brady: 56, fray: 55, pineda: 57, tafari: 58, parker: 58, vassilev: 56, raposo: 55,
  "c-araujo": 57, musovski: 58, adeniran: 55, wood: 54,
  miranchuk: 83, driussi: 82, abada: 79, cuypers: 80, shaqiri: 78,
  mihailovic: 82, nagbe: 81, rossi: 81, celentano: 80, ferreira: 79,
  paes: 80, carrasquilla: 82, gil: 84, giroud: 79, reus: 82, pukki: 78,
  forsberg: 82, gazdag: 80, blake: 83, espinoza: 82, russell: 78,
  gallese: 81, muriel: 79, llorris: 82, white: 79, gauld: 82,
};
const additionalRoster: Player[] = additionalMlsPlayers.map(([id, name, club, position], index) => {
  const color = mlsColors[index % mlsColors.length];
  const ability = position === "GK"
    ? "Shot stopping"
    : position === "DEF"
      ? "Defensive positioning"
      : position === "MID"
        ? "Passing and ball progression"
        : "Finishing";
  const abilityType: AbilityType = position === "GK"
    ? "goalkeeping"
    : position === "DEF"
      ? "defending"
      : position === "MID"
        ? "playmaking"
        : "finishing";
  const rating = ratingOverrides[id] ?? 54 + ((index * 7) % 27);
  return {
    id: `mls-${id}`,
    name,
    club,
    position,
    rating,
    ability,
    abilityType,
    abilityStat: Math.max(42, Math.min(91, rating + ((index * 13) % 9) - 4)),
    clearing: position === "GK" ? Math.max(45, Math.min(96, rating + ((index * 11) % 17) - 5)) : undefined,
    color,
  };
});
roster.push(...additionalRoster);

const startingPlayers = [
  "mls-brady", "mls-fray", "mls-pineda", "mls-tafari", "mls-parker",
  "mls-vassilev", "mls-raposo", "mls-c-araujo", "mls-musovski", "mls-adeniran", "mls-wood",
];
const smallSidedLevel = 10;
const goldenGoalLevel = 20;
const battlePassFinalLevel = roster.length - startingPlayers.length + 5;
const coins250Level = battlePassFinalLevel - 2;
const coins500Level = battlePassFinalLevel;
const premiumPlayerRewards: { id: string; level: number }[] = [
  { id: "mukhtar", level: 21 },
  { id: "puig", level: 41 },
  { id: "messi", level: 61 },
  { id: "bouanga", level: 81 },
  { id: "vela", level: 101 },
  { id: "burki", level: 121 },
  { id: "cucho", level: 141 },
  { id: "suarez", level: 161 },
];
const premiumPlayerIds = new Set(premiumPlayerRewards.map(({ id }) => id));
const allPassPlayerRewards = roster.filter((player) => !startingPlayers.includes(player.id));
const overallRating = (player: Player) =>
  Math.round((player.rating + 2 * player.abilityStat) / 3);
const abilityContribution = (player: Player, type: AbilityType) =>
  player.abilityType === type ? player.abilityStat - 50 : 0;
// Weights fitted to 36,000 fixed-seed synthetic self-play matches.
const playerBalanceScore = (player: Player) => {
  const overall = overallRating(player);
  const finishing = abilityContribution(player, "finishing");
  const playmaking = abilityContribution(player, "playmaking");
  const pace = abilityContribution(player, "pace");
  const defending = abilityContribution(player, "defending");
  const goalkeeping = abilityContribution(player, "goalkeeping");
  const offense = player.position === "FWD"
    ? (0.5 * overall + 0.07 * finishing + 0.025 * pace) / 3
    : player.position === "MID"
      ? (0.32 * overall + 0.04 * playmaking) / 3
      : player.position === "DEF" ? 0.18 * overall / 4 : 0;
  const defense = player.position === "DEF"
    ? (0.52 * overall + 0.08 * defending) / 4
    : player.position === "GK"
      ? 0.25 * overall + 0.06 * goalkeeping
      : player.position === "MID" ? 0.23 * overall / 3 : 0;
  const creation = player.position === "MID"
    ? 0.08 * playmaking / 3
    : player.position === "FWD" ? 0.06 * finishing / 3 : 0;
  return 1.3704 * offense + 0.9339 * defense + 0.0876 * creation;
};
const passPlayerRewards = allPassPlayerRewards.filter((player) =>
  !startingPlayers.includes(player.id) && !premiumPlayerIds.has(player.id),
).sort((a, b) => playerBalanceScore(a) - playerBalanceScore(b) || a.id.localeCompare(b.id));
const playerRewardLevels = Array.from({ length: battlePassFinalLevel }, (_, index) => index + 1)
  .filter((passLevel) => ![1, smallSidedLevel, goldenGoalLevel, coins250Level, coins500Level]
    .includes(passLevel) && !premiumPlayerRewards.some((reward) => reward.level === passLevel));
const playerUnlocks: Record<string, number> = Object.fromEntries(
  [
    ...passPlayerRewards.map((player, index) => [player.id, playerRewardLevels[index]] as const),
    ...premiumPlayerRewards.map(({ id, level }) => [id, level] as const),
  ],
);
const playerRewardsByLevel: Record<number, Player> = Object.fromEntries(
  [
    ...passPlayerRewards.map((player) => [playerUnlocks[player.id], player] as const),
    ...premiumPlayerRewards.map(({ id, level }) => {
      const player = roster.find((entry) => entry.id === id);
      if (!player) throw new Error(`Missing premium player reward: ${id}`);
      return [level, player] as const;
    }),
  ],
);
const formats: { id: FormatId; name: string; detail: string; unlock: number }[] = [
  { id: "classic", name: "Classic 11v11", detail: "Full squad · first to 3 goals", unlock: 1 },
  { id: "small-sided", name: "Street 3v3", detail: "Fast, open play · first to 2 goals", unlock: smallSidedLevel },
  { id: "golden-goal", name: "Golden Goal", detail: "One goal wins · sudden death", unlock: goldenGoalLevel },
];
const makeFormationSlots = (
  defenders: [string, number][],
  midfielders: [string, number][],
  forwards: [string, number][],
  defenderX = 4,
  midfieldX = 7,
  forwardX = 10,
): FormationSlot[] => [
  { id: "GK", label: "GK", position: "GK", x: 1, y: 5 },
  ...defenders.map(([id, y]) => ({ id, label: id, position: "DEF" as const, x: defenderX, y })),
  ...midfielders.map(([id, y]) => ({ id, label: id, position: "MID" as const, x: midfieldX, y })),
  ...forwards.map(([id, y]) => ({ id, label: id, position: "FWD" as const, x: forwardX, y })),
];
const formations: TacticalFormation[] = [
  { id: "4-3-3", name: "4-3-3", description: "Balanced wide attack · 4 defenders, 3 midfielders, 3 forwards", slots: makeFormationSlots([["LB", 1], ["LCB", 4], ["RCB", 6], ["RB", 9]], [["CDM", 3], ["LCM", 5], ["RCM", 7]], [["LW", 2], ["ST", 5], ["RW", 8]]) },
  { id: "4-4-2", name: "4-4-2", description: "Two banks of four · 4 defenders, 4 midfielders, 2 strikers", slots: makeFormationSlots([["LB", 1], ["LCB", 4], ["RCB", 6], ["RB", 9]], [["LM", 1], ["LCM", 4], ["RCM", 6], ["RM", 9]], [["LS", 4], ["RS", 6]]) },
  { id: "3-5-2", name: "3-5-2", description: "Wing-back width · 3 defenders, 5 midfielders, 2 strikers", slots: makeFormationSlots([["LCB", 2], ["CB", 5], ["RCB", 8]], [["LWB", 0], ["LCM", 3], ["CDM", 5], ["RCM", 7], ["RWB", 10]], [["LS", 4], ["RS", 6]]) },
  { id: "4-2-3-1", name: "4-2-3-1", description: "Compact double pivot · 4 defenders, 2 holding mids, 3 creators, 1 striker", slots: makeFormationSlots([["LB", 1], ["LCB", 4], ["RCB", 6], ["RB", 9]], [["LDM", 4], ["RDM", 6], ["CAM", 5]], [["LW", 1], ["RW", 9], ["ST", 5]], 4, 7, 11) },
];
const defaultFormation = formations[0];
const formationById = (id: string) => formations.find((formation) => formation.id === id) ?? defaultFormation;
const campaignFormatForStage = (stage: number): FormatId =>
  stage % 7 === 0 ? "golden-goal" : stage % 5 === 0 ? "small-sided" : "classic";
const campaignFormatLabel = (stage: number) => formats.find((format) => format.id === campaignFormatForStage(stage))?.name ?? formats[0].name;
const kitColors: KitColor[] = [
  { id: "lime", name: "Stadium Mint", value: "#8ff2c8" },
  { id: "coral", name: "Kickoff Coral", value: "#ec695e" },
  { id: "sky", name: "Sky Blue", value: "#65b9f4" },
  { id: "violet", name: "Violet", value: "#a68af6" },
  { id: "gold", name: "Golden Hour", value: "#f2c84b" },
  { id: "mint", name: "Mint", value: "#55d6a4" },
  { id: "rose", name: "Rose", value: "#f07bac" },
  { id: "orange", name: "Orange", value: "#ff914d" },
  { id: "ice", name: "Ice Blue", value: "#a5e8f4" },
  { id: "navy", name: "Deep Navy", value: "#4966b2" },
  { id: "red", name: "Match Red", value: "#dc3948" },
  { id: "white", name: "Away White", value: "#e9eee9" },
  { id: "teal", name: "Teal", value: "#169c9b" },
  { id: "purple", name: "Purple", value: "#733bb5" },
  { id: "yellow", name: "Referee Yellow", value: "#e7e82f" },
  { id: "charcoal", name: "Charcoal", value: "#525e58" },
];
const dailyOfferPlayers = roster.filter((player) => overallRating(player) >= 82);
const meanPlayerStats = (player: Player) => player.position === "GK"
  ? Math.round((player.rating + player.abilityStat + goalkeeperClearing(player)) / 3)
  : Math.round((player.rating + player.abilityStat) / 2);
const dailyOfferPrice = (player: Player) => 180 + Math.max(0, overallRating(player) - 82) * 28;
const dailyPlayerOffers = (date: Date) => {
  const dayKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  let seed = Array.from(dayKey).reduce((value, char) => (value * 31 + char.charCodeAt(0)) >>> 0, 7);
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0x100000000;
  };
  const pool = [...dailyOfferPlayers];
  const offers: Player[] = [];
  while (offers.length < 4 && pool.length) {
    const index = Math.floor(random() * pool.length);
    offers.push(pool.splice(index, 1)[0]);
  }
  return offers;
};
const thanksgivingCrateEnds = new Date("2026-12-01T05:00:00Z").getTime();
const cratePlayerPools: Record<"basic" | "blitz" | "thanksgiving", string[]> = {
  basic: roster.filter((player) => overallRating(player) < 76).map((player) => player.id),
  blitz: ["suarez", "burki", "cucho", "messi", "bouanga", "puig", "mukhtar", "vela", "acosta", "dreyer", "morris"],
  thanksgiving: ["mls-guzan", "mls-driussi", "mls-lloris", "mls-giroud", "mls-reus", "mls-miranchuk", "mls-forsberg", "mls-blake", "mls-gil", "mls-gauld", "mls-espinoza"],
};
const crateFormationPools: Record<"basic" | "blitz" | "thanksgiving", FormationId[]> = {
  basic: ["4-4-2"],
  blitz: ["3-5-2", "4-2-3-1"],
  thanksgiving: ["4-2-3-1", "3-5-2"],
};
const kitColorById = (id: string) => kitColors.find((color) => color.id === id) ?? kitColors[0];
const kitColorsTooSimilar = (first: string, second: string) => {
  const rgb = (hex: string) => hex.match(/[a-f\d]{2}/gi)?.map((part) => parseInt(part, 16)) ?? [0, 0, 0];
  const a = rgb(first);
  const b = rgb(second);
  return Math.sqrt(a.reduce((sum, channel, index) => sum + (channel - b[index]) ** 2, 0)) < 115;
};
function KitColorPicker({ label, value, options, onChange }: {
  label: string;
  value: string;
  options: string[];
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selectedColor = kitColorById(value);
  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [open]);
  return <div className={`kit-select ${open ? "open" : ""}`} ref={rootRef}>
    <button type="button" className="kit-select-trigger" aria-label={label} aria-haspopup="listbox" aria-expanded={open}
      onClick={() => setOpen((current) => !current)}
      onKeyDown={(event) => { if (event.key === "Escape") setOpen(false); }}>
      <span className="kit-swatch" style={{ background: selectedColor.value }} aria-hidden="true" />
      <span className="kit-select-name">{selectedColor.name}</span>
      <span className="kit-chevron" aria-hidden="true">{open ? "▴" : "▾"}</span>
    </button>
    {open && <div className="kit-select-menu" role="listbox" aria-label={label}>
      {options.map((id) => {
        const color = kitColorById(id);
        const selected = id === value;
        return <button type="button" role="option" aria-selected={selected} key={id}
          className={`kit-option ${selected ? "selected" : ""}`}
          onClick={() => { onChange(id); setOpen(false); }}>
          <span className="kit-swatch" style={{ background: color.value }} aria-hidden="true" />
          <span>{color.name}</span>
          <span className="kit-check" aria-hidden="true">{selected ? "✓" : ""}</span>
        </button>;
      })}
    </div>}
  </div>;
}
const formatCountdown = (milliseconds: number) => {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${days ? `${days}d ` : ""}${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};
const xpRequiredForPassLevel = (passLevel: number) => Math.max(0, (passLevel - 1) * 1000);
const currentSaveVersion = 3;
const passLevelForXp = (xp: number) => {
  let passLevel = 1;
  while (passLevel < battlePassFinalLevel && xp >= xpRequiredForPassLevel(passLevel + 1)) passLevel += 1;
  return passLevel;
};
const positionOrder: Record<Position, number> = { GK: 0, DEF: 1, MID: 2, FWD: 3 };
const selectXI = (players: Player[]) => {
  const slots: Record<Position, number> = { GK: 1, DEF: 4, MID: 3, FWD: 3 };
  const selected = (Object.keys(slots) as Position[]).flatMap((position) =>
    players.filter((player) => player.position === position)
      .sort((a, b) => overallRating(b) - overallRating(a))
      .slice(0, slots[position]),
  );
  return selected.sort((a, b) => positionOrder[a.position] - positionOrder[b.position] || overallRating(b) - overallRating(a));
};
const assignFormationPlayers = (
  players: Player[],
  formation: TacticalFormation,
  assignments: Record<string, string> = {},
) => {
  const used = new Set<string>();
  const reserved = new Map(formation.slots.flatMap((slot) => {
    const assigned = players.find((player) => player.id === assignments[slot.id] && player.position === slot.position);
    return assigned ? [[slot.id, assigned.id] as const] : [];
  }));
  return formation.slots.flatMap((slot) => {
    const assigned = players.find((player) => player.id === reserved.get(slot.id)
      && player.position === slot.position && !used.has(player.id));
    const player = assigned ?? players
      .filter((candidate) => candidate.position === slot.position && !used.has(candidate.id)
        && ![...reserved.entries()].some(([assignedSlot, playerId]) => assignedSlot !== slot.id && playerId === candidate.id))
      .sort((a, b) => overallRating(b) - overallRating(a))[0];
    if (!player) return [];
    used.add(player.id);
    return [{
      ...player,
      position: slot.position,
      tacticalSlot: slot.id,
      tacticalX: slot.x,
      tacticalY: slot.y,
    }];
  });
};
const selectSmallSidedXI = (players: Player[]) => {
  const selected = (["GK", "MID", "FWD"] as Position[])
    .map((position) => players.filter((player) => player.position === position).sort((a, b) => overallRating(b) - overallRating(a))[0])
    .filter((player): player is Player => !!player);
  return [...selected, ...players.filter((player) => !selected.some((chosen) => chosen.id === player.id))
    .sort((a, b) => overallRating(b) - overallRating(a))]
    .slice(0, 3);
};
const maxPlayerUnlockLevel = Math.max(...Object.values(playerUnlocks));
const aiOpponentRoster = (difficulty: number) => {
  const unlockLimit = Math.ceil(maxPlayerUnlockLevel * cap(difficulty, 1, 100) / 100);
  return selectXI(roster.filter((player) =>
    startingPlayers.includes(player.id) || (playerUnlocks[player.id] ?? 1) <= unlockLimit,
  ));
};
const chooseAiFormation = (
  players: Player[],
  strategy: AiStrategy,
  playStyle: HumanPlayStyle,
) => {
  const styleTotal = Math.max(1, playStyle.shots + playStyle.passes + playStyle.carries + playStyle.nutmegs);
  const shotRate = playStyle.shots / styleTotal;
  const passRate = playStyle.passes / styleTotal;
  const carryRate = (playStyle.carries + playStyle.nutmegs) / styleTotal;
  return [...formations].map((formation) => {
    const assignments: Record<string, string> = {};
    const used = new Set<string>();
    formation.slots.forEach((slot) => {
      const candidates = players.filter((player) => player.position === slot.position && !used.has(player.id));
      const abilityScore = (player: Player) => {
        if (player.position === "FWD") {
          return Math.max(abilityEffect(player, "finishing") * strategy.finishing,
            abilityEffect(player, "pace") * strategy.progression,
            abilityEffect(player, "dribbling") * strategy.progression);
        }
        if (player.position === "MID") {
          return Math.max(abilityEffect(player, "playmaking") * strategy.passing,
            abilityEffect(player, "pace") * strategy.progression,
            abilityEffect(player, "dribbling") * strategy.progression);
        }
        if (player.position === "DEF") return abilityEffect(player, "defending") * strategy.marking;
        return abilityEffect(player, "goalkeeping") * strategy.marking;
      };
      const player = candidates.sort((a, b) =>
        (overallRating(b) + abilityScore(b) * 0.25) - (overallRating(a) + abilityScore(a) * 0.25),
      )[0];
      if (player) {
        assignments[slot.id] = player.id;
        used.add(player.id);
      }
    });
    const lineup = assignFormationPlayers(players, formation, assignments);
    const playerValue = lineup.reduce((total, player) => {
      const positionBonus = player.position === "FWD"
        ? Math.max(abilityEffect(player, "finishing"), abilityEffect(player, "pace"), abilityEffect(player, "dribbling")) * strategy.finishing
        : player.position === "MID"
          ? Math.max(abilityEffect(player, "playmaking"), abilityEffect(player, "pace")) * strategy.passing
          : player.position === "DEF"
            ? abilityEffect(player, "defending") * strategy.marking
            : abilityEffect(player, "goalkeeping") * strategy.marking;
      return total + overallRating(player) + positionBonus * 0.18;
    }, 0);
    const formationStyle = formation.id === "4-2-3-1"
      ? passRate * strategy.passing
      : formation.id === "4-3-3"
        ? carryRate * strategy.progression
        : formation.id === "3-5-2"
          ? shotRate * strategy.finishing
          : strategy.countering * 0.35;
    return { formation, assignments, score: playerValue + formationStyle * 8 };
  }).sort((a, b) => b.score - a.score)[0] ?? { formation: defaultFormation, assignments: {} };
};
const playersAvailableAt = (passLevel: number) =>
  [...startingPlayers, ...Object.entries(playerUnlocks).filter(([, requiredLevel]) => passLevel >= requiredLevel).map(([id]) => id)];

const fmt = (id: FormatId) => formats.find((format) => format.id === id) ?? formats[0];
const distance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const cap = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const emptyLuck = (): MatchLuck => ({
  home: { successes: 0, attempts: 0 },
  away: { successes: 0, attempts: 0 },
});
const LUCK_MIN_ATTEMPTS = 5;
const LUCK_CONFIDENCE_SAMPLE = 15;
const LUCK_CORRECTION_STRENGTH = 44;
const luckRate = (track: LuckTrack) => track.attempts ? track.successes / track.attempts : 0.5;
const luckBias = (track: LuckTrack) =>
  (luckRate(track) - 0.5) * cap((track.attempts - LUCK_MIN_ATTEMPTS) / LUCK_CONFIDENCE_SAMPLE, 0, 1);
// Soft regression to 50%: a side that has been lucky has its next success
// chance reduced, while an unlucky side gets a boost. The pull grows with the
// distance from 50%, but it never makes a result certain.
const luckAdjustedChance = (
  match: Match,
  successSide: "home" | "away",
  failureSide: "home" | "away",
  chance: number,
) => cap(chance + (luckBias(match.luck[failureSide]) * 0.5 - luckBias(match.luck[successSide]))
  * LUCK_CORRECTION_STRENGTH, 3, 97);
const rollLuck = (
  match: Match,
  successSide: "home" | "away",
  failureSide: "home" | "away",
  chance: number,
) => {
  const adjustedChance = luckAdjustedChance(match, successSide, failureSide, chance);
  const success = Math.random() * 100 < adjustedChance;
  const nextLuck: MatchLuck = { ...match.luck };
  nextLuck[successSide] = {
    successes: match.luck[successSide].successes + (success ? 1 : 0),
    attempts: match.luck[successSide].attempts + 1,
  };
  nextLuck[failureSide] = {
    successes: match.luck[failureSide].successes + (success ? 0 : 1),
    attempts: match.luck[failureSide].attempts + 1,
  };
  return { success, chance: adjustedChance, match: { ...match, luck: nextLuck } };
};
const luckPercent = (track: LuckTrack) =>
  track.attempts ? Math.round((track.successes / track.attempts) * 100) : 50;
const abilityEffect = (player: Player, type: AbilityType) =>
  player.abilityType === type ? player.abilityStat - 50 : 0;
const movementBonus = (player: Player) =>
  player.abilityType === "pace" && player.abilityStat >= 85 ? 1 : 0;
const passingBonus = (player: Player) =>
  player.abilityType === "playmaking" && player.abilityStat >= 85 ? 1 : 0;
const passingRange = (player: Player) => 5 + passingBonus(player);
const shotRange = (player: Player) =>
  7 + (player.abilityType === "finishing" && player.abilityStat >= 90 ? 1 : 0);
const nutmegChance = (player: Player) =>
  cap(50 + abilityEffect(player, "dribbling") * 0.1, 45, 56);
const abilityDescription = (player: Player) =>
  `${player.ability} · Ability ${player.abilityStat} ×2 (${player.abilityType})${player.position === "GK" ? ` · Clearing ${goalkeeperClearing(player)}` : ""} · OVR ${overallRating(player)}`;
const displayKey = (code: string | null) => {
  if (!code) return "UNBOUND";
  if (code.startsWith("Key")) return code.slice(3);
  if (code.startsWith("Digit")) return code.slice(5);
  if (code === "NumpadEnter") return "NUM ENTER";
  return code.replace(/([A-Z])/g, " $1").trim().toUpperCase();
};
const goalkeeperPenalty = (tokens: Token[], attackingSide: "home" | "away") => {
  const keeper = tokens.find((token) => token.side !== attackingSide && token.player.position === "GK");
  return keeper ? cap(Math.round(abilityEffect(keeper.player, "goalkeeping") * 0.12), 0, 5) : 0;
};
const goalkeeperClearing = (player: Player) => player.clearing ?? (player.position === "GK" ? player.rating : 50);
const defendingGoalX = (side: "home" | "away", half: 1 | 2) =>
  side === "home" ? (half === 1 ? 0 : 21) : (half === 1 ? 21 : 0);
const isInOwnPenaltyBox = (token: Token, half: 1 | 2) =>
  Math.abs(token.x - defendingGoalX(token.side, half)) <= 2 && Math.abs(token.y - 5) <= 3;
const goalkeeperClearRange = (player: Player) =>
  cap(12 + Math.round(goalkeeperClearing(player) / 10), 15, 20);
const goalkeeperClearAccuracy = (player: Player, distanceToTarget: number) =>
  cap(88 - Math.max(0, distanceToTarget - 5) * 2.8 + (goalkeeperClearing(player) - 50) * 0.45, 12, 88);
const goalkeeperClearTarget = (keeper: Token, tokens: Token[], half: 1 | 2) => {
  const attackDirection = keeper.side === "home"
    ? (half === 1 ? 1 : -1)
    : (half === 1 ? -1 : 1);
  const pushingPlayer = tokens.filter((token) => token.side === keeper.side && token.player.position !== "GK")
    .sort((a, b) => {
      const progress = (b.x - a.x) * attackDirection;
      return progress || (b.player.position === "FWD" ? 1 : 0) - (a.player.position === "FWD" ? 1 : 0);
    })[0];
  const target = pushingPlayer ?? { x: keeper.x + attackDirection * goalkeeperClearRange(keeper.player), y: 5 };
  const route = lineCells(keeper, target);
  return route[Math.min(route.length, goalkeeperClearRange(keeper.player)) - 1]
    ?? { x: cap(keeper.x + attackDirection * goalkeeperClearRange(keeper.player), 1, 20), y: 5 };
};
const resolveGoalkeeperClearance = (match: Match, keeper: Token) => {
  const attackDirection = keeper.side === "home"
    ? (match.half === 1 ? 1 : -1)
    : (match.half === 1 ? -1 : 1);
  const target = goalkeeperClearTarget(keeper, match.tokens, match.half);
  const clearDistance = distance(keeper, target);
  const accuracy = goalkeeperClearAccuracy(keeper.player, clearDistance);
  const opponentSide = keeper.side === "home" ? "away" : "home";
  const interception = findInterceptor(match.tokens, keeper.side, lineCells(keeper, target));
  let luckState = match;
  if (interception) {
    const block = rollLuck(match, interception.token.side, keeper.side,
      interceptionChance(interception.token, "pass", interception.gap));
    luckState = block.match;
    if (block.success) {
      return {
        ...luckState,
        ball: { x: interception.token.x, y: interception.token.y },
        stealProtectedSide: undefined,
        message: `${interception.token.player.name} intercepts ${keeper.player.name}'s clearance.`,
      };
    }
  }
  const clearance = rollLuck(luckState, keeper.side, opponentSide, accuracy);
  luckState = clearance.match;
  const resolvedAccuracy = Math.round(clearance.chance);
  let landing = target;
  if (!clearance.success) {
    const missDistance = 1 + Math.floor(Math.random() * Math.max(1, Math.ceil((100 - resolvedAccuracy) / 24)));
    const rowOffset = Math.floor(Math.random() * (missDistance * 2 + 1)) - missDistance;
    landing = {
      x: cap(target.x - attackDirection * missDistance, 1, 20),
      y: cap(target.y + rowOffset, 0, 10),
    };
  }
  const collector = luckState.tokens.find((token) => token.x === landing.x && token.y === landing.y);
  return {
    ...luckState,
    ball: landing,
    stealProtectedSide: undefined,
    message: collector && collector.side !== keeper.side
      ? `${collector.player.name} intercepts ${keeper.player.name}'s long clearance (${resolvedAccuracy}% accuracy).`
      : `${keeper.player.name} clears ${clearDistance} tiles upfield. The target was ${resolvedAccuracy}% accurate; the ball lands at ${landing.x}, ${landing.y}.`,
  };
};
const defenderPenalty = (tokens: Token[], attacker: Token) => {
  const marker = tokens.filter((token) => token.side !== attacker.side && token.player.position === "DEF")
    .sort((a, b) => distance(attacker, a) - distance(attacker, b))[0];
  if (!marker) return 0;
  const gap = distance(attacker, marker);
  return gap <= 2 ? cap(abilityEffect(marker.player, "defending") * 0.08 + (2 - gap) * 2, 0, 6) : 0;
};
const shotAngleDegrees = (player: Token, half: 1 | 2) => {
  const goalX = player.side === "home" ? (half === 1 ? 21 : 0) : (half === 1 ? 0 : 21);
  return Math.round(Math.atan2(Math.abs(player.y - 5), Math.max(1, Math.abs(goalX - player.x))) * 180 / Math.PI);
};
const shotAccuracy = (player: Token, tokens: Token[], tilesToGoal: number, angleDegrees: number) =>
  cap(
    86 - tilesToGoal * 8 + abilityEffect(player.player, "finishing") * 0.08
      + (player.player.position === "FWD" ? 5 : 0)
      - angleDegrees * 0.65
      - goalkeeperPenalty(tokens, player.side)
      - defenderPenalty(tokens, player),
    8,
    94,
  );
const interceptionChance = (defender: Token, type: "shot" | "pass", laneGap = 0) =>
  cap(14 + abilityEffect(defender.player, "defending") * 0.08
    + abilityEffect(defender.player, "goalkeeping") * 0.08
    + (defender.player.position === "DEF" ? 10 : 0)
    + (defender.player.position === "GK" ? 15 : 0)
    + (type === "shot" ? 5 : 0) - laneGap * 14, 8, 68);
const stealChanceFor = (defender: Token, carrier: Token, half: 1 | 2 = 1) => {
  const carrierAttackDirection = carrier.side === "home" ? (half === 1 ? 1 : -1) : (half === 1 ? -1 : 1);
  const relativePosition = (defender.x - carrier.x) * carrierAttackDirection;
  const isBehind = relativePosition < 0;
  const isInFront = relativePosition > 0;
  return cap(45 + abilityEffect(defender.player, "defending") * 0.08
    + (defender.player.position === "DEF" ? 6 : 0)
    + (isInFront ? 8 : 0)
    - (isBehind ? 14 : 0), 15, 70);
};
const lineCells = (from: { x: number; y: number }, to: { x: number; y: number }) => {
  const points: { x: number; y: number }[] = [];
  let x = from.x;
  let y = from.y;
  const dx = Math.abs(to.x - x);
  const dy = Math.abs(to.y - y);
  const sx = x < to.x ? 1 : -1;
  const sy = y < to.y ? 1 : -1;
  let error = dx - dy;
  while (x !== to.x || y !== to.y) {
    const doubledError = 2 * error;
    if (doubledError > -dy) {
      error -= dy;
      x += sx;
    }
    if (doubledError < dx) {
      error += dx;
      y += sy;
    }
    points.push({ x, y });
  }
  return points;
};
const findInterceptor = (
  tokens: Token[],
  attackingSide: "home" | "away",
  path: { x: number; y: number }[],
) => {
  return tokens.filter((token) => token.side !== attackingSide)
    .map((token) => {
      const nearest = path.map((point, index) => ({
        index,
        gap: Math.abs(token.x - point.x) + Math.abs(token.y - point.y),
      })).sort((a, b) => a.gap - b.gap || a.index - b.index)[0];
      return nearest ? { token, ...nearest } : undefined;
    })
    .filter((entry): entry is { token: Token; index: number; gap: number } => !!entry && entry.gap <= 1)
    .sort((a, b) => a.index - b.index || a.gap - b.gap)[0];
};
const adjacent = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) <= 1;
const findRouteToTargets = (
  tokens: Token[],
  mover: Token,
  targets: { x: number; y: number }[],
) => {
  const occupied = new Set(tokens
    .filter((token) => token.player.id !== mover.player.id)
    .map((token) => `${token.x},${token.y}`));
  const availableTargets = targets
    .filter((point) => point.x >= 0 && point.x <= 21 && point.y >= 0 && point.y <= 10
      && !occupied.has(`${point.x},${point.y}`));
  const targetKeys = new Set(availableTargets.map((point) => `${point.x},${point.y}`));
  if (!availableTargets.length) return [];

  const startKey = `${mover.x},${mover.y}`;
  const queue = [{ x: mover.x, y: mover.y }];
  const previous = new Map<string, string | null>([[startKey, null]]);
  let destination: string | undefined;
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const current = queue[cursor];
    const currentKey = `${current.x},${current.y}`;
    if (targetKeys.has(currentKey)) {
      destination = currentKey;
      break;
    }
    const neighbors = [
      { x: current.x + 1, y: current.y },
      { x: current.x - 1, y: current.y },
      { x: current.x, y: current.y + 1 },
      { x: current.x, y: current.y - 1 },
    ].filter((point) => point.x >= 0 && point.x <= 21 && point.y >= 0 && point.y <= 10
      && !occupied.has(`${point.x},${point.y}`)
      && !previous.has(`${point.x},${point.y}`));
    const distanceToTarget = (point: { x: number; y: number }) => Math.min(...availableTargets
      .map((target) => Math.abs(target.x - point.x) + Math.abs(target.y - point.y)));
    neighbors.sort((a, b) => distanceToTarget(a) - distanceToTarget(b));
    neighbors.forEach((point) => {
      const key = `${point.x},${point.y}`;
      previous.set(key, currentKey);
      queue.push(point);
    });
  }
  if (!destination) return [];

  const route: { x: number; y: number }[] = [];
  let cursor: string | null = destination;
  while (cursor && cursor !== startKey) {
    const [x, y] = cursor.split(",").map(Number);
    route.unshift({ x, y });
    cursor = previous.get(cursor) ?? null;
  }
  return route;
};
const findBestReachableMove = (
  tokens: Token[],
  mover: Token,
  maxSteps: number,
  score: (point: { x: number; y: number }) => number,
) => {
  const occupied = new Set(tokens
    .filter((token) => token.player.id !== mover.player.id)
    .map((token) => `${token.x},${token.y}`));
  const startKey = `${mover.x},${mover.y}`;
  const queue = [{ x: mover.x, y: mover.y, steps: 0 }];
  const visited = new Set([startKey]);
  let best: { x: number; y: number; score: number } | undefined;
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const current = queue[cursor];
    if (current.steps > 0) {
      const currentScore = score(current);
      if (!best || currentScore > best.score) best = { x: current.x, y: current.y, score: currentScore };
    }
    if (current.steps >= maxSteps) continue;
    for (const point of [
      { x: current.x + 1, y: current.y },
      { x: current.x - 1, y: current.y },
      { x: current.x, y: current.y + 1 },
      { x: current.x, y: current.y - 1 },
    ]) {
      const key = `${point.x},${point.y}`;
      if (point.x < 0 || point.x > 21 || point.y < 0 || point.y > 10
        || occupied.has(key) || visited.has(key)) continue;
      visited.add(key);
      queue.push({ ...point, steps: current.steps + 1 });
    }
  }
  return best;
};
const resetKickoff = (tokens: Token[], side: "home" | "away", half: 1 | 2, smallSided: boolean) => {
  const homeStarts: [number, number][] = smallSided
    ? [[2, 5], [8, 3], [8, 7]]
    : [[1, 5], [4, 1], [4, 4], [4, 6], [4, 9], [7, 2], [7, 5], [7, 8], [10, 2], [10, 5], [10, 8]];
  const awayStarts: [number, number][] = smallSided
    ? [[2, 5], [8, 3], [8, 7]]
    : [[20, 5], [17, 1], [17, 4], [17, 6], [17, 9], [14, 2], [14, 5], [14, 8], [11, 2], [11, 5], [11, 8]];
  const reset = (team: "home" | "away") => tokens.filter((token) => token.side === team).map((token, index) => {
    const [baseX, y] = smallSided
      ? (team === "home" ? homeStarts : awayStarts)[index] ?? [team === "home" ? 7 : 14, 5]
      : [
        token.player.tacticalX ?? (team === "home" ? homeStarts[index]?.[0] ?? 7 : 21 - (awayStarts[index]?.[0] ?? 14)),
        token.player.tacticalY ?? (team === "home" ? homeStarts[index]?.[1] ?? 5 : awayStarts[index]?.[1] ?? 5),
      ];
    const orientedX = team === "home" ? baseX : 21 - baseX;
    const x = half === 2 ? 21 - orientedX : orientedX;
    return { ...token, x, y };
  });
  let home = reset("home");
  let away = reset("away");
  const kickoffTeam = side === "home" ? home : away;
  const kicker = kickoffTeam.find((token) => token.player.position === "MID") ?? kickoffTeam[0];
  if (kicker) {
    const centerX = side === "home" ? 10 : 11;
    const kickoffX = half === 2 ? 21 - centerX : centerX;
    if (side === "home") home = home.map((token) => token.player.id === kicker.player.id ? { ...token, x: kickoffX, y: 5 } : token);
    else away = away.map((token) => token.player.id === kicker.player.id ? { ...token, x: kickoffX, y: 5 } : token);
  }
  const nextTokens = [...home, ...away];
  const kickoffCarrier = nextTokens.find((token) => token.player.id === kicker?.player.id);
  return {
    tokens: nextTokens,
    ball: kickoffCarrier ? { x: kickoffCarrier.x, y: kickoffCarrier.y } : { x: half === 2 ? 11 : 10, y: 5 },
  };
};
const pushTeamUpfield = (tokens: Token[], side: "home" | "away", half: 1 | 2 = 1) => {
  const updated = tokens.map((token) => ({ ...token }));
  const direction = side === "home" ? (half === 1 ? 1 : -1) : (half === 1 ? -1 : 1);
  const attackers = updated.filter((token) => token.side === side && token.player.position !== "GK")
    .sort((a, b) => (b.x - a.x) * direction);
  attackers.forEach((attacker) => {
    const nextX = cap(attacker.x + direction, 1, 20);
    if (nextX !== attacker.x
      && !updated.some((token) => token.player.id !== attacker.player.id && token.x === nextX && token.y === attacker.y)) {
      attacker.x = nextX;
    }
  });
  return updated;
};
const stealLanding = (tokens: Token[], defender: Token, carrier: Token, half: 1 | 2 = 1) => {
  const direction = defender.side === "home" ? (half === 1 ? 1 : -1) : (half === 1 ? -1 : 1);
  const preferred = [
    { x: carrier.x + direction, y: carrier.y },
    { x: carrier.x + direction, y: carrier.y - 1 },
    { x: carrier.x + direction, y: carrier.y + 1 },
    { x: carrier.x, y: carrier.y - 1 },
    { x: carrier.x, y: carrier.y + 1 },
  ];
  return preferred.find((point) =>
    point.x >= 1 && point.x <= 20 && point.y >= 0 && point.y <= 10
    && !tokens.some((token) => token.player.id !== defender.player.id
      && token.player.id !== carrier.player.id && token.x === point.x && token.y === point.y),
  ) ?? { x: defender.x, y: defender.y };
};
const closestPlayerId = (tokens: Token[], ball: { x: number; y: number }, side: "home" | "away") => {
  const team = tokens.filter((token) => token.side === side);
  const carrier = team.find((token) => token.x === ball.x && token.y === ball.y);
  return carrier?.player.id
    ?? team.sort((a, b) => distance(a, ball) - distance(b, ball))[0]?.player.id
    ?? null;
};
const ownGoalDistance = (player: Token, half: 1 | 2 = 1) => {
  const goalX = player.side === "home" ? (half === 1 ? 21 : 0) : (half === 1 ? 0 : 21);
  return Math.abs(goalX - player.x);
};
const realMatchActionProbabilities = (
  player: Token,
  tokens: Token[],
  match: Match,
  goalDistance: number,
) => {
  const ownScore = match.score[player.side === "home" ? 0 : 1];
  const opponentScore = match.score[player.side === "home" ? 1 : 0];
  const underPressure = tokens.some((token) =>
    token.side !== player.side && distance(token, player) <= 2,
  );
  const features = [
    1,
    cap(1 - goalDistance / 21, 0, 1),
    cap(1 - Math.abs(player.y - 5) / 5, 0, 1),
    underPressure ? 1 : 0,
    cap((ownScore - opponentScore) / 3, -1, 1),
    cap(match.minute / 90, 0, 1),
  ];
  const logits = realMatchPolicy.weights.map((row) =>
    row.reduce((sum, weight, index) => sum + weight * features[index], 0),
  );
  const maxLogit = Math.max(...logits);
  const exponentials = logits.map((value) => Math.exp(value - maxLogit));
  const total = exponentials.reduce((sum, value) => sum + value, 0);
  return {
    pass: exponentials[0] / total,
    carry: exponentials[1] / total,
    shot: exponentials[2] / total,
  };
};
type AiActionOption =
  | { kind: "shoot"; value: number }
  | { kind: "pass"; value: number; receiver: Token }
  | { kind: "carry"; value: number; move: { x: number; y: number } };

const nearestOpponentGap = (tokens: Token[], point: { x: number; y: number }, side: "home" | "away") => {
  const gaps = tokens.filter((token) => token.side !== side).map((token) => distance(token, point));
  return gaps.length ? Math.min(...gaps) : 99;
};

const attackingActionOptions = (
  owner: Token,
  tokens: Token[],
  match: Match,
  strategy: AiStrategy,
): AiActionOption[] => {
  const goalDistance = ownGoalDistance(owner, match.half);
  const learned = realMatchActionProbabilities(owner, tokens, match, goalDistance);
  const teammates = tokens.filter((token) => token.side === owner.side && token.player.id !== owner.player.id);
  const pressureGap = nearestOpponentGap(tokens, owner, owner.side);
  const ownScore = match.score[owner.side === "home" ? 0 : 1];
  const opponentScore = match.score[owner.side === "home" ? 1 : 0];
  const difference = ownScore - opponentScore;
  const late = cap((match.minute - 55) / 35, 0, 1);
  const urgency = difference < 0 ? late : difference > 0 ? -late * 0.45 : late * 0.25;
  const options: AiActionOption[] = [];

  if (goalDistance <= shotRange(owner.player)) {
    const chance = shotAccuracy(owner, tokens, goalDistance, shotAngleDegrees(owner, match.half));
    const goal = { x: match.half === 1 ? 0 : 21, y: 5 };
    const interceptor = findInterceptor(tokens, owner.side, lineCells(owner, goal));
    const blockRisk = interceptor ? interceptionChance(interceptor.token, "shot", interceptor.gap) : 0;
    const conversion = (chance / 100) * (1 - blockRisk / 100);
    const closeRange = goalDistance <= 2 ? 0.18 : goalDistance <= 4 ? 0.06 : 0;
    options.push({
      kind: "shoot",
      value: conversion * (1.05 + strategy.finishing * 0.65 + urgency * 0.25)
        + closeRange - (1 - conversion) * 0.07 + learned.shot * 0.10,
    });
  }

  for (const receiver of teammates) {
    const gap = distance(owner, receiver);
    if (gap === 0 || gap > passingRange(owner.player)) continue;
    const interceptor = findInterceptor(tokens, owner.side, lineCells(owner, receiver).slice(0, -1));
    const blockRisk = interceptor ? interceptionChance(interceptor.token, "pass", interceptor.gap) : 0;
    const success = 1 - blockRisk / 100;
    const progress = goalDistance - ownGoalDistance(receiver, match.half);
    const receiverGap = nearestOpponentGap(tokens, receiver, receiver.side);
    const receiverGoalDistance = ownGoalDistance(receiver, match.half);
    const receiverShot = receiverGoalDistance <= shotRange(receiver.player)
      ? shotAccuracy(receiver, tokens, receiverGoalDistance, shotAngleDegrees(receiver, match.half)) / 100
      : 0;
    const support = teammates.filter((mate) => mate.player.id !== receiver.player.id
      && distance(mate, receiver) <= passingRange(receiver.player)).length;
    const safeOutlet = pressureGap <= 2 && progress <= 1 ? 0.10 : 0;
    const value = success * (0.055 + progress * 0.012 + receiverShot * 0.52
      + Math.min(receiverGap, 5) * 0.017 + support * 0.006 + safeOutlet)
      - (1 - success) * (0.16 + (1 - Math.min(receiverGap, 6) / 6) * 0.10);
    options.push({
      kind: "pass",
      receiver,
      value: value * (0.55 + strategy.passing * 0.70 + strategy.progression * 0.18)
        + learned.pass * 0.08 + urgency * Math.max(0, progress) * 0.004,
    });
  }

  const moveDistance = 2 + movementBonus(owner.player);
  const carryMove = findBestReachableMove(tokens, owner, moveDistance, (point) => {
    const advance = goalDistance - ownGoalDistance({ ...owner, x: point.x, y: point.y }, match.half);
    const space = nearestOpponentGap(tokens, point, owner.side);
    const laneGap = Math.min(99, ...lineCells(point, { x: match.half === 1 ? 0 : 21, y: 5 })
      .map((lanePoint) => nearestOpponentGap(tokens, lanePoint, owner.side)));
    return advance * 0.85 + Math.min(space, 6) * 0.30 + Math.min(laneGap, 6) * 0.10
      - Math.abs(point.y - 5) * 0.11;
  });
  if (carryMove) {
    const projected = { ...owner, x: carryMove.x, y: carryMove.y };
    const advance = goalDistance - ownGoalDistance(projected, match.half);
    const space = nearestOpponentGap(tokens, carryMove, owner.side);
    const retention = cap(0.48 + strategy.progression * 0.42
      - (space <= 1 ? 0.24 : space <= 2 ? 0.10 : 0), 0.18, 0.95);
    const shotEntry = ownGoalDistance(projected, match.half) <= shotRange(owner.player);
    const value = retention * (0.045 + advance * 0.016 + Math.min(space, 5) * 0.018 + (shotEntry ? 0.11 : 0))
      - (1 - retention) * 0.17;
    options.push({
      kind: "carry",
      move: carryMove,
      value: value * (0.62 + strategy.progression * 0.65) + learned.carry * 0.06
        + urgency * Math.max(0, advance) * 0.004,
    });
  }

  return options;
};

const pickAttackingAction = (options: AiActionOption[], difficulty: number) => {
  if (!options.length) return undefined;
  const temperature = 0.03 + (1 - cap(difficulty, 1, 100) / 100) * 0.30;
  return [...options].map((option) => ({
    option,
    score: option.value + (Math.random() - 0.5) * temperature,
  })).sort((a, b) => b.score - a.score)[0].option;
};

type DefensiveMove = { defender: Token; move: { x: number; y: number; score: number }; score: number };

const defensiveMoveOptions = (
  tokens: Token[],
  carrier: Token,
  strategy: AiStrategy,
  half: 1 | 2,
): DefensiveMove[] => {
  const goalX = carrier.side === "home" ? (half === 1 ? 0 : 21) : (half === 1 ? 21 : 0);
  const lane = lineCells(carrier, { x: goalX, y: 5 });
  const threats = tokens.filter((token) => token.side === carrier.side && token.player.id !== carrier.player.id);
  return tokens.filter((token) => token.side !== carrier.side && token.player.position !== "GK")
    .map((defender) => {
      const pressureDistance = distance(defender, carrier) <= 3 || strategy.pressing > 0.65 ? 1 : 2;
      const moveDistance = 2 + movementBonus(defender.player);
      const move = findBestReachableMove(tokens, defender, moveDistance, (point) => {
        const carrierGap = Math.max(Math.abs(point.x - carrier.x), Math.abs(point.y - carrier.y));
        const laneGap = lane.length ? Math.min(...lane.map((lanePoint) => distance(point, lanePoint))) : 99;
        const goalSide = (point.x - carrier.x) * (goalX - carrier.x) >= 0 ? 1 : 0;
        const receiverGap = threats.length
          ? Math.min(...threats.map((threat) => distance(point, threat)))
          : 99;
        const role = defender.player.position === "DEF" ? 1 : defender.player.position === "MID" ? 0.55 : 0.2;
        return -Math.abs(carrierGap - pressureDistance) * 4.2
          - laneGap * (0.55 + strategy.marking * 0.9)
          + goalSide * strategy.marking * 3.4
          + Math.min(receiverGap, 6) * (0.10 + strategy.pressing * 0.10)
          + role * strategy.marking * 1.4;
      });
      return move ? { defender, move, score: move.score } : undefined;
    })
    .filter((option): option is DefensiveMove => !!option)
    .sort((a, b) => b.score - a.score);
};

// ---------------------------------------------------------------------------
// Minimax lookahead
// ---------------------------------------------------------------------------
// Inspired by the minimax + alpha-beta section of commonLuke's chess-engine
// video. The AI no longer just ranks its current options; it simulates the
// move, lets the opponent answer, and scores the resulting board with a static
// evaluation function. Alpha-beta pruning and move ordering keep the search
// small enough to run inside a turn.
type TacticalState = {
  tokens: Token[];
  ball: { x: number; y: number };
  score: [number, number];
  turn: "home" | "away";
  half: 1 | 2;
  smallSided: boolean;
};

type TacticalAction =
  | { kind: "move"; tokenId: string; x: number; y: number }
  | { kind: "pass"; fromId: string; toId: string }
  | { kind: "shoot"; tokenId: string }
  | { kind: "steal"; tokenId: string }
  | { kind: "clear"; tokenId: string };

const otherSide = (side: "home" | "away"): "home" | "away" => side === "home" ? "away" : "home";

const tokenAtBall = (state: TacticalState) =>
  state.tokens.find((token) => token.x === state.ball.x && token.y === state.ball.y);

const tacticalGoalX = (side: "home" | "away", half: 1 | 2) =>
  side === "home" ? (half === 1 ? 21 : 0) : (half === 1 ? 0 : 21);

const tacticalGoalDistance = (point: { x: number; y: number }, side: "home" | "away", half: 1 | 2) =>
  Math.abs(tacticalGoalX(side, half) - point.x) + Math.abs(point.y - 5) * 0.35;

// Static board score, positive when the move is good for the away side.
// It mirrors the hand-written evaluation in the video: material first, then
// positional bonuses for central control, support, and shooting lanes.
const tacticalEvaluation = (state: TacticalState) => {
  const owner = tokenAtBall(state);
  const awayGoalDistance = tacticalGoalDistance(state.ball, "away", state.half);
  const homeGoalDistance = tacticalGoalDistance(state.ball, "home", state.half);
  let value = (state.score[1] - state.score[0]) * 1000;
  value += (22 - awayGoalDistance) * 2.6;
  value -= (22 - homeGoalDistance) * 2.6;

  if (owner?.side === "away") value += 45;
  else if (owner?.side === "home") value -= 45;

  const awayTokens = state.tokens.filter((token) => token.side === "away");
  const homeTokens = state.tokens.filter((token) => token.side === "home");
  const nearestAway = awayTokens.length
    ? Math.min(...awayTokens.map((token) => distance(token, state.ball))) : 99;
  const nearestHome = homeTokens.length
    ? Math.min(...homeTokens.map((token) => distance(token, state.ball))) : 99;
  value += (nearestHome - nearestAway) * (owner ? 1.7 : 3.4);

  if (owner) {
    const goalDistance = ownGoalDistance(owner, state.half);
    if (goalDistance <= shotRange(owner.player)) {
      const accuracy = shotAccuracy(owner, state.tokens, goalDistance, shotAngleDegrees(owner, state.half));
      value += (owner.side === "away" ? 1 : -1) * (accuracy - 35) * 1.1;
    }
    const support = state.tokens.filter((token) => token.side === owner.side
      && token.player.id !== owner.player.id && distance(token, owner) <= 4).length;
    value += (owner.side === "away" ? 1 : -1) * support * 3.5;
  }

  for (const side of ["home", "away"] as const) {
    const keeper = state.tokens.find((token) => token.side === side && token.player.position === "GK");
    if (!keeper) continue;
    const ownGoalX = side === "home" ? (state.half === 1 ? 0 : 21) : (state.half === 1 ? 21 : 0);
    value += (side === "away" ? 1 : -1) * (6 - Math.min(Math.abs(keeper.x - ownGoalX), 6)) * 1.2;
  }
  return value;
};

const tacticalReachablePoints = (state: TacticalState, mover: Token, maxSteps: number) => {
  const occupied = new Set(state.tokens
    .filter((token) => token.player.id !== mover.player.id)
    .map((token) => `${token.x},${token.y}`));
  const queue = [{ x: mover.x, y: mover.y, steps: 0 }];
  const visited = new Set([`${mover.x},${mover.y}`]);
  const points: { x: number; y: number; steps: number }[] = [];
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const current = queue[cursor];
    if (current.steps > 0) points.push(current);
    if (current.steps >= maxSteps) continue;
    for (const point of [
      { x: current.x + 1, y: current.y },
      { x: current.x - 1, y: current.y },
      { x: current.x, y: current.y + 1 },
      { x: current.x, y: current.y - 1 },
    ]) {
      const key = `${point.x},${point.y}`;
      if (point.x < 0 || point.x > 21 || point.y < 0 || point.y > 10
        || occupied.has(key) || visited.has(key)) continue;
      visited.add(key);
      queue.push({ ...point, steps: current.steps + 1 });
    }
  }
  return points;
};

const tacticalActionsFor = (state: TacticalState, side: "home" | "away"): TacticalAction[] => {
  const owner = tokenAtBall(state);
  const actions: TacticalAction[] = [];
  if (owner?.side === side) {
    const goalDistance = ownGoalDistance(owner, state.half);
    if (goalDistance <= shotRange(owner.player)) {
      actions.push({ kind: "shoot", tokenId: owner.player.id });
    }
    if (owner.player.position === "GK" && isInOwnPenaltyBox(owner, state.half)) {
      actions.push({ kind: "clear", tokenId: owner.player.id });
    }
    const receivers = state.tokens
      .filter((token) => token.side === side && token.player.id !== owner.player.id
        && distance(owner, token) <= passingRange(owner.player))
      .map((token) => ({
        token,
        score: (goalDistance - ownGoalDistance(token, state.half)) * 1.2
          + Math.min(nearestOpponentGap(state.tokens, token, side), 5) * 0.5,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
    for (const { token } of receivers) {
      actions.push({ kind: "pass", fromId: owner.player.id, toId: token.player.id });
    }
    const carries = tacticalReachablePoints(state, owner, 2 + movementBonus(owner.player))
      .map((point) => ({
        point,
        score: (goalDistance - tacticalGoalDistance(point, side, state.half)) * 1.4
          + Math.min(nearestOpponentGap(state.tokens, point, side), 5) * 0.45
          - Math.abs(point.y - 5) * 0.2,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    for (const { point } of carries) {
      actions.push({ kind: "move", tokenId: owner.player.id, x: point.x, y: point.y });
    }
    return actions;
  }

  if (owner) {
    const defenders = state.tokens.filter((token) => token.side === side && token.player.position !== "GK");
    for (const defender of defenders) {
      if (adjacent(defender, owner)) actions.push({ kind: "steal", tokenId: defender.player.id });
    }
    const lane = lineCells(owner, { x: tacticalGoalX(owner.side, state.half), y: 5 });
    const closest = defenders
      .map((defender) => ({ defender, gap: distance(defender, owner) }))
      .sort((a, b) => a.gap - b.gap)
      .slice(0, 4);
    for (const { defender } of closest) {
      const moves = tacticalReachablePoints(state, defender, 2 + movementBonus(defender.player))
        .map((point) => ({
          point,
          score: -distance(point, owner) * 1.5
            - (lane.length ? Math.min(...lane.map((lanePoint) => distance(point, lanePoint))) : 0) * 0.8,
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 2);
      for (const { point } of moves) {
        actions.push({ kind: "move", tokenId: defender.player.id, x: point.x, y: point.y });
      }
    }
    return actions;
  }

  const chasers = state.tokens
    .filter((token) => token.side === side && token.player.position !== "GK")
    .map((token) => ({ token, gap: distance(token, state.ball) }))
    .sort((a, b) => a.gap - b.gap)
    .slice(0, 3);
  for (const { token } of chasers) {
    const moves = tacticalReachablePoints(state, token, 2 + movementBonus(token.player))
      .map((point) => ({ point, score: -distance(point, state.ball) * 2 }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 2);
    for (const { point } of moves) {
      actions.push({ kind: "move", tokenId: token.player.id, x: point.x, y: point.y });
    }
  }
  return actions;
};

const applyTacticalAction = (
  state: TacticalState,
  action: TacticalAction,
  outcome: "success" | "failure" | "wide" = "success",
): TacticalState => {
  const side = state.turn;
  const tokens = state.tokens.map((token) => ({ ...token }));
  let ball = { ...state.ball };
  const score: [number, number] = [state.score[0], state.score[1]];
  const owner = tokenAtBall(state);

  if (action.kind === "move") {
    const mover = tokens.find((token) => token.player.id === action.tokenId);
    if (!mover) return state;
    const hadBall = ball.x === mover.x && ball.y === mover.y;
    const fromX = mover.x;
    mover.x = action.x;
    mover.y = action.y;
    if (hadBall) {
      const shifted = shiftFormationWithBall(tokens, fromX, action.x, mover.player.id, state.half);
      const shiftedMover = shifted.find((token) => token.player.id === mover.player.id) ?? mover;
      ball = { x: shiftedMover.x, y: shiftedMover.y };
      return { ...state, tokens: shifted, ball, score, turn: otherSide(side) };
    }
    return { ...state, tokens, ball, score, turn: otherSide(side) };
  }

  if (action.kind === "pass") {
    const from = tokens.find((token) => token.player.id === action.fromId);
    const receiver = tokens.find((token) => token.player.id === action.toId);
    if (!from || !receiver) return state;
    const interceptor = findInterceptor(state.tokens, side, lineCells(from, receiver).slice(0, -1));
    const shifted = shiftFormationWithBall(tokens, from.x, receiver.x, receiver.player.id, state.half);
    const landed = outcome === "failure" && interceptor ? interceptor.token : receiver;
    const shiftedReceiver = shifted.find((token) => token.player.id === landed.player.id) ?? receiver;
    ball = { x: shiftedReceiver.x, y: shiftedReceiver.y };
    return { ...state, tokens: shifted, ball, score, turn: otherSide(side) };
  }

  if (action.kind === "shoot") {
    const shooter = tokens.find((token) => token.player.id === action.tokenId);
    if (!shooter) return state;
    const goal = { x: tacticalGoalX(side, state.half), y: 5 };
    if (outcome === "success") {
      score[side === "home" ? 0 : 1] += 1;
      const kickoff = resetKickoff(tokens, otherSide(side), state.half, state.smallSided);
      return { ...state, tokens: kickoff.tokens, ball: kickoff.ball, score, turn: otherSide(side) };
    }
    const interceptor = findInterceptor(state.tokens, side, lineCells(shooter, goal));
    if (interceptor && outcome === "failure") {
      const blocker = tokens.find((token) => token.player.id === interceptor.token.player.id) ?? interceptor.token;
      ball = { x: blocker.x, y: blocker.y };
    } else {
      ball = goal;
    }
    return { ...state, tokens, ball, score, turn: otherSide(side) };
  }

  if (action.kind === "steal") {
    const defender = tokens.find((token) => token.player.id === action.tokenId);
    if (!defender || !owner || outcome === "failure") {
      return { ...state, tokens, ball, score, turn: otherSide(side) };
    }
    const landing = stealLanding(tokens, defender, owner, state.half);
    defender.x = landing.x;
    defender.y = landing.y;
    const shifted = shiftFormationWithBall(tokens, ball.x, landing.x, defender.player.id, state.half);
    const pushed = pushTeamUpfield(shifted, defender.side, state.half);
    const shiftedDefender = pushed.find((token) => token.player.id === defender.player.id) ?? defender;
    ball = { x: shiftedDefender.x, y: shiftedDefender.y };
    return { ...state, tokens: pushed, ball, score, turn: otherSide(side) };
  }

  const keeper = tokens.find((token) => token.player.id === action.tokenId);
  if (!keeper) return state;
  const target = goalkeeperClearTarget(keeper, tokens, state.half);
  const accuracy = goalkeeperClearAccuracy(keeper.player, distance(keeper, target));
  const clearance = outcome === "success" || accuracy >= 50
    ? target
    : { x: cap(target.x + (keeper.side === "away" ? 1 : -1) * 2, 1, 20), y: cap(target.y + 1, 0, 10) };
  ball = clearance;
  return { ...state, tokens, ball, score, turn: otherSide(side) };
};

const minimaxValue = (
  state: TacticalState,
  depth: number,
  alpha: number,
  beta: number,
  budget: { nodes: number; deadline: number },
): number => {
  budget.nodes -= 1;
  if (depth <= 0 || budget.nodes <= 0 || performance.now() >= budget.deadline) {
    return tacticalEvaluation(state);
  }
  const actions = tacticalActionsFor(state, state.turn);
  if (!actions.length) return tacticalEvaluation(state);

  // Move ordering: try the positionally strongest child first. Good ordering
  // is what makes alpha-beta prune most of the tree, just like the video.
  const ordered = actions
    .map((action) => ({ action, child: applyTacticalAction(state, action) }))
    .map((entry) => ({ ...entry, score: tacticalEvaluation(entry.child) }))
    .sort((a, b) => state.turn === "away" ? b.score - a.score : a.score - b.score);

  if (state.turn === "away") {
    let best = -Infinity;
    for (const { child } of ordered) {
      best = Math.max(best, minimaxValue(child, depth - 1, alpha, beta, budget));
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  }
  let best = Infinity;
  for (const { child } of ordered) {
    best = Math.min(best, minimaxValue(child, depth - 1, alpha, beta, budget));
    beta = Math.min(beta, best);
    if (beta <= alpha) break;
  }
  return best;
};

const minimaxDepthForDifficulty = (difficulty: number) => {
  const level = cap(difficulty, 1, 100);
  return level >= 90 ? 4 : level >= 60 ? 3 : level >= 25 ? 2 : 1;
};

// Pick the attacking option whose expected result is strongest after the
// opponent's best minimax reply. Probability still matters: shots and passes
// are valued with their block/interception risk, not as certain successes.
const chooseAttackingActionWithMinimax = (
  match: Match,
  owner: Token,
  options: AiActionOption[],
  difficulty: number,
) => {
  if (!options.length) return undefined;
  const level = cap(difficulty, 1, 100);
  const depth = minimaxDepthForDifficulty(level);
  if (depth <= 1 || options.length === 1) return pickAttackingAction(options, level);

  const root: TacticalState = {
    tokens: match.tokens.map((token) => ({ ...token })),
    ball: { ...match.ball },
    score: [match.score[0], match.score[1]],
    turn: "away",
    half: match.half,
    smallSided: match.format === "small-sided",
  };
  const budget = {
    nodes: depth >= 4 ? 2200 : depth === 3 ? 1400 : 800,
    deadline: performance.now() + 110,
  };
  const valueOf = (child: TacticalState) => minimaxValue(child, depth - 1, -Infinity, Infinity, budget);
  const goal = { x: tacticalGoalX(owner.side, match.half), y: 5 };
  const goalDistance = ownGoalDistance(owner, match.half);
  const shotChance = shotAccuracy(owner, match.tokens, goalDistance, shotAngleDegrees(owner, match.half)) / 100;
  const shotInterceptor = findInterceptor(match.tokens, owner.side, lineCells(owner, goal));
  const blockRisk = shotInterceptor
    ? interceptionChance(shotInterceptor.token, "shot", shotInterceptor.gap) / 100 : 0;

  const scored = options.map((option) => {
    let value: number;
    if (option.kind === "shoot") {
      const shot = applyTacticalAction(root, { kind: "shoot", tokenId: owner.player.id }, "success");
      const blocked = applyTacticalAction(root, { kind: "shoot", tokenId: owner.player.id }, "failure");
      const wide = applyTacticalAction(root, { kind: "shoot", tokenId: owner.player.id }, "wide");
      const onTarget = shotChance * valueOf(shot) + (1 - shotChance) * valueOf(wide);
      value = blockRisk * valueOf(blocked) + (1 - blockRisk) * onTarget;
    } else if (option.kind === "pass") {
      const success = applyTacticalAction(root,
        { kind: "pass", fromId: owner.player.id, toId: option.receiver.player.id }, "success");
      const interceptor = findInterceptor(match.tokens, owner.side, lineCells(owner, option.receiver).slice(0, -1));
      if (interceptor) {
        const risk = interceptionChance(interceptor.token, "pass", interceptor.gap) / 100;
        const failure = applyTacticalAction(root,
          { kind: "pass", fromId: owner.player.id, toId: option.receiver.player.id }, "failure");
        value = risk * valueOf(failure) + (1 - risk) * valueOf(success);
      } else {
        value = valueOf(success);
      }
    } else {
      const carry = applyTacticalAction(root,
        { kind: "move", tokenId: owner.player.id, x: option.move.x, y: option.move.y }, "success");
      value = valueOf(carry);
    }
    // Keep a small slice of the evolved strategy's prior so the difficulty
    // ladder still shapes personality and low levels stay a little noisier.
    return { option, value: value + option.value * 40 };
  });

  return scored.sort((a, b) => b.value - a.value)[0].option;
};

type DefensiveChoice =
  | { kind: "steal"; presser: Token }
  | { kind: "move"; defender: Token; move: { x: number; y: number; score: number } };

// The same minimax pass chooses between pressing the carrier and dropping a
// defender into the shooting lane, so off-ball defending also looks one reply
// ahead instead of only following its heuristic order.
const chooseDefensiveActionWithMinimax = (
  match: Match,
  carrier: Token,
  defensiveOptions: DefensiveMove[],
  adjacentDefenders: Token[],
  strategy: AiStrategy,
  difficulty: number,
): DefensiveChoice | undefined => {
  const depth = minimaxDepthForDifficulty(difficulty);
  if (depth <= 1) {
    if (adjacentDefenders[0]) return { kind: "steal", presser: adjacentDefenders[0] };
    const fallback = defensiveOptions[0];
    return fallback ? { kind: "move", defender: fallback.defender, move: fallback.move } : undefined;
  }

  const root: TacticalState = {
    tokens: match.tokens.map((token) => ({ ...token })),
    ball: { ...match.ball },
    score: [match.score[0], match.score[1]],
    turn: "away",
    half: match.half,
    smallSided: match.format === "small-sided",
  };
  const budget = {
    nodes: depth >= 4 ? 1200 : depth === 3 ? 800 : 500,
    deadline: performance.now() + 85,
  };
  const valueOf = (child: TacticalState) => minimaxValue(child, depth - 1, -Infinity, Infinity, budget);
  const choices: { choice: DefensiveChoice; value: number }[] = [];

  for (const presser of adjacentDefenders.slice(0, 2)) {
    const help = adjacentDefenders.filter((token) => token.player.id !== presser.player.id).length;
    const chance = cap(stealChanceFor(presser, carrier, match.half)
      + help * 3.5 + strategy.pressing * 3, 15, 78) / 100;
    const success = applyTacticalAction(root, { kind: "steal", tokenId: presser.player.id }, "success");
    const failure = applyTacticalAction(root, { kind: "steal", tokenId: presser.player.id }, "failure");
    choices.push({
      choice: { kind: "steal", presser },
      value: chance * valueOf(success) + (1 - chance) * valueOf(failure),
    });
  }
  for (const option of defensiveOptions.slice(0, 3)) {
    const child = applyTacticalAction(root,
      { kind: "move", tokenId: option.defender.player.id, x: option.move.x, y: option.move.y }, "success");
    choices.push({
      choice: { kind: "move", defender: option.defender, move: option.move },
      value: valueOf(child),
    });
  }
  return choices.sort((a, b) => b.value - a.value)[0]?.choice;
};

const campaignStageCount = 105;
const campaignStageNames = [
  "Season Opener", "Rivalry Match", "Road Test", "Cup Qualifier", "Playoff Push",
  "Tactical Trial", "Derby Day", "Quarterfinal", "Semifinal", "Conference Final",
  "All-Star Challenge", "Championship Match", "Continental Clash", "Elite Showdown", "Final",
  "New Season Kickoff", "Home Stand", "Away Day", "The Pressing Test", "Midfield Battle",
  "Counterattack Cup", "Clean Sheet Challenge", "Crossing Course", "The Long Road", "Capital Derby",
  "Coastal Clash", "Mountain Match", "Rivalry Rematch", "Cup Round of 16", "Cup Quarterfinal",
  "Cup Semifinal", "Cup Final", "Playoff Round One", "Playoff Quarterfinal", "Playoff Semifinal",
  "Conference Championship", "League Showcase", "All-Star Rematch", "Continental Round of 16",
  "Continental Quarterfinal", "Continental Semifinal", "Continental Final", "Road to the Shield",
  "Supporters' Shield Match", "The Tactical Gauntlet", "High-Pressure Test", "Extra-Time Trial",
  "Golden Goal Challenge", "Rivalry Decider", "Promotion Push", "Top-Four Showdown",
  "Final Four", "National Cup Final", "Champions' Night", "Blitz League Final",
];
campaignStageNames.push(...Array.from({ length: 50 }, (_, index) =>
  `${["Continental", "Rivalry", "Championship", "Road to Glory", "Tactical"][index % 5]} ${["Cup", "Showdown", "Final", "Challenge", "Decider"][Math.floor(index / 5) % 5]} · Stage ${index + 56}`,
));
type AiStrategy = { finishing: number; progression: number; passing: number; pressing: number; marking: number; countering: number; fitness: number };
type HumanPlayStyle = { shots: number; passes: number; carries: number; nutmegs: number };
const emptyHumanPlayStyle = (): HumanPlayStyle => ({ shots: 0, passes: 0, carries: 0, nutmegs: 0 });
type EvolvedAiArtifact = {
  version: number;
  method: string;
  generations: number;
  population: number;
  matchesSimulated: number;
  trainingOpponents: number;
  validationOpponents: number;
  training: { bestFitness: number; bestWinRate: number; bestGoalDifference: number };
  validation: { sampleSize: number; winRate: number; drawRate: number; goalDifference: number; fitness: number };
  champion: AiStrategy;
  ladder: AiStrategy[];
};
const evolvedAi = evolvedAiFile as EvolvedAiArtifact;
// Fallback ladder keeps the game playable if the evolved artifact is replaced
// with an older or partial file. `npm run train:ai` regenerates the real one.
const aiStrategyBenchmarks = [
  { shot: 0.9, progress: 0.3, pass: 0.4, press: 0.7, mark: 0.6, counter: 0.7 },
  { shot: 0.6, progress: 0.8, pass: 0.8, press: 0.6, mark: 0.8, counter: 0.5 },
  { shot: 0.4, progress: 0.9, pass: 0.5, press: 0.9, mark: 0.6, counter: 0.9 },
  { shot: 0.7, progress: 0.5, pass: 0.9, press: 0.5, mark: 0.9, counter: 0.6 },
  { shot: 0.5, progress: 0.7, pass: 0.6, press: 0.8, mark: 0.9, counter: 0.8 },
  { shot: 0.8, progress: 0.6, pass: 0.7, press: 0.7, mark: 0.7, counter: 0.7 },
  { shot: 0.3, progress: 0.9, pass: 0.8, press: 0.8, mark: 0.8, counter: 0.8 },
  { shot: 0.9, progress: 0.7, pass: 0.4, press: 0.6, mark: 0.7, counter: 0.8 },
];
const buildFallbackAiLadder = (): AiStrategy[] => {
  const genomes = aiStrategyBenchmarks.map((benchmark, index) => ({
    finishing: benchmark.shot,
    progression: benchmark.progress,
    passing: benchmark.pass,
    pressing: benchmark.press,
    marking: benchmark.mark,
    countering: benchmark.counter,
    fitness: index / Math.max(1, aiStrategyBenchmarks.length - 1),
  }));
  return Array.from({ length: 100 }, (_, index) => {
    const position = (index / 99) * (genomes.length - 1);
    const lower = Math.floor(position);
    const upper = Math.min(genomes.length - 1, Math.ceil(position));
    const weight = position - lower;
    const a = genomes[lower];
    const b = genomes[upper];
    const blendGene = (gene: keyof AiStrategy) => a[gene] * (1 - weight) + b[gene] * weight;
    return {
      finishing: blendGene("finishing"),
      progression: blendGene("progression"),
      passing: blendGene("passing"),
      pressing: blendGene("pressing"),
      marking: blendGene("marking"),
      countering: blendGene("countering"),
      fitness: index / 99,
    };
  });
};
const finiteGene = (value: number) => cap(Number.isFinite(value) ? value : 0.5, 0.05, 0.98);
const clampStrategy = (strategy: AiStrategy): AiStrategy => ({
  finishing: finiteGene(strategy.finishing),
  progression: finiteGene(strategy.progression),
  passing: finiteGene(strategy.passing),
  pressing: finiteGene(strategy.pressing),
  marking: finiteGene(strategy.marking),
  countering: finiteGene(strategy.countering),
  fitness: cap(Number.isFinite(strategy.fitness) ? strategy.fitness : 0, 0, 1),
});

// Difficulty is a strict ladder: level 1 is the weakest evolved genome and
// level 100 is the validated champion. The artifact stores training order, so
// sort again here and pin the champion to the top; this keeps scaling correct
// even if an older artifact is loaded or two genomes have equal fitness.
const buildEvolvedAiLadder = (): AiStrategy[] => {
  if (evolvedAi.ladder.length < 100) return buildFallbackAiLadder();
  const ranked = evolvedAi.ladder.map(clampStrategy).sort((a, b) => a.fitness - b.fitness);
  ranked[ranked.length - 1] = clampStrategy(evolvedAi.champion);
  return ranked.map((strategy, index) => ({
    ...strategy,
    fitness: index / Math.max(1, ranked.length - 1),
  }));
};
const aiStrategyLadder: AiStrategy[] = buildEvolvedAiLadder();
const aiStrategyForLevel = (level: number) => {
  const progress = (cap(level, 1, 100) - 1) / 99;
  if (progress <= 0) return aiStrategyLadder[0];
  if (progress >= 1) return aiStrategyLadder[aiStrategyLadder.length - 1];
  return aiStrategyLadder[Math.round(progress * (aiStrategyLadder.length - 1))];
};

// "Learn" step: the evolved genome is the CPU's starting game plan. During a
// match it is nudged toward the opponent's persisted habits and the live
// scoreline, so the same difficulty behaves differently against a passer, a
// dribbler, or a shooter.
const adaptAiStrategy = (
  base: AiStrategy,
  playStyle: HumanPlayStyle,
  difficulty: number,
  match?: Pick<Match, "score" | "minute" | "half">,
): AiStrategy => {
  const actions = playStyle.shots + playStyle.passes + playStyle.carries + playStyle.nutmegs;
  const confidence = cap(actions / 30, 0, 1) * cap(difficulty / 40, 0.15, 1);
  const total = Math.max(1, actions);
  const passRate = playStyle.passes / total;
  const shotRate = playStyle.shots / total;
  const carryRate = (playStyle.carries + playStyle.nutmegs) / total;
  const strategy: AiStrategy = { ...base };

  strategy.pressing += confidence * (passRate * 0.10 + carryRate * 0.08);
  strategy.marking += confidence * (shotRate * 0.12 + passRate * 0.05);
  strategy.countering += confidence * (carryRate * 0.10 + (playStyle.nutmegs / total) * 0.05);
  strategy.passing += confidence * (passRate * 0.05 - carryRate * 0.03);
  strategy.progression += confidence * (carryRate * 0.05 - passRate * 0.02);

  if (match) {
    const difference = match.score[1] - match.score[0];
    const late = cap((match.minute - 55) / 35, 0, 1);
    if (difference < 0) {
      strategy.finishing += late * 0.10;
      strategy.progression += late * 0.08;
      strategy.pressing += late * 0.05;
      strategy.passing -= late * 0.04;
    } else if (difference > 0) {
      strategy.passing += late * 0.07;
      strategy.marking += late * 0.06;
      strategy.countering += late * 0.05;
      strategy.finishing -= late * 0.04;
    } else if (late > 0) {
      strategy.finishing += late * 0.04;
      strategy.countering += late * 0.03;
    }
  }

  return clampStrategy(strategy);
};

const shiftFormationWithBall = (tokens: Token[], fromX: number, toX: number, carrierId: string, half: 1 | 2 = 1) => {
  const direction = Math.sign(toX - fromX);
  if (!direction) return tokens;

  const updated = tokens.map((token) => ({
    ...token,
    x: token.player.id === carrierId || token.player.position === "GK"
      ? token.x
      : cap(token.x + direction, 1, 20),
  }));
  const movedIds = new Set(updated.filter((token) => token.player.id !== carrierId).map((token) => token.player.id));
  let changed = true;
  while (changed) {
    changed = false;
    const positions = new Map<string, Token[]>();
    updated.forEach((token) => {
      const key = `${token.x},${token.y}`;
      positions.set(key, [...(positions.get(key) ?? []), token]);
    });
    positions.forEach((group) => {
      if (group.length < 2) return;
      const movable = group.find((token) => movedIds.has(token.player.id));
      if (!movable) return;
      const original = tokens.find((token) => token.player.id === movable.player.id);
      if (original) {
        movable.x = original.x;
        movedIds.delete(movable.player.id);
        changed = true;
      }
    });
  }
  const carrier = updated.find((token) => token.player.id === carrierId);
  if (!carrier || carrier.player.position !== "FWD") return updated;
  const attackDirection = carrier.side === "home" ? (half === 1 ? 1 : -1) : (half === 1 ? -1 : 1);
  const occupied = new Set(updated
    .filter((token) => token.player.id !== carrierId)
    .map((token) => `${token.x},${token.y}`));
  updated.filter((token) => token.side === carrier.side
    && token.player.id !== carrierId
    && token.player.position === "FWD"
    && (token.x - carrier.x) * attackDirection > -4)
    .forEach((forward) => {
      const targetX = cap(carrier.x + attackDirection * 4, 0, 21);
      occupied.delete(`${forward.x},${forward.y}`);
      const candidateRows = Array.from({ length: 11 }, (_, y) => y)
        .sort((a, b) => Math.abs(a - forward.y) - Math.abs(b - forward.y));
      const targetY = candidateRows.find((y) => !occupied.has(`${targetX},${y}`));
      if (targetY === undefined) {
        occupied.add(`${forward.x},${forward.y}`);
        return;
      }
      forward.x = targetX;
      forward.y = targetY;
      occupied.add(`${targetX},${targetY}`);
    });
  return updated;
};

function makeMatch(
  away: Player[],
  level: number,
  format: FormatId,
  homeRoster: Player[] = roster.filter((player) => startingPlayers.includes(player.id)),
  formation: TacticalFormation = defaultFormation,
  assignments: Record<string, string> = {},
  awayFormation: TacticalFormation = defaultFormation,
  awayAssignments: Record<string, string> = {},
): Match {
  const homeFormationXI = assignFormationPlayers(homeRoster, formation, assignments);
  const homeXI = format === "small-sided" ? selectSmallSidedXI(homeFormationXI) : homeFormationXI;
  const awayFormationXI = assignFormationPlayers(away.length ? away : roster, awayFormation, awayAssignments);
  const opponents = format === "small-sided"
    ? selectSmallSidedXI(awayFormationXI)
    : awayFormationXI;
  const homeStarts: [number, number][] = format === "small-sided"
    ? [[2, 5], [8, 3], [8, 7]]
    : [[1, 5], [4, 1], [4, 4], [4, 6], [4, 9], [7, 2], [7, 5], [7, 8], [10, 2], [10, 5], [10, 8]];
  const awayStarts: [number, number][] = format === "small-sided"
    ? [[2, 5], [8, 3], [8, 7]]
    : [[20, 5], [17, 1], [17, 4], [17, 6], [17, 9], [14, 2], [14, 5], [14, 8], [11, 2], [11, 5], [11, 8]];
  const tokens: Token[] = [
    ...homeXI.map((player, i) => ({ player, x: format === "small-sided" ? homeStarts[i][0] : player.tacticalX ?? homeStarts[i][0], y: format === "small-sided" ? homeStarts[i][1] : player.tacticalY ?? homeStarts[i][1], side: "home" as const })),
    ...opponents.map((player, i) => ({ player: { ...player, id: `ai-${player.id}` }, x: format === "small-sided" ? awayStarts[i][0] : awayStarts[i][0], y: awayStarts[i][1], side: "away" as const })),
  ];
  const kickoff = resetKickoff(tokens, "home", 1, format === "small-sided");
  return {
    format,
    formationId: formation.id,
    tokens: kickoff.tokens,
    ball: kickoff.ball,
    turn: "home",
    score: [0, 0],
    minute: 0,
    half: 1,
    halftime: false,
    selected: closestPlayerId(kickoff.tokens, kickoff.ball, "home"),
    message: `Campaign match ${level}: your move. Move a player with the ball toward the goal.`,
    campaignStage: level,
    extraAwayTurns: 0,
    drivesUsed: 0,
    actionsUsed: 0,
    bonusDrives: 0,
    bonusActions: 0,
    luck: emptyLuck(),
  };
}

const tutorialStepCount = 5;

function makeTutorialMatch(step: number, score: [number, number], players: Player[]): Match {
  const squad = players.length ? players : roster.filter((player) => startingPlayers.includes(player.id));
  const keeper = squad.find((player) => player.position === "GK") ?? squad[0];
  const outfield = squad.filter((player) => player.id !== keeper.id);
  const first = outfield[0] ?? squad[1] ?? keeper;
  const second = outfield[1] ?? outfield[0] ?? keeper;
  const training: Token[] = [
    { player: { id: "drill-keeper", name: "Rookie Keeper", club: "Training XI", position: "GK", rating: 55, ability: "Practice goalie", abilityType: "goalkeeping", abilityStat: 52, clearing: 55, color: "#8fa8a0" }, x: 20, y: 4, side: "away" },
    { player: { id: "drill-defender", name: "Training Defender", club: "Training XI", position: "DEF", rating: 55, ability: "Practice defender", abilityType: "defending", abilityStat: 52, color: "#8fa8a0" }, x: 14, y: 8, side: "away" },
    { player: { id: "drill-forward", name: "Training Forward", club: "Training XI", position: "FWD", rating: 55, ability: "Practice striker", abilityType: "finishing", abilityStat: 52, color: "#8fa8a0" }, x: 10, y: 5, side: "away" },
  ];
  const tokens: Token[] = step === 4
    ? [
      { player: keeper, x: 1, y: 5, side: "home" },
      { player: first, x: 9, y: 5, side: "home" },
      { player: second, x: 15, y: 3, side: "home" },
      { ...training[0], x: 20, y: 4 },
      { ...training[1], x: 15, y: 8 },
      { ...training[2], x: 10, y: 5 },
    ]
    : [
      { player: keeper, x: 1, y: 5, side: "home" },
      { player: first, x: 8, y: 5, side: "home" },
      { player: second, x: 14, y: 5, side: "home" },
      { ...training[0], x: 20, y: 4 },
      { ...training[1], x: 13, y: 1 },
      { ...training[2], x: 11, y: 9 },
    ];
  const ball = step === 4 ? { x: 10, y: 5 } : { x: 8, y: 5 };
  const message = step === 4
    ? "Step 4 of 5 · An opponent has the ball right next to you. Click STEAL, or tap their player."
    : step === 5
      ? "Step 5 of 5 · You're ready. Move, pass and shoot to score one more goal."
      : "Welcome to the drill. Step 1 of 5 · Click the glowing tile ahead to move with the ball.";
  return {
    format: "small-sided",
    formationId: defaultFormation.id,
    tokens,
    ball,
    turn: "home",
    score,
    minute: 1,
    half: 1,
    halftime: false,
    selected: first.id,
    message,
    campaignStage: 1,
    extraAwayTurns: 0,
    drivesUsed: 0,
    actionsUsed: 0,
    bonusDrives: 0,
    bonusActions: 0,
    luck: emptyLuck(),
  };
}

function App() {
  const devToolsEnabled = import.meta.env.DEV
    && new URLSearchParams(window.location.search).get("blitz-dev") === "tools";
  const [xp, setXp] = useState(() => devToolsEnabled ? xpRequiredForPassLevel(battlePassFinalLevel) : 0);
  const [coins, setCoins] = useState(120);
  const [unlockedPlayers, setUnlockedPlayers] = useState<string[]>(() =>
    devToolsEnabled ? roster.map((player) => player.id) : startingPlayers);
  const [unlockedFormats, setUnlockedFormats] = useState<FormatId[]>(() =>
    devToolsEnabled ? formats.map((format) => format.id) : ["classic"]);
  const [unlockedFormations, setUnlockedFormations] = useState<FormationId[]>(() =>
    devToolsEnabled ? formations.map((formation) => formation.id) : [defaultFormation.id]);
  const [activeFormationId, setActiveFormationId] = useState<FormationId>(defaultFormation.id);
  const [formationAssignments, setFormationAssignments] = useState<Partial<Record<FormationId, Record<string, string>>>>({});
  const [selectedFormationSlotId, setSelectedFormationSlotId] = useState("ST");
  const [unlockedTeamColors, setUnlockedTeamColors] = useState<string[]>(() =>
    devToolsEnabled ? kitColors.map((color) => color.id) : ["lime", "coral"]);
  const [homeKitColorId, setHomeKitColorId] = useState("lime");
  const [awayKitColorId, setAwayKitColorId] = useState("coral");
  const [dailyOfferPurchases, setDailyOfferPurchases] = useState<Record<string, boolean>>({});
  const [storeNow, setStoreNow] = useState(() => Date.now());
  const [crateReveal, setCrateReveal] = useState<CrateReveal | null>(null);
  const [crateRevealed, setCrateRevealed] = useState(false);
  const [playerSort, setPlayerSort] = useState<PlayerSort>("default");
  const [activeFormat, setActiveFormat] = useState<FormatId>("classic");
  const [screen, setScreen] = useState<"home" | "campaign" | "match" | "victory" | "locker" | "pass" | "store" | "quickplay" | "settings">("home");
  const [level, setLevel] = useState(() => devToolsEnabled ? campaignStageCount : 1);
  const [aiDifficulty, setAiDifficulty] = useState(1);
  const [humanPlayStyle, setHumanPlayStyle] = useState<HumanPlayStyle>(emptyHumanPlayStyle);
  const [match, setMatch] = useState<Match>(() => makeMatch([], 1, "classic"));
  const [notice, setNotice] = useState("");
  const [saveReady, setSaveReady] = useState(false);
  const [quickplaySide, setQuickplaySide] = useState<"home" | "away" | null>(null);
  const [quickplayMode, setQuickplayMode] = useState<"cpu" | "local" | "online" | "tutorial" | null>(null);
  const [joinRoomCode, setJoinRoomCode] = useState("");
  const [onlineRoomCode, setOnlineRoomCode] = useState("");
  const [onlineStatus, setOnlineStatus] = useState("");
  const [onlineSide, setOnlineSide] = useState<"home" | "away" | null>(null);
  const [onlineReady, setOnlineReady] = useState(false);
  const [showOnlineSetup, setShowOnlineSetup] = useState(false);
  const onlineSetupRef = useRef<HTMLElement | null>(null);
  const [passMode, setPassMode] = useState(false);
  const [matchFullscreen, setMatchFullscreen] = useState(false);
  const [captionsEnabled, setCaptionsEnabled] = useState(true);
  const [captionSize, setCaptionSize] = useState<CaptionSize>("small");
  const [captionText, setCaptionText] = useState("");
  const [endTurnKey, setEndTurnKey] = useState<string | null>("Enter");
  const [capturingEndTurnKey, setCapturingEndTurnKey] = useState(false);
  const [pitchFx, setPitchFx] = useState<PitchFx | null>(null);
  const [goalBanner, setGoalBanner] = useState<GoalBanner | null>(null);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [tutorialComplete, setTutorialComplete] = useState(false);
  const [tutorialCompleted, setTutorialCompleted] = useState(false);
  const pitchFxTimer = useRef<number | undefined>(undefined);
  const goalBannerTimer = useRef<number | undefined>(undefined);
  const tutorialCompleteTimer = useRef<number | undefined>(undefined);
  const tutorialLive = useRef(false);
  const previousScore = useRef<[number, number]>([0, 0]);
  const pendingScorer = useRef<{ side: "home" | "away"; name: string } | null>(null);
  const latestMatch = useRef(match);
  const onlineSocket = useRef<WebSocket | null>(null);
  const remoteMatchUpdate = useRef(false);
  const lastOnlineMatch = useRef<Match | null>(null);
  const lastCaptionMessage = useRef(match.message);
  const captionTimer = useRef<number | undefined>(undefined);
  const battlePassLevel = devToolsEnabled ? battlePassFinalLevel : passLevelForXp(xp);
  const currentLevelXpStart = xpRequiredForPassLevel(battlePassLevel);
  const nextLevelXpTarget = xpRequiredForPassLevel(battlePassLevel + 1);
  const maxPassXp = xpRequiredForPassLevel(battlePassFinalLevel);
  const xpTowardNextLevel = xp - currentLevelXpStart;
  const xpForNextLevel = nextLevelXpTarget - currentLevelXpStart;
  const activeDailyOffers = dailyPlayerOffers(new Date(storeNow));
  const dailyOfferDateKey = (() => {
    const date = new Date(storeNow);
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  })();
  const nextDailyReset = (() => {
    const reset = new Date(storeNow);
    reset.setHours(24, 0, 0, 0);
    return reset.getTime();
  })();
  const thanksgivingActive = storeNow < thanksgivingCrateEnds;
  const thanksgivingTimeLeft = Math.max(0, thanksgivingCrateEnds - storeNow);
  const teamColorsSimilar = kitColorsTooSimilar(
    kitColorById(homeKitColorId).value,
    kitColorById(awayKitColorId).value,
  );
  const formatUnlocked = (format: (typeof formats)[number]) =>
    devToolsEnabled || battlePassLevel >= format.unlock || unlockedFormats.includes(format.id);
  const activeFormation = formationById(activeFormationId);
  const passProgress = battlePassLevel >= battlePassFinalLevel
    ? 100
    : Math.min(100, (xpTowardNextLevel / xpForNextLevel) * 100);

  const homePlayers = useMemo(() => roster
    .filter((player) => devToolsEnabled || unlockedPlayers.includes(player.id)), [unlockedPlayers, devToolsEnabled]);
  const formationXI = useMemo(() =>
    assignFormationPlayers(homePlayers, activeFormation, formationAssignments[activeFormationId] ?? {}),
  [homePlayers, activeFormation, formationAssignments, activeFormationId]);
  const sortedRoster = useMemo(() => {
    const positionOrder: Record<Position, number> = { GK: 0, DEF: 1, MID: 2, FWD: 3 };
    const compareText = (a: string, b: string) => a.localeCompare(b);
    return [...roster].sort((a, b) => {
      if (playerSort === "default") return roster.indexOf(a) - roster.indexOf(b);
      const unlockedA = devToolsEnabled || unlockedPlayers.includes(a.id);
      const unlockedB = devToolsEnabled || unlockedPlayers.includes(b.id);
      const positionA = a.position;
      const positionB = b.position;
      const unlockA = playerUnlocks[a.id] ?? 0;
      const unlockB = playerUnlocks[b.id] ?? 0;
      let result = 0;
      switch (playerSort) {
        case "name-asc": result = compareText(a.name, b.name); break;
        case "name-desc": result = compareText(b.name, a.name); break;
        case "position": result = positionOrder[positionA] - positionOrder[positionB]; break;
        case "club": result = compareText(a.club, b.club); break;
        case "ovr-desc": result = overallRating(b) - overallRating(a); break;
        case "ovr-asc": result = overallRating(a) - overallRating(b); break;
        case "rating-desc": result = b.rating - a.rating; break;
        case "rating-asc": result = a.rating - b.rating; break;
        case "ability-desc": result = b.abilityStat - a.abilityStat; break;
        case "ability-asc": result = a.abilityStat - b.abilityStat; break;
        case "mean-desc": result = meanPlayerStats(b) - meanPlayerStats(a); break;
        case "unlock-asc": result = unlockA - unlockB; break;
        case "unlock-desc": result = unlockB - unlockA; break;
        case "unlocked-first": result = Number(unlockedB) - Number(unlockedA); break;
        case "locked-first": result = Number(unlockedA) - Number(unlockedB); break;
        default: break;
      }
      if (result !== 0) return result;
      return positionOrder[positionA] - positionOrder[positionB]
        || overallRating(b) - overallRating(a)
        || compareText(a.name, b.name);
    });
  }, [playerSort, unlockedPlayers, devToolsEnabled]);
  const startingXI = formationXI;
  const selectedFormationSlot = activeFormation.slots.find((slot) => slot.id === selectedFormationSlotId)
    ?? activeFormation.slots[0];
  const selectedFormationPlayer = formationXI.find((player) => player.tacticalSlot === selectedFormationSlot?.id);
  const awayPlayers = useMemo(() => aiOpponentRoster(aiDifficulty), [aiDifficulty]);
  const goalTarget = match.format === "golden-goal" ? 1 : match.format === "small-sided" ? 2 : 3;
  const matchIsSmallSided = match.format === "small-sided";
  const scoreLabel = `${match.score[0]} — ${match.score[1]}`;
  const clockLabel = match.halftime ? "45' · HT" : `${match.minute}'`;
  const activeSideForClient = () => onlineSide ?? (quickplaySide !== null ? match.turn : "home");

  const setFormationSlotPlayer = (slotId: string, playerId: string) => {
    setFormationAssignments((current) => {
      const next = { ...(current[activeFormationId] ?? {}) };
      Object.entries(next).forEach(([assignedSlot, assignedPlayer]) => {
        if (assignedPlayer === playerId || assignedSlot === slotId) delete next[assignedSlot];
      });
      if (playerId !== "auto") next[slotId] = playerId;
      return { ...current, [activeFormationId]: next };
    });
  };
  const recordPlayerAction = (action: keyof HumanPlayStyle) =>
    setHumanPlayStyle((style) => ({ ...style, [action]: style[action] + 1 }));
  const resetMatchLearning = () => setHumanPlayStyle(emptyHumanPlayStyle());

  const buyDailyOffer = (player: Player) => {
    const offerKey = `${dailyOfferDateKey}:${player.id}`;
    const price = dailyOfferPrice(player);
    if (unlockedPlayers.includes(player.id)) {
      setNotice(`${player.name} is already in your squad.`);
      return;
    }
    if (dailyOfferPurchases[offerKey]) {
      setNotice("That daily offer has already been purchased today.");
      return;
    }
    if (!devToolsEnabled && coins < price) {
      setNotice(`You need ${price - coins} more coins for ${player.name}.`);
      return;
    }
    if (!devToolsEnabled) setCoins((current) => current - price);
    setUnlockedPlayers((current) => current.includes(player.id) ? current : [...current, player.id]);
    setDailyOfferPurchases((current) => ({ ...current, [offerKey]: true }));
    setNotice(`${player.name} joined your squad.`);
  };

  const buyXp = (coinPrice: number) => {
    if (!devToolsEnabled && coins < coinPrice) {
      setNotice(`You need ${coinPrice - coins} more coins.`);
      return;
    }
    if (!devToolsEnabled && xp >= maxPassXp) {
      setNotice("Your Season Pass is already at its final level.");
      return;
    }
    const xpGain = devToolsEnabled ? coinPrice * 4 : Math.min(coinPrice * 4, maxPassXp - xp);
    const actualCost = Math.ceil(xpGain / 4);
    const newXp = devToolsEnabled ? xp + xpGain : Math.min(maxPassXp, xp + xpGain);
    if (!devToolsEnabled) setCoins((current) => current - actualCost);
    setXp(newXp);
    setUnlockedPlayers((current) => [...new Set([...current, ...playersAvailableAt(passLevelForXp(newXp))])]);
    setNotice(`Purchased ${xpGain.toLocaleString()} XP for ${actualCost} coins.`);
  };

  const openCrate = (crate: "basic" | "blitz" | "thanksgiving") => {
    if (crate === "thanksgiving" && !thanksgivingActive) {
      setNotice("The Thanksgiving crate has expired.");
      return;
    }
    const price = crate === "basic" ? 80 : 350;
    if (!devToolsEnabled && coins < price) {
      setNotice(`You need ${price - coins} more coins to open this crate.`);
      return;
    }
    const lockedColors = kitColors.filter((color) => !unlockedTeamColors.includes(color.id));
    const colorReward = lockedColors.length
      ? lockedColors[Math.floor(Math.random() * lockedColors.length)]
      : kitColors[Math.floor(Math.random() * kitColors.length)];
    const playerPool = cratePlayerPools[crate]
      .map((id) => roster.find((player) => player.id === id))
      .filter((player): player is Player => !!player && (devToolsEnabled || !unlockedPlayers.includes(player.id)));
    const formationPool = crateFormationPools[crate]
      .map((id) => formations.find((formation) => formation.id === id))
      .filter((formation): formation is TacticalFormation =>
        !!formation && (devToolsEnabled || !unlockedFormations.includes(formation.id)));
    const bonusIsFormation = formationPool.length > 0
      && (playerPool.length === 0 || Math.random() < (crate === "basic" ? 0.08 : 0.22));
    const playerReward = !bonusIsFormation && playerPool.length
      ? playerPool[Math.floor(Math.random() * playerPool.length)]
      : null;
    const formationReward = bonusIsFormation
      ? formationPool[Math.floor(Math.random() * formationPool.length)]
      : null;
    const duplicateColor = !lockedColors.length;
    const bonusCoins = duplicateColor ? 25 : 0;
    if (!devToolsEnabled) setCoins((current) => current - price + bonusCoins);
    if (colorReward && !unlockedTeamColors.includes(colorReward.id)) {
      setUnlockedTeamColors((current) => [...current, colorReward.id]);
    }
    if (playerReward) {
      setUnlockedPlayers((current) => current.includes(playerReward.id) ? current : [...current, playerReward.id]);
    }
    if (formationReward) {
      setUnlockedFormations((current) => current.includes(formationReward.id) ? current : [...current, formationReward.id]);
    }
    const bonusLabel = playerReward
      ? `${playerReward.name} (${overallRating(playerReward)} OVR)`
      : formationReward ? `${formationReward.name} Formation` : "75 bonus coins";
    if (!playerReward && !formationReward && !devToolsEnabled) setCoins((current) => current + 75);
    setCrateRevealed(false);
    setCrateReveal({
      crate,
      color: colorReward ?? kitColors[0],
      reward: bonusLabel,
      bonusCoins,
    });
  };

  useEffect(() => {
    if (devToolsEnabled) {
      setSaveReady(true);
      return;
    }
    try {
      const saved = window.localStorage.getItem("blitz-league-save")
        ?? window.localStorage.getItem("soccer-baseboard-save");
      if (saved) {
        const data = JSON.parse(saved) as { xp?: number; progressionVersion?: number; coins?: number; unlockedPlayers?: string[]; unlockedFormats?: FormatId[]; unlockedFormations?: FormationId[]; activeFormationId?: FormationId; formationAssignments?: Partial<Record<FormationId, Record<string, string>>>; unlockedTeamColors?: string[]; homeKitColorId?: string; awayKitColorId?: string; dailyOfferPurchases?: Record<string, boolean>; activeFormat?: FormatId; level?: number; aiDifficulty?: number; captionsEnabled?: boolean; captionSize?: CaptionSize; endTurnKey?: string | null; enterEndsTurn?: boolean; tutorialCompleted?: boolean };
        if (data.progressionVersion !== currentSaveVersion) {
          window.localStorage.removeItem("soccer-baseboard-save");
          setNotice("Blitz League has started a fresh season. Your regular starting squad is ready.");
          return;
        }
        const loadedXp = typeof data.xp === "number" && Number.isFinite(data.xp)
          ? Math.max(0, Math.floor(data.xp))
          : 0;
        const passLevel = passLevelForXp(loadedXp);
        const savedPlayers = Array.isArray(data.unlockedPlayers)
          ? data.unlockedPlayers.filter((id) => roster.some((player) => player.id === id))
          : [];
        if (typeof data.xp === "number" && Number.isFinite(data.xp)) {
          setXp(loadedXp);
          setUnlockedPlayers([...new Set([...playersAvailableAt(passLevel), ...savedPlayers])]);
        }
        const savedFormats = Array.isArray(data.unlockedFormats)
          ? data.unlockedFormats.filter((id): id is FormatId => formats.some((format) => format.id === id))
          : [];
        setUnlockedFormats([...new Set(["classic" as FormatId, ...savedFormats])]);
        const savedFormations = Array.isArray(data.unlockedFormations)
          ? data.unlockedFormations.filter((id): id is FormationId => formations.some((formation) => formation.id === id))
          : [];
        const ownedFormations = [...new Set([defaultFormation.id, ...savedFormations])];
        setUnlockedFormations(ownedFormations);
        if (typeof data.activeFormationId === "string" && ownedFormations.includes(data.activeFormationId as FormationId)) {
          setActiveFormationId(data.activeFormationId as FormationId);
        }
        if (data.formationAssignments && typeof data.formationAssignments === "object") {
          const validAssignments: Partial<Record<FormationId, Record<string, string>>> = {};
          formations.forEach((formation) => {
            const assignments = data.formationAssignments?.[formation.id];
            if (!assignments || typeof assignments !== "object") return;
            const validSlots = Object.fromEntries(Object.entries(assignments).filter(([slotId, playerId]) =>
              formation.slots.some((slot) => slot.id === slotId)
              && roster.some((player) => player.id === playerId)));
            validAssignments[formation.id] = validSlots;
          });
          setFormationAssignments(validAssignments);
        }
        const savedColors = Array.isArray(data.unlockedTeamColors)
          ? data.unlockedTeamColors.filter((id) => kitColors.some((color) => color.id === id))
          : [];
        const ownedColors = [...new Set(["lime", "coral", ...savedColors])];
        setUnlockedTeamColors(ownedColors);
        if (typeof data.homeKitColorId === "string" && ownedColors.includes(data.homeKitColorId)) {
          setHomeKitColorId(data.homeKitColorId);
        }
        if (typeof data.awayKitColorId === "string" && ownedColors.includes(data.awayKitColorId)) {
          setAwayKitColorId(data.awayKitColorId);
        }
        if (data.dailyOfferPurchases && typeof data.dailyOfferPurchases === "object") {
          setDailyOfferPurchases(data.dailyOfferPurchases);
        }
        if (typeof data.coins === "number") setCoins(data.coins);
        if (data.activeFormat && formats.some((f) => f.id === data.activeFormat
          && (f.unlock <= passLevel || savedFormats.includes(f.id)))) setActiveFormat(data.activeFormat);
        if (typeof data.level === "number") setLevel(data.level);
        if (typeof data.aiDifficulty === "number" && Number.isFinite(data.aiDifficulty)) {
          setAiDifficulty(cap(Math.round(data.aiDifficulty), 1, 100));
        }
        if (typeof data.captionsEnabled === "boolean") setCaptionsEnabled(data.captionsEnabled);
        if (data.captionSize && ["small", "medium", "large"].includes(data.captionSize)) setCaptionSize(data.captionSize);
        if (typeof data.tutorialCompleted === "boolean") setTutorialCompleted(data.tutorialCompleted);
        if (typeof data.endTurnKey === "string" || data.endTurnKey === null) setEndTurnKey(data.endTurnKey);
        else if (data.enterEndsTurn === false) setEndTurnKey(null);
      }
    } catch {
      setNotice("Could not load saved progress. You can still play; progress will save again.");
    } finally {
      setSaveReady(true);
    }
  }, []);

  useEffect(() => {
    if (!saveReady || devToolsEnabled) return;
    window.localStorage.setItem("blitz-league-save", JSON.stringify({
      xp, progressionVersion: currentSaveVersion, coins, unlockedPlayers, unlockedFormats, unlockedFormations,
      activeFormationId, formationAssignments, unlockedTeamColors, homeKitColorId, awayKitColorId,
      dailyOfferPurchases, activeFormat, level, aiDifficulty,
      captionsEnabled, captionSize, endTurnKey, tutorialCompleted,
    }));
  }, [xp, coins, unlockedPlayers, unlockedFormats, unlockedTeamColors, homeKitColorId, awayKitColorId,
    unlockedFormations, activeFormationId, formationAssignments, dailyOfferPurchases, activeFormat, level, aiDifficulty,
    captionsEnabled, captionSize, endTurnKey, tutorialCompleted, saveReady, devToolsEnabled]);

  useEffect(() => {
    if (screen !== "store") return;
    const timer = window.setInterval(() => setStoreNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [screen]);

  useEffect(() => {
    if (!crateReveal || crateRevealed) return;
    const timer = window.setTimeout(() => setCrateRevealed(true), 1250);
    return () => window.clearTimeout(timer);
  }, [crateReveal, crateRevealed]);

  useEffect(() => {
    latestMatch.current = match;
  }, [match]);

  useEffect(() => {
    if (remoteMatchUpdate.current) {
      remoteMatchUpdate.current = false;
      lastOnlineMatch.current = match;
      return;
    }
    const socket = onlineSocket.current;
    const previous = lastOnlineMatch.current;
    lastOnlineMatch.current = match;
    if (!onlineReady || !onlineSide || !socket || socket.readyState !== WebSocket.OPEN
      || (match.turn !== onlineSide && previous?.turn !== onlineSide)) return;
    socket.send(JSON.stringify({ type: "match-state", match }));
  }, [match, onlineSide, onlineReady]);

  useEffect(() => () => onlineSocket.current?.close(), []);

  useEffect(() => {
    if (screen !== "match" || match.finished || match.halftime || tutorialStep > 0) return;
    const timer = window.setInterval(() => {
      setMatch((current) => {
        if (current.finished || current.halftime || current.minute >= 90) return current;
        if (current.minute === 44 && current.half === 1) {
          const kickoff = resetKickoff(current.tokens, "away", 2, matchIsSmallSided);
          return {
            ...current,
            tokens: kickoff.tokens,
            ball: kickoff.ball,
            minute: 45,
            half: 2,
            halftime: true,
            turn: "away",
            selected: closestPlayerId(kickoff.tokens, kickoff.ball, "away"),
            drivesUsed: 0,
            actionsUsed: 0,
            bonusDrives: 0,
            bonusActions: 0,
            stealProtectedSide: undefined,
            message: "Halftime! Teams switch ends. Away will kick off the second half.",
          };
        }
        return { ...current, minute: current.minute + 1 };
      });
    }, 3500);
    return () => window.clearInterval(timer);
  }, [screen, match.finished, match.halftime, matchIsSmallSided, tutorialStep]);

  useEffect(() => {
    if (match.message === lastCaptionMessage.current) return;
    lastCaptionMessage.current = match.message;
    if (screen !== "match" || !captionsEnabled) return;
    setCaptionText(match.message);
    window.clearTimeout(captionTimer.current);
    captionTimer.current = window.setTimeout(() => setCaptionText(""), 5000);
    return () => window.clearTimeout(captionTimer.current);
  }, [match.message, screen, captionsEnabled]);

  useEffect(() => {
    if (!captionsEnabled) {
      window.clearTimeout(captionTimer.current);
      setCaptionText("");
    }
  }, [captionsEnabled]);

  useEffect(() => {
    if (showOnlineSetup) {
      onlineSetupRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [showOnlineSetup]);

  useEffect(() => {
    const previous = previousScore.current;
    previousScore.current = match.score;
    const homeDelta = match.score[0] - previous[0];
    const awayDelta = match.score[1] - previous[1];
    if (homeDelta <= 0 && awayDelta <= 0) return;
    const side = homeDelta > 0 ? "home" : "away";
    const scorer = pendingScorer.current?.name ?? (side === "home" ? "Your team" : "The opposition");
    pendingScorer.current = null;
    celebrateGoal(side, scorer);
  }, [match.score]);

  useEffect(() => {
    tutorialLive.current = screen === "match" && quickplayMode === "tutorial";
  }, [screen, quickplayMode]);

  useEffect(() => () => {
    window.clearTimeout(pitchFxTimer.current);
    window.clearTimeout(goalBannerTimer.current);
    window.clearTimeout(tutorialCompleteTimer.current);
  }, []);

  function playPitchFx(kind: PitchFxKind, to: { x: number; y: number }, label?: string, from?: { x: number; y: number }, side?: "home" | "away") {
    window.clearTimeout(pitchFxTimer.current);
    setPitchFx({ id: Date.now() + Math.random(), kind, from: from ?? to, to, label, side });
    pitchFxTimer.current = window.setTimeout(() => setPitchFx(null), 1150);
  }

  function celebrateGoal(side: "home" | "away", scorer: string) {
    window.clearTimeout(goalBannerTimer.current);
    setGoalBanner({ side, scorer });
    goalBannerTimer.current = window.setTimeout(() => setGoalBanner(null), 1900);
  }

  function startTutorial() {
    window.clearTimeout(tutorialCompleteTimer.current);
    stopQuickplay();
    setPassMode(false);
    setTutorialComplete(false);
    setTutorialStep(1);
    setQuickplayMode("tutorial");
    const drill = makeTutorialMatch(1, [0, 0], homePlayers);
    previousScore.current = drill.score;
    setMatch(drill);
    setScreen("match");
  }

  function exitTutorial() {
    window.clearTimeout(tutorialCompleteTimer.current);
    stopQuickplay();
    setTutorialStep(0);
    setTutorialComplete(false);
    setGoalBanner(null);
    setPitchFx(null);
    setMatchFullscreen(false);
    setScreen("home");
  }

  function completeTutorial() {
    if (!tutorialLive.current) return;
    setTutorialStep(0);
    setGoalBanner(null);
    setPitchFx(null);
    setTutorialComplete(true);
    if (tutorialCompleted) return;
    setTutorialCompleted(true);
    setXp((value) => value + 150);
    setCoins((value) => value + 50);
    const nextPassLevel = passLevelForXp(xp + 150);
    setUnlockedPlayers((current) => [...new Set([...current, ...playersAvailableAt(nextPassLevel)])]);
    setNotice("Tutorial complete · +150 XP · +50 coins");
  }

  function stopQuickplay() {
    window.clearTimeout(tutorialCompleteTimer.current);
    onlineSocket.current?.close();
    onlineSocket.current = null;
    setOnlineSide(null);
    setOnlineReady(false);
    setOnlineRoomCode("");
    setOnlineStatus("");
    lastOnlineMatch.current = null;
    setQuickplaySide(null);
    setTutorialStep(0);
    setTutorialComplete(false);
    setGoalBanner(null);
    setPitchFx(null);
    setQuickplayMode(null);
  }

  function connectOnline(action: "create-room" | "join-room") {
    if (onlineSocket.current) onlineSocket.current.close();
    const socket = new WebSocket("wss://person616-blitz-league-match-relay.onrender.com");
    onlineSocket.current = socket;
    setOnlineStatus("Connecting to the host...");
    setOnlineRoomCode("");
    setOnlineReady(false);
    socket.onopen = () => {
      if (action === "create-room") {
        const initial = makeMatch(awayPlayers, level, activeFormat, homePlayers, activeFormation,
          formationAssignments[activeFormationId] ?? {});
        lastOnlineMatch.current = initial;
        socket.send(JSON.stringify({ type: action, match: initial }));
      } else {
        socket.send(JSON.stringify({ type: action, code: joinRoomCode.trim().toUpperCase() }));
      }
    };
    socket.onmessage = (event) => {
      let packet: { type?: string; code?: string; side?: "home" | "away"; match?: Match; message?: string };
      try {
        packet = JSON.parse(String(event.data));
      } catch {
        setOnlineStatus("Received an invalid message from the host.");
        return;
      }
      if (packet.type === "error") {
        setOnlineStatus(packet.message ?? "The host rejected the connection.");
        return;
      }
      if (packet.type === "room-created" && packet.match) {
        resetMatchLearning();
        setOnlineRoomCode(packet.code ?? "");
        setOnlineSide("home");
        setQuickplaySide("home");
        setQuickplayMode("online");
        setMatch(packet.match);
        lastOnlineMatch.current = packet.match;
        setOnlineStatus("Room ready. Waiting for the other player to join.");
        return;
      }
      if (packet.type === "room-joined" && packet.match) {
        resetMatchLearning();
        setOnlineRoomCode(packet.code ?? "");
        setOnlineSide("away");
        setQuickplaySide("away");
        setQuickplayMode("online");
        remoteMatchUpdate.current = true;
        lastOnlineMatch.current = packet.match;
        setMatch(packet.match);
        setOnlineReady(true);
        setOnlineStatus("Connected. Your turn will appear when it is your side's turn.");
        setScreen("match");
        return;
      }
      if (packet.type === "player-joined") {
        setOnlineReady(true);
        setOnlineStatus("Opponent connected. Match started.");
        setScreen("match");
        return;
      }
      if (packet.type === "player-left") {
        setOnlineReady(false);
        setOnlineStatus("Opponent disconnected. Share the room code to let them rejoin.");
        return;
      }
      if (packet.type === "room-closed") {
        setOnlineReady(false);
        setOnlineStatus(packet.message ?? "The host closed the room.");
        setOnlineSide(null);
        setQuickplaySide(null);
        setQuickplayMode(null);
        setOnlineRoomCode("");
        return;
      }
      if (packet.type === "match-state" && packet.match) {
        remoteMatchUpdate.current = true;
        lastOnlineMatch.current = packet.match;
        setMatch(packet.match);
        if (packet.match.finished) setScreen("victory");
      }
    };
    socket.onerror = () => setOnlineStatus("Couldn't connect. The match server needs its one-time Render setup before you can create or join a game.");
    socket.onclose = () => {
      if (onlineSocket.current === socket) {
        onlineSocket.current = null;
        setOnlineReady(false);
        setOnlineStatus((current) => current || "Disconnected from the match server.");
      }
    };
  }

  function showQuickplayOptions() {
    stopQuickplay();
    setScreen("quickplay");
  }

  function startLocalQuickplay() {
    setPassMode(false);
    resetMatchLearning();
    const initial = makeMatch(homePlayers, level, activeFormat, homePlayers, activeFormation, formationAssignments[activeFormationId] ?? {});
    initial.message = "Local Quickplay · Home kicks off. Both teams have the same lineup. Take turns on this screen and pass the device after each turn.";
    setQuickplaySide("home");
    setQuickplayMode("local");
    setMatch(initial);
    setScreen("match");
  }

  function startCpuQuickplay() {
    setPassMode(false);
    const freshStyle = emptyHumanPlayStyle();
    setHumanPlayStyle(freshStyle);
    const strategy = adaptAiStrategy(aiStrategyForLevel(aiDifficulty), freshStyle, aiDifficulty);
    const cpuLineup = chooseAiFormation(awayPlayers, strategy, freshStyle);
    const initial = makeMatch(awayPlayers, aiDifficulty, activeFormat, homePlayers, activeFormation,
      formationAssignments[activeFormationId] ?? {}, cpuLineup.formation, cpuLineup.assignments);
    initial.message = "CPU Quickplay · You control the home team. Select a player, then choose a highlighted tile to move.";
    setQuickplaySide(null);
    setQuickplayMode("cpu");
    setMatch(initial);
    setScreen("match");
  }

  function startMatch(nextLevel = level) {
    if (nextLevel > level || nextLevel > campaignStageCount) return;
    setPassMode(false);
    stopQuickplay();
    const stageDifficulty = Math.min(100, nextLevel);
    resetMatchLearning();
    const stageOpponentXI = aiOpponentRoster(stageDifficulty);
    const stageFormat = campaignFormatForStage(nextLevel);
    const freshStyle = emptyHumanPlayStyle();
    const stageStrategy = adaptAiStrategy(aiStrategyForLevel(stageDifficulty), freshStyle, stageDifficulty);
    const stageLineup = chooseAiFormation(stageOpponentXI, stageStrategy, freshStyle);
    setMatch(makeMatch(stageOpponentXI, nextLevel, stageFormat, homePlayers, activeFormation,
      formationAssignments[activeFormationId] ?? {}, stageLineup.formation, stageLineup.assignments));
    setScreen("match");
  }

  function endTurn(current: Match) {
    setPassMode(false);
    if (tutorialStep > 0) {
      setMatch({
        ...current,
        turn: "home",
        selected: closestPlayerId(current.tokens, current.ball, "home"),
        drivesUsed: 0,
        actionsUsed: 0,
        bonusDrives: 0,
        bonusActions: 0,
        message: "Practice drill · the ball stays with you. Move again, or pass and shoot when you're ready.",
      });
      return;
    }
    const next = { ...current, turn: current.turn === "home" ? "away" as const : "home" as const };
    if (current.stealProtectedSide && current.turn !== current.stealProtectedSide) {
      next.stealProtectedSide = undefined;
    }
    next.drivesUsed = 0;
    next.actionsUsed = 0;
    next.bonusDrives = 0;
    next.bonusActions = 0;
    if (quickplaySide !== null) {
      let bonusTurnContinues = false;
      if (current.turn === current.bonusTurnSide && current.extraAwayTurns > 1) {
        next.turn = current.turn;
        next.extraAwayTurns = current.extraAwayTurns - 1;
        bonusTurnContinues = true;
      } else if (current.turn === current.bonusTurnSide) {
        next.extraAwayTurns = 0;
        next.bonusTurnSide = undefined;
      }
      next.selected = closestPlayerId(next.tokens, next.ball, next.turn);
      next.message = bonusTurnContinues
        ? `${next.turn === "home" ? "Home" : "Away"} keeps the bonus turn.`
        : `${next.turn === "home" ? "Home" : "Away"} turn. Pass the device, then move, pass, shoot, or try a nutmeg.`;
      setMatch(next);
      return;
    }
    if (next.turn === "away") {
      next.selected = closestPlayerId(next.tokens, next.ball, "away");
      window.setTimeout(runAiTurn, 450);
      setMatch(next);
    } else {
      next.selected = closestPlayerId(next.tokens, next.ball, "home");
      setMatch({ ...next, message: "Your turn. Your selected player is closest to the ball; select the ball carrier to act with possession." });
    }
  }

  function spendAction(current: Match, message: string, nutmegSuccess = false) {
    const next = {
      ...current,
      actionsUsed: current.actionsUsed + 1,
      bonusDrives: current.bonusDrives + (nutmegSuccess ? 1 : 0),
      bonusActions: current.bonusActions + (nutmegSuccess ? 1 : 0),
      message,
    };
    const driveLimit = 1 + next.bonusDrives;
    const actionLimit = 1 + next.bonusActions;
    if (next.drivesUsed >= driveLimit && next.actionsUsed >= actionLimit) {
      endTurn(next);
    } else {
      setMatch(next);
    }
  }

  function runAiTurn() {
    const latest = latestMatch.current;
    if (quickplaySide !== null || latest.turn !== "away" || latest.finished) return;
    const ai = { ...latest, tokens: latest.tokens.map((t) => ({ ...t })) };
    const aiDifficultyLevel = cap(latest.campaignStage, 1, 100);
    const strategy = adaptAiStrategy(aiStrategyForLevel(aiDifficultyLevel), humanPlayStyle, aiDifficultyLevel, ai);
    const playCount = Math.max(1, humanPlayStyle.shots + humanPlayStyle.passes
      + humanPlayStyle.carries + humanPlayStyle.nutmegs);
    const nutmegTendency = humanPlayStyle.nutmegs / playCount;
    const expireHomeStealProtection = ai.stealProtectedSide === "home";
    const originalAwayPositions = new Map(ai.tokens.filter((token) => token.side === "away")
      .map((token) => [token.player.id, `${token.x},${token.y}`]));
    const originalScore = ai.score[1];
    const originalBall = `${ai.ball.x},${ai.ball.y}`;
    const owner = ai.tokens.find((t) => t.side === "away" && t.x === ai.ball.x && t.y === ai.ball.y);
    if (owner && owner.player.position === "GK") {
      if (isInOwnPenaltyBox(owner, ai.half)) {
        const clearance = resolveGoalkeeperClearance(ai, owner);
        ai.ball = clearance.ball;
        ai.luck = clearance.luck;
        ai.stealProtectedSide = undefined;
        ai.message = clearance.message;
        playPitchFx("pass", clearance.ball, "CLEARED!", { x: owner.x, y: owner.y }, owner.side);
      } else {
        const receiver = ai.tokens.filter((token) => token.side === owner.side && token.player.position !== "GK"
          && distance(owner, token) <= passingRange(owner.player)
          && ownGoalDistance(token, ai.half) < ownGoalDistance(owner, ai.half))
          .sort((a, b) => ownGoalDistance(a, ai.half) - ownGoalDistance(b, ai.half))[0];
        const interception = receiver
          ? findInterceptor(ai.tokens, owner.side, lineCells(owner, receiver).slice(0, -1))
          : undefined;
        if (receiver && !interception) {
          ai.tokens = shiftFormationWithBall(ai.tokens, owner.x, receiver.x, receiver.player.id, ai.half);
          const shiftedReceiver = ai.tokens.find((token) => token.player.id === receiver.player.id);
          if (shiftedReceiver) ai.ball = { x: shiftedReceiver.x, y: shiftedReceiver.y };
          ai.message = `${owner.player.name} stays back and plays a safe pass to ${receiver.player.name}.`;
          if (shiftedReceiver) playPitchFx("pass", { x: shiftedReceiver.x, y: shiftedReceiver.y }, "PASS!", { x: owner.x, y: owner.y }, owner.side);
        } else {
          ai.message = `${owner.player.name} holds position near the goal and protects the defensive shape.`;
        }
      }
    } else if (owner) {
      const goalDistance = ownGoalDistance(owner, latest.half);
      const options = attackingActionOptions(owner, ai.tokens, ai, strategy);
      const action = chooseAttackingActionWithMinimax(ai, owner, options, aiDifficultyLevel);

      if (action?.kind === "shoot") {
        const chance = shotAccuracy(owner, ai.tokens, goalDistance, shotAngleDegrees(owner, latest.half));
        const goal = { x: latest.half === 1 ? 0 : 21, y: 5 };
        const interception = findInterceptor(ai.tokens, "away", lineCells(owner, goal));
        const block = interception
          ? rollLuck(ai, interception.token.side, "away", interceptionChance(interception.token, "shot", interception.gap))
          : undefined;
        const shot = block?.success
          ? undefined
          : rollLuck(block?.match ?? ai, "away", "home", chance);
        ai.luck = (shot?.match ?? block?.match ?? ai).luck;
        if (block?.success) {
          ai.ball = { x: interception!.token.x, y: interception!.token.y };
          ai.stealProtectedSide = undefined;
          ai.message = `${interception!.token.player.name} blocks the opposition's shot and intercepts the ball!`;
          playPitchFx("intercept", { x: interception!.token.x, y: interception!.token.y }, "BLOCKED!", { x: owner.x, y: owner.y }, interception!.token.side);
        } else if (shot?.success) {
          pendingScorer.current = { side: "away", name: owner.player.name };
          ai.score = [ai.score[0], ai.score[1] + 1];
          const kickoff = resetKickoff(ai.tokens, "home", ai.half, matchIsSmallSided);
          ai.tokens = kickoff.tokens;
          ai.ball = kickoff.ball;
          ai.stealProtectedSide = undefined;
          ai.message = `The opposition scores! ${ai.score[0]}–${ai.score[1]}.`;
          playPitchFx("goal", goal, "GOAL!", { x: owner.x, y: owner.y }, owner.side);
          if (ai.score[1] >= goalTarget) {
            setMatch(finishOrSet(ai));
            return;
          }
          if (ai.extraAwayTurns > 1) {
            ai.extraAwayTurns -= 1;
            ai.turn = "away";
            ai.selected = closestPlayerId(ai.tokens, ai.ball, "away");
            setMatch(ai);
            window.setTimeout(runAiTurn, 450);
            return;
          }
          ai.drivesUsed = 0;
          ai.actionsUsed = 0;
          ai.bonusDrives = 0;
          ai.bonusActions = 0;
          ai.turn = "home";
          ai.selected = closestPlayerId(ai.tokens, ai.ball, "home");
          ai.extraAwayTurns = 0;
          setMatch(ai);
          return;
        } else {
          ai.ball = goal;
          ai.stealProtectedSide = undefined;
          ai.message = `The opposition's shot from ${goalDistance} tiles out goes wide (${Math.round(shot?.chance ?? chance)}% chance). The ball is loose by your goal.`;
          playPitchFx("miss", goal, "WIDE!", { x: owner.x, y: owner.y }, owner.side);
        }
      } else if (action?.kind === "pass") {
        const receiver = action.receiver;
        const passGap = distance(owner, receiver);
        const interceptor = findInterceptor(ai.tokens, "away", lineCells(owner, receiver).slice(0, -1));
        const passRoll = interceptor
          ? rollLuck(ai, interceptor.token.side, "away", interceptionChance(interceptor.token, "pass", interceptor.gap))
          : undefined;
        ai.luck = (passRoll?.match ?? ai).luck;
        if (passRoll?.success) {
          ai.ball = { x: interceptor!.token.x, y: interceptor!.token.y };
          ai.stealProtectedSide = undefined;
          ai.message = `${interceptor!.token.player.name} reads the opposition pass and intercepts it!`;
          playPitchFx("intercept", { x: interceptor!.token.x, y: interceptor!.token.y }, "INTERCEPTED!", { x: owner.x, y: owner.y }, interceptor!.token.side);
        } else {
          ai.tokens = shiftFormationWithBall(ai.tokens, owner.x, receiver.x, receiver.player.id, ai.half);
          const shiftedReceiver = ai.tokens.find((token) => token.player.id === receiver.player.id);
          if (shiftedReceiver) ai.ball = { x: shiftedReceiver.x, y: shiftedReceiver.y };
          ai.message = passGap >= 4
            ? `The opposition switches play and finds ${receiver.player.name} with a long weighted pass.`
            : `The opposition finds ${receiver.player.name} in space with a weighted pass.`;
          if (shiftedReceiver) playPitchFx("pass", { x: shiftedReceiver.x, y: shiftedReceiver.y }, passGap >= 4 ? "GREAT BALL!" : "PASS!", { x: owner.x, y: owner.y }, owner.side);
        }
      } else {
        const next = action?.kind === "carry" ? action.move : undefined;
        if (next) {
          const previousBallX = ai.ball.x;
          const previousOwner = { x: owner.x, y: owner.y };
          owner.x = next.x;
          owner.y = next.y;
          ai.ball = { x: next.x, y: next.y };
          if (ai.stealProtectedSide === "away") ai.stealProtectedSide = undefined;
          ai.tokens = shiftFormationWithBall(ai.tokens, previousBallX, next.x, owner.player.id, ai.half);
          playPitchFx("move", { x: next.x, y: next.y }, undefined, previousOwner, owner.side);
        }
        ai.message = next
          ? `The opposition's ${owner.player.name} carries into space and keeps the attack moving.`
          : "The opposition shields the ball. Your turn.";
      }
    } else {
      const carrier = ai.tokens.find((t) => t.x === ai.ball.x && t.y === ai.ball.y);
      if (carrier?.side === "home") {
        const defensiveOptions = defensiveMoveOptions(ai.tokens, carrier, strategy, ai.half);
        const adjacentDefenders = ai.tokens.filter((token) => token.side === "away"
          && token.player.position !== "GK" && adjacent(token, carrier))
          .sort((a, b) => stealChanceFor(b, carrier, ai.half) - stealChanceFor(a, carrier, ai.half));
        const defensiveChoice = chooseDefensiveActionWithMinimax(ai, carrier, defensiveOptions,
          ai.stealProtectedSide === "home" ? [] : adjacentDefenders, strategy, aiDifficultyLevel);
        const chosenSteal = defensiveChoice?.kind === "steal" ? defensiveChoice.presser : undefined;
        const chosenMove = defensiveChoice?.kind === "move" ? defensiveChoice : undefined;
        const presser = chosenSteal ?? (!defensiveChoice ? adjacentDefenders[0] : undefined);
        if (presser && adjacent(presser, carrier)) {
          if (ai.stealProtectedSide === "home") {
            ai.message = "Your team keeps possession after the recent steal; the opposition cannot steal back immediately.";
          } else {
            const help = adjacentDefenders.filter((token) => token.player.id !== presser.player.id).length;
            const chance = cap(stealChanceFor(presser, carrier, ai.half)
              + help * 3.5 + strategy.pressing * 3, 15, 78);
            const stealRoll = rollLuck(ai, "away", "home", chance);
            ai.luck = stealRoll.match.luck;
            if (stealRoll.success) {
              const landing = stealLanding(ai.tokens, presser, carrier, ai.half);
              ai.tokens = ai.tokens.map((token) => token.player.id === presser.player.id
                ? { ...token, x: landing.x, y: landing.y }
                : token);
              ai.tokens = shiftFormationWithBall(ai.tokens, ai.ball.x, landing.x, presser.player.id, ai.half);
              ai.tokens = pushTeamUpfield(ai.tokens, "away", ai.half);
              const shiftedPresser = ai.tokens.find((token) => token.player.id === presser.player.id);
              if (shiftedPresser) ai.ball = { x: shiftedPresser.x, y: shiftedPresser.y };
              ai.stealProtectedSide = "away";
              ai.message = `${presser.player.name} steals the ball with ${help + 1}-player pressure and gets in front of ${carrier.player.name} (${Math.round(stealRoll.chance)}% chance). The opposition team pushes upfield.`;
              if (shiftedPresser) playPitchFx("steal", { x: shiftedPresser.x, y: shiftedPresser.y }, "STOLEN!", { x: carrier.x, y: carrier.y }, presser.side);
            } else {
              ai.message = `${carrier.player.name} evades the opposition's ${help + 1}-player press (${Math.round(stealRoll.chance)}% chance).`;
            }
          }
        } else if (chosenMove || defensiveOptions.length) {
          const { defender, move } = chosenMove ?? defensiveOptions[0];
          const previousDefender = { x: defender.x, y: defender.y };
          defender.x = move.x;
          defender.y = move.y;
          playPitchFx("move", { x: move.x, y: move.y }, undefined, previousDefender, defender.side);
          ai.message = strategy.pressing > 0.72
            ? "The opposition swarms your ball carrier and cuts off the next pass."
            : "The opposition drops into a compact block and marks your passing options.";
        } else {
          ai.message = "The opposition holds shape. Your turn.";
        }
      } else {
        const nearestAway = ai.tokens.filter((token) => token.side === "away" && token.player.position !== "GK")
          .sort((a, b) => distance(a, ai.ball) - distance(b, ai.ball))[0];
        const nearestHome = ai.tokens.filter((token) => token.side === "home")
          .sort((a, b) => distance(a, ai.ball) - distance(b, ai.ball))[0];
        if (nearestAway
          && (!nearestHome || distance(nearestAway, ai.ball) <= distance(nearestHome, ai.ball) + 2)
          && !ai.tokens.some((token) => token.x === ai.ball.x && token.y === ai.ball.y)) {
          const route = findRouteToTargets(ai.tokens, nearestAway, [ai.ball]);
          const moveDistance = 2 + movementBonus(nearestAway.player)
            + (strategy.countering > 0.75 ? 1 : 0);
          const next = route[Math.min(moveDistance, route.length) - 1]
            ?? findBestReachableMove(ai.tokens, nearestAway, moveDistance, (point) =>
              -distance(point, ai.ball) * 2
                + (nearestHome ? Math.max(0, distance(point, nearestHome) - distance(point, ai.ball)) * 0.4 : 0));
          if (next) {
            const previousChaser = { x: nearestAway.x, y: nearestAway.y };
            nearestAway.x = next.x;
            nearestAway.y = next.y;
            playPitchFx("move", { x: next.x, y: next.y }, undefined, previousChaser, nearestAway.side);
            if (next.x === ai.ball.x && next.y === ai.ball.y) {
              ai.stealProtectedSide = undefined;
              ai.message = `${nearestAway.player.name} reaches the loose ball and recovers possession.`;
            } else {
              ai.message = `${nearestAway.player.name} moves around the traffic toward the loose ball.`;
            }
          } else {
            ai.message = "The ball is loose. Your team has the better chance to reach it next turn.";
          }
        } else {
          const cover = ai.tokens.filter((token) => token.side === "away" && token.player.position !== "GK")
            .map((defender) => ({
              defender,
              move: findBestReachableMove(ai.tokens, defender, 2 + movementBonus(defender.player), (point) =>
                -distance(point, ai.ball) * 0.55
                  - Math.abs(point.y - 5) * 0.9
                  - ai.tokens.filter((token) => token.side === "home")
                    .reduce((nearest, threat) => Math.min(nearest, distance(point, threat)), 99) * 0.06),
            }))
            .filter((candidate): candidate is typeof candidate & {
              move: NonNullable<typeof candidate.move>;
            } => !!candidate.move)
            .sort((a, b) => b.move.score - a.move.score)[0];
          if (cover) {
            const previousCover = { x: cover.defender.x, y: cover.defender.y };
            cover.defender.x = cover.move.x;
            cover.defender.y = cover.move.y;
            playPitchFx("move", { x: cover.move.x, y: cover.move.y }, undefined, previousCover, cover.defender.side);
            ai.message = "The opposition drops a defender into the central lane to protect against the loose ball.";
          } else {
            ai.message = "The ball is loose. Your team has the better chance to reach it next turn.";
          }
        }
      }
    }
    const awayMoved = ai.tokens.some((token) =>
      token.side === "away" && originalAwayPositions.get(token.player.id) !== `${token.x},${token.y}`,
    );
    if (!awayMoved && ai.score[1] === originalScore && `${ai.ball.x},${ai.ball.y}` === originalBall) {
      const currentCarrier = ai.tokens.find((token) =>
        token.x === ai.ball.x && token.y === ai.ball.y,
      );
      if (currentCarrier?.side === "home") {
        const goalX = ai.half === 1 ? 0 : 21;
        const pathToGoal = lineCells(currentCarrier, { x: goalX, y: 5 });
        const defenders = ai.tokens.filter((token) => token.side === "away" && token.player.position !== "GK");
        const bestDefender = defenders.map((defender) => ({
          defender,
          move: findBestReachableMove(ai.tokens, defender, 2 + movementBonus(defender.player), (point) => {
            const laneGap = Math.min(...pathToGoal.map((pathPoint) =>
              Math.abs(point.x - pathPoint.x) + Math.abs(point.y - pathPoint.y)));
            const gap = Math.max(Math.abs(point.x - currentCarrier.x), Math.abs(point.y - currentCarrier.y));
            const desiredGap = nutmegTendency > 0.16 && strategy.marking > 0.55 ? 2 : 1;
            const goalSide = (point.x - currentCarrier.x) * (goalX - currentCarrier.x) >= 0 ? 1 : 0;
            return -Math.abs(gap - desiredGap) * 4 - laneGap * (0.6 + strategy.marking)
              + goalSide * strategy.marking * 3
              + (defender.player.position === "DEF" ? strategy.marking * 1.5 : 0)
              - Math.abs(point.y - 5) * 0.18
              + distance(defender, currentCarrier) * strategy.pressing * 0.05;
          }),
        })).filter((candidate): candidate is typeof candidate & {
          move: NonNullable<typeof candidate.move>;
        } => !!candidate.move).sort((a, b) => b.move.score - a.move.score)[0];
        if (bestDefender) {
          const { defender, move } = bestDefender;
          ai.tokens = ai.tokens.map((token) => token.player.id === defender.player.id
            ? { ...token, x: move.x, y: move.y }
            : token);
          ai.message = "The opposition's defense resets: a defender covers the shooting lane and marks the ball carrier.";
        }
      } else {
        const moveTarget = currentCarrier?.side === "away"
          ? currentCarrier
          : ai.tokens.filter((token) => token.side === "away" && token.player.position !== "GK")
            .sort((a, b) => distance(a, ai.ball) - distance(b, ai.ball))[0];
        if (moveTarget) {
          const isCarrier = currentCarrier?.player.id === moveTarget.player.id;
          const move = findBestReachableMove(ai.tokens, moveTarget, 2 + movementBonus(moveTarget.player), (point) =>
            isCarrier
              ? -ownGoalDistance({ ...moveTarget, x: point.x, y: point.y }, ai.half) * 3 - Math.abs(point.y - 5) * 0.3
              : -distance(point, ai.ball) * 2,
          );
          if (move) {
            ai.tokens = ai.tokens.map((token) => token.player.id === moveTarget.player.id
              ? { ...token, x: move.x, y: move.y }
              : token);
            if (isCarrier) {
              ai.ball = { x: move.x, y: move.y };
              ai.tokens = shiftFormationWithBall(ai.tokens, originalBall.split(",").map(Number)[0], move.x, moveTarget.player.id, ai.half);
            }
            ai.message = isCarrier
              ? "The opposition finds a forward route and advances with the ball."
              : "The opposition sends a player to contest the loose ball.";
          }
        }
      }
    }
    ai.turn = "home";
    ai.extraAwayTurns = Math.max(0, ai.extraAwayTurns - 1);
    if (ai.extraAwayTurns > 0) {
      ai.turn = "away";
      window.setTimeout(runAiTurn, 450);
    }
    ai.selected = closestPlayerId(ai.tokens, ai.ball, ai.turn);
    if (expireHomeStealProtection) ai.stealProtectedSide = undefined;
    setMatch(ai);
  }

  function finishOrSet(state: Match, fullTime = false): Match {
    if (fullTime || state.score[0] >= goalTarget || state.score[1] >= goalTarget) {
      const won = state.score[0] > state.score[1];
      const tied = state.score[0] === state.score[1];
      const xpReward = quickplayMode === null ? 100 * state.campaignStage : 100;
      state.message = won
        ? `${fullTime ? "Full time!" : "Victory!"} You win ${state.score[0]}–${state.score[1]} · +${xpReward} XP${quickplayMode === null ? ` · +${30 + state.campaignStage * 5} coins` : ""}.`
        : tied
          ? `Full time! The match ends level at ${state.score[0]}–${state.score[1]}.`
          : `${fullTime ? "Full time!" : "Match over."} The opposition wins ${state.score[0]}–${state.score[1]}.`;
      if (won) {
        const nextXp = xp + xpReward;
        const nextPassLevel = passLevelForXp(nextXp);
        setXp(nextXp);
        setUnlockedPlayers((current) => [...new Set([...current, ...playersAvailableAt(nextPassLevel)])]);
        if (quickplayMode === null) {
          if (state.campaignStage === level) setLevel((value) => value + 1);
          setCoins((value) => value + 30 + state.campaignStage * 5);
        }
        if (battlePassLevel < coins250Level && nextPassLevel >= coins250Level) setCoins((value) => value + 250);
        if (battlePassLevel < coins500Level && nextPassLevel >= coins500Level) setCoins((value) => value + 500);
      }
      setPassMode(false);
      setScreen("victory");
      return { ...state, turn: "home", drivesUsed: 0, actionsUsed: 0, bonusDrives: 0, bonusActions: 0, finished: true };
    }
    return { ...state, turn: "home", drivesUsed: 0, actionsUsed: 0, bonusDrives: 0, bonusActions: 0, message: "The opposition scores. Your turn." };
  }

  useEffect(() => {
    if (match.minute < 90 || match.finished || match.halftime) return;
    setMatch(finishOrSet({ ...match, message: "The referee blows for full time." }, true));
  }, [match.minute, match.finished, match.halftime]);

  function resumeSecondHalf() {
    setMatch((current) => ({ ...current, halftime: false, message: "Second half underway. Away kicks off." }));
    if (quickplaySide === null) window.setTimeout(runAiTurn, 450);
  }

  function moveTo(x: number, y: number) {
    const activeSide = activeSideForClient();
    if (match.turn !== activeSide || match.finished || match.halftime) return;
    const player = match.tokens.find((t) => t.player.id === match.selected && t.side === activeSide);
    if (!player) return;
    if (match.drivesUsed >= 1 + match.bonusDrives) {
      setMatch({ ...match, message: "Your drive is used. Complete an action or end the turn." });
      return;
    }
    if (player.x === x && player.y === y) {
      setMatch({ ...match, message: "Choose an empty tile to move to." });
      return;
    }
    const steps = distance(player, { x, y });
    const hasBall = match.ball.x === player.x && match.ball.y === player.y;
    const maxSteps = 2 + movementBonus(player.player);
    if (steps > maxSteps) {
      setMatch({ ...match, message: `${player.player.name} can move up to ${maxSteps} tiles this turn.` });
      return;
    }
    if (match.tokens.some((t) => t.x === x && t.y === y)) {
      setMatch({ ...match, message: "That tile is occupied. Try an open square." });
      return;
    }
    if (hasBall) recordPlayerAction("carries");
    let updated = {
      ...match,
      drivesUsed: match.drivesUsed + 1,
      tokens: match.tokens.map((t) => t.player.id === player.player.id ? { ...t, x, y } : t),
    };
    if (hasBall) {
      updated.tokens = shiftFormationWithBall(updated.tokens, match.ball.x, x, player.player.id, match.half);
      updated.ball = { x, y };
      if (updated.stealProtectedSide === player.side) updated.stealProtectedSide = undefined;
    }
    if (steps >= 2) playPitchFx(hasBall ? "pass" : "move", { x, y }, undefined, { x: player.x, y: player.y }, player.side);
    if (tutorialStep === 1) {
      setTutorialStep(2);
      setMatch({
        ...updated,
        drivesUsed: 0,
        actionsUsed: 0,
        bonusDrives: 0,
        bonusActions: 0,
        message: "Nice move! Step 2 · Click PASS, then tap your glowing striker ahead.",
      });
      return;
    }
    if (hasBall && ownGoalDistance({ ...player, x }, match.half) === 0) {
      updated.ball = { x, y };
      updated.message = "You're at the goal! Shoot now.";
      setMatch(updated);
      return;
    }
    const message = `${player.player.name} moves ${steps} tile${steps === 1 ? "" : "s"}.`;
    if (updated.drivesUsed >= 1 + updated.bonusDrives && updated.actionsUsed >= 1 + updated.bonusActions) {
      endTurn({ ...updated, message });
    } else {
      setMatch({ ...updated, message });
    }
  }

  function shoot() {
    const activeSide = activeSideForClient();
    const player = match.tokens.find((t) => t.player.id === match.selected && t.side === activeSide);
    if (!player || match.turn !== activeSide || match.ball.x !== player.x || match.ball.y !== player.y || match.finished) {
      setMatch({ ...match, message: "Select the player with the ball to shoot." });
      return;
    }
    if (match.actionsUsed >= 1 + match.bonusActions) {
      setMatch({ ...match, message: "Your action is used. Complete your drive or end the turn." });
      return;
    }
    const dist = ownGoalDistance(player, match.half);
    const range = shotRange(player.player);
    if (dist > range) {
      setMatch({ ...match, message: `${player.player.name} is too far out. Max range: ${range} tiles.` });
      return;
    }
    recordPlayerAction("shots");
    const angle = shotAngleDegrees(player, match.half);
    const baseAccuracy = shotAccuracy(player, match.tokens, dist, angle);
    const accuracy = baseAccuracy;
    const goal = {
      x: player.side === "home" ? (match.half === 1 ? 21 : 0) : (match.half === 1 ? 0 : 21),
      y: 5,
    };
    if (tutorialStep === 3) {
      playPitchFx("goal", goal, "GOAL!", { x: player.x, y: player.y }, player.side);
      const drill = makeTutorialMatch(4, [match.score[0] + 1, match.score[1]], homePlayers);
      previousScore.current = drill.score;
      celebrateGoal(player.side, player.player.name);
      setTutorialStep(4);
      setMatch(drill);
      return;
    }
    if (tutorialStep === 5) {
      const score: [number, number] = [match.score[0] + 1, match.score[1]];
      playPitchFx("goal", goal, "GOAL!", { x: player.x, y: player.y }, player.side);
      celebrateGoal(player.side, player.player.name);
      previousScore.current = score;
      setMatch({
        ...match,
        score,
        ball: goal,
        finished: true,
        drivesUsed: 0,
        actionsUsed: 0,
        bonusDrives: 0,
        bonusActions: 0,
        message: `GOAL! ${player.player.name} buries it — tutorial complete!`,
      });
      tutorialCompleteTimer.current = window.setTimeout(completeTutorial, 1200);
      return;
    }
    const shotPath = lineCells(player, goal);
    const interception = findInterceptor(match.tokens, player.side, shotPath);
    const opponentSide = player.side === "home" ? "away" : "home";
    const block = interception
      ? rollLuck(match, interception.token.side, player.side, interceptionChance(interception.token, "shot", interception.gap))
      : undefined;
    if (block?.success) {
      const tokens = shiftFormationWithBall(block.match.tokens, match.ball.x, interception!.token.x, interception!.token.player.id, match.half);
      const shiftedBlocker = tokens.find((token) => token.player.id === interception!.token.player.id) ?? interception!.token;
      playPitchFx("intercept", { x: shiftedBlocker.x, y: shiftedBlocker.y }, "BLOCKED!", { x: player.x, y: player.y }, interception!.token.side);
      endTurn({
        ...block.match,
        tokens,
        ball: { x: shiftedBlocker.x, y: shiftedBlocker.y },
        selected: shiftedBlocker.player.id,
        stealProtectedSide: undefined,
        message: `${interception!.token.player.name} reads the shot and intercepts it! ${interception!.gap ? "A nearby defender closes the shooting lane." : "A defender blocks the shooting lane."} Their defense gets possession.`,
      });
      return;
    }
    const shot = rollLuck(block?.match ?? match, player.side, opponentSide, accuracy);
    const shotChance = Math.round(shot.chance);
    if (shot.success) {
      playPitchFx("goal", goal, "GOAL!", { x: player.x, y: player.y }, player.side);
      pendingScorer.current = { side: player.side, name: player.player.name };
      if (quickplaySide !== null) {
        const kickoffSide = player.side === "home" ? "away" : "home";
        const kickoff = resetKickoff(shot.match.tokens, kickoffSide, match.half, matchIsSmallSided);
        const score: [number, number] = [...match.score];
        score[player.side === "home" ? 0 : 1] += 1;
        const finished = score[player.side === "home" ? 0 : 1] >= goalTarget;
        setMatch({
          ...shot.match,
          tokens: kickoff.tokens,
          score,
          ball: kickoff.ball,
          turn: kickoffSide,
          selected: closestPlayerId(kickoff.tokens, kickoff.ball, kickoffSide),
          drivesUsed: 0,
          actionsUsed: 0,
          bonusDrives: 0,
          bonusActions: 0,
          stealProtectedSide: undefined,
          finished,
          message: finished ? `${player.player.name} scores the winner!` : `${player.player.name} scores from ${dist} tiles out at a ${angle}° angle (${shotChance}% chance). ${kickoffSide === "home" ? "Home" : "Away"} restarts from kickoff.`,
        });
        if (finished) setScreen("victory");
        return;
      }
      const kickoff = resetKickoff(shot.match.tokens, "away", match.half, matchIsSmallSided);
      const next = { ...shot.match, tokens: kickoff.tokens, ball: kickoff.ball, turn: "away" as const, selected: closestPlayerId(kickoff.tokens, kickoff.ball, "away"), stealProtectedSide: undefined, score: [match.score[0] + 1, match.score[1]] as [number, number], message: `${player.player.name} scores from ${dist} tiles out at a ${angle}° angle (${shotChance}% chance). Away restarts from kickoff.` };
      const finished = finishOrSet(next);
      if (finished.score[0] < goalTarget) {
        finished.turn = "away";
        finished.selected = closestPlayerId(finished.tokens, finished.ball, "away");
        finished.drivesUsed = 0;
        finished.actionsUsed = 0;
        finished.bonusDrives = 0;
        finished.bonusActions = 0;
        setMatch(finished);
        window.setTimeout(runAiTurn, 450);
      } else setMatch(finished);
    } else {
      const tokens = shiftFormationWithBall(shot.match.tokens, match.ball.x, goal.x, player.player.id, match.half);
      playPitchFx("miss", goal, "WIDE!", { x: player.x, y: player.y }, player.side);
      const updated = {
        ...shot.match,
        tokens,
        ball: goal,
        stealProtectedSide: undefined,
        message: `${player.player.name}'s shot sails wide from ${dist} tiles out (${shotChance}% chance). The ball is loose by the goal.`,
      };
      endTurn(updated);
    }
  }

  function clearBall() {
    const activeSide = activeSideForClient();
    const keeper = match.tokens.find((token) => token.player.id === match.selected && token.side === activeSide);
    if (!keeper || keeper.player.position !== "GK" || !isInOwnPenaltyBox(keeper, match.half)
      || keeper.x !== match.ball.x || keeper.y !== match.ball.y || !ownTurn || !canAct) {
      setMatch({ ...match, message: "Select your goalkeeper with the ball inside your penalty box to clear." });
      return;
    }
    const clearance = resolveGoalkeeperClearance(match, keeper);
    playPitchFx("pass", clearance.ball, "CLEARED!", { x: keeper.x, y: keeper.y }, keeper.side);
    endTurn(clearance);
  }

  function pass() {
    if (passMode) {
      setPassMode(false);
      setMatch({ ...match, message: "Pass selection canceled." });
      return;
    }
    const activeSide = activeSideForClient();
    const player = match.tokens.find((t) => t.player.id === match.selected && t.side === activeSide);
    if (!player || match.turn !== activeSide || match.ball.x !== player.x || match.ball.y !== player.y || match.finished) {
      setMatch({ ...match, message: "Select the player with the ball to pass." });
      return;
    }
    if (match.actionsUsed >= 1 + match.bonusActions) {
      setMatch({ ...match, message: "Your action is used. Complete your drive or end the turn." });
      return;
    }
    const passRange = tutorialStep === 2 ? Math.max(14, passingRange(player.player)) : passingRange(player.player);
    const receivers = match.tokens.filter((token) =>
      token.side === player.side
      && token.player.id !== player.player.id
      && distance(player, token) <= passRange,
    );
    if (!receivers.length) {
      setMatch({ ...match, message: `No teammate in passing range (${passRange} tiles).` });
      return;
    }
    setPassMode(true);
    setMatch({ ...match, message: `Choose a highlighted teammate to pass to (up to ${passRange} tiles).` });
  }

  function passTo(receiverId: string) {
    const activeSide = activeSideForClient();
    const player = match.tokens.find((token) => token.player.id === match.selected && token.side === activeSide);
    const receiver = match.tokens.find((token) => token.player.id === receiverId);
    if (!player || !receiver || receiver.side !== player.side || receiver.player.id === player.player.id
      || match.turn !== activeSide || match.finished
      || match.ball.x !== player.x || match.ball.y !== player.y
      || match.actionsUsed >= 1 + match.bonusActions) {
      setPassMode(false);
      setMatch({ ...match, message: "That pass is no longer available. Select the ball carrier and try again." });
      return;
    }
    const passRange = tutorialStep === 2 ? Math.max(14, passingRange(player.player)) : passingRange(player.player);
    if (distance(player, receiver) > passRange) {
      setPassMode(false);
      setMatch({ ...match, message: `That teammate is outside passing range (${passRange} tiles).` });
      return;
    }
    const interceptionPath = lineCells(player, receiver).slice(0, -1);
    recordPlayerAction("passes");
    if (tutorialStep === 2) {
      const tokens = shiftFormationWithBall(match.tokens, match.ball.x, receiver.x, receiver.player.id, match.half);
      const shiftedReceiver = tokens.find((token) => token.player.id === receiver.player.id) ?? receiver;
      playPitchFx("pass", { x: shiftedReceiver.x, y: shiftedReceiver.y }, "PASS!", { x: player.x, y: player.y }, player.side);
      setPassMode(false);
      setTutorialStep(3);
      setMatch({
        ...match,
        tokens,
        ball: { x: shiftedReceiver.x, y: shiftedReceiver.y },
        selected: receiver.player.id,
        drivesUsed: 0,
        actionsUsed: 0,
        bonusDrives: 0,
        bonusActions: 0,
        stealProtectedSide: undefined,
        message: "Great pass! Step 3 · Click SHOOT, or tap the glowing goal net to score.",
      });
      return;
    }
    const interceptor = findInterceptor(match.tokens, player.side, interceptionPath);
    const passRoll = interceptor
      ? rollLuck(match, interceptor.token.side, player.side, interceptionChance(interceptor.token, "pass", interceptor.gap))
      : undefined;
    if (passRoll?.success) {
      const tokens = shiftFormationWithBall(passRoll.match.tokens, match.ball.x, interceptor!.token.x, interceptor!.token.player.id, match.half);
      const shiftedInterceptor = tokens.find((token) => token.player.id === interceptor!.token.player.id) ?? interceptor!.token;
      playPitchFx("intercept", { x: shiftedInterceptor.x, y: shiftedInterceptor.y }, "INTERCEPTED!", { x: player.x, y: player.y }, interceptor!.token.side);
      const updated = {
        ...passRoll.match,
        tokens,
        ball: { x: shiftedInterceptor.x, y: shiftedInterceptor.y },
        selected: shiftedInterceptor.player.id,
        stealProtectedSide: undefined,
        message: `${interceptor!.token.player.name} steps into ${player.player.name}'s pass and intercepts it!`,
      };
      setPassMode(false);
      endTurn(updated);
      return;
    }
    const passBase = passRoll?.match ?? match;
    const tokens = shiftFormationWithBall(passBase.tokens, match.ball.x, receiver.x, receiver.player.id, match.half);
    const shiftedReceiver = tokens.find((token) => token.player.id === receiver.player.id) ?? receiver;
    playPitchFx("pass", { x: shiftedReceiver.x, y: shiftedReceiver.y }, distance(player, receiver) >= 4 ? "GREAT BALL!" : "PASS!", { x: player.x, y: player.y }, player.side);
    const updated = { ...passBase, tokens, ball: { x: shiftedReceiver.x, y: shiftedReceiver.y }, selected: receiver.player.id, stealProtectedSide: undefined, message: `Pass completed to ${receiver.player.name}; both teams shift with the ball.` };
    setPassMode(false);
    spendAction(updated, updated.message);
  }

  function steal() {
    const activeSide = activeSideForClient();
    const defender = match.tokens.find((token) => token.player.id === match.selected && token.side === activeSide);
    const carrier = match.tokens.find((token) => token.x === match.ball.x && token.y === match.ball.y && token.side !== activeSide);
    if (!defender || !carrier || !ownTurn || !adjacent(defender, carrier) || match.finished) {
      setMatch({ ...match, message: "Select one of your defenders next to the opposing ball carrier to attempt a steal." });
      return;
    }
    if (!canAct) {
      setMatch({ ...match, message: "Your action is used. Complete your drive or end the turn." });
      return;
    }
    if (match.stealProtectedSide === carrier.side) {
      setMatch({ ...match, message: `${carrier.player.name} is protected from an immediate steal-back. Move or pass before they can be challenged again.` });
      return;
    }
    const chance = stealChanceFor(defender, carrier, match.half);
    const stealRoll = tutorialStep === 4
      ? { success: true, chance: 100, match }
      : rollLuck(match, defender.side, carrier.side, chance);
    if (stealRoll.success) {
      const landing = stealLanding(stealRoll.match.tokens, defender, carrier, match.half);
      let tokens = stealRoll.match.tokens.map((token) => token.player.id === defender.player.id
        ? { ...token, x: landing.x, y: landing.y }
        : token);
      tokens = shiftFormationWithBall(tokens, match.ball.x, landing.x, defender.player.id, match.half);
      tokens = pushTeamUpfield(tokens, defender.side, match.half);
      const shiftedDefender = tokens.find((token) => token.player.id === defender.player.id) ?? defender;
      playPitchFx("steal", { x: shiftedDefender.x, y: shiftedDefender.y }, "STOLEN!", { x: defender.x, y: defender.y }, defender.side);
      if (tutorialStep === 4) {
        setTutorialStep(5);
        setMatch({
          ...stealRoll.match,
          tokens,
          ball: { x: shiftedDefender.x, y: shiftedDefender.y },
          selected: defender.player.id,
          drivesUsed: 0,
          actionsUsed: 0,
          bonusDrives: 0,
          bonusActions: 0,
          stealProtectedSide: defender.side,
          message: "Clean steal! Final step (5/5) · Move, pass and shoot to score one more goal.",
        });
        return;
      }
      const updated = {
        ...stealRoll.match,
        tokens,
        ball: { x: shiftedDefender.x, y: shiftedDefender.y },
        selected: defender.player.id,
        stealProtectedSide: defender.side,
        message: `${defender.player.name} wins the ball and steps in front of ${carrier.player.name} (${Math.round(stealRoll.chance)}% chance). ${defender.side === "home" ? "Your" : "Opposition"} forwards push upfield.`,
      };
      spendAction(updated, updated.message);
      return;
    }
    endTurn({
      ...stealRoll.match,
      message: `${defender.player.name}'s steal attempt is evaded (${Math.round(stealRoll.chance)}% chance). ${carrier.player.name} keeps possession.`,
    });
  }

  function nutmeg() {
    const activeSide = activeSideForClient();
    const player = match.tokens.find((t) => t.player.id === match.selected && t.side === activeSide);
    if (!player || match.turn !== activeSide || match.ball.x !== player.x || match.ball.y !== player.y || match.finished) {
      setMatch({ ...match, message: "Select the player with the ball to try a nutmeg." });
      return;
    }
    if (match.actionsUsed >= 1 + match.bonusActions) {
      setMatch({ ...match, message: "Your action is used. Complete your drive or end the turn." });
      return;
    }
    const defender = match.tokens.filter((t) => t.side !== player.side && distance(player, t) <= 1)
      .sort((a, b) => distance(player, a) - distance(player, b))[0];
    if (!defender) {
      setMatch({ ...match, message: "A defender must be next to you to attempt a nutmeg." });
      return;
    }
    recordPlayerAction("nutmegs");
    const dx = Math.sign(defender.x - player.x);
    const dy = Math.sign(defender.y - player.y);
    const behindX = defender.x + dx;
    const behindY = defender.y + dy;
    const behindBlocked = behindX < 0 || behindX > 21 || behindY < 0 || behindY > 10
      || match.tokens.some((t) => t.x === behindX && t.y === behindY);
    const nx = behindBlocked ? defender.x : behindX;
    const ny = behindBlocked ? defender.y : behindY;
    const chance = nutmegChance(player.player);
    const nutmegRoll = rollLuck(match, player.side, defender.side, chance);
    if (nutmegRoll.success) {
      let updated = {
        ...nutmegRoll.match,
        tokens: nutmegRoll.match.tokens.map((t) => {
          if (t.player.id === player.player.id) return { ...t, x: nx, y: ny };
          if (behindBlocked && t.player.id === defender.player.id) return { ...t, x: player.x, y: player.y };
          return t;
        }),
        ball: { x: nx, y: ny },
        stealProtectedSide: undefined,
      };
      updated.tokens = shiftFormationWithBall(updated.tokens, match.ball.x, nx, player.player.id, match.half);
      const shiftedCarrier = updated.tokens.find((token) => token.player.id === player.player.id);
      if (shiftedCarrier) updated.ball = { x: shiftedCarrier.x, y: shiftedCarrier.y };
      playPitchFx("pass", updated.ball, "NUTMEG!", { x: player.x, y: player.y }, player.side);
      spendAction(updated, `${player.player.name} nutmegs ${defender.player.name}! ${Math.round(nutmegRoll.chance)}% odds — bonus drive and action earned.`, true);
    } else {
      const opponentSide = player.side === "home" ? "away" : "home";
      const tokens = shiftFormationWithBall(nutmegRoll.match.tokens, match.ball.x, defender.x, defender.player.id, match.half);
      const shiftedDefender = tokens.find((token) => token.player.id === defender.player.id) ?? defender;
      playPitchFx("steal", { x: shiftedDefender.x, y: shiftedDefender.y }, "TACKLED!", { x: player.x, y: player.y }, defender.side);
      setMatch({
        ...nutmegRoll.match,
        tokens,
        ball: { x: shiftedDefender.x, y: shiftedDefender.y },
        selected: closestPlayerId(tokens, { x: shiftedDefender.x, y: shiftedDefender.y }, opponentSide),
        turn: opponentSide,
        drivesUsed: 0,
        actionsUsed: 0,
        bonusDrives: 0,
        bonusActions: 0,
        extraAwayTurns: 2,
        bonusTurnSide: quickplaySide !== null ? opponentSide : undefined,
        stealProtectedSide: undefined,
        message: `Nutmeg fails! ${defender.player.name} wins it. ${quickplaySide !== null ? `${opponentSide === "home" ? "Home" : "Away"} gets two turns.` : "The opposition gets two turns."}`,
      });
      if (quickplaySide === null) window.setTimeout(runAiTurn, 450);
    }
  }

  function onCellClick(x: number, y: number) {
    const token = match.tokens.find((t) => t.x === x && t.y === y);
    const activeSide = activeSideForClient();
    if (passMode) {
      if (token && eligiblePassIds.has(token.player.id)) {
        passTo(token.player.id);
      } else {
        setMatch({ ...match, message: "Choose one of the highlighted teammates to receive the pass." });
      }
      return;
    }
    if (token && token.player.id === nutmegTargetId) {
      nutmeg();
      return;
    }
    if (token && ownTurn && canSteal && token.player.id === opposingCarrier?.player.id) {
      steal();
      return;
    }
    if (!token && ownTurn && canShoot && x === attackingGoalX && y >= 4 && y <= 6) {
      shoot();
      return;
    }
    if (ownTurn && availableMoveKeys.has(`${x},${y}`)) {
      moveTo(x, y);
      return;
    }
    if (token?.side === activeSide && match.turn === activeSide && !match.finished) {
      setMatch({ ...match, selected: token.player.id, message: abilityDescription(token.player) });
      return;
    }
    if (!token && ownTurn) {
      setMatch({ ...match, message: "Tap a highlighted tile to move this player." });
    }
  }

  const selectedPlayer = match.tokens.find((t) => t.player.id === match.selected);
  const activeSide = activeSideForClient();
  const ownTurn = match.turn === activeSide && !match.finished && !match.halftime
    && (quickplayMode !== "online" || onlineReady);
  const attackingGoalX = activeSide === "home" ? (match.half === 1 ? 21 : 0) : (match.half === 1 ? 0 : 21);
  const movementRange = selectedPlayer ? 2 + movementBonus(selectedPlayer.player) : 0;
  const passReach = selectedPlayer
    ? (tutorialStep === 2 ? Math.max(14, passingRange(selectedPlayer.player)) : passingRange(selectedPlayer.player))
    : 5;
  const eligiblePassIds = new Set(
    selectedPlayer && ownTurn && selectedPlayer.side === activeSide
      && selectedPlayer.x === match.ball.x && selectedPlayer.y === match.ball.y
      && match.actionsUsed < 1 + match.bonusActions
      ? match.tokens.filter((token) => token.side === selectedPlayer.side
        && token.player.id !== selectedPlayer.player.id
        && distance(selectedPlayer, token) <= passReach
        && (tutorialStep !== 2 || ownGoalDistance(token, match.half) < ownGoalDistance(selectedPlayer, match.half)))
        .map((token) => token.player.id)
      : [],
  );
  const occupiedKeys = new Set(match.tokens.map((token) => `${token.x},${token.y}`));
  const availableMoveKeys = new Set<string>();
  if (selectedPlayer && ownTurn && selectedPlayer.side === activeSide && match.drivesUsed < 1 + match.bonusDrives) {
    for (let y = Math.max(0, selectedPlayer.y - movementRange); y <= Math.min(10, selectedPlayer.y + movementRange); y += 1) {
      for (let x = Math.max(0, selectedPlayer.x - movementRange); x <= Math.min(21, selectedPlayer.x + movementRange); x += 1) {
        const key = `${x},${y}`;
        if (distance(selectedPlayer, { x, y }) > 0
          && distance(selectedPlayer, { x, y }) <= movementRange
          && !occupiedKeys.has(key)) {
          availableMoveKeys.add(key);
        }
      }
    }
  }
  const pitchCameraX = selectedPlayer ? cap((selectedPlayer.x / 21) * 100 - 35.714, 0, 28.572) : 0;
  const pitchCameraY = selectedPlayer ? cap((selectedPlayer.y / 10) * 100 - 35.714, 0, 28.572) : 14.286;
  const canAct = match.actionsUsed < 1 + match.bonusActions;
  const canShoot = !!selectedPlayer && canAct && selectedPlayer.side === activeSide && selectedPlayer.x === match.ball.x && selectedPlayer.y === match.ball.y && ownGoalDistance(selectedPlayer, match.half) <= shotRange(selectedPlayer.player);
  const canShowGoalkeeperClear = selectedPlayer?.side === activeSide
    && selectedPlayer.player.position === "GK" && isInOwnPenaltyBox(selectedPlayer, match.half);
  const clearTarget = canShowGoalkeeperClear ? goalkeeperClearTarget(selectedPlayer, match.tokens, match.half) : null;
  const clearDistance = clearTarget && selectedPlayer ? distance(selectedPlayer, clearTarget) : 0;
  const clearAccuracy = selectedPlayer ? goalkeeperClearAccuracy(selectedPlayer.player, clearDistance) : 0;
  const canClear = canShowGoalkeeperClear && canAct
    && selectedPlayer.x === match.ball.x && selectedPlayer.y === match.ball.y;
  const nutmegDefender = selectedPlayer && canAct
    && selectedPlayer.side === activeSide
    && selectedPlayer.x === match.ball.x
    && selectedPlayer.y === match.ball.y
    ? match.tokens.filter((token) => token.side !== selectedPlayer.side && distance(selectedPlayer, token) <= 1)
      .sort((a, b) => distance(selectedPlayer, a) - distance(selectedPlayer, b))[0]
    : undefined;
  const nutmegTargetId = nutmegDefender?.player.id;
  const canNutmeg = !!nutmegDefender;
  const opposingCarrier = match.tokens.find((token) =>
    token.side !== activeSide && token.x === match.ball.x && token.y === match.ball.y,
  );
  const stealChance = selectedPlayer
    ? stealChanceFor(selectedPlayer, opposingCarrier ?? selectedPlayer, match.half)
    : 50;
  const canSteal = !!selectedPlayer && canAct && !!opposingCarrier
    && selectedPlayer.side === activeSide && adjacent(selectedPlayer, opposingCarrier)
    && match.stealProtectedSide !== opposingCarrier.side;
  const selectedOpponentSide = selectedPlayer?.side === "home" ? "away" : "home";
  const displayedShotChance = tutorialStep === 3 || tutorialStep === 5
    ? 100
    : selectedPlayer && canShoot
      ? luckAdjustedChance(match, selectedPlayer.side, selectedOpponentSide,
        shotAccuracy(selectedPlayer, match.tokens, ownGoalDistance(selectedPlayer, match.half),
          shotAngleDegrees(selectedPlayer, match.half)))
      : 0;
  const displayedClearChance = selectedPlayer
    ? luckAdjustedChance(match, selectedPlayer.side, selectedOpponentSide, clearAccuracy)
    : 0;
  const displayedNutmegChance = selectedPlayer
    ? luckAdjustedChance(match, selectedPlayer.side, selectedOpponentSide, nutmegChance(selectedPlayer.player))
    : 0;
  const displayedStealChance = tutorialStep === 4
    ? 100
    : selectedPlayer && opposingCarrier
      ? luckAdjustedChance(match, selectedPlayer.side, opposingCarrier.side, stealChance)
      : 50;
  const tutorialGuide: TutorialGuide | null = tutorialStep === 1
    ? {
      title: "Step 1 of 5 · Move into space",
      detail: "Tap the glowing mint tile ahead (or any highlighted dot) to dribble forward with the ball.",
      highlightTile: { x: 10, y: 5 },
    }
    : tutorialStep === 2
      ? {
        title: "Step 2 of 5 · Pass to a teammate",
        detail: "Click PASS, then tap your open striker ahead to complete the pass.",
      }
      : tutorialStep === 3
        ? {
          title: "Step 3 of 5 · Score a goal",
          detail: "You're in shooting range. Click SHOOT, or tap the glowing goal net.",
          highlightTile: { x: 21, y: 5 },
        }
        : tutorialStep === 4
          ? {
            title: "Step 4 of 5 · Win the ball back",
            detail: "An opponent has the ball right next to you. Click STEAL, or tap their player.",
            highlightTokenId: opposingCarrier?.player.id,
          }
          : tutorialStep === 5
            ? {
              title: "Step 5 of 5 · Score one more",
              detail: "Move upfield into shooting range, then click SHOOT to finish the drill (+150 XP & +50 coins).",
            }
            : null;
  const fxTeamColor = pitchFx?.side
    ? kitColorById(pitchFx.side === "home" ? homeKitColorId : awayKitColorId).value
    : "#4fd9c8";
  const fxColor = pitchFx
    ? pitchFx.kind === "goal"
      ? "#b9ffe4"
      : pitchFx.kind === "intercept" || pitchFx.kind === "miss"
        ? "#e8775d"
        : pitchFx.kind === "steal"
          ? "#f2d79a"
          : fxTeamColor
    : "#4fd9c8";
  const homeLuck = luckPercent(match.luck.home);
  const awayLuck = luckPercent(match.luck.away);
  const luckChecks = Math.max(match.luck.home.attempts, match.luck.away.attempts);
  const homeLuckLabel = quickplayMode === "cpu" || quickplayMode === null ? "YOU" : "HOME";
  const awayLuckLabel = quickplayMode === "cpu" || quickplayMode === null ? "CPU" : "AWAY";

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (capturingEndTurnKey) {
        event.preventDefault();
        if (event.code === "Escape") {
          setCapturingEndTurnKey(false);
          return;
        }
        if (["ShiftLeft", "ShiftRight", "ControlLeft", "ControlRight", "AltLeft", "AltRight", "MetaLeft", "MetaRight"].includes(event.code)) return;
        setEndTurnKey(event.code);
        setCapturingEndTurnKey(false);
        setNotice(`End turn key set to ${displayKey(event.code)}.`);
        return;
      }
      if (!endTurnKey || event.code !== endTurnKey || screen !== "match" || !ownTurn
        || event.repeat || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      const target = event.target;
      if (target instanceof HTMLElement
        && (target.isContentEditable || target.closest("button, a, input, textarea, select, [contenteditable='true']"))) return;
      event.preventDefault();
      endTurn({
        ...match,
        message: quickplaySide !== null ? "Turn passed. Hand the device to the other player." : "You end your turn. The opposition is up next.",
      });
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [capturingEndTurnKey, endTurnKey, screen, ownTurn, match, quickplaySide]);

  return (
    <main className={`app-shell ${matchFullscreen && screen === "match" ? "match-fullscreen" : ""}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Manrope:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box} body{margin:0;background:#0b1512;color:#eafaf4;font-family:Manrope,Arial,sans-serif}
        button{font:inherit;color:inherit;border:0;cursor:pointer}.app-shell{min-height:100vh;background:radial-gradient(ellipse at 52% -20%,#173b31 0%,#0d1a16 45%,#0b1512 78%);padding:0 30px 50px}
        .topbar{height:76px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #ffffff13;max-width:1380px;margin:auto}
        .brand{display:flex;gap:11px;align-items:center;font-weight:800;letter-spacing:.06em}.brand-mark{width:34px;height:34px;border-radius:10px;background:#8ff2c8;color:#0a241c;display:grid;place-items:center;font-size:19px}
        .brand small{display:block;font-family:'DM Mono',monospace;font-weight:400;font-size:9px;color:#93a9a0;letter-spacing:.16em;margin-top:2px}
        .nav{display:flex;gap:7px;flex-wrap:wrap}.nav button,.ghost-btn{background:transparent;color:#aebfb6;padding:10px 14px;border-radius:9px;font-size:12px;font-weight:700}.nav button:hover,.nav button.active{background:#ffffff0c;color:#8ff2c8}
        .wallet{display:flex;gap:9px;align-items:center;font-family:'DM Mono',monospace;font-size:12px}.coin{color:#b9ffe4}.xp-pill{color:#9fb5ab;border-left:1px solid #ffffff22;padding-left:12px}
        .content{max-width:1280px;margin:0 auto}.eyebrow{font:500 10px 'DM Mono',monospace;letter-spacing:.2em;color:#8ff2c8;text-transform:uppercase}
        h1{font-size:clamp(32px,4vw,52px);letter-spacing:-.055em;line-height:1.02;margin:13px 0 12px}.subtitle{color:#93a9a0;font-size:14px;line-height:1.7;max-width:550px;margin:0}
        .hero{padding:58px 0 38px;display:flex;justify-content:space-between;align-items:end;gap:25px}.hero-cta{display:flex;gap:10px}
        .primary{background:#8ff2c8;color:#0a241c;padding:13px 19px;border-radius:9px;font-weight:800;font-size:12px;box-shadow:0 6px 25px #8ff2c81c}.primary:hover{background:#a9ffdc;transform:translateY(-1px)}.primary:disabled{opacity:.52;cursor:not-allowed;box-shadow:none}
        .secondary{background:#ffffff0b;border:1px solid #ffffff15;padding:12px 17px;border-radius:9px;font-size:12px;font-weight:700}.secondary:hover{background:#ffffff14}
        .home-grid{display:grid;grid-template-columns:1.25fr .75fr;gap:18px}.panel{background:#101c18;border:1px solid #ffffff12;border-radius:14px;padding:22px}
        .panel-heading{display:flex;justify-content:space-between;align-items:center;margin-bottom:19px}.panel-heading h2{font-size:14px;margin:0;letter-spacing:-.02em}.panel-heading span{font:10px 'DM Mono',monospace;color:#8ba39a;text-transform:uppercase;letter-spacing:.1em}
        .campaign-card{background:linear-gradient(120deg,#1a352b,#12241d);border:1px solid #8ff2c821;border-radius:12px;padding:19px;display:flex;justify-content:space-between;align-items:center;margin-bottom:17px}
        .campaign-card strong{font-size:14px}.campaign-card p{font-size:11px;color:#919d92;margin:5px 0 0}.badge{background:#8ff2c818;color:#8ff2c8;border-radius:100px;padding:6px 9px;font:10px 'DM Mono',monospace}
        .progress-track{height:5px;background:#ffffff12;border-radius:10px;overflow:hidden;margin:14px 0 7px}.progress-fill{height:100%;background:#8ff2c8;border-radius:10px;transition:width .25s}.small-note{font:10px 'DM Mono',monospace;color:#8da59b}
        .player-list{display:grid;grid-template-columns:1fr 1fr;gap:9px}.player-chip{border:1px solid #ffffff10;background:#ffffff04;border-radius:10px;padding:11px;display:flex;gap:9px;align-items:center}.player-avatar{width:31px;height:31px;flex:none;border-radius:9px;display:grid;place-items:center;color:#111;font:700 10px 'DM Mono',monospace}
        .player-chip b{font-size:10px;display:block}.player-chip small{font-size:9px;color:#92a79e}.rating{margin-left:auto;color:#c9dad2;font:10px 'DM Mono',monospace}
        .pass-track{display:flex;gap:8px;overflow:hidden}.reward{min-width:88px;flex:1;border:1px solid #ffffff12;border-radius:10px;background:#ffffff04;text-align:center;padding:12px 6px}.reward .reward-icon{font-size:19px;margin-bottom:8px}.reward b{display:block;font:10px 'DM Mono',monospace}.reward small{color:#8da59b;font-size:9px}
        .reward.unlocked{border-color:#8ff2c846;background:#8ff2c80a}.reward.locked{opacity:.48}
        .match-layout{display:grid;grid-template-columns:minmax(0,1fr) 280px;gap:17px;align-items:start;padding-top:26px}.match-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}.scorebox{text-align:center}.scorebox strong{font:700 25px 'DM Mono',monospace;letter-spacing:.08em}.scorebox small{display:block;color:#92a79e;font:9px 'DM Mono',monospace;margin-top:5px;text-transform:uppercase;letter-spacing:.15em}.match-clock{display:block;color:#b9ffe4;font:700 13px 'DM Mono',monospace;margin-top:5px}.halftime-panel{display:flex;justify-content:space-between;align-items:center;gap:14px;background:#163026;border:1px solid #8ff2c855;border-radius:10px;padding:13px 16px;margin-bottom:12px}.halftime-panel strong{font-size:13px}.halftime-panel small{display:block;color:#a8bcb3;font-size:10px;margin-top:4px}
        .pitch-wrap{padding:12px;background:#0f1b17;border:1px solid #ffffff14;border-radius:14px}.pitch-viewport{width:100%;aspect-ratio:22/11;overflow:hidden;position:relative;border-radius:8px;background:#1f4b39;container-type:inline-size}.pitch{width:140%;height:auto;aspect-ratio:22/11;display:grid;grid-template-columns:repeat(22,1fr);grid-template-rows:repeat(11,1fr);position:relative;overflow:hidden;border-radius:8px;background:repeating-linear-gradient(90deg,#1f4b39 0%,#1f4b39 10%,#235542 10%,#235542 20%);border:1px solid #c3e8d650;transition:transform .35s ease}
        .pitch:before{content:"";position:absolute;top:0;bottom:0;left:50%;border-left:1px solid #d6f2e666;z-index:1;pointer-events:none}.pitch:after{content:"";position:absolute;left:50%;top:50%;width:15%;aspect-ratio:1;border:1px solid #d6f2e666;border-radius:50%;transform:translate(-50%,-50%);pointer-events:none}
        .goal-overlay{position:absolute;inset:0;pointer-events:none;z-index:3}.penalty-box{position:absolute;top:25%;height:50%;width:10%;border:1px solid #d6f2e666}.penalty-box.left{left:0;border-left:0}.penalty-box.right{right:0;border-right:0}.goal-frame{position:absolute;top:38%;height:24%;width:2.5%;border:2px solid #e6fff6dd;background:repeating-linear-gradient(0deg,#e3fff512 0 5px,#e3fff544 5px 6px);box-shadow:0 0 8px #c8ffec66}.goal-frame.left{left:-.2%;border-left:0;border-radius:0 4px 4px 0}.goal-frame.right{right:-.2%;border-right:0;border-radius:4px 0 0 4px}
        .cell{position:relative;z-index:2;border-right:1px solid #d6f2e60c;border-bottom:1px solid #d6f2e60c;display:grid;place-items:center;background:transparent;padding:0}.cell:hover{background:#ffffff17}.cell.goal-left{border-right:2px solid #d6f2e6a0}.cell.goal-right{border-left:2px solid #d6f2e6a0}.cell.move-available{background:#8ff2c80d}.move-marker{position:absolute;width:43%;aspect-ratio:1;border:1px solid #c4ffe6aa;border-radius:50%;background:#b6ffde44;box-shadow:0 0 14px #b6ffde33;pointer-events:none;transition:transform .16s ease,background .16s ease}.cell.move-available:hover .move-marker{transform:scale(1.2);background:#c2ffe677}.cell.pass-target{background:#4fd9c826;box-shadow:inset 0 0 0 2px #4fd9c8aa}.cell.nutmeg-target{background:#b9ffe41c;box-shadow:inset 0 0 0 2px #b9ffe488}.interaction-marker{position:absolute;z-index:4;right:4%;bottom:4%;width:58%;aspect-ratio:1;border-radius:50%;display:grid;place-items:center;font:700 clamp(6px,.65vw,9px) 'DM Mono',monospace;color:#061a15;border:1px solid #ffffffdd;box-shadow:0 1px 5px #0009;pointer-events:none}.pass-marker{background:#4fd9c8}.nutmeg-marker{background:#b9ffe4}
        .token{width:clamp(12px,2.4cqw,36px);height:clamp(12px,2.4cqw,36px);border-radius:50%;display:grid;place-items:center;font:700 clamp(6px,1cqw,14px) 'DM Mono',monospace;color:#0a1a16;box-shadow:0 2px 8px #0008;position:relative;transition:transform .22s cubic-bezier(.22,1,.36,1),box-shadow .22s ease,outline-color .22s ease}
        .token.away{background:#ec695e!important;color:#fff}.token.selected{outline:2px solid white;outline-offset:2px;box-shadow:0 0 14px #fff8;transform:scale(1.12)}
        .token.pass-highlight{outline:3px solid #4fd9c8;outline-offset:2px;box-shadow:0 0 18px #4fd9c8cc}
        .token.nutmeg-highlight{outline:3px solid #8ff2c8;outline-offset:2px;box-shadow:0 0 18px #8ff2cbcc}
        .token.steal-highlight{outline:3px solid #f2d79a;outline-offset:2px;box-shadow:0 0 18px #f2d79acc}
        .token.tutorial-highlight{outline:3px solid #b9ffe4;outline-offset:3px;animation:token-guide 1.15s ease-in-out infinite}
        @keyframes token-guide{0%,100%{box-shadow:0 0 12px #b9ffe488;transform:scale(1)}50%{box-shadow:0 0 26px #b9ffe4cc;transform:scale(1.12)}}
        .legend{display:flex;gap:14px;color:#9fb5ab;font:9px 'DM Mono',monospace;padding:12px 3px 2px}.legend i{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:5px}.message{padding:11px 13px;border-radius:9px;background:#ffffff08;color:#c3d5cc;font-size:11px;line-height:1.5;margin-top:12px;min-height:40px}
        .sidebar{display:flex;flex-direction:column;gap:12px}.side-panel{background:#101c18;border:1px solid #ffffff12;border-radius:13px;padding:17px}.side-panel h3{font-size:12px;margin:0 0 12px}.selected-card{display:flex;gap:11px;align-items:center}.selected-card .player-avatar{width:40px;height:40px}.selected-card b{font-size:11px}.selected-card small{display:block;color:#92a79e;font-size:9px;margin-top:3px}.ability{font-size:10px;color:#8ff2c8;margin-top:12px;line-height:1.5}.action-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.action{padding:10px 7px;background:#ffffff08;border:1px solid #ffffff10;border-radius:8px;font-size:10px;font-weight:700}.action:hover:not(:disabled){border-color:#8ff2c877;color:#8ff2c8}.action:disabled{opacity:.35;cursor:not-allowed}.chance{display:block;font:9px 'DM Mono',monospace;color:#94a9a1;margin-top:4px}.luck-row{display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin-top:10px}.luck-row b{font-size:10px;letter-spacing:.06em}.luck-row small{display:block;color:#92a79e;font-size:9px;margin-top:3px;font-weight:400;letter-spacing:0}.luck-row strong{font:700 16px 'DM Mono',monospace;color:#8ff2c8}.luck-row strong.luck-hot{color:#f2d79a}.luck-row strong.luck-cold{color:#7fe7d2}.luck-bar{height:4px;background:#ffffff12;border-radius:99px;overflow:hidden;margin-top:6px}.luck-bar span{display:block;height:100%;background:#8ff2c8;border-radius:99px;transition:width .3s ease}.luck-note{color:#93a9a0;font-size:10px;line-height:1.7;margin-top:12px}
        .locker-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:11px;margin-top:22px}.roster-card{background:#101c18;border:1px solid #ffffff12;border-radius:12px;padding:15px}.roster-top{display:flex;align-items:center;gap:10px}.roster-card h3{font-size:12px;margin:0}.roster-card p{color:#93a9a0;font-size:10px;line-height:1.5;min-height:31px}.roster-meta{display:flex;justify-content:space-between;align-items:center;font:9px 'DM Mono',monospace;color:#8ff2c8}.roster-meta select{background:#152b24;color:#e2efe9;border:1px solid #ffffff20;border-radius:6px;padding:5px;font:9px 'DM Mono',monospace}.format-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:11px;margin-top:16px}.format-card{background:#101c18;border:1px solid #ffffff12;border-radius:12px;padding:15px}.format-card h3{font-size:12px;margin:0 0 7px}.format-card p{color:#93a9a0;font-size:10px;min-height:28px}.format-card button{width:100%;margin-top:10px}
        .quickplay-page{padding-top:48px}.quickplay-options{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:13px;margin-top:25px}.quickplay-option{background:#101c18;border:1px solid #ffffff16;border-radius:14px;padding:21px;min-height:192px;display:flex;flex-direction:column;align-items:flex-start;text-align:left}.quickplay-option:hover:not(:disabled){border-color:#8ff2c877;transform:translateY(-2px)}.quickplay-option strong{font-size:15px;margin:13px 0 7px}.quickplay-option p{font-size:11px;color:#93a9a0;line-height:1.65;margin:0 0 18px}.quickplay-option .badge{margin-top:auto}.quickplay-option.disabled{opacity:.62;cursor:not-allowed}.quickplay-icon{font-size:23px}
        .ai-difficulty{margin-top:22px}.ai-difficulty input{width:100%;accent-color:#8ff2c8;margin:17px 0 8px}.ai-difficulty-scale{display:flex;justify-content:space-between;gap:12px;color:#93a9a0;font:9px 'DM Mono',monospace}.ai-difficulty-note{color:#93a9a0;font-size:10px;line-height:1.6;margin:11px 0 0}.ai-evolution-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:14px 0 0}.ai-evolution-stats span{background:#ffffff05;border:1px solid #ffffff10;border-radius:9px;padding:9px 10px}.ai-evolution-stats strong{display:block;font:700 13px 'DM Mono',monospace;color:#b9ffe4}.ai-evolution-stats small{display:block;margin-top:3px;color:#92a79e;font:8px 'DM Mono',monospace;text-transform:uppercase;letter-spacing:.06em}@media(max-width:520px){.ai-evolution-stats{grid-template-columns:1fr 1fr}}
        .online-setup{max-width:none;margin-top:18px}.online-setup>input{display:block;width:100%;margin-top:8px}.online-room-actions{display:grid;grid-template-columns:1fr minmax(130px,.7fr) auto;gap:9px;align-items:end;margin-top:15px}.online-room-actions input{min-width:0}.online-setup-link{display:inline-block;margin-top:12px;color:#8ff2c8;font-size:10px}
        .pass-page{margin-top:26px}.pass-banner{background:linear-gradient(100deg,#183a2f,#12241d);border:1px solid #8ff2c820;border-radius:14px;padding:24px;margin:21px 0}.pass-banner h2{font-size:18px;margin:0}.pass-banner p{font-size:11px;color:#9db3aa}.pass-levels{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:10px}.level-card{background:#101c18;border:1px solid #ffffff12;border-radius:11px;padding:15px}.level-card h3{font:11px 'DM Mono',monospace;color:#8ff2c8;margin:0 0 9px}.level-card b{font-size:12px}.level-card p{font-size:10px;color:#94a9a1;min-height:26px}.level-card.player-reward{display:flex;flex-direction:column;min-height:160px}.level-card.player-reward .player-avatar{margin-bottom:10px}.victory-page{max-width:900px;margin:70px auto;background:linear-gradient(145deg,#163026,#101c18);border:1px solid #8ff2c866;border-radius:20px;padding:clamp(24px,6vw,58px);text-align:center;box-shadow:0 22px 90px #0008}.victory-page .victory-icon{font-size:50px}.victory-page h1{margin-top:14px}.victory-score{font:700 clamp(38px,7vw,68px) 'DM Mono',monospace;color:#b9ffe4;letter-spacing:.08em;margin:24px 0}.victory-page p{color:#aebfb6;line-height:1.7}.victory-reward{display:inline-block;margin:12px 0 24px;padding:11px 16px;border:1px solid #8ff2c844;border-radius:9px;color:#b9ffe4;font:12px 'DM Mono',monospace}.victory-actions{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin-top:18px}
        .campaign-page{padding-top:38px}.campaign-levels{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:11px;margin:24px 0}.campaign-level{min-height:145px;background:#101c18;border:1px solid #ffffff14;border-radius:12px;padding:15px;text-align:left}.campaign-level.available{border-color:#8ff2c855}.campaign-level.locked{opacity:.52;cursor:not-allowed}.campaign-level h3{font:11px 'DM Mono',monospace;color:#8ff2c8;margin:0 0 11px}.campaign-level strong{font-size:13px}.campaign-level p{font-size:10px;color:#94a9a1;margin:7px 0 12px}.campaign-level .badge{display:inline-block}
        .settings-page{padding-top:40px}.settings-card{max-width:760px;margin-top:24px;background:#101c18;border:1px solid #ffffff12;border-radius:14px;padding:22px}.setting-row{display:flex;justify-content:space-between;align-items:center;gap:18px;padding:16px 0;border-bottom:1px solid #ffffff12}.setting-row:last-child{border-bottom:0}.setting-copy strong{display:block;font-size:13px}.setting-copy small{display:block;color:#93a9a0;font-size:10px;line-height:1.6;margin-top:5px}.setting-options{display:flex;gap:7px;flex-wrap:wrap}.setting-options button{background:#ffffff0b;border:1px solid #ffffff18;border-radius:8px;padding:9px 12px;font-size:10px}.setting-options button.active{background:#8ff2c818;border-color:#8ff2c875;color:#8ff2c8}.switch-btn{min-width:76px}.game-caption{position:absolute;z-index:6;left:50%;bottom:16px;transform:translateX(-50%);width:max-content;max-width:85%;padding:8px 13px;border:1px solid #ffffff35;border-radius:8px;background:#101713e8;color:#fff;text-align:center;line-height:1.45;box-shadow:0 5px 16px #0007;pointer-events:none}.game-caption.small{font-size:15px}.game-caption.medium{font-size:19.5px}.game-caption.large{font-size:24px}.match-fullscreen{position:fixed;inset:0;z-index:20;overflow:auto;padding:0 22px 18px;background:#0b1512}.match-fullscreen .topbar{display:none}.match-fullscreen .match-layout{max-width:none;min-height:100vh;padding-top:18px;grid-template-columns:minmax(0,1fr) 300px;align-items:center}.match-fullscreen .pitch-viewport{width:100%}.match-fullscreen .pitch-wrap{padding:14px}.match-fullscreen .pitch{width:100%;transform:none!important}
        .toast{position:fixed;right:24px;bottom:23px;background:#c9ffe9;color:#0a241c;padding:12px 17px;border-radius:9px;font-size:11px;font-weight:700;box-shadow:0 10px 40px #0008;z-index:9}
        @media(max-width:850px){.app-shell{padding:0 16px 35px}.hero{padding-top:37px;align-items:start;flex-direction:column}.home-grid{grid-template-columns:1fr}.match-layout{grid-template-columns:1fr}.sidebar{display:grid;grid-template-columns:1fr 1fr}.nav{gap:0}.nav button{padding:9px 8px;font-size:10px}.wallet{font-size:10px}.topbar{gap:8px}.pitch-wrap{padding:7px}.format-grid{grid-template-columns:1fr}.quickplay-options{grid-template-columns:1fr}.match-fullscreen{padding:0 12px 14px}.match-fullscreen .match-layout{grid-template-columns:1fr;align-items:start;padding-top:12px}.match-fullscreen .pitch-wrap{padding:7px}}
        @media(max-width:520px){.brand{font-size:12px}.brand small{font-size:7px}.brand-mark{width:29px;height:29px}.nav button{font-size:9px;padding:8px 6px}.wallet .xp-pill{display:none}.sidebar{grid-template-columns:1fr}.hero-cta{width:100%}.hero-cta button{flex:1}.player-list{grid-template-columns:1fr 1fr}.match-top{gap:8px}.match-top .ghost-btn{padding:7px}.pitch-wrap{padding:4px}.cell{border-width:0 1px 1px 0}.setting-row{align-items:flex-start;flex-direction:column}.online-room-actions{grid-template-columns:1fr}.match-fullscreen{padding:0 6px 10px}.match-fullscreen .pitch-wrap{padding:4px}}
      `}</style>
      <style>{`
        .store-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:13px;margin:18px 0 30px}
        .store-card{background:#101c18;border:1px solid #ffffff16;border-radius:13px;padding:17px}
        .store-card h3{font-size:14px;margin:0 0 8px}.store-card p{color:#93a9a0;font-size:10px;line-height:1.55;min-height:32px}
        .store-card .primary,.store-card .secondary{width:100%;margin-top:12px}
        .store-card .primary:disabled,.store-card .secondary:disabled{opacity:1;cursor:not-allowed;transform:none;filter:none}
        .store-card .primary:disabled{box-shadow:0 6px 25px #8ff2c81c}
        .store-card .secondary:disabled{box-shadow:none}
        .store-card .secondary.sold:disabled{background:#1d3730;border-color:#ffffff18;color:#8da59b}
        .store-kicker{font:10px 'DM Mono',monospace;color:#8ff2c8;letter-spacing:.08em;text-transform:uppercase}
        .store-timer{font:11px 'DM Mono',monospace;color:#f2d578}
        .kit-preview{width:28px;height:28px;border-radius:50%;display:inline-grid;place-items:center;border:1px solid #ffffff55;vertical-align:middle;margin-right:8px}
        .kit-warning{background:#46251f;border:1px solid #e8775d88;border-radius:9px;padding:12px 14px;color:#ffb19a;font-size:11px;line-height:1.55;margin:12px 0}
        .store-notice{background:#173028;border:1px solid #8ff2c833;border-radius:10px;padding:12px 14px;color:#cfdfd7;font-size:11px;line-height:1.6;margin:16px 0}
        .crate-overlay{position:fixed;inset:0;z-index:30;background:#070a08eF;display:grid;place-items:center;padding:20px;backdrop-filter:blur(8px)}
        .crate-dialog{width:min(440px,100%);background:linear-gradient(145deg,#17322a,#0d1c17);border:1px solid #8ff2c866;border-radius:18px;padding:27px;text-align:center;box-shadow:0 24px 90px #000b}
        .crate-box{font-size:76px;line-height:1.2;margin:13px auto 19px;filter:drop-shadow(0 0 20px #8ff2c855)}
        .crate-box.shaking{animation:crate-shake .16s ease-in-out infinite alternate}
        .crate-result{animation:crate-reveal .55s cubic-bezier(.2,.8,.2,1) both}
        .crate-result-color{width:55px;height:55px;border-radius:15px;margin:12px auto;border:2px solid #ffffff99;box-shadow:0 0 28px #ffffff38}
        @keyframes crate-shake{from{transform:rotate(-9deg) scale(1)}to{transform:rotate(9deg) scale(1.09)}}
        @keyframes crate-reveal{from{opacity:0;transform:translateY(17px) scale(.8)}to{opacity:1;transform:translateY(0) scale(1)}}
        .token.home{background:var(--team-color)!important;color:#0a1a16}
        .token.away{background:var(--team-color)!important;color:#fff}
        @media(max-width:850px){.store-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media(max-width:520px){.store-grid{grid-template-columns:1fr}}
      `}</style>
      <style>{`
        .formation-panel{background:#101c18;border:1px solid #ffffff14;border-radius:14px;padding:22px;margin-top:24px}
        .formation-toolbar,.locker-roster-toolbar{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap}
        .formation-toolbar select,.locker-roster-toolbar select,.role-player-select{appearance:none;background:#152b24;color:#e7f3ed;border:1px solid #35534a;border-radius:8px;padding:10px 36px 10px 12px;font:600 11px Manrope,Arial,sans-serif;outline:none}
        .formation-toolbar select:focus,.locker-roster-toolbar select:focus,.role-player-select:focus{border-color:#8ff2c8;box-shadow:0 0 0 2px #8ff2c824}
        .formation-toolbar select option,.locker-roster-toolbar select option,.role-player-select option{background:#101c18;color:#eff8f3}
        .formation-field{position:relative;display:grid;grid-template-columns:repeat(22,minmax(0,1fr));grid-template-rows:repeat(11,minmax(26px,1fr));aspect-ratio:22/11;min-height:290px;margin:20px auto;background:repeating-linear-gradient(90deg,#1f4b39 0%,#1f4b39 10%,#235542 10%,#235542 20%);border:1px solid #c4e6d866;border-radius:12px;overflow:hidden}
        .formation-field:before{content:"";position:absolute;inset:0 auto 0 50%;border-left:1px solid #d6f2e655;pointer-events:none}
        .formation-field:after{content:"";position:absolute;left:50%;top:50%;width:14%;aspect-ratio:1;border:1px solid #d6f2e655;border-radius:50%;transform:translate(-50%,-50%);pointer-events:none}
        .formation-slot{z-index:1;align-self:center;justify-self:center;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;width:clamp(34px,5.6vw,65px);min-height:43px;padding:4px 2px;background:#0d221cd9;border:1px solid #ffffff70;border-radius:9px;color:#f1fbf6;cursor:pointer;box-shadow:0 2px 8px #0008}
        .formation-slot:hover,.formation-slot.selected{border-color:#8ff2c8;box-shadow:0 0 0 2px #8ff2c855,0 0 14px #8ff2c855}
        .formation-slot .slot-position{font:700 8px 'DM Mono',monospace;color:#8ff2c8}
        .formation-slot .slot-player{font-size:8px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .role-assignment{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;padding:14px;background:#ffffff06;border:1px solid #ffffff12;border-radius:10px}
        .role-assignment small{display:block;color:#a1b5ac;font-size:10px;margin-top:4px}
        .locker-roster-toolbar{background:#101c18;border:1px solid #ffffff12;border-radius:11px;padding:12px 15px;margin-top:28px}
        .locker-roster-toolbar label{font:10px 'DM Mono',monospace;letter-spacing:.1em;color:#a8bcb3}
        .locker-roster-toolbar select{min-width:210px}
        @media(max-width:700px){.formation-panel{padding:15px}.formation-field{min-height:230px;grid-template-rows:repeat(11,minmax(20px,1fr))}.formation-slot{width:clamp(27px,7vw,46px);min-height:34px}.formation-slot .slot-player{font-size:7px}.role-assignment{align-items:flex-start;flex-direction:column}.role-player-select{width:100%}}
      `}</style>
      <style>{`
        .screen-enter{animation:screen-fade .26s cubic-bezier(.22,1,.36,1) both}
        @keyframes screen-fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .pitch-token-layer{position:absolute;inset:0;z-index:5;pointer-events:none}
        .pitch-token-slot,.pitch-ball-slot{position:absolute;top:0;left:0;width:calc(100% / 22);height:calc(100% / 11);display:grid;place-items:center;transition:transform 320ms cubic-bezier(.22,1,.36,1);will-change:transform}
        .pitch-ball-slot{z-index:6;transition:transform 280ms cubic-bezier(.22,1,.36,1)}
        .ball-badge{width:clamp(7px,1.05cqw,16px);height:clamp(7px,1.05cqw,16px);border-radius:50%;background:radial-gradient(circle at 35% 35%,#ffffff,#d3e8e0);border:1.5px solid #0a1a16;box-shadow:0 0 9px #ffffffcc;transform:translate(68%,-68%)}
        .ball-loose{font-size:clamp(12px,2.4cqw,36px);filter:drop-shadow(0 2px 4px #0009);animation:ball-bob 1.4s ease-in-out infinite}
        @keyframes ball-bob{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-2px) scale(1.08)}}
        .cell.goal-target{background:#8ff2c82e;box-shadow:inset 0 0 0 2px #8ff2c8cc;animation:goal-target-pulse 1.25s ease-in-out infinite}
        @keyframes goal-target-pulse{0%,100%{background:#8ff2c81c}50%{background:#8ff2c840}}
        .goal-reticle{font-size:clamp(9px,1.5cqw,20px);filter:drop-shadow(0 1px 4px #000c);pointer-events:none}
        .cell.tutorial-target-cell{background:#b9ffe43a;box-shadow:inset 0 0 0 2.5px #b9ffe4;animation:goal-target-pulse 1.05s ease-in-out infinite}
        .move-marker{animation:move-pulse 1.5s ease-in-out infinite}
        @keyframes move-pulse{0%,100%{transform:scale(.92);opacity:.85}50%{transform:scale(1.08);opacity:1}}
        .pitch-vfx-svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:6}
        .vfx-line{fill:none;stroke-linecap:round;stroke-width:2.2;stroke-dasharray:260;stroke-dashoffset:260;animation:vfx-draw .55s cubic-bezier(.22,1,.36,1) forwards}
        @keyframes vfx-draw{0%{stroke-dashoffset:260;opacity:1}72%{stroke-dashoffset:0;opacity:1}100%{stroke-dashoffset:0;opacity:0}}
        .pitch-callout{position:absolute;z-index:7;transform:translate(-50%,-120%);padding:4px 10px;border-radius:7px;font:800 clamp(9px,1.1cqw,13px) 'DM Mono',monospace;letter-spacing:.08em;color:#fff;background:#0c1a16eb;border:1px solid color-mix(in srgb,var(--fx-color,#4fd9c8) 65%,transparent);box-shadow:0 6px 18px #000a,0 0 12px color-mix(in srgb,var(--fx-color,#4fd9c8) 30%,transparent);pointer-events:none;white-space:nowrap;animation:callout-pop 1.15s cubic-bezier(.22,1,.36,1) forwards}
        .pitch-callout.goal{border-color:#b9ffe4;color:#eafff7;background:#0f3a30f2}
        .pitch-callout.steal{border-color:#f2d79a;color:#fff7e6;background:#2f2a1aef}
        .pitch-callout.intercept,.pitch-callout.miss{border-color:#e8775d;color:#ffe7e0;background:#3a1c17ef}
        @keyframes callout-pop{0%{opacity:0;transform:translate(-50%,-70%) scale(.75)}18%{opacity:1;transform:translate(-50%,-130%) scale(1.06)}80%{opacity:1;transform:translate(-50%,-145%) scale(1)}100%{opacity:0;transform:translate(-50%,-170%) scale(.94)}}
        .goal-banner{position:absolute;inset:0;z-index:8;display:grid;place-items:center;pointer-events:none;background:radial-gradient(circle,#8ff2c83d,transparent 70%);animation:goal-overlay-fade 1.9s ease both}
        .goal-banner-card{background:#0b1512f2;border:2px solid #8ff2c8;border-radius:14px;padding:13px 26px;text-align:center;box-shadow:0 16px 48px #000c;animation:goal-card-pop .55s cubic-bezier(.22,1,.36,1) both}
        .goal-banner-card strong{display:block;font-size:clamp(22px,3.6cqw,42px);letter-spacing:.1em;color:#8ff2c8}
        .goal-banner-card small{display:block;margin-top:4px;font:600 clamp(9px,1.1cqw,13px) 'DM Mono',monospace;color:#eafaf4;letter-spacing:.06em}
        @keyframes goal-overlay-fade{0%{opacity:0}12%{opacity:1}82%{opacity:1}100%{opacity:0}}
        @keyframes goal-card-pop{0%{transform:scale(.72) translateY(10px)}60%{transform:scale(1.06)}100%{transform:scale(1) translateY(0)}}
        .goal-net-flash{position:absolute;top:33%;height:34%;width:4%;z-index:4;pointer-events:none;background:radial-gradient(circle,#e6fff6e6,#8ff2c800 70%);animation:net-flash .85s ease-out both}
        .goal-net-flash.left{left:0}.goal-net-flash.right{right:0}
        @keyframes net-flash{0%{opacity:0;transform:scale(.5)}25%{opacity:1;transform:scale(1.4)}100%{opacity:0;transform:scale(1.9)}}
        .pitch-goal-flash{position:absolute;inset:0;z-index:3;pointer-events:none;background:#8ff2c8;animation:pitch-flash .7s ease-out both}
        @keyframes pitch-flash{0%{opacity:0}18%{opacity:.34}100%{opacity:0}}
        .tutorial-banner{display:flex;justify-content:space-between;align-items:center;gap:14px;background:linear-gradient(120deg,#123a30,#12241d);border:1px solid #b9ffe466;border-radius:12px;padding:12px 16px;margin-bottom:12px;flex-wrap:wrap}
        .tutorial-banner strong{display:block;font-size:13px;color:#b9ffe4}
        .tutorial-banner span{display:block;font-size:12px;color:#d9efe7;margin-top:3px;line-height:1.5}
        .tutorial-dots{display:flex;gap:5px;margin-top:8px}
        .tutorial-dots i{display:block;width:24px;height:4px;border-radius:99px;background:#ffffff1f}
        .tutorial-dots i.done{background:#4fd9c8}
        .tutorial-dots i.active{background:#b9ffe4}
        .welcome-tutorial-card{display:flex;justify-content:space-between;align-items:center;gap:16px;background:linear-gradient(120deg,#12352c,#101c18);border:1px solid #b9ffe44d;border-radius:14px;padding:18px 22px;margin-bottom:18px;flex-wrap:wrap}
        .welcome-tutorial-card strong{font-size:15px;color:#f4fffb;display:block}
        .welcome-tutorial-card p{margin:4px 0 0;font-size:12px;color:#a5bdb3}
        .tutorial-dialog{width:min(470px,100%);background:linear-gradient(145deg,#173b31,#0e1c18);border:1px solid #b9ffe466;border-radius:18px;padding:28px;text-align:center;box-shadow:0 24px 90px #000b}
        .tutorial-dialog .tutorial-medal{font-size:60px;line-height:1.2;margin:6px auto 12px;filter:drop-shadow(0 0 20px #8ff2c866)}
        .tutorial-dialog h2{margin:6px 0 8px;font-size:25px;color:#b9ffe4;letter-spacing:-.02em}
        .tutorial-dialog p{color:#a9bfb6;font-size:12px;line-height:1.7;margin:0 0 8px}
        .tutorial-reward{display:inline-block;margin:12px 0 18px;padding:10px 16px;border:1px solid #8ff2c866;border-radius:9px;color:#d8ffef;font:12px 'DM Mono',monospace;background:#8ff2c814}
        .tutorial-dialog .victory-actions{display:flex;justify-content:center;gap:9px;flex-wrap:wrap}
        .action.recommended{border-color:#b9ffe4;background:#b9ffe414;color:#eafff8;box-shadow:0 0 0 1px #b9ffe455,0 0 16px #b9ffe41f}
        .kit-select{position:relative;min-width:220px}
        .kit-select-trigger{display:flex;align-items:center;gap:9px;width:100%;background:#152b24;color:#e7f3ed;border:1px solid #35534a;border-radius:8px;padding:9px 11px;font:600 11px Manrope,Arial,sans-serif;text-align:left}
        .kit-select-trigger:hover{border-color:#8ff2c877}
        .kit-select.open .kit-select-trigger{border-color:#8ff2c8;box-shadow:0 0 0 2px #8ff2c824}
        .kit-swatch{width:18px;height:18px;border-radius:50%;border:1px solid #ffffff55;flex:0 0 auto;box-shadow:inset 0 0 0 1px #0003}
        .kit-select-name{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .kit-chevron{color:#8ff2c8;font-size:10px}
        .kit-select-menu{position:absolute;z-index:25;top:calc(100% + 6px);right:0;min-width:100%;width:max-content;max-width:290px;max-height:250px;overflow:auto;background:#101c18;border:1px solid #35534a;border-radius:10px;padding:5px;box-shadow:0 18px 44px #000c;animation:kit-menu-in .16s ease both}
        .kit-option{display:flex;align-items:center;gap:9px;width:100%;background:transparent;color:#dbece4;border-radius:7px;padding:8px 9px;font:600 11px Manrope,Arial,sans-serif;text-align:left}
        .kit-option:hover{background:#ffffff0a;color:#fff}
        .kit-option.selected{background:#8ff2c814;color:#eafff8}
        .kit-check{width:14px;text-align:center;color:#8ff2c8;font-size:11px}
        @keyframes kit-menu-in{0%{opacity:0;transform:translateY(-4px)}100%{opacity:1;transform:translateY(0)}}
        @media(max-width:520px){.kit-select{min-width:0;width:100%}.kit-select-menu{left:0;right:auto;width:100%;max-width:none}}
        @media(prefers-reduced-motion:reduce){
          .screen-enter,.move-marker,.ball-loose,.vfx-line,.pitch-callout,.goal-banner,.goal-banner-card,.goal-net-flash,.pitch-goal-flash,.cell.goal-target,.cell.tutorial-target-cell,.token.tutorial-highlight{animation:none!important}
          .pitch,.pitch-token-slot,.pitch-ball-slot,.token,button{transition:none!important}
        }
      `}</style>
      <header className="topbar">
        <div className="brand"><div className="brand-mark">⚽</div><div>BLITZ LEAGUE<small>TACTICAL PITCH · SEASON 01</small></div></div>
        <nav className="nav">
          <button className={screen === "home" ? "active" : ""} onClick={() => { stopQuickplay(); setScreen("home"); }}>DASHBOARD</button>
          <button className={screen === "campaign" ? "active" : ""} onClick={() => { stopQuickplay(); setScreen("campaign"); }}>CAMPAIGN</button>
          <button className={screen === "quickplay" ? "active" : ""} onClick={showQuickplayOptions}>QUICKPLAY</button>
          <button className={screen === "match" && quickplayMode === "tutorial" ? "active" : ""} onClick={startTutorial}>TUTORIAL</button>
          <button className={screen === "locker" ? "active" : ""} onClick={() => setScreen("locker")}>LOCKER ROOM</button>
          <button className={screen === "store" ? "active" : ""} onClick={() => setScreen("store")}>STORE</button>
          <button className={screen === "pass" ? "active" : ""} onClick={() => setScreen("pass")}>SEASON PASS</button>
          <button className={screen === "settings" ? "active" : ""} onClick={() => { setPassMode(false); setScreen("settings"); }}>SETTINGS</button>
        </nav>
        <div className="wallet"><span className="coin">◈ {devToolsEnabled ? "∞ DEV" : coins}</span><span className="xp-pill">LV {battlePassLevel}</span></div>
      </header>

      {devToolsEnabled && <div className="store-notice" style={{ maxWidth: 1280, margin: "12px auto 0", borderColor: "#e5bd4b88", color: "#f3d982" }}>
        DEV TOOLS ACTIVE · local development only · unlimited coins · all content unlocked · match win control enabled · progress is not saved
      </div>}

      {screen === "home" && <div className="content">
        <section className="hero">
          <div><div className="eyebrow">Turn-based football · season one</div><h1>Own the pitch.</h1><p className="subtitle">Build your MLS-inspired squad, outplay the opposition, and find the back of the net. Every move matters.</p></div>
          <div className="hero-cta"><button className="primary" onClick={() => setScreen("campaign")}>▶ &nbsp;CAMPAIGN MAP</button><button className="secondary" onClick={showQuickplayOptions}>⚡ &nbsp;QUICKPLAY</button><button className="secondary" onClick={startTutorial}>🎓 &nbsp;TUTORIAL</button><button className="secondary" onClick={() => setScreen("locker")}>LOCKER ROOM</button></div>
        </section>
        {!tutorialCompleted && <div className="welcome-tutorial-card">
          <div>
            <strong>New here? Learn the game in one guided match</strong>
            <p>A Training XI walks you through moving, passing, scoring, and stealing. Finish the drill for +150 XP and +50 coins.</p>
          </div>
          <button className="primary" onClick={startTutorial}>🎓 &nbsp;START TUTORIAL</button>
        </div>}
        <div className="home-grid">
          <section className="panel">
            <div className="panel-heading"><h2>Campaign trail</h2><span>Progression</span></div>
            <button className="campaign-card" style={{ width: "100%", textAlign: "left", cursor: "pointer" }} onClick={() => setScreen("campaign")}><div><strong>Match {Math.min(level, campaignStageCount)} · {campaignFormatLabel(Math.min(level, campaignStageCount))}</strong><p>Campaign matches rotate between Classic, Street 3v3, and Golden Goal.</p></div><span className="badge">OPEN MAP →</span></button>
            <div className="small-note">BATTLE PASS · LEVEL {battlePassLevel} OF {battlePassFinalLevel}</div><div className="progress-track"><div className="progress-fill" style={{ width: `${passProgress}%` }} /></div>
            <div className="small-note">{battlePassLevel === battlePassFinalLevel ? "Final level complete" : `${nextLevelXpTarget - xp} XP to Level ${battlePassLevel + 1}`}</div>
            <div className="panel-heading" style={{ marginTop: 25 }}><h2>Your starting XI</h2><span>{startingXI.length} on field · {homePlayers.length} available · avg {startingXI.length ? Math.round(startingXI.reduce((total, player) => total + overallRating(player), 0) / startingXI.length) : 0} OVR</span></div>
            <div className="player-list">{startingXI.map((player) => <div className="player-chip" key={player.id}><div className="player-avatar" style={{ background: player.color }}>{player.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}</div><div><b>{player.name}</b><small>{player.club} · {player.position}</small></div><span className="rating">{overallRating(player)}</span></div>)}</div>
          </section>
          <section className="panel">
            <div className="panel-heading"><h2>Season pass</h2><button className="ghost-btn" onClick={() => setScreen("pass")}>VIEW ALL ↗</button></div>
            <div className="pass-track">{[battlePassLevel, battlePassLevel + 1, battlePassLevel + 2]
              .filter((rewardLevel) => rewardLevel <= battlePassFinalLevel)
              .map((rewardLevel) => {
                const playerReward = playerRewardsByLevel[rewardLevel];
                const formatReward = formats.find((format) => format.unlock === rewardLevel);
                const coinReward = rewardLevel === coins250Level ? "250 coins" : rewardLevel === coins500Level ? "500 coins" : undefined;
                const label = rewardLevel === 1 ? "Starting XI" : playerReward?.name ?? formatReward?.name ?? coinReward ?? "Reward";
                return <div key={rewardLevel} className={`reward ${rewardLevel <= battlePassLevel ? "unlocked" : "locked"}`}>
                  <div className="reward-icon">{rewardLevel === 1 ? "⚽" : formatReward ? "🏟" : coinReward ? "◈" : "🏅"}</div><b>LEVEL {rewardLevel}</b><small>{label}</small>
                  <small>{xpRequiredForPassLevel(rewardLevel).toLocaleString()} XP total</small>
                </div>;
              })}</div>
            <div className="panel-heading" style={{ marginTop: 29 }}><h2>Choose your format</h2><span>Unlocked formats</span></div>
            {formats.map((f) => <div key={f.id} className="campaign-card" style={{ padding: "13px 15px", marginBottom: 8, opacity: formatUnlocked(f) ? 1 : .5 }}><div><strong style={{ fontSize: 11 }}>{f.name}</strong><p>{f.detail}</p></div><span className="badge">{formatUnlocked(f) ? (activeFormat === f.id ? "ACTIVE" : "READY") : `LV ${f.unlock}`}</span></div>)}
          </section>
        </div>
      </div>}

      {screen === "campaign" && <div className="content campaign-page">
        <button className="ghost-btn" onClick={() => setScreen("home")}>← DASHBOARD</button>
        <div className="eyebrow" style={{ marginTop: 25 }}>Your road to the final</div>
        <h1>Campaign</h1>
        <p className="subtitle">All {campaignStageCount} levels are shown. Win the current match to unlock the next; locked matches cannot be started early. AI difficulty climbs from Level 1 to its strongest researched policy at Level 100.</p>
        <div className="pass-banner"><h2>{level > campaignStageCount ? "Campaign complete" : `Next up: Level ${level}`}</h2><p>{level > campaignStageCount ? "You have beaten every campaign level. Replay any level whenever you like." : `${Math.max(0, Math.min(level - 1, campaignStageCount))} of ${campaignStageCount} levels complete · earn ${100 * level} XP and ${30 + level * 5} coins for a win at this stage.`}</p></div>
        <div className="campaign-levels">{campaignStageNames.map((name, index) => {
          const stage = index + 1;
          const unlocked = stage <= level;
          const completed = stage < level;
          const stageFormat = campaignFormatForStage(stage);
          return <button key={stage} className={`campaign-level ${unlocked ? "available" : "locked"}`} disabled={!unlocked} onClick={() => startMatch(stage)}>
            <h3>LEVEL {String(stage).padStart(2, "0")} {completed ? "· COMPLETE" : ""}</h3>
            <strong>{name}</strong>
            <p>{campaignFormatLabel(stage)} · AI level {Math.min(stage, 100)} · {100 * stage} XP · {30 + stage * 5} coins · first to {stageFormat === "golden-goal" ? 1 : stageFormat === "small-sided" ? 2 : 3} goals</p>
            <span className="badge">{completed ? "REPLAY" : unlocked ? "PLAY LEVEL →" : "🔒 BEAT LEVEL " + (stage - 1)}</span>
          </button>;
        })}</div>
      </div>}

      {screen === "settings" && <div className="content settings-page">
        <div className="eyebrow">Game preferences</div>
        <h1>Settings</h1>
        <p className="subtitle">Adjust how Blitz League presents gameplay. Your choices are saved on this device.</p>
        <section className="settings-card">
          <div className="panel-heading"><h2>Gameplay captions</h2><span>Accessibility</span></div>
          <div className="setting-row">
            <div className="setting-copy"><strong>Show action captions</strong><small>Briefly display narration on the pitch after moves, passes, shots, goals, and possession changes.</small></div>
            <div className="setting-options"><button className={`switch-btn ${captionsEnabled ? "active" : ""}`} onClick={() => setCaptionsEnabled((enabled) => !enabled)} aria-pressed={captionsEnabled}>{captionsEnabled ? "ON" : "OFF"}</button></div>
          </div>
          <div className="setting-row">
            <div className="setting-copy"><strong>Caption size</strong><small>Choose the size of the on-pitch captions.</small></div>
            <div className="setting-options">{(["small", "medium", "large"] as CaptionSize[]).map((size) =>
              <button key={size} className={captionSize === size ? "active" : ""} onClick={() => setCaptionSize(size)} aria-pressed={captionSize === size}>{size.toUpperCase()}</button>,
            )}</div>
          </div>
          <div className="setting-row">
            <div className="setting-copy"><strong>End turn key</strong><small>Click bind, then press the key you want, like Minecraft controls. Escape cancels. Unbind to disable the shortcut.</small></div>
            <div className="setting-options">
              <button className={capturingEndTurnKey ? "active" : ""} onClick={() => setCapturingEndTurnKey(true)}>
                {capturingEndTurnKey ? "PRESS A KEY…" : displayKey(endTurnKey)}
              </button>
              <button className="switch-btn" onClick={() => { setEndTurnKey(null); setCapturingEndTurnKey(false); }}>UNBIND</button>
            </div>
          </div>
        </section>
      </div>}

      {screen === "store" && <div className="content" style={{ paddingTop: 40 }}>
        <div className="eyebrow">Daily deals · spend coins · kit drops</div>
        <h1>Transfer market</h1>
        <p className="subtitle">Sign players, top up Season Pass XP, and open crates for squad rewards and club colors. Your purchases are saved on this device.</p>
        <div className="store-notice">◈ {devToolsEnabled ? "Unlimited dev coins" : `${coins} coins available`} · All crates include one random team color. Duplicate colors convert to 25 coins. Crates also contain a player or a format; the listed odds apply while that reward type is still available.</div>
        <div className="panel-heading" style={{ marginTop: 28 }}><h2>Today’s player offers</h2><span className="store-timer">Refreshes in {formatCountdown(nextDailyReset - storeNow)}</span></div>
        <div className="store-grid">{activeDailyOffers.map((player) => {
          const offerKey = `${dailyOfferDateKey}:${player.id}`;
          const price = dailyOfferPrice(player);
          const owned = unlockedPlayers.includes(player.id);
          const purchased = !!dailyOfferPurchases[offerKey];
          return <article className="store-card" key={player.id}>
            <div className="store-kicker">{player.position} · {player.club}</div>
            <h3 style={{ marginTop: 9 }}>{player.name}</h3>
            <p>{player.ability}{player.position === "GK" ? ` · Clearing ${goalkeeperClearing(player)}` : ""}</p>
            <div className="roster-meta"><span>MEAN STATS · {player.rating} RATING + {player.abilityStat} ABILITY{player.position === "GK" ? ` + ${goalkeeperClearing(player)} CLEARING` : ""}</span><strong>{meanPlayerStats(player)} AVG</strong></div>
            <button className={purchased ? "secondary sold" : owned ? "secondary" : "primary"} disabled={owned || purchased || (!devToolsEnabled && coins < price)}
              onClick={() => buyDailyOffer(player)}>
              {owned ? "IN YOUR SQUAD" : purchased ? "SOLD TODAY" : `SIGN · ◈ ${price}`}
            </button>
          </article>;
        })}</div>

        <div className="panel-heading"><h2>Buy Season Pass XP</h2><span>4 XP per coin</span></div>
        <div className="store-grid">{[25, 100, 250].map((price) => <article className="store-card" key={price}>
          <div className="store-kicker">Progress boost</div><h3>{(price * 4).toLocaleString()} XP</h3>
          <p>Moves you closer to your next reward. XP stops at Season Pass Level {battlePassFinalLevel}.</p>
          <button className="primary" disabled={!devToolsEnabled && (coins < price || xp >= maxPassXp)} onClick={() => buyXp(price)}>
            {!devToolsEnabled && xp >= maxPassXp ? "PASS COMPLETE" : devToolsEnabled ? "FREE DEV PURCHASE" : `BUY · ◈ ${price}`}
          </button>
        </article>)}</div>

        <div className="panel-heading"><h2>Crates</h2><span>Random rewards · color included every time</span></div>
        <div className="store-grid">
          <article className="store-card">
            <div className="store-kicker">Starter crate</div><h3>Basic Crate</h3>
            <p>Low-cost drop. 92% player / 8% custom formation odds while both reward pools have rewards remaining; players are mostly below 76 OVR. Includes a random kit color.</p>
            <button className="primary" disabled={!devToolsEnabled && coins < 80} onClick={() => openCrate("basic")}>{devToolsEnabled ? "OPEN FREE · DEV" : "OPEN · ◈ 80"}</button>
          </article>
          <article className="store-card">
            <div className="store-kicker">Premium crate</div><h3>Blitz Crate</h3>
            <p>Higher-tier drop: 78% featured player (85+ OVR) / 22% custom formation while both reward pools have rewards remaining, plus a random kit color.</p>
            <button className="primary" disabled={!devToolsEnabled && coins < 350} onClick={() => openCrate("blitz")}>{devToolsEnabled ? "OPEN FREE · DEV" : "OPEN · ◈ 350"}</button>
          </article>
          <article className="store-card" style={{ borderColor: thanksgivingActive ? "#d19a4b77" : "#ffffff16" }}>
            <div className="store-kicker" style={{ color: thanksgivingActive ? "#f2c276" : undefined }}>Limited-time · Thanksgiving</div>
            <h3>Thanksgiving Crate</h3>
            <p>Same 78% player / 22% custom formation odds and price as Blitz while both reward pools have rewards remaining, with a different reward pool. Includes a random kit color.</p>
            {thanksgivingActive
              ? <div className="store-timer">ENDS NOV 30, 2026 · {formatCountdown(thanksgivingTimeLeft)}</div>
              : <div className="store-timer">EVENT ENDED · NOV 30, 2026</div>}
            <button className="primary" disabled={!thanksgivingActive || (!devToolsEnabled && coins < 350)} onClick={() => openCrate("thanksgiving")}>
              {thanksgivingActive ? devToolsEnabled ? "OPEN FREE · DEV" : "OPEN · ◈ 350" : "NO LONGER AVAILABLE"}
            </button>
          </article>
        </div>
      </div>}

      {screen === "locker" && <div className="content" style={{ paddingTop: 40 }}>
        <div className="eyebrow">Your club · manage squad</div><h1>Locker room</h1><p className="subtitle">Choose a formation, then assign exact players to specific pitch roles like left back, central midfielder, or striker. Formations are unlocked from crates. OVR weights ability twice: (base rating + 2 × ability) ÷ 3.</p>
        <section className="settings-card" style={{ maxWidth: "none", marginTop: 25 }}>
          <div className="panel-heading"><h2>Club kits</h2><span>{unlockedTeamColors.length} colors unlocked</span></div>
          <p className="small-note" style={{ lineHeight: 1.7 }}>Choose colors for your team and the opposition. Earn more colors from any crate; every crate includes a color drop.</p>
          <div className="setting-row">
            <div className="setting-copy"><strong>Your team</strong><small>Used on your tokens, pass trails, and movement trails.</small></div>
            <div className="setting-options"><KitColorPicker label="Your team color" value={homeKitColorId} options={unlockedTeamColors} onChange={setHomeKitColorId} /></div>
          </div>
          <div className="setting-row">
            <div className="setting-copy"><strong>Opposition team</strong><small>Used on the opposing tokens and their pass and movement trails.</small></div>
            <div className="setting-options"><KitColorPicker label="Opposition team color" value={awayKitColorId} options={unlockedTeamColors} onChange={setAwayKitColorId} /></div>
          </div>
          {teamColorsSimilar
            ? <div className="kit-warning" role="alert">⚠ Team colors are the same or too similar. Choose different colors so both sides are easy to tell apart.</div>
            : <div className="store-notice" style={{ marginBottom: 0 }}>✓ Team colors are distinct and ready for the next match.</div>}
        </section>
        <section className="formation-panel">
          <div className="formation-toolbar">
            <div><div className="eyebrow">Starting XI · tactical setup</div><h2 style={{ margin: "8px 0 0", fontSize: 20 }}>Formation &amp; roles</h2></div>
            <label className="small-note" htmlFor="active-formation">ACTIVE FORMATION</label>
            <select id="active-formation" aria-label="Active team formation" value={activeFormationId}
              onChange={(event) => {
                const formation = formationById(event.target.value);
                setActiveFormationId(formation.id);
                setSelectedFormationSlotId(formation.slots[0].id);
              }}>
              {formations.filter((formation) => devToolsEnabled || unlockedFormations.includes(formation.id))
                .map((formation) => <option value={formation.id} key={formation.id}>{formation.name} · {formation.id === defaultFormation.id ? "STARTER" : "CUSTOM"}</option>)}
            </select>
          </div>
          <p className="small-note" style={{ lineHeight: 1.7 }}>{activeFormation.description}. Click a role on the pitch, then choose the specific player to assign there. Automatic roles use the best available player for that position group.</p>
          <div className="formation-field" aria-label={`${activeFormation.name} tactical formation`}>
            {activeFormation.slots.map((slot) => {
              const player = formationXI.find((candidate) => candidate.tacticalSlot === slot.id);
              const selected = selectedFormationSlot?.id === slot.id;
              return <button key={slot.id} type="button" className={`formation-slot ${selected ? "selected" : ""}`}
                style={{ gridColumn: slot.x + 1, gridRow: slot.y + 1 }}
                aria-label={`${slot.label}: ${player?.name ?? "no player"}`}
                aria-pressed={selected}
                onClick={() => setSelectedFormationSlotId(slot.id)}>
                <span className="slot-position">{slot.label}</span>
                <span className="slot-player">{player?.name.split(" ").slice(-1)[0] ?? "EMPTY"}</span>
              </button>;
            })}
          </div>
          {selectedFormationSlot && <div className="role-assignment">
            <div><strong>{selectedFormationSlot.label} · {selectedFormationSlot.position}</strong>
              <small>{selectedFormationPlayer ? `${selectedFormationPlayer.name} · ${overallRating(selectedFormationPlayer)} OVR` : "No available player for this role"}</small>
            </div>
            <select className="role-player-select" aria-label={`Assign player to ${selectedFormationSlot.label}`}
              value={formationAssignments[activeFormationId]?.[selectedFormationSlot.id] ?? "auto"}
              onChange={(event) => setFormationSlotPlayer(selectedFormationSlot.id, event.target.value)}>
              <option value="auto">Auto-fill best available</option>
              {homePlayers.filter((player) => player.position === selectedFormationSlot.position
                && !Object.entries(formationAssignments[activeFormationId] ?? {})
                  .some(([otherSlot, playerId]) => otherSlot !== selectedFormationSlot.id && playerId === player.id))
                .sort((a, b) => overallRating(b) - overallRating(a))
                .map((player) => <option value={player.id} key={player.id}>{player.name} · {player.club} · {overallRating(player)} OVR</option>)}
            </select>
          </div>}
          <div className="small-note" style={{ marginTop: 12 }}>{formationXI.length} / 11 roles filled · lineup uses the selected formation when a match starts.</div>
        </section>
        <div className="locker-roster-toolbar">
          <h2 style={{ fontSize: 14, margin: 0 }}>Player roster</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <label htmlFor="locker-player-sort">SORT BY</label>
            <select className="locker-sort-select" id="locker-player-sort" aria-label="Sort player roster"
              value={playerSort} onChange={(event) => setPlayerSort(event.target.value as PlayerSort)}>
              <option value="default">Default roster order</option>
              <option value="name-asc">Name · A to Z</option>
              <option value="name-desc">Name · Z to A</option>
              <option value="position">Position</option>
              <option value="club">Club · A to Z</option>
              <option value="ovr-desc">OVR · highest first</option>
              <option value="ovr-asc">OVR · lowest first</option>
              <option value="rating-desc">Base rating · highest first</option>
              <option value="rating-asc">Base rating · lowest first</option>
              <option value="ability-desc">Ability · highest first</option>
              <option value="ability-asc">Ability · lowest first</option>
              <option value="mean-desc">Mean stats · highest first</option>
              <option value="unlock-asc">Season Pass · earliest unlock</option>
              <option value="unlock-desc">Season Pass · latest unlock</option>
              <option value="unlocked-first">Unlocked players first</option>
              <option value="locked-first">Locked players first</option>
            </select>
            <span className="small-note">{homePlayers.length} unlocked · {devToolsEnabled ? "∞" : coins} coins</span>
          </div>
        </div>
        <div className="locker-grid">{sortedRoster.map((player) => {
          const unlocked = unlockedPlayers.includes(player.id);
          const unlockAt = playerUnlocks[player.id];
          const assignedSlot = formationXI.find((starter) => starter.id === player.id)?.tacticalSlot;
          return <article key={player.id} className="roster-card">
            <div className="roster-top"><div className="player-avatar" style={{ background: player.color }}>{player.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}</div><div><h3>{player.name}</h3><small style={{ color: "#89948b", fontSize: 9 }}>{player.club}</small></div><span className="rating">{overallRating(player)} OVR</span></div>
            <p>{player.ability} · Ability {player.abilityStat}/100 (weighted ×2)</p>
            <div className="roster-meta"><span>{unlocked ? (assignedSlot ? `${assignedSlot} · STARTING XI` : "SQUAD") : `PASS LV ${unlockAt}`}</span><span>{player.position} eligible</span></div>
            {!unlocked && <button className="secondary" style={{ width: "100%", marginTop: 10, padding: 9 }} disabled>UNLOCK IN SEASON PASS</button>}
          </article>;
        })}</div>
        <div className="panel-heading" style={{ marginTop: 33 }}><h2>Match formats</h2><span>Unlock at Season Pass Levels 10 and 20</span></div>
        <div className="format-grid">{formats.map((f) => <article className="format-card" key={f.id}><h3>{f.name}</h3><p>{f.detail}</p>{formatUnlocked(f) ? <button className={activeFormat === f.id ? "primary" : "secondary"} onClick={() => { setActiveFormat(f.id); setNotice(`${f.name} selected.`); }}>{activeFormat === f.id ? "SELECTED" : "SELECT FORMAT"}</button> : <button className="secondary" disabled>UNLOCK AT LEVEL {f.unlock}</button>}</article>)}</div>
      </div>}

      {screen === "quickplay" && <div className="content quickplay-page">
        <button className="ghost-btn" onClick={() => setScreen("home")}>← DASHBOARD</button>
        <div className="eyebrow" style={{ marginTop: 25 }}>Choose your match rules</div>
        <h1>Quickplay</h1>
        <p className="subtitle">Choose an unlocked mode. Campaign matches also rotate between Classic, Street 3v3, and Golden Goal.</p>
        <div className="format-grid">{formats.map((format) => <article className="format-card" key={format.id}>
          <h3>{format.name}</h3><p>{format.detail} · Full 90-minute match with halftime.</p>
          <button className={formatUnlocked(format) ? activeFormat === format.id ? "primary" : "secondary" : "secondary"}
            disabled={!formatUnlocked(format)}
            onClick={() => setActiveFormat(format.id)}>
            {formatUnlocked(format) ? activeFormat === format.id ? "SELECTED" : "SELECT MODE" : `UNLOCK AT LEVEL ${format.unlock}`}
          </button>
        </article>)}</div>
        <section className="settings-card ai-difficulty">
          <div className="panel-heading"><h2>CPU difficulty · Level {aiDifficulty}</h2><span>{evolvedAi.generations} generations · {evolvedAi.population} genomes · {minimaxDepthForDifficulty(aiDifficulty)}-ply minimax</span></div>
          <p className="small-note" style={{ lineHeight: 1.7, margin: 0 }}>Each level is a genome from a teach → breed → mutate genetic algorithm. Level 1 is the weakest evolved strategy; level 100 is the validated champion. Higher levels also field stronger MLS players and evaluate every formation, including custom ones. From level 25 the attack adds a minimax search with alpha-beta pruning and move ordering, so it checks the opponent's best reply before choosing; the lookahead grows to four plies at level 90.</p>
          <input aria-label="CPU AI difficulty" type="range" min="1" max="100" step="1" value={aiDifficulty}
            onChange={(event) => setAiDifficulty(Number(event.target.value))} />
          <div className="ai-difficulty-scale"><span>1 · WEAKEST STRATEGY</span><span>100 · TOP STRATEGY</span></div>
          <div className="ai-evolution-stats">
            <span><strong>{evolvedAi.matchesSimulated.toLocaleString()}</strong><small>matches evolved</small></span>
            <span><strong>{(evolvedAi.validation.winRate * 100).toFixed(0)}%</strong><small>validation wins</small></span>
            <span><strong>{evolvedAi.validation.goalDifference.toFixed(2)}</strong><small>goal difference</small></span>
            <span><strong>{humanPlayStyle.shots + humanPlayStyle.passes + humanPlayStyle.carries + humanPlayStyle.nutmegs}</strong><small>actions this game</small></span>
          </div>
          <p className="ai-difficulty-note">The CPU teaches a population from real StatsBomb action preferences and tactical archetypes, breeds the fittest genomes, and mutates the next generation. Its evolved genes drive passing, carrying, shooting, pressing, marking, and countering, while the live coach learns your shot, pass, carry, and nutmeg mix inside the current game and adjusts its plan. Tendencies reset at kickoff, so every match is coached from scratch.</p>
          <p className="small-note" style={{ lineHeight: 1.7, margin: "10px 0 0" }}>
            <img src={`${import.meta.env.BASE_URL}statsbomb-icon.svg`} alt="StatsBomb" width="18" height="18"
              style={{ display: "inline-block", verticalAlign: "middle", marginRight: 6, borderRadius: 3 }} />
            Data credit: <a href="https://github.com/hudl/open-data" target="_blank" rel="noreferrer">StatsBomb Open Data</a>.
            The CPU also adapts to your tendencies in this game—shots, passes, carries, and nutmegs ({humanPlayStyle.shots + humanPlayStyle.passes + humanPlayStyle.carries + humanPlayStyle.nutmegs} actions observed since kickoff).
          </p>
        </section>
        <div className="quickplay-options">
          <button className="quickplay-option" onClick={startCpuQuickplay}>
            <span className="quickplay-icon">🤖</span>
            <strong>CPU · {fmt(activeFormat).name}</strong>
            <p>Play on your own against the computer at difficulty level {aiDifficulty}. Higher levels field stronger players, sharper tactics, and deeper lookahead.</p>
            <span className="badge">PLAY LEVEL {aiDifficulty}</span>
          </button>
          <button className="quickplay-option" onClick={startLocalQuickplay}>
            <span className="quickplay-icon">👥</span>
            <strong>Local · {fmt(activeFormat).name}</strong>
            <p>Two players, one device. Take turns and hand the screen to the other player. Both teams use the same squad.</p>
            <span className="badge">PASS &amp; PLAY</span>
          </button>
          <button className={`quickplay-option ${showOnlineSetup ? "selected" : ""}`}
            aria-expanded={showOnlineSetup} aria-controls="online-game-setup"
            onClick={() => setShowOnlineSetup(true)}>
            <span className="quickplay-icon">🌐</span>
            <strong>Online · 11v11</strong>
            <p>Create a game and share its seven-digit code. Your opponent joins with just that code.</p>
            <span className="badge">{showOnlineSetup ? "GAME SETUP OPEN" : "CREATE OR JOIN ROOM"}</span>
          </button>
        </div>
        {showOnlineSetup && <section id="online-game-setup" ref={onlineSetupRef} className="settings-card online-setup">
          <div className="panel-heading"><h2>Online 1v1</h2><span>Quick join · 7-digit code</span></div>
          <p className="small-note" style={{ lineHeight: 1.7 }}>Create a game to get a room code, then share it with your opponent. To join, enter the code—no server address needed.</p>
          <div className="online-room-actions">
            <button className="primary" onClick={() => connectOnline("create-room")}>CREATE GAME</button>
            <input className="role-player-select" aria-label="7-digit game code" placeholder="7-DIGIT CODE"
              inputMode="numeric" pattern="[0-9]*" maxLength={7} value={joinRoomCode}
              onChange={(event) => setJoinRoomCode(event.target.value.replace(/\D/g, "").slice(0, 7))} />
            <button className="secondary" disabled={joinRoomCode.length !== 7} onClick={() => connectOnline("join-room")}>JOIN GAME</button>
          </div>
          {onlineStatus && <div className="store-notice" role={onlineStatus.startsWith("Couldn't connect") ? "alert" : "status"}>{onlineStatus}{onlineRoomCode && <> · GAME CODE <strong style={{ color: "#8ff2c8", letterSpacing: ".18em", fontSize: "16px" }}>{onlineRoomCode}</strong></>}</div>}
          <a className="online-setup-link" href="https://render.com/deploy?repo=https://github.com/person616/blitz-league" target="_blank" rel="noreferrer">First-time setup: deploy the match server on Render</a>
        </section>}
      </div>}

      {screen === "victory" && <section className="victory-page">
        <div className="victory-icon" aria-hidden="true">{match.score[0] === match.score[1] ? "🤝" : match.score[0] > match.score[1] ? "🏆" : "⚽"}</div>
        <div className="eyebrow">{match.minute >= 90 ? "FULL TIME" : "MATCH COMPLETE"}</div>
        <h1>{match.score[0] === match.score[1] ? "A hard-fought draw" : match.score[0] > match.score[1] ? "Victory!" : "Final whistle"}</h1>
        <div className="victory-score">{match.score[0]} — {match.score[1]}</div>
        <p>{quickplayMode === "online"
          ? match.score[0] === match.score[1] ? "The online match ends level." : `${match.score[0] > match.score[1] ? "Home" : "Away"} wins the online match!`
          : quickplayMode === "local"
          ? match.score[0] === match.score[1] ? "The match ends level." : `${match.score[0] > match.score[1] ? "Home" : "Away"} wins the local match!`
          : match.score[0] === match.score[1] ? "The match ends level." : match.score[0] > match.score[1] ? "Your squad takes the win." : "The opposition takes the win."}</p>
        {match.score[0] > match.score[1] && <div className="victory-reward">{quickplayMode === null ? `CAMPAIGN REWARD · +${100 * match.campaignStage} XP · +${30 + match.campaignStage * 5} COINS` : "MATCH REWARD · +100 XP"}</div>}
        <div className="victory-actions">
          <button className="primary" onClick={() => { stopQuickplay(); setMatchFullscreen(false); setScreen("campaign"); }}>CAMPAIGN MAP</button>
          <button className="secondary" onClick={() => setScreen("pass")}>BATTLE PASS</button>
          <button className="secondary" onClick={() => { stopQuickplay(); setMatchFullscreen(false); setScreen("home"); }}>DASHBOARD</button>
        </div>
      </section>}

      {screen === "pass" && <div className="content pass-page">
        <div className="eyebrow">Earn rewards as you play</div><h1>Season pass</h1><p className="subtitle">Each level takes 1,000 XP. Wins earn 100 XP in regular matches, while campaign wins scale with the stage. Unlock Street 3v3 at Level 10 and Golden Goal at Level 20. Sim-tested rewards build in strength, with a 90+ OVR player every 20 levels starting at Level 21.</p>
        <div className="pass-banner"><h2>Level {battlePassLevel} of {battlePassFinalLevel} <span style={{ color: "#8ff2c8" }}>·</span> {xp.toLocaleString()} XP</h2><p>{battlePassLevel === battlePassFinalLevel ? "You reached the final level. Your progress is saved on this device." : `${nextLevelXpTarget - xp} XP to reach Level ${battlePassLevel + 1}. Each level requires 1,000 XP.`}</p><div className="progress-track"><div className="progress-fill" style={{ width: `${passProgress}%` }} /></div><div className="small-note">{battlePassLevel === battlePassFinalLevel ? "FINAL LEVEL COMPLETE" : `${xpTowardNextLevel} / ${xpForNextLevel} XP toward Level ${battlePassLevel + 1}`}</div></div>
        <div className="panel-heading"><h2>Level rewards</h2><span>{allPassPlayerRewards.length} MLS players · {battlePassFinalLevel} total levels · one reward per level</span></div>
        <div className="pass-levels">{Array.from({ length: battlePassFinalLevel }, (_, index) => index + 1).map((rewardLevel) => {
          const playerReward = playerRewardsByLevel[rewardLevel];
          const unlocked = battlePassLevel >= rewardLevel;
          const requiredXp = xpRequiredForPassLevel(rewardLevel);
          const formatReward = formats.find((format) => format.unlock === rewardLevel);
          const coinReward = rewardLevel === coins250Level ? 250 : rewardLevel === coins500Level ? 500 : 0;
          const rewardName = rewardLevel === 1
            ? "Starting XI"
            : playerReward?.name ?? formatReward?.name ?? `${coinReward} coins`;
          return <article key={rewardLevel} className={`level-card ${unlocked ? "unlocked" : "locked"}`}>
            <h3>LEVEL {rewardLevel}</h3>
            <div style={{ fontSize: 22, marginBottom: 9 }}>{rewardLevel === 1 ? "⚽" : formatReward ? "🏟" : coinReward ? "◈" : "🏅"}</div>
            <b>{rewardName}</b>
            <p>{rewardLevel === 1
              ? "11-player starting squad · team average capped at 75 OVR"
              : playerReward
                ? `${playerReward.club} · ${playerReward.position} · ${overallRating(playerReward)} OVR · Ability ${playerReward.abilityStat} ×2`
                : formatReward?.detail ?? "Campaign coin bonus"}</p>
            <span className="small-note">{requiredXp.toLocaleString()} XP required</span>
            {unlocked ? <span className="badge">LEVEL COMPLETE</span> : <span className="small-note">{(requiredXp - xp).toLocaleString()} XP TO GO</span>}
          </article>;
        })}</div>
      </div>}

      {screen === "match" && <div className="content match-layout">
        <section>
          <div className="match-top"><button className="ghost-btn" onClick={() => { stopQuickplay(); setMatchFullscreen(false); setScreen("home"); }}>← DASHBOARD</button><div className="scorebox"><strong>{scoreLabel}</strong><small>{quickplayMode === "tutorial" ? `INTERACTIVE TUTORIAL · STEP ${tutorialStep} OF ${tutorialStepCount}` : quickplayMode === "online" ? `${onlineSide === "home" ? "HOME" : "AWAY"} · ONLINE 1V1${ownTurn ? " · YOUR TURN" : " · OPPONENT'S TURN"}` : quickplayMode === "local" ? `${match.turn === "home" ? "HOME" : "AWAY"} TURN · LOCAL QUICKPLAY` : quickplayMode === "cpu" ? "CPU QUICKPLAY · YOUR TURN" : `YOU · MATCH ${match.campaignStage}`} · {fmt(match.format).name.toUpperCase()} · {quickplayMode === "tutorial" ? "DRILL" : match.formationId}</small><span className="match-clock">{quickplayMode === "tutorial" ? "PRACTICE PITCH" : `${clockLabel} · HALF ${match.half}`}</span></div><button className="ghost-btn" onClick={() => setMatchFullscreen((fullscreen) => !fullscreen)} aria-label={matchFullscreen ? "Exit in-page fullscreen" : "Expand game to fill page"}>{matchFullscreen ? "⛶ EXIT FULLSCREEN" : "⛶ FULLSCREEN GAME"}</button></div>
          {quickplayMode === "online" && !onlineReady && <div className="store-notice" role="status">{onlineStatus || "Waiting for the other player to join."} {onlineRoomCode && <>Room code: <strong>{onlineRoomCode}</strong></>}</div>}
          {quickplayMode === "online" && onlineStatus && onlineReady && onlineStatus.includes("disconnected") && <div className="kit-warning" role="alert">{onlineStatus}</div>}
          {match.halftime && <div className="halftime-panel"><div><strong>Halftime · {scoreLabel}</strong><small>Teams have switched ends. Each in-game minute lasts 3.5 seconds.</small></div><button className="primary" onClick={resumeSecondHalf}>START SECOND HALF</button></div>}
          {teamColorsSimilar && <div className="kit-warning" role="alert">⚠ Your team and opposition colors are too similar. Change one in Locker Room to make the sides easier to distinguish.</div>}
          {tutorialStep > 0 && tutorialGuide && <div className="tutorial-banner">
            <div>
              <strong>{tutorialGuide.title}</strong>
              <span>{tutorialGuide.detail}</span>
              <div className="tutorial-dots" aria-hidden="true">{Array.from({ length: tutorialStepCount }, (_, index) => <i key={index} className={index + 1 < tutorialStep ? "done" : index + 1 === tutorialStep ? "active" : ""} />)}</div>
            </div>
            <button className="ghost-btn" onClick={exitTutorial}>SKIP TUTORIAL</button>
          </div>}
          <div className="pitch-wrap"><div className="pitch-viewport"><div className="pitch" aria-label="22 by 11 football pitch" style={{ transform: `translate(-${pitchCameraX}%, -${pitchCameraY}%)` }}>
            {Array.from({ length: 11 }, (_, y) => Array.from({ length: 22 }, (_, x) => {
              const token = match.tokens.find((t) => t.x === x && t.y === y);
              const ballHere = match.ball.x === x && match.ball.y === y;
              const isAvailable = availableMoveKeys.has(`${x},${y}`);
              const isPassTarget = !!token && passMode && eligiblePassIds.has(token.player.id);
              const isNutmegTarget = !!token && !passMode && token.player.id === nutmegTargetId;
              const isStealTarget = !!token && ownTurn && canSteal && token.player.id === opposingCarrier?.player.id;
              const isGoalTarget = !token && ownTurn && canShoot && x === attackingGoalX && y >= 4 && y <= 6;
              const isTutorialTarget = !!tutorialGuide?.highlightTile
                && tutorialGuide.highlightTile.x === x && tutorialGuide.highlightTile.y === y;
              return <button aria-label={`Tile ${x + 1}, ${y + 1}${token ? `: ${token.player.name}` : ""}${ballHere ? ", ball" : ""}${isAvailable ? ", available move" : ""}${isPassTarget ? ", pass receiver" : ""}${isNutmegTarget ? ", attempt nutmeg" : ""}${isStealTarget ? ", attempt steal" : ""}${isGoalTarget ? ", shoot on goal" : ""}`} className={`cell ${x === 0 ? "goal-left" : ""} ${x === 21 ? "goal-right" : ""} ${isAvailable ? "move-available" : ""} ${isPassTarget ? "pass-target" : ""} ${isNutmegTarget ? "nutmeg-target" : ""} ${isGoalTarget ? "goal-target" : ""} ${isTutorialTarget ? "tutorial-target-cell" : ""}`} key={`${x}-${y}`} onClick={() => onCellClick(x, y)}>
                {isAvailable && <span className="move-marker" />}
                {isGoalTarget && <span className="goal-reticle" aria-hidden="true">⚽</span>}
                {isPassTarget && <span className="interaction-marker pass-marker" aria-hidden="true">↗</span>}
                {isNutmegTarget && <span className="interaction-marker nutmeg-marker" aria-hidden="true">〰</span>}
                {isStealTarget && <span className="interaction-marker pass-marker" aria-hidden="true">🛡</span>}
              </button>;
            }))}
            <div className="pitch-token-layer" aria-hidden="true">
              {match.tokens.map((token) => {
                const isSelected = token.player.id === match.selected;
                const isPassTarget = passMode && eligiblePassIds.has(token.player.id);
                const isNutmegTarget = !passMode && token.player.id === nutmegTargetId;
                const isStealTarget = ownTurn && canSteal && token.player.id === opposingCarrier?.player.id;
                const isTutorialTarget = tutorialGuide?.highlightTokenId === token.player.id;
                return <div className="pitch-token-slot" key={token.player.id} style={{ transform: `translate3d(${token.x * 100}%, ${token.y * 100}%, 0)` }}>
                  <span className={`token ${token.side} ${isSelected ? "selected" : ""} ${isPassTarget ? "pass-highlight" : ""} ${isNutmegTarget ? "nutmeg-highlight" : ""} ${isStealTarget ? "steal-highlight" : ""} ${isTutorialTarget ? "tutorial-highlight" : ""}`} style={{ "--team-color": kitColorById(token.side === "home" ? homeKitColorId : awayKitColorId).value } as CSSProperties}>{token.player.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}</span>
                </div>;
              })}
              <div className="pitch-ball-slot" style={{ transform: `translate3d(${match.ball.x * 100}%, ${match.ball.y * 100}%, 0)` }}>
                {match.tokens.some((token) => token.x === match.ball.x && token.y === match.ball.y)
                  ? <span className="ball-badge" />
                  : <span className="ball-loose">⚽</span>}
              </div>
            </div>
            {pitchFx && <svg className="pitch-vfx-svg" viewBox="0 0 220 110" preserveAspectRatio="none" aria-hidden="true" key={pitchFx.id}>
              <line className="vfx-line" x1={(pitchFx.from.x + 0.5) * 10} y1={(pitchFx.from.y + 0.5) * 10} x2={(pitchFx.to.x + 0.5) * 10} y2={(pitchFx.to.y + 0.5) * 10} stroke={fxColor} />
            </svg>}
            {pitchFx?.label && <div className={`pitch-callout ${pitchFx.kind}`} style={{ left: `${(pitchFx.to.x + 0.5) / 22 * 100}%`, top: `${(pitchFx.to.y + 0.5) / 11 * 100}%`, "--fx-color": fxColor } as CSSProperties} aria-hidden="true" key={`callout-${pitchFx.id}`}>{pitchFx.label}</div>}
            <div className="goal-overlay" aria-hidden="true"><span className="penalty-box left" /><span className="penalty-box right" /><span className="goal-frame left" /><span className="goal-frame right" /></div>
            {goalBanner && <><div className="pitch-goal-flash" aria-hidden="true" /><div className={`goal-net-flash ${goalBanner.side === "home" ? "right" : "left"}`} aria-hidden="true" /></>}
            {goalBanner && <div className="goal-banner" aria-live="assertive">
              <div className="goal-banner-card">
                <strong>GOAL!</strong>
                <small>{goalBanner.scorer} · {quickplayMode === "local" ? (goalBanner.side === "home" ? "HOME" : "AWAY") : goalBanner.side === "home" ? "WHAT A FINISH!" : "TIME TO ANSWER!"}</small>
              </div>
            </div>}
          </div>{captionsEnabled && captionText && <div className={`game-caption ${captionSize}`} aria-live="polite">{captionText}</div>}</div><div className="legend"><span><i style={{ background: kitColorById(homeKitColorId).value }} />{quickplayMode === "local" ? "HOME" : "YOUR SQUAD"}</span><span><i style={{ background: kitColorById(awayKitColorId).value }} />{quickplayMode === "local" ? "AWAY" : "OPPOSITION"}</span><span>⚽ BALL</span><span>{match.format === "small-sided" ? "3v3" : "11v11"} · CLICK THE GLOWING GOAL TO SHOOT</span></div></div>
          <div className="message">{match.message}</div>
        </section>
        <aside className="sidebar">
          <section className="side-panel"><h3>On the ball</h3>{selectedPlayer ? <><div className="selected-card"><div className="player-avatar" style={{ background: selectedPlayer.player.color }}>{selectedPlayer.player.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}</div><div><b>{selectedPlayer.player.name}</b><small>{selectedPlayer.player.club} · {selectedPlayer.player.position}</small></div></div><div className="ability">{abilityDescription(selectedPlayer.player)}</div></> : <small style={{ color: "#92a79e" }}>Select a player on the pitch</small>}</section>
          <section className="side-panel"><h3>Actions</h3><div className="action-grid">
            <button className={`action ${tutorialStep === 3 || tutorialStep === 5 ? "recommended" : ""}`} disabled={!canShoot || !ownTurn} onClick={shoot}>⚽ SHOOT<span className="chance">{selectedPlayer && canShoot ? `${Math.round(displayedShotChance)}% · ${shotAngleDegrees(selectedPlayer, match.half)}° angle · range ${shotRange(selectedPlayer.player)}` : "get in range"}</span></button>
            {canShowGoalkeeperClear && <button className="action" disabled={!canClear || !ownTurn} onClick={clearBall}>🥅 CLEAR<span className="chance">{canClear ? `${Math.round(displayedClearChance)}% accuracy · ${clearDistance} tiles upfield · Clearing ${goalkeeperClearing(selectedPlayer.player)}` : `keeper must have the ball · range ${clearDistance} · Clearing ${goalkeeperClearing(selectedPlayer.player)}`}</span></button>}
            <button className={`action ${tutorialStep === 2 ? "recommended" : ""}`} disabled={!selectedPlayer || !ownTurn || (!canAct && !passMode) || selectedPlayer.side !== activeSide || match.ball.x !== selectedPlayer.x || match.ball.y !== selectedPlayer.y} onClick={pass}>{passMode ? "× CANCEL PASS" : "↗ PASS"}<span className="chance">{passMode ? "tap a glowing teammate" : `teammate ≤ ${passReach} tiles`}</span></button>
            <button className="action" disabled={!canNutmeg || !ownTurn} onClick={nutmeg}>〰 NUTMEG<span className="chance">{selectedPlayer ? `${Math.round(displayedNutmegChance)}% · fail: ${quickplayMode === "local" || quickplayMode === "online" ? "2 player turns" : "2 AI turns"}` : "adjacent defender"}</span></button>
            <button className={`action ${tutorialStep === 4 ? "recommended" : ""}`} disabled={!canSteal || !ownTurn} onClick={steal}>🛡 STEAL<span className="chance">{canSteal ? `${Math.round(displayedStealChance)}% · adjacent carrier` : "defend near the ball"}</span></button>
            <button className="action" disabled={!ownTurn} onClick={() => endTurn({ ...match, message: quickplayMode === "online" ? "Turn passed to your online opponent." : quickplaySide !== null ? "Turn passed. Hand the device to the other player." : "You hold position. Opposition's turn." })}>⏭ END TURN<span className="chance">{quickplayMode === "online" ? "send turn online" : quickplaySide !== null ? "pass the device" : "let AI play"}</span></button>
          </div></section>
          <section className="side-panel"><h3>Luck balance</h3>
            <div className="luck-row"><div><b>{homeLuckLabel}</b><small>{match.luck.home.successes}/{match.luck.home.attempts} random checks won</small></div><strong className={homeLuck > 55 ? "luck-hot" : homeLuck < 45 ? "luck-cold" : ""}>{homeLuck}%</strong></div>
            <div className="luck-bar"><span style={{ width: `${homeLuck}%` }} /></div>
            <div className="luck-row"><div><b>{awayLuckLabel}</b><small>{match.luck.away.successes}/{match.luck.away.attempts} random checks won</small></div><strong className={awayLuck > 55 ? "luck-hot" : awayLuck < 45 ? "luck-cold" : ""}>{awayLuck}%</strong></div>
            <div className="luck-bar"><span style={{ width: `${awayLuck}%` }} /></div>
            <div className="luck-note">Counted fresh each game across {luckChecks} random check{luckChecks === 1 ? "" : "s"}. Every roll softly pulls both sides toward a 50% average — the further a side strays, the stronger the correction, but no result is ever guaranteed.</div>
          </section>
          {devToolsEnabled && <section className="side-panel"><h3>Developer controls</h3>
            <button className="primary" style={{ width: "100%" }} onClick={() => setMatch(finishOrSet({ ...match, score: [goalTarget, 0] }, true))}>⚡ FORCE MATCH WIN</button>
            <div className="small-note" style={{ marginTop: 9 }}>Awards the current match and progression rewards for UI testing.</div>
          </section>}
          <section className="side-panel"><h3>{match.finished ? "Full time" : quickplaySide !== null ? `${match.turn === "home" ? "Home" : "Away"} player · ${ownTurn ? "your turn" : "opponent's turn"}` : ownTurn ? "Your turn" : "Opponent's turn"}</h3><div style={{ color: "#93a9a0", fontSize: 10, lineHeight: 1.8 }}>{quickplaySide !== null ? "Pass-and-play on one device: pass the screen after each turn. Each player controls the team whose turn it is." : "Select one of your players, then click an open tile to move."} Each turn allows one drive and one action. A successful nutmeg grants one extra drive and action; a failed attempt gives the opponent two turns. The ball carrier can pass, shoot, or risk a nutmeg against an adjacent defender. Shot angle affects accuracy. Matches last 90 in-game minutes, with halftime at 45; each game minute takes 3.5 seconds. Existing goal-target rules can end a match earlier.</div><div className="small-note" style={{ marginTop: 10 }}>DRIVE {Math.min(match.drivesUsed, 1 + match.bonusDrives)}/{1 + match.bonusDrives} · ACTION {Math.min(match.actionsUsed, 1 + match.bonusActions)}/{1 + match.bonusActions}</div></section>
        </aside>
      </div>}
      {crateReveal && <div className="crate-overlay" role="presentation" onClick={() => { if (crateRevealed) setCrateReveal(null); }}>
        <section className="crate-dialog" role="dialog" aria-modal="true" aria-labelledby="crate-reveal-title"
          onClick={(event) => event.stopPropagation()}>
          <div className="eyebrow">{crateReveal.crate === "thanksgiving" ? "Limited-time drop" : "Store crate"}</div>
          <h2 id="crate-reveal-title" style={{ margin: "9px 0", fontSize: 22 }}>
            {crateReveal.crate === "basic" ? "Basic Crate" : crateReveal.crate === "blitz" ? "Blitz Crate" : "Thanksgiving Crate"}
          </h2>
          {!crateRevealed
            ? <><div className="crate-box shaking" aria-label="Crate opening animation">🎁</div><p className="small-note">Your rewards are being revealed…</p></>
            : <div className="crate-result">
              <div className="store-kicker">Your rewards</div>
              <div className="crate-result-color" style={{ background: crateReveal.color.value }} aria-label={`${crateReveal.color.name} team color`} />
              <strong>{crateReveal.color.name}</strong>
              <p style={{ color: "#bcd2c8", fontSize: 13, margin: "12px 0 4px" }}>{crateReveal.reward}</p>
              <small className="small-note">Team color added to your Locker Room{crateReveal.bonusCoins ? " · duplicate color converted to 25 coins" : ""}</small>
              <button className="primary" style={{ width: "100%", marginTop: 21 }} onClick={() => setCrateReveal(null)}>CONTINUE</button>
            </div>}
        </section>
      </div>}
      {tutorialComplete && <div className="crate-overlay" role="presentation">
        <section className="tutorial-dialog" role="dialog" aria-modal="true" aria-labelledby="tutorial-complete-title">
          <div className="eyebrow">Training XI · Cleared</div>
          <div className="tutorial-medal">🏆</div>
          <h2 id="tutorial-complete-title">TUTORIAL COMPLETE</h2>
          <p>You moved off the ball, linked a pass, found the net, and won possession back. That is a real Blitz League match in miniature — the rest is up to you.</p>
          <div className="tutorial-reward">+150 XP &nbsp;·&nbsp; +50 COINS</div>
          <div className="victory-actions">
            <button className="primary" onClick={exitTutorial}>DASHBOARD</button>
            <button className="secondary" onClick={() => { exitTutorial(); setScreen("campaign"); }}>CAMPAIGN MAP</button>
            <button className="secondary" onClick={startTutorial}>REPLAY DRILL</button>
          </div>
        </section>
      </div>}
      {notice && <button className="toast" onClick={() => setNotice("")}>{notice} &nbsp; ×</button>}
    </main>
  );
}

export default App;
