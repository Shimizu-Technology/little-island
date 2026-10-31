import { BadgeResultCard } from '../badges/ResultCard';
import type { RoundPractice } from "../practice/useRoundPractice";
import React, { useEffect, useRef, useState } from "react";
import { AppState, Platform, StyleSheet, TextInput, View } from "react-native";
import { AdventurePlay } from "./AdventurePlay";
import { mysteryInstructions } from "./instructions";
import { Button, C, Copy, Heading, Label, Sheet, Status, font, GameHeader } from "../components/ui";
import { nearby, nearbyUnavailable } from "../../modules/island-nearby";
import { MysteryIntent, MysterySession, Role, playSoloIntent, createMysterySession, mysteryView, TASKS, PUMP, BELL } from "./engine";
import { NearbyMystery, NearbyState } from "./nearby";

const initialNearby: NearbyState = {
  mode: "idle",
  message: "A parent creates the private family room.",
  error: false,
  pin: null,
  rooms: [],
  invitations: [],
  lobby: null,
  view: null,
  playerId: null,
  canRejoin: false,
};
export type MysteryScreenProps = {
  roundPractice?: RoundPractice;
  beforeNewRound?: (run: () => void) => void;
  onActionFocus?: () => void;
  state: MysterySession | null;
  onSave: (next: MysterySession, previous: MysterySession | null) => void;
  width: number;
  /** False for route blur or any parent-owned overlay; nearby rooms close safely. */
  active: boolean;
  sound: boolean;
  onFeedback?: () => void;
  onSpeakInstruction?: (key: keyof typeof mysteryInstructions) => void;
  onStopInstruction?: () => void;
  /** Shown only on the start menu; a round has its own Leave header. */
  menuHeader?: React.ReactNode;
  soundControl?: { on: boolean; toggle: () => void };
};
export function MysteryScreen({ onActionFocus, state, onSave, width, active, sound, onFeedback, onSpeakInstruction, onStopInstruction, menuHeader, soundControl, beforeNewRound, roundPractice }: MysteryScreenProps) {
  const newRound = (run: () => void) => {
    setShowRole(false);
    stopSpeech.current?.();
    if (beforeNewRound) beforeNewRound(run); else run();
  };
  const stopSpeech = useRef(onStopInstruction);
  React.useLayoutEffect(() => { stopSpeech.current = onStopInstruction; }, [onStopInstruction]);
  useEffect(() => () => stopSpeech.current?.(), []);
  const [mode, setMode] = useState<"menu" | "solo" | "nearby">("menu");
  const [remote, setRemote] = useState<NearbyState>(initialNearby);
  const [foreground, setForeground] = useState(AppState.currentState === "active" || AppState.currentState === null);
  const [help, setHelp] = useState(false),
    [setup, setSetup] = useState(false),
    [parent, setParent] = useState(false),
    [exit, setExit] = useState(false);
  const [roomDetails, setRoomDetails] = useState(false);
  const [balance, setBalance] = useState<"gentle" | "challenge">("gentle");
  const [role, setRole] = useState<Role>("crew"),
    [showRole, setShowRole] = useState(false);
  const [name, setName] = useState("Player"),
    [pin, setPin] = useState(""),
    [answer, setAnswer] = useState("");
  const saveCallback = useRef(onSave);
  React.useLayoutEffect(() => {
    saveCallback.current = onSave;
  }, [onSave]);
  const latest = useRef(state),
    controller = useRef<NearbyMystery | null>(null);
  React.useLayoutEffect(() => {
    latest.current = state;
  }, [state]);
  useEffect(() => {
    const connection = new NearbyMystery(setRemote);
    controller.current = connection;
    return () => {
      connection.dispose();
      controller.current = null;
    };
  }, []);
  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      setForeground(next === "active");
      if (next !== "active") setShowRole(false);
    });
    const visibility = () => {
      setForeground(!document.hidden);
      setShowRole(false);
    };
    if (Platform.OS === "web" && typeof document !== "undefined")
      document.addEventListener("visibilitychange", visibility);
    return () => {
      sub.remove();
      if (Platform.OS === "web" && typeof document !== "undefined")
        document.removeEventListener("visibilitychange", visibility);
    };
  }, []);
  useEffect(() => {
    if (!active) {
      // External route/overlay changes must clear private role visibility.
      setShowRole(false);
      void controller.current?.pause();
    }
  }, [active]);
  const playing = active && foreground && !help && !setup && !parent && !exit && !roundPractice?.pending;
  const view =
    mode === "solo" && state ? mysteryView(state, state.players[0].id) : mode === "nearby" ? remote.view : null;
  const self = view?.players.find((p) => p.id === view.selfId);
  const station = self && [...TASKS, { ...PUMP, id: "pump" }, { ...BELL, id: "bell" }].find((p) => p.x === self.x && p.y === self.y)?.id;
  const actionFocusKey = view ? `${view.id}:${view.phase}:${station ?? "walking"}:${station === "pump" && !!view.sabotage}` : "";
  const focusAction = useRef(onActionFocus);
  React.useLayoutEffect(() => { focusAction.current = onActionFocus; }, [onActionFocus]);
  const focusNeeded = !!station || (!!view && view.phase !== "explore");
  useEffect(() => {
    if (focusNeeded) focusAction.current?.();
  }, [actionFocusKey, focusNeeded]);
  const intent = (action: MysteryIntent) => {
    if (!playing) return;
    if (sound) onFeedback?.();
    if (mode === "nearby") void controller.current?.intent(action, remote.view?.adventure?.round ?? 0);
    else {
      const previous = latest.current;
      if (previous) {
        const next = playSoloIntent(previous, action);
        if (next !== previous) {
          latest.current = next;
          saveCallback.current(next, previous);
        }
      }
    }
  };
  const closeOverlays = () => {
    setShowRole(false);
    setHelp(false);
    setSetup(false);
    setParent(false);
    setExit(false);
    setRoomDetails(false);
  };
  return (
    <View style={{ width: "100%", maxWidth: 850, alignSelf: "center", gap: 16 }}>
      {mode === "menu" && menuHeader}
      {mode !== "menu" && (
        <GameHeader title="Picnic" backLabel="Leave" onBack={() => { setShowRole(false); setExit(true); }}
          sound={soundControl}
          onHelp={() => { setShowRole(false); setHelp(true); }}>
          {mode === "nearby" && remote.mode === "host" && remote.pin && (
            <Button compact quiet onPress={() => { setShowRole(false); setRoomDetails(true); }}>Room details</Button>
          )}

        </GameHeader>
      )}
      {mode === "solo" && !view?.result && <Button compact quiet onPress={() => { setShowRole(false); setSetup(true); }}>Role and options</Button>}
      {mode === "solo" && view?.result && state && <BadgeResultCard round={state.id}/>}
      {mode === "solo" && view?.result && <View style={s.row}>
        <Button onPress={() => newRound(() => { const previous = latest.current!; const next = createMysterySession(undefined, undefined, previous.players[0].role, undefined, 1, previous.adventure?.balance); latest.current = next; saveCallback.current(next, previous); closeOverlays(); })}>Play again</Button>
        <Button quiet onPress={() => setSetup(true)}>Role and options</Button>
      </View>}
      {mode === "menu" && (
        <>
          <Status
            title="The Picnic Island mystery"
            detail="Explore, finish little jobs, share clues, and uncover one playful mischief maker."
          />
          <View style={s.activity}>
            <Heading style={{ fontSize: 24 }}>Solo practice</Heading>
            <Copy>
              Play crew or mischief with three computer islanders. Practice rounds save on this device. Time only moves
              after your actions.
            </Copy>
            {state && (
              <Button
                onPress={() => {
                  closeOverlays();
                  setMode("solo");
                }}
              >
                Continue saved practice
              </Button>
            )}
            <Button
              quiet
              onPress={() => {
                setRole("crew");
                setSetup(true);
              }}
            >
              Start fresh practice
            </Button>
          </View>
          <View style={s.activity}>
            <Heading style={{ fontSize: 24 }}>Nearby family</Heading>
            <Copy>
              Three to eight people, each with an iPhone or iPad. A parent opens and approves a private room. No
              internet account or public chat. Update every device to the same app version before joining.
            </Copy>
            {nearby ? (
              <Button
                onPress={() => {
                  setMode("nearby");
                  setShowRole(false);
                }}
              >
                Nearby family rooms
              </Button>
            ) : (
              <Copy>{nearbyUnavailable}</Copy>
            )}
          </View>
        </>
      )}
      {mode === "nearby" && !view && (
        <>
          <Status
            title={remote.error ? "Connection needs attention" : "Private nearby family"}
            detail={remote.message}
          />
          {remote.mode === "idle" && (
            <>
              <TextInput
                accessibilityLabel="Your family player name"
                value={name}
                onChangeText={(text) => setName(text.replace(/[\p{C}<>]/gu, "").slice(0, 20))}
                maxLength={20}
                style={s.input}
                autoComplete="off"
              />
              <View style={s.row}>
                <Button
                  disabled={!name.trim()}
                  onPress={() => {
                    setAnswer("");
                    setParent(true);
                  }}
                >
                  Parent: create a room
                </Button>
                <Button
                  quiet
                  disabled={!name.trim()}
                  onPress={() => void controller.current?.browse(name.trim(), remote.canRejoin)}
                >
                  {remote.canRejoin ? "Search to rejoin my seat" : "Join a family room"}
                </Button>
              </View>
            </>
          )}
          {remote.pin && (
            <View style={s.activity}>
              <Label>Tell family privately</Label>
              <Heading>{remote.pin}</Heading>
              <Copy>The PIN is not advertised. Approve only devices you recognize.</Copy>
            </View>
          )}
          {remote.mode === "client" && !remote.lobby && (
            <>
              <TextInput
                accessibilityLabel="Private six digit room PIN"
                keyboardType="number-pad"
                secureTextEntry
                value={pin}
                onChangeText={(text) => setPin(text.replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
                style={s.input}
                autoComplete="off"
              />
              <Copy>
                Ask the parent for the PIN. If no room appears, allow Local Network access in Settings and turn on
                Wi-Fi/Bluetooth.
              </Copy>
              {remote.rooms.map((room) => (
                <Button
                  quiet
                  key={room.peer}
                  disabled={pin.length !== 6}
                  onPress={() => void controller.current?.join(room.peer, room.room, pin)}
                >
                  Join {room.name}’s room
                </Button>
              ))}
            </>
          )}
          {remote.lobby && (
            <View style={s.activity}>
              <Heading style={{ fontSize: 23 }}>Family lobby · {remote.lobby.players.length}/8</Heading>
              {remote.lobby.players.map((p) => (
                <Copy key={p.id}>
                  {p.name} · {p.connected ? "ready" : "disconnected"}
                </Copy>
              ))}
              {remote.mode === "host" ? (
                <Button
                  disabled={remote.lobby.players.length < 3 || remote.lobby.players.some((p) => !p.connected)}
                  onPress={() => { const host = controller.current; newRound(() => void host?.start()); }}
                >
                  Start the mystery
                </Button>
              ) : (
                <Copy>Waiting for the parent to start.</Copy>
              )}
            </View>
          )}
        </>
      )}
      {mode === "nearby" &&
        remote.mode === "host" &&
        remote.invitations.map((invite) => (
          <View style={s.activity} key={invite.peer}>
            <Heading style={{ fontSize: 21 }}>Allow {invite.name}?</Heading>
            <Copy>Confirm this is your family member’s device.</Copy>
            <View style={s.row}>
              <Button onPress={() => void controller.current?.approve(invite.peer, true)}>Approve</Button>
              <Button quiet onPress={() => void controller.current?.approve(invite.peer, false)}>
                Decline
              </Button>
            </View>
          </View>
        ))}
      {view && (
        <AdventurePlay
          key={`${view.id}:${view.adventure?.round ?? 0}`}
          view={view}
          width={width}
          enabled={playing}
          showRole={showRole && playing}
          setShowRole={setShowRole}
          intent={intent}
          onSpeakInstruction={sound ? onSpeakInstruction : undefined}
          onStopInstruction={onStopInstruction}
        />
      )}
      {mode === "nearby" && remote.mode === "host" && remote.view?.result && (
        <View style={s.activity}>
          <Heading style={{ fontSize: 21 }}>Same family, another mystery?</Heading>
          <Copy>
            Keep this approved room and deal fresh secret roles. Disconnected helpers can sit this one out. Everyone
            updates to the same app version.
          </Copy>
          <Button
            disabled={!playing || (remote.lobby?.players.filter((p) => p.connected).length ?? 0) < 3}
            onPress={() => {
              setShowRole(false);
              if (playing) { const host = controller.current, round = remote.view?.adventure?.round ?? 0; newRound(() => void host?.rematch(round)); }
            }}
          >
            Play again in this room
          </Button>
        </View>
      )}

      <Sheet visible={roomDetails && active && foreground} title="Private room details" onClose={() => setRoomDetails(false)}>
        <Copy>Share this PIN only with your family. A returning guest needs your approval.</Copy>
        <Heading>{remote.pin}</Heading>
      </Sheet>
      <Sheet visible={help} title="Picnic Island rules" onClose={() => { setHelp(false); onStopInstruction?.(); }}>
        {Object.entries(mysteryInstructions).map(([key, text]) => (
          <View key={key} style={{ gap: 8 }}>
            <Copy>{text}</Copy>
            <Button quiet compact disabled={!sound || !onSpeakInstruction} onPress={() => onSpeakInstruction?.(key as keyof typeof mysteryInstructions)}>Listen: {key.slice(8).replace(/-v25$/, "")}</Button>
          </View>
        ))}
        <Copy>
          Nearby active players pause the round when away. Voted helpers can disconnect without stopping it. Parent can
          rematch here after a result. Practice uses beats, so reading never loses the round.
        </Copy>
      </Sheet>
      <Sheet visible={setup} title={roundPractice?.pending ? "A little practice, then play" : "Fresh solo mystery"} onClose={() => roundPractice?.pending ? roundPractice.cancel() : setSetup(false)}>
        {roundPractice?.pending ? roundPractice.content : <>
        <Copy>
          {state
            ? "This replaces your saved practice. Cancel to keep it."
            : "Choose a role to learn how the island mystery works."}
        </Copy>
        <View style={s.row}>
          <Button quiet selected={role === "crew"} onPress={() => setRole("crew")}>
            Crew practice
          </Button>
          <Button quiet selected={role === "mischief"} onPress={() => setRole("mischief")}>
            Mischief practice
          </Button>
        </View>
        <View style={s.row}>
          <Button quiet selected={balance === "gentle"} onPress={() => setBalance("gentle")}>Gentle crew</Button>
          <Button quiet selected={balance === "challenge"} onPress={() => setBalance("challenge")}>Challenge</Button>
        </View>
        <Copy>Gentle crew gives jobs more time between ribbon tricks and keeps the water pump safe. Challenge keeps the original pace.</Copy>
        <Button
          onPress={() => newRound(() => {
            const previous = latest.current;
            const next = createMysterySession(undefined, undefined, role, undefined, 1, balance);
            latest.current = next;
            saveCallback.current(next, previous);
            closeOverlays();
            setMode("solo");
          })}
        >
          Start practice
        </Button>
        </>}
      </Sheet>
      {!setup && roundPractice?.panel}
      <Sheet visible={parent} title="Parent room setup" onClose={() => setParent(false)}>
        <Copy>A grown-up creates the room and approves each joining device. What is 8 + 13?</Copy>
        <TextInput
          accessibilityLabel="Grown-up answer"
          value={answer}
          onChangeText={setAnswer}
          keyboardType="number-pad"
          style={s.input}
        />
        <Button
          disabled={answer.trim() !== "21"}
          onPress={() => {
            setParent(false);
            void controller.current?.create(name.trim());
          }}
        >
          Create private family room
        </Button>
        <Copy>
          Keep this app open. Nearby play needs Local Network permission; allow the system prompt, then wait for family
          devices to join.
        </Copy>
      </Sheet>
      <Sheet visible={exit} title="Leave this mystery?" onClose={() => setExit(false)}>
        <Copy>
          {mode === "nearby"
            ? remote.mode === "host"
              ? "Leaving closes this family room for everyone. Start a new room to play again."
              : remote.view?.players.find((p) => p.id === remote.playerId)?.out
                ? "You can leave your helper seat. The family adventure continues, and you can rejoin while this room stays open."
                : "Leaving disconnects your seat and pauses the family round until you rejoin. Ask the parent before leaving."
            : "Your practice is saved. You can continue later."}
        </Copy>
        <Button
          onPress={() => {
            if (mode === "nearby") void controller.current?.pause();
            closeOverlays();
            setMode("menu");
          }}
        >
          Leave and return
        </Button>
      </Sheet>
    </View>
  );
}
const s = StyleSheet.create({
  activity: { backgroundColor: "#F0F1E8", padding: 17, borderRadius: 20, gap: 12 },
  role: { backgroundColor: "#E5EFE5", padding: 16, borderRadius: 20, gap: 10 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "center", alignItems: "center" },
  input: {
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 14,
    padding: 15,
    fontFamily: font,
    fontSize: 18,
    color: C.ink,
    backgroundColor: C.paper,
    minHeight: 52,
  },
});
