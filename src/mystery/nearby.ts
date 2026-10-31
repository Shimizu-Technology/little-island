import { nearby, NearbyEvent } from "../../modules/island-nearby";
import { MysteryIntent, MysteryView } from "./engine";
import { LobbyView, MysteryHost, Outgoing, helloPacket, intentPacket, parseRoomPacket } from "./protocol";
export type NearbyState = {
  mode: "idle" | "host" | "client";
  message: string;
  error: boolean;
  pin: string | null;
  rooms: { peer: string; room: string; name: string }[];
  invitations: { peer: string; name: string }[];
  lobby: LobbyView | null;
  view: MysteryView | null;
  playerId: string | null;
  canRejoin: boolean;
};
const initial: NearbyState = {
  mode: "idle",
  message: "A parent creates the room. Join using the private PIN.",
  error: false,
  pin: null,
  rooms: [],
  invitations: [],
  lobby: null,
  view: null,
  playerId: null,
  canRejoin: false,
};
/** Own one controller for a mounted Mystery screen. All native resources close on dispose. */
export class NearbyMystery {
  private host: MysteryHost | null = null;
  private subscription: { remove(): void } | null = null;
  private state: NearbyState = { ...initial };
  private name = "Player";
  private room = "";
  private hostPeer: string | null = null;
  private savedSeat: { room: string; token: string } | null = null;
  private sequence = 1;
  private received = 0;
  private closed = false;
  private generation = 0;
  private operations: Promise<void> = Promise.resolve();
  private changing = false;
  private joining = false;
  private joined = false;
  private timer: ReturnType<typeof setInterval> | null = null;
  constructor(private changed: (state: NearbyState) => void) {}
  private update(patch: Partial<NearbyState>) {
    this.state = { ...this.state, ...patch };
    if (!this.closed) this.changed(this.state);
  }
  private fail(error: unknown) {
    this.update({
      error: true,
      message:
        error instanceof Error
          ? error.message
          : "Nearby connection failed. Check Local Network permission and Wi-Fi/Bluetooth.",
    });
  }
  private current(generation: number) {
    return !this.closed && generation === this.generation;
  }
  private clearClock() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
  /** Reserve a generation before any await. Native open/close operations never overlap. */
  private operate(work: (generation: number) => Promise<void>, allowClosed = false) {
    const generation = ++this.generation;
    this.changing = true;
    this.clearClock();
    const operation = this.operations
      .catch(() => {})
      .then(async () => {
        if (generation !== this.generation || (this.closed && !allowClosed)) return;
        try {
          await work(generation);
        } catch (error) {
          if (this.current(generation)) this.fail(error);
        } finally {
          if (generation === this.generation) this.changing = false;
        }
      });
    this.operations = operation;
    return operation;
  }
  private async reset() {
    this.clearClock();
    this.host = null;
    this.hostPeer = null;
    this.joining = false;
    this.joined = false;
    this.subscription?.remove();
    this.subscription = null;
    this.room = "";
    try {
      await nearby?.close();
    } catch {
      /* Closing an unavailable transport is safe. */
    }
    this.state = { ...initial };
  }
  private listen(generation: number) {
    if (!nearby) throw new Error("Nearby transport is unavailable in this build.");
    this.subscription?.remove();
    this.subscription = nearby.addListener("onNearby", (event) => {
      if (this.current(generation)) void this.event(event, generation);
    });
  }
  private async send(outgoing: Outgoing[], generation = this.generation) {
    for (const { peer, packet } of outgoing) {
      if (!this.current(generation)) return;
      try {
        await nearby?.send(peer, JSON.stringify(packet));
      } catch {
        if (!this.current(generation)) return;
        this.host?.disconnected(peer);
        this.sync();
      }
    }
  }
  private sync() {
    if (this.host) this.update({ lobby: this.host.lobby, view: this.host.view(), playerId: "host" });
  }
  create(name: string) {
    return this.operate(async (generation) => {
      this.savedSeat = null;
      await this.reset();
      if (!this.current(generation)) return;
      this.name = name;
      this.listen(generation);
      const identities = await Promise.all(Array.from({ length: 8 }, () => nearby!.identity()));
      if (!this.current(generation)) return;
      const identity = identities[0],
        secrets = identities.map((i) => i.secret);
      this.room = identity.room;
      this.host = new MysteryHost(this.room, name, () => secrets.shift()!);
      await nearby!.host(name, this.room, identity.pin);
      if (!this.current(generation)) {
        await this.reset();
        return;
      }
      this.update({
        mode: "host",
        pin: identity.pin,
        error: false,
        message: "Share this PIN privately. Approve only family devices you recognize.",
        rooms: [],
        invitations: [],
        canRejoin: false,
      });
      this.sync();
      this.clearClock();
      this.timer = setInterval(() => {
        if (!this.current(generation)) return;
        this.host?.tick();
        this.sync();
        if (this.host) void this.send(this.host.snapshots(), generation);
      }, 1000);
    });
  }
  browse(name: string, rejoin = false) {
    return this.operate(async (generation) => {
      if (!rejoin) this.savedSeat = null;
      await this.reset();
      if (!this.current(generation)) return;
      this.name = name;
      this.listen(generation);
      await nearby!.browse(name);
      if (!this.current(generation)) {
        await this.reset();
        return;
      }
      this.update({
        mode: "client",
        message: "Choose the parent’s room, enter its PIN, then wait for approval.",
        error: false,
        rooms: [],
        view: null,
        lobby: null,
        canRejoin: !!this.savedSeat,
      });
    });
  }
  join(peer: string, room: string, pin: string) {
    if (this.closed || this.joining || this.state.mode !== "client") return Promise.resolve();
    this.joining = true;
    return this.operate(async (generation) => {
      if (this.savedSeat?.room !== room) this.savedSeat = null;
      this.room = room;
      this.hostPeer = peer;
      this.joined = false;
      this.sequence = 1;
      this.received = 0;
      this.listen(generation);
      try {
        await nearby!.join(peer, room, pin);
      } catch (error) {
        if (this.current(generation)) this.joining = false;
        throw error;
      }
      // A superseding operation owns the next reset; never close its newer session.
    });
  }
  async approve(peer: string, yes: boolean) {
    try {
      await nearby!.approve(peer, yes);
      this.update({ invitations: this.state.invitations.filter((p) => p.peer !== peer) });
    } catch (e) {
      this.fail(e);
    }
  }
  async start() {
    if (this.changing || this.closed) return;
    if (!this.host?.start()) {
      this.update({ error: true, message: "Need 3–8 connected family players to start." });
      return;
    }
    this.sync();
    await this.send(this.host.snapshots());
  }
  async rematch(round = this.state.view?.adventure?.round ?? 0) {
    if (this.changing || this.closed) return;
    if (!this.host?.rematch(undefined, round)) {
      this.update({
        error: true,
        message: "Need at least three connected family players and a completed round to rematch.",
      });
      return;
    }
    this.sync();
    await this.send(this.host.snapshots());
  }
  async intent(intent: MysteryIntent, round = this.state.view?.adventure?.round ?? 0) {
    if (this.changing || this.closed) return;
    if (this.host) {
      this.host.local(intent, round);
      this.sync();
      await this.send(this.host.snapshots());
    } else if (this.hostPeer) {
      try {
        await nearby!.send(this.hostPeer, intentPacket(this.room, ++this.sequence, intent, round));
      } catch (e) {
        this.fail(e);
      }
    }
  }
  private async event(e: NearbyEvent, generation: number) {
    if (!this.current(generation)) return;
    if (e.type === "status") {
      if (e.status === "background") {
        await this.pause();
      } else if (e.status === "join-failed") {
        // A transport timeout does not prove the parent received the invitation,
        // nor that this attempt ever owned a seat. Late failure cannot undo welcome.
        if (this.state.mode === "client" && !this.joined) this.joinFailed();
      } else {
        if (["error", "join-failed"].includes(e.status)) this.joining = false;
        this.update({ message: e.message, error: ["error", "join-failed"].includes(e.status) });
      }
    } else if (e.type === "found")
      this.update({
        rooms: [
          ...this.state.rooms.filter((r) => r.peer !== e.peer),
          { peer: e.peer, room: e.room, name: e.name },
        ].slice(-12),
      });
    else if (e.type === "lost") this.update({ rooms: this.state.rooms.filter((r) => r.peer !== e.peer) });
    else if (e.type === "invitation" && this.host)
      this.update({
        invitations: [...this.state.invitations.filter((p) => p.peer !== e.peer), { peer: e.peer, name: e.name }].slice(
          0,
          7
        ),
      });
    else if (e.type === "connected" && !this.host && e.peer === this.hostPeer) {
      try {
        await nearby!.send(
          e.peer,
          helloPacket(this.room, this.name, this.savedSeat?.room === this.room ? this.savedSeat.token : null)
        );
      } catch (error) {
        if (this.current(generation)) this.fail(error);
      }
    } else if (e.type === "disconnected") {
      if (this.host) {
        this.host.disconnected(e.peer);
        this.sync();
        await this.send(this.host.snapshots());
      } else if (e.peer === this.hostPeer) {
        if (!this.joined) {
          this.joinFailed();
          return;
        }
        this.hostPeer = null;
        this.joining = false;
        this.update({
          view: null,
          lobby: null,
          mode: "idle",
          canRejoin: !!this.savedSeat,
          error: true,
          message:
            "The host disconnected. If the room is still open, search again to rejoin your seat. If the host left, create a new round.",
        });
      }
    } else if (e.type === "data") {
      if (this.host) {
        const output = this.host.receive(e.peer, e.payload);
        this.sync();
        await this.send(output);
      } else if (e.peer === this.hostPeer) {
        const p = parseRoomPacket(e.payload, this.room, this.received);
        if (!p) return;
        this.received = p.seq;
        if (p.type === "welcome") {
          this.joining = false;
          this.joined = true;
          this.savedSeat = { room: this.room, token: p.resume };
          this.update({
            playerId: p.playerId,
            canRejoin: true,
            message: "Approved. Waiting for the parent to start.",
            error: false,
          });
        } else if (p.type === "snapshot" && (!p.view || p.view.selfId === this.state.playerId))
          this.update({ lobby: p.lobby, view: p.view, error: false });
        else if (p.type === "error") {
          this.joining = false;
          this.update({ error: true, message: p.message });
        }
      }
    }
  }
  private joinFailed() {
    this.hostPeer = null;
    this.joining = false;
    this.update({
      mode: "client",
      view: null,
      lobby: null,
      playerId: null,
      canRejoin: !!this.savedSeat,
      error: true,
      message: this.savedSeat
        ? "Could not rejoin this room yet. Check the PIN with the parent, ask them to approve this device, and try again."
        : "Could not join this room yet. Check the PIN with the parent, ask them to approve this device, and try again.",
    });
  }
  /** Route leave/background: host closes room; a client keeps only its in-memory seat credential. */
  pause() {
    const wasHost = !!this.host;
    return this.operate(async (generation) => {
      if (wasHost) this.savedSeat = null;
      await this.reset();
      if (!this.current(generation)) return;
      this.update({
        canRejoin: !!this.savedSeat,
        message: wasHost
          ? "The parent left, so the room closed. Create a new room to play again."
          : "Nearby play paused. Search again to rejoin with parent approval.",
      });
    });
  }
  leave(notify = true) {
    return this.operate(async (generation) => {
      this.savedSeat = null;
      await this.reset();
      if (notify && this.current(generation)) this.update({});
    }, true);
  }
  dispose() {
    this.closed = true;
    void this.leave(false);
  }
}
