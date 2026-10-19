import cpMultiplierData from "../data/cpMultipliers.json";

export type LeagueKey = "great" | "ultra" | "master";

export type IvSpread = {
  atkIV: number;
  defIV: number;
  hpIV: number;
};

export type PvpIvResult = IvSpread & {
  attack: number;
  defense: number;
  hp: number;
  statProduct: number;
  cp: number;
  level: number;
  rank: number;
  statProductPercent: number;
  topPercent: number;
};

export type RankedLeagueResult = {
  league: LeagueKey;
  cpCap: number | null;
  count: number;
  best: PvpIvResult;
  current: PvpIvResult;
  quality: "Elite" | "Excellent" | "Good" | "Viable" | "Niche";
};

type LevelEntry = {
  level: number;
  cpm: number;
};

const levels = (cpMultiplierData.levels as LevelEntry[]).filter(
  (entry) => entry.level <= 50
);

const leagueCaps: Record<LeagueKey, number | null> = {
  great: 1500,
  ultra: 2500,
  master: null,
};

function clampIv(value: number) {
  return Math.max(0, Math.min(15, Math.round(value)));
}

export function calculateCp(
  baseAttack: number,
  baseDefense: number,
  baseStamina: number,
  atkIV: number,
  defIV: number,
  hpIV: number,
  cpm: number
) {
  return Math.max(
    10,
    Math.floor(
      ((baseAttack + atkIV) *
        Math.sqrt(baseDefense + defIV) *
        Math.sqrt(baseStamina + hpIV) *
        cpm *
        cpm) /
        10
    )
  );
}

function resultAtLevel(
  baseAttack: number,
  baseDefense: number,
  baseStamina: number,
  atkIV: number,
  defIV: number,
  hpIV: number,
  entry: LevelEntry
) {
  const attack = (baseAttack + atkIV) * entry.cpm;
  const defense = (baseDefense + defIV) * entry.cpm;
  const hp = Math.max(10, Math.floor((baseStamina + hpIV) * entry.cpm));

  return {
    attack,
    defense,
    hp,
    statProduct: attack * defense * hp,
    cp: calculateCp(
      baseAttack,
      baseDefense,
      baseStamina,
      atkIV,
      defIV,
      hpIV,
      entry.cpm
    ),
    level: entry.level,
  };
}

function bestForLeague(
  baseAttack: number,
  baseDefense: number,
  baseStamina: number,
  atkIV: number,
  defIV: number,
  hpIV: number,
  cpCap: number | null
) {
  let best = null;

  for (const entry of levels) {
    const result = resultAtLevel(
      baseAttack,
      baseDefense,
      baseStamina,
      atkIV,
      defIV,
      hpIV,
      entry
    );

    if (cpCap === null || result.cp <= cpCap) {
      best = result;
    }
  }

  return best;
}

function qualityFromTopPercent(topPercent: number): RankedLeagueResult["quality"] {
  if (topPercent <= 1) return "Elite";
  if (topPercent <= 5) return "Excellent";
  if (topPercent <= 10) return "Good";
  if (topPercent <= 25) return "Viable";
  return "Niche";
}

export function rankPvpIvs({
  baseAttack,
  baseDefense,
  baseStamina,
  league,
  currentIVs,
}: {
  baseAttack: number;
  baseDefense: number;
  baseStamina: number;
  league: LeagueKey;
  currentIVs: IvSpread;
}): RankedLeagueResult | null {
  const cpCap = leagueCaps[league];
  const rows: Omit<PvpIvResult, "rank" | "statProductPercent" | "topPercent">[] = [];

  for (let atkIV = 0; atkIV <= 15; atkIV++) {
    for (let defIV = 0; defIV <= 15; defIV++) {
      for (let hpIV = 0; hpIV <= 15; hpIV++) {
        const result = bestForLeague(
          baseAttack,
          baseDefense,
          baseStamina,
          atkIV,
          defIV,
          hpIV,
          cpCap
        );

        if (!result) continue;
        rows.push({ atkIV, defIV, hpIV, ...result });
      }
    }
  }

  rows.sort(
    (a, b) =>
      b.statProduct - a.statProduct ||
      b.attack - a.attack ||
      b.hp - a.hp ||
      b.cp - a.cp ||
      b.hpIV - a.hpIV
  );

  const bestProduct = rows[0]?.statProduct;
  if (!bestProduct) return null;

  const ranked = rows.map((row, index) => ({
    ...row,
    rank: index + 1,
    statProductPercent: (row.statProduct / bestProduct) * 100,
    topPercent: ((index + 1) / rows.length) * 100,
  }));

  const atkIV = clampIv(currentIVs.atkIV);
  const defIV = clampIv(currentIVs.defIV);
  const hpIV = clampIv(currentIVs.hpIV);

  const current = ranked.find(
    (row) =>
      row.atkIV === atkIV && row.defIV === defIV && row.hpIV === hpIV
  );

  if (!current) return null;

  return {
    league,
    cpCap,
    count: ranked.length,
    best: ranked[0],
    current,
    quality: qualityFromTopPercent(current.topPercent),
  };
}

export function detectLevelFromCp({
  baseAttack,
  baseDefense,
  baseStamina,
  currentIVs,
  cp,
}: {
  baseAttack: number;
  baseDefense: number;
  baseStamina: number;
  currentIVs: IvSpread;
  cp: number;
}) {
  if (!Number.isFinite(cp) || cp < 10) return [];

  const atkIV = clampIv(currentIVs.atkIV);
  const defIV = clampIv(currentIVs.defIV);
  const hpIV = clampIv(currentIVs.hpIV);

  return levels
    .filter(
      (entry) =>
        calculateCp(
          baseAttack,
          baseDefense,
          baseStamina,
          atkIV,
          defIV,
          hpIV,
          entry.cpm
        ) === cp
    )
    .map((entry) => entry.level);
}
