export default function PokemonCard() {
    return (
      <div className="bg-zinc-800 rounded-2xl p-8 text-white border border-yellow-500">
  
        <div className="text-center text-yellow-400 text-3xl font-bold mb-6">
          GOD TIER
        </div>
  
        {/* Ribbon */}
        <div className="w-64 h-10 bg-yellow-500 mx-auto rounded-md mb-[-10px] shadow-lg"></div>
  
        {/* Shield */}
        <div
          className="
            w-60
            h-64
            mx-auto
            bg-gradient-to-b
            from-yellow-300
            to-yellow-700
            border-8
            border-yellow-400
            shadow-2xl
            relative
            z-10
            flex
            items-center
            justify-center
            text-center
            text-black
            font-bold
            rounded-t-3xl
            rounded-b-xl
          "
        >
          MEWTWO
        </div>
  
        <div className="text-center mt-8">
          <h2 className="text-4xl font-bold">
            Mewtwo
          </h2>
  
          <p className="text-purple-300 mt-2">
            Psychic Type
          </p>
  
          <p className="mt-6 text-yellow-300">
            #1 Overall WAR Rank
          </p>
        </div>
  
      </div>
    );
  }