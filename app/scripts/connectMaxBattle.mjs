import fs from "node:fs/promises";

const pagePath = "./app/lab/page.tsx";
const backupPath = "./app/lab/page.tsx.before-max-battle";
let source = await fs.readFile(pagePath, "utf8");
const original = source;

function replaceOnce(search, replacement, label) {
  if (!source.includes(search)) {
    throw new Error(`Could not find ${label}. No changes were written.`);
  }
  source = source.replace(search, replacement);
}

replaceOnce(
  'import movePoolsData from "../data/movePools.json";',
  'import movePoolsData from "../data/movePools.json";\nimport maxBattleRolesData from "../data/maxBattleRoles.json";',
  "move-pool import"
);

replaceOnce(
  'type RaidEntry = {',
  `type MaxRole = {\n  identity: "DYNAMAX" | "GIGANTAMAX" | "SPECIAL";\n  attackerTier?: string;\n  defenderTier?: string;\n  defenderFastMoves?: string[];\n  healerTier?: string;\n  specialAttack?: string;\n  specialType?: string;\n  canTransform?: boolean;\n};\n\ntype MaxRolesFile = {\n  roles: Record<string, MaxRole>;\n};\n\ntype RaidEntry = {`,
  "Raid entry type"
);

replaceOnce(
  'const movePools = Object.values(movePoolsData) as MovePool[];',
  'const movePools = Object.values(movePoolsData) as MovePool[];\nconst maxBattleRoles = (maxBattleRolesData as MaxRolesFile).roles;',
  "move-pool constant"
);

replaceOnce(
  'const leagueLabels: Record<LeagueKey, string> = {',
  `const maxAttackNames: Record<string, string> = {\n  NORMAL: "Max Strike",\n  FIRE: "Max Flare",\n  WATER: "Max Geyser",\n  ELECTRIC: "Max Lightning",\n  GRASS: "Max Overgrowth",\n  ICE: "Max Hailstorm",\n  FIGHTING: "Max Knuckle",\n  POISON: "Max Ooze",\n  GROUND: "Max Quake",\n  FLYING: "Max Airstream",\n  PSYCHIC: "Max Mindstorm",\n  BUG: "Max Flutterby",\n  ROCK: "Max Rockfall",\n  GHOST: "Max Phantasm",\n  DRAGON: "Max Wyrmwind",\n  DARK: "Max Darkness",\n  STEEL: "Max Steelspike",\n  FAIRY: "Max Starfall",\n};\n\nconst maxTierScore: Record<string, number> = {\n  S: 7, A: 6, B: 5, C: 4, D: 3, E: 2, F: 1,\n};\n\nconst leagueLabels: Record<LeagueKey, string> = {`,
  "league labels"
);

replaceOnce(
  '  const raidMeta = useMemo(() => {',
  `  const maxBattleMeta = useMemo(() => {\n    if (!selectedRecord) return null;\n\n    const base = selectedRecord.pokemonId;\n    const form = selectedRecord.form ?? "";\n    const name = selectedRecord.name.toUpperCase().replaceAll("-", "_");\n    const candidates = [\n      name,\n      form,\n      form.startsWith(base + "_") ? form.slice(base.length + 1) + "_" + base : "",\n      base,\n    ].filter(Boolean);\n\n    const roleKey = candidates.find((key) => maxBattleRoles[key]);\n    if (!roleKey) return null;\n\n    const role = maxBattleRoles[roleKey];\n    const tiers = [\n      { label: "Attacker", tier: role.attackerTier },\n      { label: "Tank", tier: role.defenderTier },\n      { label: "Healer", tier: role.healerTier },\n    ].filter((item) => item.tier);\n\n    tiers.sort(\n      (a, b) =>\n        (maxTierScore[b.tier ?? ""] ?? 0) -\n        (maxTierScore[a.tier ?? ""] ?? 0)\n    );\n\n    const selectedFastMove = selectedMovePool?.fastMoves.find(\n      (move) => move.id === fastMove\n    );\n    const fastType = selectedFastMove?.type?.replace("POKEMON_TYPE_", "") ?? "";\n\n    let recommendedAttack = "Not captured";\n    if (role.specialAttack) {\n      recommendedAttack = role.specialAttack;\n    } else if (role.identity === "GIGANTAMAX") {\n      recommendedAttack = "Species-specific G-Max Attack";\n    } else if (fastType && maxAttackNames[fastType]) {\n      recommendedAttack = maxAttackNames[fastType];\n    }\n\n    return {\n      role,\n      roleKey,\n      bestRole: tiers[0]?.label ?? "Not rated",\n      recommendedAttack,\n      selectedFastMoveName: selectedFastMove?.name ?? null,\n    };\n  }, [selectedRecord, selectedMovePool, fastMove]);\n\n  const raidMeta = useMemo(() => {`,
  "Raid calculation"
);

const oldCard = `              <MetaCard\n                title="Max Battle"\n                color="purple"\n                rows={[\n                  "Best Role",\n                  "Attacker",\n                  "Tank",\n                  "Healer",\n                  "Recommended Max Attack",\n                ]}\n              />`;

const newCard = `              <div className="rounded-2xl border border-purple-900/60 bg-purple-950/10 p-5">\n                <h4 className="text-xl font-black text-purple-300">Max Battle</h4>\n                {selectedRecord && maxBattleMeta ? (\n                  <div className="mt-4 space-y-3 text-sm text-white">\n                    <MaxResultRow label="Status" value={maxBattleMeta.role.identity} />\n                    <MaxResultRow label="Best Role" value={maxBattleMeta.bestRole} />\n                    <MaxResultRow label="Attacker" value={maxBattleMeta.role.attackerTier ?? "Not rated"} />\n                    <MaxResultRow label="Tank" value={maxBattleMeta.role.defenderTier ?? "Not rated"} />\n                    <MaxResultRow label="Healer" value={maxBattleMeta.role.healerTier ?? "Not rated"} />\n                    {maxBattleMeta.role.defenderFastMoves?.length ? (\n                      <MaxResultRow\n                        label="Tank Fast Move"\n                        value={maxBattleMeta.role.defenderFastMoves.join(" • ")}\n                        stacked\n                      />\n                    ) : null}\n                    <MaxResultRow\n                      label="Recommended Max Attack"\n                      value={maxBattleMeta.recommendedAttack}\n                      stacked\n                    />\n                    {maxBattleMeta.selectedFastMoveName ? (\n                      <p className="rounded-xl border border-purple-900/70 bg-black/20 px-3 py-2 text-xs text-purple-200">\n                        Based on selected Fast Move: {maxBattleMeta.selectedFastMoveName}\n                      </p>\n                    ) : null}\n                  </div>\n                ) : (\n                  <p className="mt-4 text-sm text-zinc-500">\n                    {selectedRecord\n                      ? "No Max Battle role data is captured for this form."\n                      : "Select a Pokémon and form."}\n                  </p>\n                )}\n              </div>`;

replaceOnce(oldCard, newCard, "Max Battle placeholder card");

replaceOnce(
  'function RaidResultRow({',
  `function MaxResultRow({\n  label,\n  value,\n  stacked = false,\n}: {\n  label: string;\n  value: string;\n  stacked?: boolean;\n}) {\n  return (\n    <div className={stacked ? "space-y-1" : "flex justify-between gap-4"}>\n      <span className="text-zinc-300">{label}</span>\n      <span\n        className={\n          stacked\n            ? "block font-bold text-purple-100"\n            : "text-right font-bold text-purple-100"\n        }\n      >\n        {value}\n      </span>\n    </div>\n  );\n}\n\nfunction RaidResultRow({`,
  "Raid result component"
);

await fs.writeFile(backupPath, original, "utf8");
await fs.writeFile(pagePath, source, "utf8");

console.log("Connected the Dr. Fair Max Battle panel.");
console.log("- Max status / identity");
console.log("- Best role");
console.log("- Attacker, Tank, and Healer tiers");
console.log("- Recommended Tank fast move when captured");
console.log("- Recommended Max Attack from special move or selected Fast Move type");
console.log("Backup:", backupPath);