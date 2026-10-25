import fs from "node:fs/promises";

const pagePath = "./app/lab/page.tsx";
const backupPath = "./app/lab/page.tsx.before-raid-meta";
let source = await fs.readFile(pagePath, "utf8");
const original = source;

function replaceOnce(search, replacement, label) {
  if (!source.includes(search)) {
    throw new Error(`Could not find ${label}. No changes were written.`);
  }
  source = source.replace(search, replacement);
}

replaceOnce(
  'import movePoolsData from "../data/movePools.json";',
  'import movePoolsData from "../data/movePools.json";\nimport raidTypeAnalysisData from "../data/raidTypeAnalysis2026.json";',
  "move-pool import"
);

replaceOnce(
  'type PvpEntry = {',
  `type RaidEntry = {\n  name: string;\n  displayName: string;\n  pokemonId: string;\n  form: string | null;\n  dbd: number;\n  nundoDbd: number;\n  bestFastMove: string;\n  bestChargedMove: string;\n  bossCount: number;\n  raidRank: number;\n  tier: string;\n};\n\ntype RaidTypeGroup = {\n  type: string;\n  ceilingDbd: number;\n  floorDbd: number;\n  entries: RaidEntry[];\n};\n\ntype PvpEntry = {`,
  "PvP entry type"
);

replaceOnce(
  'const movePools = Object.values(movePoolsData) as MovePool[];',
  'const movePools = Object.values(movePoolsData) as MovePool[];\nconst raidTypeGroups = Object.values(raidTypeAnalysisData) as RaidTypeGroup[];',
  "move-pool constant"
);

replaceOnce(
  '  const currentIVs = useMemo(',
  `  const raidMeta = useMemo(() => {\n    if (!selectedRecord) return null;\n\n    const matches = raidTypeGroups\n      .map((group) => {\n        const entry = group.entries.find(\n          (candidate) =>\n            candidate.name === selectedRecord.name ||\n            (candidate.pokemonId === selectedRecord.pokemonId &&\n              candidate.form === selectedRecord.form)\n        );\n\n        if (!entry) return null;\n\n        const typePotential = group.ceilingDbd > 0\n          ? (entry.dbd / group.ceilingDbd) * 100\n          : 0;\n\n        return { group, entry, typePotential };\n      })\n      .filter(Boolean) as {\n        group: RaidTypeGroup;\n        entry: RaidEntry;\n        typePotential: number;\n      }[];\n\n    if (!matches.length) return null;\n\n    matches.sort(\n      (a, b) =>\n        a.entry.raidRank - b.entry.raidRank ||\n        b.typePotential - a.typePotential ||\n        b.entry.dbd - a.entry.dbd\n    );\n\n    return matches[0];\n  }, [selectedRecord]);\n\n  const selectedRaidBuildMatches = useMemo(() => {\n    if (!raidMeta) return false;\n    return (\n      fastMove === raidMeta.entry.bestFastMove &&\n      (chargedMove1 === raidMeta.entry.bestChargedMove ||\n        chargedMove2 === raidMeta.entry.bestChargedMove)\n    );\n  }, [raidMeta, fastMove, chargedMove1, chargedMove2]);\n\n  const currentIVs = useMemo(`,
  "current IV calculation"
);

const oldCard = `              <MetaCard\n                title="Raid Meta"\n                color="red"\n                rows={[\n                  "Overall Rank",\n                  "Type Rank",\n                  "Raid PSV",\n                  "Ideal Raid Build",\n                ]}\n              />`;

const newCard = `              <div className="rounded-2xl border border-red-900/60 bg-red-950/10 p-5">\n                <h4 className="text-xl font-black text-red-300">Raid Meta</h4>\n                {selectedRecord && raidMeta ? (\n                  <div className="mt-4 space-y-3 text-sm text-white">\n                    <RaidResultRow\n                      label="Overall WAR Rank"\n                      value={\`#\${selectedRecord.overallRank ?? "—"}\`}\n                    />\n                    <RaidResultRow\n                      label="Best Raid Matchup"\n                      value={raidMeta.group.type}\n                    />\n                    <RaidResultRow\n                      label={\`\${raidMeta.group.type} Rank\`}\n                      value={\`#\${raidMeta.entry.raidRank}\`}\n                    />\n                    <RaidResultRow\n                      label="Raid PSV"\n                      value={(selectedRecord.psv ?? 0).toFixed(2)}\n                    />\n                    <RaidResultRow\n                      label="Type Potential"\n                      value={raidMeta.typePotential.toFixed(1) + "% of leader"}\n                    />\n                    <RaidResultRow\n                      label="Ideal Raid Build"\n                      value={\`\${moveLabel(raidMeta.entry.bestFastMove)} • \${moveLabel(raidMeta.entry.bestChargedMove)}\`}\n                      stacked\n                    />\n                    <div\n                      className={\`rounded-xl border px-3 py-2 font-bold \${\n                        selectedRaidBuildMatches\n                          ? "border-emerald-800 bg-emerald-950/30 text-emerald-300"\n                          : "border-amber-900 bg-amber-950/20 text-amber-300"\n                      }\`}\n                    >\n                      {selectedRaidBuildMatches\n                        ? "Selected build matches the ideal Raid build."\n                        : "Selected build does not match the ideal Raid build."}\n                    </div>\n                  </div>\n                ) : (\n                  <p className="mt-4 text-sm text-zinc-500">\n                    {selectedRecord\n                      ? "No Raid type analysis was found for this form."\n                      : "Select a Pokémon and form."}\n                  </p>\n                )}\n              </div>`;

replaceOnce(oldCard, newCard, "Raid Meta placeholder card");

replaceOnce(
  'function ResultRow({',
  `function RaidResultRow({\n  label,\n  value,\n  stacked = false,\n}: {\n  label: string;\n  value: string;\n  stacked?: boolean;\n}) {\n  return (\n    <div className={stacked ? "space-y-1" : "flex justify-between gap-4"}>\n      <span className="text-zinc-300">{label}</span>\n      <span\n        className={\n          stacked\n            ? "block font-bold text-red-100"\n            : "text-right font-bold text-red-100"\n        }\n      >\n        {value}\n      </span>\n    </div>\n  );\n}\n\nfunction ResultRow({`,
  "PvP ResultRow component"
);

await fs.writeFile(backupPath, original, "utf8");
await fs.writeFile(pagePath, source, "utf8");

console.log("Connected the Dr. Fair Raid Meta panel.");
console.log("- Overall WAR rank");
console.log("- Best raid matchup type");
console.log("- Rank within that type");
console.log("- Raid PSV");
console.log("- Type potential versus the type leader");
console.log("- Ideal Raid build");
console.log("- Selected build comparison");
console.log("Backup:", backupPath);