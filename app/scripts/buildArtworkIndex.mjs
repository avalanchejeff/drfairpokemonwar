import fs from "node:fs/promises";

const targets = JSON.parse(
  await fs.readFile(
    "./app/data/artworkTargets.json",
    "utf8"
  )
);

const artworkIndex = {};

for (const slug of targets) {
  artworkIndex[slug] = `/artwork/top/${slug}.png`;
}

await fs.writeFile(
  "./app/data/artworkIndex.json",
  JSON.stringify(artworkIndex, null, 2),
  "utf8"
);

console.log(
  `Created artwork index with ${targets.length} entries`
);