import fs from "node:fs/promises";

const source =
  "https://pogoapi.net/api/v1/shadow_pokemon.json";

const outputFile = new URL(
  "../data/shadowRosterRaw.json",
  import.meta.url
);

console.log("Downloading Shadow Pokemon roster...");

const response = await fetch(source);

if (!response.ok) {
  throw new Error(
    "Download failed. Status: " + response.status
  );
}

const data = await response.json();

await fs.writeFile(
  outputFile,
  JSON.stringify(data, null, 2),
  "utf8"
);

const count = Array.isArray(data)
  ? data.length
  : Object.keys(data).length;

console.log(
  "Imported " + count + " Shadow roster entries."
);

console.log(
  "Created app/data/shadowRosterRaw.json"
);