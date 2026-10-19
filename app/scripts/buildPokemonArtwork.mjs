import fs from "node:fs/promises";

const rawFile = new URL(
  "../data/pokemonRaw.json",
  import.meta.url
);

const rankingsFile = new URL(
  "../data/benchmarkRankings2026.json",
  import.meta.url
);

const outputFile = new URL(
  "../data/pokemonArtwork.json",
  import.meta.url
);

const rawPokemon = JSON.parse(
  await fs.readFile(rawFile, "utf8")
);

const rankings = JSON.parse(
  await fs.readFile(rankingsFile, "utf8")
);

function extractUrl(value) {
  if (typeof value !== "string") {
    return null;
  }

  const marker = "raw.githubusercontent.com";
  const start = value.indexOf(marker);

  if (start < 0) {
    return null;
  }

  const end = value.indexOf(".png", start);

  if (end < 0) {
    return null;
  }

  const path = value.slice(start, end + 4);
  return ["https", ":", "//", path].join("");
}

function assetPair(source) {
  if (!source) {
    return null;
  }

  const image = extractUrl(
    source.image ?? source.assets?.image
  );

  const shinyImage = extractUrl(
    source.shinyImage ?? source.assets?.shinyImage
  );

  if (!image && !shinyImage) {
    return null;
  }

  return { image, shinyImage };
}

function formSuffix(pokemonId, form) {
  if (!form || form === "NORMAL") {
    return null;
  }

  const prefix = `${pokemonId}_`;

  return form.startsWith(prefix)
    ? form.slice(prefix.length)
    : form;
}

function findArtwork(raw, ranking) {
  const baseArtwork = assetPair(raw.assets);
  const suffix = formSuffix(
    ranking.pokemonId,
    ranking.form
  );

  if (!suffix || suffix === "SHADOW") {
    return baseArtwork;
  }

  // Match the exact form artwork first. This is required for PRIMAL,
  // regional, costume, and other named asset forms.
  const matchingAssetForm = raw.assetForms?.find(
    (entry) => {
      const entryForm = String(entry.form ?? "");

      return (
        entryForm === suffix ||
        entryForm === ranking.form ||
        `${ranking.pokemonId}_${entryForm}` === ranking.form
      );
    }
  );

  const formArtwork = assetPair(matchingAssetForm);

  if (formArtwork?.image) {
    return formArtwork;
  }

  // Fall back to temporary-evolution artwork when no exact asset form matched.
  const evolution =
    raw.megaEvolutions?.[ranking.form] ??
    raw.megaEvolutions?.[`${ranking.pokemonId}_${suffix}`];

  const evolutionArtwork = assetPair(
    evolution?.assets ?? evolution
  );

  if (evolutionArtwork?.image) {
    return evolutionArtwork;
  }

  const matchingRegionForm = raw.regionForms?.find?.(
    (entry) => {
      const entryId = String(
        entry.id ?? entry.formId ?? entry.form ?? ""
      );

      return (
        entryId === suffix ||
        entryId === ranking.form ||
        `${ranking.pokemonId}_${entryId}` === ranking.form
      );
    }
  );

  const regionArtwork = assetPair(
    matchingRegionForm?.assets ?? matchingRegionForm
  );

  if (regionArtwork?.image) {
    return regionArtwork;
  }

  return baseArtwork;
}

const rawById = new Map(
  rawPokemon.map((pokemon) => [pokemon.formId, pokemon])
);

const artwork = {};
const unmatched = [];

for (const ranking of rankings) {
  const raw = rawById.get(ranking.pokemonId);

  if (!raw) {
    unmatched.push({
      name: ranking.name,
      pokemonId: ranking.pokemonId,
      form: ranking.form,
      reason: "No pokemonRaw record",
    });
    continue;
  }

  const images = findArtwork(raw, ranking);

  if (!images?.image) {
    unmatched.push({
      name: ranking.name,
      pokemonId: ranking.pokemonId,
      form: ranking.form,
      reason: "No image URL",
    });
    continue;
  }

  artwork[ranking.name] = images;
}

await fs.writeFile(
  outputFile,
  JSON.stringify(artwork, null, 2),
  "utf8"
);

console.log(
  `Created artwork for ${Object.keys(artwork).length} ranking entries.`
);
console.log(`Unmatched entries: ${unmatched.length}`);
console.log("Created app/data/pokemonArtwork.json");

if (unmatched.length > 0) {
  console.table(unmatched.slice(0, 20));
}