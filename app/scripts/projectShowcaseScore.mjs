import fs from "node:fs/promises";

const args = process.argv.slice(2);
if (args.length < 7) {
  console.error("Usage: node app/scripts/projectShowcaseScore.mjs POKEMON_ID FORM HEIGHT_M WEIGHT_KG ATK_IV DEF_IV HP_IV [XXL]");
  console.error("Example: node app/scripts/projectShowcaseScore.mjs PIKACHU NORMAL 0.62 12.5 15 15 15 XXL");
  process.exit(1);
}

const [pokemonIdRaw, formRaw, heightRaw, weightRaw, atkRaw, defRaw, hpRaw, xxlRaw] = args;
const pokemonId = pokemonIdRaw.toUpperCase();
const form = formRaw.toUpperCase();
const height = Number(heightRaw);
const weight = Number(weightRaw);
const atk = Number(atkRaw);
const def = Number(defRaw);
const hp = Number(hpRaw);
const xxl = String(xxlRaw ?? "").toUpperCase() === "XXL";

for (const [label, value] of [["height",height],["weight",weight]]) {
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${label} must be positive.`);
}
for (const [label, value] of [["Attack IV",atk],["Defense IV",def],["HP IV",hp]]) {
  if (!Number.isInteger(value) || value < 0 || value > 15) throw new Error(`${label} must be 0-15.`);
}

if (pokemonId === "PUMPKABOO" || pokemonId === "GOURGEIST") {
  console.error("Pumpkaboo and Gourgeist use custom form-specific Showcase bands.");
  console.error("This ordinary-species scorer intentionally refuses to estimate them until those exact bands are encoded.");
  process.exit(2);
}

const data = JSON.parse(await fs.readFile("./app/data/pokemonSizeReference.json", "utf8"));
const key = `${pokemonId}:${form}`;
const reference = data[key];
if (!reference) {
  console.error(`No exact reference found for ${key}.`);
  process.exit(1);
}

const maxHeight = reference.averageHeightM * 1.75;
const maxWeight = reference.averageWeightKg * 2.25;
const heightPoints = Math.max(0, Math.min(800, (height / maxHeight) * 800));
const weightPoints = Math.max(0, Math.min(150, (weight / maxWeight) * 150));
const ivPoints = ((atk + def + hp) / 45) * 50;
const xxlBonus = xxl ? 178 : 0;
const total = heightPoints + weightPoints + ivPoints + xxlBonus;
const perfectPercent = Math.min(100, (total / 1178) * 100);
const inferredXxl = height >= reference.averageHeightM * 1.5;

console.log("\nPROJECTED SHOWCASE SCORE");
console.log("========================");
console.log(`Comparison key: ${key}`);
console.log(`Base height: ${reference.averageHeightM} m`);
console.log(`Base weight: ${reference.averageWeightKg} kg`);
console.log(`Projected maximum height: ${maxHeight.toFixed(4)} m`);
console.log(`Projected maximum weight: ${maxWeight.toFixed(4)} kg`);
console.log("");
console.log(`Height: ${heightPoints.toFixed(1)} / 800`);
console.log(`Weight: ${weightPoints.toFixed(1)} / 150`);
console.log(`IVs: ${ivPoints.toFixed(1)} / 50`);
console.log(`XXL bonus: ${xxlBonus} / 178`);
console.log("------------------------");
console.log(`Projected total: ${total.toFixed(1)} / 1178`);
console.log(`Percent of perfect: ${perfectPercent.toFixed(1)}%`);
console.log(`Visual ring: ${Math.max(50, Math.min(100, Math.round(perfectPercent / 10) * 10))}%`);
console.log("");
console.log(`Entered XXL flag: ${xxl ? "YES" : "NO"}`);
console.log(`Height implies ordinary XXL threshold: ${inferredXxl ? "YES" : "NO"}`);
if (xxl !== inferredXxl) {
  console.log("WARNING: Entered XXL flag and height-based threshold disagree. Verify the in-game size tag.");
}
console.log("\nThis is a community-model projection, not an official Niantic score.");
console.log("Rounded in-game measurements can shift the live score by a few points.");