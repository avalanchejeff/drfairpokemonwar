import Link from "next/link";
import TierBadge from "../../components/TierBadge";
import PerformancePanel from "../../components/PerformancePanel";
import rankings from "../../data/benchmarkRankings2026.json";
import masterLeagueMetaRanks from "../../data/masterLeagueMetaRanks.json";
import movePools from "../../data/movePools.json";
import pokemonArtwork from "../../data/pokemonArtwork.json";
import artworkIndexHD from "../../data/artworkIndexHD.json";
import PokemonArtworkCard from "../../components/PokemonArtworkCard";
import RaidAnalysisPanel from "../../components/RaidAnalysisPanel";
import PvpAnalysisPanel from "../../components/PvpAnalysisPanel";
import MaxBattleAnalysisPanel from "../../components/MaxBattleAnalysisPanel";

type TierKey = "god" | "splus" | "s" | "a" | "b" | "c" | "d";

function getTierKey(tier: string): TierKey {
  if (tier === "God") return "god";
  if (tier === "S+") return "splus";
  if (tier === "S") return "s";
  if (tier === "A") return "a";
  if (tier === "B") return "b";
  if (tier === "C") return "c";
  return "d";
}

function getTypeRank(type: string | null, pokemonName: string) {
  if (!type) return null;

  const typeRankings = rankings
    .filter(
      (entry) =>
        entry.primaryType === type ||
        entry.secondaryType === type
    )
    .slice()
    .sort((a, b) => {
      if (b.psv !== a.psv) return b.psv - a.psv;
      return a.overallRank - b.overallRank;
    });

  const index = typeRankings.findIndex(
    (entry) => entry.name === pokemonName
  );

  return index >= 0 ? index + 1 : null;
}

function extractArtworkUrl(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const marker = "raw.githubusercontent.com";
  const start = value.indexOf(marker);

  if (start < 0) {
    return null;
  }

  const end = value.indexOf(".png", start);

  if (end < 0) {
    return null;
  }

  const imagePath = value.slice(start, end + 4);

  return ["https", ":", "//", imagePath].join("");
}
export default async function PokemonPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;

  const pokemon = rankings.find(
    (entry) => entry.name === name
  );

  if (!pokemon) {
    return (
      <main className="min-h-screen bg-zinc-950 p-8 text-white">
        <div className="mx-auto max-w-7xl">
          <Link
            href="/"
            className="text-sm font-semibold text-cyan-300 hover:text-cyan-200"
          >
            ← Back to Champions Hall
          </Link>

          <h1 className="mt-8 text-4xl font-bold">
            Pokémon Not Found
          </h1>

          <p className="mt-4 text-zinc-400">
            No record matches: {name}
          </p>
        </div>
      </main>
    );
  }

  const masterLeagueEntry =
  masterLeagueMetaRanks[
    pokemon.name as keyof typeof masterLeagueMetaRanks
  ];

const metaRank =
  masterLeagueEntry?.rank ?? null;
  const tierKey = getTierKey(pokemon.tier);

  const artworkKey = pokemon.name;
  const baseArtworkKey = pokemon.name.endsWith("-shadow")
    ? pokemon.name.replace(/-shadow$/, "")
    : pokemon.name;

  const artwork =
    pokemonArtwork[
      artworkKey as keyof typeof pokemonArtwork
    ] ??
    pokemonArtwork[
      baseArtworkKey as keyof typeof pokemonArtwork
    ];

  let artworkUrl = extractArtworkUrl(artwork?.image);

  const hdArtwork =
    artworkIndexHD[
      artworkKey as keyof typeof artworkIndexHD
    ] ??
    artworkIndexHD[
      baseArtworkKey as keyof typeof artworkIndexHD
    ];

  if (hdArtwork) {
    artworkUrl = hdArtwork;
  }

  const primaryTypeRank = getTypeRank(
    pokemon.primaryType,
    pokemon.name
  );

  const secondaryTypeRank = getTypeRank(
    pokemon.secondaryType,
    pokemon.name
  );

  const exactMovePoolKey =
  `${pokemon.pokemonId}:${pokemon.form}` as keyof typeof movePools;

const baseMovePoolKey =
  `${pokemon.pokemonId}:NORMAL` as keyof typeof movePools;

const movePool =
  movePools[exactMovePoolKey] ??
  movePools[baseMovePoolKey];

  const formOptions = rankings
    .filter(
      (entry) => entry.pokemonId === pokemon.pokemonId
    )
    .map((entry) => ({
      name: entry.name,
      displayName: entry.displayName,
    }));

  return (
    <main className="min-h-screen bg-zinc-950 p-6 text-white">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/"
          className="mb-4 inline-block text-sm font-semibold text-cyan-300 hover:text-cyan-200"
        >
          ← Back to Champions Hall
        </Link>

        <header className="mb-8 rounded-2xl border border-zinc-700 bg-zinc-900 p-6">
          <h1 className="text-4xl font-extrabold md:text-5xl">
            {pokemon.displayName}
          </h1>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-lg border border-yellow-600 bg-yellow-900/30 px-4 py-3">
              <p className="text-xs font-semibold text-yellow-300">
                OVERALL RANK
              </p>
              <p className="mt-1 text-2xl font-bold">
                #{pokemon.overallRank}
              </p>
            </div>

            <div className="rounded-lg border border-blue-600 bg-blue-900/30 px-4 py-3">
              <p className="text-xs font-semibold text-blue-300">
                {pokemon.primaryType} RANK
              </p>
              <p className="mt-1 text-2xl font-bold">
                {primaryTypeRank ? `#${primaryTypeRank}` : "—"}
              </p>
            </div>

            {pokemon.secondaryType && (
              <div className="rounded-lg border border-purple-600 bg-purple-900/30 px-4 py-3">
                <p className="text-xs font-semibold text-purple-300">
                  {pokemon.secondaryType} RANK
                </p>
                <p className="mt-1 text-2xl font-bold">
                  {secondaryTypeRank
                    ? `#${secondaryTypeRank}`
                    : "—"}
                </p>
              </div>
            )}

<div className="rounded-lg border border-emerald-600 bg-emerald-900/30 px-4 py-3">
  <p className="text-xs font-semibold text-emerald-300">
    MASTER LEAGUE RANK
  </p>

  <p className="mt-1 text-2xl font-bold">
    {metaRank ? `#${metaRank}` : "—"}
  </p>

  {masterLeagueEntry && (
    <p className="mt-1 text-xs text-emerald-300">
      PvPoke Score {masterLeagueEntry.score}
    </p>
  )}
</div>

            <div className="rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-3">
              <p className="text-xs font-semibold text-zinc-400">
                TIER
              </p>
              <p className="mt-1 text-2xl font-bold">
                {pokemon.tier}
              </p>
            </div>
          </div>
        </header>

        <section className="mb-8">
  <h2 className="mb-4 text-2xl font-bold">
    Overview and Build Configuration
  </h2>

  <div className="grid gap-6 lg:grid-cols-2">
    <PokemonArtworkCard
      artworkUrl={artworkUrl}
      displayName={pokemon.displayName}
      primaryType={pokemon.primaryType}
      secondaryType={pokemon.secondaryType}
    />


            <PerformancePanel
              displayName={pokemon.displayName}
              currentName={pokemon.name}
              formOptions={formOptions}
              primaryType={pokemon.primaryType}
              secondaryType={pokemon.secondaryType}
              attack={pokemon.attack}
              defense={pokemon.defense}
              stamina={pokemon.stamina}
              overallRank={pokemon.overallRank}
              allPsvScores={rankings.map((entry) => entry.psv)}
              psv={pokemon.psv}
              dps={pokemon.dps}
              dbd={pokemon.dbd}
              charge={pokemon.charge}
              bestFastMove={pokemon.bestFastMove}
              bestChargedMove={pokemon.bestChargedMove}
              fastMoves={movePool?.fastMoves ?? []}
              chargedMoves={movePool?.chargedMoves ?? []}
            />
          </div>
        </section>

        <RaidAnalysisPanel currentName={pokemon.name} />

        <PvpAnalysisPanel
  currentName={pokemon.name}
  pokemonId={pokemon.pokemonId}
  form={pokemon.form}
  attack={pokemon.attack}
  defense={pokemon.defense}
  stamina={pokemon.stamina}
/>
<MaxBattleAnalysisPanel
  displayName={pokemon.displayName}
  pokemonId={pokemon.pokemonId}
  form={pokemon.form}
  attack={pokemon.attack}
  defense={pokemon.defense}
  stamina={pokemon.stamina}
  fastMoves={movePool?.fastMoves ?? []}
/>
      </div>
    </main>
  );
}
