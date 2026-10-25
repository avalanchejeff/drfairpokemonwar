"use client";

import { useState } from "react";

type PokemonArtworkCardProps = {
  artworkUrl: string | null;
  shinyArtworkUrl: string | null;
  displayName: string;
  primaryType: string;
  secondaryType: string | null;
};

export default function PokemonArtworkCard({
  artworkUrl,
  shinyArtworkUrl,
  displayName,
  primaryType,
  secondaryType,
}: PokemonArtworkCardProps) {
  const [showShiny, setShowShiny] = useState(false);
  const types = [primaryType, secondaryType].filter(Boolean).join(" / ");
  const activeArtworkUrl = showShiny && shinyArtworkUrl
    ? shinyArtworkUrl
    : artworkUrl;

  return (
    <div className="flex min-h-[520px] flex-col overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900">
      <div className="relative flex flex-1 items-center justify-center bg-gradient-to-br from-zinc-800 via-zinc-900 to-black p-8">
        {shinyArtworkUrl && (
          <div className="absolute right-4 top-4 z-10 flex rounded-xl border border-zinc-700 bg-black/70 p-1 backdrop-blur">
            <button
              type="button"
              onClick={() => setShowShiny(false)}
              className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
                !showShiny
                  ? "bg-cyan-400 text-black"
                  : "text-zinc-300 hover:bg-zinc-800"
              }`}
            >
              Normal
            </button>
            <button
              type="button"
              onClick={() => setShowShiny(true)}
              className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
                showShiny
                  ? "bg-yellow-400 text-black"
                  : "text-zinc-300 hover:bg-zinc-800"
              }`}
            >
              ✨ Shiny
            </button>
          </div>
        )}

        {activeArtworkUrl ? (
          <img
            src={activeArtworkUrl}
            alt={showShiny ? `Shiny ${displayName}` : displayName}
            className="max-h-[720px] w-full object-contain"
          />
        ) : (
          <div className="text-center text-zinc-500">
            <div className="text-7xl font-black">{displayName.charAt(0)}</div>
            <p className="mt-4">Artwork unavailable</p>
          </div>
        )}
      </div>

      <div className="border-t border-zinc-700 bg-zinc-950 p-5 text-center">
        <h3 className="text-3xl font-black">
          {showShiny ? `Shiny ${displayName}` : displayName}
        </h3>
        <p className="mt-2 font-semibold text-cyan-300">{types}</p>
      </div>
    </div>
  );
}
