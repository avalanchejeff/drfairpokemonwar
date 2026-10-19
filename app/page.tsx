"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import rankings from "./data/benchmarkRankings2026.json";

type SortKey = "rank" | "name" | "type" | "tier" | "psv";
type SortDirection = "asc" | "desc";

const tierOrder: Record<string, number> = {
  God: 1,
  "S+": 2,
  S: 3,
  A: 4,
  B: 5,
  C: 6,
  D: 7,
};

export default function Home() {
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    rankings.forEach((pokemon) => {
      if (pokemon.primaryType) types.add(pokemon.primaryType);
      if (pokemon.secondaryType) types.add(pokemon.secondaryType);
    });
    return ["ALL", ...Array.from(types).sort()];
  }, []);

  const filteredPokemon = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rankings.filter((pokemon) => {
      const matchesSearch = query === "" || pokemon.displayName.toLowerCase().includes(query);
      const matchesType = selectedType === "ALL" || pokemon.primaryType === selectedType || pokemon.secondaryType === selectedType;
      return matchesSearch && matchesType;
    });
  }, [search, selectedType]);

  const champions = useMemo(() => filteredPokemon.slice().sort((a, b) => a.overallRank - b.overallRank).slice(0, 10), [filteredPokemon]);

  const leaderboard = useMemo(() => {
    const sorted = filteredPokemon.slice();
    sorted.sort((a, b) => {
      let comparison = 0;
      if (sortKey === "rank") comparison = a.overallRank - b.overallRank;
      else if (sortKey === "name") comparison = a.displayName.localeCompare(b.displayName);
      else if (sortKey === "type") comparison = a.primaryType.localeCompare(b.primaryType);
      else if (sortKey === "tier") comparison = (tierOrder[a.tier] ?? 99) - (tierOrder[b.tier] ?? 99);
      else if (sortKey === "psv") comparison = a.psv - b.psv;
      if (comparison === 0) comparison = a.overallRank - b.overallRank;
      return sortDirection === "asc" ? comparison : -comparison;
    });
    return sorted;
  }, [filteredPokemon, sortKey, sortDirection]);

  function handleSort(nextSortKey: SortKey) {
    if (sortKey === nextSortKey) {
      setSortDirection((current) => current === "asc" ? "desc" : "asc");
      return;
    }
    setSortKey(nextSortKey);
    setSortDirection(nextSortKey === "psv" ? "desc" : "asc");
  }

  function sortIndicator(column: SortKey) {
    if (sortKey !== column) return "";
    return sortDirection === "asc" ? " ▲" : " ▼";
  }

  return (
    <main className="min-h-screen bg-zinc-900 p-8 text-white">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-5xl font-bold">Pokémon Analytics</h1>
        <p className="mt-3 text-zinc-400">Search the rankings, filter by type, and select leaderboard headers to sort.</p>

        <Link href="/lab" className="group mt-8 block overflow-hidden rounded-2xl border border-cyan-700 bg-gradient-to-r from-cyan-950/60 via-zinc-800 to-zinc-800 p-6 transition hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-950/40">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-400">Research & Assessment</div>
              <h2 className="mt-2 text-3xl font-black">🔬 Dr. Fair&apos;s Lab</h2>
              <p className="mt-2 max-w-3xl text-zinc-300">Assess your Pokémon, discover its true value, or compare Pokémon side by side.</p>
            </div>
            <div className="shrink-0 rounded-xl border border-cyan-700 bg-cyan-950/60 px-5 py-3 font-bold text-cyan-200 transition group-hover:border-cyan-400 group-hover:text-white">Enter the Lab →</div>
          </div>
        </Link>

        <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search Pokémon..." className="mt-8 w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 outline-none focus:border-yellow-500" />

        <h2 className="mb-2 mt-10 text-4xl font-bold">🏆 Champions Hall</h2>
        <p className="text-zinc-400">Top 10 Pokémon for the selected type</p>

        <div className="mt-5 flex flex-wrap gap-2">
          {availableTypes.map((type) => {
            const isSelected = selectedType === type;
            return <button key={type} type="button" onClick={() => setSelectedType(type)} className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${isSelected ? "border-yellow-300 bg-yellow-500 text-black" : "border-zinc-700 bg-zinc-800 text-zinc-200 hover:border-yellow-500"}`}>{type === "ALL" ? "All Types" : type}</button>;
          })}
        </div>

        {champions.length > 0 ? (
          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-5">
            {champions.map((pokemon) => (
              <Link key={pokemon.name} href={`/pokemon/${pokemon.name}`} className="block rounded-xl border border-yellow-500 bg-zinc-800 p-4 transition hover:scale-105 hover:border-yellow-300">
                <div className="font-bold text-yellow-400">#{pokemon.overallRank}</div>
                <div className="mt-2 text-lg font-bold">{pokemon.displayName}</div>
                <div className="mt-1 text-sm text-zinc-400">{[pokemon.primaryType, pokemon.secondaryType].filter(Boolean).join(" / ")}</div>
                <div className="mt-1 text-zinc-400">Tier: {pokemon.tier}</div>
                <div className="mt-2 font-semibold">PSV {Number(pokemon.psv).toFixed(2)}</div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-xl border border-zinc-700 bg-zinc-800 p-6 text-zinc-400">No Pokémon match the current search and type.</div>
        )}

        <div className="mb-4 mt-14">
          <h2 className="text-4xl font-bold">Full Leaderboard</h2>
          <p className="mt-2 text-zinc-400">Showing {leaderboard.length} Pokémon for the selected type. Select a column header to sort.</p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-zinc-700 bg-zinc-800">
          <div className="min-w-[760px]">
            <div className="grid grid-cols-[90px_2fr_1fr_1fr_1fr] bg-zinc-700 font-bold">
              <button type="button" onClick={() => handleSort("rank")} className="p-4 text-left hover:bg-zinc-600">Rank{sortIndicator("rank")}</button>
              <button type="button" onClick={() => handleSort("name")} className="p-4 text-left hover:bg-zinc-600">Pokémon{sortIndicator("name")}</button>
              <button type="button" onClick={() => handleSort("type")} className="p-4 text-left hover:bg-zinc-600">Type{sortIndicator("type")}</button>
              <button type="button" onClick={() => handleSort("tier")} className="p-4 text-left hover:bg-zinc-600">Tier{sortIndicator("tier")}</button>
              <button type="button" onClick={() => handleSort("psv")} className="p-4 text-left hover:bg-zinc-600">PSV{sortIndicator("psv")}</button>
            </div>

            {leaderboard.map((pokemon) => (
              <Link key={pokemon.name} href={`/pokemon/${pokemon.name}`} className="grid grid-cols-[90px_2fr_1fr_1fr_1fr] border-t border-zinc-700 p-4 transition hover:bg-zinc-700/70">
                <div>#{pokemon.overallRank}</div>
                <div className="font-semibold">{pokemon.displayName}</div>
                <div>{pokemon.primaryType}</div>
                <div>{pokemon.tier}</div>
                <div>{Number(pokemon.psv).toFixed(2)}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
