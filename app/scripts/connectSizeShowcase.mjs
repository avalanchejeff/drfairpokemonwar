import fs from "node:fs/promises";

const pagePath = "./app/lab/page.tsx";
const backupPath = "./app/lab/page.tsx.before-size-showcase";
let source = await fs.readFile(pagePath, "utf8");
const original = source;

function replaceOnce(search, replacement, label) {
  if (!source.includes(search)) {
    throw new Error(`Could not find ${label}. No changes were written.`);
  }
  source = source.replace(search, replacement);
}

replaceOnce(
  'import raidLabSummaryData from "../data/raidLabSummary2026.json";',
  'import raidLabSummaryData from "../data/raidLabSummary2026.json";\nimport sizeReferenceData from "../data/pokemonSizeReference.json";\nimport artworkIndexHD from "../data/artworkIndexHD.json";',
  "Raid summary import"
);

replaceOnce(
  'type MoveRecord = {',
  `type SizeReference = {\n  pokemonId: string;\n  form: string;\n  templateId: string;\n  averageHeightM: number;\n  averageWeightKg: number;\n  heightStdDev: number;\n  weightStdDev: number;\n};\n\ntype MoveRecord = {`,
  "MoveRecord type"
);

replaceOnce(
  'const movePools = Object.values(movePoolsData) as MovePool[];',
  'const movePools = Object.values(movePoolsData) as MovePool[];\nconst sizeReferences = sizeReferenceData as Record<string, SizeReference>;',
  "move-pool constant"
);

replaceOnce(
  'const maxAttackNames: Record<string, string> = {',
  `function normalCdf(z: number) {\n  const sign = z < 0 ? -1 : 1;\n  const x = Math.abs(z) / Math.sqrt(2);\n  const t = 1 / (1 + 0.3275911 * x);\n  const erf = 1 -\n    (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t -\n      0.284496736) * t + 0.254829592) * t) *\n      Math.exp(-x * x);\n  return 0.5 * (1 + sign * erf);\n}\n\nfunction percentileScale(percentile: number) {\n  const stops = [\n    [0, 28], [50, 42], [75, 55], [90, 68], [95, 78], [99, 90], [100, 96],\n  ];\n  for (let i = 1; i < stops.length; i += 1) {\n    const [p1, s1] = stops[i - 1];\n    const [p2, s2] = stops[i];\n    if (percentile <= p2) {\n      const ratio = (percentile - p1) / (p2 - p1);\n      return s1 + ratio * (s2 - s1);\n    }\n  }\n  return 96;\n}\n\nconst maxAttackNames: Record<string, string> = {`,
  "Max attack names"
);

replaceOnce(
  '  const maxBattleMeta = useMemo(() => {',
  `  const sizeShowcase = useMemo(() => {\n    if (!selectedRecord) return null;\n\n    const exactKey = selectedRecord.pokemonId + ":" + (selectedRecord.form ?? "NORMAL");\n    const normalKey = selectedRecord.pokemonId + ":NORMAL";\n    const reference = sizeReferences[exactKey] ?? sizeReferences[normalKey];\n    if (!reference) return null;\n\n    const measuredHeight = Number(height);\n    const measuredWeight = Number(weight);\n    const hasHeight = Number.isFinite(measuredHeight) && measuredHeight > 0;\n    const hasWeight = Number.isFinite(measuredWeight) && measuredWeight > 0;\n\n    const heightPercentile = hasHeight && reference.heightStdDev > 0\n      ? normalCdf((measuredHeight - reference.averageHeightM) / reference.heightStdDev) * 100\n      : null;\n    const weightPercentile = hasWeight && reference.weightStdDev > 0\n      ? normalCdf((measuredWeight - reference.averageWeightKg) / reference.weightStdDev) * 100\n      : null;\n\n    const ivPercent = ((Number(attack) + Number(defense) + Number(hp)) / 45) * 100;\n    const showcasePotential = heightPercentile !== null && weightPercentile !== null\n      ? Math.min(100, heightPercentile * 0.8 + weightPercentile * 0.15 + ivPercent * 0.05)\n      : null;\n\n    const baseArtworkKey = selectedRecord.name.endsWith("-shadow")\n      ? selectedRecord.name.replace(/-shadow$/, "")\n      : selectedRecord.name;\n    const artworkUrl =\n      artworkIndexHD[selectedRecord.name as keyof typeof artworkIndexHD] ??\n      artworkIndexHD[baseArtworkKey as keyof typeof artworkIndexHD] ??\n      null;\n\n    return {\n      reference,\n      heightPercentile,\n      weightPercentile,\n      showcasePotential,\n      artworkUrl,\n      scale: percentileScale(heightPercentile ?? 50),\n    };\n  }, [selectedRecord, height, weight, attack, defense, hp]);\n\n  const maxBattleMeta = useMemo(() => {`,
  "Max Battle calculation"
);

const oldSection = `          <section className="mt-6 rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6">\n            <p className="text-xs font-bold uppercase tracking-[0.25em] text-lime-400">\n              Size &amp; Showcase Value\n            </p>\n            <div className="mt-5 grid gap-4 sm:grid-cols-2">\n              <div className="rounded-2xl bg-black/20 p-5">\n                <div className="text-sm text-zinc-400">Size Percentile</div>\n                <div className="mt-2 text-3xl font-black">Pending</div>\n              </div>\n              <div className="rounded-2xl bg-black/20 p-5">\n                <div className="text-sm text-zinc-400">\n                  Showcase Potential\n                </div>\n                <div className="mt-2 text-3xl font-black">Pending</div>\n              </div>\n            </div>\n          </section>`;

const newSection = `          <section className="mt-6 rounded-3xl border border-lime-900/60 bg-zinc-900/60 p-6">\n            <p className="text-xs font-bold uppercase tracking-[0.25em] text-lime-400">\n              Size &amp; Showcase Value\n            </p>\n\n            {selectedRecord && sizeShowcase ? (\n              <div className="mt-5 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">\n                <div className="relative aspect-square min-h-[360px] overflow-hidden rounded-2xl border border-lime-900/50 bg-gradient-to-b from-zinc-950 to-black">\n                  {[\n                    { p: 99, size: 94 },\n                    { p: 95, size: 82 },\n                    { p: 90, size: 70 },\n                    { p: 75, size: 56 },\n                    { p: 50, size: 42 },\n                  ].map((ring) => (\n                    <div\n                      key={ring.p}\n                      className="absolute bottom-[7%] left-1/2 -translate-x-1/2 rounded-t-full border border-dashed border-lime-400/40"\n                      style={{ width: ring.size + "%", height: ring.size + "%" }}\n                    >\n                      <span className="absolute left-1/2 top-1 -translate-x-1/2 whitespace-nowrap rounded bg-black/70 px-2 py-0.5 text-[10px] font-bold text-lime-300">\n                        Larger than {ring.p}%\n                      </span>\n                    </div>\n                  ))}\n\n                  {sizeShowcase.artworkUrl ? (\n                    <img\n                      src={sizeShowcase.artworkUrl}\n                      alt={selectedRecord.displayName}\n                      className="absolute bottom-[5%] left-1/2 z-10 -translate-x-1/2 object-contain transition-all duration-300"\n                      style={{\n                        width: sizeShowcase.scale + "%",\n                        height: sizeShowcase.scale + "%",\n                      }}\n                    />\n                  ) : null}\n\n                  <div className="absolute bottom-2 left-1/2 z-20 -translate-x-1/2 rounded-full border border-lime-800 bg-black/80 px-4 py-2 text-center">\n                    <div className="text-xs text-zinc-400">Estimated size standing</div>\n                    <div className="text-lg font-black text-lime-300">\n                      {sizeShowcase.heightPercentile !== null\n                        ? \`Larger than \${sizeShowcase.heightPercentile.toFixed(1)}%\`\n                        : "Enter height"}\n                    </div>\n                  </div>\n                </div>\n\n                <div className="space-y-4">\n                  <SizeResultCard\n                    label="Height Standing"\n                    value={sizeShowcase.heightPercentile !== null\n                      ? \`Larger than \${sizeShowcase.heightPercentile.toFixed(1)}%\`\n                      : "Enter height"}\n                    note={\`Species average: \${sizeShowcase.reference.averageHeightM} m\`}\n                  />\n                  <SizeResultCard\n                    label="Weight Standing"\n                    value={sizeShowcase.weightPercentile !== null\n                      ? \`Heavier than \${sizeShowcase.weightPercentile.toFixed(1)}%\`\n                      : "Enter weight"}\n                    note={\`Species average: \${sizeShowcase.reference.averageWeightKg} kg\`}\n                  />\n                  <SizeResultCard\n                    label="Showcase Potential"\n                    value={sizeShowcase.showcasePotential !== null\n                      ? sizeShowcase.showcasePotential.toFixed(1) + "%"\n                      : "Enter height and weight"}\n                    note="Estimated blend: height 80%, weight 15%, IVs 5%"\n                  />\n                  <p className="text-xs leading-5 text-zinc-500">\n                    Estimated from species averages and standard deviations. In-game values are rounded, and official Showcase scoring can include class-specific bonuses.\n                  </p>\n                </div>\n              </div>\n            ) : (\n              <p className="mt-5 text-sm text-zinc-500">\n                Select a Pokémon with available size-reference data.\n              </p>\n            )}\n          </section>`;

replaceOnce(oldSection, newSection, "Size and Showcase placeholder");

replaceOnce(
  'function AssessmentTile({',
  `function SizeResultCard({\n  label,\n  value,\n  note,\n}: {\n  label: string;\n  value: string;\n  note: string;\n}) {\n  return (\n    <div className="rounded-2xl border border-zinc-800 bg-black/20 p-5">\n      <div className="text-sm font-bold text-zinc-400">{label}</div>\n      <div className="mt-2 text-2xl font-black text-lime-300">{value}</div>\n      <div className="mt-1 text-xs text-zinc-600">{note}</div>\n    </div>\n  );\n}\n\nfunction AssessmentTile({`,
  "AssessmentTile component"
);

await fs.writeFile(backupPath, original, "utf8");
await fs.writeFile(pagePath, source, "utf8");
console.log("Connected Size & Showcase Value.");
console.log("- Larger than 50/75/90/95/99 reference outlines");
console.log("- Continuous height-based artwork scaling");
console.log("- Height and weight standings");
console.log("- Estimated Showcase potential");
console.log("Backup:", backupPath);