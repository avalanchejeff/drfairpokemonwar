import fs from "node:fs/promises";

const file = "./app/components/MaxBattleAnalysisPanel.tsx";
let s = await fs.readFile(file, "utf8");
await fs.writeFile(`${file}.before-role-data-fix`, s, "utf8");

// Add published Dynamax role entries visible in the Oct. 2026 role lists.
s = s.replace(
  `  METAGROSS: { defender: "A", attacker: "B", healer: "C" },`,
  `  METAGROSS: { defender: "A", attacker: "B", healer: "C" },
  CHARIZARD: { defender: "C" },
  BLISSEY: { defender: "C", healer: "S" },`
);

// Gigantamax attack tiers must be separate from ordinary Dynamax tiers.
const gmaxMarker = `const GMAX: Record<string, { move: string; type: string }> = {`;
const gmaxRoles = `const GMAX_ROLE_TIERS: Record<string, { defender?: string; attacker?: string; healer?: string }> = {
  INTELEON: { attacker: "S" },
  GENGAR: { attacker: "S" },
  KINGLER: { attacker: "S" },
  RILLABOOM: { attacker: "S" },
  CINDERACE: { attacker: "S" },
  MACHAMP: { attacker: "S" },
  GRIMMSNARL: { attacker: "A" },
  TOXTRICITY: { attacker: "A" },
  CHARIZARD: { attacker: "A" },
  VENUSAUR: { attacker: "A" },
  SNORLAX: { attacker: "A" },
  GARBODOR: { attacker: "A" },
  BLASTOISE: { attacker: "A" },
  BUTTERFREE: { attacker: "B" },
  LAPRAS: { attacker: "B" },
};

`;
if (!s.includes("const GMAX_ROLE_TIERS:")) {
  s = s.replace(gmaxMarker, gmaxRoles + gmaxMarker);
}

s = s.replace(
  `  const gmax = GMAX[pokemonId];`,
  `  const gmax = GMAX[pokemonId];
  const gmaxRole = GMAX_ROLE_TIERS[pokemonId] ?? {};`
);

// Gigantamax role cards use Gigantamax-specific tiers when published,
// otherwise fall back only for support roles shared by the same specimen.
s = s.replace(
  `<RoleCard title="DEFENSE" tier={role.defender}>\n          <Metric label="Bulk index" value={bulk.toLocaleString()} />\n          <Metric label="Meter-speed fast move" value={fastest?.name ?? "Unavailable"} />\n          <Metric label="Max Guard" value="Available utility role" />`,
  `<RoleCard title="DEFENSE" tier={gmaxRole.defender ?? role.defender}>\n          <Metric label="Bulk index" value={bulk.toLocaleString()} />\n          <Metric label="Meter-speed fast move" value={fastest?.name ?? "Unavailable"} />\n          <Metric label="Max Guard" value="Available utility role" />`
);
s = s.replace(
  `<RoleCard title="ATTACK" tier={role.attacker}>\n          <Metric label="G-Max Move" value={gmax.move} />`,
  `<RoleCard title="ATTACK" tier={gmaxRole.attacker}>\n          <Metric label="G-Max Move" value={gmax.move} />`
);
s = s.replace(
  `<RoleCard title="HEALER" tier={role.healer}>\n          <Metric label="Level 50 HP"`,
  `<RoleCard title="HEALER" tier={gmaxRole.healer ?? role.healer}>\n          <Metric label="Level 50 HP"`
);

// Clarify unlisted roles are not zero scores.
s = s.replaceAll(`"Not ranked"`, `"Unranked in source"`);
s = s.replace(
  `Role labels are shown only where published role-tier data is available; otherwise the role is marked Not ranked instead of estimated.`,
  `Role labels are shown only where published role-tier data is available. “Unranked in source” does not mean a zero rating.`
);

await fs.writeFile(file, s, "utf8");
console.log("Updated Max role data and separated Dynamax from Gigantamax attack tiers.");
console.log("Added Charizard C Defender and Blissey C Defender / S Healer.");
console.log("Crowned forms remain special Max Battle participants, not Dynamax forms.");