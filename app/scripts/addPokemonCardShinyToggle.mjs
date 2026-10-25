import fs from "node:fs/promises";

const pagePath = "./app/pokemon/[name]/page.tsx";
const cardPath = "./app/components/PokemonArtworkCard.tsx";
const pageBackup = "./app/pokemon/[name]/page.tsx.before-shiny-toggle";
const cardBackup = "./app/components/PokemonArtworkCard.tsx.before-shiny-toggle";

let page = await fs.readFile(pagePath, "utf8");
const originalPage = page;
const originalCard = await fs.readFile(cardPath, "utf8");

function replaceOnce(source, search, replacement, label) {
  if (!source.includes(search)) {
    throw new Error(`Could not find ${label}. No files were changed.`);
  }
  return source.replace(search, replacement);
}

page = replaceOnce(
  page,
  "  let artworkUrl = extractArtworkUrl(artwork?.image);",
  `  let artworkUrl = extractArtworkUrl(artwork?.image);\n  const shinyArtworkUrl = extractArtworkUrl(artwork?.shinyImage);`,
  "normal artwork URL assignment"
);

page = replaceOnce(
  page,
  `    <PokemonArtworkCard\n      artworkUrl={artworkUrl}\n      displayName={pokemon.displayName}`,
  `    <PokemonArtworkCard\n      artworkUrl={artworkUrl}\n      shinyArtworkUrl={shinyArtworkUrl}\n      displayName={pokemon.displayName}`,
  "PokemonArtworkCard call"
);

const card = `"use client";\n\nimport { useState } from "react";\n\ntype PokemonArtworkCardProps = {\n  artworkUrl: string | null;\n  shinyArtworkUrl: string | null;\n  displayName: string;\n  primaryType: string;\n  secondaryType: string | null;\n};\n\nexport default function PokemonArtworkCard({\n  artworkUrl,\n  shinyArtworkUrl,\n  displayName,\n  primaryType,\n  secondaryType,\n}: PokemonArtworkCardProps) {\n  const [showShiny, setShowShiny] = useState(false);\n  const types = [primaryType, secondaryType].filter(Boolean).join(" / ");\n  const activeArtworkUrl = showShiny && shinyArtworkUrl\n    ? shinyArtworkUrl\n    : artworkUrl;\n\n  return (\n    <div className="flex min-h-[520px] flex-col overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900">\n      <div className="relative flex flex-1 items-center justify-center bg-gradient-to-br from-zinc-800 via-zinc-900 to-black p-8">\n        {shinyArtworkUrl && (\n          <div className="absolute right-4 top-4 z-10 flex rounded-xl border border-zinc-700 bg-black/70 p-1 backdrop-blur">\n            <button\n              type="button"\n              onClick={() => setShowShiny(false)}\n              className={\`rounded-lg px-3 py-2 text-xs font-bold transition \${\n                !showShiny\n                  ? "bg-cyan-400 text-black"\n                  : "text-zinc-300 hover:bg-zinc-800"\n              }\`}\n            >\n              Normal\n            </button>\n            <button\n              type="button"\n              onClick={() => setShowShiny(true)}\n              className={\`rounded-lg px-3 py-2 text-xs font-bold transition \${\n                showShiny\n                  ? "bg-yellow-400 text-black"\n                  : "text-zinc-300 hover:bg-zinc-800"\n              }\`}\n            >\n              ✨ Shiny\n            </button>\n          </div>\n        )}\n\n        {activeArtworkUrl ? (\n          <img\n            src={activeArtworkUrl}\n            alt={showShiny ? \`Shiny \${displayName}\` : displayName}\n            className="max-h-[720px] w-full object-contain"\n          />\n        ) : (\n          <div className="text-center text-zinc-500">\n            <div className="text-7xl font-black">{displayName.charAt(0)}</div>\n            <p className="mt-4">Artwork unavailable</p>\n          </div>\n        )}\n      </div>\n\n      <div className="border-t border-zinc-700 bg-zinc-950 p-5 text-center">\n        <h3 className="text-3xl font-black">\n          {showShiny ? \`Shiny \${displayName}\` : displayName}\n        </h3>\n        <p className="mt-2 font-semibold text-cyan-300">{types}</p>\n      </div>\n    </div>\n  );\n}\n`;

await fs.writeFile(pageBackup, originalPage, "utf8");
await fs.writeFile(cardBackup, originalCard, "utf8");
await fs.writeFile(pagePath, page, "utf8");
await fs.writeFile(cardPath, card, "utf8");

console.log("Added functional Normal / Shiny artwork toggle.");
console.log("Updated:", pagePath);
console.log("Updated:", cardPath);
console.log("Backups:", pageBackup, "and", cardBackup);