/** Curated everyday vocabulary; all accompanying vector pictures are original. */
export const PARTY_PACKS = [
  {
    id: "animals",
    name: "Animal friends",
    description: "Familiar creatures, big and small",
    words: [
      { id: "cat", word: "Cat" },
      { id: "fish", word: "Fish" },
      { id: "bird", word: "Bird" },
      { id: "turtle", word: "Turtle" },
      { id: "butterfly", word: "Butterfly" },
      { id: "snail", word: "Snail" },
      { id: "crab", word: "Crab" },
      { id: "rabbit", word: "Rabbit" },
      { id: "owl", word: "Owl" },
    ],
  },
  {
    id: "food",
    name: "Picnic basket",
    description: "Things you might eat at a picnic",
    words: [
      { id: "apple", word: "Apple" },
      { id: "banana", word: "Banana" },
      { id: "watermelon", word: "Watermelon" },
      { id: "carrot", word: "Carrot" },
      { id: "pizza", word: "Pizza" },
      { id: "icecream", word: "Ice cream" },
      { id: "coconut", word: "Coconut" },
      { id: "grapes", word: "Grapes" },
      { id: "mango", word: "Mango" },
    ],
  },
  {
    id: "outdoors",
    name: "Outside wonders",
    description: "Look around the sky and garden",
    words: [
      { id: "sun", word: "Sun" },
      { id: "moon", word: "Moon" },
      { id: "tree", word: "Tree" },
      { id: "flower", word: "Flower" },
      { id: "cloud", word: "Cloud" },
      { id: "rainbow", word: "Rainbow" },
      { id: "star", word: "Star" },
      { id: "kite", word: "Kite" },
      { id: "shell", word: "Shell" },
    ],
  },
] as const;
export type PartyPackId = (typeof PARTY_PACKS)[number]["id"];
export type PartyWordId = (typeof PARTY_PACKS)[number]["words"][number]["id"];
export function partyPack(id: PartyPackId) {
  return PARTY_PACKS.find((p) => p.id === id)!;
}
export function partyWord(pack: PartyPackId, id: PartyWordId) {
  return partyPack(pack).words.find((w) => w.id === id)!;
}
