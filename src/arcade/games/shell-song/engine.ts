import { createLives, configureLives, stepLives, hitLives, validLives, type Lives } from "../../lives";
import { PICTURE_WORDS } from "../../../learn/content/reading/clues";
import { phonemes, wordEntry } from "../../../learn/kit/reading";
import { allLevelIds, levelNumber, nextRandom, worldOf, type ArcadeEngine, type ArcadeLevel, type ArcadeResult, type LevelId } from "../../types";
export type SongLevel = ArcadeLevel & { shells: number; startLength: number; rounds: number; noteMs: number; twist: "growing" | "response" | "twins" | "finale" | "word"; word?: string };
export type SongState = { level: SongLevel | "endless"; seed: number; helper: boolean; pattern: number[]; shells: number; lives: Lives; event: number; onset: number; phase: "over" | "watch" | "repeat" | "picture" | "cleared" | "rest"; elapsed: number; cursor: number; rounds: number; slips: number; score: number; lastTap: number | null; choices: string[]; message: string; helped: boolean };
export type SongInput = { type: "tick" } | { type: "shell"; index: number } | { type: "picture"; word: string } | { type: "replay" } | { type: "helper"; value: boolean } | { type: "finish" } | { type: "show" };
// All picture targets and sound tiles come from the existing curated reading bank.
/** Authored phrase lengths and cadence; player recall is always untimed. */
export const songWords = PICTURE_WORDS.easy.filter(word => !!wordEntry(word) && wordEntry(word)!.tiles.length === 3 && wordEntry(word)!.tiles.every(t => t.length === 1) && phonemes(word).length === 3).slice(0, 8);
export const songLevels: readonly SongLevel[] = allLevelIds.map(id => {
  const index = levelNumber(id), world = worldOf(id), rank = ({ w1: 0, w2: 1, w3: 2, w4: 3, w5: 4, w6: 5, learn: 0 })[world], learning = world === "learn";
  const shells = learning ? 3 : Math.min(6, 3 + rank + (rank >= 2 && index >= 5 ? 1 : 0));
  const startLength = learning ? 3 : [2, 3, 4, 4, 5, 7][rank] + Math.floor((index - 1) / 3);
  const rounds = learning ? 1 : 3 + Number(index >= 6), word = learning ? songWords[index - 1] : undefined;
  const twist = learning ? "word" : rank === 3 ? "response" : rank === 4 ? "twins" : rank === 5 ? "finale" : "growing";
  return { id, index, world, name: learning ? `Sound a word · ${index}` : `${["Shoreline song", "Tide voices", "Six-shell chorus", "Call and response", "Twin-note echoes", "Long-song finale"][rank]} · ${index}`, shells, startLength, rounds, twist, noteMs: learning ? 3200 : [650, 540, 460, 440, 400, 360][rank] - (index - 1) * (rank < 2 ? 10 : 6), ...(word ? { word } : {}), goals: [learning ? "Blend the sounds. Pick their picture." : `Repeat ${rounds} ${twist === "response" ? "new phrases" : "growing patterns"}`, "Finish with 1 slip or fewer", "Finish with no slips"] };
});
export const songLevel = (id: LevelId) => songLevels.find(l => l.id === id)!;
export const songTiles = (s: SongState): readonly string[] => s.level !== "endless" && s.level.word ? wordEntry(s.level.word)!.tiles : Array.from({ length: s.shells }, (_, i) => ["1", "2", "3", "4", "5", "6"][i]);
export const noteDuration = (s: SongState) => s.level !== "endless" && s.level.word ? s.level.noteMs : Math.max(240, (s.level === "endless" ? 650 : s.level.noteMs) - s.rounds * (s.level !== "endless" && s.level.world === "w1" ? 50 : 20)) + (s.helper ? 120 : 0);
export const watchNoteIndex = (s: SongState) => s.phase === "watch" && s.elapsed >= 450 ? Math.floor((s.elapsed - 450) / noteDuration(s)) : -1;
export function glowingShell(s: SongState): number | null {
  const index = watchNoteIndex(s), duration = noteDuration(s);
  return index >= 0 && index < s.pattern.length && (s.elapsed - 450) % duration < duration * .72 ? s.pattern[index] : null;
}

function append(s: SongState, count = 1): SongState {
  let seed = s.seed;
  const pattern = s.level === "endless" && s.pattern.length >= 24 ? s.pattern.slice(-23) : [...s.pattern];
  for (let i = 0; i < count; i++) { let n: number; [seed, n] = nextRandom(seed); pattern.push(Math.floor(n * s.shells)); if (s.level !== "endless" && s.level.twist === "twins") pattern.push(pattern[pattern.length - 1]); }
  return { ...s, seed, pattern };
}
export function createSong(level: SongState["level"], seed: number, helper = false): SongState {
  const word = level !== "endless" ? level.word : undefined;
  const distractors = PICTURE_WORDS.easy.filter(w => w !== word), choices = word ? [word, distractors[seed % distractors.length], distractors[(seed + 3) % distractors.length]] : [];
  if (word) { const offset = seed % 3; choices.push(...choices.splice(0, offset)); }
  const s: SongState = { level, seed, helper, lives: createLives(helper), event: 0, onset: 0, pattern: [], shells: level === "endless" ? 4 : level.shells, phase: "watch", elapsed: 0, cursor: 0, rounds: 0, slips: 0, score: 0, lastTap: null, choices, message: word ? "Hear each sound. You can replay as often as you like." : "Watch the glowing shells. Then play their song back.", helped: false };
  return word ? { ...s, pattern: [0, 1, 2] } : append(s, level === "endless" ? 2 : level.startLength);
}
export function songStep(s: SongState, input: SongInput, dt: number): SongState {
  if (input.type !== "tick") return songTransition(s, input);
  if (!Number.isFinite(dt) || dt <= 0 || ["over", "cleared", "rest"].includes(s.phase)) return s;
  const lives = stepLives(s.lives, dt);
  if (lives !== s.lives) s = { ...s, lives };
  if (s.phase !== "watch") return s;
  const elapsed = s.elapsed + Math.min(dt, 1 / 30) * 1000;
  return elapsed >= 450 + s.pattern.length * noteDuration(s) ? { ...s, phase: "repeat", event: s.event + 1, elapsed: 0, cursor: 0, message: s.level !== "endless" && s.level.word ? "Tap the sounds in word order. There is no hurry." : "Your turn. Take your time." } : { ...s, elapsed, event: s.event + Number(glowingShell(s) !== glowingShell({ ...s, elapsed })), onset: s.onset + Number(watchNoteIndex(s) !== watchNoteIndex({ ...s, elapsed }) && glowingShell({ ...s, elapsed }) !== null) };
}
export function songTransition(s: SongState, input: SongInput): SongState {
  if (s.phase === "cleared" || s.phase === "rest" || s.phase === "over") return s;
  if (input.type === "helper") {
    if (input.value === s.helper) return s;
    const restart = s.phase === "watch" || s.phase === "repeat";
    const lives = configureLives(s.lives, input.value), learning = s.level !== "endless" && !!s.level.word;
    return { ...s, helper: input.value, lives, ...(restart ? { phase: "watch" as const, elapsed: 0, cursor: 0, lastTap: null, event: s.event + 1 } : {}), ...(lives.hearts === 0 && !learning && !["cleared", "rest", "over"].includes(s.phase) ? { phase: "over" as const, event: s.event + 1 } : {}) };
  }
  if (input.type === "finish") return s.level === "endless" ? { ...s, phase: "rest", message: "A lovely song. Time for a rest." } : s;
  if (input.type === "show" && (s.level === "endless" || !s.level.word)) return s;
  if (input.type === "show") return { ...s, helped: true, message: s.phase === "picture" && s.level !== "endless" ? `Blend the sounds: ${s.level.word}. Find its picture.` : `Next is shell ${s.pattern[s.cursor] + 1}.` };
  if (input.type === "replay") return { ...s, phase: "watch", elapsed: 0, cursor: 0, lastTap: null, message: "Listen again. Replaying is always welcome." };
  if (input.type === "picture") {
    if (s.phase !== "picture" || s.level === "endless" || !s.choices.includes(input.word)) return s;
    return input.word === s.level.word ? { ...s, phase: "cleared", score: s.score + 100, message: `You blended ${s.level.word}!` } : { ...s, slips: s.slips + 1, helped: true, message: `Try blending the sounds slowly: ${songTiles(s).join(" · ")}. You can ask for help.` };
  }
  if (input.type !== "shell" || s.phase !== "repeat" || !Number.isInteger(input.index) || input.index < 0 || input.index >= s.shells) return s;
  if (s.pattern[s.cursor] !== input.index) {
    const learning = s.level !== "endless" && !!s.level.word;
    const lives = learning ? s.lives : hitLives(s.lives);
    if (!learning && lives === s.lives) return s;
    const slips = s.slips + 1, over = !learning && lives.hearts === 0;
    return { ...s, lives, event: s.event + 1, slips, cursor: 0, elapsed: 0, lastTap: input.index, phase: over ? "over" : "watch", helped: s.helped || learning, message: over ? "Game over. Your song is ready for another try." : "Let’s listen once more. The same song is waiting for you." };
  }
  const cursor = s.cursor + 1, score = Math.min(99999999, s.score + 10);
  if (cursor !== s.pattern.length) return { ...s, cursor, score, lastTap: input.index, message: `${cursor} of ${s.pattern.length} sounds. Keep going.` };
  const rounds = s.rounds + 1;
  if (s.level !== "endless" && s.level.word) return { ...s, cursor, rounds, score, phase: "picture", lastTap: input.index, message: "Blend those sounds. Which picture is the word?" };
  if (s.level !== "endless" && rounds >= s.level.rounds) return { ...s, cursor, rounds, score, phase: "cleared", lastTap: input.index, message: "You played the whole growing song!" };
  const response = s.level !== "endless" && s.level.twist === "response", finale = s.level !== "endless" && s.level.twist === "finale";
  return append({ ...s, ...(response ? { pattern: [] } : {}), cursor: 0, rounds, score, lastTap: null, elapsed: 0, phase: "watch", message: response ? "A new call. Listen, then answer." : "The song grew. Watch and listen." }, response && s.level !== "endless" ? s.level.startLength + rounds : finale ? 2 : 1);
}
export function songResult(s: SongState): ArcadeResult | null {
  if (s.phase !== "cleared" && s.phase !== "rest" && s.phase !== "over") return null;
  return { cleared: s.phase === "cleared", outcome: s.phase === "cleared" ? "cleared" : s.phase === "over" ? "game-over" : "stopped", stars: s.phase === "cleared" ? s.slips === 0 ? 3 : s.slips <= 1 ? 2 : 1 : 0, score: s.score, detail: `${s.rounds} pattern${s.rounds === 1 ? "" : "s"} · ${s.slips} slip${s.slips === 1 ? "" : "s"}` };
}
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const integer = (v: unknown, max = 99999999) => typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= max;
export function validSong(v: unknown): v is SongState {
  if (!object(v) || !(v.level === "endless" || object(v.level) && songLevels.some(l => l.id === (v.level as Record<string, unknown>).id)) || !integer(v.shells, 6) || (v.shells as number) < 3 || !Array.isArray(v.pattern) || v.pattern.length < 1 || v.pattern.length > 24 || !v.pattern.every(n => integer(n, (v.shells as number) - 1))) return false;
  const canonical = v.level === "endless" ? null : songLevels.find(l => l.id === (v.level as Record<string, unknown>).id)!;
  if (Object.keys(v).sort().join() !== "choices,cursor,elapsed,event,helped,helper,lastTap,level,lives,message,onset,pattern,phase,rounds,score,seed,shells,slips" || v.shells !== (canonical?.shells ?? 4)) return false;
  if (canonical) {
    const level = v.level as Record<string, unknown>;
    if (Object.keys(level).length !== Object.keys(canonical).length || !Object.entries(canonical).every(([key, value]) => key === "goals" ? Array.isArray(level.goals) && level.goals.length === 3 && (value as readonly string[]).every((goal, i) => (level.goals as unknown[])[i] === goal) : level[key] === value)) return false;
  }
  if (!validLives(v.lives) || v.lives.maxHearts !== (v.helper ? 5 : 3) || (v.phase === "over") !== (v.lives.hearts === 0) || v.phase === "picture" && !canonical?.word || v.phase === "rest" && v.level !== "endless") return false;
  return integer(v.onset) && validLives(v.lives) && integer(v.event) && integer(v.seed, 0xffffffff) && typeof v.helper === "boolean" && typeof v.helped === "boolean" && [v.cursor, v.rounds, v.slips, v.score].every(n => integer(n)) && (v.cursor as number) <= v.pattern.length && typeof v.elapsed === "number" && Number.isFinite(v.elapsed) && v.elapsed >= 0 && ["watch", "repeat", "picture", "cleared", "rest", "over"].includes(v.phase as string) && (v.lastTap === null || integer(v.lastTap, (v.shells as number) - 1)) && Array.isArray(v.choices) && v.choices.length === (canonical?.word ? 3 : 0) && new Set(v.choices).size === v.choices.length && (!canonical?.word || v.choices.includes(canonical.word)) && v.choices.every(w => PICTURE_WORDS.easy.includes(w)) && typeof v.message === "string";
}
export const songEngine: ArcadeEngine<SongState, SongInput, SongLevel> = { create: createSong, reduce: songTransition, step: songStep, result: songResult, validate: validSong };

export const songChunks = (pattern: readonly number[]): number[][] => Array.from({ length: Math.ceil(pattern.length / 3) }, (_, i) => pattern.slice(i * 3, i * 3 + 3));