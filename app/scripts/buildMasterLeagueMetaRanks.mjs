import fs from "node:fs/promises";

const inputFile = new URL(
  "../data/pvpokeMasterLeague.json",
  import.meta.url
);

const outputFile = new URL(
  "../data/masterLeagueMetaRanks.json",
  import.meta.url
);

const pvpoke = JSON.parse(
  await fs.readFile(inputFile, "utf8")
);

const metaRanks = {};

pvpoke.forEach((pokemon, index) => {
  const slug = String(pokemon.speciesId)
    .replaceAll("_", "-")
    .toLowerCase();

  metaRanks[slug] = {
    rank: index + 1,
    score: pokemon.score,
    speciesId: pokemon.speciesId,
    speciesName: pokemon.speciesName,
  };
});

await fs.writeFile(
  outputFile,
  JSON.stringify(metaRanks, null, 2),
  "utf8"
);

console.log(
  `Created ${Object.keys(metaRanks).length} Master League meta ranks.`
);
console.log(
  "Created app/data/masterLeagueMetaRanks.json"
);