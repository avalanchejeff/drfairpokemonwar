import fs from "node:fs/promises";

const pagePath = "./app/lab/page.tsx";
const backupPath = "./app/lab/page.tsx.before-exact-showcase-shiny";
let source = await fs.readFile(pagePath, "utf8");
const original = source;

function replaceOnce(search, replacement, label) {
  if (!source.includes(search)) throw new Error(`Could not find ${label}. No changes were written.`);
  source = source.replace(search, replacement);
}

replaceOnce(
  'import artworkIndexHD from "../data/artworkIndexHD.json";',
  'import artworkIndexHD from "../data/artworkIndexHD.json";\nimport pokemonArtwork from "../data/pokemonArtwork.json";',
  "HD artwork import"
);

replaceOnce(
  '  weightStdDev: number;\n};',
  '  weightStdDev: number;\n  xxlUpperBound: number | null;\n  xxlHeightClass: number | null;\n  showcaseWeightDivisor: number | null;\n  showcaseMaximumWeightKg: number | null;\n};',
  "SizeReference type"
);

replaceOnce(
  '  const [isXXL, setIsXXL] = useState(false);',
  '  const [isXXL, setIsXXL] = useState(false);\n  const [showShowcaseShiny, setShowShowcaseShiny] = useState(false);',
  "XXL state"
);

replaceOnce(
  '    const maximumHeight = reference.averageHeightM * 1.75;\n    const maximumWeight = reference.averageWeightKg * 2.25;',
  `    const maximumHeight = reference.xxlUpperBound;
    const maximumWeight = reference.showcaseMaximumWeightKg;
    if (
      !Number.isFinite(maximumHeight) ||
      !Number.isFinite(maximumWeight) ||
      maximumHeight <= 0 ||
      maximumWeight <= 0
    ) {
      return { customPending: false, reference, incomplete: true };
    }`,
  "hard-coded Showcase maxima"
);

replaceOnce(
  '      Math.min(800, (measuredHeight / maximumHeight) * 800)',
  '      Math.min(800, (measuredHeight / Number(maximumHeight)) * 800)',
  "height score"
);
replaceOnce(
  '      Math.min(150, (measuredWeight / maximumWeight) * 150)',
  '      Math.min(150, (measuredWeight / Number(maximumWeight)) * 150)',
  "weight score"
);

replaceOnce(
  `    const artworkUrl =
      artworkIndexHD[selectedRecord.name as keyof typeof artworkIndexHD] ??
      artworkIndexHD[baseArtworkKey as keyof typeof artworkIndexHD] ??
      null;`,
  `    const normalArtworkUrl =
      artworkIndexHD[selectedRecord.name as keyof typeof artworkIndexHD] ??
      artworkIndexHD[baseArtworkKey as keyof typeof artworkIndexHD] ??
      null;
    const artworkRecord =
      pokemonArtwork[selectedRecord.name as keyof typeof pokemonArtwork] ??
      pokemonArtwork[baseArtworkKey as keyof typeof pokemonArtwork];
    const shinyArtworkUrl = artworkRecord?.shinyImage ?? null;
    const artworkUrl =
      showShowcaseShiny && shinyArtworkUrl
        ? shinyArtworkUrl
        : normalArtworkUrl;`,
  "Showcase artwork lookup"
);

replaceOnce(
  '      visualScale: Math.max(38, percentPerfect),',
  '      visualScale: Math.max(38, percentPerfect),\n      shinyArtworkUrl,\n      maximumHeight,\n      maximumWeight,',
  "Showcase return"
);

replaceOnce(
  '  }, [selectedRecord, height, weight, attack, defense, hp, isXXL]);',
  '  }, [selectedRecord, height, weight, attack, defense, hp, isXXL, showShowcaseShiny]);',
  "Showcase dependencies"
);

const xxlButtonEnd = `              >
                {isXXL ? "XXL Confirmed" : "Mark as XXL"}
              </button>`;
replaceOnce(
  xxlButtonEnd,
  `${xxlButtonEnd}
              <button
                type="button"
                aria-pressed={showShowcaseShiny}
                onClick={() => setShowShowcaseShiny((current) => !current)}
                className={
                  "rounded-xl border px-4 py-2 text-sm font-black transition " +
                  (showShowcaseShiny
                    ? "border-yellow-300 bg-yellow-400/20 text-yellow-200"
                    : "border-zinc-700 bg-zinc-950 text-zinc-400 hover:border-yellow-600")
                }
              >
                {showShowcaseShiny ? "✨ Shiny" : "☆ Normal"}
              </button>`,
  "XXL button"
);

replaceOnce(
  '<ShowcaseScoreRow label="XXL Bonus" value={projectedShowcase.xxlBonus} maximum={178} />',
  `<ShowcaseScoreRow label="XXL Bonus" value={projectedShowcase.xxlBonus} maximum={178} />
                  <div className="rounded-2xl border border-zinc-800 bg-black/20 p-4 text-xs text-zinc-500">
                    Exact scoring ceilings: {Number(projectedShowcase.maximumHeight).toFixed(2)} m height • {Number(projectedShowcase.maximumWeight).toFixed(2)} kg weight
                  </div>`,
  "XXL score row"
);

await fs.writeFile(backupPath, original, "utf8");
await fs.writeFile(pagePath, source, "utf8");
console.log("Patched Showcase exact Game Master bounds and Shiny artwork toggle.");
console.log("Backup:", backupPath);