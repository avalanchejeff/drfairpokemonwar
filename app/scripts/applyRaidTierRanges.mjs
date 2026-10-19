import fs from "node:fs/promises";

const rankingBuilderPath = "./app/scripts/buildBenchmarkRankings.mjs";
const raidPanelPath = "./app/components/RaidAnalysisPanel.tsx";

const FIXED_TIER_FUNCTION = `function raidTierFromRank(rank) {
  if (rank <= 6) return "God";
  if (rank <= 26) return "S+";
  if (rank <= 60) return "S";
  if (rank <= 110) return "A";
  if (rank <= 160) return "B";
  if (rank <= 230) return "C";
  if (rank <= 300) return "D";
  return "Floor";
}`;

async function updateRankingBuilder() {
  let source = await fs.readFile(rankingBuilderPath, "utf8");
  const backup = `${rankingBuilderPath}.before-fixed-raid-tiers`;
  await fs.writeFile(backup, source, "utf8");

  if (!source.includes("function raidTierFromRank(rank)")) {
    const anchor = "const raidTypeAnalysis = {};";
    if (!source.includes(anchor)) {
      throw new Error("Could not locate raidTypeAnalysis in buildBenchmarkRankings.mjs");
    }
    source = source.replace(
      anchor,
      `${FIXED_TIER_FUNCTION}\n\n${anchor}`
    );
  }

  const oldBlock = `  entries.forEach((entry, index) => {
    entry.raidRank = index + 1;
    const percentile = entries.length > 1
      ? 1 - index / (entries.length - 1)
      : 1;
    entry.tier =
      percentile >= 0.99 ? "God" :
      percentile >= 0.95 ? "S+" :
      percentile >= 0.9 ? "S" :
      percentile >= 0.75 ? "A" :
      percentile >= 0.5 ? "B" :
      percentile >= 0.25 ? "C" : "D";
  });`;

  const newBlock = `  entries.forEach((entry, index) => {
    entry.raidRank = index + 1;
    entry.tier = raidTierFromRank(entry.raidRank);
  });`;

  if (source.includes(oldBlock)) {
    source = source.replace(oldBlock, newBlock);
  } else if (!source.includes("entry.tier = raidTierFromRank(entry.raidRank)")) {
    throw new Error("Could not locate the old raid tier assignment block");
  }

  await fs.writeFile(rankingBuilderPath, source, "utf8");
  console.log("Updated fixed raid tiers in buildBenchmarkRankings.mjs");
}

async function updateRaidPanel() {
  let source = await fs.readFile(raidPanelPath, "utf8");
  const backup = `${raidPanelPath}.before-fixed-raid-tiers`;
  await fs.writeFile(backup, source, "utf8");

  const start = source.indexOf("function tierFromRank(");
  const endAnchor = "\n\nexport default function RaidAnalysisPanel";
  const end = source.indexOf(endAnchor, start);

  if (start < 0 || end < 0) {
    throw new Error("Could not locate tierFromRank in RaidAnalysisPanel.tsx");
  }

  const replacement = `function tierFromRank(rank: number) {
  if (rank <= 6) return "God";
  if (rank <= 26) return "S+";
  if (rank <= 60) return "S";
  if (rank <= 110) return "A";
  if (rank <= 160) return "B";
  if (rank <= 230) return "C";
  if (rank <= 300) return "D";
  return "Floor";
}`;

  source = source.slice(0, start) + replacement + source.slice(end);
  source = source.replace(
    `currentTier: tierFromRank(\n          currentRank,\n          typeData.entries.length\n        ),`,
    `currentTier: tierFromRank(currentRank),`
  );

  if (!source.includes("currentTier: tierFromRank(currentRank)")) {
    throw new Error("Could not update the RaidAnalysisPanel tier call");
  }

  await fs.writeFile(raidPanelPath, source, "utf8");
  console.log("Updated fixed raid tiers in RaidAnalysisPanel.tsx");
}

await updateRankingBuilder();
await updateRaidPanel();

console.log("Fixed raid tier ranges installed:");
console.log("God #1-6");
console.log("S+ #7-26");
console.log("S #27-60");
console.log("A #61-110");
console.log("B #111-160");
console.log("C #161-230");
console.log("D #231-300");
console.log("Floor #301+");