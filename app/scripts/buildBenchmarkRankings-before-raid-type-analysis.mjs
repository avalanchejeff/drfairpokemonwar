import fs from "node:fs/promises";

const candidatesFile = new URL(
  "../data/rankingCandidatesWithShadows.json",
  import.meta.url
);

const benchmarkFile = new URL(
  "../data/raidBenchmarks/2026.json",
  import.meta.url
);

const gameMasterFile = new URL(
  "../data/gameMasterRaw.json",
  import.meta.url
);

const outputFile = new URL(
  "../data/benchmarkRankings2026.json",
  import.meta.url
);

const candidates = JSON.parse(
  await fs.readFile(candidatesFile, "utf8")
);

const benchmark = JSON.parse(
  await fs.readFile(benchmarkFile, "utf8")
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

    if (moveId !== undefined && moveId !== null) {
      moveSettings.set(String(moveId), move);
    }
  }

  if (Array.isArray(value)) {
    value.forEach(inspect);
  } else {
    Object.values(value).forEach(inspect);
  }
}

inspect(gameMaster);

function normalizeType(type) {
  return String(type ?? "")
    .replace("POKEMON_TYPE_", "")
    .toUpperCase();
}

const typeEffectiveness = {
  NORMAL: {
    ROCK: 0.625,
    GHOST: 0.391,
    STEEL: 0.625,
  },
  FIRE: {
    FIRE: 0.625,
    WATER: 0.625,
    GRASS: 1.6,
    ICE: 1.6,
    BUG: 1.6,
    ROCK: 0.625,
    DRAGON: 0.625,
    STEEL: 1.6,
  },
  WATER: {
    FIRE: 1.6,
    WATER: 0.625,
    GRASS: 0.625,
    GROUND: 1.6,
    ROCK: 1.6,
    DRAGON: 0.625,
  },
  ELECTRIC: {
    WATER: 1.6,
    ELECTRIC: 0.625,
    GRASS: 0.625,
    GROUND: 0.391,
    FLYING: 1.6,
    DRAGON: 0.625,
  },
  GRASS: {
    FIRE: 0.625,
    WATER: 1.6,
    GRASS: 0.625,
    POISON: 0.625,
    GROUND: 1.6,
    FLYING: 0.625,
    BUG: 0.625,
    ROCK: 1.6,
    DRAGON: 0.625,
    STEEL: 0.625,
  },
  ICE: {
    FIRE: 0.625,
    WATER: 0.625,
    GRASS: 1.6,
    ICE: 0.625,
    GROUND: 1.6,
    FLYING: 1.6,
    DRAGON: 1.6,
    STEEL: 0.625,
  },
  FIGHTING: {
    NORMAL: 1.6,
    ICE: 1.6,
    POISON: 0.625,
    FLYING: 0.625,
    PSYCHIC: 0.625,
    BUG: 0.625,
    ROCK: 1.6,
    GHOST: 0.391,
    DARK: 1.6,
    STEEL: 1.6,
    FAIRY: 0.625,
  },
  POISON: {
    GRASS: 1.6,
    POISON: 0.625,
    GROUND: 0.625,
    ROCK: 0.625,
    GHOST: 0.625,
    STEEL: 0.391,
    FAIRY: 1.6,
  },
  GROUND: {
    FIRE: 1.6,
    ELECTRIC: 1.6,
    GRASS: 0.625,
    POISON: 1.6,
    FLYING: 0.391,
    BUG: 0.625,
    ROCK: 1.6,
    STEEL: 1.6,
  },
  FLYING: {
    ELECTRIC: 0.625,
    GRASS: 1.6,
    FIGHTING: 1.6,
    BUG: 1.6,
    ROCK: 0.625,
    STEEL: 0.625,
  },
  PSYCHIC: {
    FIGHTING: 1.6,
    POISON: 1.6,
    PSYCHIC: 0.625,
    DARK: 0.391,
    STEEL: 0.625,
  },
  BUG: {
    FIRE: 0.625,
    GRASS: 1.6,
    FIGHTING: 0.625,
    POISON: 0.625,
    FLYING: 0.625,
    PSYCHIC: 1.6,
    GHOST: 0.625,
    DARK: 1.6,
    STEEL: 0.625,
    FAIRY: 0.625,
  },
  ROCK: {
    FIRE: 1.6,
    ICE: 1.6,
    FIGHTING: 0.625,
    GROUND: 0.625,
    FLYING: 1.6,
    BUG: 1.6,
    STEEL: 0.625,
  },
  GHOST: {
    NORMAL: 0.391,
    PSYCHIC: 1.6,
    GHOST: 1.6,
    DARK: 0.625,
  },
  DRAGON: {
    DRAGON: 1.6,
    STEEL: 0.625,
    FAIRY: 0.391,
  },
  DARK: {
    FIGHTING: 0.625,
    PSYCHIC: 1.6,
    GHOST: 1.6,
    DARK: 0.625,
    FAIRY: 0.625,
  },
  STEEL: {
    FIRE: 0.625,
    WATER: 0.625,
    ELECTRIC: 0.625,
    ICE: 1.6,
    ROCK: 1.6,
    STEEL: 0.625,
    FAIRY: 1.6,
  },
  FAIRY: {
    FIRE: 0.625,
    FIGHTING: 1.6,
    POISON: 0.625,
    DRAGON: 1.6,
    DARK: 1.6,
    STEEL: 0.625,
  },
};

function effectiveness(moveType, defenderTypes) {
  const attackType = normalizeType(moveType);

  return defenderTypes.reduce((total, type) => {
    const defenseType = normalizeType(type);

    return (
      total *
      (typeEffectiveness[attackType]?.[
        defenseType
      ] ?? 1)
    );
  }, 1);
}

function durationSeconds(move) {
  return Math.max(
    Number(
      move.durationMs ??
        move.durationMsRaw ??
        1000
    ) / 1000,
    0.5
  );
}

function moveType(move) {
  return move.pokemonType ?? move.type ?? "";
}

function hasStab(types, move) {
  const selectedType = normalizeType(
    moveType(move)
  );

  return types.some(
    (type) =>
      normalizeType(type) === selectedType
  );
}

function calculateDamage({
  attack,
  defense,
  attackingTypes,
  defendingTypes,
  move,
  damageMultiplier = 1,
}) {
  const power = Number(move.power ?? 0);

  if (power <= 0) return 1;

  const stab = hasStab(attackingTypes, move)
    ? 1.2
    : 1;

  const typeMultiplier = effectiveness(
    moveType(move),
    defendingTypes
  );

  return (
    Math.floor(
      0.5 *
        power *
        (attack / Math.max(defense, 1)) *
        stab *
        typeMultiplier *
        damageMultiplier
    ) + 1
  );
}

function getMoves(settings) {
  const fastIds = [
    ...(settings.quickMoves ?? []),
    ...(settings.eliteQuickMove ?? []),
    ...(settings.eliteQuickMoves ?? []),
  ];

  const chargedIds = [
    ...(settings.cinematicMoves ?? []),
    ...(settings.eliteCinematicMove ?? []),
    ...(settings.eliteCinematicMoves ?? []),
  ];

  return {
    fastMoves: fastIds
      .map((id) =>
        moveSettings.get(String(id))
      )
      .filter(Boolean),

    chargedMoves: chargedIds
      .map((id) =>
        moveSettings.get(String(id))
      )
      .filter(Boolean),
  };
}

function movesetDps({
  attack,
  defense,
  attackingTypes,
  defendingTypes,
  fastMove,
  chargedMove,
  damageMultiplier = 1,
}) {
  const energyGain = Math.max(
    Math.abs(
      Number(fastMove.energyDelta ?? 1)
    ),
    1
  );

  const energyCost = Math.max(
    Math.abs(
      Number(chargedMove.energyDelta ?? 50)
    ),
    1
  );

  const fastMovesNeeded = Math.ceil(
    energyCost / energyGain
  );

  const fastDamage = calculateDamage({
    attack,
    defense,
    attackingTypes,
    defendingTypes,
    move: fastMove,
    damageMultiplier,
  });

  const chargedDamage = calculateDamage({
    attack,
    defense,
    attackingTypes,
    defendingTypes,
    move: chargedMove,
    damageMultiplier,
  });

  const totalDamage =
    fastMovesNeeded * fastDamage +
    chargedDamage;

  const totalTime =
    fastMovesNeeded *
      durationSeconds(fastMove) +
    durationSeconds(chargedMove);

  return totalDamage / Math.max(totalTime, 0.5);
}
function findBestAttackerMoveset(
  candidate,
  boss
) {
  const baseTemplateId = candidate.isShadow
    ? candidate.templateId.replace(
        "_SHADOW",
        ""
      )
    : candidate.templateId;

  const settings =
    pokemonSettings.get(baseTemplateId) ?? {};

  const { fastMoves, chargedMoves } =
    getMoves(settings);

  const combinations = [];

  for (const fastMove of fastMoves) {
    for (const chargedMove of chargedMoves) {
      const adjustedAttack =
        candidate.attack + 15;

      const shadowMultiplier =
        candidate.isShadow ? 1.2 : 1;

      const dps = movesetDps({
        attack: adjustedAttack,
        defense: boss.defense,
        attackingTypes: candidate.types,
        defendingTypes: boss.types,
        fastMove,
        chargedMove,
        damageMultiplier: shadowMultiplier,
      });

      const energyGain = Math.max(
        Math.abs(
          Number(fastMove.energyDelta ?? 1)
        ),
        1
      );

      const energyCost = Math.max(
        Math.abs(
          Number(chargedMove.energyDelta ?? 50)
        ),
        1
      );

      const fastMovesNeeded = Math.ceil(
        energyCost / energyGain
      );

      const chargeTime =
        fastMovesNeeded *
        durationSeconds(fastMove);

      const chargedMoveDamage =
        calculateDamage({
          attack: adjustedAttack,
          defense: boss.defense,
          attackingTypes: candidate.types,
          defendingTypes: boss.types,
          move: chargedMove,
          damageMultiplier: shadowMultiplier,
        });

      const chargeUtility =
        chargedMoveDamage /
        Math.max(chargeTime, 0.5);

      combinations.push({
        fastMove,
        chargedMove,
        dps,
        chargeUtility,
      });
    }
  }

  if (combinations.length === 0) {
    return {
      bestDps: 0,
      bestChargeRate: 0,
      bestFastMove: null,
      bestChargedMove: null,
    };
  }

  const dpsValues = combinations.map(
    (combination) => combination.dps
  );

  const chargeValues = combinations.map(
    (combination) =>
      combination.chargeUtility
  );

  const scoredCombinations =
    combinations.map((combination) => {
      const dpsScore = percentileScore(
        combination.dps,
        dpsValues
      );

      const chargeScore = percentileScore(
        combination.chargeUtility,
        chargeValues
      );

      const utilityScore =
        dpsScore * 0.88 +
        chargeScore * 0.12;

      return {
        ...combination,
        utilityScore,
      };
    });

  scoredCombinations.sort(
    (first, second) =>
      second.utilityScore -
      first.utilityScore
  );

  const best = scoredCombinations[0];

  return {
    bestDps: best.dps,

    /*
     * The existing property name is preserved so
     * the rest of the benchmark script keeps working.
     * It now contains Charge Utility, not frequency.
     */
    bestChargeRate: best.chargeUtility,

    bestFastMove:
      best.fastMove.movementId ??
      best.fastMove.uniqueId ??
      best.fastMove.moveId ??
      null,

    bestChargedMove:
      best.chargedMove.movementId ??
      best.chargedMove.uniqueId ??
      best.chargedMove.moveId ??
      null,
  };
}
function bossIncomingDps(boss, candidate) {
  const { fastMoves, chargedMoves } =
    getMoves(boss.settings);

  const combinations = [];

  for (const fastMove of fastMoves) {
    for (const chargedMove of chargedMoves) {
      combinations.push(
        movesetDps({
          attack: boss.attack,
          defense:
            (candidate.defense + 15) *
            (candidate.isShadow ? 0.833 : 1),
          attackingTypes: boss.types,
          defendingTypes: candidate.types,
          fastMove,
          chargedMove,
        })
      );
    }
  }

  if (combinations.length === 0) {
    return 1;
  }

  return (
    combinations.reduce(
      (total, value) => total + value,
      0
    ) / combinations.length
  );
}

function findPokemonSettings(
  pokemonId,
  form
) {
  for (const [
    templateId,
    settings,
  ] of pokemonSettings.entries()) {
    const settingsForm =
      settings.form ?? "NORMAL";

    if (
      settings.pokemonId === pokemonId &&
      settingsForm === form
    ) {
      return {
        templateId,
        settings,
      };
    }
  }

  return null;
}

const bosses = benchmark.bosses
  .map((boss) => {
    const result = findPokemonSettings(
      boss.pokemonId,
      boss.form
    );

    if (!result) return null;

    const stats =
      result.settings.stats ?? {};

    return {
      pokemonId: boss.pokemonId,
      form: boss.form,
      attack:
        stats.baseAttack ??
        result.settings.baseAttack ??
        1,
      defense:
        stats.baseDefense ??
        result.settings.baseDefense ??
        1,
      stamina:
        stats.baseStamina ??
        result.settings.baseStamina ??
        1,
      types: [
        result.settings.type,
        result.settings.type2,
      ].filter(Boolean),
      settings: result.settings,
    };
  })
  .filter(Boolean);

  function percentileScore(value, values) {
    if (values.length <= 1) return 100;
  
    let lowerCount = 0;
    let equalCount = 0;
  
    for (const comparison of values) {
      if (comparison < value) {
        lowerCount += 1;
      } else if (comparison === value) {
        equalCount += 1;
      }
    }
  
    const midpointBelow =
      lowerCount + (equalCount - 1) / 2;
  
    return (
      (midpointBelow / (values.length - 1)) *
      100
    );
  }

function normalizeWithCaps(
  value,
  lower,
  upper
) {
  if (upper === lower) return 100;

  const normalized =
    ((value - lower) /
      (upper - lower)) *
    100;

  return Math.min(
    100,
    Math.max(0, normalized)
  );
}

const calculated = [];

for (const candidate of candidates) {
  const bossResults = [];
  const movesetUsage = new Map();

  for (const boss of bosses) {
    const moveset = findBestAttackerMoveset(
      candidate,
      boss
    );

    if (moveset.bestDps <= 0) continue;

    const incomingDps = bossIncomingDps(
      boss,
      candidate
    );

    const effectiveHp =
      candidate.stamina + 15;

    const survivalTime =
      effectiveHp /
      Math.max(incomingDps, 0.1);

    const dbd =
      moveset.bestDps * survivalTime;

      bossResults.push({
        dps: moveset.bestDps,
        charge: moveset.bestChargeRate,
        incomingDps,
        survivalTime,
        dbd,
      });
        

    const movesetKey = `${String(
      moveset.bestFastMove
    )}|${String(moveset.bestChargedMove)}`;

    movesetUsage.set(
      movesetKey,
      (movesetUsage.get(movesetKey) ?? 0) +
        1
    );
  }

  if (bossResults.length === 0) continue;

  const averageDps =
  bossResults.reduce(
    (total, result) => total + result.dps,
    0
  ) / bossResults.length;

const averageIncomingDps =
  bossResults.reduce(
    (total, result) =>
      total + result.incomingDps,
    0
  ) / bossResults.length;

const averageSurvivalTime =
  bossResults.reduce(
    (total, result) =>
      total + result.survivalTime,
    0
  ) / bossResults.length;

const averageDbd =
  bossResults.reduce(
    (total, result) => total + result.dbd,
    0
  ) / bossResults.length;

const averageCharge =
  bossResults.reduce(
    (total, result) => total + result.charge,
    0
  ) / bossResults.length;


  const mostUsedMoveset =
    [...movesetUsage.entries()].sort(
      (a, b) => b[1] - a[1]
    )[0]?.[0] ?? "|";

  const [
    bestFastMove,
    bestChargedMove,
  ] = mostUsedMoveset.split("|");

  calculated.push({
    ...candidate,
    bossesTested: bossResults.length,
    rawDps: averageDps,
    rawDbd: averageDbd,
    rawCharge: averageCharge,
    averageSurvivalTime,
    averageIncomingDps,
    bestFastMove:
      bestFastMove || null,
    bestChargedMove:
      bestChargedMove || null,
  });
}
console.log("\nMewtwo Shadow Audit:");

console.table(
  calculated
    .filter(
      (item) =>
        item.pokemonId === "MEWTWO" &&
        (
          item.form === "NORMAL" ||
          item.form === "MEWTWO_SHADOW"
        )
    )
    .map((item) => ({
      pokemon:
        item.form === "NORMAL"
          ? "Mewtwo"
          : "Mewtwo Shadow",

      baseAttack: item.attack,

      effectiveAttack: Number(
        (
          (item.attack + 15) *
          (item.isShadow ? 1.2 : 1)
        ).toFixed(2)
      ),

      effectiveDefense: Number(
        (
          (item.defense + 15) *
          (item.isShadow ? 0.833 : 1)
        ).toFixed(2)
      ),

      rawDps: Number(
        item.rawDps.toFixed(2)
      ),
      rawCharge: Number(
        item.rawCharge.toFixed(4)
      ),

      incomingDps: Number(
        item.averageIncomingDps.toFixed(2)
      ),

      survival: Number(
        item.averageSurvivalTime.toFixed(2)
      ),

      rawDbd: Number(
        item.rawDbd.toFixed(2)
      ),
    }))
);
console.log("\nMewtwo Shadow Audit:");

console.table(
  calculated
    .filter(
      (item) =>
        item.pokemonId === "MEWTWO" &&
        (item.form === "NORMAL" ||
          item.form === "MEWTWO_SHADOW")
    )
    .map((item) => ({
      pokemon:
        item.form === "NORMAL"
          ? "Mewtwo"
          : "Mewtwo Shadow",
      effectiveAttack: Number(
        (
          (item.attack + 15) *
          (item.isShadow ? 1.2 : 1)
        ).toFixed(2)
      ),
      effectiveDefense: Number(
        (
          (item.defense + 15) *
          (item.isShadow ? 0.833 : 1)
        ).toFixed(2)
      ),
      rawDps: Number(item.rawDps.toFixed(2)),
      rawCharge: Number(
        item.rawCharge.toFixed(4)
      ),
      incomingDps: Number(
        item.averageIncomingDps.toFixed(2)
      ),
      survival: Number(
        item.averageSurvivalTime.toFixed(2)
      ),
      rawDbd: Number(item.rawDbd.toFixed(2)),
    }))
);
const dpsValues = calculated.map(
    (item) => item.rawDps
  );
  
  const dbdValues = calculated.map(
    (item) => item.rawDbd
  );
  
  const chargeValues = calculated.map(
    (item) => item.rawCharge
  );
  
  const scored = calculated.map((item) => {
    const dps = percentileScore(
      item.rawDps,
      dpsValues
    );
  
    const dbd = percentileScore(
      item.rawDbd,
      dbdValues
    );
  
    const charge = percentileScore(
      item.rawCharge,
      chargeValues
    );
  
    const psv =
      dbd * benchmark.weighting.dbd +
      dps * benchmark.weighting.dps +
      charge * benchmark.weighting.charge;
  
    return {
      ...item,
      dps: Number(dps.toFixed(2)),
      dbd: Number(dbd.toFixed(2)),
      charge: Number(charge.toFixed(2)),
      psv: Number(psv.toFixed(2)),
    };
  });
scored.sort((a, b) => b.psv - a.psv);

const ranked = scored.map(
  (item, index) => {
    const rank = index + 1;

    const displaySource =
      item.form === "NORMAL"
        ? item.pokemonId
        : item.form;

    const displayName = displaySource
      .toLowerCase()
      .split("_")
      .map(
        (word) =>
          word.charAt(0).toUpperCase() +
          word.slice(1)
      )
      .join(" ");

    let tier = "D";

    if (rank <= scored.length * 0.01) {
      tier = "God";
    } else if (
      rank <=
      scored.length * 0.05
    ) {
      tier = "S+";
    } else if (
      rank <=
      scored.length * 0.1
    ) {
      tier = "S";
    } else if (
      rank <=
      scored.length * 0.25
    ) {
      tier = "A";
    } else if (
      rank <=
      scored.length * 0.5
    ) {
      tier = "B";
    } else if (
      rank <=
      scored.length * 0.75
    ) {
      tier = "C";
    }

    return {
      name: displayName
        .toLowerCase()
        .replaceAll(" ", "-"),
      displayName,
      pokemonId: item.pokemonId,
      form: item.form,
      attack: item.attack,
      defense: item.defense,
      stamina: item.stamina,
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
      bestFastMove: item.bestFastMove,
      bestChargedMove:
        item.bestChargedMove,
      bossesTested: item.bossesTested,
      averageSurvivalTime: Number(
        item.averageSurvivalTime.toFixed(2)
      ),
      dps: item.dps,
      dbd: item.dbd,
      charge: item.charge,
      psv: item.psv,
      overallRank: rank,
      tier,
    };
  }
);

await fs.writeFile(
  outputFile,
  JSON.stringify(ranked, null, 2),
  "utf8"
);

console.log(
  `Benchmark bosses: ${bosses.length}`
);

console.log(
  `Ranked attackers: ${ranked.length}`
);

console.log(
  "Created app/data/benchmarkRankings2026.json"
);

console.log(
  "\nTop 25 Benchmark Rankings:"
);

console.table(
    calculated
      .sort((a, b) => b.rawDbd - a.rawDbd)
      .slice(0, 25)
      .map((item, index) => ({
        rank: index + 1,
        pokemon:
          item.form === "NORMAL"
            ? item.pokemonId
            : item.form,
        rawDbd: Number(item.rawDbd.toFixed(2)),
        rawDps: Number(item.rawDps.toFixed(2)),
        survival: Number(
          item.averageSurvivalTime.toFixed(2)
        ),
      }))
  );