import fs from "node:fs/promises";

const [pokemonIdRaw, formRaw, heightRaw, weightRaw] = process.argv.slice(2);

if (!pokemonIdRaw || !formRaw || !heightRaw) {
  console.error("Usage: node app/scripts/validatePokemonSize.mjs POKEMON_ID FORM HEIGHT_M [WEIGHT_KG]");
  console.error("Example: node app/scripts/validatePokemonSize.mjs PUMPKABOO PUMPKABOO_SUPER 0.77 15");
  process.exit(1);
}

const pokemonId = pokemonIdRaw.toUpperCase();
const form = formRaw.toUpperCase();
const height = Number(heightRaw);
const weight = weightRaw === undefined ? null : Number(weightRaw);

if (!Number.isFinite(height) || height <= 0) {
  throw new Error("Height must be a positive number in meters.");
}
if (weight !== null && (!Number.isFinite(weight) || weight <= 0)) {
  throw new Error("Weight must be a positive number in kilograms.");
}

const data = JSON.parse(
  await fs.readFile("./app/data/pokemonSizeReference.json", "utf8")
);
const key = `${pokemonId}:${form}`;
const reference = data[key];

if (!reference) {
  const available = Object.keys(data)
    .filter((candidate) => candidate.startsWith(`${pokemonId}:`))
    .sort();
  console.error(`No exact size reference found for ${key}.`);
  console.error("Available forms:");
  for (const candidate of available) console.error(`- ${candidate}`);
  process.exit(1);
}

function normalCdf(z) {
  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.sqrt(2);
  const t = 1 / (1 + 0.3275911 * x);
  const erf = 1 -
    (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t -
      0.284496736) * t + 0.254829592) * t) * Math.exp(-x * x);
  return 0.5 * (1 + sign * erf);
}

function decimalPlaces(value) {
  const text = String(value);
  return text.includes(".") ? text.split(".")[1].length : 0;
}

function displayedInterval(valueText) {
  const value = Number(valueText);
  const step = 10 ** -decimalPlaces(valueText);
  return [value - step / 2, value + step / 2];
}

function percentileRange(valueText, mean, sd) {
  const [low, high] = displayedInterval(valueText);
  const lower = normalCdf((low - mean) / sd) * 100;
  const upper = normalCdf((high - mean) / sd) * 100;
  const midpoint = normalCdf((Number(valueText) - mean) / sd) * 100;
  return { low, high, lower, upper, midpoint };
}

const h = percentileRange(heightRaw, reference.averageHeightM, reference.heightStdDev);
const w = weight === null
  ? null
  : percentileRange(weightRaw, reference.averageWeightKg, reference.weightStdDev);

console.log("\nSIZE VALIDATION");
console.log("===============");
console.log(`Comparison key: ${key}`);
console.log(`Template: ${reference.templateId}`);
console.log(`Height baseline: ${reference.averageHeightM} m ± ${reference.heightStdDev} m`);
console.log(`Entered height: ${heightRaw} m`);
console.log(`Displayed-height interval: [${h.low.toFixed(6)}, ${h.high.toFixed(6)}) m`);
console.log(`Approx. height standing: larger than ${h.midpoint.toFixed(2)}%`);
console.log(`Rounding-aware range: larger than ${h.lower.toFixed(2)}% to ${h.upper.toFixed(2)}%`);

if (w) {
  console.log(`\nWeight baseline: ${reference.averageWeightKg} kg ± ${reference.weightStdDev} kg`);
  console.log(`Entered weight: ${weightRaw} kg`);
  console.log(`Displayed-weight interval: [${w.low.toFixed(6)}, ${w.high.toFixed(6)}) kg`);
  console.log(`Approx. weight standing: heavier than ${w.midpoint.toFixed(2)}%`);
  console.log(`Rounding-aware range: heavier than ${w.lower.toFixed(2)}% to ${w.upper.toFixed(2)}%`);
}

console.log("\nIMPORTANT");
console.log("This validates exact form mapping and a normal-distribution approximation.");
console.log("It does not yet claim the exact modern Pokémon GO size-class probability.");