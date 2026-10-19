import React from "react";

type TierBadgeProps = {
  tier?: "god" | "splus" | "s" | "a" | "b" | "c" | "d";
  pokemonName?: string;
  pokemonImage?: string;
  pokemonInitial?: string;
};

export default function TierBadge({
  tier = "god",
  pokemonName = "Kyogre",
  pokemonImage,
  pokemonInitial = "K",
}: TierBadgeProps) {

  const pokemonCenterpiece = pokemonImage ? (
    <span>{pokemonImage}</span>
  ) : (
    <span className="text-4xl font-black">
      {pokemonInitial}
    </span>
  );

  if (tier === "god") {
    return (
        <div className="absolute -left-7 -top-2 z-10 h-36 w-36">
        <div className="absolute inset-6 rounded-full bg-yellow-400/50 blur-2xl" />
  
        {React.createElement("img", { src: "/crests/god-mewtwo.png", alt: "Mewtwo God Tier crest", className: "relative z-10 h-full w-full object-contain" })}
      </div>
    );
  }
  if (tier === "a") {
      return (
        <div className="absolute left-4 top-4 z-10 h-40 w-32">
          <div
            className="absolute inset-0 border-8 border-red-700 bg-white shadow-xl"
            style={{
              clipPath:
                "polygon(50% 0%, 94% 12%, 90% 62%, 72% 83%, 50% 100%, 28% 83%, 10% 62%, 6% 12%)",
            }}
          />
  
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl font-black text-yellow-500">
            {pokemonCenterpiece}
            </span>
          </div>
        </div>
      );
    }
  
    if (tier === "b") {
      return (
        <div className="absolute left-4 top-4 z-10 h-40 w-32">
          <div
            className="absolute inset-0 border-8 border-zinc-600 bg-zinc-300 shadow-lg"
            style={{
              clipPath:
                "polygon(50% 0%, 94% 12%, 90% 62%, 72% 83%, 50% 100%, 28% 83%, 10% 62%, 6% 12%)",
            }}
          />
  
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl font-black text-zinc-600">
            {pokemonCenterpiece}
            </span>
          </div>
        </div>
      );
    }
  
    if (tier === "c") {
      return (
        <div className="absolute left-4 top-4 z-10 flex h-36 w-36 items-center justify-center rounded-full border-[10px] border-zinc-500 bg-white shadow-lg">
          <div className="absolute h-full w-2 bg-blue-700" />
  
          <div className="absolute h-2 w-full bg-blue-700" />
  
          <span className="relative z-10 rounded-full bg-white px-3 py-1 text-5xl font-black text-blue-700">
          {pokemonCenterpiece}
          </span>
        </div>
      );
    }
  
    if (tier === "d") {
      return (
        <div className="absolute left-4 top-4 z-10 flex h-36 w-36 items-center justify-center overflow-hidden rounded-full border-[10px] border-amber-950 bg-amber-700 shadow-lg">
          <div className="absolute left-0 right-0 top-1/2 h-4 -translate-y-1/2 bg-amber-950" />
  
          <div className="absolute left-1/2 top-0 h-full w-1 -translate-x-1/2 bg-amber-900" />
  
          <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-8 border-amber-950 bg-amber-200 text-xl font-black text-amber-950">
          {pokemonCenterpiece}
          </div>
        </div>
      );
    }
  
    const isGod = false;
const isSPlus = tier === "splus";
  
    const shieldColors = isGod
      ? "from-yellow-100 via-yellow-500 to-amber-950 border-yellow-100"
      : isSPlus
        ? "from-white via-slate-300 to-slate-800 border-white"
        : "from-orange-300 via-amber-700 to-orange-950 border-orange-200";
  
    const medalColors = isGod
      ? "from-yellow-100 via-yellow-500 to-amber-950 border-yellow-100"
      : isSPlus
        ? "from-white via-slate-300 to-slate-700 border-white"
        : "from-orange-200 via-amber-700 to-orange-950 border-orange-200";
  
    const swordColors = isGod
      ? "from-zinc-500 via-white to-zinc-400"
      : isSPlus
        ? "from-amber-700 via-yellow-200 to-amber-700"
        : "from-zinc-700 via-zinc-300 to-zinc-700";
  
    const tierLabel = isGod ? "GOD" : isSPlus ? "S+" : "S";
  
    return (
      <div className="absolute left-4 top-4 z-10 h-52 w-48">
        <div className="absolute inset-5 rounded-full bg-yellow-400/40 blur-2xl" />
  
        <div
          className={`absolute left-1/2 top-4 h-40 w-44 -translate-x-1/2 border-4 bg-gradient-to-br shadow-2xl ${shieldColors}`}
          style={{
            clipPath:
              "polygon(50% 0%, 78% 8%, 100% 28%, 88% 55%, 72% 78%, 50% 100%, 28% 78%, 12% 55%, 0% 28%, 22% 8%)",
          }}
        />
  
        <div
          className={`absolute left-[90px] top-12 z-20 h-24 w-3 origin-bottom rotate-45 rounded-t-full bg-gradient-to-r ${swordColors}`}
        >
          <div className="absolute -bottom-1 left-1/2 h-2 w-10 -translate-x-1/2 rounded-full bg-blue-300" />
  
          <div className="absolute -bottom-9 left-1/2 h-10 w-4 -translate-x-1/2 rounded-full bg-[repeating-linear-gradient(135deg,#1e3a8a_0px,#1e3a8a_4px,#60a5fa_4px,#60a5fa_8px)]" />
        </div>
  
        <div
          className={`absolute left-[90px] top-12 z-20 h-24 w-3 origin-bottom -rotate-45 rounded-t-full bg-gradient-to-r ${swordColors}`}
        >
          <div className="absolute -bottom-1 left-1/2 h-2 w-10 -translate-x-1/2 rounded-full bg-red-300" />
  
          <div className="absolute -bottom-9 left-1/2 h-10 w-4 -translate-x-1/2 rounded-full bg-[repeating-linear-gradient(135deg,#7f1d1d_0px,#7f1d1d_4px,#f87171_4px,#f87171_8px)]" />
        </div>
  
        <div
          className={`absolute left-1/2 top-[92px] z-30 flex h-24 w-24 -translate-x-1/2 flex-col items-center justify-center rounded-full border-4 bg-gradient-to-br text-black shadow-xl ${medalColors}`}
        >
          <span className="text-4xl font-black">
            {pokemonInitial}
          </span>
  
          <span className="text-[10px] font-black tracking-widest">
            {tierLabel}
          </span>
        </div>
      </div>
    );
  }