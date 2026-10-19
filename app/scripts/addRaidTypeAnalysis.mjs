import fs from "node:fs/promises";

const sourcePath = "./app/scripts/buildBenchmarkRankings.mjs";
const backupPath = "./app/scripts/buildBenchmarkRankings-before-raid-type-analysis.mjs";
let source = await fs.readFile(sourcePath, "utf8");

function replaceOnce(search, replacement, label) {
  if (!source.includes(search)) {
    throw new Error(`Could not find ${label}. The source file was not changed.`);
  }
  source = source.replace(search, replacement);
}

if (source.includes("raidTypeAnalysis2026.json")) {
  console.log("Raid type analysis is already installed.");
  process.exit(0);
}

await fs.writeFile(backupPath, source, "utf8");

replaceOnce(
  `function findBestAttackerMoveset(\n  candidate,\n  boss\n) {`,
  `function findBestAttackerMoveset(\n  candidate,\n  boss,\n  attackIV = 15\n) {`,
  "findBestAttackerMoveset signature"
);

replaceOnce(
  `      const adjustedAttack =\n        candidate.attack + 15;`,
  `      const adjustedAttack =\n        candidate.attack + attackIV;`,
  "attacker IV calculation"
);

replaceOnce(
  `function bossIncomingDps(boss, candidate) {`,
  `function bossIncomingDps(\n  boss,\n  candidate,\n  defenseIV = 15\n) {`,
  "bossIncomingDps signature"
);

replaceOnce(
  `            (candidate.defense + 15) *`,
  `            (candidate.defense + defenseIV) *`,
  "defense IV calculation"
);

replaceOnce(
  `    const result = findPokemonSettings(\n      boss.pokemonId,\n      boss.form\n    );`,
  `    const result = findPokemonSettings(\n      boss.pokemonId,\n      boss.form\n    );`,
  "boss settings lookup"
);

replaceOnce(
  `    return {\n      pokemonId: boss.pokemonId,\n      form: boss.form,`,
  `    return {\n      pokemonId: boss.pokemonId,\n      form: boss.form,\n      displayName: String(\n        result.settings.pokemonId ?? boss.pokemonId\n      )\n        .toLowerCase()\n        .split("_")\n        .map((part) =>\n          part.charAt(0).toUpperCase() + part.slice(1)\n        )\n        .join(" "),`,
  "boss result object"
);

replaceOnce(
  `    const moveset = findBestAttackerMoveset(\n      candidate,\n      boss\n    );`,
  `    const moveset = findBestAttackerMoveset(\n      candidate,\n      boss,\n      15\n    );\n\n    const nundoMoveset = findBestAttackerMoveset(\n      candidate,\n      boss,\n      0\n    );`,
  "perfect moveset call"
);

replaceOnce(
  `    const incomingDps = bossIncomingDps(\n      boss,\n      candidate\n    );`,
  `    const incomingDps = bossIncomingDps(\n      boss,\n      candidate,\n      15\n    );\n\n    const nundoIncomingDps = bossIncomingDps(\n      boss,\n      candidate,\n      0\n    );`,
  "incoming DPS call"
);

replaceOnce(
  `    const dbd =\n      moveset.bestDps * survivalTime;\n\n      bossResults.push({\n        dps: moveset.bestDps,\n        charge: moveset.bestChargeRate,\n        incomingDps,\n        survivalTime,\n        dbd,\n      });`,
  `    const dbd =\n      moveset.bestDps * survivalTime;\n\n    const nundoSurvivalTime =\n      candidate.stamina /\n      Math.max(nundoIncomingDps, 0.1);\n\n    const nundoDbd =\n      nundoMoveset.bestDps * nundoSurvivalTime;\n\n    bossResults.push({\n      bossPokemonId: boss.pokemonId,\n      bossForm: boss.form,\n      bossName: boss.displayName,\n      bossTypes: boss.types.map(normalizeType),\n      dps: moveset.bestDps,\n      charge: moveset.bestChargeRate,\n      incomingDps,\n      survivalTime,\n      dbd,\n      nundoDbd,\n      bestFastMove: moveset.bestFastMove,\n      bestChargedMove: moveset.bestChargedMove,\n      nundoFastMove: nundoMoveset.bestFastMove,\n      nundoChargedMove: nundoMoveset.bestChargedMove,\n    });`,
  "boss result details"
);

replaceOnce(
  `    bestChargedMove:\n      bestChargedMove || null,\n  });`,
  `    bestChargedMove:\n      bestChargedMove || null,\n    bossResults,\n  });`,
  "calculated result bossResults"
);

replaceOnce(
  `await fs.writeFile(\n  outputFile,\n  JSON.stringify(ranked, null, 2),\n  "utf8"\n);`,
  `await fs.writeFile(\n  outputFile,\n  JSON.stringify(ranked, null, 2),\n  "utf8"\n);\n\nconst raidTypes = [\n  "NORMAL", "FIRE", "WATER", "ELECTRIC",\n  "GRASS", "ICE", "FIGHTING", "POISON",\n  "GROUND", "FLYING", "PSYCHIC", "BUG",\n  "ROCK", "GHOST", "DRAGON", "DARK",\n  "STEEL", "FAIRY",\n];\n\nconst rankedByKey = new Map(\n  ranked.map((item) => [\n    item.pokemonId + ":" + item.form,\n    item,\n  ])\n);\n\nconst raidTypeAnalysis = {};\n\nfor (const type of raidTypes) {\n  const entries = [];\n\n  for (const item of calculated) {\n    const typeBossResults = item.bossResults.filter(\n      (result) => result.bossTypes.includes(type)\n    );\n\n    if (typeBossResults.length === 0) continue;\n\n    const averageTypeDbd =\n      typeBossResults.reduce(\n        (total, result) => total + result.dbd,\n        0\n      ) / typeBossResults.length;\n\n    const averageNundoDbd =\n      typeBossResults.reduce(\n        (total, result) => total + result.nundoDbd,\n        0\n      ) / typeBossResults.length;\n\n    const movesetUsage = new Map();\n    for (const result of typeBossResults) {\n      const key =\n        String(result.bestFastMove) + "|" +\n        String(result.bestChargedMove);\n      movesetUsage.set(\n        key,\n        (movesetUsage.get(key) ?? 0) + 1\n      );\n    }\n\n    const bestMoveset =\n      [...movesetUsage.entries()].sort(\n        (a, b) => b[1] - a[1]\n      )[0]?.[0] ?? "|";\n\n    const [bestFastMove, bestChargedMove] =\n      bestMoveset.split("|");\n\n    const rankedItem = rankedByKey.get(\n      item.pokemonId + ":" + item.form\n    );\n\n    entries.push({\n      name: rankedItem?.name ?? null,\n      displayName: rankedItem?.displayName ?? item.pokemonId,\n      pokemonId: item.pokemonId,\n      form: item.form,\n      dbd: Number(averageTypeDbd.toFixed(4)),\n      nundoDbd: Number(averageNundoDbd.toFixed(4)),\n      bestFastMove: bestFastMove || null,\n      bestChargedMove: bestChargedMove || null,\n      bossCount: typeBossResults.length,\n      bosses: typeBossResults.map((result) => ({\n        pokemonId: result.bossPokemonId,\n        form: result.bossForm,\n        name: result.bossName,\n      })),\n    });\n  }\n\n  entries.sort((a, b) => b.dbd - a.dbd);\n\n  const ceilingDbd = entries[0]?.dbd ?? 0;\n  const floorDbd = entries.length\n    ? Math.min(...entries.map((entry) => entry.nundoDbd))\n    : 0;\n\n  entries.forEach((entry, index) => {\n    entry.raidRank = index + 1;\n    const percentile = entries.length > 1\n      ? 1 - index / (entries.length - 1)\n      : 1;\n    entry.tier =\n      percentile >= 0.99 ? "God" :\n      percentile >= 0.95 ? "S+" :\n      percentile >= 0.9 ? "S" :\n      percentile >= 0.75 ? "A" :\n      percentile >= 0.5 ? "B" :\n      percentile >= 0.25 ? "C" : "D";\n  });\n\n  raidTypeAnalysis[type] = {\n    type,\n    ceilingDbd,\n    floorDbd,\n    bestAttacker: entries[0] ?? null,\n    entries,\n  };\n}\n\nconst raidTypeOutputFile = new URL(\n  "../data/raidTypeAnalysis2026.json",\n  import.meta.url\n);\n\nawait fs.writeFile(\n  raidTypeOutputFile,\n  JSON.stringify(raidTypeAnalysis, null, 2),\n  "utf8"\n);\n\nconsole.log(\n  "Created app/data/raidTypeAnalysis2026.json"\n);`,
  "rankings output write"
);

await fs.writeFile(sourcePath, source, "utf8");
console.log("Updated buildBenchmarkRankings.mjs");
console.log("Backup created:", backupPath);