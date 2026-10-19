"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type MoveOption = {
  id: string;
  name: string;
  legacy?: boolean;
  type?: string | null;
  power?: number;
  energyDelta?: number;
  durationMs?: number;
};

type PerformancePanelProps = {
  displayName: string;
  currentName: string;
formOptions: {
  name: string;
  displayName: string;
}[];
  primaryType: string;
  secondaryType: string | null;
  attack: number;
  defense: number;
  stamina: number;
  overallRank: number;
  allPsvScores: number[];
  psv: number;
  dps: number;
  dbd: number;
  charge: number;
  bestFastMove: string | number | null;
  bestChargedMove: string | number | null;
  fastMoves?: MoveOption[];
  chargedMoves?: MoveOption[];
};

function clamp(
  value: number,
  minimum = 0,
  maximum = 100
) {
  return Math.min(maximum, Math.max(minimum, value));
}

function clampIV(value: number) {
  if (Number.isNaN(value)) return 0;
  return clamp(value, 0, 15);
}

function normalizeType(type?: string | null) {
  return String(type ?? "")
    .replace("POKEMON_TYPE_", "")
    .toUpperCase();
}

function hasStab(
  move: MoveOption,
  primaryType: string,
  secondaryType: string | null
) {
  const moveType = normalizeType(move.type);

  return (
    moveType === normalizeType(primaryType) ||
    moveType === normalizeType(secondaryType)
  );
}

function moveDamage(
  move: MoveOption,
  adjustedAttack: number,
  primaryType: string,
  secondaryType: string | null
) {
  const power = move.power ?? 0;
  const stab = hasStab(
    move,
    primaryType,
    secondaryType
  )
    ? 1.2
    : 1;

  return (
    Math.floor(
      0.5 *
        power *
        (adjustedAttack / 200) *
        stab
    ) + 1
  );
}

function durationSeconds(move: MoveOption) {
  return Math.max(
    (move.durationMs ?? 1000) / 1000,
    0.5
  );
}

function movesetDps(
  fastMove: MoveOption | undefined,
  chargedMove: MoveOption | undefined,
  adjustedAttack: number,
  primaryType: string,
  secondaryType: string | null
) {
  if (!fastMove || !chargedMove) return 0;

  const energyGain = Math.max(
    Math.abs(fastMove.energyDelta ?? 1),
    1
  );

  const energyCost = Math.max(
    Math.abs(chargedMove.energyDelta ?? 50),
    1
  );

  const fastMovesNeeded = Math.ceil(
    energyCost / energyGain
  );

  const totalDamage =
    fastMovesNeeded *
      moveDamage(
        fastMove,
        adjustedAttack,
        primaryType,
        secondaryType
      ) +
    moveDamage(
      chargedMove,
      adjustedAttack,
      primaryType,
      secondaryType
    );

  const totalTime =
    fastMovesNeeded * durationSeconds(fastMove) +
    durationSeconds(chargedMove);

  return totalTime > 0
    ? totalDamage / totalTime
    : 0;
}

function chargedDamageRate(
  move: MoveOption | undefined,
  adjustedAttack: number,
  primaryType: string,
  secondaryType: string | null
) {
  if (!move) return 0;

  return (
    moveDamage(
      move,
      adjustedAttack,
      primaryType,
      secondaryType
    ) / durationSeconds(move)
  );
}

export default function PerformancePanel({
    displayName,
    currentName,
    formOptions,
  primaryType,
  secondaryType,
  attack,
  defense,
  stamina,
  overallRank,
  allPsvScores,
  psv,
  dps,
  dbd,
  charge,
  bestFastMove,
  bestChargedMove,
  fastMoves = [],
  chargedMoves = [],
}: PerformancePanelProps) {
    const router = useRouter();
  const defaultFastMove = String(
    bestFastMove ?? ""
  );

  const defaultChargedMove = String(
    bestChargedMove ?? ""
  );

  const [attackIV, setAttackIV] = useState(15);
  const [defenseIV, setDefenseIV] = useState(15);
  const [hpIV, setHpIV] = useState(15);

  const [fastMove, setFastMove] =
    useState(defaultFastMove);

  const [chargedMove1, setChargedMove1] =
    useState(defaultChargedMove);

  const [chargedMove2, setChargedMove2] =
    useState("");

  const [legacyEnabled, setLegacyEnabled] =
    useState(true);

  const availableFastMoves = useMemo(
    () =>
      fastMoves.filter(
        (move) => legacyEnabled || !move.legacy
      ),
    [fastMoves, legacyEnabled]
  );

  const availableChargedMoves = useMemo(
    () =>
      chargedMoves.filter(
        (move) => legacyEnabled || !move.legacy
      ),
    [chargedMoves, legacyEnabled]
  );

  useEffect(() => {
    if (
      !availableFastMoves.some(
        (move) => move.id === fastMove
      )
    ) {
      setFastMove(
        availableFastMoves[0]?.id ?? ""
      );
    }

    if (
      !availableChargedMoves.some(
        (move) => move.id === chargedMove1
      )
    ) {
      setChargedMove1(
        availableChargedMoves[0]?.id ?? ""
      );
    }

    if (
      chargedMove2 &&
      !availableChargedMoves.some(
        (move) => move.id === chargedMove2
      )
    ) {
      setChargedMove2("");
    }
  }, [
    availableFastMoves,
    availableChargedMoves,
    fastMove,
    chargedMove1,
    chargedMove2,
  ]);

  const selectedFastMove = fastMoves.find(
    (move) => move.id === fastMove
  );

  const selectedChargedMove1 =
    chargedMoves.find(
      (move) => move.id === chargedMove1
    );

  const selectedChargedMove2 =
    chargedMoves.find(
      (move) => move.id === chargedMove2
    );

  const bestFastMoveRecord = fastMoves.find(
    (move) => move.id === defaultFastMove
  );

  const bestChargedMoveRecord =
    chargedMoves.find(
      (move) => move.id === defaultChargedMove
    );

  const adjustedScores = useMemo(() => {
    const adjustedAttack = attack + attackIV;
    const adjustedDefense = defense + defenseIV;
    const adjustedStamina = stamina + hpIV;

    const baselineAttack = attack + 15;
    const baselineDefense = defense + 15;
    const baselineStamina = stamina + 15;

    const chargedCandidates = [
      selectedChargedMove1,
      selectedChargedMove2,
    ].filter(Boolean) as MoveOption[];

    const strongestSelectedCharged =
      chargedCandidates.sort(
        (first, second) =>
          chargedDamageRate(
            second,
            adjustedAttack,
            primaryType,
            secondaryType
          ) -
          chargedDamageRate(
            first,
            adjustedAttack,
            primaryType,
            secondaryType
          )
      )[0];

    const currentRawDps = movesetDps(
      selectedFastMove,
      strongestSelectedCharged,
      adjustedAttack,
      primaryType,
      secondaryType
    );

    const baselineRawDps = movesetDps(
      bestFastMoveRecord,
      bestChargedMoveRecord,
      baselineAttack,
      primaryType,
      secondaryType
    );

    const currentChargeRate =
      chargedDamageRate(
        strongestSelectedCharged,
        adjustedAttack,
        primaryType,
        secondaryType
      );

    const baselineChargeRate =
      chargedDamageRate(
        bestChargedMoveRecord,
        baselineAttack,
        primaryType,
        secondaryType
      );

    const currentBulk =
    adjustedDefense * adjustedStamina;
  
  const baselineBulk =
    baselineDefense * baselineStamina;
  
  const currentDbd =
    currentRawDps * currentBulk;
  
  const baselineDbd =
    baselineRawDps * baselineBulk;
  
    const dpsRatio =
  baselineRawDps > 0
    ? currentRawDps / baselineRawDps
    : 1;

  const dbdRatio =
    baselineDbd > 0
      ? currentDbd / baselineDbd
      : 1;

    const chargeRatio =
      baselineChargeRate > 0
        ? currentChargeRate /
          baselineChargeRate
        : 1;

    const bulkRatio =
      baselineBulk > 0
        ? currentBulk / baselineBulk
        : 1;

    const adjustedDps = clamp(
      dps * dpsRatio
    );

    const adjustedDbd = clamp(
        dbd * dbdRatio
      );

    const adjustedCharge = clamp(
      charge * chargeRatio
    );

    const adjustedPsv =
  adjustedDbd * 0.67 +
  adjustedDps * 0.21 +
  adjustedCharge * 0.12;

  return {
    dps: Number(adjustedDps.toFixed(2)),
    dbd: Number(adjustedDbd.toFixed(2)),
    charge: Number(adjustedCharge.toFixed(2)),
    psv: Number(adjustedPsv.toFixed(2)),
  };
  }, [
    attack,
    defense,
    stamina,
    attackIV,
    defenseIV,
    hpIV,
    dps,
    dbd,
    charge,
    primaryType,
    secondaryType,
    selectedFastMove,
    selectedChargedMove1,
    selectedChargedMove2,
    bestFastMoveRecord,
    bestChargedMoveRecord,
  ]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("pokemon-build-change", {
        detail: {
          currentName,
          attackIV,
          defenseIV,
          hpIV,
          fastMove,
          chargedMove1,
          chargedMove2,
          legacyEnabled,
          adjustedDbd: adjustedScores.dbd,
          baselineDbd: dbd,
        },
      })
    );
  }, [
    currentName,
    attackIV,
    defenseIV,
    hpIV,
    fastMove,
    chargedMove1,
    chargedMove2,
    legacyEnabled,
    adjustedScores.dbd,
    dbd,
  ]);

  const adjustedOverallRank = useMemo(() => {
    return (
      allPsvScores.filter(
        (score) => score > adjustedScores.psv
      ).length + 1
    );
  }, [allPsvScores, adjustedScores.psv]);

  const isBestBuild =
    attackIV === 15 &&
    defenseIV === 15 &&
    hpIV === 15 &&
    fastMove === defaultFastMove &&
    chargedMove1 === defaultChargedMove &&
    chargedMove2 === "" &&
    legacyEnabled;

  function resetToBestBuild() {
    setAttackIV(15);
    setDefenseIV(15);
    setHpIV(15);
    setFastMove(defaultFastMove);
    setChargedMove1(defaultChargedMove);
    setChargedMove2("");
    setLegacyEnabled(true);
  }

  return (
    <div className="rounded-2xl border border-zinc-700 bg-zinc-900 p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="text-3xl font-bold">
          Performance
        </h2>

        <span
          className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
            isBestBuild
              ? "bg-green-900/50 text-green-300"
              : "bg-orange-900/50 text-orange-300"
          }`}
        >
          {isBestBuild
            ? "Optimal Build"
            : "Custom Build"}
        </span>
      </div>

      <div className="mb-5 rounded-xl border border-cyan-500 bg-cyan-950/40 p-5">
        <div className="flex items-end justify-between gap-5">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-cyan-300">
              Pokémon Specific Value
            </p>

            <p className="mt-1 text-5xl font-black">
              {adjustedScores.psv}
            </p>

            <p className="mt-2 text-xs text-zinc-400">
              Best-build PSV: {psv}
            </p>
          </div>

          <div className="text-right">
            <p className="text-sm text-zinc-400">
              Overall Rank
            </p>

            <p className="text-3xl font-black text-yellow-400">
              #{adjustedOverallRank}
            </p>

            {adjustedOverallRank !==
              overallRank && (
              <p className="mt-1 text-xs text-zinc-400">
                Official best-build rank: #
                {overallRank}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <ScoreBox
          label="DPS Score"
          value={adjustedScores.dps}
          color="text-red-400"
        />

<ScoreBox
  label="DBD Score"
  value={adjustedScores.dbd}
  color="text-green-400"
/>

        <ScoreBox
          label="Charge Score"
          value={adjustedScores.charge}
          color="text-purple-400"
        />
      </div>

      <div className="border-t border-zinc-700 pt-5">
        <h3 className="mb-1 text-xl font-bold">
          Your Build
        </h3>

        <p className="mb-4 text-sm text-zinc-400">
          Adjust the IVs and moves for{" "}
          {displayName}.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
        <label>
  <span className="mb-2 block text-sm font-bold text-zinc-300">
    Form
  </span>

  <select
    value={currentName}
    onChange={(event) =>
      router.push(`/pokemon/${event.target.value}`)
    }
    className="w-full rounded-lg border border-zinc-600 bg-zinc-800 p-3"
  >
    {formOptions.map((form) => (
      <option
        key={form.name}
        value={form.name}
      >
        {form.displayName}
      </option>
    ))}
  </select>
</label>

          <IVInput
            label="Attack IV"
            value={attackIV}
            onChange={setAttackIV}
          />

          <IVInput
            label="Defense IV"
            value={defenseIV}
            onChange={setDefenseIV}
          />

          <IVInput
            label="HP IV"
            value={hpIV}
            onChange={setHpIV}
          />

          <MoveSelect
            label="Fast Move"
            value={fastMove}
            onChange={setFastMove}
            moves={availableFastMoves}
          />

          <MoveSelect
            label="Charged Move 1"
            value={chargedMove1}
            onChange={setChargedMove1}
            moves={availableChargedMoves}
          />

          <MoveSelect
            label="Charged Move 2"
            value={chargedMove2}
            onChange={setChargedMove2}
            moves={availableChargedMoves}
            allowEmpty
          />
        </div>

        <div className="mt-5 flex items-center justify-between rounded-xl border border-zinc-700 bg-zinc-800 p-4">
          <div>
            <p className="font-bold">
              Legacy Moves
            </p>

            <p className="text-sm text-zinc-400">
              Include Elite TM and legacy moves
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setLegacyEnabled(
                (current) => !current
              )
            }
            className={`relative h-7 w-14 rounded-full transition ${
              legacyEnabled
                ? "bg-cyan-500"
                : "bg-zinc-600"
            }`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
                legacyEnabled
                  ? "left-8"
                  : "left-1"
              }`}
            />
          </button>
        </div>

        <button
          type="button"
          onClick={resetToBestBuild}
          className="mt-5 w-full rounded-xl bg-cyan-600 px-5 py-3 font-bold text-white transition hover:bg-cyan-500"
        >
          Reset to Best Build
        </button>
      </div>
    </div>
  );
}

function ScoreBox({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-xl bg-zinc-800 p-4">
      <p className="text-sm text-zinc-400">
        {label}
      </p>

      <p
        className={`mt-1 text-3xl font-black ${color}`}
      >
        {value}
      </p>
    </div>
  );
}

function IVInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label>
      <span className="mb-2 block text-sm font-bold text-zinc-300">
        {label}
      </span>

      <input
        type="number"
        min={0}
        max={15}
        value={value}
        onChange={(event) =>
          onChange(
            clampIV(
              Number(event.target.value)
            )
          )
        }
        className="w-full rounded-lg border border-zinc-600 bg-zinc-800 p-3"
      />
    </label>
  );
}

function MoveSelect({
  label,
  value,
  onChange,
  moves,
  allowEmpty = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  moves: MoveOption[];
  allowEmpty?: boolean;
}) {
  return (
    <label>
      <span className="mb-2 block text-sm font-bold text-zinc-300">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-lg border border-zinc-600 bg-zinc-800 p-3"
      >
        {allowEmpty && (
          <option value="">
            None selected
          </option>
        )}

        {moves.map((move) => (
          <option
            key={move.id}
            value={move.id}
          >
            {move.name}
            {move.legacy
              ? " (Legacy)"
              : ""}
          </option>
        ))}
      </select>
    </label>
  );
}