import fs from "node:fs/promises";

const rawFile = new URL(
  "../data/pokemonRaw.json",
  import.meta.url
);

const outputFile = new URL(
  "../data/pokemonCatalog.json",
  import.meta.url
);

const rawText = await fs.readFile(rawFile, "utf8");
const rawPokemon = JSON.parse(rawText);

function makeSlug(value) {
  return value
    .toLowerCase()
    .replaceAll("_", "-")
    .replaceAll(" ", "-");
}

const catalog = rawPokemon
  .filter((pokemon) => pokemon.stats)
  .map((pokemon) => ({
    name: makeSlug(pokemon.formId),
    displayName:
      pokemon.names?.English ?? pokemon.formId,
    formId: pokemon.formId,
    dexNumber: pokemon.dexNr,
    generation: pokemon.generation,

    primaryType:
      pokemon.primaryType?.names?.English ?? null,

    secondaryType:
      pokemon.secondaryType?.names?.English ?? null,

    stamina: pokemon.stats.stamina,
    attack: pokemon.stats.attack,
    defense: pokemon.stats.defense,

    psv: null,
    dps: null,
    tud: null,
    charge: null,

    overallRank: null,
    typeRank: null,
    tier: null,
  }))
  .sort((a, b) => {
    if (a.dexNumber !== b.dexNumber) {
      return a.dexNumber - b.dexNumber;
    }

    return a.displayName.localeCompare(b.displayName);
  });

await fs.writeFile(
  outputFile,
  JSON.stringify(catalog, null, 2),
  "utf8"
);

console.log(`Created ${catalog.length} catalog records.`);
console.log("Created app/data/pokemonCatalog.json");