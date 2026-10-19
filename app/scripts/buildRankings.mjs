import fs from "node:fs/promises";

const candidatesFile = new URL(
    "../data/rankingCandidatesWithShadows.json",
  import.meta.url
);

const gameMasterFile = new URL(
  "../data/gameMasterRaw.json",
  import.meta.url
);

const outputFile = new URL(
  "../data/rankings.json",
  import.meta.url
);

const candidates = JSON.parse(
  await fs.readFile(candidatesFile, "utf8")
);

const gameMaster = JSON.parse(
  await fs.readFile(gameMasterFile, "utf8")
);

const pokemonSettings = new Map();
const moveSettings = new Map();

function inspect(value) {
  if (!value || typeof value !== "object") return;

  if (value.pokemonSettings && value.templateId) {
    pokemonSettings.set(
      value.templateId,
      value.pokemonSettings
    );
  }

  if (value.moveSettings) {
    const move = value.moveSettings;

    const moveId =
      move.movementId ??
      move.uniqueId ??
      move.moveId;

    if (moveId) {
      moveSettings.set(moveId, move);
    }
  }

  if (Array.isArray(value)) {
    value.forEach(inspect);
  } else {
    Object.values(value).forEach(inspect);
  }
}

inspect(gameMaster);

function moveType(move) {
  return move.pokemonType ?? move.type ?? "";
}

function hasStab(candidate, move) {
  return candidate.types.includes(moveType(move));
}

function moveDamage(candidate, move) {
  const power = move.power ?? 0;
  const attack = candidate.attack + 15;
  const referenceDefense = 200;
  const stab = hasStab(candidate, move) ? 1.2 : 1;

  return (
    Math.floor(
      0.5 *
        power *
        (attack / referenceDefense) *
        stab
    ) + 1
  );
}

function durationSeconds(move) {
  const duration =
    move.durationMs ??
    move.durationMsRaw ??
    1000;

  return Math.max(duration / 1000, 0.5);
}

function calculateMovesetDps(
  candidate,
  fastMove,
  chargedMove
) {
  const energyGain = Math.max(
    Math.abs(fastMove.energyDelta ?? 1),
    1
  );

  const energyCost = Math.max(
    Math.abs(chargedMove.energyDelta ?? 50),
    1
  );

  const fastMovesNeeded = Math.ceil(
    energyCost / energyGain
  );

  const totalDamage =
    fastMovesNeeded *
      moveDamage(candidate, fastMove) +
    moveDamage(candidate, chargedMove);

  const totalTime =
    fastMovesNeeded *
      durationSeconds(fastMove) +
    durationSeconds(chargedMove);

  return totalDamage / totalTime;
}

function normalize(value, minimum, maximum) {
  if (maximum === minimum) return 100;

  return (
    ((value - minimum) /
      (maximum - minimum)) *
    100
  );
}

const calculated = candidates.map((candidate) => {
    const baseTemplateId = candidate.isShadow
    ? candidate.templateId.replace("_SHADOW", "")
    : candidate.templateId;
  
  const settings =
    pokemonSettings.get(baseTemplateId) ?? {};

  const fastMoveIds = [
    ...(settings.quickMoves ?? []),
    ...(settings.eliteQuickMove ?? []),
    ...(settings.eliteQuickMoves ?? []),
  ];

  const chargedMoveIds = [
    ...(settings.cinematicMoves ?? []),
    ...(settings.eliteCinematicMove ?? []),
    ...(settings.eliteCinematicMoves ?? []),
  ];

  const fastMoves = fastMoveIds
    .map((id) => moveSettings.get(id))
    .filter(Boolean);

  const chargedMoves = chargedMoveIds
    .map((id) => moveSettings.get(id))
    .filter(Boolean);

  let bestDps = 0;
  let bestFastMove = null;
  let bestChargedMove = null;

  for (const fastMove of fastMoves) {
    for (const chargedMove of chargedMoves) {
      const dps = calculateMovesetDps(
        candidate,
        fastMove,
        chargedMove
      );

      if (dps > bestDps) {
        bestDps = dps;
        bestFastMove =
          fastMove.movementId ??
          fastMove.uniqueId ??
          null;

        bestChargedMove =
          chargedMove.movementId ??
          chargedMove.uniqueId ??
          null;
      }
    }
  }

  const shadowDamage = candidate.isShadow ? 1.2 : 1;
  const shadowDefense = candidate.isShadow ? 0.833 : 1;
  
  bestDps = bestDps * shadowDamage;
  
  const adjustedDefense =
  (candidate.defense + 15) * shadowDefense;

const adjustedStamina =
  candidate.stamina + 15;

const rawBulk =
  adjustedDefense * adjustedStamina;

const rawDbd =
  bestDps * rawBulk;

  const rawCharge =
    chargedMoves.reduce((best, move) => {
      const damage = moveDamage(candidate, move);
      const time = durationSeconds(move);

      return Math.max(best, damage / time);
    }, 0) * shadowDamage;

    return {
        ...candidate,
        bestFastMove,
        bestChargedMove,
        rawDps: bestDps,
        rawBulk,
        rawDbd,
        rawCharge,
      };
});

const valid = calculated.filter(
  (item) => item.rawDps > 0
);

if (valid.length === 0) {
  throw new Error(
    "No moves were matched. Move field names need inspection."
  );
}

const dpsValues = valid.map((item) => item.rawDps);
const dbdValues = valid.map((item) => item.rawDbd);
const chargeValues = valid.map(
  (item) => item.rawCharge
);

const ranges = {
  dpsMin: Math.min(...dpsValues),
  dpsMax: Math.max(...dpsValues),
  dbdMin: Math.min(...dbdValues),
  dbdMax: Math.max(...dbdValues),
  chargeMin: Math.min(...chargeValues),
  chargeMax: Math.max(...chargeValues),
};

const scored = valid.map((item) => {
  const dps = normalize(
    item.rawDps,
    ranges.dpsMin,
    ranges.dpsMax
  );

  const dbd = normalize(
    item.rawDbd,
    ranges.dbdMin,
    ranges.dbdMax
  );

  const charge = normalize(
    item.rawCharge,
    ranges.chargeMin,
    ranges.chargeMax
  );

  const psv =
  dbd * 0.67 +
  dps * 0.21 +
  charge * 0.12;

  return {
    ...item,
    dps: Number(dps.toFixed(2)),
    dbd: Number(dbd.toFixed(2)),
    charge: Number(charge.toFixed(2)),
    psv: Number(psv.toFixed(2)),
  };
});

scored.sort((a, b) => b.psv - a.psv);

const ranked = scored.map((item, index) => {
  const rank = index + 1;

  let tier = "D";

  const godLimit = Math.floor(scored.length * 0.01);
  const sPlusLimit = Math.floor(scored.length * 0.05);
  const sLimit = Math.floor(scored.length * 0.1);
  
  if (rank <= godLimit) tier = "God";
  else if (rank <= sPlusLimit) tier = "S+";
  else if (rank <= sLimit) tier = "S";
  else if (rank <= Math.floor(scored.length * 0.25)) {
    tier = "A";
  } else if (
    rank <= Math.floor(scored.length * 0.5)
  ) {
    tier = "B";
  } else if (
    rank <= Math.floor(scored.length * 0.75)
  ) {
    tier = "C";
  }

  const displayName =
  item.form === "NORMAL"
    ? item.pokemonId
    : item.form;

return {
  name: displayName
    .toLowerCase()
    .replaceAll("_", "-"),

  displayName: displayName
    .toLowerCase()
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" "),

    pokemonId: item.pokemonId,
    form: item.form,
    primaryType:
      item.types[0]?.replace(
        "POKEMON_TYPE_",
        ""
      ) ?? null,

    secondaryType:
      item.types[1]?.replace(
        "POKEMON_TYPE_",
        ""
      ) ?? null,

    attack: item.attack,
    defense: item.defense,
    stamina: item.stamina,

    bestFastMove: item.bestFastMove,
    bestChargedMove: item.bestChargedMove,

    dps: item.dps,
    dbd: item.dbd,
    charge: item.charge,
    psv: item.psv,

    overallRank: rank,
    typeRank: null,
    tier,
  };
});

for (const pokemon of ranked) {
  const sameType = ranked.filter(
    (candidate) =>
      candidate.primaryType ===
        pokemon.primaryType ||
      candidate.secondaryType ===
        pokemon.primaryType
  );

  pokemon.typeRank =
    sameType.findIndex(
      (candidate) =>
        candidate.name === pokemon.name
    ) + 1;
}

await fs.writeFile(
  outputFile,
  JSON.stringify(ranked, null, 2),
  "utf8"
);

console.log(`Ranking candidates: ${candidates.length}`);
console.log(`Ranked records with moves: ${ranked.length}`);
console.log("Created app/data/rankings.json");

console.log("\nTop 15 God Tier:");
console.table(
  ranked.slice(0, 15).map((item) => ({
    rank: item.overallRank,
    pokemon: item.displayName,
    psv: item.psv,
    dps: item.dps,
    dbd: item.dbd,
    charge: item.charge,
  }))
);