import type { LearnEngine } from "../../types";
import { pickItems } from "../../skills";
import { SENTENCES } from "../../content/reading/sentences";
import { bools, exact, familyResult, integer, readingSkills, seat, shuffle } from "../../kit/reading";
export type WhichState = {
  ids: string[];
  orders: number[][];
  starter: 0 | 1;
  index: number;
  clean: boolean[];
  tried: boolean;
  wrong: number | null;
  solved: boolean;
};
export const whichItem = (s: WhichState) => SENTENCES.find((i) => i.id === s.ids[Math.min(s.index, 7)])!;
export const whichAnswer = (s: WhichState) => s.orders[Math.min(s.index, 7)].indexOf(0);
/** Reading help uses the existing assisted-attempt flag; no fabricated wrong picture. */
export const whichHelp = (s: WhichState): WhichState =>
  s.solved || s.index === 8 ? s : { ...s, tried: true };
export function whichPick(s: WhichState, choice: number): WhichState {
  if (s.index === 8 || s.solved || !integer(choice, 2)) return s;
  return choice === whichAnswer(s) ? { ...s, solved: true, wrong: null } : { ...s, tried: true, wrong: choice };
}
export function whichNext(s: WhichState): WhichState {
  return !s.solved
    ? s
    : { ...s, index: s.index + 1, clean: [...s.clean, !s.tried], tried: false, wrong: null, solved: false };
}
export const engine: LearnEngine<WhichState> = {
  id: "which-one",
  name: "Which One?",
  island: "reading",
  tagline: "Every word changes the picture.",
  description:
    "Read a short sentence, then choose its picture. Look closely: each other picture changes just one word.",
  help: "Read every word, then tap the picture that matches. Look at the animal, its size and colour, and where it is. If you pick another picture, the word that tells them apart lights up. Look again and try. Ask to hear the sentence or any word whenever you need help. Helped reading counts. A right picture gets a cheer, then the next sentence comes by itself. In take turns, a correct first try earns a point. There is no clock.",
  helpAudio: "reading-v25-which-help",
  introAudio: "which-one-intro",
  color: "#C56D50",
  surface: "#F5E7D9",
  modes: ["solo", "versus"],
  skills: readingSkills,
  create(o, c) {
    const pool = SENTENCES.filter((i) => i.pace === o.pace);
    const fresh = pool.filter((i) => !c.previous?.ids.includes(i.id));
    return {
      ids: pickItems(fresh.length >= 8 ? fresh : pool, c.skills, 8, c.rng, c.today).sort((a, b) => a.text.split(/\s+/).length - b.text.split(/\s+/).length).map((i) => i.id),
      orders: Array.from({ length: 8 }, () => shuffle([0, 1, 2], c.rng)),
      starter: c.starter,
      index: 0,
      clean: [],
      tried: false,
      wrong: null,
      solved: false,
    };
  },
  validate(v, o): v is WhichState {
    if (!exact(v, ["ids", "orders", "starter", "index", "clean", "tried", "wrong", "solved"])) return false;
    if (
      !Array.isArray(v.ids) ||
      v.ids.length !== 8 ||
      new Set(v.ids).size !== 8 ||
      !v.ids.every((id) => SENTENCES.some((i) => i.id === id && i.pace === o.pace))
    )
      return false;
    if (
      !Array.isArray(v.orders) ||
      v.orders.length !== 8 ||
      !v.orders.every(
        (a) => Array.isArray(a) && a.length === 3 && a.every((n) => integer(n, 2)) && new Set(a).size === 3
      )
    )
      return false;
    if (
      !seat(v.starter) ||
      !integer(v.index, 8) ||
      !bools(v.clean, v.index) ||
      typeof v.tried !== "boolean" ||
      typeof v.solved !== "boolean" ||
      (v.wrong !== null && !integer(v.wrong, 2))
    )
      return false;
    const s = v as WhichState;
    if (s.index === 8) return !s.solved && !s.tried && s.wrong === null;
    if (s.solved) return s.wrong === null;
    return s.tried ? s.wrong === null || s.wrong !== whichAnswer(s) : s.wrong === null;
  },
  outcome(s, o) {
    return s.index < 8 ? null : o.mode === "versus" ? familyResult(s.clean, s.starter) : "done";
  },
  turn: (s) => ((s.starter + s.index) % 2) as 0 | 1,
};
