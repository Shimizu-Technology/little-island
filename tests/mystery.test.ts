import { describe, expect, it } from "vitest";
import {
  BELL,
  PUMP,
  REPAIR_ORDER,
  TASKS,
  MysterySession,
  applyMysteryIntent,
  chooseMysteryBot,
  createMysterySession,
  mysteryConnection,
  mysteryView,
  pathStep,
  pausedMystery,
  soloMysteryTick,
  tickMystery,
  validMysteryIntent,
  validMysterySession,
  validMysteryView,
} from "../src/mystery/engine";
import { MysteryHost, helloPacket, intentPacket, parseRoomPacket } from "../src/mystery/protocol";
const seats = [
  { id: "host", name: "Parent" },
  { id: "p1", name: "Mango" },
  { id: "p2", name: "Pearl" },
  { id: "p3", name: "Coco" },
];
const legacy = (s: MysterySession): MysterySession => ({
  ...s,
  adventure: undefined,
  players: s.players.map((p) => ({ ...p, prankReady: 12 })),
  sabotageReady: 20,
});
const fresh = (role: "crew" | "mischief" = "crew") => legacy(createMysterySession(seats, 42, role, "fixture-mystery"));
function at(s: MysterySession, actor: string, point: { x: number; y: number }) {
  return { ...s, players: s.players.map((p) => (p.id === actor ? { ...p, x: point.x, y: point.y } : p)) };
}
function meet(s: MysterySession) {
  let next = at(s, "host", BELL);
  next = applyMysteryIntent(next, "host", { type: "meeting" });
  for (const p of next.players.filter((p) => !p.out)) next = applyMysteryIntent(next, p.id, { type: "ready" });
  expect(next.phase).toBe("voting");
  return next;
}
function voteAll(s: MysterySession, target: string) {
  let next = s;
  for (const p of next.players.filter((p) => !p.out)) next = applyMysteryIntent(next, p.id, { type: "vote", target });
  return next;
}
describe("Picnic Island authoritative game", () => {
  it("starts deterministic unique roles and traversable positions", () => {
    const a = fresh();
    expect(a).toEqual(fresh());
    expect(a.players.filter((p) => p.role === "mischief")).toHaveLength(1);
    expect(a.players[0].role).toBe("crew");
    expect(validMysterySession(a)).toBe(true);
    expect(fresh("mischief").players[0].role).toBe("mischief");
  });
  it("moves one walkable tile, rejects walls, diagonal/forged actor fields and stale revisions", () => {
    const s = fresh();
    expect(applyMysteryIntent(s, "fake", { type: "move", dx: 1, dy: 0 })).toBe(s);
    const corner = at(s, "host", { x: 1, y: 1 });
    expect(applyMysteryIntent(corner, "host", { type: "move", dx: -1, dy: 0 })).toBe(corner);
    expect(validMysteryIntent({ type: "move", dx: 1, dy: 1 })).toBe(false);
    expect(validMysteryIntent({ type: "move", dx: 1, dy: 0, actor: "p1" })).toBe(false);
    expect(applyMysteryIntent(s, "host", { type: "move", dx: 1, dy: 0 }, 999)).toBe(s);
    expect(applyMysteryIntent(s, "host", { type: "move", dx: 1, dy: 0 }).players[0].x).toBe(5);
  });
  it("all four tasks require location/pattern and complete a real crew win", () => {
    let s = fresh();
    const garden = TASKS[0];
    expect(applyMysteryIntent(s, "host", { type: "task", task: garden.id, choice: 0 })).toBe(s);
    s = at(s, "host", garden);
    s = applyMysteryIntent(s, "host", { type: "task", task: garden.id, choice: 0 });
    expect(s.tasks.garden).toBe(1);
    s = applyMysteryIntent(s, "host", { type: "task", task: garden.id, choice: 2 });
    expect(s.tasks.garden).toBe(0);
    for (const t of TASKS) {
      s = at(s, "host", t);
      for (const choice of t.order) s = applyMysteryIntent(s, "host", { type: "task", task: t.id, choice });
    }
    expect(s.result).toEqual({ winner: "crew", reason: "tasks" });
    expect(validMysterySession(s)).toBe(true);
    expect(tickMystery(s)).toBe(s);
  });
  it("pretend tasks do not add crew progress or publicly disclose the actor role", () => {
    let s = at(fresh("mischief"), "host", TASKS[0]);
    s = applyMysteryIntent(s, "host", { type: "task", task: "garden", choice: 0 });
    expect(s.tasks.garden).toBe(0);
    expect(mysteryView(s, "p1").events.join(" ")).not.toContain("Pretend");
    expect(mysteryView(s, "host").clues.at(-1)).toContain("Pretend");
  });
  it("sabotage requires role/pump/cooldown, blocks jobs, wrong repair resets, correct repair restores", () => {
    let s = at(fresh("mischief"), "host", PUMP);
    expect(applyMysteryIntent(s, "host", { type: "sabotage" })).toBe(s);
    s = { ...s, tick: 20 };
    s = applyMysteryIntent(s, "host", { type: "sabotage" });
    expect(s.sabotage?.left).toBe(60);
    const crew = at(s, "p1", TASKS[0]);
    expect(applyMysteryIntent(crew, "p1", { type: "task", task: "garden", choice: 0 })).toBe(crew);
    s = at(s, "p1", PUMP);
    s = applyMysteryIntent(s, "p1", { type: "repair", choice: 2 });
    expect(s.sabotage?.progress).toBe(1);
    s = applyMysteryIntent(s, "p1", { type: "repair", choice: 2 });
    expect(s.sabotage?.progress).toBe(0);
    for (const choice of REPAIR_ORDER) s = applyMysteryIntent(s, "p1", { type: "repair", choice });
    expect(s.sabotage).toBeNull();
    expect(validMysterySession(s)).toBe(true);
  });
  it("nearby sabotage waits for repair without a time-based loss", () => {
    let s = at(fresh("mischief"), "host", PUMP);
    s = { ...s, tick: 20 };
    s = applyMysteryIntent(s, "host", { type: "sabotage" });
    for (let i = 0; i < 59; i++) s = tickMystery(s);
    expect(s.result).toBeNull();
    s = tickMystery(s);
    expect(s.result).toBeNull();
    expect(s.sabotage?.left).toBe(60);
    expect(validMysterySession(s)).toBe(true);
  });
  it("pranks enforce proximity/cooldown, record only nearby witnesses and eventually win", () => {
    let s = fresh("mischief");
    expect(applyMysteryIntent(s, "host", { type: "prank", target: "p1" })).toBe(s);
    s = { ...s, tick: 12 };
    s = at(s, "p3", { x: 7, y: 5 });
    s = applyMysteryIntent(s, "host", { type: "prank", target: "p1" });
    expect(s.players[1].out).toBe(true);
    expect(s.players[2].clues.at(-1)).toContain("Parent made the prank");
    expect(s.players[3].clues).toEqual([]);
    expect(applyMysteryIntent(s, "p1", { type: "meeting" })).toBe(s);
    expect(applyMysteryIntent(s, "host", { type: "prank", target: "p2" })).toBe(s);
    s = { ...s, tick: 30 };
    s = applyMysteryIntent(s, "host", { type: "prank", target: "p2" });
    expect(s.result).toEqual({ winner: "mischief", reason: "pranks" });
    expect(validMysterySession(s)).toBe(true);
  });
  it("meetings, readiness, votes catch mischief while duplicates and ties do not eject", () => {
    let s = meet(fresh());
    const bad = s.players.find((p) => p.role === "mischief")!;
    const voted = applyMysteryIntent(s, "host", { type: "vote", target: bad.id });
    expect(applyMysteryIntent(voted, "host", { type: "vote", target: "skip" })).toBe(voted);
    s = voteAll(s, bad.id);
    expect(s.result).toEqual({ winner: "crew", reason: "caught" });
    expect(validMysterySession(s)).toBe(true);
    s = meet(fresh());
    for (const [i, p] of s.players.entries())
      s = applyMysteryIntent(s, p.id, { type: "vote", target: i < 2 ? "p1" : "p2" });
    expect(s.result).toBeNull();
    expect(s.players.every((p) => !p.out)).toBe(true);
    expect(validMysterySession(s)).toBe(true);
  });
  it("nearby meeting and voting never supply automatic skip votes", () => {
    let s = applyMysteryIntent(fresh(), "host", { type: "meeting" });
    for (let i = 0; i < 60; i++) s = tickMystery(s);
    expect(s.phase).toBe("discussion");
    for (const p of s.players) s = applyMysteryIntent(s, p.id, { type: "ready" });
    expect(s.phase).toBe("voting");
    for (let i = 0; i < 60; i++) s = tickMystery(s);
    expect(s.phase).toBe("voting");
    expect(s.votes).toEqual({});
    s = voteAll(s, "skip");
    expect(s.phase).toBe("explore");
    expect(validMysterySession(s)).toBe(true);
  });
  it("disconnect freezes game clock/actions, rejoin keeps exact role/tasks, host snapshot redacts other roles", () => {
    const s = fresh();
    const paused = mysteryConnection(s, "p1", false);
    expect(pausedMystery(paused)).toBe(true);
    expect(tickMystery(paused)).toBe(paused);
    expect(applyMysteryIntent(paused, "host", { type: "meeting" })).toBe(paused);
    const resumed = mysteryConnection(paused, "p1", true);
    expect(resumed.players[1].role).toBe(s.players[1].role);
    expect(resumed.tasks).toEqual(s.tasks);
    expect(validMysterySession(resumed)).toBe(true);
    const v = mysteryView(s, "p1");
    expect(validMysteryView(v)).toBe(true);
    expect(v.players.every((p) => !("role" in p) && !("clues" in p) && !("prankReady" in p))).toBe(true);
    expect(validMysteryView({ ...v, players: v.players.map((p) => ({ ...p, role: "crew" })) })).toBe(false);
  });
  it("pathfinding reaches every authored station and bots operate real rules to a terminal result", () => {
    for (const goal of [...TASKS, BELL, PUMP]) {
      let p = { x: 4, y: 3 };
      for (let i = 0; i < 40 && (p.x !== goal.x || p.y !== goal.y); i++) {
        const step = pathStep(p, goal);
        expect(step).not.toBeNull();
        if (step) p = { x: p.x + step.x, y: p.y + step.y };
      }
      expect(p).toEqual({ x: goal.x, y: goal.y });
    }
    for (let seed = 0; seed < 25; seed++) {
      let s = legacy(createMysterySession(undefined, seed, "crew"));
      for (let i = 0; i < 300 && !s.result; i++) {
        s = soloMysteryTick(s);
        expect(validMysterySession(s)).toBe(true);
      }
      expect(s.result).not.toBeNull();
    }
  });
  it("bots use private own-role view; changing an unseen role does not change their policy", () => {
    const s = fresh();
    const v = mysteryView(s, "host");
    expect(chooseMysteryBot(v)).toEqual(chooseMysteryBot(JSON.parse(JSON.stringify(v))));
    expect(Object.keys(v)).not.toContain("roles");
  });
  it("rejects malformed/oversized saves and roundtrips exact live sessions", () => {
    const s = fresh();
    expect(validMysterySession(JSON.parse(JSON.stringify(s)))).toBe(true);
    for (const bad of [
      null,
      {},
      { ...s, players: [...s.players, s.players[0]] },
      { ...s, tasks: { garden: 4 } },
      { ...s, result: { winner: "crew", reason: "caught" } },
      { ...s, events: ["x".repeat(1000)] },
      { ...s, phase: "voting", phaseLeft: 0 },
    ])
      expect(validMysterySession(bad)).toBe(false);
  });
});

describe("peer-bound private room protocol", () => {
  const room = "11111111-1111-4111-8111-111111111111";
  let n = 0;
  const secret = () => `11111111-1111-4111-8111-${String(++n).padStart(12, "0")}`;
  function joined() {
    const host = new MysteryHost(room, "Parent", secret);
    const a = host.receive("native-peer-a", helloPacket(room, "Mango", null));
    const b = host.receive("native-peer-b", helloPacket(room, "Pearl", null));
    return { host, a, b };
  }
  it("joins only bounded protocol/room hellos, assigns server identities and starts at 3 players", () => {
    const h = new MysteryHost(room, "Parent", secret);
    expect(h.start()).toBe(false);
    expect(h.receive("a", helloPacket("other-room", "Mango", null))).toEqual([]);
    const { host } = joined();
    expect(host.start(42)).toBe(true);
    expect(host.lobby.players.map((p) => p.id)).toEqual(["host", "p1", "p2"]);
  });
  it("rejects forged actor fields, stale messages and fake clock actions", () => {
    const { host } = joined();
    host.start(42);
    const before = host.state!;
    const forged = JSON.stringify({
      v: 2,
      round: 1,
      room,
      type: "intent",
      seq: 2,
      intent: { type: "move", dx: 1, dy: 0 },
      actor: "host",
    });
    expect(host.receive("native-peer-a", forged)).toEqual([]);
    expect(host.state).toBe(before);
    expect(host.receive("unregistered", intentPacket(room, 2, { type: "meeting" }))).toEqual([]);
    host.receive("native-peer-a", intentPacket(room, 2, { type: "move", dx: -1, dy: 0 }));
    const moved = host.state!;
    expect(moved.players[1].x).toBe(before.players[1].x - 1);
    expect(moved.players[0]).toEqual(before.players[0]);
    host.receive("native-peer-a", intentPacket(room, 2, { type: "move", dx: -1, dy: 0 }));
    expect(host.state).toBe(moved);
    expect(
      host.receive(
        "native-peer-a",
        JSON.stringify({ v: 2, room, round: 1, type: "intent", seq: 3, intent: { type: "tick" } })
      )
    ).toEqual([]);
  });
  it("sends per-recipient roles without full state or any other seat secret", () => {
    const { host, a } = joined();
    host.start(7);
    const outputs = host.snapshots();
    expect(outputs).toHaveLength(2);
    for (const output of outputs) {
      expect(output.packet.type).toBe("snapshot");
      if (output.packet.type === "snapshot") {
        expect(output.packet.view?.selfId).toBe(output.peer === "native-peer-a" ? "p1" : "p2");
        expect(validMysteryView(output.packet.view)).toBe(true);
        expect(output.packet.view?.players.every((p) => !("role" in p))).toBe(true);
        expect(JSON.stringify(output.packet)).not.toContain("token");
      }
    }
    const welcome = a.find((o) => o.packet.type === "welcome")!;
    if (welcome.packet.type === "welcome") expect(JSON.stringify(outputs)).not.toContain(welcome.packet.resume);
  });
  it("disconnect pauses, wrong resume cannot take seat, valid approved new peer rebinds same role", () => {
    const { host, a } = joined();
    host.start(42);
    const role = host.state!.players[1].role;
    const welcome = a.find((o) => o.packet.type === "welcome")!;
    host.disconnected("native-peer-a");
    const old = host.state;
    host.tick();
    expect(host.state).toBe(old);
    const bad = host.receive("native-peer-c", helloPacket(room, "Mango", "99999999-9999-4999-8999-999999999999"));
    expect(bad[0].packet.type).toBe("error");
    if (welcome.packet.type === "welcome") {
      host.receive("native-peer-c", helloPacket(room, "Mango", welcome.packet.resume));
      expect(host.state!.players[1].connected).toBe(true);
      expect(host.state!.players[1].role).toBe(role);
      const stolen = host.receive("native-peer-d", helloPacket(room, "Mango", welcome.packet.resume));
      expect(stolen[0].packet.type).toBe("error");
    }
    expect(host.receive("native-peer-a", intentPacket(room, 99, { type: "meeting" }))).toEqual([]);
  });
  it("client discards wrong room, old sequence and raw secret state snapshots", () => {
    const { host } = joined();
    host.start(42);
    const out = host.snapshots()[0].packet;
    expect(parseRoomPacket(JSON.stringify(out), room, 0)).not.toBeNull();
    expect(parseRoomPacket(JSON.stringify(out), room, out.seq)).toBeNull();
    expect(parseRoomPacket(JSON.stringify(out), "wrong-room", 0)).toBeNull();
    expect(parseRoomPacket(JSON.stringify({ ...out, view: host.state }), room, 0)).toBeNull();
    expect(parseRoomPacket("x".repeat(17000), room, 0)).toBeNull();
  });
});
