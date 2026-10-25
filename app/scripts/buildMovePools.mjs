import fs from "node:fs/promises";

const candidatesFile = new URL(
  "../data/rankingCandidatesWithShadows.json",
  import.meta.url
);

const gameMasterFile = new URL(
  "../data/gameMasterRaw.json",
  import.meta.url
);

const outputFile = new URL(
  "../data/movePools.json",
  import.meta.url
);

const candidates = JSON.parse(
  await fs.readFile(candidatesFile, "utf8")
);

const gameMaster = JSON.parse(
  await fs.readFile(gameMasterFile, "utf8")
);

const pokemonSettings = new Map();
const moveSettings = new Map();
const moveNames = new Map();

function inspect(value) {
  if (!value || typeof value !== "object") return;

  if (value.pokemonSettings && value.templateId) {
    pokemonSettings.set(
      value.templateId,
      value.pokemonSettings
    );
  }

  if (value.moveSettings) {
    const move = value.moveSettings;

    const id =
      move.movementId ??
      move.uniqueId ??
      move.moveId;

    if (id !== undefined && id !== null) {
      moveSettings.set(String(id), move);
    }
  }
  if (value.combatMove && value.templateId) {
    const moveId =
      value.combatMove.uniqueId ??
      value.combatMove.movementId;
  
    const marker = "_MOVE_";
    const markerIndex =
      value.templateId.indexOf(marker);
  
    if (
      moveId !== undefined &&
      moveId !== null &&
      markerIndex !== -1
    ) {
      const moveName = value.templateId.slice(
        markerIndex + marker.length
      );
  
      moveNames.set(String(moveId), moveName);
    }
  }
  if (Array.isArray(value)) {
    value.forEach(inspect);
  } else {
    Object.values(value).forEach(inspect);
  }
}

inspect(gameMaster);

function formatMoveName(id) {
  return String(id)
    .replaceAll("_FAST", "")
    .replaceAll("_", " ")
    .toLowerCase()
    .split(" ")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

function createMove(id, category, legacy) {
  const move = moveSettings.get(String(id)) ?? {};

  return {
    id: String(id),
    name: formatMoveName(
        moveNames.get(String(id)) ?? id
      ),
    category,
    legacy,
    type:
      move.pokemonType ??
      move.type ??
      null,
    power: move.power ?? 0,
    energyDelta: move.energyDelta ?? 0,
    durationMs:
      move.durationMs ??
      move.durationMsRaw ??
      1000,
  };
}

function uniqueMoves(moves) {
  return Array.from(
    new Map(
      moves.map((move) => [move.id, move])
    ).values()
  );
}
const supplementalChargedMoves = {
  SKARMORY: [
    {
      id: "DRILL_RUN",
      legacy: true,
    },
  ],
};
const movePools = {};

for (const candidate of candidates) {
  const baseTemplateId = candidate.isShadow
    ? candidate.templateId.replace("_SHADOW", "")
    : candidate.templateId;

  const settings =
    pokemonSettings.get(baseTemplateId) ?? {};

  const regularFast =
    settings.quickMoves ?? [];

  const legacyFast = [
    ...(settings.eliteQuickMove ?? []),
    ...(settings.eliteQuickMoves ?? []),
  ];

  const regularCharged =
    settings.cinematicMoves ?? [];

  const legacyCharged = [
    ...(settings.eliteCinematicMove ?? []),
    ...(settings.eliteCinematicMoves ?? []),
  ];

  const fastMoves = uniqueMoves([
    ...regularFast.map((id) =>
      createMove(id, "fast", false)
    ),
    ...legacyFast.map((id) =>
      createMove(id, "fast", true)
    ),
  ]);

  const supplementalCharged =
  supplementalChargedMoves[candidate.pokemonId] ?? [];

const chargedMoves = uniqueMoves([
  ...regularCharged.map((id) =>
    createMove(id, "charged", false)
  ),
  ...legacyCharged.map((id) =>
    createMove(id, "charged", true)
  ),
  ...supplementalCharged.map(({ id, legacy }) =>
    createMove(id, "charged", legacy)
  ),
]);

  const key = `${candidate.pokemonId}:${candidate.form}`;

  movePools[key] = {
    pokemonId: candidate.pokemonId,
    form: candidate.form,
    templateId: candidate.templateId,
    fastMoves,
    chargedMoves,
  };
}

await fs.writeFile(
  outputFile,
  JSON.stringify(movePools, null, 2),
  "utf8"
);

console.log(
  `Created move pools for ${
    Object.keys(movePools).length
  } Pokémon forms.`
);

console.log(
  "Created app/data/movePools.json"
);