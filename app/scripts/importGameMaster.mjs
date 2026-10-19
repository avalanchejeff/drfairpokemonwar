import fs from "node:fs/promises";

const source =
  "https://raw.githubusercontent.com/PokeMiners/game_masters/master/latest/latest.json";

const outputFile = new URL(
  "../data/gameMasterRaw.json",
  import.meta.url
);

console.log("Downloading current Pokemon GO Game Master...");

const response = await fetch(source);

if (!response.ok) {
  throw new Error(`Download failed: ${response.status}`);
}

const gameMaster = await response.json();

await fs.writeFile(
  outputFile,
  JSON.stringify(gameMaster, null, 2),
  "utf8"
);

console.log("Created app/data/gameMasterRaw.json");