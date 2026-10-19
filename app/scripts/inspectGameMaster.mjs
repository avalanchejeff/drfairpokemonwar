import fs from "node:fs/promises";

const inputFile = new URL(
  "../data/gameMasterRaw.json",
  import.meta.url
);

const outputFile = new URL(
  "../data/pokemonSettings.json",
  import.meta.url
);

const gameMaster = JSON.parse(
  await fs.readFile(inputFile, "utf8")
);

const records = [];

function createTemporaryFormName(
  pokemonId,
  temporaryEvolutionId
) {
  const temporaryType = String(
    temporaryEvolutionId
  ).replace("TEMP_EVOLUTION_", "");

  if (temporaryType === "PRIMAL") {
    return `${pokemonId}_PRIMAL`;
  }

  if (temporaryType === "MEGA") {
    return `${pokemonId}_MEGA`;
  }

  if (temporaryType === "MEGA_X") {
    return `${pokemonId}_MEGA_X`;
  }

  if (temporaryType === "MEGA_Y") {
    return `${pokemonId}_MEGA_Y`;
  }

  return `${pokemonId}_${temporaryType}`;
}

function inspect(value) {
  if (!value || typeof value !== "object") {
    return;
  }

  if (value.pokemonSettings) {
    const settings = value.pokemonSettings;

    const baseTypes = [
      settings.type,
      settings.type2,
    ].filter(Boolean);

    records.push({
      templateId: value.templateId ?? null,
      pokemonId: settings.pokemonId ?? null,
      form: settings.form ?? null,
      costume: settings.costume ?? null,
      attack:
        settings.stats?.baseAttack ?? null,
      defense:
        settings.stats?.baseDefense ?? null,
      stamina:
        settings.stats?.baseStamina ?? null,
      types: baseTypes,
      isTemporaryEvolution: false,
      temporaryEvolutionId: null,
    });

    const temporaryOverrides =
      settings.tempEvoOverrides ?? [];

    for (const override of temporaryOverrides) {
      if (!override.stats) {
        continue;
      }

      const temporaryEvolutionId =
        override.tempEvoId ??
        "TEMP_EVOLUTION_UNKNOWN";

      records.push({
        templateId: value.templateId ?? null,
        pokemonId: settings.pokemonId ?? null,

        form: createTemporaryFormName(
          settings.pokemonId,
          temporaryEvolutionId
        ),

        costume: null,

        attack:
          override.stats.baseAttack ??
          settings.stats?.baseAttack ??
          null,

        defense:
          override.stats.baseDefense ??
          settings.stats?.baseDefense ??
          null,

        stamina:
          override.stats.baseStamina ??
          settings.stats?.baseStamina ??
          null,

        types: [
          override.typeOverride1 ??
            settings.type,
          override.typeOverride2 ??
            settings.type2,
        ].filter(Boolean),

        isTemporaryEvolution: true,
        temporaryEvolutionId,
      });
    }
  }

  if (Array.isArray(value)) {
    value.forEach(inspect);
  } else {
    Object.values(value).forEach(inspect);
  }
}

inspect(gameMaster);

await fs.writeFile(
  outputFile,
  JSON.stringify(records, null, 2),
  "utf8"
);

const temporaryEvolutionCount =
  records.filter(
    (record) => record.isTemporaryEvolution
  ).length;

console.log(
  `Exported ${records.length} settings records.`
);

console.log(
  `Temporary evolution records: ${temporaryEvolutionCount}`
);

console.log(
  "Created app/data/pokemonSettings.json"
);