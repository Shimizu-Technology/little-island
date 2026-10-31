import { describe, expect, it } from "vitest";
import {
  MysterySession,
  STAR_TARGETS,
  TASKS,
  applyMysteryIntent,
  createMysterySession,
  mysteryConnection,
  mysteryView,
  pathStep,
  pausedMystery,
  playSoloIntent,
  playerColor,
  soloMysteryTick,
  tickMystery,
  validMysteryIntent,
  validMysterySession,
  validMysteryView,
} from "../src/mystery/engine";
import { MysteryHost, helloPacket, intentPacket, parseRoomPacket } from "../src/mystery/protocol";
import { emptySave, parseSave } from "../src/state/validation";
const seats = [
  { id: "host", name: "Parent" },
  { id: "p1", name: "Mango" },
  { id: "p2", name: "Pearl" },
];
const fresh = (role: "crew" | "mischief" = "crew") => createMysterySession(seats, 42, role, "adventure-test");
const at = (s: MysterySession, id: string, x: number, y: number): MysterySession => ({
  ...s,
  players: s.players.map((p) => (p.id === id ? { ...p, x, y } : p)),
});
const action = (s: MysterySession, id: string, type: Parameters<typeof applyMysteryIntent>[2]) =>
  applyMysteryIntent(s, id, type);
const task = (s: MysterySession, id: "garden" | "stars" | "picnic" | "dock", choice: number) =>
  action(s, "host", { type: "task", task: id, choice });
describe("Picnic adventure: agency and different direct jobs", () => {
  it("has no idle bot result or clock advance while either practice role reads", () => {
    for (const role of ["crew", "mischief"] as const)
      for (let seed = 0; seed < 40; seed++) {
        const start = createMysterySession(undefined, seed, role);
        let s = start;
        for (let second = 0; second < 500; second++) s = soloMysteryTick(s);
        expect(s).toBe(start);
        expect(s.result).toBeNull();
      }
  });
  it("human can walk to first job and collect their first contextual notebook observation", () => {
    let s = createMysterySession(undefined, 7, "crew");
    for (let i = 0; i < 60 && s.tasks.garden < 3 && !s.result; i++) {
      const p = s.players[0];
      const step = pathStep(p, TASKS[0]);
      s = playSoloIntent(
        s,
        step
          ? { type: "step", fromX: p.x, fromY: p.y, dx: step.x, dy: step.y }
          : { type: "task", task: "garden", choice: [0, 1, 2].find((c) => !(s.adventure!.taskData.garden & (1 << c)))! }
      );
      expect(validMysterySession(s)).toBe(true);
    }
    expect(s.tasks.garden).toBe(3);
    expect(s.players[0].clues.some((c) => c.startsWith("You finished water the garden"))).toBe(true);
    expect(s.tick).toBeGreaterThan(0);
    expect(s.players.some((p, i) => i > 0 && (p.x !== [3, 5, 4][i - 1] || p.y !== [3, 3, 2][i - 1]))).toBe(true);
  });
  it("watering and packing are unordered unique objects; repeated taps do not advance state", () => {
    let s = at(fresh(), "host", 1, 1);
    for (const choice of [2, 0]) s = task(s, "garden", choice);
    expect(s.tasks.garden).toBe(2);
    expect(task(s, "garden", 2)).toBe(s);
    s = task(s, "garden", 1);
    expect(s.tasks.garden).toBe(3);
    s = at(s, "host", 7, 5);
    for (const choice of [1, 2, 0]) s = task(s, "picnic", choice);
    expect(s.tasks.picnic).toBe(3);
    expect(s.adventure!.taskData.picnic).toBe(7);
    expect(validMysterySession(s)).toBe(true);
  });
  it("telescope must be turned and aligned at three actual targets", () => {
    let s = at(fresh(), "host", 7, 1);
    s = task(s, "stars", 2);
    expect(s.tasks.stars).toBe(0);
    expect(s.players[0].clues.at(-1)).toContain("Telescope tip");
    for (const target of STAR_TARGETS) {
      while (s.adventure!.taskData.stars !== target) s = task(s, "stars", 1);
      s = task(s, "stars", 2);
    }
    expect(s.tasks.stars).toBe(3);
    expect(validMysterySession(s)).toBe(true);
  });
  it("ropes require matching boat and shore endpoints and all four jobs produce a crew result", () => {
    let s = at(fresh(), "host", 1, 5);
    s = task(s, "dock", 3);
    expect(s.tasks.dock).toBe(0);
    s = task(s, "dock", 1);
    s = task(s, "dock", 3);
    expect(s.tasks.dock).toBe(0);
    s = task(s, "dock", 4);
    expect(s.tasks.dock).toBe(1);
    for (const i of [0, 2]) {
      s = task(s, "dock", i);
      s = task(s, "dock", i + 3);
    }
    for (const job of TASKS.filter((t) => t.id !== "dock")) {
      s = at(s, "host", job.x, job.y);
      if (job.id === "stars")
        for (const target of STAR_TARGETS) {
          while (s.adventure!.taskData.stars !== target) s = task(s, job.id, 1);
          s = task(s, job.id, 2);
        }
      else for (const i of [2, 0, 1]) s = task(s, job.id, i);
    }
    expect(s.result).toEqual({ winner: "crew", reason: "tasks" });
    expect(validMysterySession(s)).toBe(true);
  });
});
describe("fair small-family rules and authoritative inputs", () => {
  it("one prank cannot end a three-person round and the same target has protection", () => {
    let s = { ...fresh("mischief"), tick: 20 };
    s = action(s, "host", { type: "prank", target: "p1" });
    expect(s.adventure!.pranks).toBe(1);
    expect(s.players.every((p) => !p.out)).toBe(true);
    expect(s.result).toBeNull();
    expect(action(s, "host", { type: "prank", target: "p2" })).toBe(s);
    s = { ...s, tick: 45 };
    expect(action(s, "host", { type: "prank", target: "p1" })).toBe(s);
    s = action(s, "host", { type: "prank", target: "p2" });
    expect(s.adventure!.pranks).toBe(2);
    expect(s.result).toBeNull();
    s = { ...s, tick: 70 };
    s = action(s, "host", { type: "prank", target: "p1" });
    expect(s.result).toEqual({ winner: "mischief", reason: "pranks" });
    expect(validMysterySession(s)).toBe(true);
  });
  it("ribbon targets keep moving and can unwrap themselves without losing job progress", () => {
    let s = action({ ...fresh("mischief"), tick: 20 }, "host", { type: "prank", target: "p1" });
    s = action(s, "p1", { type: "move", dx: -1, dy: 0 });
    expect(s.players[1].x).toBe(2);
    s = action(s, "p1", { type: "rescue", target: "p1" });
    expect(s.adventure!.ribbons.p1).toBeUndefined();
    expect(s.adventure!.pranks).toBe(1);
    expect(validMysterySession(s)).toBe(true);
  });
  it("a wrong-voted crew helper can finish jobs, and its disconnect does not freeze the active round", () => {
    let s = fresh("mischief");
    s = action(s, "host", { type: "meeting" });
    for (const p of s.players) s = action(s, p.id, { type: "ready" });
    for (const p of s.players) s = action(s, p.id, { type: "vote", target: "p1" });
    expect(s.result).toBeNull();
    expect(s.players[1].out).toBe(true);
    expect(action(s, "p1", { type: "meeting" })).toBe(s);
    s = at(s, "p1", 1, 1);
    for (const choice of [0, 1, 2]) s = action(s, "p1", { type: "task", task: "garden", choice });
    expect(s.tasks.garden).toBe(3);
    const disconnected = mysteryConnection(s, "p1", false);
    expect(pausedMystery(disconnected)).toBe(false);
    expect(tickMystery(disconnected).tick).toBe(disconnected.tick + 1);
    const activeDisconnected = mysteryConnection(disconnected, "p2", false);
    expect(pausedMystery(activeDisconnected)).toBe(true);
    expect(tickMystery(activeDisconnected)).toBe(activeDisconnected);
    expect(validMysterySession(disconnected)).toBe(true);
  });
  it("shared movement budget applies to host and guests; stale path steps cannot overshoot", () => {
    let s = fresh();
    for (let i = 0; i < 4; i++) s = action(s, "host", { type: "move", dx: i % 2 ? -1 : 1, dy: 0 });
    expect(action(s, "host", { type: "move", dx: 1, dy: 0 })).toBe(s);
    s = tickMystery(s);
    const moved = action(s, "host", { type: "step", fromX: 4, fromY: 3, dx: 1, dy: 0 });
    expect(moved.players[0].x).toBe(5);
    expect(action(moved, "host", { type: "step", fromX: 4, fromY: 3, dx: 1, dy: 0 })).toBe(moved);
    let guest = s;
    for (let i = 0; i < 4; i++) guest = action(guest, "p1", { type: "move", dx: i % 2 ? -1 : 1, dy: 0 });
    expect(action(guest, "p1", { type: "move", dx: 1, dy: 0 })).toBe(guest);
    expect(validMysteryIntent({ type: "step", fromX: 4, fromY: 3, dx: 1, dy: 0, actor: "host" })).toBe(false);
  });
  it("nearby observations hide remote coordinates and every other role/secret", () => {
    const s = at(fresh(), "p2", 7, 5);
    const view = mysteryView(s, "host");
    expect(view.players[2]).toMatchObject({ x: -1, y: -1, visible: false });
    expect(view.players[0].visible).toBe(true);
    expect(validMysteryView(view)).toBe(true);
    expect(view.players.every((p) => !("role" in p) && !("clues" in p))).toBe(true);
    expect(validMysteryView({ ...view, players: view.players.map((p) => ({ ...p, role: "crew" })) })).toBe(false);
    expect(
      validMysteryView({ ...view, players: view.players.map((p) => (p.visible === false ? { ...p, x: 7, y: 5 } : p)) })
    ).toBe(false);
    expect(playerColor("p2")).toBe(playerColor(s.players.filter((p) => p.id !== "host")[1].id));
  });
  it("old build6 saves remain unchanged and malformed advanced state cannot enter backups", () => {
    const solo = createMysterySession(undefined, 42, "crew");
    const old = {
      ...solo,
      adventure: undefined,
      players: solo.players.map((p) => ({ ...p, prankReady: 12 })),
      sabotageReady: 20,
    };
    const raw = JSON.stringify({ ...emptySave(), activities: { "island-mystery": old } });
    const loaded = parseSave(raw).activities!["island-mystery"];
    expect(loaded).toEqual(JSON.parse(JSON.stringify(old)));
    expect(validMysterySession({ ...fresh(), adventure: { ...fresh().adventure, pranks: 4 } })).toBe(false);
    expect(validMysterySession({ ...fresh(), adventure: { ...fresh().adventure, pranks: 1 } })).toBe(false);
    const oneTrick = action({ ...fresh("mischief"), tick: 20 }, "host", { type: "prank", target: "p1" });
    expect(validMysterySession({ ...oneTrick, players: oneTrick.players.map((p) => ({ ...p, prankReady: 20 })) })).toBe(
      false
    );
    expect(validMysterySession({ ...fresh(), tasks: { ...fresh().tasks, garden: 3 } })).toBe(false);
    expect(validMysterySession({ ...fresh(), adventure: { ...fresh().adventure, ribbons: { stranger: 20 } } })).toBe(
      false
    );
    expect(
      validMysterySession({ ...fresh(), adventure: { ...fresh().adventure, moves: { host: { tick: 0, count: 5 } } } })
    ).toBe(false);
    expect(
      validMysterySession({ ...fresh(), result: { winner: "mischief", reason: "pranks" }, phase: "finished" })
    ).toBe(false);
  });
});
describe("same approved room rematch", () => {
  const room = "11111111-1111-4111-8111-111111111111";
  it("keeps peer seats, refreshes roles, conceals views, rejects old-round guest and host actions", () => {
    let secret = 0;
    const host = new MysteryHost(room, "Parent", () => `11111111-1111-4111-8111-${String(++secret).padStart(12, "0")}`);
    host.receive("a", helloPacket(room, "Mango", null));
    host.receive("b", helloPacket(room, "Pearl", null));
    host.start(42);
    expect(host.rematch()).toBe(false);
    const mischief = host.state!.players.find((p) => p.role === "mischief")!.id;
    host.local({ type: "meeting" }, 1);
    host.local({ type: "ready" }, 1);
    host.receive("a", intentPacket(room, 2, { type: "ready" }, 1));
    host.receive("b", intentPacket(room, 2, { type: "ready" }, 1));
    host.local({ type: "vote", target: mischief }, 1);
    host.receive("a", intentPacket(room, 3, { type: "vote", target: mischief }, 1));
    host.receive("b", intentPacket(room, 3, { type: "vote", target: mischief }, 1));
    expect(host.state!.result).toEqual({ winner: "crew", reason: "caught" });
    expect(host.rematch(99)).toBe(true);
    expect(host.state!.adventure!.round).toBe(2);
    expect(host.state!.players.every((p) => !p.out && !p.clues.length)).toBe(true);
    expect(host.lobby.players.map((p) => p.name)).toEqual(["Parent", "Mango", "Pearl"]);
    const before = host.state;
    host.receive("a", intentPacket(room, 4, { type: "move", dx: -1, dy: 0 }, 1));
    host.local({ type: "move", dx: 1, dy: 0 }, 1);
    expect(host.state).toBe(before);
    host.receive("a", intentPacket(room, 4, { type: "move", dx: -1, dy: 0 }, 2));
    expect(host.state!.players[1].x).toBe(2);
    for (const output of host.snapshots()) {
      expect(parseRoomPacket(JSON.stringify(output.packet), room, 0)).not.toBeNull();
      if (output.packet.type === "snapshot") expect(output.packet.view!.adventure!.round).toBe(2);
      expect(JSON.stringify(output.packet)).not.toContain('"role"');
    }
    expect(host.rematch()).toBe(false);
  });
});

describe("reviewed Mystery clue boundaries", () => {
  it("does not identify a hidden ribbon actor through a blocked path", () => {
    let s=fresh("mischief");
    s={...s,tick:20};
    s=at(at(at(s,"host",2,2),"p1",2,1),"p2",4,2);
    expect(validMysterySession(s)).toBe(true);
    expect(mysteryView(s,"p2").players.find(p=>p.id==="host")?.visible).toBe(false);
    const next=action(s,"host",{type:"prank",target:"p1"});
    expect(next).not.toBe(s);
    expect(mysteryView(next,"p2").clues.some(c=>c.includes("Parent tied a ribbon"))).toBe(false);
    expect(mysteryView(next,"p1").clues.some(c=>c.includes("Parent tied a ribbon"))).toBe(true);
    expect(validMysterySession(next)).toBe(true);
  });
  it("eight longest legal names cannot generate an invalid completion clue or packet view", () => {
    const names=Array.from({length:8},(_,i)=>({id:`p${i}`,name:`P${i}${"a".repeat(18)}`}));
    let s=createMysterySession(names,42,"crew","long-name-room");
    s={...s,players:s.players.map(p=>({...p,x:1,y:1}))};
    for(const choice of [0,1,2])s=action(s,"p0",{type:"task",task:"garden",choice});
    expect(s.tasks.garden).toBe(3);
    expect(validMysterySession(s)).toBe(true);
    for(const p of s.players){
      expect(validMysteryView(mysteryView(s,p.id))).toBe(true);
      expect(p.clues.every(c=>c.length<=200)).toBe(true);
    }
    expect(s.players[0].clues.at(-1)).toContain("5 others");
  });
});
