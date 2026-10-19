import fs from "node:fs/promises";

const out = {};
const add = (mode, tier, names, extra = {}) => {
  for (const raw of names) {
    const key = raw.toUpperCase().replaceAll(" ", "_").replaceAll("-", "_");
    out[key] ??= { identity: key.includes("GIGANTAMAX") ? "GIGANTAMAX" : key.includes("CROWNED_") || key === "ETERNATUS_SPECIAL" ? "SPECIAL" : "DYNAMAX" };
    out[key][`${mode}Tier`] = tier;
    Object.assign(out[key], extra[raw] ?? {});
  }
};

add("attacker", "S", ["GIGANTAMAX_INTELEON","GIGANTAMAX_GENGAR","GIGANTAMAX_KINGLER","GIGANTAMAX_RILLABOOM","GIGANTAMAX_CINDERACE","GIGANTAMAX_MACHAMP","CROWNED_SWORD_ZACIAN"]);
add("attacker", "A", ["GIGANTAMAX_GRIMMSNARL","GIGANTAMAX_TOXTRICITY","GIGANTAMAX_CHARIZARD","GIGANTAMAX_VENUSAUR","GIGANTAMAX_SNORLAX","GIGANTAMAX_GARBODOR","ETERNATUS_SPECIAL","ALAKAZAM","GIGANTAMAX_BLASTOISE","LATIOS"]);
add("attacker", "B", ["GIGANTAMAX_BUTTERFREE","GIGANTAMAX_LAPRAS","DARMANITAN","INTELEON","GENGAR","ESPEON","METAGROSS","HYDREIGON","EXCADRILL","URSHIFU_RAPID_STRIKE","URSHIFU_SINGLE_STRIKE"]);
add("attacker", "C", ["ZAPDOS","MOLTRES","CROWNED_SHIELD_ZAMAZENTA","ELECTIVIRE","MAGMORTAR","FLAREON","WEAVILE","RHYPERIOR","RAIKOU","KINGLER","RILLABOOM","DURALUDON","HO_OH","CINDERACE","GLACEON"]);
add("attacker", "D", ["GYARADOS","GARDEVOIR","GALLADE","HATTERENE","ENTEI","MACHAMP","JOLTEON","DRAMPA","LATIAS","ARCANINE","GIGALITH","UNFEZANT","HITMONLEE","TOXTRICITY","CHARIZARD","PASSIMIAN","TSAREENA","KABUTOPS","CENTISKORCH"]);
add("attacker", "E", ["LEAFEON","GIGANTAMAX_PIKACHU","MESPRIT","OMASTAR","FLYGON","VAPOREON","SYLVEON","VENUSAUR","LUGIA","HITMONCHAN","RAICHU","FALINKS","GIGANTAMAX_MEOWTH","MILOTIC","ARTICUNO","CRYOGONAL","WALREIN","GARBODOR","SUICUNE","REGIROCK","REGICE","MALAMAR","WAILORD","HITMONTOP","BLASTOISE","BUTTERFREE","WHIMSICOTT","CORVIKNIGHT","SWOOBAT","GREEDENT","DUBWOOL","UXIE","VESPIQUEN","NOCTOWL","REGISTEEL","SABLEYE","BLISSEY","UMBREON"]);

const defenderMoves = {
  REGISTEEL:{defenderFastMoves:["Lock-On","Metal Claw"]}, CROWNED_SHIELD_ZAMAZENTA:{defenderFastMoves:["Metal Claw"]},
  CROWNED_SWORD_ZACIAN:{defenderFastMoves:["Metal Claw"]}, REGIROCK:{defenderFastMoves:["Lock-On"]}, METAGROSS:{defenderFastMoves:["Fury Cutter","Shadow Claw"]}, REGICE:{defenderFastMoves:["Lock-On"]}, LATIAS:{defenderFastMoves:["Dragon Breath"]},
  CORVIKNIGHT:{defenderFastMoves:["Sand Attack"]}, SUICUNE:{defenderFastMoves:["Water Gun"]}, DURALUDON:{defenderFastMoves:["Metal Claw"]}, OMASTAR:{defenderFastMoves:["Mud Shot","Water Gun"]}, LATIOS:{defenderFastMoves:["Dragon Breath"]},
  BLISSEY:{defenderFastMoves:["Pound"]}, CHARIZARD:{defenderFastMoves:["Dragon Breath"]}
};
add("defender", "S", ["REGISTEEL","CROWNED_SHIELD_ZAMAZENTA"], defenderMoves);
add("defender", "A", ["CROWNED_SWORD_ZACIAN","REGIROCK","METAGROSS","REGICE","LATIAS"], defenderMoves);
add("defender", "B", ["CORVIKNIGHT","SUICUNE","DURALUDON","OMASTAR","LATIOS"], defenderMoves);
add("defender", "C", ["HYDREIGON","KABUTOPS","BLISSEY","GYARADOS","ZAPDOS","BLASTOISE","GIGALITH","EXCADRILL","CHARIZARD","VENUSAUR","ARCANINE","RAIKOU","CENTISKORCH","URSHIFU_SINGLE_STRIKE","VESPIQUEN","CINDERACE","VAPOREON"], defenderMoves);
add("defender", "D", ["TOXTRICITY","RILLABOOM","LAPRAS","SNORLAX","DRAMPA","KINGLER","GALLADE","FLYGON","JOLTEON","DUBWOOL","HATTERENE","GENGAR","HITMONLEE"]);
add("defender", "E", ["ELECTIVIRE","GRIMMSNARL","DARMANITAN","GREEDENT","INTELEON","MALAMAR","ALAKAZAM","RAICHU","BUTTERFREE","WAILORD","SABLEYE","PIKACHU","MEOWTH"]);
add("defender", "F", ["LUGIA","SHUCKLE","ETERNATUS_SPECIAL","HO_OH","MILOTIC","RHYPERIOR","UMBREON","UXIE","ARTICUNO","ENTEI","SYLVEON","WALREIN","CRYOGONAL","MESPRIT","URSHIFU_RAPID_STRIKE","LEAFEON","GARDEVOIR","GLACEON","NOCTOWL","MOLTRES","PASSIMIAN","MACHAMP","GARBODOR","MAGMORTAR","HITMONTOP","WEAVILE","FLAREON","ESPEON","UNFEZANT","HITMONCHAN","AZELF","FALINKS","WHIMSICOTT","SWOOBAT"]);

add("healer", "S", ["BLISSEY"]);
add("healer", "A", ["WAILORD","SNORLAX","LAPRAS","VAPOREON","ETERNATUS_SPECIAL","GREEDENT","ENTEI","RHYPERIOR"]);
add("healer", "B", ["WALREIN","EXCADRILL","LUGIA","DARMANITAN","SUICUNE","URSHIFU_SINGLE_STRIKE","URSHIFU_RAPID_STRIKE","RILLABOOM","PASSIMIAN","NOCTOWL","CENTISKORCH","CORVIKNIGHT"]);
add("healer", "C", ["GYARADOS","UMBREON","SYLVEON","MILOTIC","GRIMMSNARL","HO_OH","HYDREIGON","ARTICUNO","RAIKOU","ZAPDOS","MOLTRES","MACHAMP","ARCANINE","MALAMAR","GIGALITH","CROWNED_SWORD_ZACIAN","CROWNED_SHIELD_ZAMAZENTA","LATIOS","LATIAS","METAGROSS","CRYOGONAL","VENUSAUR","CINDERACE","FLYGON","UNFEZANT","GARBODOR","REGIROCK","REGICE","REGISTEEL","MESPRIT"]);
add("healer", "D", ["BLASTOISE","CHARIZARD","DRAMPA","AZELF","UXIE","TOXTRICITY","ELECTIVIRE","MAGMORTAR","DUBWOOL","OMASTAR","DURALUDON","INTELEON","VESPIQUEN","WEAVILE","GALLADE","GARDEVOIR","SWOOBAT","FALINKS","JOLTEON","FLAREON","ESPEON","LEAFEON","GLACEON","KABUTOPS","GENGAR","WHIMSICOTT","RAICHU","BUTTERFREE","HATTERENE","ALAKAZAM","KINGLER","HITMONLEE","HITMONCHAN","HITMONTOP","SABLEYE","MEOWTH","PIKACHU","SHUCKLE"]);

const announced = {
  DIALGA: { identity: "DYNAMAX", status: "ANNOUNCED", debutDate: "2026-11-14" },
  PALKIA: { identity: "DYNAMAX", status: "ANNOUNCED", debutDate: "2026-11-15" },
  GIGANTAMAX_DURALUDON: { identity: "GIGANTAMAX", status: "ANNOUNCED", debutDate: "2026-11-14", debutEndDate: "2026-11-15" },
};
Object.entries(announced).forEach(([k, v]) => Object.assign(out[k] ??= {}, v));

const special = {
  CROWNED_SWORD_ZACIAN:{identity:"SPECIAL",specialAttack:"Behemoth Blade",specialType:"STEEL",canTransform:false},
  CROWNED_SHIELD_ZAMAZENTA:{identity:"SPECIAL",specialAttack:"Behemoth Bash",specialType:"STEEL",canTransform:false},
  ETERNATUS_SPECIAL:{identity:"SPECIAL",specialAttack:"Dynamax Cannon",specialType:"DRAGON",canTransform:false}
};
Object.entries(special).forEach(([k,v]) => Object.assign(out[k] ??= {}, v));

await fs.writeFile("./app/data/maxBattleRoles.json", JSON.stringify({
  metadata:{updated:"2026-10-16",tierScale:["S","A","B","C","D","E","F"],note:"Published role tiers; absence means not captured, not zero."},
  roles:out
}, null, 2));
console.log(`Created app/data/maxBattleRoles.json with ${Object.keys(out).length} role records.`);