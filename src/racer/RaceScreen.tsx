import { BadgeResultCard } from '../badges/ResultCard';
import { Companion } from "../islander/Companion";
import type { RoundPractice } from "../practice/useRoundPractice";
import { Text } from "../components/Text";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Platform, Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import { Button, C, Copy, GameHeader, Heading, PressableScale, Sheet } from "../components/ui";
import { useReducedMotion } from "../components/motion";
import { COURSES, CourseId, raceCourse } from "./courses";
import {
  advanceRace,
  createRaceSession,
  pauseRace,
  racePlacement,
  raceRecord,
  formatRaceTime as raceTime,
  RACE_LIMIT_TICKS,
  RaceMode,
  RaceRecord,
  RaceRecords,
  RaceSession,
  startRace,
  validRaceSession,
} from "./engine";
import { RaceScene, RaceSceneHandle } from "./RaceScene";
export type RaceFeedback = "jump" | "land" | "recover" | "checkpoint" | "finish";
export type RaceScreenProps = {
  roundPractice?: RoundPractice;
  beforeNewRound?: (run: () => void) => void;
  onFeedback?: (event: RaceFeedback) => void;
  session?: RaceSession | null;
  records?: RaceRecords;
  onSave: (session: RaceSession, record: RaceRecord | null) => void;
  onExit?: () => void;
  active?: boolean;
  sound?: boolean;
  onToggleSound?: () => void;
};
export { formatRaceTime as raceTime } from "./engine";
/** Parent persists onSave transactionally. Remount after external backup replacement. */
export function RaceScreen({ session, records = {}, onSave, onExit, active = true, onFeedback, sound, onToggleSound, beforeNewRound, roundPractice }: RaceScreenProps) {
  const viewport = useWindowDimensions();
  const shortLandscape = viewport.width > viewport.height && viewport.height < 520;
  const landscape = viewport.width > viewport.height;
  const previousLayout = useRef(landscape);
  const practicePending = !!roundPractice?.pending;
  const [initial] = useState(() => (session && validRaceSession(session) ? pauseRace(session) : createRaceSession()));
  const current = useRef(initial),
    saveCallback = useRef(onSave),
    scene = useRef<RaceSceneHandle>(null),
    feedback = useRef(onFeedback);
  React.useLayoutEffect(() => {
    saveCallback.current = onSave;
    feedback.current = onFeedback;
  }, [onSave, onFeedback]);
  const [snapshot, setSnapshot] = useState(initial),
    [choosing, setChoosing] = useState(!session),
    [hasRound, setHasRound] = useState(!!session),
    [mode, setMode] = useState<RaceMode>("practice");
  const [helper, setHelper] = useState(session?.helper ?? true);
  const [rivalStrength, setRivalStrength] = useState<"easy" | "steady" | "fast">(session?.rivalStrength ?? "easy");
  const [autoRunning, setAutoRunning] = useState(false);
  const [foreground, setForeground] = useState(AppState.currentState === "active" || AppState.currentState === null);
  const [controlStyle, setControlStyle] = useState<"run" | "hold" | "step">("run");
  const reducedMotion = useReducedMotion();
  const [width, setWidth] = useState(340),
    [help, setHelp] = useState(false),
    [message, setMessage] = useState("");
  const jumpFromPressIn = useRef(false);
  const held = useRef({ left: false, right: false, jump: false, toggle: false, nudge: 0, stepDirection: 1 as -1 | 1 });
  const clear = useCallback(() => {
    setAutoRunning(false);
    jumpFromPressIn.current = false;
    held.current = { left: false, right: false, jump: false, toggle: false, nudge: 0, stepDirection: 1 as -1 | 1 };
  }, []);
  const persist = useCallback((next: RaceSession) => {
    saveCallback.current(next, raceRecord(next));
  }, []);
  const pause = useCallback(
    (reason = "") => {
      clear();
      current.current = pauseRace(current.current);
      persist(current.current);
      setSnapshot(current.current);
      if (reason) setMessage(reason);
    },
    [clear, persist]
  );
  useEffect(() => {
    if (previousLayout.current !== landscape) {
      previousLayout.current = landscape;
      pause("Paused after turning your device. Resume when ready.");
    }
  }, [landscape, pause]);
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      setForeground(state === "active");
      if (state !== "active") pause("Paused while you were away. Resume when you are ready.");
    });
    return () => {
      subscription.remove();
      clear();
      persist(pauseRace(current.current));
    };
  }, [clear, pause, persist]);
  // Route visibility is an external suspension signal; pause must save immediately.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!active || choosing || help) pause();
  }, [active, choosing, help, pause]);
  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;
    const visibility = () => {
      setForeground(!document.hidden);
      if (document.hidden) pause("Paused while you were away.");
    };
    const blur = () => {
      setForeground(false);
      pause("Paused after changing windows.");
    };
    const focus = () => setForeground(!document.hidden);
    const keydown = (e: KeyboardEvent) => {
      if (
        !active ||
        practicePending ||
        choosing ||
        help ||
        current.current.status !== "running" ||
        (e.target instanceof HTMLElement &&
          (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || (e.key === " " && e.target.closest("button,[role=button]"))))
      )
        return;
      if (["ArrowLeft", "ArrowRight", " ", "ArrowUp"].includes(e.key)) e.preventDefault();
      if (e.key === "ArrowLeft") held.current.left = true;
      if (e.key === "ArrowRight") held.current.right = true;
      if ((e.key === " " || e.key === "ArrowUp") && !e.repeat) held.current.jump = true;
      if (e.key === "Escape") pause();
    };
    const keyup = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") held.current.left = false;
      if (e.key === "ArrowRight") held.current.right = false;
    };
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("blur", blur);
    window.addEventListener("focus", focus);
    window.addEventListener("keydown", keydown);
    window.addEventListener("keyup", keyup);
    return () => {
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("blur", blur);
      window.removeEventListener("focus", focus);
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("keyup", keyup);
    };
  }, [active, practicePending, choosing, help, pause]);
  const finishing =
    snapshot.status === "finished" &&
    snapshot.runners.some((r) => r.finishTick === null) &&
    snapshot.tick < RACE_LIMIT_TICKS;
  useEffect(() => {
    if (!active || practicePending || !foreground || choosing || help || (snapshot.status !== "running" && !finishing)) {
      scene.current?.draw(current.current);
      return;
    }
    let frame = 0,
      previous = performance.now(),
      remainder = 0,
      lastHud = -1,
      lastSaved = current.current.tick;
    const update = (time: number) => {
      const elapsed = Math.max(0, (time - previous) / 1000);
      previous = time;
      if (current.current.status === "running" || current.current.status === "finished") {
        if (elapsed > 0.5) {
          pause("Paused after an interruption. Resume to continue.");
          remainder = 0;
        } else {
          const input = held.current,
            before = current.current;
          const direction = input.left
            ? -1
            : input.right || input.toggle
              ? 1
              : input.nudge > 0
                ? input.stepDirection
                : 0;
          const result = advanceRace(before, {
            direction, jump: input.jump,
            directionTicks: input.left || input.right || input.toggle ? undefined : input.nudge,
          }, elapsed, remainder);
          remainder = result.remainder;
          if (result.session.tick !== before.tick) {
            input.jump = false;
            input.nudge = Math.max(0, input.nudge - (result.session.tick - before.tick));
          }
          current.current = result.session;
          const oldRunner = before.runners[0],
            runner = result.session.runners[0];
          const checkpoint = oldRunner.checkpoint !== runner.checkpoint;
          let event: RaceFeedback | undefined;
          if (runner.finishTick !== oldRunner.finishTick) event = "finish";
          else if (runner.falls !== oldRunner.falls) event = "recover";
          else if (checkpoint) event = "checkpoint";
          else if (runner.landedAt !== oldRunner.landedAt) event = "land";
          else if (runner.vy > 0 && oldRunner.vy <= 0) event = "jump";
          if (event) {
            feedback.current?.(event);
            if (event === "jump") setMessage("");
            if (event === "recover") setMessage("Back at your flag. Take a look at the next obstacle and try again when you’re ready.");
            if (event === "checkpoint") setMessage(`Flag ${runner.checkpoint + 1} saved! Your next try starts here.`);
            if (event === "finish")
              setMessage("Across the line! Your finish time is locked. Watch the other runners arrive.");
          }
          if (
            result.session.status !== before.status ||
            checkpoint ||
            runner.falls !== oldRunner.falls ||
            result.session.tick === RACE_LIMIT_TICKS ||
            result.session.runners.some((r, i) => r.finishTick !== before.runners[i].finishTick) ||
            result.session.tick - lastSaved >= 120
          ) {
            // Finishing CPU racers are also persisted, without changing your recorded time.
            if (result.session !== before) persist(result.session);
            lastSaved = result.session.tick;
          }
          if (result.session.status !== before.status) clear();
        }
      }
      scene.current?.draw(current.current);
      const done =
        current.current.status === "finished" &&
        (current.current.runners.every((r) => r.finishTick !== null) || current.current.tick >= RACE_LIMIT_TICKS);
      if (time - lastHud > 200 || current.current.status !== snapshot.status || done) {
        setSnapshot(current.current);
        lastHud = time;
      }
      if (!done && current.current.status !== "paused" && current.current.status !== "timedout")
        frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [active, practicePending, foreground, choosing, help, snapshot.status, finishing, clear, pause, persist]);
  const begin = useCallback(
    (course: CourseId, selectedMode = mode) => {
      const run = () => {
      clear();
      const next = createRaceSession(
        course,
        course === "training" ? "practice" : selectedMode,
        Math.floor(Math.random() * 0xffffffff),
        undefined,
        { helper, rivalStrength }
      );
      current.current = next;
      persist(next);
      setSnapshot(next);
      setChoosing(false);
      setHasRound(true);
      setMessage("");
      };
      if (beforeNewRound) beforeNewRound(run); else run();
    },
    [clear, persist, mode, beforeNewRound, helper, rivalStrength]
  );
  const resume = () => {
    clear();
    current.current = startRace(current.current);
    // Starting and moving are one action in the primary control model.
    if (controlStyle === "run") {
      held.current.toggle = true;
      setAutoRunning(true);
    }
    setSnapshot(current.current);
    persist(current.current);
    setMessage("");
  };
  const toggleRun = () => {
    held.current.toggle = !held.current.toggle;
    setAutoRunning(held.current.toggle);
    setMessage(
      held.current.toggle
        ? "Running forward. Jump before the next obstacle."
        : current.current.mode === "practice" ? "Standing still. Take your time; Practice has no time limit." : "Standing still. The clock and the other runners keep going."
    );
  };
  if (choosing)
    return (
      <View style={s.root}>
        {roundPractice?.panel}
        {onExit && <GameHeader title="Island Dash" onBack={onExit} sound={onToggleSound ? { on: !!sound, toggle: onToggleSound } : undefined} />}
        <Heading style={{ fontSize: 24 }}>Ready, set, island!</Heading>
        <Copy>Leap over coral, race rolling coconuts and find your next checkpoint. Everything plays offline.</Copy>
        {hasRound && (
          <Button quiet onPress={() => setChoosing(false)}>
            Return to saved course
          </Button>
        )}
        <View style={s.row}>
          <Button compact quiet selected={mode === "race"} onPress={() => setMode("race")}>
            Race · 3-minute challenge
          </Button>
          <Button compact quiet selected={mode === "practice"} onPress={() => setMode("practice")}>
            Practice · untimed
          </Button>
        </View>
        <View style={s.row}>
          <Button compact quiet selected={helper} onPress={() => setHelper(!helper)}>Helper {helper ? "on" : "off"}</Button>
        </View>
        <Copy>Helper makes obstacles gentler and returns you to your flag sooner after a fall. Every finish counts.</Copy>
        <Copy>Rival strength</Copy>
        <View style={s.row}>{(["easy", "steady", "fast"] as const).map(level => <Button key={level} compact quiet selected={rivalStrength === level} onPress={() => setRivalStrength(level)}>{level === "easy" ? "Easy" : level === "steady" ? "Steady" : "Fast"}</Button>)}</View>
        {COURSES.map((course, i) => (
          <PressableScale
            key={course.id}
            accessibilityRole="button"
            accessibilityLabel={`${course.name}. ${course.subtitle}. ${course.id === "training" ? "Practice" : mode}`}
            onPress={() => begin(course.id)}
            style={[s.course, { backgroundColor: course.sky }]}
          >
            <View style={[s.number, { backgroundColor: course.edge }]}>
              <Text style={s.numberText}>{i === 0 ? "GO" : String(i)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.courseTitle}>{course.name}</Text>
              <Copy style={{ fontSize: 14 }}>{course.subtitle}</Copy>
              {records[`${course.id}:${course.id === "training" ? "practice" : mode}`] && (
                <Text style={s.small}>
                  {records[`${course.id}:${course.id === "training" ? "practice" : mode}`]!.edition === 2
                    ? "Best"
                    : "Earlier course best"}{" "}
                  {raceTime(records[`${course.id}:${course.id === "training" ? "practice" : mode}`]!.ticks)}
                </Text>
              )}
            </View>
            <Text style={s.arrow}>›</Text>
          </PressableScale>
        ))}
        <Copy style={s.small}>
          Training is always solo. Computer runners face the same obstacles. You can pass through each other. No network
          or other people are involved.
        </Copy>
      </View>
    );
  const course = raceCourse(snapshot.course, snapshot.edition ?? 1),
    player = snapshot.runners[0],
    running = snapshot.status === "running",
    terminal = snapshot.status === "finished" || snapshot.status === "timedout";
  const sceneHeight = shortLandscape ? 170 : width > 650 ? 260 : 255;
  const best = records[`${snapshot.course}:${snapshot.mode}`];
  return (
    <View style={s.root}>
      {onExit && <GameHeader title="Island Dash" onBack={onExit} sound={onToggleSound ? { on: !!sound, toggle: onToggleSound } : undefined} onHelp={() => { pause(); setHelp(true); }} />}
      <View style={s.row}><Heading style={{ flex: 1, fontSize: 23 }}>{course.name}</Heading>{!onExit && <Button compact quiet onPress={() => { pause(); setHelp(true); }}>How to race</Button>}</View>
      {roundPractice?.panel}
      <Sheet visible={help} title="How to race" onClose={() => setHelp(false)} footer={<Button onPress={() => setHelp(false)}>Back to race</Button>}>
          <Copy>{course.lesson}</Copy>
          <Copy>
            Run & go moves you forward. Tap Jump before a block or water gap; tap Stop to wait for a gate. A slightly
            early or late jump still counts. Choose another control style below if you prefer. Keyboard: Left / Right
            and Space. Escape pauses.
          </Copy>
          <View style={s.row}>
            {(
              [
                ["run", "Run & Jump"],
                ["hold", "Hold arrows"],
                ["step", "Tap steps"],
              ] as const
            ).map(([value, label]) => (
              <Button
                key={value}
                compact
                quiet
                selected={controlStyle === value}
                onPress={() => {
                  clear();
                  setControlStyle(value);
                }}
              >
                {label}
              </Button>
            ))}
          </View>
          <Copy style={s.small}>
            Run & Jump needs one tap at a time. Hold arrows supports two fingers. Tap steps moves a short distance per
            activation; every action also works with accessibility activation.
          </Copy>
          <Copy>
            Touching an obstacle or falling sends you to your last flag. Practice is untimed. The optional
            race challenge has a three-minute limit. Pausing stops every runner and the clock. The app also pauses after an
            interruption longer than half a second. Short slow frames keep all elapsed gameplay time.
          </Copy>
          <Copy>
            Ranks compare actual runner progress. Finish placement counts computer runners that crossed before you.
            Practice has no opponents. Best times are separate for each course and mode.
          </Copy>
      </Sheet>
      {snapshot.edition !== 2 && (
        <Copy style={s.small}>
          Resuming your earlier course exactly where you left it. Choose a new course to try the new island routes.
        </Copy>
      )}
      <View style={s.scoreRow} accessibilityLiveRegion="none">
        <Text style={s.metric}>{snapshot.mode === "practice" ? "Untimed practice" : `Time ${raceTime(player.finishTick ?? snapshot.tick)}`}</Text>
        <Text style={s.metric}>
          {snapshot.runners.length > 1 ? `${racePlacement(snapshot)} / ${snapshot.runners.length}` : "Practice"}
        </Text>
        <Text style={s.metric}>
          Flag {player.checkpoint + 1}/{course.checkpoints.length}
        </Text>
      </View>
      <View style={shortLandscape ? { flexDirection: "row", gap: 16, alignItems: "flex-start" } : { gap: 12 }}>
        <View style={shortLandscape ? { flex: 1, gap: 8 } : { gap: 12 }}>
          <View onLayout={(e) => setWidth(Math.max(260, e.nativeEvent.layout.width))}>
            <RaceScene
              key={snapshot.id}
              ref={scene}
              initial={snapshot}
              width={width}
              height={sceneHeight}
              reducedMotion={reducedMotion}
            />
          </View>
          <View
            accessible
            accessibilityLabel={`Course progress ${Math.round((player.x / course.length) * 100)} percent. ${player.falls} recoveries.`}
            style={s.progress}
          >
            <View
              style={[s.progressFill, { width: `${Math.max(0, Math.min(100, (player.x / course.length) * 100))}%` }]}
            />
          </View>
        </View>
        <View style={shortLandscape ? { width: 260, gap: 8 } : { gap: 12 }}>
          {terminal ? (
            <View style={s.panel} accessibilityLiveRegion="polite">
              <BadgeResultCard round={snapshot.id}/><Companion event={snapshot.status === "finished" && racePlacement(snapshot) === 1 ? "win" : "loss"}/>
              <Heading style={{ fontSize: 25 }}>
                {snapshot.status === "finished"
                  ? snapshot.runners.length > 1
                    ? `Finished ${["", "1st", "2nd", "3rd", "4th"][racePlacement(snapshot)]}!`
                    : "You reached the finish!"
                  : "Time for another try"}
              </Heading>
              <Copy>
                {snapshot.status === "finished"
                  ? `${raceTime(player.finishTick!)} · ${player.falls} ${player.falls === 1 ? "recovery" : "recoveries"}. ${best && best.edition === snapshot.edition ? `Your best: ${raceTime(best.ticks)}.` : "Your time is saved on this device."}`
                  : "The three-minute challenge ended. Take your time in untimed Practice."}
              </Copy>
              {snapshot.status === "finished" && (
                <Text style={s.courseTitle}>
                  {player.falls === 0
                    ? "Clean run! Every jump landed."
                    : player.falls <= 2
                      ? "Brave finish! You kept going."
                      : "Island explorer! Every retry helped."}
                </Text>
              )}
              {snapshot.runners.length > 1 &&
                snapshot.runners.map((r) => (
                  <Text key={r.id} style={s.small}>
                    {r.name}:{" "}
                    {r.finishTick !== null
                      ? raceTime(r.finishTick)
                      : snapshot.tick >= RACE_LIMIT_TICKS
                        ? "Did not finish in 3 minutes"
                        : `racing… ${Math.round((r.x / course.length) * 100)}%`}
                  </Text>
                ))}
              <View style={s.row}>
                <Button onPress={() => begin(snapshot.course, "practice")}>Play again · untimed Practice</Button>
                <Button quiet onPress={() => { setMode("practice"); setChoosing(true); }}>
                  Choose a course
                </Button>
              </View>
            </View>
          ) : (
            <>
              {!running && (
                <View style={s.panel}>
                  <Text accessibilityRole="header" style={s.courseTitle}>
                    {snapshot.status === "ready" ? "At the starting line" : "Paused · your place is saved"}
                  </Text>
                  {!shortLandscape && (
                    <Copy>
                      {snapshot.status === "ready"
                        ? course.lesson
                        : snapshot.mode === "practice" ? "Your place is saved. Continue at your own pace. Held controls have been cleared." : "Every runner and the timer will continue from this moment. Held controls have been cleared."}
                    </Copy>
                  )}
                  <Button disabled={!active || practicePending || !foreground || help} onPress={resume}>
                    {snapshot.status === "ready"
                      ? controlStyle === "run"
                        ? "Run & go!"
                        : "Start course"
                      : controlStyle === "run"
                        ? "Resume & run"
                        : "Resume"}
                  </Button>
                </View>
              )}
              {shortLandscape && !running && (
                <Button
                  compact
                  quiet
                  onPress={() => {
                    pause();
                    setChoosing(true);
                  }}
                >
                  Choose a course
                </Button>
              )}
              {(!shortLandscape || running) && (
                <>
                  <View style={s.controls}>
                    {controlStyle === "run" && (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={autoRunning ? "Stop running" : "Run forward"}
                        disabled={!running}
                        accessibilityState={{ disabled: !running }}
                        onPress={toggleRun}
                        style={({ pressed }) => [s.pad, !running && s.disabled, pressed && s.pressed]}
                      >
                        <Text style={[s.padText, { fontSize: 20 }]}>{autoRunning ? "Stop ■" : "Run →"}</Text>
                      </Pressable>
                    )}
                    {controlStyle === "step" && (
                      <View style={{ flex: 1, gap: 8 }}>
                        {([-1, 1] as const).map((direction) => (
                          <Button
                            key={direction}
                            quiet
                            disabled={!running}
                            onPress={() => {
                              held.current.stepDirection = direction;
                              held.current.nudge = Math.min(60, held.current.nudge + 18);
                            }}
                          >
                            {direction === -1 ? "Step ←" : "Step →"}
                          </Button>
                        ))}
                      </View>
                    )}
                    {controlStyle === "hold" && (
                      <>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel="Hold to run left"
                          accessibilityState={{ disabled: !running }}
                          disabled={!running}
                          onAccessibilityTap={() => {
                            held.current.stepDirection = -1;
                            held.current.nudge = 18;
                          }}
                          onPressIn={() => {
                            held.current.left = true;
                          }}
                          onPressOut={() => {
                            held.current.left = false;
                          }}
                          style={({ pressed }) => [s.pad, !running && s.disabled, pressed && s.pressed]}
                        >
                          <Text style={s.padText}>←</Text>
                        </Pressable>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel="Hold to run right"
                          accessibilityState={{ disabled: !running }}
                          disabled={!running}
                          onAccessibilityTap={() => {
                            held.current.stepDirection = 1;
                            held.current.nudge = 18;
                          }}
                          onPressIn={() => {
                            held.current.right = true;
                          }}
                          onPressOut={() => {
                            held.current.right = false;
                          }}
                          style={({ pressed }) => [s.pad, !running && s.disabled, pressed && s.pressed]}
                        >
                          <Text style={s.padText}>→</Text>
                        </Pressable>
                      </>
                    )}
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Jump"
                      accessibilityState={{ disabled: !running }}
                      disabled={!running}
                      onPressIn={() => {
                        jumpFromPressIn.current = true;
                        held.current.jump = true;
                      }}
                      onPress={() => {
                        if (!jumpFromPressIn.current) held.current.jump = true;
                        jumpFromPressIn.current = false;
                      }}
                      onAccessibilityTap={() => {
                        held.current.jump = true;
                      }}
                      style={({ pressed }) => [s.pad, s.jump, !running && s.disabled, pressed && s.pressed]}
                    >
                      <Text style={[s.padText, { color: C.paper, fontSize: 20 }]}>Jump ↑</Text>
                    </Pressable>
                  </View>
                  <View style={s.row}>
                    {running && (
                      <Button compact quiet onPress={() => pause()}>
                        Pause
                      </Button>
                    )}
                    {shortLandscape && (
                      <Button
                        compact
                        quiet
                        onPress={() => {
                          pause();
                          setChoosing(true);
                        }}
                        label="Choose a course"
                      >
                        Courses
                      </Button>
                    )}
                  </View>
                </>
              )}
              {!shortLandscape && (
                <Copy style={s.small}>
                  {message ||
                    (player.recovery > 0
                      ? "Back to your flag. Ready to try again!"
                      : controlStyle === "run"
                        ? "Run forward. Jump at the signs. Stop to choose your moment."
                        : controlStyle === "hold"
                          ? "Hold an arrow and tap Jump with your other finger."
                          : "Tap a step, then Jump. You can use one control at a time.")}
                </Copy>
              )}
              {!shortLandscape && (
                <Button
                  compact
                  quiet
                  onPress={() => {
                    pause();
                    setChoosing(true);
                  }}
                >
                  Choose a course
                </Button>
              )}
            </>
          )}
        </View>
      </View>
      {onExit && (
        <Button
          compact
          quiet
          onPress={() => {
            pause();
            onExit();
          }}
        >
          Back to games
        </Button>
      )}
    </View>
  );
}
const s = StyleSheet.create({
  root: { gap: 12, width: "100%" },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" },
  course: {
    padding: 16,
    gap: 14,
    minHeight: 88,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 22,
    borderColor: C.line,
    borderWidth: 1,
  },
  number: { width: 44, height: 44, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  numberText: { color: "white", fontWeight: "800", fontSize: 18 },
  courseTitle: { color: C.ink, fontSize: 20, fontWeight: "800" },
  arrow: { color: C.teal, fontSize: 34 },
  small: { color: C.muted, fontSize: 13, lineHeight: 20 },
  panel: { gap: 10, backgroundColor: C.soft, padding: 16, borderRadius: 20 },
  scoreRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 8 },
  metric: { color: C.ink, fontSize: 15, fontWeight: "700", fontVariant: ["tabular-nums"] },
  controls: { flexDirection: "row", gap: 10, alignItems: "stretch" },
  pad: {
    minWidth: 64,
    minHeight: 76,
    paddingHorizontal: 10,
    paddingVertical: 14,
    flex: 1,
    backgroundColor: "#E4EDE0",
    borderColor: "#BCCFBC",
    borderWidth: 2,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    userSelect: "none",
  },
  jump: { flex: 1.6, backgroundColor: C.teal, borderColor: C.teal },
  padText: { color: C.ink, fontSize: 30, fontWeight: "800" },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.75, transform: [{ scale: 0.97 }] },
  progress: { height: 8, borderRadius: 4, overflow: "hidden", backgroundColor: "#DAE5D8" },
  progressFill: { height: 8, backgroundColor: C.teal, borderRadius: 4 },
});
