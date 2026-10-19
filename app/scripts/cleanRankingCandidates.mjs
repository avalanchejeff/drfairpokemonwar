import fs from "node:fs/promises";

const inputFile = new URL(
  "../data/pokemonSettings.json",
  import.meta.url
);

const outputFile = new URL(
  "../data/rankingCandidates.json",
  import.meta.url
);

const records = JSON.parse(
  await fs.readFile(inputFile, "utf8")
);

function normalizedForm(item) {
  const form = item.form ?? "NORMAL";

  if (
    form === "NORMAL" ||
    form === item.pokemonId ||
    form === `${item.pokemonId}_NORMAL` ||
    form === "NIDORAN_NORMAL"
  ) {
    return "NORMAL";
  }

  return form;
}

function candidateKey(item, form) {
  return [
    item.pokemonId,
    form,
    ...(item.types ?? []),
  ].join("|");
}

function preferenceScore(item, form) {
  let score = 0;
  const templateId = String(item.templateId ?? "");

  // Prefer an explicit form-specific NORMAL template when the Game Master
  // also contains an older unsuffixed template for the same Pokemon.
  if (form === "NORMAL" && templateId.endsWith("_NORMAL")) {
    score += 100;
  }

  // Preserve temporary evolution records when encountered.
  if (item.isTemporaryEvolution) {
    score += 50;
  }

  // Prefer complete records.
  if (Number.isFinite(item.attack)) score += 5;
  if (Number.isFinite(item.defense)) score += 5;
  if (Number.isFinite(item.stamina)) score += 5;
  if ((item.types ?? []).length > 0) score += 5;

  return score;
}

const unique = new Map();
let duplicateRecordsRemoved = 0;

for (const item of records) {
  if (!item.pokemonId) {
    continue;
  }

  if (item.form === "ETERNATUS_ETERNAMAX") {
    continue;
  }

  const form = normalizedForm(item);
  const normalizedItem = {
    ...item,
    form,
  };

  const key = candidateKey(normalizedItem, form);
  const existing = unique.get(key);

  if (!existing) {
    unique.set(key, normalizedItem);
    continue;
  }

  duplicateRecordsRemoved += 1;

  if (
    preferenceScore(normalizedItem, form) >
    preferenceScore(existing, form)
  ) {
    unique.set(key, normalizedItem);
  }
}

const candidates = [...unique.values()].sort((a, b) => {
  const pokemonCompare = a.pokemonId.localeCompare(b.pokemonId);

  if (pokemonCompare !== 0) {
    return pokemonCompare;
  }

  return a.form.localeCompare(b.form);
});

await fs.writeFile(
  outputFile,
  JSON.stringify(candidates, null, 2),
  "utf8"
);

console.log(`Original records: ${records.length}`);
console.log(`Duplicate records removed: ${duplicateRecordsRemoved}`);
console.log(`Ranking candidates: ${candidates.length}`);
console.log("Created app/data/rankingCandidates.json");