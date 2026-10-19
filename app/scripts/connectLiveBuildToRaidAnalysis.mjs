import fs from "node:fs/promises";

const performancePath = "./app/components/PerformancePanel.tsx";
const raidPath = "./app/components/RaidAnalysisPanel.tsx";

async function patchPerformancePanel() {
  let source = await fs.readFile(performancePath, "utf8");
  await fs.writeFile(`${performancePath}.before-raid-live-sync`, source, "utf8");

  if (!source.includes('window.dispatchEvent(new CustomEvent("pokemon-build-change"')) {
    const anchor = `  const adjustedOverallRank = useMemo(() => {`;
    const insertion = `  useEffect(() => {
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

`;

    if (!source.includes(anchor)) {
      throw new Error("Could not find adjustedOverallRank in PerformancePanel.tsx");
    }
    source = source.replace(anchor, insertion + anchor);
  }

  await fs.writeFile(performancePath, source, "utf8");
  console.log("Connected PerformancePanel to the live build event.");
}

async function patchRaidPanel() {
  let source = await fs.readFile(raidPath, "utf8");
  await fs.writeFile(`${raidPath}.before-raid-live-sync`, source, "utf8");

  source = source.replace(
    'import { useMemo, useState } from "react";',
    'import { useEffect, useMemo, useState } from "react";'
  );

  const stateAnchor = `  const [selectedType, setSelectedType] = useState<string>("PSYCHIC");`;
  const liveState = `  const [selectedType, setSelectedType] = useState<string>("PSYCHIC");
  const [liveBuild, setLiveBuild] = useState({
    attackIV,
    defenseIV,
    hpIV,
    adjustedDbd: 0,
    baselineDbd: 0,
    fastMove: "",
    chargedMove1: "",
    chargedMove2: "",
    legacyEnabled: true,
  });

  useEffect(() => {
    function handleBuildChange(event: Event) {
      const customEvent = event as CustomEvent<{
        currentName: string;
        attackIV: number;
        defenseIV: number;
        hpIV: number;
        adjustedDbd: number;
        baselineDbd: number;
        fastMove: string;
        chargedMove1: string;
        chargedMove2: string;
        legacyEnabled: boolean;
      }>;

      if (customEvent.detail.currentName !== currentName) return;

      setLiveBuild({
        attackIV: customEvent.detail.attackIV,
        defenseIV: customEvent.detail.defenseIV,
        hpIV: customEvent.detail.hpIV,
        adjustedDbd: customEvent.detail.adjustedDbd,
        baselineDbd: customEvent.detail.baselineDbd,
        fastMove: customEvent.detail.fastMove,
        chargedMove1: customEvent.detail.chargedMove1,
        chargedMove2: customEvent.detail.chargedMove2,
        legacyEnabled: customEvent.detail.legacyEnabled,
      });
    }

    window.addEventListener("pokemon-build-change", handleBuildChange);
    return () =>
      window.removeEventListener("pokemon-build-change", handleBuildChange);
  }, [currentName]);`;

  if (!source.includes("const [liveBuild, setLiveBuild]")) {
    if (!source.includes(stateAnchor)) {
      throw new Error("Could not find selectedType state in RaidAnalysisPanel.tsx");
    }
    source = source.replace(stateAnchor, liveState);
  }

  const oldIvFactor = `  const ivFactor = clamp(
    (attackIV + defenseIV + hpIV) / 45,
    0,
    1
  );`;
  const newIvFactor = `  const liveDbdRatio =
    liveBuild.baselineDbd > 0
      ? liveBuild.adjustedDbd / liveBuild.baselineDbd
      : 1;`;

  if (source.includes(oldIvFactor)) {
    source = source.replace(oldIvFactor, newIvFactor);
  }

  const oldCurrentDbd = `      const currentDbd =
        entry.nundoDbd +
        (entry.dbd - entry.nundoDbd) * ivFactor;`;
  const newCurrentDbd = `      const currentDbd = clamp(
        entry.dbd * liveDbdRatio,
        typeData.floorDbd,
        typeData.ceilingDbd
      );`;

  if (!source.includes(newCurrentDbd)) {
    if (!source.includes(oldCurrentDbd)) {
      throw new Error("Could not find currentDbd calculation in RaidAnalysisPanel.tsx");
    }
    source = source.replace(oldCurrentDbd, newCurrentDbd);
  }

  source = source.replace(
    `  }, [currentName, ivFactor, raidTypeAnalysis]);`,
    `  }, [currentName, liveDbdRatio, raidTypeAnalysis]);`
  );

  source = source.replace(
    `            IVs: {attackIV}/{defenseIV}/{hpIV}`,
    `            IVs: {liveBuild.attackIV}/{liveBuild.defenseIV}/{liveBuild.hpIV}`
  );

  await fs.writeFile(raidPath, source, "utf8");
  console.log("Connected RaidAnalysisPanel to the live build event.");
}

await patchPerformancePanel();
await patchRaidPanel();
console.log("Live Section 3 to Section 4 synchronization installed.");