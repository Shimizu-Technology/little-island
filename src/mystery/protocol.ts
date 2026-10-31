import {
  MysteryIntent,
  MysterySession,
  MysteryView,
  applyMysteryIntent,
  createMysterySession,
  mysteryConnection,
  mysteryView,
  tickMystery,
  validMysteryIntent,
  validMysteryView,
} from "./engine";
export const PROTOCOL = 2,
  MAX_MESSAGE = 16384;
export type LobbyView = {
  room: string;
  hostId: string;
  players: { id: string; name: string; connected: boolean }[];
  started: boolean;
};
export type RoomPacket =
  | { v: 2; room: string; type: "snapshot"; seq: number; lobby: LobbyView; view: MysteryView | null }
  | { v: 2; room: string; type: "welcome"; seq: number; playerId: string; resume: string }
  | { v: 2; room: string; type: "error"; seq: number; message: string };
type Seat = {
  id: string;
  name: string;
  peer: string | null;
  token: string;
  connected: boolean;
  lastSeq: number;
  messages: number[];
};
export type Outgoing = { peer: string; packet: RoomPacket };
const obj = (x: unknown): x is Record<string, unknown> => !!x && typeof x === "object" && !Array.isArray(x);
const safeName = (v: unknown): v is string =>
  typeof v === "string" && v.trim().length > 0 && v.length <= 20 && !/[\p{C}<>]/u.test(v);
const seq = (n: unknown): n is number => Number.isSafeInteger(n) && (n as number) > 0 && (n as number) < 10000000;
const token = (v: unknown): v is string => typeof v === "string" && /^[A-Za-z0-9-]{32,100}$/.test(v);
function parse(payload: string): Record<string, unknown> | null {
  if (payload.length > MAX_MESSAGE) return null;
  try {
    const p: unknown = JSON.parse(payload);
    return obj(p) ? p : null;
  } catch {
    return null;
  }
}
/** Authoritative parent room. Peer handles come from the native session, never from message fields. */
export class MysteryHost {
  readonly room: string;
  private seats: Seat[];
  private counter = 0;
  private game: MysterySession | null = null;
  constructor(
    room: string,
    name: string,
    private makeSecret: () => string
  ) {
    if (!safeName(name) || !token(room)) throw new Error("Invalid family room.");
    this.room = room;
    this.seats = [{ id: "host", name, peer: null, token: makeSecret(), connected: true, lastSeq: 0, messages: [] }];
  }
  get state() {
    return this.game;
  }
  get lobby(): LobbyView {
    return {
      room: this.room,
      hostId: "host",
      players: this.seats.map(({ id, name, connected }) => ({ id, name, connected })),
      started: !!this.game,
    };
  }
  view(): MysteryView | null {
    return this.game ? mysteryView(this.game, "host") : null;
  }
  start(seed = Date.now() >>> 0) {
    if (this.game || this.seats.length < 3 || this.seats.some((s) => !s.connected)) return false;
    this.game = createMysterySession(this.seats, seed, undefined, this.room);
    return true;
  }
  rematch(seed = Date.now() >>> 0, expectedRound = this.game?.adventure?.round ?? 0) {
    if (!this.game?.result || expectedRound !== (this.game.adventure?.round ?? 0) || expectedRound >= 1000)
      return false;
    const connected = this.seats.filter((seat) => seat.connected);
    if (connected.length < 3) return false;
    const round = (this.game.adventure?.round ?? 1) + 1;
    this.seats = connected;
    this.game = createMysterySession(this.seats, seed, undefined, this.room, round);
    return true;
  }
  local(intent: MysteryIntent, round = this.game?.adventure?.round ?? 0) {
    if (this.game && round === (this.game.adventure?.round ?? 0))
      this.game = applyMysteryIntent(this.game, "host", intent);
  }
  tick() {
    if (this.game) this.game = tickMystery(this.game);
  }
  disconnected(peer: string) {
    const seat = this.seats.find((s) => s.peer === peer);
    if (seat) {
      seat.connected = false;
      seat.peer = null;
      seat.lastSeq = 0;
      if (this.game) this.game = mysteryConnection(this.game, seat.id, false);
    }
  }
  private error(peer: string, message: string): Outgoing[] {
    return [{ peer, packet: { v: 2, room: this.room, seq: ++this.counter, type: "error", message } }];
  }
  receive(peer: string, payload: string, now = Date.now()): Outgoing[] {
    const p = parse(payload);
    if (!p || p.v !== PROTOCOL || p.room !== this.room || !seq(p.seq)) return [];
    let seat = this.seats.find((s) => s.peer === peer);
    if (p.type === "hello") {
      if (
        Object.keys(p).sort().join(",") !== "name,resume,room,seq,type,v" ||
        p.seq !== 1 ||
        seat ||
        !safeName(p.name) ||
        (p.resume !== null && !token(p.resume))
      )
        return this.error(peer, "Invalid join request.");
      if (p.resume !== null) {
        seat = this.seats.find((s) => s.token === p.resume && s.id !== "host");
        if (!seat || seat.connected)
          return this.error(peer, "That saved seat cannot rejoin. Ask the parent to start a new room.");
        seat.connected = true;
        seat.peer = peer;
        seat.lastSeq = 1;
        seat.messages = [];
        if (this.game) this.game = mysteryConnection(this.game, seat.id, true);
      } else {
        if (this.game || this.seats.length >= 8)
          return this.error(peer, "This round has started or is full. Ask the parent for a new room.");
        const requested = p.name.trim();
        let name = requested,
          suffix = 2;
        while (this.seats.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
          name = `${requested.slice(0, 16)} (${suffix++})`;
        }
        seat = {
          id: `p${this.seats.length}`,
          name,
          peer,
          connected: true,
          token: this.makeSecret(),
          lastSeq: 1,
          messages: [],
        };
        this.seats.push(seat);
      }
      return [
        {
          peer,
          packet: {
            v: 2,
            room: this.room,
            type: "welcome",
            seq: ++this.counter,
            playerId: seat.id,
            resume: seat.token,
          },
        },
        ...this.snapshots(),
      ];
    }
    if (
      !seat ||
      !seat.connected ||
      p.seq <= seat.lastSeq ||
      Object.keys(p).sort().join(",") !== "intent,room,round,seq,type,v" ||
      p.type !== "intent" ||
      p.round !== (this.game?.adventure?.round ?? 0) ||
      !validMysteryIntent(p.intent)
    )
      return [];
    seat.messages = seat.messages.filter((t) => now - t < 1000);
    if (seat.messages.length >= 8) return [];
    seat.messages.push(now);
    seat.lastSeq = p.seq;
    if (this.game) this.game = applyMysteryIntent(this.game, seat.id, p.intent);
    return this.snapshots();
  }
  snapshots(): Outgoing[] {
    const sequence = ++this.counter;
    return this.seats
      .filter((s) => s.connected && s.peer !== null)
      .map((s) => ({
        peer: s.peer!,
        packet: {
          v: 2,
          room: this.room,
          type: "snapshot",
          seq: sequence,
          lobby: this.lobby,
          view: this.game ? mysteryView(this.game, s.id) : null,
        },
      }));
  }
}
export function helloPacket(room: string, name: string, resume: string | null) {
  return JSON.stringify({ v: 2, room, type: "hello", seq: 1, name, resume });
}
export function intentPacket(room: string, sequence: number, intent: MysteryIntent, round = 1) {
  return JSON.stringify({ v: 2, room, type: "intent", seq: sequence, round, intent });
}
export function validLobby(v: unknown): v is LobbyView {
  if (
    !obj(v) ||
    Object.keys(v).sort().join(",") !== "hostId,players,room,started" ||
    !token(v.room) ||
    v.hostId !== "host" ||
    typeof v.started !== "boolean" ||
    !Array.isArray(v.players) ||
    v.players.length < 1 ||
    v.players.length > 8
  )
    return false;
  return (
    v.players.every(
      (p) =>
        obj(p) &&
        Object.keys(p).sort().join(",") === "connected,id,name" &&
        typeof p.id === "string" &&
        /^(host|p[1-7])$/.test(p.id) &&
        safeName(p.name) &&
        typeof p.connected === "boolean"
    ) &&
    v.players[0].id === "host" &&
    (!v.started || v.players.length >= 3) &&
    new Set(v.players.map((p) => p.id)).size === v.players.length
  );
}
export function parseRoomPacket(payload: string, room: string, after: number): RoomPacket | null {
  const p = parse(payload);
  if (!p || p.v !== PROTOCOL || p.room !== room || !seq(p.seq) || p.seq <= after) return null;
  if (
    p.type === "welcome" &&
    Object.keys(p).sort().join(",") === "playerId,resume,room,seq,type,v" &&
    typeof p.playerId === "string" &&
    /^p[1-7]$/.test(p.playerId) &&
    token(p.resume)
  )
    return p as RoomPacket;
  if (
    p.type === "error" &&
    Object.keys(p).sort().join(",") === "message,room,seq,type,v" &&
    typeof p.message === "string" &&
    p.message.length <= 200
  )
    return p as RoomPacket;
  if (
    p.type === "snapshot" &&
    Object.keys(p).sort().join(",") === "lobby,room,seq,type,v,view" &&
    validLobby(p.lobby) &&
    p.lobby.room === room &&
    (p.view === null || validMysteryView(p.view)) &&
    p.lobby.started === (p.view !== null) &&
    (!p.view ||
      (p.view.id === room && p.view.players.map((p) => p.id).join(",") === p.lobby.players.map((p) => p.id).join(",")))
  )
    return p as RoomPacket;
  return null;
}
