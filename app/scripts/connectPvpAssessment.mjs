import fs from "node:fs/promises";

const path = "./app/lab/page.tsx";
const backup = "./app/lab/page.tsx.before-pvp-assessment";
let source = await fs.readFile(path, "utf8");
await fs.writeFile(backup, source, "utf8");

function replaceOnce(find, replacement, label) {
  if (!source.includes(find)) {
    throw new Error(`Could not find ${label}. The working page was not changed.`);
  }
  source = source.replace(find, replacement);
}

replaceOnce(
  'import movePoolsData from "../data/movePools.json";',
  `import movePoolsData from "../data/movePools.json";\nimport greatLeagueData from "../data/pvpokeGreatLeague.json";\nimport ultraLeagueData from "../data/pvpokeUltraLeague.json";\nimport masterLeagueData from "../data/pvpokeMasterLeague.json";\nimport { detectLevelFromCp, rankPvpIvs, type LeagueKey } from "../lib/pvpIvCalculator";`,
  "data imports"
);

replaceOnce(
  'type WarRecord = {',
  `type PvpEntry = {\n  speciesId: string;\n  speciesName: string;\n  score: number;\n  moveset: string[];\n};\n\ntype WarRecord = {`,
  "WarRecord type"
);

replaceOnce(
  'const movePools = Object.values(movePoolsData) as MovePool[];',
  `const movePools = Object.values(movePoolsData) as MovePool[];\nconst leagueData: Record<LeagueKey, PvpEntry[]> = {\n  great: greatLeagueData as PvpEntry[],\n  ultra: ultraLeagueData as PvpEntry[],\n  master: masterLeagueData as PvpEntry[],\n};\nconst leagueLabels: Record<LeagueKey, string> = {\n  great: "Great League",\n  ultra: "Ultra League",\n  master: "Master League",\n};`,
  "data constants"
);

replaceOnce(
  'const pending = <span className="text-zinc-500">Pending</span>;',
  `function pvpCandidates(record: WarRecord) {\n  const slug = record.name.replaceAll("-", "_").toLowerCase();\n  const base = record.pokemonId.toLowerCase();\n  const form = record.form?.toLowerCase() ?? "";\n  const candidates = new Set([slug, base]);\n\n  if (form) {\n    const suffix = form\n      .replace(new RegExp(
        "^" + record.pokemonId.toLowerCase() + "_?"
      ), "")\n      .replace(/^normal$/, "");\n    if (suffix) candidates.add(base + "_" + suffix);\n  }\n\n  if (slug.startsWith("shadow_")) {\n    candidates.add(slug.replace(/^shadow_(.+)$/, "$1_shadow"));\n  }\n  if (slug.endsWith("_shadow")) {\n    candidates.add(slug.replace(/^(.+)_shadow$/, "shadow_$1"));\n  }\n\n  return [...candidates];\n}\n\nfunction findPvpEntry(record: WarRecord, league: LeagueKey) {\n  const candidates = pvpCandidates(record);\n  return (\n    leagueData[league].find((entry) => candidates.includes(entry.speciesId)) ??\n    null\n  );\n}\n\nfunction moveLabel(id: string) {\n  return id\n    .toLowerCase()\n    .split("_")\n    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))\n    .join(" ");\n}\n\nconst pending = <span className="text-zinc-500">Pending</span>;`,
  "PvP helpers"
);

replaceOnce(
  '  const field =\n',
  `  const currentIVs = useMemo(\n    () => ({\n      atkIV: Number(attack),\n      defIV: Number(defense),\n      hpIV: Number(hp),\n    }),\n    [attack, defense, hp]\n  );\n\n  const pvpMeta = useMemo(() => {\n    if (!selectedRecord) return null;\n\n    const choices = (["great", "ultra", "master"] as LeagueKey[])\n      .map((league) => {\n        const entry = findPvpEntry(selectedRecord, league);\n        if (!entry) return null;\n        const rank =\n          leagueData[league].findIndex(\n            (candidate) => candidate.speciesId === entry.speciesId\n          ) + 1;\n        return { league, entry, rank };\n      })\n      .filter(Boolean) as { league: LeagueKey; entry: PvpEntry; rank: number }[];\n\n    if (!choices.length) return null;\n    choices.sort((a, b) => b.entry.score - a.entry.score || a.rank - b.rank);\n    return choices[0];\n  }, [selectedRecord]);\n\n  const pvpIvResult = useMemo(() => {\n    if (!selectedRecord || !pvpMeta) return null;\n    if (![currentIVs.atkIV, currentIVs.defIV, currentIVs.hpIV].every(Number.isFinite)) {\n      return null;\n    }\n\n    return rankPvpIvs({\n      baseAttack: selectedRecord.attack,\n      baseDefense: selectedRecord.defense,\n      baseStamina: selectedRecord.stamina,\n      league: pvpMeta.league,\n      currentIVs,\n    });\n  }, [selectedRecord, pvpMeta, currentIVs]);\n\n  const detectedLevels = useMemo(() => {\n    if (!selectedRecord || !cp.trim()) return [];\n    return detectLevelFromCp({\n      baseAttack: selectedRecord.attack,\n      baseDefense: selectedRecord.defense,\n      baseStamina: selectedRecord.stamina,\n      currentIVs,\n      cp: Number(cp),\n    });\n  }, [selectedRecord, currentIVs, cp]);\n\n  const detectedLevelText = !cp.trim()\n    ? "--.-"\n    : detectedLevels.length === 1\n      ? detectedLevels[0].toFixed(1)\n      : detectedLevels.length > 1\n        ? detectedLevels.join(" / ")\n        : "No match";\n\n  const specimenValueText = pvpIvResult\n    ? pvpIvResult.current.statProductPercent.toFixed(2) + "%"\n    : "--.-%";\n\n  const field =\n`,
  "field declaration"
);

replaceOnce(
  '                value="--.-"\n                note="Auto-detected"',
  '                value={detectedLevelText}\n                note={detectedLevels.length > 1 ? "Multiple matches" : "Auto-detected"}',
  "level assessment tile"
);

replaceOnce(
  '                value="--.-%"\n                color="text-emerald-300"',
  '                value={specimenValueText}\n                note={pvpIvResult ? `${pvpIvResult.quality} PvP fit` : "Optimal potential"}\n                color="text-emerald-300"',
  "specimen assessment tile"
);

const oldPvpCard = `              <MetaCard\n                title="PvP Meta"\n                color="blue"\n                rows={[\n                  "Recommended League",\n                  "Meta Rank",\n                  "Your IV Rank",\n                  "Ideal PvP IVs",\n                  "Ideal PvP Build",\n                ]}\n              />`;

const newPvpCard = `              <div className="rounded-2xl border border-blue-900/60 bg-blue-950/10 p-5">\n                <h4 className="text-xl font-black text-blue-300">PvP Meta</h4>\n                {pvpMeta && pvpIvResult ? (\n                  <div className="mt-4 space-y-3 text-sm text-white">\n                    <ResultRow label="Recommended League" value={leagueLabels[pvpMeta.league]} />\n                    <ResultRow label="Meta Rank" value={\`#\${pvpMeta.rank} • Score \${pvpMeta.entry.score.toFixed(1)}\`} />\n                    <ResultRow label="Your IV Rank" value={\`#\${pvpIvResult.current.rank} of \${pvpIvResult.count.toLocaleString()}\`} />\n                    <ResultRow label="Optimal Potential" value={pvpIvResult.current.statProductPercent.toFixed(2) + "%"} />\n                    <ResultRow label="Quality" value={pvpIvResult.quality} />\n                    <ResultRow label="Ideal PvP IVs" value={\`\${pvpIvResult.best.atkIV} / \${pvpIvResult.best.defIV} / \${pvpIvResult.best.hpIV}\`} />\n                    <ResultRow label="Ideal PvP Build" value={pvpMeta.entry.moveset.map(moveLabel).join(" • ")} stacked />\n                  </div>\n                ) : (\n                  <p className="mt-4 text-sm text-zinc-500">\n                    {selectedRecord ? "No matching PvP ranking was found for this form." : "Select a Pokémon and form."}\n                  </p>\n                )}\n              </div>`;

replaceOnce(oldPvpCard, newPvpCard, "PvP Meta card");

replaceOnce(
  'function MetaCard({',
  `function ResultRow({\n  label,\n  value,\n  stacked = false,\n}: {\n  label: string;\n  value: string;\n  stacked?: boolean;\n}) {\n  return (\n    <div className={stacked ? "space-y-1" : "flex justify-between gap-4"}>\n      <span className="text-zinc-300">{label}</span>\n      <span className={stacked ? "block font-bold text-blue-100" : "text-right font-bold text-blue-100"}>\n        {value}\n      </span>\n    </div>\n  );\n}\n\nfunction MetaCard({`,
  "ResultRow component"
);

await fs.writeFile(path, source, "utf8");
console.log("Connected Dr. Fair PvP assessment:");
console.log("- Recommended League");
console.log("- PvP Meta Rank and score");
console.log("- IV Rank out of 4,096");
console.log("- Optimal IV spread");
console.log("- Optimal Potential percentage and quality");
console.log("- Ideal PvP moveset");
console.log("- Auto-detected level from CP and IVs");
console.log("Backup:", backup);