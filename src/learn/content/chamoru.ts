/** HåfaGPT canonical vocabulary, commit 609a8eb. Exported 2026-10-25.
 * Only source_backed entries. Teaching spelling is copied verbatim; no pronunciation guides or audio.
 * Dictionary citations support spelling; native-speaker/educator review remains useful before public release.
 */
export type ChamoruWord = {
  id: string; term: string; english: string;
  category: "colors" | "numbers" | "food" | "body_parts" | "family" | "greetings";
  skill: string; sourceNote: string;
};
export const chamoruWords: readonly ChamoruWord[] = [
  {
    "id": "colors.white",
    "term": "Å'paka'",
    "english": "White",
    "category": "colors",
    "skill": "ch.colors",
    "sourceNote": "revised_and_updated_chamorro_dictionary.json — å'paka'; chamoru_info_dictionary.json — å'paka'"
  },
  {
    "id": "colors.red",
    "term": "Agaga'",
    "english": "Red",
    "category": "colors",
    "skill": "ch.colors",
    "sourceNote": "revised_and_updated_chamorro_dictionary.json — agaga'; chamoru_info_dictionary.json — agaga'; chamorro_english_dictionary_TOD.json — agaga'"
  },
  {
    "id": "colors.yellow",
    "term": "Amariyu",
    "english": "Yellow",
    "category": "colors",
    "skill": "ch.colors",
    "sourceNote": "revised_and_updated_chamorro_dictionary.json — amariyu; chamoru_info_dictionary.json — åmariyu; chamorro_english_dictionary_TOD.json — amariyu"
  },
  {
    "id": "colors.blue",
    "term": "Asut",
    "english": "Blue",
    "category": "colors",
    "skill": "ch.colors",
    "sourceNote": "revised_and_updated_chamorro_dictionary.json — asút; chamorro_english_dictionary_TOD.json — asut"
  },
  {
    "id": "colors.green",
    "term": "Betde",
    "english": "Green",
    "category": "colors",
    "skill": "ch.colors",
    "sourceNote": "revised_and_updated_chamorro_dictionary.json — betdi; chamorro_english_dictionary_TOD.json — betde; chamoru_info_dictionary.json — betde"
  },
  {
    "id": "colors.black",
    "term": "Åttilung",
    "english": "Black",
    "category": "colors",
    "skill": "ch.colors",
    "sourceNote": "revised_and_updated_chamorro_dictionary.json — åttilung; chamoru_info_dictionary.json — åttilong; chamorro_english_dictionary_TOD.json — attilong"
  },
  {
    "id": "colors.brown",
    "term": "Kulot chukulåti",
    "english": "Brown",
    "category": "colors",
    "skill": "ch.colors",
    "sourceNote": "revised_and_updated_chamorro_dictionary.json — kulót chukulåti; chamoru_info_dictionary.json — kulot chikolåti; chamorro_english_dictionary_TOD.json — kulot chikolati"
  },
  {
    "id": "colors.pink",
    "term": "Kulot di rosa",
    "english": "Pink",
    "category": "colors",
    "skill": "ch.colors",
    "sourceNote": "revised_and_updated_chamorro_dictionary.json — kulót di rosa; chamoru_info_dictionary.json — kulot di rosa; chamorro_english_dictionary_TOD.json — kulot di rosa"
  },
  {
    "id": "colors.gray",
    "term": "Kulot åpu",
    "english": "Gray",
    "category": "colors",
    "skill": "ch.colors",
    "sourceNote": "revised_and_updated_chamorro_dictionary.json — kulót åpu; chamoru_info_dictionary.json — kulot åpu; chamorro_english_dictionary_TOD.json — kulot apu"
  },
  {
    "id": "colors.orange",
    "term": "Kulot kåhet",
    "english": "Orange",
    "category": "colors",
    "skill": "ch.colors",
    "sourceNote": "revised_and_updated_chamorro_dictionary.json — kulót kåhit; chamoru_info_dictionary.json — kulot kåhet; chamorro_english_dictionary_TOD.json — kulot kahet"
  },
  {
    "id": "colors.purple",
    "term": "Kulot lila",
    "english": "Purple",
    "category": "colors",
    "skill": "ch.colors",
    "sourceNote": "revised_and_updated_chamorro_dictionary.json — kulót lila; revised_and_updated_chamorro_dictionary.json — lila; chamoru_info_dictionary.json — kulot lila; chamorro_english_dictionary_TOD.json — kulot lila"
  },
  {
    "id": "numbers.one",
    "term": "Unu",
    "english": "One",
    "category": "numbers",
    "skill": "ch.numbers",
    "sourceNote": "revised_and_updated_chamorro_dictionary.json — unu; chamorro_english_dictionary_TOD.json — unu"
  },
  {
    "id": "numbers.two",
    "term": "Dos",
    "english": "Two",
    "category": "numbers",
    "skill": "ch.numbers",
    "sourceNote": "revised_and_updated_chamorro_dictionary.json — dos; chamoru_info_dictionary.json — dos; chamorro_english_dictionary_TOD.json — dos"
  },
  {
    "id": "numbers.three",
    "term": "Tres",
    "english": "Three",
    "category": "numbers",
    "skill": "ch.numbers",
    "sourceNote": "revised_and_updated_chamorro_dictionary.json — tres; chamoru_info_dictionary.json — tres; chamorro_english_dictionary_TOD.json — tres"
  },
  {
    "id": "numbers.four",
    "term": "Kuåtro",
    "english": "Four",
    "category": "numbers",
    "skill": "ch.numbers",
    "sourceNote": "chamoru_info_dictionary.json — kuåtro; chamorro_english_dictionary_TOD.json — kuatro; revised_and_updated_chamorro_dictionary.json — kuåttru"
  },
  {
    "id": "numbers.five",
    "term": "Sinko",
    "english": "Five",
    "category": "numbers",
    "skill": "ch.numbers",
    "sourceNote": "chamoru_info_dictionary.json — sinko; chamorro_english_dictionary_TOD.json — sinko; revised_and_updated_chamorro_dictionary.json — singku"
  },
  {
    "id": "numbers.six",
    "term": "Sais",
    "english": "Six",
    "category": "numbers",
    "skill": "ch.numbers",
    "sourceNote": "revised_and_updated_chamorro_dictionary.json — sais; chamoru_info_dictionary.json — sais; chamorro_english_dictionary_TOD.json — sais"
  },
  {
    "id": "numbers.seven",
    "term": "Siete",
    "english": "Seven",
    "category": "numbers",
    "skill": "ch.numbers",
    "sourceNote": "chamoru_info_dictionary.json — siete; chamorro_english_dictionary_TOD.json — siete; revised_and_updated_chamorro_dictionary.json — sietti"
  },
  {
    "id": "numbers.eight",
    "term": "Ocho",
    "english": "Eight",
    "category": "numbers",
    "skill": "ch.numbers",
    "sourceNote": "chamoru_info_dictionary.json — ocho; chamorro_english_dictionary_TOD.json — ocho"
  },
  {
    "id": "numbers.nine",
    "term": "Nuebi",
    "english": "Nine",
    "category": "numbers",
    "skill": "ch.numbers",
    "sourceNote": "revised_and_updated_chamorro_dictionary.json — nuebi; chamoru_info_dictionary.json — nuebi; chamorro_english_dictionary_TOD.json — nuebi"
  },
  {
    "id": "numbers.ten",
    "term": "Dies",
    "english": "Ten",
    "category": "numbers",
    "skill": "ch.numbers",
    "sourceNote": "revised_and_updated_chamorro_dictionary.json — dies; chamoru_info_dictionary.json — dies; chamorro_english_dictionary_TOD.json — dies"
  },
  {
    "id": "food.cooked_rice",
    "term": "Hineksa'",
    "english": "Cooked rice",
    "category": "food",
    "skill": "ch.food",
    "sourceNote": "revised_and_updated_chamorro_dictionary.json — hineksa'; chamoru_info_dictionary.json — hineksa'; chamorro_english_dictionary_TOD.json — hineksa'"
  },
  {
    "id": "food.fish",
    "term": "Guihan",
    "english": "Fish",
    "category": "food",
    "skill": "ch.food",
    "sourceNote": "revised_and_updated_chamorro_dictionary.json — guihan; chamoru_info_dictionary.json — guihan; chamorro_english_dictionary_TOD.json — guihan"
  },
  {
    "id": "food.chicken",
    "term": "Månnok",
    "english": "Chicken / poultry",
    "category": "food",
    "skill": "ch.food",
    "sourceNote": "chamoru_info_dictionary.json — månnok; chamorro_english_dictionary_TOD.json — mannok; revised_and_updated_chamorro_dictionary.json — månnuk"
  },
  {
    "id": "food.green_coconut",
    "term": "Månha",
    "english": "Green coconut",
    "category": "food",
    "skill": "ch.food",
    "sourceNote": "revised_and_updated_chamorro_dictionary.json — månha; chamoru_info_dictionary.json — månha; chamorro_english_dictionary_TOD.json — manha"
  },
  {
    "id": "food.soup_stew",
    "term": "Kåddo",
    "english": "Soup / broth / stew",
    "category": "food",
    "skill": "ch.food",
    "sourceNote": "chamoru_info_dictionary.json — kaddo; chamorro_english_dictionary_TOD.json — kaddo; revised_and_updated_chamorro_dictionary.json — kåddu; revised_and_updated_chamorro_dictionary.json — kåtdu"
  },
  {
    "id": "food.vegetable",
    "term": "Gollai",
    "english": "Vegetable(s)",
    "category": "food",
    "skill": "ch.food",
    "sourceNote": "revised_and_updated_chamorro_dictionary.json — gollai; chamoru_info_dictionary.json — gollai; chamorro_english_dictionary_TOD.json — gollai"
  },
  {
    "id": "food.water",
    "term": "Hånom",
    "english": "Water / liquid",
    "category": "food",
    "skill": "ch.food",
    "sourceNote": "chamoru_info_dictionary.json — hånom; chamorro_english_dictionary_TOD.json — hanom; revised_and_updated_chamorro_dictionary.json — hånum"
  },
  {
    "id": "food.green_banana",
    "term": "Chotda",
    "english": "Green banana / banana tree",
    "category": "food",
    "skill": "ch.food",
    "sourceNote": "revised_and_updated_chamorro_dictionary.json — chotda; chamoru_info_dictionary.json — chotda; chamorro_english_dictionary_TOD.json — chotda"
  },
  {
    "id": "food.mango",
    "term": "Mångga",
    "english": "Mango",
    "category": "food",
    "skill": "ch.food",
    "sourceNote": "chamoru_info_dictionary.json — mångga; chamorro_english_dictionary_TOD.json — mangga"
  },
  {
    "id": "food.egg",
    "term": "Chåda'",
    "english": "Egg",
    "category": "food",
    "skill": "ch.food",
    "sourceNote": "revised_and_updated_chamorro_dictionary.json — chåda'; chamoru_info_dictionary.json — chåda'; chamorro_english_dictionary_TOD.json — chada'"
  },
  {
    "id": "body_parts.head",
    "term": "Ulu",
    "english": "Head",
    "category": "body_parts",
    "skill": "ch.body",
    "sourceNote": "revised_and_updated_chamorro_dictionary.json — ulu; chamoru_info_dictionary.json — ulu; chamorro_english_dictionary_TOD.json — ulu"
  },
  {
    "id": "body_parts.eye",
    "term": "Åtadok",
    "english": "Eye / eyeball",
    "category": "body_parts",
    "skill": "ch.body",
    "sourceNote": "chamoru_info_dictionary.json — åtadok; chamorro_english_dictionary_TOD.json — atadok; revised_and_updated_chamorro_dictionary.json — åtaduk"
  },
  {
    "id": "body_parts.ear",
    "term": "Talanga",
    "english": "Ear",
    "category": "body_parts",
    "skill": "ch.body",
    "sourceNote": "revised_and_updated_chamorro_dictionary.json — talanga; chamoru_info_dictionary.json — talanga; chamorro_english_dictionary_TOD.json — talanga"
  },
  {
    "id": "body_parts.nose",
    "term": "Gui'eng",
    "english": "Nose",
    "category": "body_parts",
    "skill": "ch.body",
    "sourceNote": "chamoru_info_dictionary.json — gui'eng; chamorro_english_dictionary_TOD.json — gui'eng; revised_and_updated_chamorro_dictionary.json — gui'ing"
  },
  {
    "id": "body_parts.mouth",
    "term": "Pachot",
    "english": "Mouth",
    "category": "body_parts",
    "skill": "ch.body",
    "sourceNote": "chamoru_info_dictionary.json — påchot; chamorro_english_dictionary_TOD.json — pachot; revised_and_updated_chamorro_dictionary.json — påchut"
  },
  {
    "id": "body_parts.hand",
    "term": "Kannai",
    "english": "Hand / arm up to shoulder",
    "category": "body_parts",
    "skill": "ch.body",
    "sourceNote": "revised_and_updated_chamorro_dictionary.json — kånnai; chamoru_info_dictionary.json — kånnai; chamorro_english_dictionary_TOD.json — kannai"
  },
  {
    "id": "body_parts.foot",
    "term": "Addeng",
    "english": "Foot / feet / human leg",
    "category": "body_parts",
    "skill": "ch.body",
    "sourceNote": "chamoru_info_dictionary.json — addeng; chamorro_english_dictionary_TOD.json — addeng; revised_and_updated_chamorro_dictionary.json — ådding"
  },
  {
    "id": "body_parts.heart",
    "term": "Korason",
    "english": "Heart",
    "category": "body_parts",
    "skill": "ch.body",
    "sourceNote": "chamoru_info_dictionary.json — koråson; chamorro_english_dictionary_TOD.json — korason; revised_and_updated_chamorro_dictionary.json — kurasón"
  },
  {
    "id": "family.family",
    "term": "Familia",
    "english": "Family",
    "category": "family",
    "skill": "ch.family",
    "sourceNote": "revised_and_updated_chamorro_dictionary.json — familia; chamoru_info_dictionary.json — fåmilia; chamorro_english_dictionary_TOD.json — familia"
  },
  {
    "id": "family.mother",
    "term": "Nåna",
    "english": "Mother / mom",
    "category": "family",
    "skill": "ch.family",
    "sourceNote": "Chamoru.info online dictionary — nåna; Post Guam - Si Nana gi familia — nana"
  },
  {
    "id": "family.father",
    "term": "Tåta",
    "english": "Father / dad",
    "category": "family",
    "skill": "ch.family",
    "sourceNote": "revised_and_updated_chamorro_dictionary.json — tåta; chamoru_info_dictionary.json — tåtå; chamorro_english_dictionary_TOD.json — tata"
  },
  {
    "id": "family.sibling",
    "term": "Che'lu",
    "english": "Sibling / brother / sister",
    "category": "family",
    "skill": "ch.family",
    "sourceNote": "revised_and_updated_chamorro_dictionary.json — che'lu; chamoru_info_dictionary.json — che'lu; chamorro_english_dictionary_TOD.json — che'lu"
  },
  {
    "id": "family.grandmother_guella",
    "term": "Guella",
    "english": "Grandmother / female ancestor",
    "category": "family",
    "skill": "ch.family",
    "sourceNote": "revised_and_updated_chamorro_dictionary.json — guella; chamoru_info_dictionary.json — guella; chamorro_english_dictionary_TOD.json — guella"
  },
  {
    "id": "family.grandfather_guello",
    "term": "Guello",
    "english": "Grandfather",
    "category": "family",
    "skill": "ch.family",
    "sourceNote": "chamoru_info_dictionary.json — guello; chamorro_english_dictionary_TOD.json — guello"
  },
  {
    "id": "family.child",
    "term": "Påtgon",
    "english": "Child / infant / kid / baby",
    "category": "family",
    "skill": "ch.family",
    "sourceNote": "chamoru_info_dictionary.json — påtgon; chamorro_english_dictionary_TOD.json — patgon"
  },
  {
    "id": "family.children",
    "term": "Famagu'on",
    "english": "Children / kids",
    "category": "family",
    "skill": "ch.family",
    "sourceNote": "chamoru_info_dictionary.json — famagu'on; chamorro_english_dictionary_TOD.json — famagu'on"
  },
  {
    "id": "greetings.hello",
    "term": "Håfa Adai",
    "english": "Hello / Hi",
    "category": "greetings",
    "skill": "ch.greetings",
    "sourceNote": "revised_and_updated_chamorro_dictionary.json — håfa adai"
  },
  {
    "id": "greetings.thank_you",
    "term": "Si Yu'os Ma'åse'",
    "english": "Thank you",
    "category": "greetings",
    "skill": "ch.greetings",
    "sourceNote": "chamoru_info_dictionary.json — si Yu'us ma'åse'; revised_and_updated_chamorro_dictionary.json — si Yu'us ma'åsi'; chamorro_english_dictionary_TOD.json — si Yu'us ma'ase'"
  },
  {
    "id": "greetings.good_morning",
    "term": "Buenas dias",
    "english": "Good morning",
    "category": "greetings",
    "skill": "ch.greetings",
    "sourceNote": "chamoru_info_dictionary.json — buenas dias; chamorro_english_dictionary_TOD.json — buenas dias; Kumisión i Fino' CHamoru cultural dictionary — Manana si Yu'os; Visit Guam Simple CHamoru Greetings — Manana Si Yu'os"
  },
  {
    "id": "greetings.goodbye",
    "term": "Adios",
    "english": "Goodbye",
    "category": "greetings",
    "skill": "ch.greetings",
    "sourceNote": "revised_and_updated_chamorro_dictionary.json — adiós; chamoru_info_dictionary.json — ådios; chamorro_english_dictionary_TOD.json — adios"
  }
];
export const chamoruWord = (id: string) => chamoruWords.find((word) => word.id === id);
