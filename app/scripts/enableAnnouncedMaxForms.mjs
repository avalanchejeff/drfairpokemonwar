import fs from "node:fs/promises";

const componentFile = "./app/components/MaxBattleAnalysisPanel.tsx";
const dataFile = "./app/data/maxBattleRoles.json";
const builderFile = "./app/scripts/buildMaxBattleRoles.mjs";

await fs.copyFile(componentFile, `${componentFile}.before-announced-forms`);
await fs.copyFile(dataFile, `${dataFile}.before-announced-forms`);

// 1. Ensure the generated dataset currently contains the announced forms.
const data = JSON.parse(await fs.readFile(dataFile, "utf8"));
data.roles.DIALGA = {
  ...(data.roles.DIALGA ?? {}),
  identity: "DYNAMAX",
  status: "ANNOUNCED",
  debutDate: "2026-11-14",
};
data.roles.PALKIA = {
  ...(data.roles.PALKIA ?? {}),
  identity: "DYNAMAX",
  status: "ANNOUNCED",
  debutDate: "2026-11-15",
};
data.roles.GIGANTAMAX_DURALUDON = {
  ...(data.roles.GIGANTAMAX_DURALUDON ?? {}),
  identity: "GIGANTAMAX",
  status: "ANNOUNCED",
  debutDate: "2026-11-14",
  debutEndDate: "2026-11-15",
};
await fs.writeFile(dataFile, JSON.stringify(data, null, 2));

// 2. Make announced forms part of the builder so regeneration preserves them.
let builder = await fs.readFile(builderFile, "utf8");
if (!builder.includes("GIGANTAMAX_DURALUDON")) {
  const marker = `const special = {`;
  const announced = `const announced = {
  DIALGA: { identity: "DYNAMAX", status: "ANNOUNCED", debutDate: "2026-11-14" },
  PALKIA: { identity: "DYNAMAX", status: "ANNOUNCED", debutDate: "2026-11-15" },
  GIGANTAMAX_DURALUDON: { identity: "GIGANTAMAX", status: "ANNOUNCED", debutDate: "2026-11-14", debutEndDate: "2026-11-15" },
};
Object.entries(announced).forEach(([k, v]) => Object.assign(out[k] ??= {}, v));

`;
  if (!builder.includes(marker)) throw new Error("Could not find builder insertion point.");
  builder = builder.replace(marker, announced + marker);
  await fs.writeFile(builderFile, builder, "utf8");
}

// 3. Teach the JSON-driven component to display announced status and dates.
let source = await fs.readFile(componentFile, "utf8");
source = source.replace(
  `  canTransform?: boolean;\n};`,
  `  canTransform?: boolean;\n  status?: "ANNOUNCED" | "RELEASED";\n  debutDate?: string;\n  debutEndDate?: string;\n};`
);

if (!source.includes("function formatDebut")) {
  source = source.replace(
    `function label(tier?: string) {`,
    `function formatDebut(record: RoleRecord) {
  if (!record.debutDate) return "";
  const start = new Date(record.debutDate + "T12:00:00");
  const startText = start.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  if (!record.debutEndDate) return startText;
  const end = new Date(record.debutEndDate + "T12:00:00");
  const endText = end.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  return startText + " to " + endText;
}
function label(tier?: string) {`
  );
}

// Display base Dynamax only when the base record exists. This prevents ordinary
// non-Max Pokemon from being mislabeled as Dynamax.
source = source.replace(
  `    <MaxIdentitySection\n      title={special ? "SPECIAL MAX BATTLE PARTICIPANT" : "DYNAMAX"}`,
  `    {(special || roles[baseKey]) ? <MaxIdentitySection\n      title={special ? "SPECIAL MAX BATTLE PARTICIPANT" : "DYNAMAX"}`
);
source = source.replace(
  `      fixedAttack={special ? { move: baseRole.specialAttack ?? "Fixed attack", type: baseRole.specialType ?? "" } : null}\n    />\n\n    {gmaxRole && gmaxMove ? <MaxIdentitySection`,
  `      fixedAttack={special ? { move: baseRole.specialAttack ?? "Fixed attack", type: baseRole.specialType ?? "" } : null}\n    /> : null}\n\n    {gmaxRole ? <MaxIdentitySection`
);

// Do not block G-Max Duraludon just because its move details are not yet stored.
source = source.replace(
  `      fixedAttack={gmaxMove}\n    /> : null}`,
  `      fixedAttack={gmaxMove ?? (gmaxRole.status === "ANNOUNCED" ? { move: "G-Max move details pending", type: "" } : null)}\n    /> : null}`
);

// Add announced banner to every identity section.
source = source.replace(
  `    <div className="flex items-center gap-4">{emblem}<div><div className="text-xs font-bold tracking-widest text-zinc-400">{title}</div><h3 className="text-2xl font-black">{displayName}</h3></div></div>`,
  `    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-4">{emblem}<div><div className="text-xs font-bold tracking-widest text-zinc-400">{title}</div><h3 className="text-2xl font-black">{displayName}</h3></div></div>
      {role.status === "ANNOUNCED" ? <div className="rounded-full border border-cyan-400 bg-cyan-950 px-4 py-2 text-sm font-black text-cyan-200">ANNOUNCED · {formatDebut(role)}</div> : null}
    </div>`
);

// Announced forms should say Pre-release instead of Not listed.
source = source.replace(
  `  const pairs = [["Defender", defenderTier], ["Attacker", role.attackerTier], ["Healer", healerTier]] as const;`,
  `  const pairs = [["Defender", defenderTier], ["Attacker", role.attackerTier], ["Healer", healerTier]] as const;
  const roleLabel = (tier?: string) => role.status === "ANNOUNCED" && !tier ? "Pre-release" : label(tier);`
);
source = source.replace(
  `{best ? label(best[1]) + " " + best[0] : "Not listed"}`,
  `{best ? label(best[1]) + " " + best[0] : role.status === "ANNOUNCED" ? "Pre-release outlook pending" : "Not listed"}`
);
source = source.replace(
  `<div className="mt-2 font-bold">{label(tier)}</div>`,
  `<div className="mt-2 font-bold">{roleLabel(tier)}</div>`
);

await fs.writeFile(componentFile, source, "utf8");

console.log("Enabled announced Max forms in the unified dataset and component.");
console.log("- Dynamax Dialga: announced November 14, 2026");
console.log("- Dynamax Palkia: announced November 15, 2026");
console.log("- Gigantamax Duraludon: announced November 14-15, 2026");
console.log("- Announced forms display Pre-release instead of Not listed");