import fs from "node:fs/promises";

const file = new URL(
  "../data/pokemonSettings.json",
  import.meta.url
);

const records = JSON.parse(
  await fs.readFile(file, "utf8")
);

const targets = [
  "KYOGRE",
  "MEWTWO",
  "GIRATINA",
  "DIALGA",
  "PALKIA",
];

for (const pokemonId of targets) {
  const forms = records
    .filter((item) => item.pokemonId === pokemonId)
    .map((item) => item.form);

  console.log(`\n${pokemonId}:`);
  console.log([...new Set(forms)]);
}