import { Companion } from "../islander/Companion";
import { mysteryInstructions } from "./instructions";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { View, useWindowDimensions } from "react-native";
import { Text } from "../components/Text";
import { Button, C, Copy, Heading, PressableScale } from "../components/ui";
import { BELL, MysteryIntent, MysteryView, Point, PUMP, TASKS, TRICK_GOAL, pathStep, playerColor } from "./engine";
import { IslandScene, LandmarkArt, PLACES, placeName } from "./IslandArt";
import { IslandJob, PumpJob } from "./IslandJobs";
import { firstJobGuide } from "./firstJobGuide";
export function AdventurePlay({
  view,
  width,
  enabled,
  showRole,
  setShowRole,
  intent,
  onSpeakInstruction,
  onStopInstruction,
}: {
  view: MysteryView;
  width: number;
  enabled: boolean;
  showRole: boolean;
  setShowRole: (show: boolean) => void;
  intent: (intent: MysteryIntent) => void;
  onSpeakInstruction?: (key: keyof typeof mysteryInstructions) => void;
  onStopInstruction?: () => void;
}) {
  const viewport = useWindowDimensions();
  const roundKey = `${view.id}:${view.adventure?.round ?? 0}`;
  const [revealedRound, setRevealedRound] = useState<string | null>(null);
  const [notebook, setNotebook] = useState(false);
  const [goal, setGoal] = useState<Point | null>(null);
  const [dismissedGuideRound, setDismissedGuideRound] = useState<string | null>(null);
  const [measured, setMeasured] = useState(Math.min(width - 40, 720));
  const current = useRef({ view, intent });
  useLayoutEffect(() => {
    current.current = { view, intent };
  }, [view, intent]);
  const self = view.players.find((p) => p.id === view.selfId)!;
  const canAct = enabled && !view.paused && !view.result;
  const exploring = canAct && view.phase === "explore" && (!self.out || !!view.adventure);
  const visibleRole = enabled && showRole && revealedRound === roundKey;
  const short = viewport.width > viewport.height && viewport.height < 520;
  const available = Math.max(260, Math.min(measured, 760));
  const mapWidth = short ? Math.max(250, available - 266) : Math.min(available, view.phase !== "explore" || TASKS.some((t) => t.x === self.x && t.y === self.y) || view.sabotage ? 340 : 520);
  const task = TASKS.find((t) => t.x === self.x && t.y === self.y);
  const atPump = self.x === PUMP.x && self.y === PUMP.y;
  const atBell = self.x === BELL.x && self.y === BELL.y;
  const completed = TASKS.filter((t) => view.tasks[t.id] === 3).length;
  const guide = enabled && !view.paused && dismissedGuideRound !== roundKey ? firstJobGuide(view) : null;
  const garden = TASKS.find((t) => t.id === "garden")!;
  const near = view.players.filter(
    (p) => !p.out && p.id !== self.id && p.visible !== false && Math.abs(p.x - self.x) + Math.abs(p.y - self.y) <= 1
  );
  useEffect(() => {
    if (!enabled || view.phase !== "explore" || view.paused || view.result) {
      // Privacy and input suspension must clear local drafts when an overlay/background interrupts play.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGoal(null);
      setNotebook(false);
    }
  }, [enabled, view.phase, view.paused, view.result]);
  useEffect(() => {
    if (!goal || !exploring) return;
    const timer = setInterval(() => {
      const { view: now, intent: send } = current.current;
      const p = now.players.find((p) => p.id === now.selfId)!;
      const step = pathStep(p, goal);
      if (!step) {
        setGoal(null);
        return;
      }
      // Position binding makes a delayed duplicate harmless instead of walking past a destination.
      send({ type: "step", fromX: p.x, fromY: p.y, dx: step.x, dy: step.y });
    }, 300);
    return () => clearInterval(timer);
  }, [goal, exploring]);
  const walk = (point: Point) => {
    if (exploring) setGoal(point);
  };
  const move = (dx: number, dy: number) => {
    setGoal(null);
    intent({ type: "step", fromX: self.x, fromY: self.y, dx, dy });
  };
  const votePanel = view.events.some((event) => event.startsWith("Vote result:")) ? (
    <View accessibilityLiveRegion="polite" style={{ padding: 12, borderRadius: 16, backgroundColor: C.sand }}>
      <Copy>{view.events.filter((event) => event.startsWith("Vote result:") || event.startsWith("Vote tally:")).join("\n")}</Copy>
    </View>
  ) : null;
  return (
    <View onLayout={(event) => setMeasured(event.nativeEvent.layout.width)} style={{ gap: 12 }}>
      {view.result && <View style={{ alignItems: "center" }}><Companion event={view.result.winner === view.ownRole ? "win" : "loss"} active={enabled}/></View>}
      <View style={{ padding: 13, backgroundColor: view.result ? "#E2EDD9" : "#EDF0E3", borderRadius: 18, gap: 4 }}>
        <Heading style={{ fontSize: 23 }}>
          {view.result
            ? view.result.winner === "crew"
              ? "The crew saved the picnic!"
              : "Mischief wins this round!"
            : view.paused
              ? "Waiting for family to rejoin"
              : view.phase === "discussion"
                ? "Share what you noticed"
                : view.phase === "voting"
                  ? "Who made the mischief?"
                  : guide
                    ? guide.stage === "explore"
                      ? "Garden ready!"
                      : "First job: Garden"
                    : "Picnic Island"}
        </Heading>
        {guide ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <LandmarkArt kind="garden" size={40} complete={guide.stage === "explore"} />
            <Copy style={{ flex: 1, fontSize: 13, lineHeight: 19 }}>
              {guide.stage === "walk"
                ? "Let’s help the plants grow. Walk to the Garden to try a job."
                : guide.stage === "water"
                  ? `Tap each thirsty bed. Any order! ${guide.growing} of 3 growing.`
                  : "All three beds are growing. A job for the crew! Explore another place or look for clues with friends."}
            </Copy>
          </View>
        ) : (
          <Copy style={{ fontSize: 13, lineHeight: 19 }}>
            {view.result
              ? {
                  tasks: "All four island jobs are ready. Everyone helped the picnic!",
                  caught: "The vote found the mischief maker.",
                  pranks: view.adventure
                    ? "Three ribbon tricks! Nobody was left out of the adventure."
                    : "The mischief maker surprised enough crew members.",
                  sabotage: "The water stayed off too long. Try again and watch the pump.",
                }[view.result.reason]
              : view.paused
                ? "An active player is away. Moves and timers wait; helper spectators can leave without pausing everyone."
                : view.solo
                  ? "Practice waits while you read. Each move, job action or Watch advances one beat."
                  : view.phase === "explore"
                    ? "Touch a place to walk there. Watch your friends, help with jobs, and gather clues."
                    : `${view.phase === "discussion" ? `${view.readyCount} ready · everyone taps Ready` : `${view.votesCast} votes cast · waiting for everyone`}`}
          </Copy>
        )}
        {guide && (
          <View style={{ flexDirection: "row", gap: 7, flexWrap: "wrap" }}>
            {guide.stage === "walk" && (
              <Button compact disabled={!exploring} label="First job: walk to the Garden" onPress={() => walk(garden)}>
                {goal?.x === garden.x && goal?.y === garden.y ? "Walking to Garden…" : "Walk to Garden"}
              </Button>
            )}
            {guide.stage === "explore" && (
              <Button
                compact
                quiet
                label="Open your private notebook for clues"
                onPress={() => {
                  setNotebook(true);
                  setDismissedGuideRound(roundKey);
                }}
              >
                Look at clues
              </Button>
            )}
            <Button
              compact
              quiet
              label="Dismiss first-job guide and explore freely"
              onPress={() => setDismissedGuideRound(roundKey)}
            >
              Explore my way
            </Button>
          </View>
        )}
        {!view.adventure && (
          <Copy style={{ fontSize: 12 }}>
            Earlier saved round · original rules. Start fresh practice for the new ribbon adventure.
          </Copy>
        )}
        <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap" }}>
          <Text style={{ color: C.teal, fontSize: 13, fontWeight: "800" }}>Jobs {completed}/4</Text>
          {view.adventure && (
            <Text style={{ color: "#A6683C", fontSize: 13, fontWeight: "800" }}>
              Ribbon tricks {view.adventure.pranks}/{TRICK_GOAL}
            </Text>
          )}
          {view.adventure && !view.solo && (
            <Text style={{ color: C.muted, fontSize: 12 }}>Round {view.adventure.round}</Text>
          )}
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        <Button
          compact
          quiet
          disabled={!enabled}
          onPress={() => {
            setRevealedRound(roundKey);
            setShowRole(!visibleRole);
          }}
        >
          {visibleRole ? "Hide my role" : "My secret role"}
        </Button>
        <Button compact quiet disabled={!enabled} selected={notebook} onPress={() => setNotebook((value) => !value)}>
          Notebook · {view.clues.length} clues
        </Button>
        {goal && (
          <Button compact quiet onPress={() => setGoal(null)}>
            Stop walking
          </Button>
        )}
      </View>
      {visibleRole && (
        <View
          style={{
            borderRadius: 16,
            padding: 12,
            gap: 7,
            backgroundColor: "#F7EBD7",
            borderWidth: 1,
            borderColor: "#E6D7B8",
          }}
        >
          <Heading style={{ fontSize: 20 }}>{view.ownRole === "crew" ? "You are crew" : "You make mischief"}</Heading>
          <Copy style={{ fontSize: 13 }}>
            {view.ownRole === "crew"
              ? "Help finish the four jobs. Check observations, then ring the bell if you spot a trick. Even after a wrong vote, you can still help."
              : view.adventure
                ? "Make three ribbon tricks or keep the water off. Get close, wait between tricks, and blend in at jobs. A ribbon never removes someone."
                : "This earlier round uses prank elimination. A fresh round uses recoverable ribbon tricks."}
          </Copy>
          {view.ownRole === "mischief" && exploring && (
            <>
              <Copy style={{ fontSize: 12 }}>
                Next trick in {view.prankReadyIn} {view.solo ? "beats" : "seconds"} · pump in {view.sabotageReadyIn}.
              </Copy>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {atPump ? (
                  <Button
                    compact
                    disabled={!!view.sabotage || view.sabotageReadyIn > 0}
                    onPress={() => intent({ type: "sabotage" })}
                  >
                    Turn off the water
                  </Button>
                ) : (
                  <Button compact quiet onPress={() => walk(PUMP)}>
                    Walk to pump
                  </Button>
                )}
                {near.map((p) => (
                  <Button
                    key={p.id}
                    compact
                    quiet
                    disabled={view.prankReadyIn > 0 || (view.adventure?.ribbons[p.id] ?? 0) > view.tick}
                    onPress={() => intent({ type: "prank", target: p.id })}
                  >
                    {view.adventure ? "Ribbon trick on" : "Silly prank on"} {p.name}
                  </Button>
                ))}
                {!near.length && <Copy style={{ fontSize: 12 }}>Walk near an islander for a ribbon trick.</Copy>}
              </View>
            </>
          )}
        </View>
      )}
      {enabled && notebook && (
        <View
          style={{
            borderRadius: 18,
            padding: 13,
            backgroundColor: "#F8F2DF",
            gap: 9,
            borderWidth: 1,
            borderColor: "#E2D8BB",
          }}
        >
          <Heading style={{ fontSize: 19 }}>Your private island notebook</Heading>
          {view.clues.length ? (
            view.clues
              .slice()
              .reverse()
              .map((clue, i) => (
                <View key={`${clue}-${i}`} style={{ borderLeftWidth: 3, borderColor: "#BCA66B", paddingLeft: 10 }}>
                  <Copy style={{ fontSize: 13, lineHeight: 19 }}>{clue}</Copy>
                </View>
              ))
          ) : (
            <Copy style={{ fontSize: 13 }}>
              No observations yet. You can see three path steps away. Stay near friends while they work. Watch the pump
              or a ribbon trick. A visit alone does not prove a role.
            </Copy>
          )}
          <Copy style={{ fontSize: 12 }}>Only you can read these notes. Share a clue aloud at the bell.</Copy>
        </View>
      )}
      {view.result && votePanel}
      {view.solo && canAct && view.phase !== "explore" && (
        <Button compact quiet onPress={() => intent({ type: "wait" })}>
          Let the islanders respond · 1 beat
        </Button>
      )}
      {view.sabotage && !atPump && (
        <View style={{ borderRadius: 15, padding: 12, backgroundColor: "#F5DFC8", gap: 5 }}>
          <Heading style={{ fontSize: 19 }}>
            Water is off · {view.solo ? `${view.sabotage.left} beats` : "repair together · no time limit"}
          </Heading>
          <Copy style={{ fontSize: 13 }}>Jobs wait. Repair at the blue pump.</Copy>
          {!atPump && (
            <Button compact quiet disabled={!exploring} onPress={() => walk(PUMP)}>
              Walk to water pump
            </Button>
          )}
        </View>
      )}
      <View
        style={short ? { flexDirection: "row", gap: 14, alignItems: "flex-start" } : { gap: 12, alignItems: "center" }}
      >
        <View style={{ gap: 10, width: short ? 250 : "100%", maxWidth: 520 }}>
          {onSpeakInstruction && enabled && (
            <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
              <Button compact quiet onPress={() => onSpeakInstruction(view.phase !== "explore" || atBell ? "mystery-meeting" : atPump ? "mystery-pump-v25" : task ? `mystery-${task.id}` : "mystery-welcome")}>Listen to this place</Button>
              <Button compact quiet onPress={() => onStopInstruction?.()}>Stop reading</Button>
            </View>
          )}
          {exploring && self.out && (
            <Copy style={{ fontSize: 13 }}>
              The vote made you a helper. Keep moving, finishing jobs and collecting clues. You do not vote again this
              round.
            </Copy>
          )}
          {exploring &&
            view.ownRole === "crew" &&
            view.adventure &&
            view.players
              .filter(
                (p) =>
                  (view.adventure!.ribbons[p.id] ?? 0) > view.tick &&
                  Math.abs(p.x - self.x) + Math.abs(p.y - self.y) <= 1
              )
              .map((p) => (
                <Button key={p.id} compact quiet onPress={() => intent({ type: "rescue", target: p.id })}>
                  Unwrap {p.id === self.id ? "your ribbon" : `${p.name}’s ribbon`}
                </Button>
              ))}
          {view.phase === "discussion" && !self.out && (
            <>
              <Copy style={{ fontSize: 13 }}>What did you see? Open your notebook. No typing or online chat.</Copy>
              <Button disabled={!canAct || view.selfReady} onPress={() => intent({ type: "ready" })}>
                {view.selfReady ? "Waiting for others" : "Ready to vote"}
              </Button>
            </>
          )}
          {view.phase === "voting" && !self.out && (
            <View style={{ gap: 8 }}>
              {view.players
                .filter((p) => !p.out)
                .map((p) => (
                  <Button
                    key={p.id}
                    quiet
                    disabled={!canAct || view.selfVoted}
                    onPress={() => intent({ type: "vote", target: p.id })}
                  >
                    Vote {p.name}
                  </Button>
                ))}
              <Button
                quiet
                disabled={!canAct || view.selfVoted}
                onPress={() => intent({ type: "vote", target: "skip" })}
              >
                Skip vote
              </Button>
              {view.selfVoted && <Copy>Your vote is private. Waiting for the others.</Copy>}
            </View>
          )}
          {view.phase === "explore" && atPump && view.sabotage && (
            <PumpJob view={view} enabled={exploring} intent={intent} />
          )}
          {view.phase === "explore" && task && (
            <IslandJob taskId={task.id} view={view} enabled={exploring} intent={intent} />
          )}
          {view.phase === "explore" && atBell && (
            <Button disabled={!exploring || !view.canMeet || self.out} onPress={() => intent({ type: "meeting" })}>
              Ring meeting bell · {self.meetings} left
            </Button>
          )}
          {view.phase === "explore" && !task && !view.sabotage && (
            <Copy style={{ fontSize: 13 }}>
              Choose a place below or touch it on the island.{" "}
              {view.solo
                ? "Take your time. The computer islanders move after your actions."
                : "Talk to your family about what you notice."}
            </Copy>
          )}
          {!view.result && votePanel}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>
            {TASKS.map((t) => (
              <PressableScale
                key={t.id}
                accessibilityRole="button"
                accessibilityLabel={`Walk to ${PLACES.find((p) => p.id === t.id)?.name}, ${view.tasks[t.id]} of 3 ready`}
                disabled={!exploring}
                onPress={() => walk(t)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 5,
                  minHeight: 46,
                  paddingHorizontal: 10,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: "#D9E0D0",
                  backgroundColor: "#FFFDF5",
                  opacity: !exploring ? 0.5 : 1,
                }}
              >
                <LandmarkArt kind={t.id} size={28} complete={view.tasks[t.id] === 3} />
                <Text style={{ fontSize: 12, color: C.ink, fontWeight: "700" }}>
                  {PLACES.find((p) => p.id === t.id)?.name} · {view.tasks[t.id]}/3
                </Text>
              </PressableScale>
            ))}
          </View>
        </View>
        <View style={{ gap: 7, alignItems: "center" }}>
          <IslandScene view={view} width={mapWidth} goal={goal} onGoal={walk} enabled={exploring} />
          <Text
            accessibilityLabel={`You are at column ${self.x}, row ${self.y}. ${placeName(self)}.`}
            style={{ fontSize: 12, color: C.muted }}
          >
            {placeName(self)}
            {self.out ? (view.ownRole === "mischief" ? " · caught mischief maker" : " · helping after the vote") : ""}
            {goal ? ` → ${placeName(goal)}` : ""}
          </Text>
          {view.phase === "explore" && (
            <View
              style={{ flexDirection: "row", gap: 5, alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}
            >
              {[
                { label: "Move left", text: "←", x: -1, y: 0 },
                { label: "Move up", text: "↑", x: 0, y: -1 },
                { label: "Move down", text: "↓", x: 0, y: 1 },
                { label: "Move right", text: "→", x: 1, y: 0 },
              ].map((d) => (
                <Button
                  key={d.label}
                  compact
                  quiet
                  label={d.label}
                  style={{ width: 48, minHeight: 46, paddingHorizontal: 5 }}
                  disabled={!exploring}
                  onPress={() => move(d.x, d.y)}
                >
                  {d.text}
                </Button>
              ))}
              {view.solo && (
                <Button compact quiet disabled={!canAct} onPress={() => intent({ type: "wait" })}>
                  Watch · 1 beat
                </Button>
              )}
            </View>
          )}
        </View>
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        {view.players.map((p) => (
          <Text key={p.id} style={{ fontSize: 12, fontWeight: "700", color: playerColor(p.id) }}>
            {p.name}
            {p.id === view.selfId ? " (you)" : ""} ·{" "}
            {p.out ? (view.result?.reason === "caught" && view.result.winner === "crew" ? (view.events.some((e) => e.startsWith(`Vote result: ${p.name} was accused: mischief maker`)) ? "caught mischief maker" : "helper") : "helper") : !p.connected ? "away" : p.visible === false ? "out of sight" : "nearby"}
          </Text>
        ))}
      </View>
      <View accessibilityLiveRegion="polite">
        <Copy style={{ fontSize: 12, lineHeight: 18 }}>{view.events.at(-1)}</Copy>
      </View>
    </View>
  );
}
