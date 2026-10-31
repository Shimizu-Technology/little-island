/** Run with npm exec --yes --package=tsx@4.20.6 -- tsx scripts/export-growth-audio.ts */
import { writeFileSync } from "node:fs";
import { levelSpeech } from "../src/learn/levelSpeech";
import { growthTracks } from "../src/learn/growth/content";
const speech: Record<string, string> = {
  ...levelSpeech,
  "voice-preview": "Let’s try this together. You can take your time. Tap Show me whenever you would like a little help.",
  "growth-help": "Read or hear the question, then choose an answer or put the pieces in order. Show me explains the idea. When you are ready, tap Next idea.",
};
for (const [game, stages] of Object.entries(growthTracks)) for (const [stage, track] of Object.entries(stages)) for (const q of track.questions) {
  const key = `growth-${game}-${stage}-${q.id}`;
  if (speech[`${key}-prompt`]) throw new Error(`Duplicate question ${key}`);
  speech[`${key}-prompt`] = [q.context, q.prompt].filter(Boolean).join(" ");
  speech[`${key}-explanation`] = q.explanation;
}
writeFileSync("scripts/learn/growth.json", JSON.stringify(speech, null, 2) + "\n");
console.log(`Exported ${Object.keys(speech).length} offline growth lines`);
