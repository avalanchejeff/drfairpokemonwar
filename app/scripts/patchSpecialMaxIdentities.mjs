import fs from "node:fs/promises";

const pagePath = "./app/lab/page.tsx";
const backupPath = "./app/lab/page.tsx.before-special-max-identities";
let source = await fs.readFile(pagePath, "utf8");
const original = source;

const anchor = `const maxTierScore: Record<string, number> = {\n  S: 7, A: 6, B: 5, C: 4, D: 3, E: 2, F: 1,\n};`;
if (!source.includes(anchor)) {
  throw new Error("Could not find Max tier scale. No changes were written.");
}

source = source.replace(
  anchor,
  `${anchor}\n\nconst specialMaxRoleKeys: Record<string, string> = {\n  ETERNATUS: "ETERNATUS_SPECIAL",\n  ZACIAN_CROWNED_SWORD: "CROWNED_SWORD_ZACIAN",\n  ZAMAZENTA_CROWNED_SHIELD: "CROWNED_SHIELD_ZAMAZENTA",\n};`
);

const needle = `    } else {\n      candidates = [\n        name,\n        form,\n        form.startsWith(base + "_")\n          ? form.slice(base.length + 1) + "_" + base\n          : "",\n        base,\n      ].filter(Boolean);\n    }`;

if (!source.includes(needle)) {
  throw new Error("Could not find Dynamax candidate lookup. No changes were written.");
}

source = source.replace(
  needle,
  `    } else {\n      const specialKey =\n        specialMaxRoleKeys[name] ??\n        specialMaxRoleKeys[form] ??\n        specialMaxRoleKeys[base] ??\n        "";\n\n      candidates = [\n        specialKey,\n        name,\n        form,\n        form.startsWith(base + "_")\n          ? form.slice(base.length + 1) + "_" + base\n          : "",\n        base,\n      ].filter(Boolean);\n    }`
);

const roleBlock = `    tiers.sort(\n      (a, b) =>\n        (maxTierScore[b.tier ?? ""] ?? 0) -\n        (maxTierScore[a.tier ?? ""] ?? 0)\n    );`;

if (!source.includes(roleBlock)) {
  throw new Error("Could not find Best Role sort. No changes were written.");
}

source = source.replace(
  roleBlock,
  `${roleBlock}\n\n    const bestScore = tiers.length\n      ? maxTierScore[tiers[0].tier ?? ""] ?? 0\n      : 0;\n    const bestRole = tiers\n      .filter((item) => (maxTierScore[item.tier ?? ""] ?? 0) === bestScore)\n      .map((item) => item.label)\n      .join(" / ") || "Not rated";`
);

source = source.replace(
  '      bestRole: tiers[0]?.label ?? "Not rated",',
  '      bestRole,'
);

await fs.writeFile(backupPath, original, "utf8");
await fs.writeFile(pagePath, source, "utf8");

console.log("Patched special Max identities.");
console.log("- Eternatus -> ETERNATUS_SPECIAL");
console.log("- Zacian Crowned Sword -> CROWNED_SWORD_ZACIAN");
console.log("- Zamazenta Crowned Shield -> CROWNED_SHIELD_ZAMAZENTA");
console.log("- Tied top roles now display together");
console.log("Backup:", backupPath);