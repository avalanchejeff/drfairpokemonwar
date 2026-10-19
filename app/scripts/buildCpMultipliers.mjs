import fs from "node:fs/promises";

const gameMaster = JSON.parse(
  await fs.readFile("./app/data/gameMasterRaw.json", "utf8")
);

function findCpMultipliers(value) {
  if (!value || typeof value !== "object") return null;

  if (Array.isArray(value.cpMultiplier) && value.cpMultiplier.length >= 51) {
    return value.cpMultiplier;
  }

  if (Array.isArray(value)) {
    for (const child of value) {
      const found = findCpMultipliers(child);
      if (found) return found;
    }
  } else {
    for (const child of Object.values(value)) {
      const found = findCpMultipliers(child);
      if (found) return found;
    }
  }

  return null;
}

const whole = findCpMultipliers(gameMaster);
if (!whole) {
  throw new Error("Could not find cpMultiplier array in gameMasterRaw.json");
}

const levels = [];
for (let level = 1; level <= 51; level++) {
  const cpm = whole[level - 1];
  levels.push({ level, cpm });

  if (level < 51) {
    const next = whole[level];
    const half = Math.sqrt((cpm * cpm + next * next) / 2);
    levels.push({ level: level + 0.5, cpm: half });
  }
}

await fs.writeFile(
  "./app/data/cpMultipliers.json",
  JSON.stringify({ levels }, null, 2),
  "utf8"
);

console.log("Created app/data/cpMultipliers.json");
console.log("Level entries:", levels.length);
console.log("Range:", levels[0].level, "to", levels.at(-1).level);