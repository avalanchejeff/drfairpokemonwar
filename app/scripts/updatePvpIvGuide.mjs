import fs from "node:fs/promises";

const file = "./app/scripts/buildPvpIvCalculator.mjs";
let source = await fs.readFile(file, "utf8");
await fs.writeFile(`${file}.before-quality-guide`, source, "utf8");

source = source.replace(
`function ivQuality(rank) {
  if (rank <= 41) return "Elite";
  if (rank <= 205) return "Excellent";
  if (rank <= 410) return "Good";
  if (rank <= 1024) return "Viable";
  return "Niche";
}

`,
""
);

source = source.replace(
`    row.quality = ivQuality(row.rank);
`,
""
);

source = source.replace(
`    qualityBands: {
      Elite: "#1-41 (top 1%)",
      Excellent: "#42-205 (top 5%)",
      Good: "#206-410 (top 10%)",
      Viable: "#411-1024 (top 25%)",
      Niche: "#1025-4096",
    },`,
`    qualityGuide: [
      { label: "Elite", maximumTopPercent: 1 },
      { label: "Excellent", maximumTopPercent: 5 },
      { label: "Good", maximumTopPercent: 10 },
      { label: "Viable", maximumTopPercent: 25 },
      { label: "Niche", maximumTopPercent: 100 },
    ],`
);

await fs.writeFile(file, source, "utf8");
console.log("Updated PvP IV calculator to keep quality labels in the guide only.");