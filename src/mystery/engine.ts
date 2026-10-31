import { random, shuffle } from "../games/types";
export type Role = "crew" | "mischief";
export type Phase = "explore" | "discussion" | "voting" | "finished";
export type Point = { x: number; y: number };
export const MAP = ["#########", "#.......#", "#..#.#..#", "#.......#", "#..#.#..#", "#.......#", "#########"];
export const BELL = { x: 4, y: 3 },
  PUMP = { x: 4, y: 1 };
export const TASKS = [
  {
    id: "garden",
    name: "Water the garden",
    x: 1,
    y: 1,
    prompt: "Care for a seed: what comes next?",
    choices: ["Plant seed", "Add water", "Let sun shine"],
    order: [0, 1, 2],
  },
  {
    id: "stars",
    name: "Align the telescope",
    x: 7,
    y: 1,
    prompt: "Follow the star pattern: small, big, medium.",
    choices: ["Small star", "Medium star", "Big star"],
    order: [0, 2, 1],
  },
  {
    id: "picnic",
    name: "Pack the picnic",
    x: 7,
    y: 5,
    prompt: "Pack in order: water, fruit, bread.",
    choices: ["Fruit", "Bread", "Water"],
    order: [2, 0, 1],
  },
  {
    id: "dock",
    name: "Secure the boat",
    x: 1,
    y: 5,
    prompt: "Tie the rope: left, right, left.",
    choices: ["Left loop", "Right loop", "Untie"],
    order: [0, 1, 0],
  },
] as const;
export type TaskId = (typeof TASKS)[number]["id"];
export type MysteryPlayer = Point & {
  id: string;
  name: string;
  role: Role;
  bot: boolean;
  connected: boolean;
  out: boolean;
  meetings: number;
  prankReady: number;
  clues: string[];
};
/** Absent on build-6 saves: those rounds retain their original rules until a fresh round. */
export type Adventure = {
  edition: 2;
  balance?: "gentle" | "challenge";
  round: number;
  pranks: number;
  taskData: { garden: number; stars: number; picnic: number; dock: number; rope: number };
  ribbons: Record<string, number>;
  moves: Record<string, { tick: number; count: number }>;
};
export const TRICK_GOAL = 3;
export const STAR_TARGETS = [2, 5, 1];
export const countBits = (mask: number) => [1, 2, 4].filter((bit) => mask & bit).length;
export const prankDelay = (solo: boolean, gentle = false) => gentle ? 45 : (solo ? 10 : 25);
export const openingDelay = (solo: boolean, gentle = false) => gentle ? 45 : (solo ? 8 : 20);
const gentleCrew = (s: MysterySession) => s.solo && s.adventure?.balance === "gentle" && s.players[0].role === "crew";
export function playerColor(id: string) {
  const known: Record<string, number> = { host: 0, you: 0, mango: 1, pearl: 2, coco: 3 };
  const index =
    known[id] ?? (/^p[1-7]$/.test(id) ? Number(id.slice(1)) : [...id].reduce((a, c) => a + c.charCodeAt(0), 0) % 8);
  return ["#BC6548", "#3D7197", "#387B64", "#80649E", "#956D24", "#AC567E", "#367E89", "#637237"][index];
}
export type VoteSummary = { accusedId: string | null; role: Role | null; tally: Record<string, number> };
export type MysterySession = {
  /** Public result only. Optional so original version-1 saves remain valid. */
  voteSummary?: VoteSummary;
  version: 1;
  adventure?: Adventure;
  game: "island-mystery";
  id: string;
  seed: number;
  revision: number;
  tick: number;
  solo: boolean;
  players: MysteryPlayer[];
  phase: Phase;
  phaseLeft: number;
  tasks: Record<TaskId, number>;
  sabotage: { left: number; progress: number } | null;
  sabotageReady: number;
  votes: Record<string, string>;
  ready: string[];
  lastMeeting: number;
  events: string[];
  result: { winner: Role; reason: "tasks" | "caught" | "pranks" | "sabotage" } | null;
};
export type MysteryIntent =
  | { type: "move"; dx: number; dy: number }
  | { type: "step"; fromX: number; fromY: number; dx: number; dy: number }
  | { type: "wait" }
  | { type: "rescue"; target: string }
  | { type: "task"; task: TaskId; choice: number }
  | { type: "repair"; choice: number }
  | { type: "sabotage" }
  | { type: "prank"; target: string }
  | { type: "meeting" }
  | { type: "ready" }
  | { type: "vote"; target: string };
export const REPAIR_ORDER = [2, 0, 1];
export const REPAIR_CHOICES = ["Close valve", "Connect pipe", "Open supply"];
const close = (a: Point, b: Point, distance = 0) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y) <= distance;
export const walkable = (p: Point) => Number.isInteger(p.x) && Number.isInteger(p.y) && MAP[p.y]?.[p.x] === ".";
export const pausedMystery = (s: MysterySession) => !s.solo && s.players.some((p) => !p.connected && !p.out);
const alive = (s: MysterySession) => s.players.filter((p) => !p.out);
function note(s: MysterySession, message: string) {
  s.events = [...s.events.slice(-11), message];
}
function end(s: MysterySession, winner: Role, reason: NonNullable<MysterySession["result"]>["reason"]) {
  s.phase = "finished";
  s.phaseLeft = 0;
  s.result = { winner, reason };
  note(s, winner === "crew" ? "The crew saved the picnic!" : "Mischief surprised the island!");
}
function outcome(s: MysterySession) {
  if (s.result) return;
  if (!alive(s).some((p) => p.role === "mischief")) end(s, "crew", "caught");
  else if (TASKS.every((t) => s.tasks[t.id] === 3)) end(s, "crew", "tasks");
  else if (
    s.adventure
      ? s.adventure.pranks >= TRICK_GOAL
      : alive(s).filter((p) => p.role === "crew").length <= alive(s).filter((p) => p.role === "mischief").length
  )
    end(s, "mischief", "pranks");
}
export function createMysterySession(
  seats: { id: string; name: string; bot?: boolean }[] = [
    { id: "you", name: "You" },
    { id: "mango", name: "Mango", bot: true },
    { id: "pearl", name: "Pearl", bot: true },
    { id: "coco", name: "Coco", bot: true },
  ],
  seed = Date.now() >>> 0,
  soloRole?: Role,
  id = `mystery-${Date.now().toString(36)}-${seed}`,
  round = 1,
  balance?: "gentle" | "challenge"
): MysterySession {
  if (seats.length < 3 || seats.length > 8 || new Set(seats.map((p) => p.id)).size !== seats.length)
    throw new Error("Mystery needs 3–8 unique players.");
  const shuffled = shuffle(
    seats.map((p) => p.id),
    random(seed)
  );
  const mischiefId =
    soloRole === "mischief"
      ? seats[0].id
      : soloRole === "crew"
        ? shuffled.find((p) => p !== seats[0].id)!
        : shuffled[0];
  const starts = [
    { x: 4, y: 3 },
    { x: 3, y: 3 },
    { x: 5, y: 3 },
    { x: 4, y: 2 },
    { x: 4, y: 4 },
    { x: 2, y: 3 },
    { x: 6, y: 3 },
    { x: 4, y: 5 },
  ];
  return {
    version: 1,
    adventure: {
      edition: 2,
      ...(balance ? { balance } : {}),
      round,
      pranks: 0,
      taskData: { garden: 0, stars: 0, picnic: 0, dock: 0, rope: -1 },
      ribbons: {},
      moves: {},
    },
    game: "island-mystery",
    id,
    seed: seed >>> 0,
    revision: 0,
    tick: 0,
    solo: seats.some((p) => p.bot),
    players: seats.map((p, i) => ({
      id: p.id,
      name: p.name,
      bot: !!p.bot,
      connected: true,
      out: false,
      role: p.id === mischiefId ? "mischief" : "crew",
      meetings: 2,
      prankReady: openingDelay(seats.some((p) => p.bot), balance === "gentle" && seats.some(p => p.bot) && seats[0].id !== mischiefId),
      clues: [],
      ...starts[i],
    })),
    phase: "explore",
    phaseLeft: 0,
    tasks: { garden: 0, stars: 0, picnic: 0, dock: 0 },
    sabotage: null,
    sabotageReady: seats.some((p) => p.bot) ? 12 : 25,
    votes: {},
    ready: [],
    lastMeeting: -10,
    events: [
      "Welcome to Picnic Island. Crew: finish four jobs or find the trickster. Mischief: make three ribbon tricks. Everyone keeps playing!",
    ],
    result: null,
  };
}
function copy(s: MysterySession): MysterySession {
  return {
    ...s,
    ...(s.adventure
      ? {
          adventure: {
            ...s.adventure,
            taskData: { ...s.adventure.taskData },
            ribbons: { ...s.adventure.ribbons },
            moves: Object.fromEntries(Object.entries(s.adventure.moves).map(([id, m]) => [id, { ...m }])),
          },
        }
      : {}),
    players: s.players.map((p) => ({ ...p, clues: p.clues.slice() })),
    tasks: { ...s.tasks },
    sabotage: s.sabotage ? { ...s.sabotage } : null,
    ...(s.voteSummary ? { voteSummary: { ...s.voteSummary, tally: { ...s.voteSummary.tally } } } : {}),
    votes: { ...s.votes },
    ready: s.ready.slice(),
    events: s.events.slice(),
  };
}
function resolveVotes(s: MysterySession) {
  const tally: Record<string, number> = {};
  Object.values(s.votes).forEach((v) => {
    tally[v] = (tally[v] ?? 0) + 1;
  });
  const ordered = Object.entries(tally).sort((a, b) => b[1] - a[1]);
  const selected = ordered[0];
  s.voteSummary = { accusedId: null, role: null, tally };
  if (selected && selected[0] !== "skip" && selected[1] > (ordered[1]?.[1] ?? 0)) {
    const p = s.players.find((p) => p.id === selected[0])!;
    p.out = true;
    s.voteSummary.accusedId = p.id;
    s.voteSummary.role = p.role;
    note(s, `${p.name} was ${p.role === "crew" ? "crew and can still help with jobs" : "the mischief maker"}.`);
  } else note(s, "No clear vote. Everyone stays this time.");
  note(s, voteSummaryText(s));
  s.phase = "explore";
  s.phaseLeft = 0;
  s.votes = {};
  s.ready = [];
  s.lastMeeting = s.tick;
  outcome(s);
}
/** Public aggregate, never individual ballots or unrevealed roles. Uses the existing event wire field. */
export function voteSummaryText(s: MysterySession): string {
  const summary = s.voteSummary;
  if (!summary) return "";
  const accused = s.players.find((p) => p.id === summary.accusedId);
  const result = accused
    ? `${accused.name} was accused: ${summary.role === "mischief" ? "mischief maker caught!" : "crew, now a helper."}`
    : "No one was accused. Everyone stays.";
  return `Vote result: ${result}`;
}
export function applyMysteryIntent(
  state: MysterySession,
  actorId: string,
  intent: MysteryIntent,
  expectedRevision?: number
): MysterySession {
  if (intent.type === "step") {
    if (!validMysteryIntent(intent)) return state;
    const actor = state.players.find((p) => p.id === actorId);
    if (!actor || actor.x !== intent.fromX || actor.y !== intent.fromY) return state;
    return applyMysteryIntent(state, actorId, { type: "move", dx: intent.dx, dy: intent.dy }, expectedRevision);
  }
  if (
    state.result ||
    pausedMystery(state) ||
    (expectedRevision !== undefined && expectedRevision !== state.revision) ||
    !validMysteryIntent(intent)
  )
    return state;
  const original = state.players.find((p) => p.id === actorId);
  if (!original || !original.connected) return state;
  if (
    original.out &&
    (!state.adventure ||
      original.role !== "crew" ||
      !["move", "task", "repair", "rescue", "wait"].includes(intent.type))
  )
    return state;
  const s = copy(state),
    p = s.players.find((p) => p.id === actorId)!;
  if (intent.type === "wait") {
    if (!s.solo) return state;
    // Explicit practice beat. Reading or opening the notebook never advances this clock.
  } else if (intent.type === "ready") {
    if (s.phase !== "discussion" || s.ready.includes(p.id)) return state;
    s.ready.push(p.id);
    if (s.ready.length === alive(s).length) {
      s.phase = "voting";
      s.phaseLeft = 25;
    }
  } else if (intent.type === "vote") {
    if (
      s.phase !== "voting" ||
      s.votes[p.id] !== undefined ||
      (intent.target !== "skip" && !alive(s).some((v) => v.id === intent.target))
    )
      return state;
    s.votes[p.id] = intent.target;
    if (Object.keys(s.votes).length === alive(s).length) resolveVotes(s);
  } else {
    if (s.phase !== "explore") return state;
    if (intent.type === "move") {
      const next = { x: p.x + intent.dx, y: p.y + intent.dy };
      if (!walkable(next)) return state;
      if (s.adventure && !s.solo) {
        const moved = s.adventure.moves[p.id];
        if (moved?.tick === s.tick && moved.count >= 4) return state;
        s.adventure.moves[p.id] = { tick: s.tick, count: moved?.tick === s.tick ? moved.count + 1 : 1 };
      }
      p.x = next.x;
      p.y = next.y;
    } else if (intent.type === "task") {
      const task = TASKS.find((t) => t.id === intent.task)!;
      if (!close(p, task) || s.tasks[task.id] === 3 || s.sabotage) return state;
      if (p.role === "crew") {
        if (s.adventure) {
          const data = s.adventure.taskData;
          if (task.id === "garden" || task.id === "picnic") {
            if (intent.choice > 2) return state;
            if (data[task.id] & (1 << intent.choice)) return state;
            data[task.id] |= 1 << intent.choice;
            s.tasks[task.id] = countBits(data[task.id]);
          } else if (task.id === "stars") {
            if (intent.choice === 0) data.stars = (data.stars + 7) % 8;
            else if (intent.choice === 1) data.stars = (data.stars + 1) % 8;
            else if (intent.choice === 2) {
              if (data.stars === STAR_TARGETS[s.tasks.stars]) s.tasks.stars++;
              else addClue(p, "Telescope tip: turn the pointer until it meets the glowing star, then align.");
            } else return state;
          } else {
            if (intent.choice < 3) {
              if (data.dock & (1 << intent.choice) || data.rope === intent.choice) return state;
              data.rope = intent.choice;
            } else if (data.rope === intent.choice - 3) {
              data.dock |= 1 << data.rope;
              data.rope = -1;
              s.tasks.dock = countBits(data.dock);
            } else addClue(p, "Dock tip: choose a boat rope, then its matching shore cleat. Match shape and color.");
          }
          if (s.tasks[task.id] === 3) {
            note(s, `${task.name} is complete.`);
            witnesses(s, p, `${p.name} finished a real job at ${task.name.toLowerCase()}.`);
            const nearby = s.players.filter((w) => w.id !== p.id && w.connected && sightDistance(w, p) <= 3).map((w) => w.name);
            const neighbors = nearby.slice(0, 2).join(" and ") + (nearby.length > 2 ? ` and ${nearby.length - 2} others` : "");
            addClue(
              p,
              `You finished ${task.name.toLowerCase()}. ${nearby.length ? neighbors + " were nearby." : "Nobody was nearby."}`
            );
          }
        } else if (intent.choice === task.order[s.tasks[task.id]]) {
          s.tasks[task.id]++;
          if (s.tasks[task.id] === 3) note(s, `${p.name} finished ${task.name.toLowerCase()}.`);
        } else {
          s.tasks[task.id] = 0;
          addClue(p, "Try the task pattern again from the beginning.");
        }
      } else
        addClue(
          p,
          s.adventure
            ? "You checked this station as a disguise. Only crew can finish shared jobs."
            : "Pretend task checked. Only crew actions fill the shared jobs."
        );
    } else if (intent.type === "sabotage") {
      if ((gentleCrew(s) && p.bot) || p.role !== "mischief" || !close(p, PUMP) || s.sabotage || s.tick < s.sabotageReady) return state;
      s.sabotage = { left: 60, progress: 0 };
      if (s.adventure) witnesses(s, p, `${p.name} turned off the water at the pump.`);
      s.sabotageReady = s.tick + 35;
      note(s, "The picnic water supply is off! Repair the pump before time runs out.");
    } else if (intent.type === "repair") {
      if (!s.sabotage || !close(p, PUMP)) return state;
      s.sabotage.progress = intent.choice === REPAIR_ORDER[s.sabotage.progress] ? s.sabotage.progress + 1 : 0;
      if (s.sabotage.progress === 3) {
        s.sabotage = null;
        note(s, `${p.name} repaired the pump.`);
      }
    } else if (intent.type === "prank") {
      const target = s.players.find((t) => t.id === intent.target);
      if (
        p.role !== "mischief" ||
        s.tick < p.prankReady ||
        !target ||
        target.id === p.id ||
        target.out ||
        target.role !== "crew" ||
        !close(p, target, 1)
      )
        return state;
      if (s.adventure) {
        if ((s.adventure.ribbons[target.id] ?? 0) > s.tick) return state;
        s.adventure.ribbons[target.id] = s.tick + (s.solo ? 12 : 40);
        s.adventure.pranks++;
        p.prankReady = s.tick + prankDelay(s.solo, gentleCrew(s));
        witnesses(s, p, `${p.name} tied a ribbon near ${target.name}.`);
        note(
          s,
          `${target.name} found a surprise ribbon! Everyone can still move and do jobs. ${s.adventure.pranks}/${TRICK_GOAL} tricks.`
        );
      } else {
        target.out = true;
        p.prankReady = s.tick + 18;
        witnesses(s, p, `${p.name} made the prank near ${target.name}.`);
        note(s, `${target.name} was sent to the hammock by a silly prank. They can watch this round.`);
      }
    } else if (intent.type === "rescue") {
      const target = s.players.find((t) => t.id === intent.target);
      if (
        !s.adventure ||
        p.role !== "crew" ||
        !target ||
        !close(p, target, 1) ||
        (s.adventure.ribbons[target.id] ?? 0) <= s.tick
      )
        return state;
      delete s.adventure.ribbons[target.id];
      note(
        s,
        `${p.name} unwrapped ${target.id === p.id ? "their" : target.name + "’s"} ribbon. Back to the adventure!`
      );
    } else if (intent.type === "meeting") {
      if (!close(p, BELL) || p.meetings <= 0 || s.tick - s.lastMeeting < 10 || s.sabotage) return state;
      p.meetings--;
      s.phase = "discussion";
      s.phaseLeft = 20;
      s.votes = {};
      s.ready = [];
      note(s, `${p.name} rang the meeting bell. Share clues aloud, then vote.`);
    } else return state;
  }
  s.revision++;
  outcome(s);
  return s;
}
/** Host clock only. Clients cannot advance timers through move or forged tick messages. */
export function tickMystery(state: MysterySession): MysterySession {
  if (state.result || pausedMystery(state)) return state;
  const s = copy(state);
  s.tick++;
  s.revision++;
  if (s.solo && s.phase === "explore" && s.sabotage) {
    s.sabotage.left--;
    if (s.sabotage.left <= 0) end(s, "mischief", "sabotage");
  }
  if (s.solo && (s.phase === "discussion" || s.phase === "voting")) {
    s.phaseLeft--;
    if (s.phaseLeft <= 0) {
      if (s.phase === "discussion") {
        s.phase = "voting";
        s.phaseLeft = 25;
      } else {
        alive(s).forEach((p) => {
          if (s.votes[p.id] === undefined) s.votes[p.id] = "skip";
        });
        resolveVotes(s);
      }
    }
  }
  return s;
}
export function mysteryConnection(state: MysterySession, id: string, connected: boolean): MysterySession {
  if (!state.players.some((p) => p.id === id && p.connected !== connected)) return state;
  const s = copy(state);
  s.players.find((p) => p.id === id)!.connected = connected;
  s.revision++;
  note(
    s,
    connected
      ? "A family player rejoined."
      : state.players.find((p) => p.id === id)?.out
        ? "A helper disconnected. The adventure continues."
        : "A family player disconnected. The round is paused until they rejoin."
  );
  return s;
}
export type AdventureView = Adventure;
export type MysteryView = {
  version: 1;
  adventure?: AdventureView;
  id: string;
  revision: number;
  tick: number;
  solo: boolean;
  selfId: string;
  ownRole: Role;
  players: (Point & {
    id: string;
    name: string;
    out: boolean;
    connected: boolean;
    meetings: number;
    visible?: boolean;
  })[];
  phase: Phase;
  phaseLeft: number;
  tasks: MysterySession["tasks"];
  sabotage: MysterySession["sabotage"];
  sabotageReadyIn: number;
  prankReadyIn: number;
  clues: string[];
  readyCount: number;
  selfReady: boolean;
  selfVoted: boolean;
  votesCast: number;
  canMeet: boolean;
  paused: boolean;
  events: string[];
  result: MysterySession["result"];
};
function publicEvents(s: MysterySession): string[] {
  if (!s.voteSummary) return s.events.slice();
  const summary = [voteSummaryText(s), ...Object.entries(s.voteSummary.tally).map(([id, count]) =>
    `Vote tally: ${id === "skip" ? "Skip" : s.players.find((p) => p.id === id)!.name}: ${count}`)];
  const recent = s.events.filter((event) => !event.startsWith("Vote result:") && !event.startsWith("Vote tally:"));
  // Keep the latest live event last, while retaining the public result within the existing 12-event bound.
  return [...summary, ...recent.slice(-(12 - summary.length))];
}
export function mysteryView(s: MysterySession, recipient: string): MysteryView {
  const p = s.players.find((p) => p.id === recipient);
  if (!p) throw new Error("Unknown recipient.");
  return {
    version: 1,
    ...(s.adventure
      ? {
          adventure: {
            ...s.adventure,
            taskData: { ...s.adventure.taskData },
            ribbons: { ...s.adventure.ribbons },
            moves: Object.fromEntries(Object.entries(s.adventure.moves).map(([id, m]) => [id, { ...m }])),
          },
        }
      : {}),
    id: s.id,
    revision: s.revision,
    tick: s.tick,
    solo: s.solo,
    selfId: recipient,
    ownRole: p.role,
    players: s.players.map(({ id, name, x, y, out, connected, meetings }) => {
      const visible = !s.adventure || id === recipient || sightDistance(p, { x, y }) <= 3;
      return {
        id,
        name,
        x: visible ? x : -1,
        y: visible ? y : -1,
        out,
        connected,
        meetings,
        ...(s.adventure ? { visible } : {}),
      };
    }),
    phase: s.phase,
    phaseLeft: s.phaseLeft,
    tasks: { ...s.tasks },
    sabotage: s.sabotage ? { ...s.sabotage } : null,
    sabotageReadyIn: Math.max(0, s.sabotageReady - s.tick),
    prankReadyIn: Math.max(0, p.prankReady - s.tick),
    clues: p.clues.slice(),
    readyCount: s.ready.length,
    selfReady: s.ready.includes(p.id),
    selfVoted: s.votes[p.id] !== undefined,
    votesCast: Object.keys(s.votes).length,
    canMeet: p.meetings > 0 && s.tick - s.lastMeeting >= 10 && !s.sabotage,
    paused: pausedMystery(s),
    events: publicEvents(s),
    result: s.result ? { ...s.result } : null,
  };
}
export function pathStep(from: Point, goal: Point): Point | null {
  const queue: Point[] = [from],
    seen = new Set([`${from.x},${from.y}`]),
    previous = new Map<string, Point>();
  for (let i = 0; i < queue.length; i++) {
    const p = queue[i];
    if (close(p, goal)) {
      let step = p;
      while (previous.has(`${step.x},${step.y}`) && !close(previous.get(`${step.x},${step.y}`)!, from))
        step = previous.get(`${step.x},${step.y}`)!;
      return close(step, from) ? null : { x: step.x - from.x, y: step.y - from.y };
    }
    for (const d of [
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
      { x: 0, y: -1 },
    ]) {
      const n = { x: p.x + d.x, y: p.y + d.y },
        key = `${n.x},${n.y}`;
      if (walkable(n) && !seen.has(key)) {
        seen.add(key);
        previous.set(key, p);
        queue.push(n);
      }
    }
  }
  return null;
}
/** Bot policy consumes the same redacted view a human receives. */
export function chooseMysteryBot(v: MysteryView): MysteryIntent | null {
  const p = v.players.find((p) => p.id === v.selfId)!;
  if ((p.out && !v.adventure) || v.paused || v.result) return null;
  if (v.phase === "discussion")
    return !p.out && !v.selfReady && (v.adventure || v.phaseLeft < 17) ? { type: "ready" } : null;
  if (v.phase === "voting") {
    if (v.selfVoted || p.out) return null;
    const suspect = v.players.find(
      (t) =>
        !t.out &&
        t.id !== p.id &&
        v.clues.some(
          (c) =>
            c.startsWith(`${t.name} made the prank`) ||
            c.startsWith(`${t.name} tied a ribbon`) ||
            c.startsWith(`${t.name} turned off`)
        )
    );
    return { type: "vote", target: suspect?.id ?? "skip" };
  }
  if (v.phase !== "explore") return null;
  let goal: Point;
  if (v.sabotage && v.ownRole === "crew") {
    goal = PUMP;
    if (close(p, goal)) return { type: "repair", choice: REPAIR_ORDER[v.sabotage.progress] };
  } else if (v.ownRole === "mischief") {
    const targets = v.players
      .filter((t) => !t.out && t.id !== p.id && t.visible !== false)
      .sort((a, b) => Math.abs(a.x - p.x) + Math.abs(a.y - p.y) - (Math.abs(b.x - p.x) + Math.abs(b.y - p.y)));
    const target = targets.find((t) => !v.adventure || (v.adventure.ribbons[t.id] ?? 0) <= v.tick);
    if (!target) {
      const patrol = TASKS[(v.players.findIndex((t) => t.id === p.id) + Math.floor(v.tick / 12)) % TASKS.length];
      const step = pathStep(p, patrol);
      return step ? { type: "move", dx: step.x, dy: step.y } : { type: "wait" };
    }
    if (!v.prankReadyIn && close(p, target, 1)) return { type: "prank", target: target.id };
    if (!v.sabotage && !v.sabotageReadyIn && v.tick % 3 === 0) {
      goal = PUMP;
      if (close(p, goal)) return { type: "sabotage" };
    } else goal = target;
  } else {
    const sawPrank = v.players.some(
      (t) =>
        !t.out &&
        t.id !== p.id &&
        v.clues.some(
          (c) =>
            c.startsWith(`${t.name} made the prank`) ||
            c.startsWith(`${t.name} tied a ribbon`) ||
            c.startsWith(`${t.name} turned off`)
        )
    );
    if (sawPrank && v.canMeet && !p.out) {
      goal = BELL;
      if (close(p, goal)) return { type: "meeting" };
    } else {
      const remaining = TASKS.filter((t) => v.tasks[t.id] < 3);
      if (!remaining.length) return null;
      const task = remaining[(v.players.findIndex((t) => t.id === p.id) + Math.floor(v.tick / 30)) % remaining.length];
      goal = task;
      if (close(p, goal)) {
        let choice: number = task.order[v.tasks[task.id]];
        if (v.adventure) {
          const data = v.adventure.taskData;
          if (task.id === "garden" || task.id === "picnic")
            choice = [0, 1, 2].find((i) => !(data[task.id] & (1 << i)))!;
          else if (task.id === "stars") choice = data.stars === STAR_TARGETS[v.tasks.stars] ? 2 : 1;
          else choice = data.rope < 0 ? [0, 1, 2].find((i) => !(data.dock & (1 << i)))! : data.rope + 3;
        }
        return { type: "task", task: task.id, choice };
      }
    }
  }
  const step = pathStep(p, goal);
  return step ? { type: "move", dx: step.x, dy: step.y } : null;
}
export function soloMysteryTick(s: MysterySession): MysterySession {
  if (s.adventure) return s;
  let next = tickMystery(s);
  if (next.tick % 2 !== 0 || next.result) return next;
  for (const bot of next.players.filter((p) => p.bot)) {
    const intent = chooseMysteryBot(mysteryView(next, bot.id));
    if (intent) next = applyMysteryIntent(next, bot.id, intent);
  }
  return next;
}
function object(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}
const integer = (v: unknown, min: number, max: number): v is number =>
  Number.isInteger(v) && (v as number) >= min && (v as number) <= max;
const text = (v: unknown, max = 100): v is string =>
  typeof v === "string" && v.length > 0 && v.length <= max && !/[\p{C}]/u.test(v);
const strings = (v: unknown, length: number, max = 200): v is string[] =>
  Array.isArray(v) && v.length <= length && v.every((t) => text(t, max));
export function validMysteryIntent(v: unknown): v is MysteryIntent {
  if (!object(v)) return false;
  const keys = Object.keys(v).sort().join(",");
  switch (v.type) {
    case "step":
      return (
        keys === "dx,dy,fromX,fromY,type" &&
        integer(v.fromX, 1, 7) &&
        integer(v.fromY, 1, 5) &&
        integer(v.dx, -1, 1) &&
        integer(v.dy, -1, 1) &&
        Math.abs(v.dx) + Math.abs(v.dy) === 1
      );
    case "move":
      return (
        keys === "dx,dy,type" && integer(v.dx, -1, 1) && integer(v.dy, -1, 1) && Math.abs(v.dx) + Math.abs(v.dy) === 1
      );
    case "task":
      return (
        keys === "choice,task,type" &&
        TASKS.some((t) => t.id === v.task) &&
        integer(v.choice, 0, v.task === "dock" ? 5 : 2)
      );
    case "repair":
      return keys === "choice,type" && integer(v.choice, 0, 2);
    case "prank":
    case "rescue":
    case "vote":
      return keys === "target,type" && text(v.target, 64);
    case "wait":
    case "sabotage":
    case "meeting":
    case "ready":
      return keys === "type";
    default:
      return false;
  }
}
export function validMysterySession(v: unknown): v is MysterySession {
  if (
    !object(v) ||
    v.version !== 1 ||
    v.game !== "island-mystery" ||
    !text(v.id, 160) ||
    !integer(v.seed, 0, 0xffffffff) ||
    !integer(v.revision, 0, 10000000) ||
    !integer(v.tick, 0, 1000000) ||
    typeof v.solo !== "boolean"
  )
    return false;
  if (
    !Array.isArray(v.players) ||
    v.players.length < 3 ||
    v.players.length > 8 ||
    !v.players.every(
      (p) =>
        object(p) &&
        text(p.id, 64) &&
        text(p.name, 20) &&
        ["crew", "mischief"].includes(p.role as string) &&
        typeof p.bot === "boolean" &&
        typeof p.out === "boolean" &&
        typeof p.connected === "boolean" &&
        integer(p.meetings, 0, 2) &&
        integer(p.prankReady, 0, 1000040) &&
        strings(p.clues, 6) &&
        walkable(p as Point)
    )
  )
    return false;
  const s = v as unknown as MysterySession;
  if (
    s.adventure !== undefined &&
    !validAdventure(
      s.adventure,
      s.players.map((p) => p.id),
      s.tick
    )
  )
    return false;
  if (s.voteSummary !== undefined) {
    const r = s.voteSummary;
    if (!object(r) || Object.keys(r).sort().join(",") !== "accusedId,role,tally" || !object(r.tally)) return false;
    const entries = Object.entries(r.tally);
    if (!entries.length || entries.length > s.players.length + 1 ||
      entries.some(([id, count]) => (id !== "skip" && !s.players.some((p) => p.id === id)) || !integer(count, 1, 8)) ||
      entries.reduce((sum, [, n]) => sum + n, 0) > s.players.length) return false;
    const ranked = entries.sort((a, b) => b[1] - a[1]);
    const winner = ranked[0][0] !== "skip" && ranked[0][1] > (ranked[1]?.[1] ?? 0) ? ranked[0][0] : null;
    const accused = s.players.find((p) => p.id === r.accusedId);
    if (r.accusedId !== winner || (winner === null ? r.role !== null : !accused?.out || accused.role !== r.role)) return false;
  }
  if (
    new Set(s.players.map((p) => p.name.toLowerCase())).size !== s.players.length ||
    new Set(s.players.map((p) => p.id)).size !== s.players.length ||
    s.players.filter((p) => p.role === "mischief").length !== 1 ||
    s.solo !== s.players.some((p) => p.bot)
  )
    return false;
  if (
    !["explore", "discussion", "voting", "finished"].includes(s.phase) ||
    !integer(s.phaseLeft, 0, 25) ||
    !object(s.tasks) ||
    Object.keys(s.tasks).sort().join(",") !== "dock,garden,picnic,stars" ||
    !TASKS.every((t) => integer(s.tasks[t.id], 0, 3)) ||
    !integer(s.sabotageReady, 0, 1000035) ||
    !integer(s.lastMeeting, -10, s.tick) ||
    !strings(s.events, 12)
  )
    return false;
  if (
    s.sabotage !== null &&
    (!object(s.sabotage) || !integer(s.sabotage.left, 0, 60) || !integer(s.sabotage.progress, 0, 2))
  )
    return false;
  if (
    !object(s.votes) ||
    !strings(s.ready, 8, 64) ||
    new Set(s.ready).size !== s.ready.length ||
    s.ready.some((id) => !alive(s).some((p) => p.id === id)) ||
    Object.keys(s.votes).length > 8 ||
    Object.entries(s.votes).some(
      ([id, target]) =>
        !alive(s).some((p) => p.id === id) || (target !== "skip" && !alive(s).some((p) => p.id === target))
    )
  )
    return false;
  if (
    (s.phase === "discussion" || s.phase === "voting") !== s.phaseLeft > 0 ||
    (s.phase !== "voting" && Object.keys(s.votes).length) ||
    (s.phase !== "discussion" && s.phase !== "voting" && s.ready.length)
  )
    return false;
  if (
    s.adventure &&
    ["garden", "picnic", "dock"].some(
      (id) => s.tasks[id as TaskId] !== countBits(s.adventure!.taskData[id as "garden"])
    )
  )
    return false;
  if (s.adventure) {
    const troublemaker = s.players.find((p) => p.role === "mischief")!;
    const { pranks, taskData, ribbons } = s.adventure;
    const delay = prankDelay(s.solo, gentleCrew(s));
    // A backup cannot manufacture early points, erase the trickster's cooldown,
    // or claim a rope is both connected and still selected for connecting.
    if (
      Object.keys(ribbons).length > pranks ||
      (taskData.rope >= 0 && !!(taskData.dock & (1 << taskData.rope))) ||
      troublemaker.prankReady < openingDelay(s.solo, gentleCrew(s)) + pranks * delay ||
      troublemaker.prankReady > s.tick + delay ||
      (pranks > 0 && s.tick < openingDelay(s.solo, gentleCrew(s)) + (pranks - 1) * delay)
    )
      return false;
  }
  if (s.result === null) {
    if (
      s.phase === "finished" ||
      !alive(s).some((p) => p.role === "mischief") ||
      TASKS.every((t) => s.tasks[t.id] === 3) ||
      (s.adventure ? s.adventure.pranks >= TRICK_GOAL : alive(s).filter((p) => p.role === "crew").length <= 1) ||
      s.sabotage?.left === 0
    )
      return false;
  } else {
    if (
      !object(s.result) ||
      s.phase !== "finished" ||
      !["crew", "mischief"].includes(s.result.winner) ||
      !["tasks", "caught", "pranks", "sabotage"].includes(s.result.reason)
    )
      return false;
    if (s.result.reason === "tasks" && (s.result.winner !== "crew" || !TASKS.every((t) => s.tasks[t.id] === 3)))
      return false;
    if (s.result.reason === "caught" && (s.result.winner !== "crew" || alive(s).some((p) => p.role === "mischief")))
      return false;
    if (
      s.result.reason === "pranks" &&
      (s.result.winner !== "mischief" ||
        (s.adventure ? s.adventure.pranks < TRICK_GOAL : alive(s).filter((p) => p.role === "crew").length > 1))
    )
      return false;
    if (s.result.reason === "sabotage" && (s.result.winner !== "mischief" || s.sabotage?.left !== 0)) return false;
  }
  return true;
}
/** Validate received redacted snapshots without ever accepting hidden-role fields. */
export function validMysteryView(v: unknown): v is MysteryView {
  if (
    !object(v) ||
    Object.keys(v).sort().join(",") !==
      (v.adventure === undefined ? "" : "adventure,") +
        "canMeet,clues,events,id,ownRole,paused,phase,phaseLeft,players,prankReadyIn,readyCount,result,revision,sabotage,sabotageReadyIn,selfId,selfReady,selfVoted,solo,tasks,tick,version,votesCast"
  )
    return false;
  if (
    !object(v) ||
    v.version !== 1 ||
    !text(v.id, 160) ||
    !integer(v.revision, 0, 10000000) ||
    !integer(v.tick, 0, 1000000) ||
    typeof v.solo !== "boolean" ||
    !text(v.selfId, 64) ||
    !["crew", "mischief"].includes(v.ownRole as string)
  )
    return false;
  if (
    !Array.isArray(v.players) ||
    v.players.length < 3 ||
    v.players.length > 8 ||
    !v.players.every(
      (p) =>
        object(p) &&
        Object.keys(p).sort().join(",") ===
          (v.adventure === undefined
            ? "connected,id,meetings,name,out,x,y"
            : "connected,id,meetings,name,out,visible,x,y") &&
        text(p.id, 64) &&
        text(p.name, 20) &&
        (v.adventure === undefined
          ? walkable(p as Point)
          : typeof p.visible === "boolean" && (p.visible ? walkable(p as Point) : p.x === -1 && p.y === -1)) &&
        typeof p.connected === "boolean" &&
        typeof p.out === "boolean" &&
        integer(p.meetings, 0, 2)
    )
  )
    return false;
  if (
    !v.players.some((p) => p.id === v.selfId && p.visible !== false) ||
    new Set(v.players.map((p) => p.id)).size !== v.players.length ||
    !["explore", "discussion", "voting", "finished"].includes(v.phase as string) ||
    !integer(v.phaseLeft, 0, 25) ||
    !object(v.tasks) ||
    Object.keys(v.tasks).sort().join(",") !== "dock,garden,picnic,stars" ||
    !TASKS.every((t) => integer((v.tasks as Record<string, unknown>)[t.id], 0, 3))
  )
    return false;
  if (
    v.sabotage !== null &&
    (!object(v.sabotage) || !integer(v.sabotage.left, 0, 60) || !integer(v.sabotage.progress, 0, 2))
  )
    return false;
  if (
    !integer(v.sabotageReadyIn, 0, 1000035) ||
    !integer(v.prankReadyIn, 0, 1000040) ||
    !strings(v.clues, 6) ||
    !strings(v.events, 12) ||
    !integer(v.readyCount, 0, 8) ||
    !integer(v.votesCast, 0, 8) ||
    typeof v.selfReady !== "boolean" ||
    typeof v.selfVoted !== "boolean" ||
    typeof v.canMeet !== "boolean" ||
    typeof v.paused !== "boolean"
  )
    return false;
  if (
    v.adventure !== undefined &&
    !validAdventure(
      v.adventure,
      v.players.map((p) => p.id as string),
      v.tick as number
    )
  )
    return false;
  if ((v.phase === "discussion" || v.phase === "voting") !== (v.phaseLeft as number) > 0) return false;
  if (v.result === null) return v.phase !== "finished";
  return (
    object(v.result) &&
    v.phase === "finished" &&
    ["crew", "mischief"].includes(v.result.winner as string) &&
    ["tasks", "caught", "pranks", "sabotage"].includes(v.result.reason as string)
  );
}

function addClue(p: MysteryPlayer, message: string) {
  if (p.clues.at(-1) !== message) p.clues = [...p.clues.slice(-5), message];
}
function witnesses(s: MysterySession, actor: MysteryPlayer, message: string) {
  s.players.filter((w) => w.id !== actor.id && w.connected && (s.adventure ? sightDistance(w, actor) <= 3 : close(w, actor, 2))).forEach((w) => addClue(w, message));
}
/** Solo time is a deliberate turn, never time spent reading. Legacy saves retain old rules but use this explicit pace in the UI. */
export function playSoloIntent(state: MysterySession, intent: MysteryIntent): MysterySession {
  const human = state.players.find((p) => !p.bot);
  if (!human || !state.solo) return state;
  if (!state.adventure && human.out && intent.type === "wait") return soloMysteryTick(state);
  let next = applyMysteryIntent(state, human.id, intent, state.revision);
  if (next === state || next.result) return next;
  next = tickMystery(next);
  if (!next.adventure) return soloMysteryTick(next);
  // Bots move half as often as the player. Meeting responses are immediate once the human is ready.
  if (next.tick % 2 === 0 || next.phase === "discussion" || next.phase === "voting") {
    for (const bot of next.players.filter((p) => p.bot)) {
      const action = chooseMysteryBot(mysteryView(next, bot.id));
      if (action) next = applyMysteryIntent(next, bot.id, action);
    }
  }
  return next;
}
function validAdventure(v: unknown, ids: string[], tick: number): v is Adventure {
  if (
    !object(v) ||
    Object.keys(v).filter(k => k !== "balance").sort().join(",") !== "edition,moves,pranks,ribbons,round,taskData" ||
    (v.balance !== undefined && !["gentle", "challenge"].includes(v.balance as string)) ||
    v.edition !== 2 ||
    !integer(v.round, 1, 1000) ||
    !integer(v.pranks, 0, TRICK_GOAL) ||
    !object(v.taskData) ||
    Object.keys(v.taskData).sort().join(",") !== "dock,garden,picnic,rope,stars" ||
    !["garden", "picnic", "dock", "stars"].every((key) =>
      integer((v.taskData as Record<string, unknown>)[key], 0, 7)
    ) ||
    !integer(v.taskData.rope, -1, 2) ||
    !object(v.ribbons) ||
    Object.keys(v.ribbons).length > ids.length ||
    !object(v.moves) ||
    Object.entries(v.moves).some(
      ([id, m]) =>
        !ids.includes(id) ||
        !object(m) ||
        Object.keys(m).sort().join(",") !== "count,tick" ||
        !integer(m.tick, 0, tick) ||
        !integer(m.count, 1, 4)
    ) ||
    Object.entries(v.ribbons).some(([id, until]) => !ids.includes(id) || !integer(until, 0, tick + 40))
  )
    return false;
  return true;
}

/** Nearby bushes and paths limit observations. Hidden coordinates never enter recipient packets. */
function sightDistance(from: Point, to: Point) {
  const queue = [{ ...from, distance: 0 }],
    seen = new Set([`${from.x},${from.y}`]);
  for (let i = 0; i < queue.length; i++) {
    const point = queue[i];
    if (point.x === to.x && point.y === to.y) return point.distance;
    if (point.distance >= 3) continue;
    for (const d of [
      { x: 1, y: 0 },
      { x: -1, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: -1 },
    ]) {
      const next = { x: point.x + d.x, y: point.y + d.y, distance: point.distance + 1 },
        key = `${next.x},${next.y}`;
      if (walkable(next) && !seen.has(key)) {
        seen.add(key);
        queue.push(next);
      }
    }
  }
  return Infinity;
}
