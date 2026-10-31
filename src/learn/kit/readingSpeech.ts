import lines from "../../../scripts/learn/reading-v25.json";

const existingWords: Record<string, string> = {
  bird: "bird", rainbow: "rainbow", starfish: "starfish", reading: "reading",
  painting: "painting", hopeful: "hopeful", joyful: "joyful",
};
const registered = Object.fromEntries(Object.entries(lines).map(([key, text]) => [text, key]));
/** Reuse bundled words; registered new recordings remain safe no-ops until the lead audio build. */
export function readingSpeech(text: string) {
  const spoken = text === "." ? "Full stop." : text === "?" ? "Question mark." : text;
  return existingWords[text] ?? registered[spoken] ?? `sound-boat-word-${text.toLowerCase().replace(/[^a-z]/g, "")}`;
}
