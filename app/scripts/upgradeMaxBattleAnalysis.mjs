import fs from "node:fs/promises";

const file = "./app/components/MaxBattleAnalysisPanel.tsx";
let s = await fs.readFile(file, "utf8");
await fs.writeFile(`${file}.before-max-upgrade`, s, "utf8");

// Special Max-capable exceptions that do not Dynamax.
const marker = `const GMAX: Record<string, { move: string; type: string }> = {`;
const special = `const SPECIAL_MAX: Record<string, { move: string; type: string; title: string }> = {
  ZACIAN_CROWNED_SWORD: { move: "Behemoth Blade", type: "STEEL", title: "Crowned Sword Zacian" },
  ZAMAZENTA_CROWNED_SHIELD: { move: "Behemoth Bash", type: "STEEL", title: "Crowned Shield Zamazenta" },
  ETERNATUS_NORMAL: { move: "Dynamax Cannon", type: "DRAGON", title: "Eternatus" },
};

`;
if (!s.includes("const SPECIAL_MAX:")) s = s.replace(marker, special + marker);

// Add form prop.
s = s.replace(`  pokemonId: string;\n  attack: number;`, `  pokemonId: string;\n  form: string;\n  attack: number;`);
s = s.replace(`export default function MaxBattleAnalysisPanel({ displayName, pokemonId, attack, defense, stamina, fastMoves = [] }: Props) {`, `export default function MaxBattleAnalysisPanel({ displayName, pokemonId, form, attack, defense, stamina, fastMoves = [] }: Props) {`);

// Add special identity.
s = s.replace(`  const role = ROLE_TIERS[pokemonId] ?? {};`, `  const role = ROLE_TIERS[pokemonId] ?? {};
  const specialMax = SPECIAL_MAX[\`${"${pokemonId}"}_${"${form}"}\`];`);

// Make best-use safe when role data is missing.
s = s.replace(`  const best = [...rolePairs].sort((a,b) => balls(b[1]).filter(Boolean).length - balls(a[1]).filter(Boolean).length)[0];`, `  const rankedRoles = rolePairs.filter(([, tier]) => Boolean(tier));
  const best = [...rankedRoles].sort((a,b) => balls(b[1]).filter(Boolean).length - balls(a[1]).filter(Boolean).length)[0];`);
s = s.replace(`{tierLabel(best?.[1])} {best?.[0] ?? "Role"}`, `{best ? \`${"${tierLabel(best[1])}"} ${"${best[0]}"}\` : "Role data unavailable"}`);

// Dynamax title becomes generic Max Battle for special exceptions.
s = s.replace(`<div className="flex items-center gap-4"><Emblem kind="Dynamax" /><div><div className="text-xs font-bold tracking-widest text-fuchsia-300">DYNAMAX</div><h3 className="text-2xl font-black">{displayName}</h3></div></div>`, `<div className="flex items-center gap-4">{specialMax ? <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-amber-400 bg-amber-950 text-lg font-black text-amber-300">MAX</div> : <Emblem kind="Dynamax" />}<div><div className="text-xs font-bold tracking-widest text-fuchsia-300">{specialMax ? "MAX BATTLE" : "DYNAMAX"}</div><h3 className="text-2xl font-black">{specialMax?.title ?? displayName}</h3></div></div>`);

// Replace Attack contents for special exceptions.
const attackStart = `<RoleCard title="ATTACK" tier={role.attacker}>\n          <Metric label="Base Attack" value={String(attack)} />`;
const attackReplacement = `<RoleCard title="ATTACK" tier={role.attacker}>
          <Metric label="Base Attack" value={String(attack)} />
          {specialMax ? (
            <div className="mt-3 rounded-lg border border-amber-700 bg-zinc-950 p-3 text-sm">
              <div className="text-xs font-black tracking-wide text-amber-300">FIXED MAX ATTACK</div>
              <div className="mt-2 font-black">{specialMax.move}</div>
              <div className="text-zinc-300">{specialMax.type}</div>
              <div className="mt-1 text-zinc-500">Effective vs: {(TYPE_EFFECTIVE[specialMax.type] ?? []).join(" · ") || "No super-effective types"}</div>
            </div>
          ) : (
            <>`;
if (s.includes(attackStart)) s = s.replace(attackStart, attackReplacement);

const attackEnd = `            {coverage.length ? coverage.map(({move,type,maxMove,targets}) => <div key={move.id} className="rounded-lg border border-zinc-700 bg-zinc-950 p-3 text-sm"><div className="font-black">{move.name}</div><div className="text-zinc-300">{maxMove} · {type}</div><div className="mt-1 text-zinc-500">Effective vs: {targets.length ? targets.join(" · ") : "No super-effective types"}</div></div>) : <div className="text-zinc-500">Fast-move data unavailable.</div>}
          </div>
        </RoleCard>`;
const attackEndReplacement = `            {coverage.length ? coverage.map(({move,type,maxMove,targets}) => <div key={move.id} className="rounded-lg border border-zinc-700 bg-zinc-950 p-3 text-sm"><div className="font-black">{move.name}</div><div className="text-zinc-300">{maxMove} · {type}</div><div className="mt-1 text-zinc-500">Effective vs: {targets.length ? targets.join(" · ") : "No super-effective types"}</div></div>) : <div className="text-zinc-500">Fast-move data unavailable.</div>}
          </div>
            </>
          )}
        </RoleCard>`;
if (s.includes(attackEnd)) s = s.replace(attackEnd, attackEndReplacement);

// Replace the simple GMax block with full three-role details.
const gStart = s.indexOf(`    {gmax && <div className="mt-5`);
const gEndMarker = `    <p className="mt-4 text-xs text-zinc-500">Role labels`;
const gEnd = s.indexOf(gEndMarker, gStart);
if (gStart >= 0 && gEnd >= 0) {
  const fullGmax = `    {gmax && <div className="mt-5 rounded-2xl border border-rose-800 bg-zinc-950 p-5">
      <div className="flex items-center gap-4"><Emblem kind="Gigantamax" /><div><div className="text-xs font-bold tracking-widest text-rose-300">GIGANTAMAX</div><h3 className="text-2xl font-black">{displayName}</h3></div></div>
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <RoleCard title="DEFENSE" tier={role.defender}>
          <Metric label="Bulk index" value={bulk.toLocaleString()} />
          <Metric label="Meter-speed fast move" value={fastest?.name ?? "Unavailable"} />
          <Metric label="Max Guard" value="Available utility role" />
        </RoleCard>
        <RoleCard title="ATTACK" tier={role.attacker}>
          <Metric label="G-Max Move" value={gmax.move} />
          <Metric label="Type" value={gmax.type} />
          <Metric label="Effective Against" value={(TYPE_EFFECTIVE[gmax.type] ?? []).join(" · ") || "Neutral coverage"} />
          <div className="text-xs text-zinc-500">G-Max attack type is fixed by species.</div>
        </RoleCard>
        <RoleCard title="HEALER" tier={role.healer}>
          <Metric label="Level 50 HP" value={String(Math.floor((stamina + 15) * 0.8403))} />
          <Metric label="Max Spirit Lv. 1" value={\`${"${spirit[0]}"} HP\`} />
          <Metric label="Max Spirit Lv. 2" value={\`${"${spirit[1]}"} HP\`} />
          <Metric label="Max Spirit Lv. 3" value={\`${"${spirit[2]}"} HP\`} />
        </RoleCard>
      </div>
    </div>}

`;
  s = s.slice(0, gStart) + fullGmax + s.slice(gEnd);
}

await fs.writeFile(file, s, "utf8");
console.log("Upgraded Max Battle Analysis:");
console.log("- Gigantamax now includes Defense, Attack, and Healer detail");
console.log("- Crowned Zacian/Zamazenta and Eternatus use special Max Battle identity");
console.log("- Missing role data remains Not ranked instead of guessed");