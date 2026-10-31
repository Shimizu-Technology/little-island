import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, View } from "react-native";
import Svg, { Circle, Ellipse, Path } from "react-native-svg";
import { Text } from "../../../components/Text";
import { C, IconButton, PressableScale } from "../../../components/ui";
import type { BoardProps } from "../../types";
import { CoachSpot } from "../../Coach";
import {
  FlagIcon,
  RaceBar,
  ReefBoard,
  ShellIcon,
  Spinner,
  Tide,
  Turtle,
  specialIcon,
  useShake,
  type Special,
  type Token,
} from "../../kit/NumberParts";
import { sectionOf, sectionRange } from "../../kit/numbers";
import { boardEnd, currents, nextStone, reefMove, reefRound, shellStops, type ReefState } from "./engine";

const ink = C.ink;

function BiggerCard({ n, onPress, disabled, wrong }: { n: number; onPress: () => void; disabled: boolean; wrong: number }) {
  const shake = useShake(wrong);
  return (
    <Animated.View style={{ flex: 1, transform: [{ translateX: shake }] }}>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={`${n}`}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        style={{
          minHeight: 96,
          borderRadius: 20,
          borderWidth: 3,
          borderColor: "#D79A22",
          backgroundColor: "#FFF6E0",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: 8,
        }}
      >
        <ShellIcon size={34} />
        <Text style={{ fontSize: 44, fontWeight: "900", color: ink }}>{n}</Text>
      </PressableScale>
    </Animated.View>
  );
}

function PlayerChip({ token, toGo, narrow }: { token: Token; toGo: number; narrow: boolean }) {
  return (
    <View
      accessibilityLabel={`${token.label}: ${toGo} to go${token.active ? ", playing now" : ""}`}
      style={{
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
        minHeight: 46,
        borderRadius: 16,
        borderWidth: 3,
        borderColor: token.active ? (token.kind === "coral" ? C.coral : token.kind === "tide" ? C.blue : C.teal) : "transparent",
        backgroundColor: token.active ? C.paper : "rgba(255,255,255,0.45)",
      }}
    >
      {token.kind === "tide" ? <Tide size={38} /> : <Turtle size={38} coral={token.kind === "coral"} />}
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={{ fontSize: narrow ? 12.5 : 14, fontWeight: "900", color: ink }}>
          {token.label}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
          <FlagIcon size={14} />
          <Text style={{ fontSize: 13, fontWeight: "800", color: ink }}>{toGo} to go</Text>
        </View>
      </View>
    </View>
  );
}

/** Little footprints: one for each hop still to make. */
function Hops({ count, back }: { count: number; back: boolean }) {
  return (
    <View accessibilityLabel={`${count} ${count === 1 ? "hop" : "hops"} ${back ? "back" : "to go"}`} style={{ flexDirection: "row", flexWrap: "wrap", gap: 4, maxWidth: 150 }}>
      {Array.from({ length: Math.min(12, count) }, (_, i) => (
        <Svg key={i} width={22} height={22} viewBox="0 0 24 24" accessible={false}>
          <Ellipse cx="12" cy="14" rx="6" ry="7" fill={back ? C.coral : C.teal} />
          <Circle cx="6" cy="6" r="2.4" fill={back ? C.coral : C.teal} />
          <Circle cx="12" cy="4" r="2.4" fill={back ? C.coral : C.teal} />
          <Circle cx="18" cy="6" r="2.4" fill={back ? C.coral : C.teal} />
        </Svg>
      ))}
    </View>
  );
}

export function Board({ session, update, practice, sound, active, width, height, coach, cheer }: BoardProps<ReefState>) {
  const s = session.state,
    o = session.options,
    end = boardEnd(o);
  const r = useMemo(() => reefRound(s, o), [s, o]);
  const before = useMemo(() => (s.history.length ? reefRound({ ...s, history: s.history.slice(0, -1) }, o) : null), [s, o]);
  const mover = o.mode === "together" ? 0 : r.turn;
  const computer = o.mode === "solo" && r.turn === 1 && r.phase !== "done";
  const [spin, setSpin] = useState(0),
    [spinning, setSpinning] = useState(false),
    [lock, setLock] = useState(false),
    [wrong, setWrong] = useState({ n: 0, key: 0 }),
    [pickWrong, setPickWrong] = useState({ n: 0, key: 0 }),
    [nudge, setNudge] = useState(0),
    [hint, setHint] = useState<string | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const spinnerShake = useShake(nudge);

  const thing = o.pace === "easy" ? "spinner" : o.pace === "medium" ? "die" : "dice";
  const spinKey = o.pace === "easy" ? "reef-race-spin" : o.pace === "medium" ? "reef-race-roll" : "reef-race-roll-dice";
  const seatName = (seat: number) =>
    o.mode === "solo" ? (seat === 0 ? "You" : "Island friend") : session.names?.[seat] ?? `Player ${seat + 1}`;
  const tokens: Token[] =
    o.mode === "together"
      ? [
          { kind: "teal", at: r.positions[0], label: "Our turtle", active: r.phase !== "done" },
          { kind: "tide", at: r.positions[1], label: "The tide", active: false },
        ]
      : [
          { kind: "teal", at: r.positions[0], label: o.mode === "solo" ? "Your turtle" : seatName(0), active: r.phase !== "done" && r.turn === 0 },
          { kind: "coral", at: r.positions[1], label: o.mode === "solo" ? "Island friend" : seatName(1), active: r.phase !== "done" && r.turn === 1 },
        ];
  const specials = useMemo(() => {
    const out: Record<number, Special> = {};
    for (const n of shellStops(s)) if (n < end) out[n] = "shell";
    for (const [n, step] of Object.entries(currents)) if (Number(n) < end) out[Number(n)] = step > 0 ? "wave" : "crab";
    return out;
  }, [s, end]);

  const moving = r.phase === "move" || r.phase === "current";
  const nextN = moving ? nextStone(r, o) : null;
  const focus = nextN ?? (r.phase === "done" ? r.positions[r.winner ?? 0] : r.positions[mover]);
  const section = sectionOf(focus, end);
  const [first, last] = sectionRange(section, end);
  const multi = end > 30;

  const outcomeKey =
    r.phase !== "done"
      ? null
      : o.mode === "together"
      ? r.winner === 0
        ? "reef-race-team-win"
        : "reef-race-tide-finish"
      : o.mode === "solo"
      ? r.winner === 0
        ? "reef-race-win"
        : "reef-race-friend-win"
      : "reef-race-finish";
  const phaseAudio =
    r.phase === "roll"
      ? spinKey
      : r.phase === "bonus"
      ? `reef-race-bonus-${end}-${r.positions[mover]}`
      : r.phase === "current"
      ? r.direction > 0
        ? "reef-race-forward"
        : "reef-race-back"
      : r.phase === "done"
      ? outcomeKey!
      : "reef-race-step";

  // Spoken cue at the start of each human turn (the frame's intro covers the very first one).
  const turnKey = `${r.phase}-${r.rollIndex}-${r.turn}`;
  useEffect(() => {
    if (!active || computer || r.phase !== "roll" || s.history.length === 0) return;
    const t = setTimeout(() => sound(spinKey, true), 1300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, turnKey]);
  // The finish: repeat the last number after the frame's chime, then say who reached the island.
  useEffect(() => {
    if (!active || !outcomeKey) return;
    const t = setTimeout(() => sound(outcomeKey, true), 1900);
    return () => clearTimeout(t);
  }, [active, outcomeKey, sound]);

  /** Speak what a landing means (wave, crab or shell) once the counted number is heard. */
  const announce = useCallback(
    (next: ReefState, landed: number) => {
      const after = reefRound(next, o);
      if (after.phase === "current") later(() => sound(after.direction > 0 ? "reef-race-forward" : "reef-race-back", true), 750);
      else if (after.phase === "bonus") later(() => sound(`reef-race-bonus-${end}-${landed}`, true), 750);
      return after;
    },
    [o, end, later, sound]
  );

  // The island friend takes the same turns, one visible hop at a time.
  useEffect(() => {
    if (!active || !computer || spinning) return;
    const last = s.history[s.history.length - 1];
    const delay =
      r.phase === "roll"
        ? 1500
        : r.phase === "bonus"
        ? 2600
        : last === "roll"
        ? 1700
        : r.phase === "current" && before?.phase === "move"
        ? 2300
        : 850;
    const t = setTimeout(() => {
      if (r.phase === "roll") {
        sound("tap");
        setSpinning(true);
        setSpin((k) => k + 1);
        update(reefMove(s, o, "roll"));
        return;
      }
      if (r.phase === "bonus") {
        const big = Math.max(...r.bonus!);
        sound(`reef-race-number-${big}`, true);
        update(reefMove(s, o, big));
        return;
      }
      const n = nextStone(r, o);
      sound(`reef-race-number-${n}`, true);
      const next = reefMove(s, o, n);
      announce(next, n);
      update(next);
    }, delay);
    return () => clearTimeout(t);
  }, [active, computer, spinning, r, s, o, before, sound, update, announce]);

  const onLanded = useCallback(() => {
    setSpinning(false);
    const total = r.dice.reduce((a, b) => a + b, 0);
    if (total > 0) sound(`reef-race-roll-${Math.min(12, total)}`, true);
  }, [r.dice, sound]);

  function onSpin() {
    if (!active) return;
    if (computer || spinning) return;
    if (r.phase !== "roll") {
      setNudge((k) => k + 1);
      return;
    }
    const next = reefMove(s, o, "roll");
    if (next === s) return;
    sound("tap");
    setHint(null);
    setSpinning(true);
    setSpin((k) => k + 1);
    update(next);
  }
  function onStone(n: number) {
    if (!active || computer || spinning || lock || r.phase === "done") return;
    if (r.phase === "roll") {
      setNudge((k) => k + 1);
      sound(spinKey, true);
      return;
    }
    if (r.phase === "bonus") {
      sound(`reef-race-bonus-${end}-${r.positions[mover]}`, true);
      return;
    }
    const next = reefMove(s, o, n);
    practice("num.count-on", next !== s);
    if (r.phase === "move" && r.remaining === 1)
      practice(o.pace === "hard" ? "num.add-within-20" : "num.add-within-10", next !== s);
    if (next === s) {
      setWrong((w) => ({ n, key: w.key + 1 }));
      setHint(r.direction < 0 ? "Hop back to the stone behind." : "Hop to the very next stone.");
      sound(r.direction < 0 ? "reef-race-try-back" : "reef-race-try", true);
      return;
    }
    practice("num.number-line", true);
    if (coach.active) coach.done();
    setHint(null);
    sound(`reef-race-number-${n}`, true);
    setLock(true);
    later(() => setLock(false), 420);
    const after = announce(next, n);
    // A finished move feels good; the frame celebrates the finish itself. Wait for the spoken
    // number (up to about a second for numbers like 77) so the tone doesn't cut it off.
    if (after.phase === "roll") later(() => cheer(), 1000);
    update(next);
  }
  function pick(n: number) {
    if (!active || computer || r.phase !== "bonus") return;
    const next = reefMove(s, o, n);
    practice("num.compare", next !== s);
    if (next === s) {
      setPickWrong((w) => ({ n, key: w.key + 1 }));
      sound("reef-race-bonus-try", true);
      return;
    }
    cheer();
    later(() => sound(`reef-race-number-${n}`, true), 450);
    update(next);
  }

  const who = seatName(r.turn);
  const prompt =
    r.phase === "done"
      ? o.mode === "together"
        ? r.winner === 0
          ? "Our turtle reached the island!"
          : "The tide got there first!"
        : o.mode === "solo"
        ? r.winner === 0
          ? "You reached the island!"
          : "Island friend got there first!"
        : `${seatName(r.winner!)} reached the island!`
      : hint && !computer
      ? hint
      : r.phase === "roll"
      ? computer
        ? "Island friend's turn…"
        : o.mode === "solo"
        ? `Your turn! Tap the ${thing}.`
        : `${who}'s turn! Tap the ${thing}.`
      : spinning
      ? computer
        ? "Island friend spins…"
        : "Spinning…"
      : r.phase === "bonus"
      ? computer
        ? "Island friend picks the bigger one."
        : "A shell! Which is bigger?"
      : r.phase === "current"
      ? r.direction > 0
        ? `A wave! Hop ${r.remaining} more.`
        : `A crab! Hop back ${r.remaining}.`
      : computer
      ? `Island friend hops ${r.remaining}.`
      : `Hop ${r.remaining} ${r.remaining === 1 ? "stone" : "stones"}!`;
  const promptIcon =
    r.phase === "current" ? specialIcon(r.direction > 0 ? "wave" : "crab", 34) : r.phase === "bonus" ? specialIcon("shell", 34) : null;

  // Leave room so the prompt, the whole path and the spinner fit on one phone screen.
  const reserved = 372 + (multi ? 40 : 0) + (session.match ? 66 : 0);
  const pathH = Math.round(Math.max(260, Math.min(width * (width > 600 ? 0.62 : 1.45), height - reserved)));
  const humanRoll = r.phase === "roll" && !computer && !spinning;
  const showCoach = coach.active && !computer;
  const spinnerSize = width > 600 ? 108 : 92;
  const spinner = (
    <Animated.View style={{ transform: [{ translateX: spinnerShake }] }}>
      <Spinner
        kind={thing === "spinner" ? "spinner" : thing}
        values={r.dice}
        spin={spin}
        rolling={spinning}
        onLanded={onLanded}
        onPress={onSpin}
        disabled={!active || computer || spinning}
        size={spinnerSize}
        label={humanRoll ? `Spin! Tap the ${thing}` : r.dice.length ? `The ${thing} shows ${r.dice.join(" and ")}` : `The ${thing}`}
      />
    </Animated.View>
  );
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: "row", gap: 6 }}>
        {tokens.map((t, i) => (
          <PlayerChip key={i} token={t} toGo={end - t.at} narrow={width < 340} />
        ))}
      </View>
      {multi && <RaceBar end={end} tokens={tokens} width={width} />}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, minHeight: 46 }}>
        {promptIcon}
        <Text accessibilityLiveRegion="polite" style={{ flex: 1, fontSize: 20, fontWeight: "900", color: ink }}>
          {prompt}
        </Text>
        <IconButton icon="sound-on" label="Hear it again" onPress={() => sound(phaseAudio)} />
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 14, minHeight: spinnerSize + 4 }}>
        {r.phase === "bonus" && !computer ? (
          r.bonus!.map((n) => (
            <BiggerCard key={n} n={n} onPress={() => pick(n)} disabled={!active} wrong={pickWrong.n === n ? pickWrong.key : 0} />
          ))
        ) : (
          <>
            <CoachSpot active={showCoach && humanRoll}>{spinner}</CoachSpot>
            <View style={{ minWidth: 120, alignItems: "flex-start", gap: 4 }}>
              {humanRoll ? (
                <Text style={{ fontSize: 30, fontWeight: "900", color: C.teal }}>{thing === "spinner" ? "Spin!" : "Roll!"}</Text>
              ) : moving && !spinning ? (
                <>
                  <Text style={{ fontSize: 30, fontWeight: "900", color: r.direction < 0 ? C.coral : C.teal }}>
                    {r.direction < 0 ? "Back " : ""}
                    {r.remaining}
                  </Text>
                  <Hops count={r.remaining} back={r.direction < 0} />
                </>
              ) : r.phase === "done" ? (
                <IslandCheer />
              ) : null}
            </View>
          </>
        )}
      </View>
      <ReefBoard
        width={width}
        height={pathH}
        first={first}
        last={last}
        end={end}
        section={section}
        tokens={tokens}
        specials={specials}
        next={!spinning && !computer ? nextN : null}
        wrong={wrong}
        disabled={!active || computer || spinning}
        onStone={onStone}
        coach={showCoach && moving}
      />
    </View>
  );
}

function IslandCheer() {
  return (
    <Svg width={84} height={56} viewBox="0 0 84 56" accessible={false}>
      <Ellipse cx="42" cy="46" rx="38" ry="9" fill="#E9C98A" />
      <Path d="M54 44 Q58 22 52 8" stroke="#8A5F3A" strokeWidth="4" fill="none" strokeLinecap="round" />
      <Path d="M52 8 q-12 -2 -16 8 M52 8 q12 -4 16 6 M52 8 q-2 -9 -10 -8" stroke="#4E8F5B" strokeWidth="5" fill="none" strokeLinecap="round" />
      <Path d="M22 44 V14 M23 14 h14 l-4 5 l4 5 h-14 Z" stroke={C.ink} strokeWidth="2.5" fill={C.coral} strokeLinejoin="round" />
    </Svg>
  );
}

export function Art({ size }: { size: number }) {
  return (
    <View
      style={{ width: size, height: size, justifyContent: "center", alignItems: "center" }}
      accessibilityLabel="A green turtle hopping along numbered stones to an island"
    >
      <Svg width={size} height={size} viewBox="0 0 120 120" accessible={false}>
        <Ellipse cx="60" cy="69" rx="54" ry="33" fill="#BFE3E6" />
        <Path d="M14 92Q30 70 52 80T104 50" stroke="#F5E6C4" strokeWidth="16" fill="none" strokeLinecap="round" />
        {[
          [20, 88],
          [44, 79],
          [70, 76],
          [94, 58],
        ].map(([x, y], i) => (
          <Circle key={i} cx={x} cy={y} r="8" fill={C.cream} stroke="#7C9C93" strokeWidth="2" />
        ))}
        <Ellipse cx="104" cy="44" rx="14" ry="8" fill="#E9C98A" />
        <Path d="M100 44 V24 M101 24 h10 l-3 4 l3 4 h-10 Z" stroke={C.ink} strokeWidth="2" fill={C.coral} />
      </Svg>
      <View style={{ position: "absolute", top: size * 0.3, left: size * 0.12 }}>
        <Turtle size={size * 0.5} />
      </View>
    </View>
  );
}
