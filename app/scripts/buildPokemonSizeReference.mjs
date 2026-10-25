import fs from "node:fs/promises";

const gameMasterPath = "./app/data/gameMasterRaw.json";
const outputPath = "./app/data/pokemonSizeReference.json";
const gameMaster = JSON.parse(await fs.readFile(gameMasterPath, "utf8"));

const baseRecords = new Map();
const extendedRecords = new Map();

function normalizeForm(pokemonId, form) {
  if (!form || form === "NORMAL" || form === `${pokemonId}_NORMAL`) {
    return "NORMAL";
  }
  return form;
}

function walk(value) {
  if (!value || typeof value !== "object") return;

  const templateId = value.templateId ?? value.data?.templateId;
  const pokemonSettings = value.pokemonSettings ?? value.data?.pokemonSettings;
  const extended =
    value.pokemonExtendedSettings ?? value.data?.pokemonExtendedSettings;

  if (templateId && pokemonSettings?.pokemonId) {
    const p = pokemonSettings;
    if (
      Number.isFinite(p.pokedexHeightM) &&
      Number.isFinite(p.pokedexWeightKg) &&
      Number.isFinite(p.heightStdDev) &&
      Number.isFinite(p.weightStdDev)
    ) {
      const form = normalizeForm(p.pokemonId, p.form);
      baseRecords.set(`${p.pokemonId}:${form}`, {
        pokemonId: p.pokemonId,
        form,
        templateId,
        averageHeightM: p.pokedexHeightM,
        averageWeightKg: p.pokedexWeightKg,
        heightStdDev: p.heightStdDev,
        weightStdDev: p.weightStdDev,
      });
    }
  }

  if (templateId && extended?.uniqueId && extended.sizeSettings) {
    const pokemonId = extended.uniqueId;
    const form = normalizeForm(pokemonId, extended.form);
    const s = extended.sizeSettings;
    extendedRecords.set(`${pokemonId}:${form}`, {
      extendedTemplateId: templateId,
      xxsLowerBound: s.xxsLowerBound ?? null,
      xsLowerBound: s.xsLowerBound ?? null,
      mLowerBound: s.mLowerBound ?? null,
      mUpperBound: s.mUpperBound ?? null,
      xlUpperBound: s.xlUpperBound ?? null,
      xxlUpperBound: s.xxlUpperBound ?? null,
    });
  }

  if (Array.isArray(value)) {
    for (const item of value) walk(item);
  } else {
    for (const item of Object.values(value)) walk(item);
  }
}

walk(gameMaster);

const output = {};
let exactBounds = 0;
let normalFallbackBounds = 0;
let missingBounds = 0;

for (const [key, base] of baseRecords) {
  const normalKey = `${base.pokemonId}:NORMAL`;
  const exactExtended = extendedRecords.get(key);
  const normalExtended = extendedRecords.get(normalKey);
  const size = exactExtended ?? normalExtended ?? null;

  if (exactExtended) exactBounds += 1;
  else if (normalExtended) normalFallbackBounds += 1;
  else missingBounds += 1;

  const xxlUpperBound = size?.xxlUpperBound ?? null;
  const xxlHeightClass =
    Number.isFinite(xxlUpperBound) && base.averageHeightM > 0
      ? xxlUpperBound / base.averageHeightM
      : null;
  const showcaseWeightDivisor =
    Number.isFinite(xxlHeightClass) ? xxlHeightClass + 0.5 : null;
  const showcaseMaximumWeightKg =
    Number.isFinite(showcaseWeightDivisor)
      ? base.averageWeightKg * showcaseWeightDivisor
      : null;

  output[key] = {
    ...base,
    extendedTemplateId: size?.extendedTemplateId ?? null,
    xxsLowerBound: size?.xxsLowerBound ?? null,
    xsLowerBound: size?.xsLowerBound ?? null,
    mLowerBound: size?.mLowerBound ?? null,
    mUpperBound: size?.mUpperBound ?? null,
    xlUpperBound: size?.xlUpperBound ?? null,
    xxlUpperBound,
    xxlHeightClass,
    showcaseWeightDivisor,
    showcaseMaximumWeightKg,
  };
}

await fs.writeFile(outputPath, JSON.stringify(output, null, 2), "utf8");

console.log(`Created ${outputPath}`);
console.log(`Size references: ${Object.keys(output).length}`);
console.log(`Exact extended bounds: ${exactBounds}`);
console.log(`Normal-form fallback bounds: ${normalFallbackBounds}`);
console.log(`Missing extended bounds: ${missingBounds}`);

const dusknoir = output["DUSKNOIR:NORMAL"];
if (dusknoir) {
  console.log("Dusknoir audit:", {
    averageHeightM: dusknoir.averageHeightM,
    xxlUpperBound: dusknoir.xxlUpperBound,
    xxlHeightClass: dusknoir.xxlHeightClass,
    showcaseWeightDivisor: dusknoir.showcaseWeightDivisor,
    showcaseMaximumWeightKg: dusknoir.showcaseMaximumWeightKg,
  });
}