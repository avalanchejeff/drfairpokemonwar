import fs from "node:fs/promises";

const pagePath = "./app/lab/page.tsx";
const backupPath = "./app/lab/page.tsx.before-projected-showcase";
let source = await fs.readFile(pagePath, "utf8");
const original = source;

function replaceOnce(search, replacement, label) {
  if (!source.includes(search)) {
    throw new Error(`Could not find ${label}. No changes were written.`);
  }
  source = source.replace(search, replacement);
}

replaceOnce(
  'import raidLabSummaryData from "../data/raidLabSummary2026.json";',
  'import raidLabSummaryData from "../data/raidLabSummary2026.json";\nimport sizeReferenceData from "../data/pokemonSizeReference.json";\nimport artworkIndexHD from "../data/artworkIndexHD.json";',
  "Raid summary import"
);

replaceOnce(
  'type MoveRecord = {',
  `type SizeReference = {
  pokemonId: string;
  form: string;
  templateId: string;
  averageHeightM: number;
  averageWeightKg: number;
  heightStdDev: number;
  weightStdDev: number;
};

type MoveRecord = {`,
  "MoveRecord type"
);

replaceOnce(
  'const movePools = Object.values(movePoolsData) as MovePool[];',
  'const movePools = Object.values(movePoolsData) as MovePool[];\nconst sizeReferences = sizeReferenceData as Record<string, SizeReference>;',
  "move-pool constant"
);

replaceOnce(
  '  const [maxType, setMaxType] = useState("Standard");',
  '  const [maxType, setMaxType] = useState("Standard");\n  const [isXXL, setIsXXL] = useState(false);',
  "Max state"
);

const showcaseCalculation = `  const projectedShowcase = useMemo(() => {
    if (!selectedRecord) return null;

    if (
      selectedRecord.pokemonId === "PUMPKABOO" ||
      selectedRecord.pokemonId === "GOURGEIST"
    ) {
      return { customPending: true };
    }

    const exactKey =
      selectedRecord.pokemonId + ":" + (selectedRecord.form ?? "NORMAL");
    const normalKey = selectedRecord.pokemonId + ":NORMAL";
    const reference = sizeReferences[exactKey] ?? sizeReferences[normalKey];
    if (!reference) return null;

    const measuredHeight = Number(height);
    const measuredWeight = Number(weight);
    if (
      !Number.isFinite(measuredHeight) ||
      measuredHeight <= 0 ||
      !Number.isFinite(measuredWeight) ||
      measuredWeight <= 0
    ) {
      return { customPending: false, reference, incomplete: true };
    }

    const maximumHeight = reference.averageHeightM * 1.75;
    const maximumWeight = reference.averageWeightKg * 2.25;
    const heightPoints = Math.max(
      0,
      Math.min(800, (measuredHeight / maximumHeight) * 800)
    );
    const weightPoints = Math.max(
      0,
      Math.min(150, (measuredWeight / maximumWeight) * 150)
    );
    const ivPoints = Math.max(
      0,
      Math.min(
        50,
        ((Number(attack) + Number(defense) + Number(hp)) / 45) * 50
      )
    );
    const xxlBonus = isXXL ? 178 : 0;
    const total = Math.min(1178, heightPoints + weightPoints + ivPoints + xxlBonus);
    const percentPerfect = (total / 1178) * 100;

    const baseArtworkKey = selectedRecord.name.endsWith("-shadow")
      ? selectedRecord.name.replace(/-shadow$/, "")
      : selectedRecord.name;
    const artworkUrl =
      artworkIndexHD[selectedRecord.name as keyof typeof artworkIndexHD] ??
      artworkIndexHD[baseArtworkKey as keyof typeof artworkIndexHD] ??
      null;

    return {
      customPending: false,
      incomplete: false,
      reference,
      heightPoints,
      weightPoints,
      ivPoints,
      xxlBonus,
      total,
      percentPerfect,
      artworkUrl,
      visualScale: Math.max(38, percentPerfect),
    };
  }, [selectedRecord, height, weight, attack, defense, hp, isXXL]);

`;

replaceOnce(
  '  const maxBattleMeta = useMemo(() => {',
  showcaseCalculation + '  const maxBattleMeta = useMemo(() => {',
  "Max Battle calculation"
);

const oldSection = `          <section className="mt-6 rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-lime-400">
              Size &amp; Showcase Value
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-black/20 p-5">
                <div className="text-sm text-zinc-400">Size Percentile</div>
                <div className="mt-2 text-3xl font-black">Pending</div>
              </div>
              <div className="rounded-2xl bg-black/20 p-5">
                <div className="text-sm text-zinc-400">
                  Showcase Potential
                </div>
                <div className="mt-2 text-3xl font-black">Pending</div>
              </div>
            </div>
          </section>`;

const newSection = `          <section className="mt-6 rounded-3xl border border-lime-900/60 bg-zinc-900/60 p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-lime-400">
                Size &amp; Showcase Value
              </p>
              <button
                type="button"
                aria-pressed={isXXL}
                onClick={() => setIsXXL((current) => !current)}
                className={
                  "rounded-xl border px-4 py-2 text-sm font-black transition " +
                  (isXXL
                    ? "border-lime-300 bg-lime-400/20 text-lime-200"
                    : "border-zinc-700 bg-zinc-950 text-zinc-400 hover:border-lime-600")
                }
              >
                {isXXL ? "XXL Confirmed" : "Mark as XXL"}
              </button>
            </div>

            {projectedShowcase?.customPending ? (
              <div className="mt-5 rounded-2xl border border-amber-800 bg-amber-950/20 p-5 text-amber-200">
                Custom Showcase scoring for Pumpkaboo and Gourgeist is pending. No projected score is shown.
              </div>
            ) : projectedShowcase?.incomplete ? (
              <div className="mt-5 rounded-2xl border border-zinc-800 bg-black/20 p-5 text-zinc-400">
                Enter both height and weight to project the Showcase score.
              </div>
            ) : projectedShowcase && "total" in projectedShowcase ? (
              <div className="mt-5 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="relative aspect-square min-h-[360px] overflow-hidden rounded-2xl border border-lime-900/50 bg-gradient-to-b from-zinc-950 to-black">
                  {[100, 90, 80, 70, 60, 50].map((ring) => (
                    <div
                      key={ring}
                      className="absolute bottom-[6%] left-1/2 -translate-x-1/2 rounded-t-full border border-dashed border-lime-400/35"
                      style={{ width: ring + "%", height: ring + "%" }}
                    >
                      <span className="absolute left-1/2 top-1 -translate-x-1/2 rounded bg-black/75 px-2 py-0.5 text-[10px] font-black text-lime-300">
                        {ring}%
                      </span>
                    </div>
                  ))}

                  {projectedShowcase.artworkUrl ? (
                    <img
                      src={projectedShowcase.artworkUrl}
                      alt={selectedRecord?.displayName ?? "Selected PokÃŠmon"}
                      className="absolute bottom-[4%] left-1/2 z-10 -translate-x-1/2 object-contain transition-all duration-300"
                      style={{
                        width: projectedShowcase.visualScale + "%",
                        height: projectedShowcase.visualScale + "%",
                      }}
                    />
                  ) : null}

                  <div className="absolute bottom-2 left-1/2 z-20 w-[88%] -translate-x-1/2 rounded-xl border border-lime-800 bg-black/85 px-4 py-3 text-center">
                    <div className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                      Percent of Perfect Showcase Score
                    </div>
                    <div className="mt-1 text-3xl font-black text-lime-300">
                      {projectedShowcase.percentPerfect.toFixed(1)}%
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-lime-900/60 bg-lime-950/10 p-5 text-center">
                    <div className="text-sm font-bold text-zinc-400">Projected Showcase Score</div>
                    <div className="mt-2 text-4xl font-black text-lime-300">
                      {projectedShowcase.total.toFixed(1)}
                    </div>
                    <div className="text-sm text-zinc-500">out of 1,178</div>
                  </div>
                  <ShowcaseScoreRow label="Height" value={projectedShowcase.heightPoints} maximum={800} />
                  <ShowcaseScoreRow label="Weight" value={projectedShowcase.weightPoints} maximum={150} />
                  <ShowcaseScoreRow label="IVs" value={projectedShowcase.ivPoints} maximum={50} />
                  <ShowcaseScoreRow label="XXL Bonus" value={projectedShowcase.xxlBonus} maximum={178} />
                  <p className="text-xs leading-5 text-zinc-500">
                    Community-model projection. Rounded in-game measurements can shift the live score by a few points.
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-5 text-sm text-zinc-500">
                No Showcase reference is available for this form.
              </p>
            )}
          </section>`;

replaceOnce(oldSection, newSection, "Size and Showcase placeholder");

replaceOnce(
  'function AssessmentTile({',
  `function ShowcaseScoreRow({
  label,
  value,
  maximum,
}: {
  label: string;
  value: number;
  maximum: number;
}) {
  const percent = Math.max(0, Math.min(100, (value / maximum) * 100));
  return (
    <div className="rounded-2xl border border-zinc-800 bg-black/20 p-4">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-bold text-zinc-400">{label}</span>
        <span className="font-black text-lime-200">
          {value.toFixed(1)} / {maximum}
        </span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-lime-400"
          style={{ width: percent + "%" }}
        />
      </div>
    </div>
  );
}

function AssessmentTile({`,
  "AssessmentTile component"
);

await fs.writeFile(backupPath, original, "utf8");
await fs.writeFile(pagePath, source, "utf8");

console.log("Connected Projected Showcase Score to the Lab.");
console.log("- 50/60/70/80/90/100 percent-of-perfect rings");
console.log("- Continuous artwork scaling");
console.log("- Height, weight, IV, and XXL score breakdown");
console.log("- Pumpkaboo/Gourgeist safely excluded pending custom scoring");
console.log("Backup:", backupPath);