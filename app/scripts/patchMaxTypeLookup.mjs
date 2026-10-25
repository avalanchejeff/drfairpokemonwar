import fs from "node:fs/promises";

const pagePath = "./app/lab/page.tsx";
const backupPath = "./app/lab/page.tsx.before-max-type-lookup";
let source = await fs.readFile(pagePath, "utf8");
const original = source;

const start = source.indexOf('  const maxBattleMeta = useMemo(() => {');
const end = source.indexOf('  const raidMeta = useMemo(() => {', start);
if (start < 0 || end < 0) {
  throw new Error("Could not find Max Battle calculation block. No changes were written.");
}

const replacement = `  const maxBattleMeta = useMemo(() => {\n    if (!selectedRecord || maxType === "Standard") return null;\n\n    const base = selectedRecord.pokemonId;\n    const form = selectedRecord.form ?? "";\n    const name = selectedRecord.name.toUpperCase().replaceAll("-", "_");\n\n    let candidates: string[] = [];\n\n    if (maxType === "Gigantamax") {\n      candidates = [\n        \`GIGANTAMAX_\${base}\`,\n        form.startsWith("GIGANTAMAX_") ? form : "",\n        name.startsWith("GIGANTAMAX_") ? name : "",\n      ].filter(Boolean);\n    } else {\n      candidates = [\n        name,\n        form,\n        form.startsWith(base + "_")\n          ? form.slice(base.length + 1) + "_" + base\n          : "",\n        base,\n      ].filter(Boolean);\n    }\n\n    const roleKey = candidates.find((key) => maxBattleRoles[key]);\n    if (!roleKey) return null;\n\n    const role = maxBattleRoles[roleKey];\n    const tiers = [\n      { label: "Attacker", tier: role.attackerTier },\n      { label: "Tank", tier: role.defenderTier },\n      { label: "Healer", tier: role.healerTier },\n    ].filter((item) => item.tier);\n\n    tiers.sort(\n      (a, b) =>\n        (maxTierScore[b.tier ?? ""] ?? 0) -\n        (maxTierScore[a.tier ?? ""] ?? 0)\n    );\n\n    const selectedFastMove = selectedMovePool?.fastMoves.find(\n      (move) => move.id === fastMove\n    );\n    const fastType =\n      selectedFastMove?.type?.replace("POKEMON_TYPE_", "") ?? "";\n\n    let recommendedAttack = "Not captured";\n    if (role.specialAttack) {\n      recommendedAttack = role.specialAttack;\n    } else if (role.identity === "GIGANTAMAX") {\n      recommendedAttack = "Species-specific G-Max Attack";\n    } else if (fastType && maxAttackNames[fastType]) {\n      recommendedAttack = maxAttackNames[fastType];\n    }\n\n    return {\n      role,\n      roleKey,\n      bestRole: tiers[0]?.label ?? "Not rated",\n      recommendedAttack,\n      selectedFastMoveName: selectedFastMove?.name ?? null,\n    };\n  }, [selectedRecord, selectedMovePool, fastMove, maxType]);\n\n`;

source = source.slice(0, start) + replacement + source.slice(end);

source = source.replace(
  '                    {selectedRecord\n                      ? "No Max Battle role data is captured for this form."\n                      : "Select a Pokémon and form."}',
  '                    {selectedRecord\n                      ? maxType === "Standard"\n                        ? "Select Dynamax or Gigantamax to evaluate Max Battle value."\n                        : `No ${maxType} Max Battle role data is captured for this Pokémon.`\n                      : "Select a Pokémon and form."}'
);

await fs.writeFile(backupPath, original, "utf8");
await fs.writeFile(pagePath, source, "utf8");

console.log("Patched Max Battle lookup to respect maxType.");
console.log("- Standard: no Max role assessment");
console.log("- Dynamax: standard Dynamax role record");
console.log("- Gigantamax: GIGANTAMAX_<POKEMON> role record");
console.log("- Panel recalculates when maxType changes");
console.log("Backup:", backupPath);