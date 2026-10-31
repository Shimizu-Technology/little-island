import React, { useEffect, useState } from "react";
import { Animated, View } from "react-native";
import { Button, C, Copy, Heading, PressableScale } from "../../../components/ui";
import { nativeDriver, useReducedMotion } from "../../../components/motion";
import type { BoardProps } from "../../types";
import { CoachSpot } from "../../Coach";
import { Scene, PictureObject } from "../../art/Objects";
import { ReadingText } from "../../kit/ReadingText";
import { sceneLabel, wordAudio } from "../../kit/reading";
import { whichAnswer, whichHelp, whichItem, whichNext, whichPick, type WhichState } from "./engine";

/** A big picture card: wiggles and steps back when wrong, wears a check when right. */
function Card({
  children,
  label,
  state,
  width,
  disabled,
  onPress,
}: {
  children: React.ReactNode;
  label: string;
  state: "idle" | "wrong" | "right" | "faded";
  width: number;
  disabled: boolean;
  onPress: () => void;
}) {
  const reduced = useReducedMotion();
  const [x] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (state !== "wrong" || reduced) return;
    const anim = Animated.sequence([
      Animated.timing(x, { toValue: 1, duration: 70, useNativeDriver: nativeDriver }),
      Animated.timing(x, { toValue: -1, duration: 120, useNativeDriver: nativeDriver }),
      Animated.timing(x, { toValue: 1, duration: 120, useNativeDriver: nativeDriver }),
      Animated.timing(x, { toValue: 0, duration: 80, useNativeDriver: nativeDriver }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [state, reduced, x]);
  return (
    <Animated.View
      style={{ transform: [{ translateX: x.interpolate({ inputRange: [-1, 1], outputRange: [-8, 8] }) }] }}
    >
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={`${label}${state === "right" ? ", matches" : state === "wrong" ? ", not this one" : ""}`}
        accessibilityState={{ selected: state === "right", disabled }}
        disabled={disabled}
        onPress={onPress}
        style={{
          width,
          padding: 3,
          borderWidth: state === "right" || state === "wrong" ? 5 : 2,
          borderColor: state === "wrong" ? C.coral : state === "right" ? C.teal : C.line,
          borderRadius: 18,
          backgroundColor: C.paper,
          alignItems: "center",
          overflow: "hidden",
          opacity: state === "wrong" || state === "faded" ? 0.4 : 1,
        }}
      >
        {children}
        {state === "right" && (
          <View
            style={{
              position: "absolute",
              right: 6,
              top: 6,
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: C.teal,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Copy style={{ color: "#FFFFFF", fontSize: 22, lineHeight: 26, fontWeight: "800" }}>✓</Copy>
          </View>
        )}
      </PressableScale>
    </Animated.View>
  );
}

export function Board({
  session,
  update,
  practice,
  sound,
  soundOn,
  width,
  height,
  active,
  coach,
  cheer,
  assistance,
}: BoardProps<WhichState>) {
  const s = session.state;
  // Pictures already tried on this sentence step back (the save keeps only the latest).
  const [out, setOut] = useState<{ index: number; picks: number[] }>({ index: s.index, picks: [] });
  const tried = out.index === s.index ? out.picks : [];

  // After a right answer, a short pause to enjoy it, then the next sentence.
  useEffect(() => {
    if (!s.solved || !active) return;
    const timer = setTimeout(() => update(whichNext(s)), 1400);
    return () => clearTimeout(timer);
  }, [s, active, update]);

  if (s.index === 8)
    return (
      <View style={{ alignItems: "center", padding: 16, gap: 10 }}>
        <PictureObject name="cat" size={100} />
        <Heading style={{ textAlign: "center" }}>Every word has its picture.</Heading>
        <Copy style={{ color: C.ink, textAlign: "center" }}>You read all eight sentences.</Copy>
      </View>
    );
  const item = whichItem(s),
    correct = item.scenes[0],
    wrong = s.wrong === null ? null : item.scenes[s.orders[s.index][s.wrong]];
  const changed = wrong
    ? (["subject", "object", "relation", "color", "size"] as const).find((k) => wrong[k] !== correct[k])
    : undefined;
  const highlight = changed && !s.solved ? correct[changed] : undefined;
  const small = height < 730,
    room = Math.min(width, 900),
    across = room >= 600 ? 3 : 2,
    cardWidth = Math.min(250, (room - 10 * (across - 1)) / across),
    pictureHeight = Math.round(cardWidth * (small ? 0.6 : 0.72));
  const reader = session.names?.[(s.starter + s.index) % 2] ?? `Player ${((s.starter + s.index) % 2) + 1}`;
  const answer = whichAnswer(s);

  function pick(i: number) {
    if (!active) return;
    const next = whichPick(s, i);
    if (next === s) return;
    if (coach.active) coach.done();
    // Only the first pick on each sentence counts as practice.
    if (!s.tried) {
      practice(item.skill, next.solved);
      practice("read.meaning", next.solved);
    }
    if (next.solved) cheer(s.index === 7 ? "big" : "right");
    else {
      sound("which-one-look", true);
      setOut({ index: s.index, picks: [...tried, i] });
    }
    update(next);
  }

  const cards = s.orders[s.index].map((sceneIndex, i) => {
    const isWrong = tried.includes(i) || s.wrong === i;
    return (
      <Card
        key={`${s.index}-${i}`}
        label={`Picture ${i + 1}: ${sceneLabel(item.scenes[sceneIndex])}`}
        width={cardWidth}
        state={s.solved ? (i === answer ? "right" : "faded") : isWrong ? "wrong" : "idle"}
        disabled={s.solved || isWrong || !active}
        onPress={() => pick(i)}
      >
        <Scene scene={item.scenes[sceneIndex]} width={cardWidth - 10} height={pictureHeight} />
      </Card>
    );
  });
  const grid =
    across === 3 ? (
      <View style={{ flexDirection: "row", gap: 10 }}>{cards}</View>
    ) : (
      <View style={{ gap: 10, alignItems: "center" }}>
        <View style={{ flexDirection: "row", gap: 10 }}>{cards.slice(0, 2)}</View>
        {cards[2]}
      </View>
    );

  return (
    <View style={{ gap: small ? 8 : 12, alignItems: "center" }}>
      {session.options.mode === "versus" && (
        <Copy style={{ color: C.teal, fontWeight: "800", fontSize: 22, textAlign: "center" }}>{reader} reads</Copy>
      )}
      <Copy style={{ fontSize: 13, color: C.muted }}>{s.index + 1} of 8</Copy>
      <ReadingText
        text={item.text}
        highlight={highlight}
        onWord={(_, word) => {
          if (active && soundOn) {
            if (!s.solved) { update(whichHelp(s)); assistance?.(); }
            sound(wordAudio(word));
          }
        }}
      />
      <Copy style={{ fontSize: 18, fontWeight: "700", textAlign: "center", color: C.ink }}>
        {s.solved ? "Yes! That’s the one." : s.wrong !== null ? "Look at the glowing word." : "Read it. Which picture matches?"}
      </Copy>
      {!s.solved && (
        <Button compact quiet icon="sound-on" disabled={!soundOn || !active}
          onPress={() => { update(whichHelp(s)); assistance?.(); sound(`which-one-sentence-${item.id}`); }}>
          Hear it
        </Button>
      )}
      {!s.solved && <Copy style={{ fontSize: 14, textAlign: "center" }}>Read it yourself, or ask to hear it. Help counts.</Copy>}
      <CoachSpot active={coach.active && !s.tried && !s.solved} handAt="none">
        {grid}
      </CoachSpot>
    </View>
  );
}
export function Art({ size }: { size: number }) {
  return <PictureObject name="cat" size={size} />;
}
