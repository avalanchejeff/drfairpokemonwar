import fs from "node:fs/promises";

const pagePath = "./app/lab/page.tsx";
const backupPath = "./app/lab/page.tsx.before-raid-summary";
let source = await fs.readFile(pagePath, "utf8");
const original = source;

function replaceOnce(search, replacement, label) {
  if (!source.includes(search)) {
    throw new Error(`Could not find ${label}. No changes were written.`);
  }
  source = source.replace(search, replacement);
}

replaceOnce(
  'import raidTypeAnalysisData from "../data/raidTypeAnalysis2026.json";',
  'import raidLabSummaryData from "../data/raidLabSummary2026.json";',
  "large Raid import"
);

replaceOnce(
  'const raidTypeGroups = Object.values(raidTypeAnalysisData) as RaidTypeGroup[];',
  `const raidLabSummary = raidLabSummaryData as Record<\n  string,\n  RaidEntry & {\n    type: string;\n    typeRank: number;\n    typePotential: number;\n  }\n>;`,
  "Raid type groups constant"
);

const start = source.indexOf('  const raidMeta = useMemo(() => {');
const end = source.indexOf('  const selectedRaidBuildMatches = useMemo(() => {', start);
if (start < 0 || end < 0) {
  throw new Error("Could not find Raid calculation block. No changes were written.");
}

const compactBlock = `  const raidMeta = useMemo(() => {\n    if (!selectedRecord) return null;\n\n    const entry = raidLabSummary[selectedRecord.name];\n    if (!entry) return null;\n\n    return {\n      group: { type: entry.type },\n      entry: { ...entry, raidRank: entry.typeRank },\n      typePotential: entry.typePotential,\n    };\n  }, [selectedRecord]);\n\n`;

source = source.slice(0, start) + compactBlock + source.slice(end);

await fs.writeFile(backupPath, original, "utf8");
await fs.writeFile(pagePath, source, "utf8");

console.log("Switched the Lab Raid panel to the compact Raid summary.");
console.log("Backup:", backupPath);