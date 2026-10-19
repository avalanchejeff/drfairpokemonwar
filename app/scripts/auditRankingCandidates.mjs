import fs from "node:fs/promises";

const inputFile = new URL(
  "../data/rankingCandidates.json",
  import.meta.url
);

const outputFile = new URL(
  "../data/formAuditReport.json",
  import.meta.url
);

const candidates = JSON.parse(
  await fs.readFile(inputFile, "utf8")
);

const unclearForms = candidates.filter