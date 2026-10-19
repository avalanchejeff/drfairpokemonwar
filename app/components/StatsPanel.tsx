export default function StatsPanel() {
    return (
      <div className="bg-zinc-800 rounded-2xl p-8 text-white border border-cyan-500">
  
        <h2 className="text-3xl font-bold text-cyan-300 mb-6">
          WAR Analytics
        </h2>
  
        <div className="grid grid-cols-2 gap-4">
  
          <div className="bg-zinc-700 p-4 rounded-xl">
            <div className="text-sm text-gray-400">
              WAR Score
            </div>
            <div className="text-3xl font-bold text-yellow-400">
              99.2
            </div>
          </div>
  
          <div className="bg-zinc-700 p-4 rounded-xl">
            <div className="text-sm text-gray-400">
              PvE Score
            </div>
            <div className="text-3xl font-bold text-green-400">
              98.7
            </div>
          </div>
  
          <div className="bg-zinc-700 p-4 rounded-xl">
            <div className="text-sm text-gray-400">
              PvP Score
            </div>
            <div className="text-3xl font-bold text-red-400">
              94.5
            </div>
          </div>
  
          <div className="bg-zinc-700 p-4 rounded-xl">
            <div className="text-sm text-gray-400">
              Apex Score
            </div>
            <div className="text-3xl font-bold text-cyan-400">
              100
            </div>
          </div>
  
        </div>
  
        <div className="mt-6 bg-zinc-700 p-4 rounded-xl">
          <div className="text-gray-400">
            Best Role
          </div>
  
          <div className="text-2xl font-bold text-cyan-300">
            Master League Closer
          </div>
        </div>
  
      </div>
    );
  }