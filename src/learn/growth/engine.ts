import type { CreateContext, LearnEngine, LearnId, LearnOptions } from "../types";
import { pickItems } from "../skills";
import { growthTrack } from "./content";
import type { GrowthAction, GrowthQuestion, GrowthState } from "./types";

export const isGrowth = (s: unknown): s is GrowthState => !!s && typeof s === "object" && (s as GrowthState).type === "growth";
export const growthQuestions = (game: LearnId, o: LearnOptions, s: GrowthState) =>
  s.ids.map(id => growthTrack(game, o.stage!)!.questions.find(q => q.id === id)!);
export type GrowthProgress = { index: number; solved: boolean; helped: boolean; shown: boolean; wrong: string | null; clean: boolean[] };
const initial = (): GrowthProgress => ({ index: 0, solved: false, helped: false, shown: false, wrong: null, clean: [] });
export function validGrowthInput(q: GrowthQuestion, value: string) {
  if (!q.tiles) return q.choices.some(c => c.value === value);
  const parts = value.split("|");
  if (parts.length !== q.answer.split("|").length) return false;
  const available = [...q.tiles];
  return parts.every(part => { const index = available.indexOf(part); if (index < 0) return false; available.splice(index, 1); return true; });
}
function step(p: GrowthProgress, a: GrowthAction, qs: readonly GrowthQuestion[]): boolean {
  if (p.index >= qs.length) return false;
  if (a.type === "next") {
    if (!p.solved) return false;
    p.index++;
    p.solved = false; p.helped = false; p.shown = false; p.wrong = null;
    return true;
  }
  if (p.solved) return false;
  if (a.type === "help") {
    if (p.shown) return false;
    p.helped = true; p.shown = true;
    return true;
  }
  const q = qs[p.index];
  if (!validGrowthInput(q, a.value) || p.wrong === a.value) return false;
  if (a.value === q.answer) {
    p.solved = true; p.wrong = null; p.clean.push(!p.helped);
  } else { p.helped = true; p.wrong = a.value; }
  return true;
}
export function growthProgress(s: GrowthState, qs: readonly GrowthQuestion[]) {
  const p = initial();
  for (const a of s.history) step(p, a, qs);
  return p;
}
export function growthDraft(s: GrowthState, draft: number[], qs: readonly GrowthQuestion[]): GrowthState {
  const p = growthProgress(s, qs), q = qs[p.index];
  if (p.solved || !q?.tiles || !Array.isArray(draft) || draft.length > q.answer.split("|").length || new Set(draft).size !== draft.length || draft.some(i => !Number.isInteger(i) || i < 0 || i >= q.tiles!.length)) return s;
  return { ...s, draft: [...draft] };
}
export function growthMove(s: GrowthState, a: GrowthAction, qs: readonly GrowthQuestion[]): GrowthState {
  const p = growthProgress(s, qs);
  if (!step(p, a, qs)) return s;
  if (a.type === "answer" && !p.solved && s.history.at(-1)?.type === "answer") return { ...s, history: [...s.history.slice(0, -1), a] };
  if (s.history.length >= 128) return s;
  const { draft: _draft, ...rest } = s;
  return { ...rest, history: [...s.history, a], ...((a.type === "help" || (a.type === "answer" && !p.solved)) && s.draft ? { draft: s.draft } : {}) };
}
export function createGrowth(game: LearnId, o: LearnOptions, c: CreateContext<unknown>): GrowthState {
  const track = growthTrack(game, o.stage!);
  if (!track || track.questions.length < 3) throw new Error("This learning stage is not available");
  const count = o.mode === "versus" ? 4 : 3;
  const ranked = pickItems([...track.questions], c.skills, track.questions.length, c.rng, c.today);
  const qs: GrowthQuestion[] = [];
  for (const q of ranked) {
    if (baseContextDuplicate(q, qs)) continue;
    qs.push(q);
    if (qs.length === count) break;
  }
  if (qs.length < count) for (const q of ranked) { if (!qs.includes(q)) qs.push(q); if (qs.length === count) break; }
  return { type: "growth", version: 1, starter: c.starter, ids: qs.map(q => q.id), history: [], orders: qs.map(q => {
    const order = q.choices.map(a => a.value);
    for (let i = order.length - 1; i > 0; i--) { const j = Math.min(i, Math.max(0, Math.floor(c.rng() * (i + 1)) || 0)); [order[i], order[j]] = [order[j], order[i]]; }
    return order;
  }) };
}
export function validGrowth(s: unknown, game: LearnId, o: LearnOptions): s is GrowthState {
  if (!isGrowth(s) || Object.keys(s).filter(k => k !== "draft").sort().join() !== "history,ids,orders,starter,type,version" || s.version !== 1 || ![0, 1].includes(s.starter) ||
    !Array.isArray(s.ids) || s.ids.length !== (o.mode === "versus" ? 4 : 3) || new Set(s.ids).size !== s.ids.length ||
    !Array.isArray(s.orders) || s.orders.length !== s.ids.length || !Array.isArray(s.history) || s.history.length > 128) return false;
  const track = growthTrack(game, o.stage!);
  if (!track || !s.ids.every(id => typeof id === "string" && track.questions.some(q => q.id === id))) return false;
  const qs = growthQuestions(game, o, s);
  if (!s.orders.every((order, i) => Array.isArray(order) && order.length === qs[i].choices.length && new Set(order).size === order.length && order.every(v => qs[i].choices.some(c => c.value === v)))) return false;
  const p = initial();
  const historyValid = s.history.every(a => {
    if (!a || typeof a !== "object" || Array.isArray(a) || !["answer", "help", "next"].includes(a.type)) return false;
    if (a.type === "answer" ? Object.keys(a).sort().join() !== "type,value" || typeof a.value !== "string" || a.value.length > 160 : Object.keys(a).join() !== "type") return false;
    return step(p, a, qs);
  });
  return historyValid && (s.draft === undefined || growthDraft(s, s.draft, qs) !== s);
}
/** Preserve every original engine contract when an additive stage is absent. */
export function withGrowth(base: LearnEngine<unknown>): LearnEngine<unknown> {
  if (base.ownLevels) return base;
  return { ...base,
    get skills() {
      const extra = Object.values(growthTracksFor(base.id)).flatMap(t => t?.questions ?? []);
      return { ...base.skills, ...Object.fromEntries(extra.map(q => [q.skill, q.skillLabel])) };
    },
    create: (o, c) => o.stage ? createGrowth(base.id, o, c) : base.create(o, c),
    validate: (s, o): s is unknown => o.stage ? validGrowth(s, base.id, o) : !isGrowth(s) && base.validate(s, o),
    outcome: (s, o) => {
      if (!o.stage) return base.outcome(s, o);
      const p = growthProgress(s as GrowthState, growthQuestions(base.id, o, s as GrowthState));
      if (p.index < (s as GrowthState).ids.length) return null;
      if (o.mode !== "versus") return "done";
      // Every entry is a completed correct answer. Clean flags remain readiness metadata, never match penalties.
      const a = p.clean.filter((_, i) => (i + (s as GrowthState).starter) % 2 === 0).length, b = p.clean.filter((_, i) => (i + (s as GrowthState).starter) % 2 === 1).length;
      return a === b ? "draw" : a > b ? 0 : 1;
    },
    turn: (s, o) => o.stage ? (growthProgress(s as GrowthState, growthQuestions(base.id, o, s as GrowthState)).index + (s as GrowthState).starter) % 2 as 0 | 1 : base.turn?.(s, o) ?? null,
    notWon: (s, o) => o.stage ? null : base.notWon?.(s, o) ?? null,
  };
}
function growthTracksFor(game: LearnId) { return { stretch: growthTrack(game, "stretch"), deep: growthTrack(game, "deep") }; }

function baseContextDuplicate(q: GrowthQuestion, chosen: readonly GrowthQuestion[]) {
  return !!q.context && q.context.length > 200 && chosen.some(previous => previous.context === q.context);
}
