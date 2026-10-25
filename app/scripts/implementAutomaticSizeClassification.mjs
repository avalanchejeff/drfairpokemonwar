import fs from "node:fs/promises";

const pagePath = "./app/lab/page.tsx";
const backupPath = "./app/lab/page.tsx.before-automatic-size-classification";
let source = await fs.readFile(pagePath, "utf8");
const original = source;

function replaceOnce(search, replacement, label) {
  if (!source.includes(search)) {
    throw new Error(`Could not find ${label}. No changes were written.`);
  }
  source = source.replace(search, replacement);
}

// Ensure the size-reference type exposes all Game Master boundaries.
if (!source.includes("  xxsLowerBound: number | null;")) {
  replaceOnce(
    "  weightStdDev: number;\n",
    `  weightStdDev: number;
  xxsLowerBound: number | null;
  xsLowerBound: number | null;
  mLowerBound: number | null;
  mUpperBound: number | null;
  xlUpperBound: number | null;
`,
    "SizeReference boundary fields"
  );
}

// Remove manual XXL state.
replaceOnce(
  '  const [isXXL, setIsXXL] = useState(false);\n',
  "",
  "manual XXL state"
);

// Replace manual XXL bonus with automatic Game Master classification.
replaceOnce(
  `    const xxlBonus = isXXL ? 178 : 0;
    const total = Math.min(1178, heightPoints + weightPoints + ivPoints + xxlBonus);`,
  `    const boundaries = {
      xxsLowerBound: reference.xxsLowerBound,
      xsLowerBound: reference.xsLowerBound,
      mLowerBound: reference.mLowerBound,
      mUpperBound: reference.mUpperBound,
      xlUpperBound: reference.xlUpperBound,
    };

    const hasAllBoundaries = Object.values(boundaries).every(
      (value) => typeof value === "number" && Number.isFinite(value)
    );
    if (!hasAllBoundaries) {
      return { customPending: false, reference, incomplete: true };
    }

    const xxsLowerBound = Number(boundaries.xxsLowerBound);
    const xsLowerBound = Number(boundaries.xsLowerBound);
    const mLowerBound = Number(boundaries.mLowerBound);
    const mUpperBound = Number(boundaries.mUpperBound);
    const xlUpperBound = Number(boundaries.xlUpperBound);

    const sizeClass =
      measuredHeight < xxsLowerBound
        ? "XXS"
        : measuredHeight < xsLowerBound
          ? "XS"
          : measuredHeight < mLowerBound
            ? "Small"
            : measuredHeight <= mUpperBound
              ? "Average"
              : measuredHeight <= xlUpperBound
                ? "XL"
                : "XXL";

    const isAutomaticallyXXL = sizeClass === "XXL";
    const xxlBonus = isAutomaticallyXXL ? 178 : 0;
    const total = Math.min(1178, heightPoints + weightPoints + ivPoints + xxlBonus);`,
  "manual XXL scoring"
);

replaceOnce(
  `      xxlBonus,
      total,`,
  `      xxlBonus,
      sizeClass,
      isAutomaticallyXXL,
      total,`,
  "Showcase result size class"
);

replaceOnce(
  '  }, [selectedRecord, height, weight, attack, defense, hp, isXXL, showShowcaseShiny]);',
  '  }, [selectedRecord, height, weight, attack, defense, hp, showShowcaseShiny]);',
  "Showcase dependencies"
);

// Remove the manual XXL button from the Showcase controls.
const manualButton = `              <button
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
`;
replaceOnce(manualButton, "", "manual XXL button");

// Show the automatic classification visibly above the component breakdown.
replaceOnce(
  `                  <ShowcaseScoreRow label="Height" value={projectedShowcase.heightPoints ?? 0} maximum={800} />`,
  `                  <div className="rounded-2xl border border-cyan-900/60 bg-cyan-950/10 p-5 text-center">
                    <div className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                      Automatic Size Class
                    </div>
                    <div className="mt-2 text-3xl font-black text-cyan-300">
                      {projectedShowcase.sizeClass ?? "Unknown"}
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
                      Classified from the selected form&apos;s Game Master height boundaries
                    </div>
                  </div>
                  <ShowcaseScoreRow label="Height" value={projectedShowcase.heightPoints ?? 0} maximum={800} />`,
  "Showcase Height score row"
);

await fs.writeFile(backupPath, original, "utf8");
await fs.writeFile(pagePath, source, "utf8");

console.log("Implemented automatic size classification.");
console.log("- Removed manual XXL state and button");
console.log("- Size class now comes from exact Game Master height boundaries");
console.log("- XXL bonus is automatically 178 only when classified XXL");
console.log("- Showcase base formula was otherwise left unchanged");
console.log("Backup:", backupPath);