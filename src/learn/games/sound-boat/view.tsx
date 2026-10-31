import React, { useEffect, useRef, useState } from "react";
import { Animated, View } from "react-native";
import Svg, { Ellipse, Path } from "react-native-svg";
import { Button, C, Copy, Heading, IconButton, PressableScale } from "../../../components/ui";
import { easeOut, nativeDriver, useReducedMotion } from "../../../components/motion";
import type { BoardProps } from "../../types";
import { CoachSpot } from "../../Coach";
import { Icon } from "../../../components/Icon";
import { ObjectGlyph, PictureObject } from "../../art/Objects";
import { pictureFor } from "../../content/reading/clues";
import { dayNumber } from "../../skills";
import { wordAudio, wordEntry } from "../../kit/reading";
import {
  WORDS_PER_ROUND,
  boatBlanks,
  boatBoxes,
  boatChoices,
  boatComplete,
  boatCurrent,
  boatExpected,
  boatFromLegacy,
  boatMove,
  boatPrevious,
  boatTurn,
  boatWord,
  isLegacyBoat,
  silentE,
  startsLadder,
  tileLabel,
  type BoatAction,
  type BoatState,
  type LegacyBoatState,
} from "./engine";

const ink = C.ink;
const glow = "#F9EDC9";

/** Boat on the water, sailing one step toward the island for each finished word. */
function Voyage({ step, width }: { step: number; width: number }) {
  const reduced = useReducedMotion();
  const w = Math.min(width, 380),
    room = w - 92;
  const [x] = useState(() => new Animated.Value((step / WORDS_PER_ROUND) * room));
  useEffect(() => {
    const to = (step / WORDS_PER_ROUND) * room;
    if (reduced) x.setValue(to);
    else Animated.timing(x, { toValue: to, duration: 700, easing: easeOut, useNativeDriver: nativeDriver }).start();
  }, [step, room, reduced, x]);
  return (
    <View
      accessible
      accessibilityLabel={`The boat has sailed ${step} of ${WORDS_PER_ROUND} steps to the island`}
      style={{ width: w, height: 46 }}
    >
      <Svg width={w} height={46} viewBox={`0 0 ${w} 46`} style={{ position: "absolute" }}>
        <Path
          d={`M4 38 Q20 32 36 38 T68 38 T100 38 T132 38 T164 38 T196 38 T228 38 T260 38 T292 38 T324 38 T356 38 T388 38`}
          fill="none"
          stroke="#91C6D3"
          strokeWidth={3}
        />
        <Ellipse cx={w - 26} cy={38} rx={24} ry={7} fill="#E6D3AC" stroke={ink} strokeWidth={2} />
        <Path
          d={`M${w - 24} 35 L${w - 24} 12 M${w - 24} 12 Q${w - 42} 6 ${w - 38} 18 M${w - 24} 12 Q${w - 8} 5 ${w - 8} 18`}
          stroke={C.teal}
          fill="none"
          strokeWidth={3}
          strokeLinecap="round"
        />
      </Svg>
      <Animated.View style={{ position: "absolute", left: 0, top: 4, transform: [{ translateX: x }] }}>
        <Svg width={44} height={38} viewBox="0 0 100 100">
          <ObjectGlyph name="boat" color="coral" />
        </Svg>
      </Animated.View>
    </View>
  );
}

/** A letter tile that wiggles when it is the wrong one and then waits on the side. */
function Tile({
  tile,
  out,
  lit,
  size,
  onPress,
  shake,
}: {
  tile: string;
  out: boolean;
  lit: boolean;
  size: number;
  onPress: () => void;
  shake: number;
}) {
  const reduced = useReducedMotion();
  const [x] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (!shake || reduced) return;
    x.setValue(0);
    const anim = Animated.sequence([
      Animated.timing(x, { toValue: 1, duration: 70, useNativeDriver: nativeDriver }),
      Animated.timing(x, { toValue: -1, duration: 110, useNativeDriver: nativeDriver }),
      Animated.timing(x, { toValue: 1, duration: 110, useNativeDriver: nativeDriver }),
      Animated.timing(x, { toValue: 0, duration: 80, useNativeDriver: nativeDriver }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [shake, reduced, x]);
  const label = tileLabel(tile);
  return (
    <Animated.View
      style={{ transform: [{ translateX: x.interpolate({ inputRange: [-1, 1], outputRange: [-8, 8] }) }] }}
    >
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={`Letter ${label.split("").join(" ")}${out ? ", not this one" : lit ? ", try this one" : ""}`}
        accessibilityState={{ disabled: out }}
        disabled={out}
        onPress={onPress}
        style={{
          minWidth: label.length > 1 ? size + 18 : size,
          height: size,
          paddingHorizontal: 8,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 14,
          borderWidth: lit ? 4 : 2,
          borderColor: lit ? C.gold : ink,
          backgroundColor: lit ? glow : C.paper,
          opacity: out ? 0.3 : 1,
          shadowColor: ink,
          shadowOpacity: out ? 0 : 0.18,
          shadowRadius: 0,
          shadowOffset: { width: 0, height: 3 },
        }}
      >
        <Copy style={{ fontSize: size * 0.5, lineHeight: size * 0.62, color: ink, fontWeight: "700" }}>{label}</Copy>
      </PressableScale>
    </Animated.View>
  );
}

/** One box on the boat. Pops when a letter lands in it. */
function Box({
  letter,
  state,
  wide,
  size,
}: {
  letter: string;
  state: "given" | "filled" | "now" | "empty" | "silent";
  wide: boolean;
  size: number;
}) {
  const reduced = useReducedMotion();
  const [pop] = useState(() => new Animated.Value(1));
  const was = useRef(letter);
  useEffect(() => {
    if (letter && !was.current && state === "filled" && !reduced) {
      pop.setValue(1.35);
      Animated.spring(pop, { toValue: 1, friction: 4, useNativeDriver: nativeDriver }).start();
    }
    was.current = letter;
  }, [letter, state, reduced, pop]);
  return (
    <Animated.View
      accessibilityLabel={
        state === "now"
          ? "Glowing box: the next letter goes here"
          : state === "silent"
            ? "silent e"
            : letter
              ? `letter ${letter}`
              : "empty box"
      }
      style={{
        width: wide ? size * 1.45 : size,
        height: size * 1.12,
        borderRadius: 12,
        borderWidth: state === "now" ? 4 : 2,
        borderStyle: state === "silent" ? "dashed" : "solid",
        borderColor: state === "now" ? C.gold : state === "silent" ? C.muted : ink,
        backgroundColor:
          state === "now" ? glow : state === "filled" ? C.success : state === "silent" ? "#EEF3F6" : C.paper,
        alignItems: "center",
        justifyContent: "center",
        transform: [{ scale: pop }],
      }}
    >
      <Copy
        style={{
          fontSize: size * 0.55,
          lineHeight: size * 0.7,
          fontWeight: "700",
          color: state === "silent" ? C.muted : ink,
        }}
      >
        {letter}
      </Copy>
    </Animated.View>
  );
}

function Finished() {
  return (
    <View style={{ alignItems: "center", gap: 10, padding: 12 }}>
      <Voyage step={WORDS_PER_ROUND} width={320} />
      <PictureObject name="boat" size={110} />
      <Heading style={{ textAlign: "center" }}>The boat reached the island!</Heading>
      <Copy style={{ color: ink, textAlign: "center" }}>Ten words, spelled one letter at a time.</Copy>
    </View>
  );
}

export function Board(props: BoardProps<BoatState | LegacyBoatState>) {
  const { session, update, skills } = props;
  const s = session.state;
  const legacy = isLegacyBoat(s) ? s : null;
  // A round saved by the older Sound Boat: finished ones show their finish; unfinished ones start fresh.
  useEffect(() => {
    if (legacy && legacy.stage !== "done") update(boatFromLegacy(legacy, session.options, skills, dayNumber()));
  }, [legacy, session.options, skills, update]);
  if (legacy) return legacy.stage === "done" ? <Finished /> : null;
  return <Play {...props} session={{ ...session, state: s as BoatState }} />;
}

function Play({
  session,
  update,
  practice,
  assistance,
  sound,
  soundOn,
  width,
  height,
  active,
  coach,
  cheer,
}: BoardProps<BoatState | LegacyBoatState> & { session: { state: BoatState } }) {
  const s = session.state;
  const reduced = useReducedMotion(),
    compact = height < 730;
  const [shakes, setShakes] = useState<Record<string, number>>({});
  const [rock] = useState(() => new Animated.Value(0));
  const done = s.index >= WORDS_PER_ROUND;
  const word = boatWord(s),
    complete = boatComplete(s);

  // Say each new word. A fresh round waits for the spoken goal first; a ladder starts with "change one letter".
  // A restored round waits for her to tap the speaker (browsers also block sound before a first tap).
  const spoken = useRef<string | null>(session.revision > 0 ? `${session.id}-${s.index}` : null);
  useEffect(() => {
    if (done || !active || !soundOn) return;
    const key = `${session.id}-${s.index}`;
    if (spoken.current === key) return;
    const fresh = session.revision === 0;
    const say = () => {
      spoken.current = key;
      sound(wordAudio(word.word), true);
    };
    const timers: ReturnType<typeof setTimeout>[] = [];
    if (startsLadder(s) && !complete) {
      timers.push(setTimeout(() => sound("sound-boat-ladder", true), 250));
      timers.push(setTimeout(say, 2900));
    } else timers.push(setTimeout(say, fresh ? 2900 : 350));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Speaks once per word; later renders must not repeat it.
  }, [active, soundOn, s.index, session.id, done]);

  // A built word sails on by itself after a short cheer.
  useEffect(() => {
    if (!complete || !active) return;
    const timer = setTimeout(() => update(boatMove(s, { type: "next" })), 1400);
    return () => clearTimeout(timer);
  }, [complete, active, s, update]);

  if (done) return <Finished />;

  const boxes = boatBoxes(s),
    blanks = boatBlanks(s),
    current = boatCurrent(s),
    expected = boatExpected(s),
    choices = boatChoices(s),
    previous = boatPrevious(s),
    picture = pictureFor(word.word);
  const turn = boatTurn(s, session.options),
    who = session.names?.[turn] ?? `Player ${turn + 1}`;

  function move(a: BoatAction) {
    if (!active) return;
    const next = boatMove(s, a);
    if (next === s) return;
    if (a.type === "tile") {
      if (coach.active) coach.done();
      const right = next.filled > s.filled;
      if (right) {
        if (boatComplete(next)) {
          practice(word.skill, !next.assisted);
          cheer(s.index === WORDS_PER_ROUND - 1 ? "big" : "right");
        } else sound("tap");
      } else {
        setShakes((m) => ({ ...m, [a.tile]: (m[a.tile] ?? 0) + 1 }));
        sound(wordAudio(word.word), true);
        if (!reduced) {
          rock.setValue(0);
          Animated.sequence([
            Animated.timing(rock, { toValue: 1, duration: 90, useNativeDriver: nativeDriver }),
            Animated.timing(rock, { toValue: -1, duration: 150, useNativeDriver: nativeDriver }),
            Animated.timing(rock, { toValue: 0, duration: 110, useNativeDriver: nativeDriver }),
          ]).start();
        }
      }
    }
    if (next.assisted) assistance?.();
    if (a.type === "help") sound(wordAudio(word.word));
    update(next);
  }

  const boxSize = Math.min(
      compact ? 46 : 54,
      (Math.min(width, 420) - 40) / (word.tiles.length + (silentE(s) ? 1.6 : 0.6))
    ),
    tileSize = compact ? 50 : 58,
    pictureSize = compact ? 84 : 116;
  const prompt = complete ? `${word.word}!` : previous ? "Change one letter." : "Spell it! Tap the letters.";

  return (
    <View style={{ gap: compact ? 6 : 10, alignItems: "center" }}>
      {session.options.mode !== "solo" && (
        <Copy style={{ color: C.teal, fontWeight: "800", fontSize: 22, textAlign: "center" }}>{who}’s turn</Copy>
      )}
      <Voyage step={s.index} width={width} />
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, minHeight: pictureSize }}>
        {previous && (
          <View accessible accessibilityLabel={`Was ${previous}`} style={{ alignItems: "center", gap: 4 }}>
            <View style={{ flexDirection: "row", gap: 2 }}>
              {wordEntry(previous)!.tiles.map((t, i) => (
                <View
                  key={i}
                  style={{
                    minWidth: 26,
                    height: 32,
                    paddingHorizontal: 3,
                    borderRadius: 7,
                    borderWidth: blanks.includes(i) ? 2 : 1,
                    borderColor: blanks.includes(i) ? C.coral : C.line,
                    backgroundColor: C.paper,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Copy style={{ fontSize: 18, lineHeight: 22, color: ink, fontWeight: "600" }}>{tileLabel(t)}</Copy>
                </View>
              ))}
              {/_e$/.test(wordEntry(previous)!.tiles.join(" ")) && (
                <Copy style={{ fontSize: 18, lineHeight: 32, color: C.muted }}>e</Copy>
              )}
            </View>
            <Copy style={{ fontSize: 26, lineHeight: 28, color: ink }}>↓</Copy>
          </View>
        )}
        <View style={{ alignItems: "center" }}>
          {picture ? (
            <PictureObject name={picture} size={pictureSize} />
          ) : (
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Hear the word"
              disabled={!soundOn}
              onPress={() => sound(wordAudio(word.word))}
              style={{
                width: pictureSize,
                height: pictureSize,
                borderRadius: pictureSize / 2,
                backgroundColor: C.paper,
                borderWidth: 2,
                borderColor: C.line,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="sound-on" size={pictureSize * 0.55} color={C.blue} />
            </PressableScale>
          )}
          {!soundOn && <Copy style={{ color: ink, fontWeight: "800", fontSize: 26, lineHeight: 30 }}>{word.word}</Copy>}
        </View>
        {soundOn && picture && (
          <IconButton
            icon="sound-on"
            label={`Hear the word again`}
            onPress={() => sound(wordAudio(word.word))}
            size={52}
          />
        )}
      </View>
      <Copy
        style={{ color: ink, fontSize: complete ? 26 : 19, fontWeight: complete ? "800" : "600", textAlign: "center" }}
      >
        {prompt}
      </Copy>
      <Animated.View
        style={{
          transform: [{ rotate: rock.interpolate({ inputRange: [-1, 0, 1], outputRange: ["-3deg", "0deg", "3deg"] }) }],
          alignSelf: "stretch",
          alignItems: "center",
          backgroundColor: "#D1E8EF",
          borderRadius: 22,
          paddingTop: 10,
          paddingHorizontal: 8,
        }}
      >
        <View
          accessible
          accessibilityLabel={`The word on the boat: ${boxes.map((b) => tileLabel(b) || "empty").join(", ")}`}
          style={{ flexDirection: "row", gap: 5, justifyContent: "center" }}
        >
          {word.tiles.map((t, i) => {
            const letter = boxes[i] ? tileLabel(boxes[i]) : "";
            const given = blanks.indexOf(i) < 0;
            return (
              <Box
                key={`${s.index}-${i}`}
                letter={letter}
                wide={tileLabel(t).length > 1}
                size={boxSize}
                state={i === current ? "now" : !letter ? "empty" : given ? "given" : "filled"}
              />
            );
          })}
          {silentE(s) && <Box letter="e" state="silent" wide={false} size={boxSize} />}
        </View>
        <Svg width={Math.min(width - 18, 330)} height="30" viewBox="0 0 310 30">
          <Path d="M7 2 L303 2 L273 24 L37 24 Z" fill="#B8875C" stroke={ink} strokeWidth="2" />
          <Path
            d="M0 28 Q24 18 48 28 T96 28 T144 28 T192 28 T240 28 T310 28"
            fill="none"
            stroke="#5B9ABA"
            strokeWidth="2"
          />
        </Svg>
      </Animated.View>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 10,
          justifyContent: "center",
          maxWidth: 420,
          minHeight: tileSize,
        }}
      >
        {choices.map((tile) => {
          const lit = s.hint && tile === expected && !complete;
          const t = (
            <Tile
              key={`${s.index}-${tile}`}
              tile={tile}
              out={s.out.includes(tile) || complete}
              lit={lit}
              size={tileSize}
              shake={shakes[tile] ?? 0}
              onPress={() => move({ type: "tile", tile })}
            />
          );
          return (
            <CoachSpot key={`${s.index}-${tile}`} active={coach.active && tile === expected && !complete}>
              {t}
            </CoachSpot>
          );
        })}
      </View>
      {!complete && (
        <Button
          compact
          quiet
          icon="help"
          disabled={s.hint}
          label="Help: light up the right letter"
          onPress={() => move({ type: "help" })}
        >
          Help
        </Button>
      )}
    </View>
  );
}

export function Art({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Ellipse cx="50" cy="77" rx="48" ry="17" fill="#91C6D3" />
      <ObjectGlyph name="boat" size={92} x={4} />
    </Svg>
  );
}
