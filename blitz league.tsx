"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Position = "FWD" | "MID" | "DEF" | "GK";
type AbilityType = "finishing" | "dribbling" | "pace" | "defending" | "playmaking" | "goalkeeping";
type FormatId = "classic" | "small-sided" | "golden-goal";
type CaptionSize = "small" | "medium" | "large";
type Player = {
  id: string;
  name: string;
  club: string;
  position: Position;
  rating: number;
  ability: string;
  abilityType: AbilityType;
  abilityStat: number;
  color: string;
};
type Token = { player: Player; x: number; y: number; side: "home" | "away" };
export type Match = {
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
  finished?: boolean;
};

const roster: Player[] = [
  { id: "messi", name: "Lionel Messi", club: "Inter Miami CF", position: "FWD", rating: 91, ability: "Deadeye · elite close control", abilityType: "dribbling", abilityStat: 96, color: "#f36b87" },
  { id: "suarez", name: "Luis Suárez", club: "Inter Miami CF", position: "FWD", rating: 84, ability: "Poacher · sharp finishing", abilityType: "finishing", abilityStat: 88, color: "#f36b87" },
  { id: "alba", name: "Jordi Alba", club: "Inter Miami CF", position: "DEF", rating: 82, ability: "Overlap · pace on the flank", abilityType: "pace", abilityStat: 84, color: "#f36b87" },
  { id: "busquets", name: "Sergio Busquets", club: "Inter Miami CF", position: "MID", rating: 81, ability: "Metronome · passing range", abilityType: "playmaking", abilityStat: 89, color: "#f36b87" },
  { id: "bouanga", name: "Denis Bouanga", club: "LAFC", position: "FWD", rating: 88, ability: "Rapid · attacking pace", abilityType: "pace", abilityStat: 88, color: "#f5b942" },
  { id: "chiellini", name: "Giorgio Chiellini", club: "LAFC", position: "DEF", rating: 77, ability: "Anchor · defensive positioning", abilityType: "defending", abilityStat: 81, color: "#f5b942" },
  { id: "puig", name: "Riqui Puig", club: "LA Galaxy", position: "MID", rating: 85, ability: "Playmaker · progressive passing", abilityType: "playmaking", abilityStat: 88, color: "#8b73dc" },
  { id: "morris", name: "Jordan Morris", club: "Seattle Sounders FC", position: "FWD", rating: 81, ability: "Speedster · acceleration", abilityType: "pace", abilityStat: 87, color: "#36ad83" },
  { id: "roldan", name: "Cristian Roldan", club: "Seattle Sounders FC", position: "MID", rating: 76, ability: "Engine · work rate", abilityType: "pace", abilityStat: 78, color: "#36ad83" },
  { id: "frei", name: "Stefan Frei", club: "Seattle Sounders FC", position: "GK", rating: 80, ability: "Last line · shot stopping", abilityType: "goalkeeping", abilityStat: 86, color: "#36ad83" },
  { id: "miles", name: "Miles Robinson", club: "FC Cincinnati", position: "DEF", rating: 79, ability: "Recovery · defensive coverage", abilityType: "defending", abilityStat: 84, color: "#ed794a" },
  { id: "moore", name: "DeAndre Yedlin", club: "Inter Miami CF", position: "DEF", rating: 72, ability: "Overlap · recovery pace", abilityType: "pace", abilityStat: 77, color: "#f36b87" },
  { id: "vela", name: "Carlos Vela", club: "LAFC", position: "FWD", rating: 84, ability: "Curling strike · shot placement", abilityType: "finishing", abilityStat: 87, color: "#f5b942" },
  { id: "pec", name: "Gabriel Pec", club: "LA Galaxy", position: "FWD", rating: 83, ability: "Quick feet · close control", abilityType: "dribbling", abilityStat: 86, color: "#8b73dc" },
  { id: "mukhtar", name: "Hany Mukhtar", club: "Nashville SC", position: "MID", rating: 86, ability: "MVP vision · chance creation", abilityType: "playmaking", abilityStat: 88, color: "#eac84b" },
  { id: "cucho", name: "Cucho Hernández", club: "Columbus Crew", position: "FWD", rating: 87, ability: "Clinical · finishing", abilityType: "finishing", abilityStat: 88, color: "#f1c94e" },
  { id: "benteke", name: "Christian Benteke", club: "D.C. United", position: "FWD", rating: 82, ability: "Target forward · finishing", abilityType: "finishing", abilityStat: 83, color: "#e4e8df" },
  { id: "burki", name: "Roman Bürki", club: "St. Louis CITY SC", position: "GK", rating: 86, ability: "Wall · shot stopping", abilityType: "goalkeeping", abilityStat: 91, color: "#ef5145" },
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
    color,
  };
});
roster.push(...additionalRoster);

const startingPlayers = [
  "mls-brady", "mls-fray", "mls-pineda", "mls-tafari", "mls-parker",
  "mls-vassilev", "mls-raposo", "mls-c-araujo", "mls-musovski", "mls-adeniran", "mls-wood",
];
const passPlayerRewards = roster.filter((player) => !startingPlayers.includes(player.id));
const smallSidedLevel = 10;
const goldenGoalLevel = 20;
const battlePassFinalLevel = passPlayerRewards.length + 5;
const coins250Level = battlePassFinalLevel - 1;
const coins500Level = battlePassFinalLevel;
const playerRewardLevels = Array.from({ length: battlePassFinalLevel }, (_, index) => index + 1)
  .filter((passLevel) => ![1, smallSidedLevel, goldenGoalLevel, coins250Level, coins500Level].includes(passLevel));
const playerUnlocks: Record<string, number> = Object.fromEntries(
  passPlayerRewards.map((player, index) => [player.id, playerRewardLevels[index]]),
);
const playerRewardsByLevel: Record<number, Player> = Object.fromEntries(
  passPlayerRewards.map((player) => [playerUnlocks[player.id], player]),
);
const formats: { id: FormatId; name: string; detail: string; unlock: number }[] = [
  { id: "classic", name: "Classic 11v11", detail: "Full squad · first to 3 goals", unlock: 1 },
  { id: "small-sided", name: "Street 3v3", detail: "Fast, open play · first to 2 goals", unlock: smallSidedLevel },
  { id: "golden-goal", name: "Golden Goal", detail: "One goal wins · sudden death", unlock: goldenGoalLevel },
];
const xpRequiredForPassLevel = (passLevel: number) => Math.max(0, (passLevel - 1) * 1000);
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
      .sort((a, b) => b.rating - a.rating)
      .slice(0, slots[position]),
  );
  return selected.sort((a, b) => positionOrder[a.position] - positionOrder[b.position] || b.rating - a.rating);
};
const selectSmallSidedXI = (players: Player[]) => {
  const selected = (["GK", "MID", "FWD"] as Position[])
    .map((position) => players.filter((player) => player.position === position).sort((a, b) => b.rating - a.rating)[0])
    .filter((player): player is Player => !!player);
  return [...selected, ...players.filter((player) => !selected.some((chosen) => chosen.id === player.id))
    .sort((a, b) => b.rating - a.rating)]
    .slice(0, 3);
};
const playersAvailableAt = (passLevel: number) =>
  [...startingPlayers, ...Object.entries(playerUnlocks).filter(([, requiredLevel]) => passLevel >= requiredLevel).map(([id]) => id)];

const fmt = (id: FormatId) => formats.find((format) => format.id === id) ?? formats[0];
const distance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
const cap = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const abilityEffect = (player: Player, type: AbilityType) =>
  player.abilityType === type ? player.abilityStat - 50 : 0;
const movementBonus = (player: Player) =>
  player.abilityType === "pace" && player.abilityStat >= 85 ? 1 : 0;
const passingBonus = (player: Player) =>
  player.abilityType === "playmaking" && player.abilityStat >= 85 ? 1 : 0;
const shotRange = (player: Player) =>
  7 + (player.abilityType === "finishing" && player.abilityStat >= 90 ? 1 : 0);
const nutmegChance = (player: Player) =>
  cap(50 + abilityEffect(player, "dribbling") * 0.1, 45, 56);
const abilityDescription = (player: Player) =>
  `${player.ability} · Ability ${player.abilityStat} (${player.abilityType})`;
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
const resetKickoff = (tokens: Token[], side: "home" | "away", half: 1 | 2, smallSided: boolean) => {
  const homeStarts: [number, number][] = smallSided
    ? [[10, 5], [7, 3], [7, 7]]
    : [[1, 5], [4, 1], [4, 4], [4, 6], [4, 9], [7, 2], [7, 5], [7, 8], [10, 2], [10, 5], [10, 8]];
  const awayStarts: [number, number][] = smallSided
    ? [[11, 5], [14, 3], [14, 7]]
    : [[20, 5], [17, 1], [17, 4], [17, 6], [17, 9], [14, 2], [14, 5], [14, 8], [11, 2], [11, 5], [11, 8]];
  const reset = (team: "home" | "away") => tokens.filter((token) => token.side === team).map((token, index) => {
    const [baseX, y] = (team === "home" ? homeStarts : awayStarts)[index] ?? [team === "home" ? 7 : 14, 5];
    const x = half === 2 ? 21 - baseX : baseX;
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
  const attackers = updated.filter((token) => token.side === side)
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
const campaignStageCount = 55;
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
const shiftFormationWithBall = (tokens: Token[], fromX: number, toX: number, carrierId: string, half: 1 | 2 = 1) => {
  const direction = Math.sign(toX - fromX);
  if (!direction) return tokens;

  const updated = tokens.map((token) => ({
    ...token,
    x: token.player.id === carrierId ? token.x : cap(token.x + direction, 1, 20),
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
      const targetX = cap(carrier.x - attackDirection * 4, 0, 21);
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
): Match {
  const home = selectXI(homeRoster);
  const homeXI = format === "small-sided" ? selectSmallSidedXI(homeRoster) : home;
  const opponentsXI = selectXI(away.length ? away : roster);
  const opponents = format === "small-sided"
    ? selectSmallSidedXI(away.length ? away : roster)
    : opponentsXI;
  const homeStarts: [number, number][] = format === "small-sided"
    ? [[2, 5], [6, 3], [6, 7]]
    : [[1, 5], [4, 1], [4, 4], [4, 6], [4, 9], [7, 2], [7, 5], [7, 8], [10, 2], [10, 5], [10, 8]];
  const awayStarts: [number, number][] = format === "small-sided"
    ? [[19, 5], [15, 3], [15, 7]]
    : [[20, 5], [17, 1], [17, 4], [17, 6], [17, 9], [14, 2], [14, 5], [14, 8], [11, 2], [11, 5], [11, 8]];
  const tokens: Token[] = [
    ...homeXI.map((player, i) => ({ player, x: homeStarts[i][0], y: homeStarts[i][1], side: "home" as const })),
    ...opponents.map((player, i) => ({ player: { ...player, id: `ai-${player.id}` }, x: awayStarts[i][0], y: awayStarts[i][1], side: "away" as const })),
  ];
  const kickoff = resetKickoff(tokens, "home", 1, format === "small-sided");
  return {
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
  };
}

function App() {
  const [xp, setXp] = useState(0);
  const [coins, setCoins] = useState(120);
  const [unlockedPlayers, setUnlockedPlayers] = useState<string[]>(startingPlayers);
  const [customPositions, setCustomPositions] = useState<Partial<Record<string, Position>>>({});
  const [activeFormat, setActiveFormat] = useState<FormatId>("classic");
  const [screen, setScreen] = useState<"home" | "campaign" | "match" | "victory" | "locker" | "pass" | "quickplay" | "settings">("home");
  const [level, setLevel] = useState(1);
  const [match, setMatch] = useState<Match>(() => makeMatch([], 1, "classic"));
  const [notice, setNotice] = useState("");
  const [saveReady, setSaveReady] = useState(false);
  const [quickplaySide, setQuickplaySide] = useState<"home" | "away" | null>(null);
  const [quickplayMode, setQuickplayMode] = useState<"cpu" | "local" | null>(null);
  const [passMode, setPassMode] = useState(false);
  const [matchFullscreen, setMatchFullscreen] = useState(false);
  const [captionsEnabled, setCaptionsEnabled] = useState(true);
  const [captionSize, setCaptionSize] = useState<CaptionSize>("small");
  const [captionText, setCaptionText] = useState("");
  const [endTurnKey, setEndTurnKey] = useState<string | null>("Enter");
  const [capturingEndTurnKey, setCapturingEndTurnKey] = useState(false);
  const latestMatch = useRef(match);
  const lastCaptionMessage = useRef(match.message);
  const captionTimer = useRef<number | undefined>(undefined);
  const battlePassLevel = passLevelForXp(xp);
  const currentLevelXpStart = xpRequiredForPassLevel(battlePassLevel);
  const nextLevelXpTarget = xpRequiredForPassLevel(battlePassLevel + 1);
  const xpTowardNextLevel = xp - currentLevelXpStart;
  const xpForNextLevel = nextLevelXpTarget - currentLevelXpStart;
  const passProgress = battlePassLevel >= battlePassFinalLevel
    ? 100
    : Math.min(100, (xpTowardNextLevel / xpForNextLevel) * 100);

  const homePlayers = useMemo(() => roster
    .filter((player) => unlockedPlayers.includes(player.id))
    .map((player) => customPositions[player.id] && customPositions[player.id] !== player.position
      ? { ...player, position: customPositions[player.id]! }
      : player), [unlockedPlayers, customPositions]);
  const startingXI = useMemo(() => selectXI(homePlayers), [homePlayers]);
  const awayPlayers = useMemo(() => {
    const aiTier = Math.floor((level - 1) / 1.5);
    return selectXI(roster.filter((player) =>
      startingPlayers.includes(player.id) || (playerUnlocks[player.id] ?? 1) <= aiTier + 1,
    ))
  }, [level]);
  const goalTarget = quickplayMode !== null ? 3 : activeFormat === "golden-goal" ? 1 : activeFormat === "small-sided" ? 2 : 3;
  const matchIsSmallSided = quickplayMode === null && activeFormat === "small-sided";
  const scoreLabel = `${match.score[0]} — ${match.score[1]}`;
  const clockLabel = match.halftime ? "45' · HT" : `${match.minute}'`;

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("blitz-league-save")
        ?? window.localStorage.getItem("soccer-baseboard-save");
      if (saved) {
        const data = JSON.parse(saved) as { xp?: number; progressionVersion?: number; coins?: number; unlockedPlayers?: string[]; customPositions?: Record<string, Position>; activeFormat?: FormatId; level?: number; captionsEnabled?: boolean; captionSize?: CaptionSize; endTurnKey?: string | null; enterEndsTurn?: boolean };
        const loadedXp = typeof data.xp === "number" && Number.isFinite(data.xp)
          ? Math.max(0, Math.floor(data.progressionVersion === 2 ? data.xp : data.xp * 100))
          : 0;
        if (typeof data.xp === "number" && Number.isFinite(data.xp)) {
          setXp(loadedXp);
          setUnlockedPlayers(playersAvailableAt(passLevelForXp(loadedXp)));
        }
        if (data.customPositions && typeof data.customPositions === "object") {
          const validPositions = Object.fromEntries(Object.entries(data.customPositions)
            .filter(([id, position]) => roster.some((player) => player.id === id)
              && ["FWD", "MID", "DEF", "GK"].includes(position))) as Partial<Record<string, Position>>;
          setCustomPositions(validPositions);
        }
        if (typeof data.coins === "number") setCoins(data.coins);
        if (data.activeFormat && formats.some((f) => f.id === data.activeFormat
          && f.unlock <= passLevelForXp(loadedXp))) setActiveFormat(data.activeFormat);
        if (typeof data.level === "number") setLevel(data.level);
        if (typeof data.captionsEnabled === "boolean") setCaptionsEnabled(data.captionsEnabled);
        if (data.captionSize && ["small", "medium", "large"].includes(data.captionSize)) setCaptionSize(data.captionSize);
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
    if (!saveReady) return;
    window.localStorage.setItem("blitz-league-save", JSON.stringify({
      xp, progressionVersion: 2, coins, unlockedPlayers, customPositions, activeFormat, level, captionsEnabled, captionSize, endTurnKey,
    }));
  }, [xp, coins, unlockedPlayers, customPositions, activeFormat, level, captionsEnabled, captionSize, endTurnKey, saveReady]);

  useEffect(() => {
    latestMatch.current = match;
  }, [match]);

  useEffect(() => {
    if (screen !== "match" || match.finished || match.halftime) return;
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
  }, [screen, match.finished, match.halftime, matchIsSmallSided]);

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

  function stopQuickplay() {
    setQuickplaySide(null);
    setQuickplayMode(null);
  }

  function showQuickplayOptions() {
    stopQuickplay();
    setScreen("quickplay");
  }

  function startLocalQuickplay() {
    setPassMode(false);
    const localXI = selectXI(homePlayers);
    const initial = makeMatch(localXI, level, "classic", homePlayers);
    initial.message = "Local Quickplay · Home kicks off. Both teams have the same lineup. Take turns on this screen and pass the device after each turn.";
    setQuickplaySide("home");
    setQuickplayMode("local");
    setMatch(initial);
    setScreen("match");
  }

  function startCpuQuickplay() {
    setPassMode(false);
    const initial = makeMatch(awayPlayers, level, "classic", homePlayers);
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
    const stageAiTier = Math.floor((nextLevel - 1) / 1.5) + 1;
    const stageOpponentXI = selectXI(roster.filter((player) =>
      startingPlayers.includes(player.id) || (playerUnlocks[player.id] ?? 1) <= stageAiTier,
    ));
    setMatch(makeMatch(stageOpponentXI, nextLevel, activeFormat, homePlayers));
    setScreen("match");
  }

  function endTurn(current: Match) {
    setPassMode(false);
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
    const expireHomeStealProtection = ai.stealProtectedSide === "home";
    const owner = ai.tokens.find((t) => t.side === "away" && t.x === ai.ball.x && t.y === ai.ball.y);
    if (owner) {
      const goalDistance = ownGoalDistance(owner, latest.half);
      if (goalDistance <= 7 + Math.floor(latest.campaignStage / 3)) {
        const chance = shotAccuracy(owner, ai.tokens, goalDistance, shotAngleDegrees(owner, latest.half));
        const goal = { x: latest.half === 1 ? 0 : 21, y: 5 };
        const interception = findInterceptor(ai.tokens, "away", lineCells(owner, goal));
        if (interception && Math.random() * 100 < interceptionChance(interception.token, "shot", interception.gap)) {
          ai.ball = { x: interception.token.x, y: interception.token.y };
          ai.stealProtectedSide = undefined;
          ai.message = `${interception.token.player.name} blocks the opposition's shot and intercepts the ball!`;
        } else if (Math.random() * 100 < chance) {
          ai.score = [ai.score[0], ai.score[1] + 1];
          const kickoff = resetKickoff(ai.tokens, "home", ai.half, matchIsSmallSided);
          ai.tokens = kickoff.tokens;
          ai.ball = kickoff.ball;
          ai.stealProtectedSide = undefined;
          ai.message = `The opposition scores! ${ai.score[0]}–${ai.score[1]}.`;
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
          ai.message = `The opposition's shot from ${goalDistance} tiles out goes wide. The ball is loose by your goal.`;
        }
      } else {
        const attackDirection = latest.half === 1 ? -1 : 1;
        const approachX = attackDirection < 0 ? 1 : 20;
        const route = findRouteToTargets(ai.tokens, owner, Array.from({ length: 7 }, (_, index) => ({
          x: approachX,
          y: index + 2,
        })));
        const moveDistance = 2 + movementBonus(owner.player);
        const next = route[Math.min(moveDistance, route.length) - 1];
        if (next) {
          const previousBallX = ai.ball.x;
          owner.x = next.x;
          owner.y = next.y;
          ai.ball = { x: next.x, y: next.y };
          if (ai.stealProtectedSide === "away") ai.stealProtectedSide = undefined;
          ai.tokens = shiftFormationWithBall(ai.tokens, previousBallX, next.x, owner.player.id, ai.half);
        }
        ai.message = "The opposition advances. Your turn.";
      }
    } else {
      const carrier = ai.tokens.find((t) => t.x === ai.ball.x && t.y === ai.ball.y);
      if (carrier?.side === "home") {
        const pressers = ai.tokens.filter((t) => t.side === "away")
          .sort((a, b) => distance(a, carrier) - distance(b, carrier));
        const presser = pressers[0];
        if (presser && adjacent(presser, carrier)) {
          if (ai.stealProtectedSide === "home") {
            ai.message = "Your team keeps possession after the recent steal; the opposition cannot steal back immediately.";
          } else {
            const chance = stealChanceFor(presser, carrier, ai.half);
            if (Math.random() * 100 < chance) {
              const landing = stealLanding(ai.tokens, presser, carrier, ai.half);
              ai.tokens = ai.tokens.map((token) => token.player.id === presser.player.id
                ? { ...token, x: landing.x, y: landing.y }
                : token);
              ai.tokens = shiftFormationWithBall(ai.tokens, ai.ball.x, landing.x, presser.player.id, ai.half);
              ai.tokens = pushTeamUpfield(ai.tokens, "away", ai.half);
              const shiftedPresser = ai.tokens.find((token) => token.player.id === presser.player.id);
              if (shiftedPresser) ai.ball = { x: shiftedPresser.x, y: shiftedPresser.y };
              ai.stealProtectedSide = "away";
              ai.message = `${presser.player.name} steals the ball and gets in front of ${carrier.player.name} (${chance}% chance). The opposition team pushes upfield.`;
            } else {
              ai.message = `${carrier.player.name} evades the opposition's steal attempt (${chance}% chance).`;
            }
          }
        } else if (presser) {
          const pressureTargets = [
            { x: carrier.x - 1, y: carrier.y - 1 }, { x: carrier.x, y: carrier.y - 1 },
            { x: carrier.x + 1, y: carrier.y - 1 }, { x: carrier.x - 1, y: carrier.y },
            { x: carrier.x + 1, y: carrier.y }, { x: carrier.x - 1, y: carrier.y + 1 },
            { x: carrier.x, y: carrier.y + 1 }, { x: carrier.x + 1, y: carrier.y + 1 },
          ];
          const route = findRouteToTargets(ai.tokens, presser, pressureTargets);
          const moveDistance = 2 + movementBonus(presser.player);
          const next = route[Math.min(moveDistance, route.length) - 1];
          if (next) {
            presser.x = next.x;
            presser.y = next.y;
          }
          ai.message = "The opposition presses your ball carrier.";
        } else {
          ai.message = "The opposition holds shape. Your turn.";
        }
      } else {
        const nearestAway = ai.tokens.filter((token) => token.side === "away")
          .sort((a, b) => distance(a, ai.ball) - distance(b, ai.ball))[0];
        const nearestHome = ai.tokens.filter((token) => token.side === "home")
          .sort((a, b) => distance(a, ai.ball) - distance(b, ai.ball))[0];
        if (nearestAway
          && (!nearestHome || distance(nearestAway, ai.ball) < distance(nearestHome, ai.ball))
          && !ai.tokens.some((token) => token.x === ai.ball.x && token.y === ai.ball.y)) {
          const route = findRouteToTargets(ai.tokens, nearestAway, [ai.ball]);
          const moveDistance = 2 + movementBonus(nearestAway.player);
          const next = route[Math.min(moveDistance, route.length) - 1];
          if (next) {
            nearestAway.x = next.x;
            nearestAway.y = next.y;
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
          ai.message = "The ball is loose. Your team has the better chance to reach it next turn.";
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
        setUnlockedPlayers(playersAvailableAt(nextPassLevel));
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
    const activeSide = quickplaySide !== null ? match.turn : "home";
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
    const activeSide = quickplaySide !== null ? match.turn : "home";
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
    const angle = shotAngleDegrees(player, match.half);
    const accuracy = shotAccuracy(player, match.tokens, dist, angle);
    const goal = {
      x: player.side === "home" ? (match.half === 1 ? 21 : 0) : (match.half === 1 ? 0 : 21),
      y: 5,
    };
    const shotPath = lineCells(player, goal);
    const interception = findInterceptor(match.tokens, player.side, shotPath);
    if (interception && Math.random() * 100 < interceptionChance(interception.token, "shot", interception.gap)) {
      const tokens = shiftFormationWithBall(match.tokens, match.ball.x, interception.token.x, interception.token.player.id, match.half);
      const shiftedBlocker = tokens.find((token) => token.player.id === interception.token.player.id) ?? interception.token;
      endTurn({
        ...match,
        tokens,
        ball: { x: shiftedBlocker.x, y: shiftedBlocker.y },
        selected: shiftedBlocker.player.id,
        stealProtectedSide: undefined,
        message: `${interception.token.player.name} reads the shot and intercepts it! ${interception.gap ? "A nearby defender closes the shooting lane." : "A defender blocks the shooting lane."} Their defense gets possession.`,
      });
      return;
    }
    const scored = Math.random() * 100 < accuracy;
    if (scored) {
      if (quickplaySide !== null) {
        const kickoffSide = player.side === "home" ? "away" : "home";
        const kickoff = resetKickoff(match.tokens, kickoffSide, match.half, matchIsSmallSided);
        const score: [number, number] = [...match.score];
        score[player.side === "home" ? 0 : 1] += 1;
        const finished = score[player.side === "home" ? 0 : 1] >= goalTarget;
        setMatch({
          ...match,
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
          message: finished ? `${player.player.name} scores the winner!` : `${player.player.name} scores from ${dist} tiles out at a ${angle}° angle (${accuracy}% chance). ${kickoffSide === "home" ? "Home" : "Away"} restarts from kickoff.`,
        });
        if (finished) setScreen("victory");
        return;
      }
      const tokens = match.tokens;
      const kickoff = resetKickoff(tokens, "away", match.half, matchIsSmallSided);
      const next = { ...match, tokens: kickoff.tokens, ball: kickoff.ball, turn: "away" as const, selected: closestPlayerId(kickoff.tokens, kickoff.ball, "away"), stealProtectedSide: undefined, score: [match.score[0] + 1, match.score[1]] as [number, number], message: `${player.player.name} scores from ${dist} tiles out at a ${angle}° angle (${accuracy}% chance). Away restarts from kickoff.` };
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
      const tokens = shiftFormationWithBall(match.tokens, match.ball.x, goal.x, player.player.id, match.half);
      const updated = {
        ...match,
        tokens,
        ball: goal,
        stealProtectedSide: undefined,
        message: `${player.player.name}'s shot sails wide from ${dist} tiles out (${accuracy}% chance). The ball is loose by the goal.`,
      };
      endTurn(updated);
    }
  }

  function pass() {
    if (passMode) {
      setPassMode(false);
      setMatch({ ...match, message: "Pass selection canceled." });
      return;
    }
    const activeSide = quickplaySide !== null ? match.turn : "home";
    const player = match.tokens.find((t) => t.player.id === match.selected && t.side === activeSide);
    if (!player || match.turn !== activeSide || match.ball.x !== player.x || match.ball.y !== player.y || match.finished) {
      setMatch({ ...match, message: "Select the player with the ball to pass." });
      return;
    }
    if (match.actionsUsed >= 1 + match.bonusActions) {
      setMatch({ ...match, message: "Your action is used. Complete your drive or end the turn." });
      return;
    }
    const passRange = 2 + movementBonus(player.player) + 2 + passingBonus(player.player);
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
    const activeSide = quickplaySide !== null ? match.turn : "home";
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
    const passRange = 2 + movementBonus(player.player) + 2 + passingBonus(player.player);
    if (distance(player, receiver) > passRange) {
      setPassMode(false);
      setMatch({ ...match, message: `That teammate is outside passing range (${passRange} tiles).` });
      return;
    }
    const interceptionPath = lineCells(player, receiver).slice(0, -1);
    const interceptor = findInterceptor(match.tokens, player.side, interceptionPath);
    if (interceptor && Math.random() * 100 < interceptionChance(interceptor.token, "pass", interceptor.gap)) {
      const tokens = shiftFormationWithBall(match.tokens, match.ball.x, interceptor.token.x, interceptor.token.player.id, match.half);
      const shiftedInterceptor = tokens.find((token) => token.player.id === interceptor.token.player.id) ?? interceptor.token;
      const updated = {
        ...match,
        tokens,
        ball: { x: shiftedInterceptor.x, y: shiftedInterceptor.y },
        selected: shiftedInterceptor.player.id,
        stealProtectedSide: undefined,
        message: `${interceptor.token.player.name} steps into ${player.player.name}'s pass and intercepts it!`,
      };
      setPassMode(false);
      endTurn(updated);
      return;
    }
    const tokens = shiftFormationWithBall(match.tokens, match.ball.x, receiver.x, receiver.player.id, match.half);
    const shiftedReceiver = tokens.find((token) => token.player.id === receiver.player.id) ?? receiver;
    const updated = { ...match, tokens, ball: { x: shiftedReceiver.x, y: shiftedReceiver.y }, selected: receiver.player.id, stealProtectedSide: undefined, message: `Pass completed to ${receiver.player.name}; both teams shift with the ball.` };
    setPassMode(false);
    spendAction(updated, updated.message);
  }

  function steal() {
    const activeSide = quickplaySide !== null ? match.turn : "home";
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
    if (Math.random() * 100 < chance) {
      const landing = stealLanding(match.tokens, defender, carrier, match.half);
      let tokens = match.tokens.map((token) => token.player.id === defender.player.id
        ? { ...token, x: landing.x, y: landing.y }
        : token);
      tokens = shiftFormationWithBall(tokens, match.ball.x, landing.x, defender.player.id, match.half);
      tokens = pushTeamUpfield(tokens, defender.side, match.half);
      const shiftedDefender = tokens.find((token) => token.player.id === defender.player.id) ?? defender;
      const updated = {
        ...match,
        tokens,
        ball: { x: shiftedDefender.x, y: shiftedDefender.y },
        selected: defender.player.id,
        stealProtectedSide: defender.side,
        message: `${defender.player.name} wins the ball and steps in front of ${carrier.player.name} (${chance}% chance). ${defender.side === "home" ? "Your" : "Opposition"} forwards push upfield.`,
      };
      spendAction(updated, updated.message);
      return;
    }
    endTurn({
      ...match,
      message: `${defender.player.name}'s steal attempt is evaded (${chance}% chance). ${carrier.player.name} keeps possession.`,
    });
  }

  function nutmeg() {
    const activeSide = quickplaySide !== null ? match.turn : "home";
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
    const dx = Math.sign(defender.x - player.x);
    const dy = Math.sign(defender.y - player.y);
    const behindX = defender.x + dx;
    const behindY = defender.y + dy;
    const behindBlocked = behindX < 0 || behindX > 21 || behindY < 0 || behindY > 10
      || match.tokens.some((t) => t.x === behindX && t.y === behindY);
    const nx = behindBlocked ? defender.x : behindX;
    const ny = behindBlocked ? defender.y : behindY;
    const chance = nutmegChance(player.player);
    const success = Math.random() * 100 < chance;
    if (success) {
      let updated = {
        ...match,
        tokens: match.tokens.map((t) => {
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
      spendAction(updated, `${player.player.name} nutmegs ${defender.player.name}! ${chance}% odds — bonus drive and action earned.`, true);
    } else {
      const opponentSide = player.side === "home" ? "away" : "home";
      const tokens = shiftFormationWithBall(match.tokens, match.ball.x, defender.x, defender.player.id, match.half);
      const shiftedDefender = tokens.find((token) => token.player.id === defender.player.id) ?? defender;
      setMatch({
        ...match,
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
    const activeSide = quickplaySide !== null ? match.turn : "home";
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
  const activeSide = quickplaySide !== null ? match.turn : "home";
  const ownTurn = match.turn === activeSide && !match.finished && !match.halftime;
  const movementRange = selectedPlayer ? 2 + movementBonus(selectedPlayer.player) : 0;
  const passingRange = movementRange + 2 + (selectedPlayer ? passingBonus(selectedPlayer.player) : 0);
  const eligiblePassIds = new Set(
    selectedPlayer && ownTurn && selectedPlayer.side === activeSide
      && selectedPlayer.x === match.ball.x && selectedPlayer.y === match.ball.y
      && match.actionsUsed < 1 + match.bonusActions
      ? match.tokens.filter((token) => token.side === selectedPlayer.side
        && token.player.id !== selectedPlayer.player.id
        && distance(selectedPlayer, token) <= passingRange).map((token) => token.player.id)
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
        *{box-sizing:border-box} body{margin:0;background:#0d1110;color:#f1f3ed;font-family:Manrope,Arial,sans-serif}
        button{font:inherit;color:inherit;border:0;cursor:pointer}.app-shell{min-height:100vh;background:radial-gradient(ellipse at 52% -20%,#21352a 0%,#111714 45%,#0d1110 78%);padding:0 30px 50px}
        .topbar{height:76px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #ffffff13;max-width:1380px;margin:auto}
        .brand{display:flex;gap:11px;align-items:center;font-weight:800;letter-spacing:.06em}.brand-mark{width:34px;height:34px;border-radius:10px;background:#b8f36b;color:#13200d;display:grid;place-items:center;font-size:19px}
        .brand small{display:block;font-family:'DM Mono',monospace;font-weight:400;font-size:9px;color:#929b91;letter-spacing:.16em;margin-top:2px}
        .nav{display:flex;gap:7px}.nav button,.ghost-btn{background:transparent;color:#aab3aa;padding:10px 14px;border-radius:9px;font-size:12px;font-weight:700}.nav button:hover,.nav button.active{background:#ffffff0c;color:#b8f36b}
        .wallet{display:flex;gap:9px;align-items:center;font-family:'DM Mono',monospace;font-size:12px}.coin{color:#d7f583}.xp-pill{color:#9ca89d;border-left:1px solid #ffffff22;padding-left:12px}
        .content{max-width:1280px;margin:0 auto}.eyebrow{font:500 10px 'DM Mono',monospace;letter-spacing:.2em;color:#b8f36b;text-transform:uppercase}
        h1{font-size:clamp(32px,4vw,52px);letter-spacing:-.055em;line-height:1.02;margin:13px 0 12px}.subtitle{color:#929c93;font-size:14px;line-height:1.7;max-width:550px;margin:0}
        .hero{padding:58px 0 38px;display:flex;justify-content:space-between;align-items:end;gap:25px}.hero-cta{display:flex;gap:10px}
        .primary{background:#b8f36b;color:#14200f;padding:13px 19px;border-radius:9px;font-weight:800;font-size:12px;box-shadow:0 6px 25px #b8f36b1c}.primary:hover{background:#c9ff83;transform:translateY(-1px)}
        .secondary{background:#ffffff0b;border:1px solid #ffffff15;padding:12px 17px;border-radius:9px;font-size:12px;font-weight:700}.secondary:hover{background:#ffffff14}
        .home-grid{display:grid;grid-template-columns:1.25fr .75fr;gap:18px}.panel{background:#141a17;border:1px solid #ffffff12;border-radius:14px;padding:22px}
        .panel-heading{display:flex;justify-content:space-between;align-items:center;margin-bottom:19px}.panel-heading h2{font-size:14px;margin:0;letter-spacing:-.02em}.panel-heading span{font:10px 'DM Mono',monospace;color:#879188;text-transform:uppercase;letter-spacing:.1em}
        .campaign-card{background:linear-gradient(120deg,#1e2a20,#17201b);border:1px solid #b8f36b21;border-radius:12px;padding:19px;display:flex;justify-content:space-between;align-items:center;margin-bottom:17px}
        .campaign-card strong{font-size:14px}.campaign-card p{font-size:11px;color:#919d92;margin:5px 0 0}.badge{background:#b8f36b18;color:#b8f36b;border-radius:100px;padding:6px 9px;font:10px 'DM Mono',monospace}
        .progress-track{height:5px;background:#ffffff12;border-radius:10px;overflow:hidden;margin:14px 0 7px}.progress-fill{height:100%;background:#b8f36b;border-radius:10px;transition:width .25s}.small-note{font:10px 'DM Mono',monospace;color:#89938b}
        .player-list{display:grid;grid-template-columns:1fr 1fr;gap:9px}.player-chip{border:1px solid #ffffff10;background:#ffffff04;border-radius:10px;padding:11px;display:flex;gap:9px;align-items:center}.player-avatar{width:31px;height:31px;flex:none;border-radius:9px;display:grid;place-items:center;color:#111;font:700 10px 'DM Mono',monospace}
        .player-chip b{font-size:10px;display:block}.player-chip small{font-size:9px;color:#8e998f}.rating{margin-left:auto;color:#c7d2c8;font:10px 'DM Mono',monospace}
        .pass-track{display:flex;gap:8px;overflow:hidden}.reward{min-width:88px;flex:1;border:1px solid #ffffff12;border-radius:10px;background:#ffffff04;text-align:center;padding:12px 6px}.reward .reward-icon{font-size:19px;margin-bottom:8px}.reward b{display:block;font:10px 'DM Mono',monospace}.reward small{color:#89938b;font-size:9px}
        .reward.unlocked{border-color:#b8f36b46;background:#b8f36b0a}.reward.locked{opacity:.48}
        .match-layout{display:grid;grid-template-columns:minmax(0,1fr) 280px;gap:17px;align-items:start;padding-top:26px}.match-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}.scorebox{text-align:center}.scorebox strong{font:700 25px 'DM Mono',monospace;letter-spacing:.08em}.scorebox small{display:block;color:#8d998e;font:9px 'DM Mono',monospace;margin-top:5px;text-transform:uppercase;letter-spacing:.15em}.match-clock{display:block;color:#d7f583;font:700 13px 'DM Mono',monospace;margin-top:5px}.halftime-panel{display:flex;justify-content:space-between;align-items:center;gap:14px;background:#1d2b20;border:1px solid #b8f36b55;border-radius:10px;padding:13px 16px;margin-bottom:12px}.halftime-panel strong{font-size:13px}.halftime-panel small{display:block;color:#a6b0a5;font-size:10px;margin-top:4px}
        .pitch-wrap{padding:12px;background:#131a16;border:1px solid #ffffff14;border-radius:14px}.pitch-viewport{width:100%;aspect-ratio:22/11;overflow:hidden;position:relative;border-radius:8px;background:#244c35}.pitch{width:140%;height:auto;aspect-ratio:22/11;display:grid;grid-template-columns:repeat(22,1fr);grid-template-rows:repeat(11,1fr);position:relative;overflow:hidden;border-radius:8px;background:repeating-linear-gradient(90deg,#244c35 0%,#244c35 10%,#28543a 10%,#28543a 20%);border:1px solid #b9e4bb50;transition:transform .35s ease}
        .pitch:before{content:"";position:absolute;top:0;bottom:0;left:50%;border-left:1px solid #d7eed266;z-index:1;pointer-events:none}.pitch:after{content:"";position:absolute;left:50%;top:50%;width:15%;aspect-ratio:1;border:1px solid #d7eed266;border-radius:50%;transform:translate(-50%,-50%);pointer-events:none}
        .goal-overlay{position:absolute;inset:0;pointer-events:none;z-index:3}.penalty-box{position:absolute;top:25%;height:50%;width:10%;border:1px solid #d7eed266}.penalty-box.left{left:0;border-left:0}.penalty-box.right{right:0;border-right:0}.goal-frame{position:absolute;top:38%;height:24%;width:2.5%;border:2px solid #f0ffe0dd;background:repeating-linear-gradient(0deg,#e9f4e012 0 5px,#e9f4e044 5px 6px);box-shadow:0 0 8px #dfffc866}.goal-frame.left{left:-.2%;border-left:0;border-radius:0 4px 4px 0}.goal-frame.right{right:-.2%;border-right:0;border-radius:4px 0 0 4px}
        .cell{position:relative;z-index:2;border-right:1px solid #d7eed20c;border-bottom:1px solid #d7eed20c;display:grid;place-items:center;background:transparent;padding:0}.cell:hover{background:#ffffff17}.cell.goal-left{border-right:2px solid #d7eed2a0}.cell.goal-right{border-left:2px solid #d7eed2a0}.cell.move-available{background:#b8f36b0d}.move-marker{position:absolute;width:43%;aspect-ratio:1;border:1px solid #dbffadaa;border-radius:50%;background:#c9ffa944;box-shadow:0 0 14px #c9ffa933;pointer-events:none;transition:transform .16s ease,background .16s ease}.cell.move-available:hover .move-marker{transform:scale(1.2);background:#d5ffb477}.cell.pass-target{background:#6be8f226;box-shadow:inset 0 0 0 2px #6be8f2aa}.cell.pass-target .token{outline:3px solid #6be8f2;outline-offset:2px;box-shadow:0 0 18px #6be8f2aa}.cell.nutmeg-target{background:#f5d1661c;box-shadow:inset 0 0 0 2px #f5d16688}.cell.nutmeg-target .token{outline:3px solid #f5d166;outline-offset:2px}.interaction-marker{position:absolute;z-index:4;right:4%;bottom:4%;width:58%;aspect-ratio:1;border-radius:50%;display:grid;place-items:center;font:700 clamp(6px,.65vw,9px) 'DM Mono',monospace;color:#07110e;border:1px solid #ffffffdd;box-shadow:0 1px 5px #0009;pointer-events:none}.pass-marker{background:#6be8f2}.nutmeg-marker{background:#f5d166}
        .token{width:clamp(17px,2.3vw,28px);height:clamp(17px,2.3vw,28px);border-radius:50%;display:grid;place-items:center;font:700 clamp(7px,.72vw,10px) 'DM Mono',monospace;color:#10150f;box-shadow:0 2px 8px #0008;position:relative}
        .token.away{background:#ec695e!important;color:#fff}.token.selected{outline:2px solid white;outline-offset:2px;box-shadow:0 0 14px #fff8}.ball{position:absolute;width:8px;height:8px;border-radius:50%;background:#fff;box-shadow:0 0 0 2px #121712,0 0 7px #fff8;top:-3px;right:-2px}
        .ball-only{font-size:14px;filter:drop-shadow(0 1px 2px #000)}.legend{display:flex;gap:14px;color:#9ca79d;font:9px 'DM Mono',monospace;padding:12px 3px 2px}.legend i{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:5px}.message{padding:11px 13px;border-radius:9px;background:#ffffff08;color:#c0c9c0;font-size:11px;line-height:1.5;margin-top:12px;min-height:40px}
        .sidebar{display:flex;flex-direction:column;gap:12px}.side-panel{background:#141a17;border:1px solid #ffffff12;border-radius:13px;padding:17px}.side-panel h3{font-size:12px;margin:0 0 12px}.selected-card{display:flex;gap:11px;align-items:center}.selected-card .player-avatar{width:40px;height:40px}.selected-card b{font-size:11px}.selected-card small{display:block;color:#8d998e;font-size:9px;margin-top:3px}.ability{font-size:10px;color:#b8f36b;margin-top:12px;line-height:1.5}.action-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.action{padding:10px 7px;background:#ffffff08;border:1px solid #ffffff10;border-radius:8px;font-size:10px;font-weight:700}.action:hover:not(:disabled){border-color:#b8f36b77;color:#b8f36b}.action:disabled{opacity:.35;cursor:not-allowed}.chance{display:block;font:9px 'DM Mono',monospace;color:#909b91;margin-top:4px}
        .locker-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:11px;margin-top:22px}.roster-card{background:#141a17;border:1px solid #ffffff12;border-radius:12px;padding:15px}.roster-top{display:flex;align-items:center;gap:10px}.roster-card h3{font-size:12px;margin:0}.roster-card p{color:#929d93;font-size:10px;line-height:1.5;min-height:31px}.roster-meta{display:flex;justify-content:space-between;align-items:center;font:9px 'DM Mono',monospace;color:#b8f36b}.roster-meta select{background:#1b241e;color:#dfe8df;border:1px solid #ffffff20;border-radius:6px;padding:5px;font:9px 'DM Mono',monospace}.format-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:11px;margin-top:16px}.format-card{background:#141a17;border:1px solid #ffffff12;border-radius:12px;padding:15px}.format-card h3{font-size:12px;margin:0 0 7px}.format-card p{color:#929d93;font-size:10px;min-height:28px}.format-card button{width:100%;margin-top:10px}
        .quickplay-page{padding-top:48px}.quickplay-options{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:13px;margin-top:25px}.quickplay-option{background:#141a17;border:1px solid #ffffff16;border-radius:14px;padding:21px;min-height:192px;display:flex;flex-direction:column;align-items:flex-start;text-align:left}.quickplay-option:hover:not(:disabled){border-color:#b8f36b77;transform:translateY(-2px)}.quickplay-option strong{font-size:15px;margin:13px 0 7px}.quickplay-option p{font-size:11px;color:#929d93;line-height:1.65;margin:0 0 18px}.quickplay-option .badge{margin-top:auto}.quickplay-option.disabled{opacity:.62;cursor:not-allowed}.quickplay-icon{font-size:23px}
        .pass-page{margin-top:26px}.pass-banner{background:linear-gradient(100deg,#202f21,#17201b);border:1px solid #b8f36b20;border-radius:14px;padding:24px;margin:21px 0}.pass-banner h2{font-size:18px;margin:0}.pass-banner p{font-size:11px;color:#9aa59b}.pass-levels{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:10px}.level-card{background:#141a17;border:1px solid #ffffff12;border-radius:11px;padding:15px}.level-card h3{font:11px 'DM Mono',monospace;color:#b8f36b;margin:0 0 9px}.level-card b{font-size:12px}.level-card p{font-size:10px;color:#909b91;min-height:26px}.level-card.player-reward{display:flex;flex-direction:column;min-height:160px}.level-card.player-reward .player-avatar{margin-bottom:10px}.victory-page{max-width:900px;margin:70px auto;background:linear-gradient(145deg,#1d2b20,#141a17);border:1px solid #b8f36b66;border-radius:20px;padding:clamp(24px,6vw,58px);text-align:center;box-shadow:0 22px 90px #0008}.victory-page .victory-icon{font-size:50px}.victory-page h1{margin-top:14px}.victory-score{font:700 clamp(38px,7vw,68px) 'DM Mono',monospace;color:#d7f583;letter-spacing:.08em;margin:24px 0}.victory-page p{color:#aab5ab;line-height:1.7}.victory-reward{display:inline-block;margin:12px 0 24px;padding:11px 16px;border:1px solid #b8f36b44;border-radius:9px;color:#d7f583;font:12px 'DM Mono',monospace}.victory-actions{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin-top:18px}
        .campaign-page{padding-top:38px}.campaign-levels{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:11px;margin:24px 0}.campaign-level{min-height:145px;background:#141a17;border:1px solid #ffffff14;border-radius:12px;padding:15px;text-align:left}.campaign-level.available{border-color:#b8f36b55}.campaign-level.locked{opacity:.52;cursor:not-allowed}.campaign-level h3{font:11px 'DM Mono',monospace;color:#b8f36b;margin:0 0 11px}.campaign-level strong{font-size:13px}.campaign-level p{font-size:10px;color:#909b91;margin:7px 0 12px}.campaign-level .badge{display:inline-block}
        .settings-page{padding-top:40px}.settings-card{max-width:760px;margin-top:24px;background:#141a17;border:1px solid #ffffff12;border-radius:14px;padding:22px}.setting-row{display:flex;justify-content:space-between;align-items:center;gap:18px;padding:16px 0;border-bottom:1px solid #ffffff12}.setting-row:last-child{border-bottom:0}.setting-copy strong{display:block;font-size:13px}.setting-copy small{display:block;color:#929d93;font-size:10px;line-height:1.6;margin-top:5px}.setting-options{display:flex;gap:7px;flex-wrap:wrap}.setting-options button{background:#ffffff0b;border:1px solid #ffffff18;border-radius:8px;padding:9px 12px;font-size:10px}.setting-options button.active{background:#b8f36b18;border-color:#b8f36b75;color:#b8f36b}.switch-btn{min-width:76px}.game-caption{position:absolute;z-index:6;left:50%;bottom:16px;transform:translateX(-50%);width:max-content;max-width:85%;padding:8px 13px;border:1px solid #ffffff35;border-radius:8px;background:#101713e8;color:#fff;text-align:center;line-height:1.45;box-shadow:0 5px 16px #0007;pointer-events:none}.game-caption.small{font-size:15px}.game-caption.medium{font-size:19.5px}.game-caption.large{font-size:24px}.match-fullscreen{position:fixed;inset:0;z-index:20;overflow:auto;padding:0 22px 18px;background:#0d1110}.match-fullscreen .topbar{display:none}.match-fullscreen .match-layout{max-width:none;min-height:100vh;padding-top:18px;grid-template-columns:minmax(0,1fr) 300px;align-items:center}.match-fullscreen .pitch-viewport{width:100%}.match-fullscreen .pitch-wrap{padding:14px}
        .toast{position:fixed;right:24px;bottom:23px;background:#d5f5b3;color:#17200e;padding:12px 17px;border-radius:9px;font-size:11px;font-weight:700;box-shadow:0 10px 40px #0008;z-index:9}
        @media(max-width:850px){.app-shell{padding:0 16px 35px}.hero{padding-top:37px;align-items:start;flex-direction:column}.home-grid{grid-template-columns:1fr}.match-layout{grid-template-columns:1fr}.sidebar{display:grid;grid-template-columns:1fr 1fr}.nav{gap:0}.nav button{padding:9px 8px;font-size:10px}.wallet{font-size:10px}.topbar{gap:8px}.pitch-wrap{padding:7px}.format-grid{grid-template-columns:1fr}.quickplay-options{grid-template-columns:1fr}.match-fullscreen{padding:0 12px 14px}.match-fullscreen .match-layout{grid-template-columns:1fr;align-items:start;padding-top:12px}.match-fullscreen .pitch-wrap{padding:7px}}
        @media(max-width:520px){.brand{font-size:12px}.brand small{font-size:7px}.brand-mark{width:29px;height:29px}.nav button{font-size:9px;padding:8px 6px}.wallet .xp-pill{display:none}.sidebar{grid-template-columns:1fr}.hero-cta{width:100%}.hero-cta button{flex:1}.player-list{grid-template-columns:1fr 1fr}.match-top{gap:8px}.match-top .ghost-btn{padding:7px}.pitch-wrap{padding:4px}.cell{border-width:0 1px 1px 0}.setting-row{align-items:flex-start;flex-direction:column}.match-fullscreen{padding:0 6px 10px}.match-fullscreen .pitch-wrap{padding:4px}}
      `}</style>
      <header className="topbar">
        <div className="brand"><div className="brand-mark">⚽</div><div>BLITZ LEAGUE<small>TACTICAL PITCH · SEASON 01</small></div></div>
        <nav className="nav">
          <button className={screen === "home" ? "active" : ""} onClick={() => { stopQuickplay(); setScreen("home"); }}>DASHBOARD</button>
          <button className={screen === "campaign" ? "active" : ""} onClick={() => { stopQuickplay(); setScreen("campaign"); }}>CAMPAIGN</button>
          <button className={screen === "quickplay" ? "active" : ""} onClick={showQuickplayOptions}>QUICKPLAY</button>
          <button className={screen === "locker" ? "active" : ""} onClick={() => setScreen("locker")}>LOCKER ROOM</button>
          <button className={screen === "pass" ? "active" : ""} onClick={() => setScreen("pass")}>SEASON PASS</button>
          <button className={screen === "settings" ? "active" : ""} onClick={() => { setPassMode(false); setScreen("settings"); }}>SETTINGS</button>
        </nav>
        <div className="wallet"><span className="coin">◈ {coins}</span><span className="xp-pill">LV {battlePassLevel}</span></div>
      </header>

      {screen === "home" && <div className="content">
        <section className="hero">
          <div><div className="eyebrow">Turn-based football · season one</div><h1>Own the pitch.</h1><p className="subtitle">Build your MLS-inspired squad, outplay the opposition, and find the back of the net. Every move matters.</p></div>
          <div className="hero-cta"><button className="primary" onClick={() => setScreen("campaign")}>▶ &nbsp;CAMPAIGN MAP</button><button className="secondary" onClick={showQuickplayOptions}>⚡ &nbsp;QUICKPLAY</button><button className="secondary" onClick={() => setScreen("locker")}>LOCKER ROOM</button></div>
        </section>
        <div className="home-grid">
          <section className="panel">
            <div className="panel-heading"><h2>Campaign trail</h2><span>Progression</span></div>
            <button className="campaign-card" style={{ width: "100%", textAlign: "left", cursor: "pointer" }} onClick={() => setScreen("campaign")}><div><strong>Match {Math.min(level, campaignStageCount)} · {fmt(activeFormat).name}</strong><p>See all {campaignStageCount} levels. Beat each match to unlock the next.</p></div><span className="badge">OPEN MAP →</span></button>
            <div className="small-note">BATTLE PASS · LEVEL {battlePassLevel} OF {battlePassFinalLevel}</div><div className="progress-track"><div className="progress-fill" style={{ width: `${passProgress}%` }} /></div>
            <div className="small-note">{battlePassLevel === battlePassFinalLevel ? "Final level complete" : `${nextLevelXpTarget - xp} XP to Level ${battlePassLevel + 1}`}</div>
            <div className="panel-heading" style={{ marginTop: 25 }}><h2>Your starting XI</h2><span>{startingXI.length} on field · {homePlayers.length} available · avg {startingXI.length ? Math.round(startingXI.reduce((total, player) => total + player.rating, 0) / startingXI.length) : 0} OVR</span></div>
            <div className="player-list">{startingXI.map((player) => <div className="player-chip" key={player.id}><div className="player-avatar" style={{ background: player.color }}>{player.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}</div><div><b>{player.name}</b><small>{player.club} · {player.position}</small></div><span className="rating">{player.rating}</span></div>)}</div>
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
            {formats.map((f) => <div key={f.id} className="campaign-card" style={{ padding: "13px 15px", marginBottom: 8, opacity: battlePassLevel >= f.unlock ? 1 : .5 }}><div><strong style={{ fontSize: 11 }}>{f.name}</strong><p>{f.detail}</p></div><span className="badge">{battlePassLevel >= f.unlock ? (activeFormat === f.id ? "ACTIVE" : "READY") : `LV ${f.unlock}`}</span></div>)}
          </section>
        </div>
      </div>}

      {screen === "campaign" && <div className="content campaign-page">
        <button className="ghost-btn" onClick={() => setScreen("home")}>← DASHBOARD</button>
        <div className="eyebrow" style={{ marginTop: 25 }}>Your road to the final</div>
        <h1>Campaign</h1>
        <p className="subtitle">All {campaignStageCount} levels are shown. Win the current match to unlock the next; locked matches cannot be started early.</p>
        <div className="pass-banner"><h2>{level > campaignStageCount ? "Campaign complete" : `Next up: Level ${level}`}</h2><p>{level > campaignStageCount ? "You have beaten every campaign level. Replay any level whenever you like." : `${Math.max(0, Math.min(level - 1, campaignStageCount))} of ${campaignStageCount} levels complete · earn ${100 * level} XP for a win at this stage, with larger rewards as the campaign advances.`}</p></div>
        <div className="campaign-levels">{campaignStageNames.map((name, index) => {
          const stage = index + 1;
          const unlocked = stage <= level;
          const completed = stage < level;
          return <button key={stage} className={`campaign-level ${unlocked ? "available" : "locked"}`} disabled={!unlocked} onClick={() => startMatch(stage)}>
            <h3>LEVEL {String(stage).padStart(2, "0")} {completed ? "· COMPLETE" : ""}</h3>
            <strong>{name}</strong>
            <p>{stage === level ? `AI level ${Math.ceil(stage / 2)} · ${100 * stage} XP for a win` : `AI level ${Math.ceil(stage / 2)} · ${100 * stage} XP · first to ${activeFormat === "golden-goal" ? 1 : activeFormat === "small-sided" ? 2 : 3} goals`}</p>
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

      {screen === "locker" && <div className="content" style={{ paddingTop: 40 }}>
        <div className="eyebrow">Your club · manage squad</div><h1>Locker room</h1><p className="subtitle">Players are selected for the first 11 in their listed position. Change a player’s position here to customize your lineup. Ratings and ability stats are game estimates, not official MLS ratings.</p>
        <div className="panel-heading" style={{ marginTop: 28 }}><h2>Player roster</h2><span>{homePlayers.length} unlocked · {coins} coins</span></div>
        <div className="locker-grid">{roster.map((player) => {
          const unlocked = unlockedPlayers.includes(player.id);
          const unlockAt = playerUnlocks[player.id];
          const currentPosition = customPositions[player.id] ?? player.position;
          const isStarter = startingXI.some((starter) => starter.id === player.id);
          return <article key={player.id} className="roster-card">
            <div className="roster-top"><div className="player-avatar" style={{ background: player.color }}>{player.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}</div><div><h3>{player.name}</h3><small style={{ color: "#89948b", fontSize: 9 }}>{player.club}</small></div><span className="rating">{player.rating}</span></div>
            <p>{player.ability} · Ability {player.abilityStat}/100</p>
            <div className="roster-meta"><span>{unlocked ? (isStarter ? "STARTING XI" : "SQUAD") : `PASS LV ${unlockAt}`}</span>
              <select aria-label={`${player.name} position`} value={currentPosition} disabled={!unlocked}
                onChange={(event) => {
                  const position = event.target.value as Position;
                  setCustomPositions((current) => ({ ...current, [player.id]: position === player.position ? undefined : position }));
                  setNotice(`${player.name} position set to ${position}. Your starting XI updates automatically.`);
                }}>
                {(["GK", "DEF", "MID", "FWD"] as Position[]).map((position) => <option key={position} value={position}>{position}</option>)}
              </select>
            </div>
            {!unlocked && <button className="secondary" style={{ width: "100%", marginTop: 10, padding: 9 }} disabled>UNLOCK IN SEASON PASS</button>}
          </article>;
        })}</div>
        <div className="panel-heading" style={{ marginTop: 33 }}><h2>Match formats</h2><span>Unlock at Season Pass Levels 10 and 20</span></div>
        <div className="format-grid">{formats.map((f) => <article className="format-card" key={f.id}><h3>{f.name}</h3><p>{f.detail}</p>{battlePassLevel >= f.unlock ? <button className={activeFormat === f.id ? "primary" : "secondary"} onClick={() => { setActiveFormat(f.id); setNotice(`${f.name} selected.`); }}>{activeFormat === f.id ? "SELECTED" : "SELECT FORMAT"}</button> : <button className="secondary" disabled>UNLOCK AT LEVEL {f.unlock}</button>}</article>)}</div>
      </div>}

      {screen === "quickplay" && <div className="content quickplay-page">
        <button className="ghost-btn" onClick={() => setScreen("home")}>← DASHBOARD</button>
        <div className="eyebrow" style={{ marginTop: 25 }}>Choose how to play · full 11v11</div>
        <h1>Quickplay</h1>
        <p className="subtitle">Pick a match type. Quickplay uses the full pitch, a 90-minute clock, halftime, and first-to-three-goals rules.</p>
        <div className="quickplay-options">
          <button className="quickplay-option" onClick={startCpuQuickplay}>
            <span className="quickplay-icon">🤖</span>
            <strong>CPU · 11v11</strong>
            <p>Play on your own against the computer. The opponent gets stronger as your campaign level rises.</p>
            <span className="badge">PLAY NOW</span>
          </button>
          <button className="quickplay-option" onClick={startLocalQuickplay}>
            <span className="quickplay-icon">👥</span>
            <strong>Local · 11v11</strong>
            <p>Two players, one device. Take turns and hand the screen to the other player. Both teams use the same squad.</p>
            <span className="badge">PASS &amp; PLAY</span>
          </button>
          <button className="quickplay-option disabled" disabled title="Online matchmaking requires a hosted game server.">
            <span className="quickplay-icon">🌐</span>
            <strong>Online · 11v11</strong>
            <p>Play against someone on another device. Online matchmaking is not connected because this game has no hosted game server.</p>
            <span className="badge">SERVER REQUIRED</span>
          </button>
        </div>
      </div>}

      {screen === "victory" && <section className="victory-page">
        <div className="victory-icon" aria-hidden="true">{match.score[0] === match.score[1] ? "🤝" : match.score[0] > match.score[1] ? "🏆" : "⚽"}</div>
        <div className="eyebrow">{match.minute >= 90 ? "FULL TIME" : "MATCH COMPLETE"}</div>
        <h1>{match.score[0] === match.score[1] ? "A hard-fought draw" : match.score[0] > match.score[1] ? "Victory!" : "Final whistle"}</h1>
        <div className="victory-score">{match.score[0]} — {match.score[1]}</div>
        <p>{quickplayMode === "local"
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
        <div className="eyebrow">Earn rewards as you play</div><h1>Season pass</h1><p className="subtitle">Each level takes 1,000 XP. Wins earn 100 XP in regular matches, while campaign wins scale with the stage. Unlock Street 3v3 at Level 10 and Golden Goal at Level 20.</p>
        <div className="pass-banner"><h2>Level {battlePassLevel} of {battlePassFinalLevel} <span style={{ color: "#b8f36b" }}>·</span> {xp.toLocaleString()} XP</h2><p>{battlePassLevel === battlePassFinalLevel ? "You reached the final level. Your progress is saved on this device." : `${nextLevelXpTarget - xp} XP to reach Level ${battlePassLevel + 1}. Each level requires 1,000 XP.`}</p><div className="progress-track"><div className="progress-fill" style={{ width: `${passProgress}%` }} /></div><div className="small-note">{battlePassLevel === battlePassFinalLevel ? "FINAL LEVEL COMPLETE" : `${xpTowardNextLevel} / ${xpForNextLevel} XP toward Level ${battlePassLevel + 1}`}</div></div>
        <div className="panel-heading"><h2>Level rewards</h2><span>{passPlayerRewards.length} MLS players · {battlePassFinalLevel} total levels · one reward per level</span></div>
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
                ? `${playerReward.club} · ${playerReward.position} · ${playerReward.rating} OVR`
                : formatReward?.detail ?? "Campaign coin bonus"}</p>
            <span className="small-note">{requiredXp.toLocaleString()} XP required</span>
            {unlocked ? <span className="badge">LEVEL COMPLETE</span> : <span className="small-note">{(requiredXp - xp).toLocaleString()} XP TO GO</span>}
          </article>;
        })}</div>
      </div>}

      {screen === "match" && <div className="content match-layout">
        <section>
          <div className="match-top"><button className="ghost-btn" onClick={() => { stopQuickplay(); setMatchFullscreen(false); setScreen("home"); }}>← DASHBOARD</button><div className="scorebox"><strong>{scoreLabel}</strong><small>{quickplayMode === "local" ? `${match.turn === "home" ? "HOME" : "AWAY"} TURN · LOCAL QUICKPLAY` : quickplayMode === "cpu" ? "CPU QUICKPLAY · YOUR TURN" : `YOU · MATCH ${match.campaignStage}`} · {fmt(quickplayMode !== null ? "classic" : activeFormat).name.toUpperCase()}</small><span className="match-clock">{clockLabel} · HALF {match.half}</span></div><button className="ghost-btn" onClick={() => setMatchFullscreen((fullscreen) => !fullscreen)} aria-label={matchFullscreen ? "Exit in-page fullscreen" : "Expand game to fill page"}>{matchFullscreen ? "⛶ EXIT FULLSCREEN" : "⛶ FULLSCREEN GAME"}</button></div>
          {match.halftime && <div className="halftime-panel"><div><strong>Halftime · {scoreLabel}</strong><small>Teams have switched ends. Each in-game minute lasts 3.5 seconds.</small></div><button className="primary" onClick={resumeSecondHalf}>START SECOND HALF</button></div>}
          <div className="pitch-wrap"><div className="pitch-viewport"><div className="pitch" aria-label="22 by 11 football pitch" style={{ transform: `translate(-${pitchCameraX}%, -${pitchCameraY}%)` }}>
            {Array.from({ length: 11 }, (_, y) => Array.from({ length: 22 }, (_, x) => {
              const token = match.tokens.find((t) => t.x === x && t.y === y);
              const ballHere = match.ball.x === x && match.ball.y === y;
              const selected = token?.player.id === match.selected;
              const isAvailable = availableMoveKeys.has(`${x},${y}`);
              const isPassTarget = !!token && passMode && eligiblePassIds.has(token.player.id);
              const isNutmegTarget = !!token && !passMode && token.player.id === nutmegTargetId;
              return <button aria-label={`Tile ${x + 1}, ${y + 1}${token ? `: ${token.player.name}` : ""}${ballHere ? ", ball" : ""}${isAvailable ? ", available move" : ""}${isPassTarget ? ", pass receiver" : ""}${isNutmegTarget ? ", attempt nutmeg" : ""}`} className={`cell ${x === 0 ? "goal-left" : ""} ${x === 21 ? "goal-right" : ""} ${isAvailable ? "move-available" : ""} ${isPassTarget ? "pass-target" : ""} ${isNutmegTarget ? "nutmeg-target" : ""}`} key={`${x}-${y}`} onClick={() => onCellClick(x, y)}>
                {isAvailable && <span className="move-marker" />}
                {token ? <span className={`token ${token.side} ${selected ? "selected" : ""}`} style={{ background: token.side === "home" ? "#b8f36b" : "#ec695e" }}>{token.player.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}{ballHere && <i className="ball" />}</span> : ballHere ? <span className="ball-only">⚽</span> : null}
                {isPassTarget && <span className="interaction-marker pass-marker" aria-hidden="true">↗</span>}
                {isNutmegTarget && <span className="interaction-marker nutmeg-marker" aria-hidden="true">〰</span>}
              </button>;
            }))}
            <div className="goal-overlay" aria-hidden="true"><span className="penalty-box left" /><span className="penalty-box right" /><span className="goal-frame left" /><span className="goal-frame right" /></div>
          </div>{captionsEnabled && captionText && <div className={`game-caption ${captionSize}`} aria-live="polite">{captionText}</div>}</div><div className="legend"><span><i style={{ background: "#b8f36b" }} />{quickplayMode === "local" ? "HOME" : "YOUR SQUAD"}</span><span><i style={{ background: "#ec695e" }} />{quickplayMode === "local" ? "AWAY" : "OPPOSITION"}</span><span>⚽ BALL</span><span>{quickplayMode !== null || activeFormat !== "small-sided" ? "11v11" : "3v3"} · 22 × 11 TILES</span></div></div>
          <div className="message">{match.message}</div>
        </section>
        <aside className="sidebar">
          <section className="side-panel"><h3>On the ball</h3>{selectedPlayer ? <><div className="selected-card"><div className="player-avatar" style={{ background: selectedPlayer.player.color }}>{selectedPlayer.player.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}</div><div><b>{selectedPlayer.player.name}</b><small>{selectedPlayer.player.club} · {selectedPlayer.player.position}</small></div></div><div className="ability">{abilityDescription(selectedPlayer.player)}</div></> : <small style={{ color: "#8e998f" }}>Select a player on the pitch</small>}</section>
          <section className="side-panel"><h3>Actions</h3><div className="action-grid">
            <button className="action" disabled={!canShoot || !ownTurn} onClick={shoot}>⚽ SHOOT<span className="chance">{selectedPlayer && canShoot ? `${shotAccuracy(selectedPlayer, match.tokens, ownGoalDistance(selectedPlayer, match.half), shotAngleDegrees(selectedPlayer, match.half))}% · ${shotAngleDegrees(selectedPlayer, match.half)}° angle · range ${shotRange(selectedPlayer.player)}` : "get in range"}</span></button>
            <button className="action" disabled={!selectedPlayer || !ownTurn || (!canAct && !passMode) || selectedPlayer.side !== activeSide || match.ball.x !== selectedPlayer.x || match.ball.y !== selectedPlayer.y} onClick={pass}>{passMode ? "× CANCEL PASS" : "↗ PASS"}<span className="chance">{passMode ? "tap a glowing teammate" : `teammate ≤ ${passingRange} tiles`}</span></button>
            <button className="action" disabled={!canNutmeg || !ownTurn} onClick={nutmeg}>〰 NUTMEG<span className="chance">{selectedPlayer ? `${nutmegChance(selectedPlayer.player)}% · fail: ${quickplayMode === "local" ? "2 player turns" : "2 AI turns"}` : "adjacent defender"}</span></button>
            <button className="action" disabled={!canSteal || !ownTurn} onClick={steal}>🛡 STEAL<span className="chance">{canSteal ? `${stealChance}% · adjacent carrier` : "defend near the ball"}</span></button>
            <button className="action" disabled={!ownTurn} onClick={() => endTurn({ ...match, message: quickplaySide !== null ? "Turn passed. Hand the device to the other player." : "You hold position. Opposition's turn." })}>⏭ END TURN<span className="chance">{quickplaySide !== null ? "pass the device" : "let AI play"}</span></button>
          </div></section>
          <section className="side-panel"><h3>{match.finished ? "Full time" : quickplaySide !== null ? `${match.turn === "home" ? "Home" : "Away"} player · ${ownTurn ? "your turn" : "opponent's turn"}` : ownTurn ? "Your turn" : "Opponent's turn"}</h3><div style={{ color: "#929d93", fontSize: 10, lineHeight: 1.8 }}>{quickplaySide !== null ? "Pass-and-play on one device: pass the screen after each turn. Each player controls the team whose turn it is." : "Select one of your players, then click an open tile to move."} Each turn allows one drive and one action. A successful nutmeg grants one extra drive and action; a failed attempt gives the opponent two turns. The ball carrier can pass, shoot, or risk a nutmeg against an adjacent defender. Shot angle affects accuracy. Matches last 90 in-game minutes, with halftime at 45; each game minute takes 3.5 seconds. Existing goal-target rules can end a match earlier.</div><div className="small-note" style={{ marginTop: 10 }}>DRIVE {Math.min(match.drivesUsed, 1 + match.bonusDrives)}/{1 + match.bonusDrives} · ACTION {Math.min(match.actionsUsed, 1 + match.bonusActions)}/{1 + match.bonusActions}</div></section>
        </aside>
      </div>}
      {notice && <button className="toast" onClick={() => setNotice("")}>{notice} &nbsp; ×</button>}
    </main>
  );
}

export default App;
