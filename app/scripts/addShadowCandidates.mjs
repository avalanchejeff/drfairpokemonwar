import fs from "node:fs/promises";

const candidatesFile = new URL(
  "../data/rankingCandidates.json",
  import.meta.url
);

const shadowFile = new URL(
  "../data/shadowRosterRaw.json",
  import.meta.url
);

const outputFile = new URL(
  "../data/rankingCandidatesWithShadows.json",
  import.meta.url
);

const candidates = JSON.parse(
  await fs.readFile(candidatesFile, "utf8")
);

const shadowRoster = JSON.parse(
  await fs.readFile(shadowFile, "utf8")
);

const shadows = [];

for (const shadow of Object.values(shadowRoster)) {
  const dexPrefix =
    "V" + String(shadow.id).padStart(4, "0") + "_";

  const normalForm = candidates.find((candidate) => {
    return (
      candidate.form === "NORMAL" &&
      candidate.templateId &&
      candidate.templateId.startsWith(dexPrefix)
    );
  });

  if (!normalForm) {
    console.log(
      "No normal form found:",
      shadow.id,
      shadow.name
    );

    continue;
  }

  shadows.push({
    ...normalForm,
    templateId: normalForm.templateId + "_SHADOW",
    form: normalForm.pokemonId + "_SHADOW",
    isShadow: true,
  });
}

const regularCandidates = candidates.map((candidate) => ({
  ...candidate,
  isShadow: false,
}));

const combined = [
  ...regularCandidates,
  ...shadows,
];

await fs.writeFile(
  outputFile,
  JSON.stringify(combined, null, 2),
  "utf8"
);

console.log(
  "Original candidates: " + candidates.length
);

console.log(
  "Shadow candidates added: " + shadows.length
);

console.log(
  "Combined candidates: " + combined.length
);

console.log(
  "Created app/data/rankingCandidatesWithShadows.json"
);