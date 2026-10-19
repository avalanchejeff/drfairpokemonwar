import fs from "node:fs/promises";

const inputFile = new URL(
  "../data/rankings.json",
  import.meta.url
);

const outputFile = new URL(
  "../data/cleanRankings.json",
  import.meta.url
);

const rankings = JSON.parse(
  await fs.readFile(inputFile, "utf8")
);

function titleCase(value) {
  return value
    .toLowerCase()
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

function createDisplayName(pokemon) {
  if (pokemon.form === "NORMAL") {
    return titleCase(pokemon.pokemonId);
  }

  if (
    pokemon.pokemonId === "MEWTWO" &&
    pokemon.form === "MEWTWO_A"
  ) {
    return "Armored Mewtwo";
  }

  const prefix = `${pokemon.pokemonId}_`;

  if (pokemon.form.startsWith(prefix)) {
    const formName =
      pokemon.form.slice(prefix.length);

    return `${titleCase(pokemon.pokemonId)} ${titleCase(
      formName
    )}`;
  }

  return titleCase(pokemon.form);
}

const excludedForms = [
  "ETERNATUS_ETERNAMAX",
];

const cleaned = rankings
  .filter(
    (pokemon) =>
      !excludedForms.includes(pokemon.form)
  )
  .map((pokemon) => ({
    ...pokemon,
    displayName: createDisplayName(pokemon),
  }))
  .sort((a, b) => b.psv - a.psv);

for (let index = 0; index < cleaned.length; index++) {
  const pokemon = cleaned[index];
  const rank = index + 1;

  pokemon.overallRank = rank;

  if (rank <= 15) {
    pokemon.tier = "God";
  } else if (rank <= 75) {
    pokemon.tier = "S+";
  } else if (rank <= 150) {
    pokemon.tier = "S";
  } else if (rank <= Math.floor(cleaned.length * 0.25)) {
    pokemon.tier = "A";
  } else if (rank <= Math.floor(cleaned.length * 0.5)) {
    pokemon.tier = "B";
  } else if (rank <= Math.floor(cleaned.length * 0.75)) {
    pokemon.tier = "C";
  } else {
    pokemon.tier = "D";
  }
}

for (const pokemon of cleaned) {
  const matchingType = cleaned.filter(
    (candidate) =>
      candidate.primaryType === pokemon.primaryType ||
      candidate.secondaryType === pokemon.primaryType
  );

  pokemon.typeRank =
    matchingType.findIndex(
      (candidate) =>
        candidate.pokemonId === pokemon.pokemonId &&
        candidate.form === pokemon.form
    ) + 1;
}

await fs.writeFile(
  outputFile,
  JSON.stringify(cleaned, null, 2),
  "utf8"
);

console.log(`Clean ranking records: ${cleaned.length}`);
console.log("Created app/data/cleanRankings.json");

console.log("\nCorrected Top 15 God Tier:");

console.table(
  cleaned.slice(0, 15).map((pokemon) => ({
    rank: pokemon.overallRank,
    pokemon: pokemon.displayName,
    psv: pokemon.psv,
    dps: pokemon.dps,
    tud: pokemon.tud,
    charge: pokemon.charge,
  }))
);