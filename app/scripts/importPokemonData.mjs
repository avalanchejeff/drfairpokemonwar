import fs from "node:fs/promises";

const source =
  "https://pokemon-go-api.github.io/pokemon-go-api/api/pokedex.json";

console.log("Downloading Pokemon GO data...");

const response = await fetch(source);

if (!response.ok) {
  throw new Error(`Download failed: ${response.status}`);
}

const pokemon = await response.json();

const outputFile = new URL(
  "../data/pokemonRaw.json",
  import.meta.url
);

await fs.writeFile(
  outputFile,
  JSON.stringify(pokemon, null, 2),
  "utf8"
);

console.log(`Saved ${pokemon.length} Pokemon records.`);
console.log("Created app/data/pokemonRaw.json");