import fs from "node:fs/promises";

const pagePath = "./app/lab/page.tsx";
const backupPath = "./app/lab/page.tsx.before-accurate-size-forms";
let source = await fs.readFile(pagePath, "utf8");
const original = source;

function replaceOnce(search, replacement, label) {
  if (!source.includes(search)) {
    throw new Error(`Could not find ${label}. No changes were written.`);
  }
  source = source.replace(search, replacement);
}

replaceOnce(
  `    const exactKey = selectedRecord.pokemonId + ":" + (selectedRecord.form ?? "NORMAL");
    const normalKey = selectedRecord.pokemonId + ":NORMAL";
    const reference = sizeReferences[exactKey] ?? sizeReferences[normalKey];
    if (!reference) return null;`,
  `    const exactKey = selectedRecord.pokemonId + ":" + (selectedRecord.form ?? "NORMAL");
    const normalKey = selectedRecord.pokemonId + ":NORMAL";
    const requiresExplicitSizeForm =
      (selectedRecord.pokemonId === "PUMPKABOO" ||
        selectedRecord.pokemonId === "GOURGEIST") &&
      selectedRecord.form === "NORMAL";

    if (requiresExplicitSizeForm) {
      return {
        requiresExplicitSizeForm: true,
        reference: null,
        heightPercentile: null,
        weightPercentile: null,
        showcasePotential: null,
        artworkUrl: null,
        scale: 42,
      };
    }

    const reference = sizeReferences[exactKey] ?? sizeReferences[normalKey];
    if (!reference) return null;`,
  "size-reference lookup"
);

replaceOnce(
  `    return {
      reference,
      heightPercentile,`,
  `    return {
      requiresExplicitSizeForm: false,
      reference,
      heightPercentile,`,
  "size result return"
);

replaceOnce(
  `{selectedRecord && sizeShowcase ? (
              <div className="mt-5 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">`,
  `{selectedRecord && sizeShowcase?.requiresExplicitSizeForm ? (
              <div className="mt-5 rounded-2xl border border-amber-800 bg-amber-950/20 p-5 text-amber-200">
                Select Pumpkaboo or Gourgeist Small, Average, Large, or Super before calculating size standing. The generic form is not a valid comparison population.
              </div>
            ) : selectedRecord && sizeShowcase && sizeShowcase.reference ? (
              <div className="mt-5 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">`,
  "size-section condition"
);

replaceOnce(
  `<div className="space-y-4">
                  <SizeResultCard`,
  `<div className="space-y-4">
                  <div className="rounded-2xl border border-lime-900/60 bg-lime-950/10 p-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                      Compared with
                    </div>
                    <div className="mt-1 text-lg font-black text-lime-200">
                      {selectedRecord.displayName}
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
                      Form key: {selectedRecord.form}
                    </div>
                  </div>
                  <SizeResultCard`,
  "size result cards"
);

await fs.writeFile(backupPath, original, "utf8");
await fs.writeFile(pagePath, source, "utf8");

console.log("Patched form-accurate Size & Showcase lookup.");
console.log("- Pumpkaboo/Gourgeist generic forms no longer produce a percentile");
console.log("- Small/Average/Large/Super use their exact form baselines");
console.log("- The comparison form and key are now visible in the panel");
console.log("Backup:", backupPath);