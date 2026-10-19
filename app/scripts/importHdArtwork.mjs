import fs from "node:fs/promises";
import path from "node:path";

const rankingsPath = "./app/data/benchmarkRankings2026.json";
const rawPath = "./app/data/pokemonRaw.json";
const outputDir = "./public/artwork/hd";
const indexPath = "./app/data/artworkIndexHD.json";
const treeUrl = "https://api.github.com/repos/HybridShivam/Pokemon/git/trees/master?recursive=1";
const rawBase = "https://raw.githubusercontent.com/HybridShivam/Pokemon/master/";

const rankings = JSON.parse(await fs.readFile(rankingsPath, "utf8"));
const rawPokemon = JSON.parse(await fs.readFile(rawPath, "utf8"));
const dexByPokemonId = new Map(rawPokemon.map((p) => [p.formId, p.dexNr]));

await fs.mkdir(outputDir, { recursive: true });

console.log("Loading HD artwork catalog...");
const treeResponse = await fetch(treeUrl, {
  headers: { "User-Agent": "war-dashboard-artwork-importer" },
});
if (!treeResponse.ok) {
  throw new Error(`GitHub catalog request failed: ${treeResponse.status}`);
}
const tree = await treeResponse.json();
const prefix = "assets/imagesHQ/";
const imageFiles = tree.tree
  .filter((item) => item.type === "blob" && item.path.startsWith(prefix) && /\.png$/i.test(item.path))
  .map((item) => item.path);

const filesByDex = new Map();
for (const file of imageFiles) {
  const name = path.basename(file);
  const match = name.match(/^(\d{4})(?:-(.+))?\.png$/i);
  if (!match) continue;
  const dex = match[1];
  const suffix = match[2] ?? "";
  const list = filesByDex.get(dex) ?? [];
  list.push({ file, name, suffix });
  filesByDex.set(dex, list);
}

function normalizeTokens(value) {
  return String(value ?? "")
    .toLowerCase()
    .replaceAll("forme", "")
    .replaceAll("female", "f")
    .replaceAll("male", "m")
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function desiredTokens(record) {
  let form = String(record.form ?? "NORMAL");
  const idPrefix = `${record.pokemonId}_`;
  if (form.startsWith(idPrefix)) form = form.slice(idPrefix.length);
  const tokens = normalizeTokens(form);
  return tokens.filter((token) => !["normal", "shadow", "purified"].includes(token));
}

function scoreCandidate(candidate, wanted) {
  const have = normalizeTokens(candidate.suffix);
  if (wanted.length === 0) return candidate.suffix === "" ? 1000 : -100;
  let score = 0;
  for (const token of wanted) {
    if (have.includes(token)) score += 20;
  }
  for (const token of have) {
    if (wanted.includes(token)) score += 5;
    else score -= 2;
  }
  if (have.join("-") === wanted.join("-")) score += 100;
  if (candidate.suffix === "") score -= 10;
  return score;
}

function selectArtwork(record) {
  const dexNumber = dexByPokemonId.get(record.pokemonId);
  if (!dexNumber) return null;
  const dex = String(dexNumber).padStart(4, "0");
  const candidates = filesByDex.get(dex) ?? [];
  if (candidates.length === 0) return null;
  const wanted = desiredTokens(record);
  const ranked = candidates
    .map((candidate) => ({ candidate, score: scoreCandidate(candidate, wanted) }))
    .sort((a, b) => b.score - a.score);
  if (ranked[0]?.score < 0) {
    return candidates.find((candidate) => candidate.suffix === "") ?? null;
  }
  return ranked[0]?.candidate ?? null;
}

const selectedBySlug = new Map();
const uniqueFiles = new Map();
const unmatched = [];

for (const record of rankings) {
  const selected = selectArtwork(record);
  if (!selected) {
    unmatched.push({ name: record.name, pokemonId: record.pokemonId, form: record.form });
    continue;
  }
  selectedBySlug.set(record.name, selected.name);
  uniqueFiles.set(selected.name, selected.file);
}

console.log(`Matched ${selectedBySlug.size} of ${rankings.length} ranking records.`);
console.log(`Downloading ${uniqueFiles.size} unique HD artwork files...`);

let downloaded = 0;
let skipped = 0;
let failed = 0;
for (const [fileName, remotePath] of uniqueFiles) {
  const destination = path.join(outputDir, fileName);
  try {
    await fs.access(destination);
    skipped += 1;
    continue;
  } catch {}

  const response = await fetch(rawBase + remotePath, {
    headers: { "User-Agent": "war-dashboard-artwork-importer" },
  });
  if (!response.ok) {
    console.warn(`Failed ${response.status}: ${fileName}`);
    failed += 1;
    continue;
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(destination, bytes);
  downloaded += 1;
  if (downloaded % 50 === 0) console.log(`Downloaded ${downloaded}...`);
}

const artworkIndex = {};
for (const [slug, fileName] of selectedBySlug) {
  artworkIndex[slug] = `/artwork/hd/${fileName}`;
}
await fs.writeFile(indexPath, JSON.stringify(artworkIndex, null, 2), "utf8");

console.log(`Downloaded: ${downloaded}`);
console.log(`Already present: ${skipped}`);
console.log(`Failed: ${failed}`);
console.log(`Unmatched ranking records: ${unmatched.length}`);
console.log("Created app/data/artworkIndexHD.json");
if (unmatched.length) console.table(unmatched.slice(0, 25));