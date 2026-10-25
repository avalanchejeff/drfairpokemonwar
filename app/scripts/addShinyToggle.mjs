import fs from "node:fs/promises";

const pagePath = "./app/lab/page.tsx";
const backupPath = "./app/lab/page.tsx.before-shiny-toggle";

let source = await fs.readFile(pagePath, "utf8");

function replaceOnce(search, replacement, label) {
  if (!source.includes(search)) {
    throw new Error(`Could not find ${label}. No changes were written.`);
  }
  source = source.replace(search, replacement);
}

replaceOnce(
  '  const [maxType, setMaxType] = useState("Standard");',
  '  const [isShiny, setIsShiny] = useState(false);\n  const [maxType, setMaxType] = useState("Standard");',
  "Max state"
);

const oldMaxBlock = `            <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center">
              <span className="shrink-0 text-sm font-bold text-zinc-300">
                Max
              </span>
              <div className="grid flex-1 grid-cols-3 gap-2">
                {["Standard", "Dynamax", "Gigantamax"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setMaxType(type)}
                    className={\`rounded-xl border px-3 py-3 text-sm font-bold transition \${
                      maxType === type
                        ? "border-cyan-400 bg-cyan-400/15 text-cyan-200"
                        : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500"
                    }\`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>`;

const newMaxBlock = `            <div className="mt-5 grid gap-4 lg:grid-cols-[0.55fr_1.45fr] lg:items-end">
              <div>
                <span className={label}>Special</span>
                <button
                  type="button"
                  aria-pressed={isShiny}
                  onClick={() => setIsShiny((current) => !current)}
                  className={\`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-bold transition \${
                    isShiny
                      ? "border-yellow-300 bg-yellow-400/15 text-yellow-200 shadow-sm shadow-yellow-950/50"
                      : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-yellow-500 hover:text-yellow-200"
                  }\`}
                >
                  {isShiny ? "✨ Shiny" : "☆ Shiny"}
                </button>
              </div>

              <div>
                <span className={label}>Max Capability</span>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {["Standard", "Dynamax", "Gigantamax"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setMaxType(type)}
                      className={\`rounded-xl border px-3 py-3 text-sm font-bold transition \${
                        maxType === type
                          ? "border-cyan-400 bg-cyan-400/15 text-cyan-200"
                          : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500"
                      }\`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>`;

replaceOnce(oldMaxBlock, newMaxBlock, "Max control block");

await fs.writeFile(backupPath, await fs.readFile(pagePath, "utf8"), "utf8");
await fs.writeFile(pagePath, source, "utf8");

console.log("Added Shiny specimen toggle to Dr. Fair's Lab.");
console.log("Shiny does not alter combat, PvP, Raid, or Max calculations.");
console.log("Backup:", backupPath);