"use client";

import maxBattleData from "../data/maxBattleRoles.json";

type FastMove = {
  id: string;
  name: string;
  type?: string | null;
  durationMs?: number;
};

type Props = {
  displayName: string;
  pokemonId: string;
  form: string;
  attack: number;
  defense: number;
  stamina: number;
  fastMoves?: FastMove[];
};

type RoleRecord = {
  identity?: "DYNAMAX" | "GIGANTAMAX" | "SPECIAL";
  attackerTier?: string;
  defenderTier?: string;
  healerTier?: string;
  defenderFastMoves?: string[];
  specialAttack?: string;
  specialType?: string;
  canTransform?: boolean;
  status?: "ANNOUNCED" | "RELEASED";
  debutDate?: string;
  debutEndDate?: string;
};

const roles = maxBattleData.roles as Record<string, RoleRecord>;

const TYPE_EFFECTIVE: Record<string, string[]> = {
  NORMAL: [], FIRE: ["Bug", "Grass", "Ice", "Steel"],
  WATER: ["Fire", "Ground", "Rock"], ELECTRIC: ["Flying", "Water"],
  GRASS: ["Ground", "Rock", "Water"], ICE: ["Dragon", "Flying", "Grass", "Ground"],
  FIGHTING: ["Dark", "Ice", "Normal", "Rock", "Steel"], POISON: ["Fairy", "Grass"],
  GROUND: ["Electric", "Fire", "Poison", "Rock", "Steel"], FLYING: ["Bug", "Fighting", "Grass"],
  PSYCHIC: ["Fighting", "Poison"], BUG: ["Dark", "Grass", "Psychic"],
  ROCK: ["Bug", "Fire", "Flying", "Ice"], GHOST: ["Ghost", "Psychic"],
  DRAGON: ["Dragon"], DARK: ["Ghost", "Psychic"],
  STEEL: ["Fairy", "Ice", "Rock"], FAIRY: ["Dark", "Dragon", "Fighting"],
};

const MAX_MOVE_NAMES: Record<string, string> = {
  NORMAL: "Max Strike", FIRE: "Max Flare", WATER: "Max Geyser", ELECTRIC: "Max Lightning",
  GRASS: "Max Overgrowth", ICE: "Max Hailstorm", FIGHTING: "Max Knuckle", POISON: "Max Ooze",
  GROUND: "Max Quake", FLYING: "Max Airstream", PSYCHIC: "Max Mindstorm", BUG: "Max Flutterby",
  ROCK: "Max Rockfall", GHOST: "Max Phantasm", DRAGON: "Max Wyrmwind", DARK: "Max Darkness",
  STEEL: "Max Steelspike", FAIRY: "Max Starfall",
};

const GMAX_MOVES: Record<string, { move: string; type: string }> = {
  VENUSAUR: { move: "G-Max Vine Lash", type: "GRASS" },
  CHARIZARD: { move: "G-Max Wildfire", type: "FIRE" },
  BLASTOISE: { move: "G-Max Cannonade", type: "WATER" },
  BUTTERFREE: { move: "G-Max Befuddle", type: "BUG" },
  PIKACHU: { move: "G-Max Volt Crash", type: "ELECTRIC" },
  MEOWTH: { move: "G-Max Gold Rush", type: "NORMAL" },
  MACHAMP: { move: "G-Max Chi Strike", type: "FIGHTING" },
  GENGAR: { move: "G-Max Terror", type: "GHOST" },
  KINGLER: { move: "G-Max Foam Burst", type: "WATER" },
  LAPRAS: { move: "G-Max Resonance", type: "ICE" },
  SNORLAX: { move: "G-Max Replenish", type: "NORMAL" },
  GARBODOR: { move: "G-Max Malodor", type: "POISON" },
  RILLABOOM: { move: "G-Max Drum Solo", type: "GRASS" },
  CINDERACE: { move: "G-Max Fireball", type: "FIRE" },
  INTELEON: { move: "G-Max Hydrosnipe", type: "WATER" },
  TOXTRICITY: { move: "G-Max Stun Shock", type: "ELECTRIC" },
  GRIMMSNARL: { move: "G-Max Snooze", type: "DARK" },
};

function clean(value: string) {
  return value.toUpperCase().replaceAll("-", "_").replaceAll(" ", "_");
}
function cleanType(type?: string | null) {
  return String(type ?? "").replace("POKEMON_TYPE_", "").toUpperCase();
}
function specialKey(pokemonId: string, form: string) {
  const id = clean(pokemonId);
  const f = clean(form);
  if (id === "ZACIAN" && f.includes("CROWNED_SWORD")) return "CROWNED_SWORD_ZACIAN";
  if (id === "ZAMAZENTA" && f.includes("CROWNED_SHIELD")) return "CROWNED_SHIELD_ZAMAZENTA";
  if (id === "ETERNATUS") return "ETERNATUS_SPECIAL";
  return null;
}
function formatDebut(record: RoleRecord) {
  if (!record.debutDate) return "";
  const start = new Date(record.debutDate + "T12:00:00");
  const startText = start.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  if (!record.debutEndDate) return startText;
  const end = new Date(record.debutEndDate + "T12:00:00");
  const endText = end.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  return startText + " to " + endText;
}
function label(tier?: string) {
  return tier === "S" ? "Elite" : tier === "A" ? "Excellent" : tier === "B" ? "Good" : tier === "C" ? "Below Average" : tier === "D" ? "Poor" : tier === "E" ? "Limited" : tier === "F" ? "Not Recommended" : "Not listed";
}
function ballCount(tier?: string) {
  return tier === "S" ? 5 : tier === "A" ? 4 : tier === "B" ? 3 : tier === "C" ? 2 : tier === "D" || tier === "E" || tier === "F" ? 1 : 0;
}
function BallRating({ tier }: { tier?: string }) {
  const count = ballCount(tier);
  return <div className="flex gap-1" aria-label={label(tier)}>{Array.from({ length: 5 }, (_, i) => <span key={i} className={
    "relative h-6 w-6 rounded-full border-2 " + (i < count ? "border-white" : "border-zinc-600 opacity-30")
  } style={{ background: i < count ? "linear-gradient(to bottom,#ef4444 0 46%,#18181b 46% 56%,white 56% 100%)" : "#3f3f46" }}><span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-zinc-900 bg-white" /></span>)}</div>;
}
function Emblem({ text, tone }: { text: string; tone: "pink" | "rose" | "amber" }) {
  const cls = tone === "pink" ? "border-fuchsia-400 bg-fuchsia-950 text-fuchsia-300" : tone === "rose" ? "border-rose-400 bg-rose-950 text-rose-300" : "border-amber-400 bg-amber-950 text-amber-300";
  return <div className={"flex h-12 w-12 items-center justify-center rounded-xl border text-sm font-black " + cls}>{text}</div>;
}

export default function MaxBattleAnalysisPanel({ displayName, pokemonId, form, attack, defense, stamina, fastMoves = [] }: Props) {
  const baseKey = clean(pokemonId);
  const special = specialKey(pokemonId, form);
  const baseRole = roles[special ?? baseKey] ?? {};
  const gmaxRole = roles["GIGANTAMAX_" + baseKey];
  const gmaxMove = GMAX_MOVES[baseKey];
  const hp = Math.floor((stamina + 15) * 0.8403);
  const spirit = [0.08, 0.12, 0.16].map(rate => Math.floor(hp * rate));
  const bulk = (defense + 15) * (stamina + 15);
  const fastest = [...fastMoves].sort((a, b) => (a.durationMs ?? 9999) - (b.durationMs ?? 9999))[0];
  const coverage = fastMoves.map(move => {
    const type = cleanType(move.type);
    return { move, type, maxMove: MAX_MOVE_NAMES[type] ?? "Max Attack", targets: TYPE_EFFECTIVE[type] ?? [] };
  });

  return <section className="mt-8 rounded-2xl border border-zinc-700 bg-zinc-900 p-6">
    <h2 className="text-3xl font-bold">Max Battle Analysis</h2>

    {(special || roles[baseKey]) ? <MaxIdentitySection
      title={special ? "SPECIAL MAX BATTLE PARTICIPANT" : "DYNAMAX"}
      displayName={displayName}
      role={baseRole}
      emblem={<Emblem text={special ? "MAX" : "D∞"} tone={special ? "amber" : "pink"} />}
      attack={attack}
      bulk={bulk}
      hp={hp}
      spirit={spirit}
      fastest={fastest}
      coverage={coverage}
      fixedAttack={special ? { move: baseRole.specialAttack ?? "Fixed attack", type: baseRole.specialType ?? "" } : null}
    /> : null}

    {gmaxRole ? <MaxIdentitySection
      title="GIGANTAMAX"
      displayName={displayName}
      role={gmaxRole}
      fallbackSupportRole={baseRole}
      emblem={<Emblem text="G∞" tone="rose" />}
      attack={attack}
      bulk={bulk}
      hp={hp}
      spirit={spirit}
      fastest={fastest}
      coverage={[]}
      fixedAttack={gmaxMove ?? (gmaxRole.status === "ANNOUNCED" ? { move: "G-Max move details pending", type: "" } : null)}
    /> : null}

    <p className="mt-4 text-xs text-zinc-500">Role tiers come from the generated Max Battle role dataset. A missing role says “Not listed” rather than being assigned a guessed score.</p>
  </section>;
}

function MaxIdentitySection({ title, displayName, role, fallbackSupportRole, emblem, attack, bulk, hp, spirit, fastest, coverage, fixedAttack }: {
  title: string; displayName: string; role: RoleRecord; fallbackSupportRole?: RoleRecord; emblem: React.ReactNode; attack: number; bulk: number; hp: number; spirit: number[]; fastest?: FastMove; coverage: Array<{ move: FastMove; type: string; maxMove: string; targets: string[] }>; fixedAttack: { move: string; type: string } | null;
}) {
  const defenderTier = role.defenderTier ?? fallbackSupportRole?.defenderTier;
  const healerTier = role.healerTier ?? fallbackSupportRole?.healerTier;
  const pairs = [["Defender", defenderTier], ["Attacker", role.attackerTier], ["Healer", healerTier]] as const;
  const roleLabel = (tier?: string) => role.status === "ANNOUNCED" && !tier ? "Pre-release" : label(tier);
  const best = [...pairs].filter(([, tier]) => tier).sort((a,b) => ballCount(b[1]) - ballCount(a[1]))[0];
  return <div className="mt-6 rounded-2xl border border-zinc-700 bg-zinc-950 p-5">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-4">{emblem}<div><div className="text-xs font-bold tracking-widest text-zinc-400">{title}</div><h3 className="text-2xl font-black">{displayName}</h3></div></div>
      {role.status === "ANNOUNCED" ? <div className="rounded-full border border-cyan-400 bg-cyan-950 px-4 py-2 text-sm font-black text-cyan-200">ANNOUNCED · {formatDebut(role)}</div> : null}
    </div>
    <div className="mt-5 grid gap-3 lg:grid-cols-4">
      <div className="rounded-xl bg-zinc-900 p-4"><div className="text-xs font-bold text-zinc-500">BEST USE</div><div className="mt-2 text-xl font-black">{best ? label(best[1]) + " " + best[0] : role.status === "ANNOUNCED" ? "Pre-release outlook pending" : "Not listed"}</div></div>
      {pairs.map(([name, tier]) => <div key={name} className="rounded-xl bg-zinc-900 p-4"><div className="text-xs font-bold text-zinc-500">{name.toUpperCase()}</div><div className="mt-2"><BallRating tier={tier} /></div><div className="mt-2 font-bold">{roleLabel(tier)}</div></div>)}
    </div>
    <div className="mt-5 grid gap-4 lg:grid-cols-3">
      <RoleCard title="DEFENSE" tier={defenderTier}><Metric label="Bulk index" value={bulk.toLocaleString()} /><Metric label="Recommended Fast" value={(role.defenderFastMoves ?? fallbackSupportRole?.defenderFastMoves)?.join(" / ") ?? fastest?.name ?? "Not listed"} /><Metric label="Fast move duration" value={fastest?.durationMs ? (fastest.durationMs / 1000).toFixed(1) + " sec" : "Unavailable"} /><Metric label="Guard" value="Defensive utility" /></RoleCard>
      <RoleCard title="ATTACK" tier={role.attackerTier}><Metric label="Base Attack" value={String(attack)} />{fixedAttack ? <AttackLine move={fixedAttack.move} type={fixedAttack.type} /> : <div className="mt-3 space-y-2">{coverage.map(item => <AttackLine key={item.move.id} move={item.move.name} type={item.type} maxMove={item.maxMove} targets={item.targets} />)}</div>}</RoleCard>
      <RoleCard title="HEALER" tier={healerTier}><Metric label="Level 50 HP" value={String(hp)} /><Metric label="Spirit Lv. 1" value={spirit[0] + " HP"} /><Metric label="Spirit Lv. 2" value={spirit[1] + " HP"} /><Metric label="Spirit Lv. 3" value={spirit[2] + " HP"} /></RoleCard>
    </div>
  </div>;
}
function AttackLine({ move, type, maxMove, targets }: { move: string; type: string; maxMove?: string; targets?: string[] }) {
  const effective = targets ?? TYPE_EFFECTIVE[type] ?? [];
  return <div className="rounded-lg border border-zinc-700 bg-zinc-950 p-3 text-sm"><div className="font-black">{move}</div>{maxMove ? <div className="text-zinc-300">{maxMove} · {type}</div> : <div className="text-zinc-300">{type}</div>}<div className="mt-1 text-zinc-500">Effective vs: {effective.length ? effective.join(" · ") : "No super-effective types"}</div></div>;
}
function RoleCard({ title, tier, children }: { title: string; tier?: string; children: React.ReactNode }) { return <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-4"><div className="flex items-center justify-between gap-3"><div><div className="text-xs font-black tracking-widest text-zinc-500">{title}</div><div className="mt-1 text-xl font-black">{label(tier)}</div></div><BallRating tier={tier} /></div><div className="mt-4 space-y-3">{children}</div></div>; }
function Metric({ label: metricLabel, value }: { label: string; value: string }) { return <div><div className="text-xs font-bold text-zinc-500">{metricLabel}</div><div className="font-bold text-zinc-100">{value}</div></div>; }
