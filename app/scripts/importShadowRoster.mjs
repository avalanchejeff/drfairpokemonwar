import fs from "node:fs/promises";

const source =
  "https://pogoapi.net/api/v1/shadow_pokemon.json";

const outputFile = new URL(
  "../data/shadowRosterRaw.json",
  import.meta.url
);

const requiredShadows = {
  "708": {
    id: 708,
    name: "Phantump",
  },
  "709": {
    id: 709,
    name: "Trevenant",
  },
};

console.log("Downloading Shadow Pokemon roster...");

const response = await fetch(source);

if (!response.ok) {
  throw new Error(
    "Download failed. Status: " + response.status
  );
}

const downloaded = await response.json();

const data = Array.isArray(downloaded)
  ? Object.fromEntries(
      downloaded.map((pokemon) => [
        String(pokemon.id),
        pokemon,
      ])
    )
  : { ...downloaded };

for (const [id, pokemon] of Object.entries(requiredShadows)) {
  if (!data[id]) {
    data[id] = pokemon;

    console.log(
      `Added missing Shadow roster entry: ${pokemon.name} (#${id})`
    );
  }
}

await fs.writeFile(
  outputFile,
  JSON.stringify(data, null, 2),
  "utf8"
);

console.log(
  "Imported " +
    Object.keys(data).length +
    " Shadow roster entries."
);

console.log(
  "Created app/data/shadowRosterRaw.json"
);