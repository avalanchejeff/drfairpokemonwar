import fs from "node:fs/promises";

const sourcePath = "./app/data/raidTypeAnalysis2026.json";
const outputPath = "./app/data/raidLabSummary2026.json";

const raw = JSON.parse(await fs.readFile(sourcePath, "utf8"));
const byPokemon = {};

for (const group of Object.values(raw)) {
  if (!group || !Array.isArray(group.entries)) continue;

  for (const entry of group.entries) {
    const key = entry.name;
    if (!key) continue;

    const candidate = {
      name: entry.name,
      pokemonId: entry.pokemonId,
      form: entry.form ?? null,
      type: group.type,
      typeRank: entry.raidRank,
      dbd: entry.dbd,
      typePotential:
        group.ceilingDbd > 0
          ? (entry.dbd / group.ceilingDbd) * 100
          : 0,
      bestFastMove: entry.bestFastMove,
      bestChargedMove: entry.bestChargedMove,
      tier: entry.tier,
      bossCount: entry.bossCount,
    };

    const current = byPokemon[key];
    if (
      !current ||
      candidate.typeRank < current.typeRank ||
      (candidate.typeRank === current.typeRank &&
        candidate.typePotential > current.typePotential)
    ) {
      byPokemon[key] = candidate;
    }
  }
}

await fs.writeFile(
  outputPath,
  JSON.stringify(byPokemon, null, 2),
  "utf8"
);

console.log(`Created ${outputPath}`);
console.log(`Raid summaries: ${Object.keys(byPokemon).length}`);