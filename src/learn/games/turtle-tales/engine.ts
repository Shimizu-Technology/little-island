import type { LearnEngine } from "../../types";
import { pickItems } from "../../skills";
import { STORIES } from "../../content/reading/stories";
import { random } from "../../../games/types";
import { bools, exact, integer, readingSkills, seat, tokens } from "../../kit/reading";

/**
 * Turtle Tales: read a page, then pick which of two pictures matches it. The other picture changes one
 * thing that a word on the page names, so only careful reading tells them apart. A right pick swims the
 * turtle forward and turns the page.
 */
export type TaleState = {
  id: string;
  starter: 0 | 1;
  /** Page 0…; equal to the page count when the tale is finished. */
  page: number;
  /** For each page, which side (0 left, 1 right) holds the matching picture. */
  sides: (0 | 1)[];
  /** She picked the other picture on this page. */
  wrong: boolean;
  /** "Read it to me" was used on this page. */
  heard: boolean;
  /** She found this page's picture; the page turns next. */
  solved: boolean;
  /** One entry per finished page: found on the first pick without being read to. */
  clean: boolean[];
};
export const tale = (s: { id: string }) => STORIES.find((t) => t.id === s.id)!;
export const talePageCount = (s: { id: string }) => tale(s).pages.length;
export const taleDone = (s: TaleState) => s.page >= talePageCount(s);
/** Together: readers take turns page by page. */
export const taleReader = (s: TaleState): 0 | 1 => ((s.starter + Math.min(s.page, talePageCount(s) - 1)) % 2) as 0 | 1;
export function talePick(s: TaleState, side: number): TaleState {
  if (taleDone(s) || s.solved || (side !== 0 && side !== 1)) return s;
  return side === s.sides[s.page] ? { ...s, solved: true } : s.wrong ? s : { ...s, wrong: true };
}
export function taleHear(s: TaleState): TaleState {
  return taleDone(s) || s.heard ? s : { ...s, heard: true };
}
export function taleTurnPage(s: TaleState): TaleState {
  if (!s.solved) return s;
  return {
    ...s,
    page: s.page + 1,
    wrong: false,
    heard: false,
    solved: false,
    clean: [...s.clean, !s.wrong && !s.heard],
  };
}

// ---- Rounds saved by app 1.4.0 (tap each word in order, then two memory questions). They still load:
// the Board carries an unfinished one over to the same page of the new game.
export type LegacyTaleState = {
  id: string;
  starter: 0 | 1;
  page: number;
  word: number;
  pointed: boolean;
  modelPages: number[];
  question: number;
  orders: number[][];
  wrong: number | null;
  solved: boolean;
  done: boolean;
};
export const isLegacyTale = (s: unknown): s is LegacyTaleState => !!s && typeof s === "object" && "orders" in s;
function legacyTurn(s: LegacyTaleState): 0 | 1 {
  const t = tale(s),
    before = t.pages.slice(0, s.page).reduce((n, p) => n + (p.text.match(/[.!?]/g)?.length ?? 1), 0);
  const current = t.pages[s.page]?.text.split(/\s+/).slice(0, s.word).join(" ") ?? "";
  const sentences = current.match(/[.!?]/g)?.length ?? 0;
  return ((s.starter + before + sentences) % 2) as 0 | 1;
}
function validLegacy(v: unknown, pace: string): v is LegacyTaleState {
  if (
    !exact(v, [
      "id",
      "starter",
      "page",
      "word",
      "pointed",
      "modelPages",
      "question",
      "orders",
      "wrong",
      "solved",
      "done",
    ])
  )
    return false;
  const t = STORIES.find((t) => t.id === v.id && t.pace === pace);
  if (!t) return false;
  if (
    !seat(v.starter) ||
    !integer(v.page, t.pages.length) ||
    !integer(v.word, 30) ||
    typeof v.pointed !== "boolean" ||
    !integer(v.question, 2) ||
    typeof v.solved !== "boolean" ||
    typeof v.done !== "boolean" ||
    (v.wrong !== null && !integer(v.wrong, 2))
  )
    return false;
  if (
    !Array.isArray(v.modelPages) ||
    new Set(v.modelPages).size !== v.modelPages.length ||
    !v.modelPages.every((p) => integer(p, t.pages.length - 1) && p <= (v.page as number)) ||
    !v.modelPages.every((p, i, a) => i === 0 || p > a[i - 1])
  )
    return false;
  if (
    !Array.isArray(v.orders) ||
    v.orders.length !== 2 ||
    !v.orders.every((a) => Array.isArray(a) && a.length === 3 && a.every((n) => integer(n, 2)) && new Set(a).size === 3)
  )
    return false;
  const s = v as LegacyTaleState;
  const answer = s.orders[Math.min(s.question, 1)].indexOf(0);
  if (s.page < t.pages.length) {
    const words = tokens(t.pages[s.page].text).length;
    return (
      s.word <= words && (s.word < words || !s.pointed) && s.question === 0 && !s.solved && !s.done && s.wrong === null
    );
  }
  if (s.word !== 0 || s.pointed || s.done !== (s.question === 2)) return false;
  if (s.done) return !s.solved && s.wrong === null;
  return s.wrong === null || (!s.solved && s.wrong !== answer);
}
/** The same tale, carried over to the new game: unfinished pages start fresh; old end questions count as finished. */
export function taleFromLegacy(s: LegacyTaleState): TaleState {
  const n = talePageCount(s),
    page = Math.min(s.page, n),
    rng = random(s.orders.flat().reduce((h, v) => h * 3 + v, 7) + s.starter);
  return {
    id: s.id,
    starter: s.starter,
    page,
    sides: Array.from({ length: n }, () => (rng() < 0.5 ? 0 : 1)),
    wrong: false,
    heard: false,
    solved: false,
    clean: Array.from({ length: page }, () => true),
  };
}

export const engine: LearnEngine<TaleState | LegacyTaleState> = {
  id: "turtle-tales",
  name: "Turtle Tales",
  island: "reading",
  tagline: "Read a page, pick its picture.",
  description:
    "Read a little island tale. On every page, pick the picture that matches what you read, and the turtle swims on.",
  help: "Read the words on the page. Then tap the picture that matches. The two pictures are almost the same: one word on the page tells you which is right, so read every word. Tap any word to hear it. If you pick the other picture, a word lights up; look at it and try again, or tap Read it to me. A right pick swims the turtle forward and turns the page. Together, take turns reading a page each. Go at your own pace; there is no clock.",
  helpAudio: "turtle-tales-help",
  introAudio: "turtle-tales-intro",
  color: "#246858",
  surface: "#E5EFE5",
  modes: ["solo", "together"],
  skills: readingSkills,
  create(o, c) {
    const previous = c.previous as { id?: unknown } | undefined;
    const pool = STORIES.filter((t) => t.pace === o.pace && t.id !== previous?.id);
    const id = pickItems(pool, c.skills, 1, c.rng, c.today)[0].id;
    return {
      id,
      starter: c.starter,
      page: 0,
      sides: tale({ id }).pages.map(() => (c.rng() < 0.5 ? 0 : 1)),
      wrong: false,
      heard: false,
      solved: false,
      clean: [],
    };
  },
  validate(v, o): v is TaleState | LegacyTaleState {
    if (isLegacyTale(v)) return validLegacy(v, o.pace);
    if (!exact(v, ["id", "starter", "page", "sides", "wrong", "heard", "solved", "clean"])) return false;
    const t = STORIES.find((t) => t.id === v.id && t.pace === o.pace);
    if (!t) return false;
    const n = t.pages.length;
    if (
      !seat(v.starter) ||
      !integer(v.page, n) ||
      !Array.isArray(v.sides) ||
      v.sides.length !== n ||
      !v.sides.every(seat) ||
      typeof v.wrong !== "boolean" ||
      typeof v.heard !== "boolean" ||
      typeof v.solved !== "boolean" ||
      !bools(v.clean, v.page as number)
    )
      return false;
    return v.page !== n || (!v.wrong && !v.heard && !v.solved);
  },
  outcome: (s) => ((isLegacyTale(s) ? s.done : taleDone(s)) ? "done" : null),
  turn: (s) => (isLegacyTale(s) ? legacyTurn(s) : taleReader(s)),
};
