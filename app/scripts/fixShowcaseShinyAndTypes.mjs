import fs from "node:fs/promises";

const pagePath = "./app/lab/page.tsx";
const backupPath = "./app/lab/page.tsx.before-showcase-shiny-type-fix";
let source = await fs.readFile(pagePath, "utf8");
const original = source;

function replaceOnce(search, replacement, label) {
  if (!source.includes(search)) throw new Error(`Could not find ${label}. No changes were written.`);
  source = source.replace(search, replacement);
}

// Remove the unused specimen-details Shiny state and control.
replaceOnce(
  '  const [isShiny, setIsShiny] = useState(false);\n',
  '',
  "unused specimen Shiny state"
);

const specimenShinyBlock = `              <div>
                <span className={label}>Special</span>
                <button
                  type="button"
                  aria-pressed={isShiny}
                  onClick={() => setIsShiny((current) => !current)}
                  className={\`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold transition \${
                    isShiny
                      ? "border-yellow-300 bg-yellow-400/15 text-yellow-200 shadow-sm shadow-yellow-950/50"
                      : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-yellow-500 hover:text-yellow-200"
                  }\`}
                >
                  {isShiny ? "✨ Shiny" : "☆ Shiny"}
                </button>
              </div>

`;
replaceOnce(specimenShinyBlock, '', "Specimen Details Shiny control");

// Let TypeScript narrow nullable exact ceilings correctly.
replaceOnce(
  `    if (
      !Number.isFinite(maximumHeight) ||
      !Number.isFinite(maximumWeight) ||
      maximumHeight <= 0 ||
      maximumWeight <= 0
    ) {`,
  `    if (
      maximumHeight === null ||
      maximumWeight === null ||
      !Number.isFinite(maximumHeight) ||
      !Number.isFinite(maximumWeight) ||
      maximumHeight <= 0 ||
      maximumWeight <= 0
    ) {`,
  "nullable Showcase ceiling guard"
);

// Resolve exact-form artwork first, with common Mega naming variants.
const oldArtwork = `    const normalArtworkUrl =
      artworkIndexHD[selectedRecord.name as keyof typeof artworkIndexHD] ??
      artworkIndexHD[baseArtworkKey as keyof typeof artworkIndexHD] ??
      null;
    const artworkRecord =
      pokemonArtwork[selectedRecord.name as keyof typeof pokemonArtwork] ??
      pokemonArtwork[baseArtworkKey as keyof typeof pokemonArtwork];
    const shinyArtworkUrl = artworkRecord?.shinyImage ?? null;`;

const newArtwork = `    const baseName = baseArtworkKey.replace(/-mega(?:-[xy])?$/, "");
    const megaSuffix = selectedRecord.name.match(/-mega(?:-[xy])?$/)?.[0] ?? "";
    const artworkCandidates = [
      selectedRecord.name,
      selectedRecord.name.replace(/^(.*)-mega(-[xy])?$/, "mega-$1$2"),
      selectedRecord.name.replace(/^(.*)-mega(-[xy])?$/, "$1-mega$2"),
      baseArtworkKey,
      baseName,
    ].filter(Boolean);

    const normalArtworkUrl =
      artworkCandidates
        .map((key) => artworkIndexHD[key as keyof typeof artworkIndexHD])
        .find(Boolean) ?? null;
    const artworkRecord = artworkCandidates
      .map((key) => pokemonArtwork[key as keyof typeof pokemonArtwork])
      .find((entry) => Boolean(entry?.shinyImage));
    const exactFormHasShiny = Boolean(
      artworkCandidates.slice(0, megaSuffix ? 3 : 1).find(
        (key) => pokemonArtwork[key as keyof typeof pokemonArtwork]?.shinyImage
      )
    );
    const shinyArtworkUrl = artworkRecord?.shinyImage ?? null;`;
replaceOnce(oldArtwork, newArtwork, "Showcase artwork lookup");

replaceOnce(
  '      shinyArtworkUrl,\n      maximumHeight,',
  '      shinyArtworkUrl,\n      exactFormHasShiny,\n      maximumHeight,',
  "Showcase artwork return"
);

// Keep Shiny state out of score dependencies; artwork is selected after score calculation.
replaceOnce(
  '  }, [selectedRecord, height, weight, attack, defense, hp, isXXL, showShowcaseShiny]);',
  '  }, [selectedRecord, height, weight, attack, defense, hp, isXXL, showShowcaseShiny]);',
  "Showcase dependency list"
);

// Make the ready branch explicit enough for TypeScript.
replaceOnce(
  '            ) : projectedShowcase && "total" in projectedShowcase ? (',
  '            ) : projectedShowcase && typeof projectedShowcase.total === "number" ? (',
  "ready Showcase branch"
);

for (const [from, to] of [
  ['projectedShowcase.percentPerfect.toFixed(1)', '(projectedShowcase.percentPerfect ?? 0).toFixed(1)'],
  ['projectedShowcase.total.toFixed(1)', '(projectedShowcase.total ?? 0).toFixed(1)'],
  ['value={projectedShowcase.heightPoints}', 'value={projectedShowcase.heightPoints ?? 0}'],
  ['value={projectedShowcase.weightPoints}', 'value={projectedShowcase.weightPoints ?? 0}'],
  ['value={projectedShowcase.ivPoints}', 'value={projectedShowcase.ivPoints ?? 0}'],
  ['value={projectedShowcase.xxlBonus}', 'value={projectedShowcase.xxlBonus ?? 0}'],
]) {
  replaceOnce(from, to, from);
}

// Explain missing exact-form Shiny artwork rather than silently showing base Shiny.
replaceOnce(
  '                {showShowcaseShiny ? "✨ Shiny" : "☆ Normal"}\n              </button>',
  `                {showShowcaseShiny ? "✨ Shiny" : "☆ Normal"}
              </button>
              {showShowcaseShiny && projectedShowcase && "exactFormHasShiny" in projectedShowcase && !projectedShowcase.exactFormHasShiny ? (
                <span className="text-xs text-amber-300">
                  Exact-form Shiny artwork unavailable; using the closest available Shiny.
                </span>
              ) : null}`,
  "Showcase Shiny button label"
);

await fs.writeFile(backupPath, original, "utf8");
await fs.writeFile(pagePath, source, "utf8");
console.log("Fixed Showcase Shiny controls and TypeScript narrowing.");
console.log("- Removed Specimen Details Shiny toggle");
console.log("- Kept Showcase artwork toggle only");
console.log("- Added exact-form/Mega Shiny key candidates");
console.log("- Score inputs remain height, weight, IVs, XXL, and exact ceilings only");
console.log("Backup:", backupPath);