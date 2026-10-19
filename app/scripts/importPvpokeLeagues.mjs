import fs from "node:fs/promises";

const leagues = [
  {
    name: "Great League",
    cp: 1500,
    output: "./app/data/pvpokeGreatLeague.json",
  },
  {
    name: "Ultra League",
    cp: 2500,
    output: "./app/data/pvpokeUltraLeague.json",
  },
  {
    name: "Master League",
    cp: 10000,
    output: "./app/data/pvpokeMasterLeagueStandard.json",
  },
];

const baseParts = [
  "https",
  ":",
  "//raw.githubusercontent.com/pvpoke/pvpoke/master/src/data/rankings/all/overall/",
];
const base = baseParts.join("");

for (const league of leagues) {
  const url = `${base}rankings-${league.cp}.json`;
  console.log(`Downloading ${league.name}...`);

  const response = await fetch(url, {
    headers: {
      "User-Agent": "war-dashboard-pvpoke-importer",
    },
  });

  if (!response.ok) {
    throw new Error(
      `${league.name} download failed: ${response.status}`
    );
  }

  const rankings = await response.json();

  if (!Array.isArray(rankings) || rankings.length === 0) {
    throw new Error(`${league.name} returned no rankings.`);
  }

  await fs.writeFile(
    league.output,
    JSON.stringify(rankings, null, 2),
    "utf8"
  );

  console.log(
    `${league.name}: ${rankings.length} records -> ${league.output}`
  );
}

console.log("PvPoke Great, Ultra, and standard Master League imports complete.");