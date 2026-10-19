import fs from "node:fs/promises";

const file = "./app/components/PvpAnalysisPanel.tsx";
let source = await fs.readFile(file, "utf8");
await fs.writeFile(`${file}.before-master-iv-rank`, source, "utf8");

if (source.includes("function rankMasterIvSpreads(")) {
  console.log("Master League IV Rank is already installed.");
  process.exit(0);
}

const rankLeagueAnchor = `function pvpokeIdCandidates(currentName: string, pokemonId: string, form: string) {`;
const masterFunction = `function rankMasterIvSpreads(
  baseAttack: number,
  baseDefense: number,
  baseStamina: number,
  current: IVs,
  level = 50
) {
  const levelEntry = levelTable.find((entry) => entry.level === level);
  if (!levelEntry) {
    return { count: 0, top5: [] as IvRow[], current: null as IvRow | null };
  }

  const provisional = [] as Array<
    Omit<IvRow, "rank" | "statProductPercent" | "topPercent">
  >;

  for (let atkIV = 0; atkIV <= 15; atkIV++) {
    for (let defIV = 0; defIV <= 15; defIV++) {
      for (let hpIV = 0; hpIV <= 15; hpIV++) {
        const ivs = { atkIV, defIV, hpIV };
        const attackStat = (baseAttack + atkIV) * levelEntry.cpm;
        const defenseStat = (baseDefense + defIV) * levelEntry.cpm;
        const hp = Math.max(
          10,
          Math.floor((baseStamina + hpIV) * levelEntry.cpm)
        );

        provisional.push({
          ...ivs,
          attack: attackStat,
          defense: defenseStat,
          hp,
          statProduct: attackStat * defenseStat * hp,
          cp: calculateCp(
            baseAttack,
            baseDefense,
            baseStamina,
            ivs,
            levelEntry.cpm
          ),
          level,
        });
      }
    }
  }

  provisional.sort(
    (a, b) =>
      b.statProduct - a.statProduct ||
      b.attack - a.attack ||
      b.hp - a.hp ||
      b.cp - a.cp ||
      b.hpIV - a.hpIV
  );

  const bestProduct = provisional[0]?.statProduct ?? 1;
  const rows: IvRow[] = provisional.map((row, index) => ({
    ...row,
    rank: index + 1,
    statProductPercent: (row.statProduct / bestProduct) * 100,
    topPercent: ((index + 1) / provisional.length) * 100,
  }));

  return {
    count: rows.length,
    top5: rows.slice(0, 5),
    current:
      rows.find(
        (row) =>
          row.atkIV === current.atkIV &&
          row.defIV === current.defIV &&
          row.hpIV === current.hpIV
      ) ?? null,
  };
}

`;

if (!source.includes(rankLeagueAnchor)) {
  throw new Error("Could not find the PvPoke ID function anchor.");
}
source = source.replace(rankLeagueAnchor, masterFunction + rankLeagueAnchor);

const ultraMemo = `  const ultra = useMemo(
    () => rankIvSpreads(attack, defense, stamina, 2500, ivs),
    [attack, defense, stamina, ivs]
  );`;
const ultraAndMasterMemo = `${ultraMemo}
  const master = useMemo(
    () => rankMasterIvSpreads(attack, defense, stamina, ivs),
    [attack, defense, stamina, ivs]
  );`;

if (!source.includes(ultraMemo)) {
  throw new Error("Could not find the Ultra League memo.");
}
source = source.replace(ultraMemo, ultraAndMasterMemo);

source = source.replace(
  `<MasterBand meta={masterMeta} ivs={ivs} />`,
  `<MasterBand meta={masterMeta} ivData={master} ivs={ivs} />`
);

const masterStart = source.indexOf("function MasterBand(");
const topFiveStart = source.indexOf("\nfunction TopFive(", masterStart);
if (masterStart < 0 || topFiveStart < 0) {
  throw new Error("Could not locate the existing MasterBand component.");
}

const newMasterBand = `function MasterBand({
  meta,
  ivData,
  ivs,
}: {
  meta: ReturnType<typeof findMeta>;
  ivData: ReturnType<typeof rankMasterIvSpreads>;
  ivs: IVs;
}) {
  const current = ivData.current;

  return (
    <div className="rounded-2xl border border-zinc-700 bg-zinc-950 p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-2xl font-black">Master League</h3>
          <p className="text-sm text-zinc-500">No CP cap · Level 50 comparison</p>
        </div>
        <div className="text-sm text-zinc-400">
          Current IVs: {ivs.atkIV}/{ivs.defIV}/{ivs.hpIV}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <Metric
          label="META RANK"
          value={meta ? \`#\${meta.rank} / \${meta.total}\` : "Not ranked"}
        />
        <Metric
          label="IV RANK"
          value={current ? \`#\${current.rank} / \${ivData.count}\` : "—"}
        />
        <Metric
          label="TOP"
          value={current ? \`\${current.topPercent.toFixed(2)}%\` : "—"}
        />
        <Metric
          label="STAT PRODUCT"
          value={current ? \`\${current.statProductPercent.toFixed(2)}%\` : "—"}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.25fr_.75fr]">
        <TopFive rows={ivData.top5} />

        <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-4">
          <div className="text-xs font-bold tracking-wide text-zinc-500">
            PvPoke RECOMMENDED MOVESET
          </div>
          <div className="mt-3 space-y-2 font-bold">
            {meta?.entry.moveset?.length ? (
              meta.entry.moveset.map((move) => (
                <div key={move}>{formatMove(move)}</div>
              ))
            ) : (
              <div className="text-zinc-500">Unavailable</div>
            )}
          </div>

          {current && (
            <div className="mt-5 border-t border-zinc-700 pt-4 text-sm text-zinc-400">
              Level {current.level} · CP {current.cp}
              <br />
              Rank 1 IVs: 15/15/15
              {ivs.atkIV === 15 ? (
                <span className="mt-2 block font-bold text-green-400">
                  15 Attack IV retained for CMP potential
                </span>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
`;

source = source.slice(0, masterStart) + newMasterBand + source.slice(topFiveStart);

await fs.writeFile(file, source, "utf8");
console.log("Added Master League IV Rank, Top %, Stat Product, and Top 5 spreads.");
console.log(`Backup: ${file}.before-master-iv-rank`);