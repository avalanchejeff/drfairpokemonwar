type PokemonArtworkCardProps = {
    artworkUrl: string | null;
    displayName: string;
    primaryType: string;
    secondaryType: string | null;
  };
  
  export default function PokemonArtworkCard({
    artworkUrl,
    displayName,
    primaryType,
    secondaryType,
  }: PokemonArtworkCardProps) {
    const types = [primaryType, secondaryType]
      .filter(Boolean)
      .join(" / ");
  
    return (
      <div className="flex min-h-[520px] flex-col overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900">
        <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-zinc-800 via-zinc-900 to-black p-8">
          {artworkUrl ? (
            <img
              src={artworkUrl}
              alt={displayName}
              className="max-h-[7200px] w-full object-contain"
            />
          ) : (
            <div className="text-center text-zinc-500">
              <div className="text-7xl font-black">
                {displayName.charAt(0)}
              </div>
              <p className="mt-4">Artwork unavailable</p>
            </div>
          )}
        </div>
  
        <div className="border-t border-zinc-700 bg-zinc-950 p-5 text-center">
          <h3 className="text-3xl font-black">{displayName}</h3>
          <p className="mt-2 font-semibold text-cyan-300">{types}</p>
        </div>
      </div>
    );
  }
  