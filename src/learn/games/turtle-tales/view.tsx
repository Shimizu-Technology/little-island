import React, { useEffect, useState } from "react";
import { Animated, View } from "react-native";
import Svg, { Ellipse, Path } from "react-native-svg";
import { Button, C, Copy, Heading, PressableScale } from "../../../components/ui";
import { easeOut, nativeDriver, useReducedMotion } from "../../../components/motion";
import type { BoardProps } from "../../types";
import { CoachSpot } from "../../Coach";
import { PictureObject, Scene } from "../../art/Objects";
import { ReadingText } from "../../kit/ReadingText";
import { sceneLabel, wordAudio } from "../../kit/reading";
import {
  isLegacyTale,
  tale,
  taleDone,
  taleFromLegacy,
  taleHear,
  talePick,
  taleReader,
  taleTurnPage,
  type LegacyTaleState,
  type TaleState,
} from "./engine";

/** The turtle swims from stone to stone, one page at a time, toward the island. */
function Swim({ page, pages, width }: { page: number; pages: number; width: number }) {
  const reduced = useReducedMotion();
  const w = Math.min(width, 380),
    step = (w - 70) / pages;
  const [x] = useState(() => new Animated.Value(page * step));
  useEffect(() => {
    if (reduced) x.setValue(page * step);
    else
      Animated.timing(x, {
        toValue: page * step,
        duration: 800,
        easing: easeOut,
        useNativeDriver: nativeDriver,
      }).start();
  }, [page, step, reduced, x]);
  return (
    <View
      accessible
      accessibilityLabel={`Page ${Math.min(page + 1, pages)} of ${pages}`}
      style={{ width: w, height: 44 }}
    >
      <Svg width={w} height={44} viewBox={`0 0 ${w} 44`} style={{ position: "absolute" }}>
        <Path d={`M0 34 L${w} 34`} stroke="#A9D3DC" strokeWidth={10} strokeLinecap="round" />
        {Array.from({ length: pages }, (_, i) => (
          <Ellipse
            key={i}
            cx={20 + i * step}
            cy={34}
            rx={9}
            ry={5}
            fill={i < page ? "#79AB80" : "#C6D3C5"}
            stroke="#183F39"
            strokeWidth={1.5}
          />
        ))}
        <Ellipse cx={w - 26} cy={34} rx={24} ry={8} fill="#E6D3AC" stroke="#183F39" strokeWidth={2} />
        <Path
          d={`M${w - 24} 30 L${w - 24} 8 M${w - 24} 8 Q${w - 42} 2 ${w - 38} 14 M${w - 24} 8 Q${w - 8} 1 ${w - 8} 14`}
          stroke={C.teal}
          fill="none"
          strokeWidth={3}
          strokeLinecap="round"
        />
      </Svg>
      <Animated.View style={{ position: "absolute", left: 2, top: 2, transform: [{ translateX: x }] }}>
        <PictureObject name="turtle" size={36} />
      </Animated.View>
    </View>
  );
}

/** A picture card that wiggles when it is the wrong one. */
function Choice({
  children,
  label,
  state,
  width,
  disabled,
  onPress,
}: {
  children: React.ReactNode;
  label: string;
  state: "idle" | "wrong" | "right";
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
        accessibilityState={{ disabled, selected: state === "right" }}
        disabled={disabled}
        onPress={onPress}
        style={{
          width,
          borderRadius: 18,
          borderWidth: state === "idle" ? 2 : 5,
          borderColor: state === "wrong" ? C.coral : state === "right" ? C.teal : C.line,
          backgroundColor: C.paper,
          alignItems: "center",
          overflow: "hidden",
          padding: 3,
          opacity: state === "wrong" ? 0.45 : 1,
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

export function Board(props: BoardProps<TaleState | LegacyTaleState>) {
  const { session, update } = props;
  const s = session.state;
  const legacy = isLegacyTale(s) ? s : null;
  // A round saved by the older Turtle Tales carries over to the same tale and page.
  useEffect(() => {
    if (legacy) update(taleFromLegacy(legacy));
  }, [legacy, update]);
  if (legacy) return null;
  return <Read {...props} session={{ ...session, state: s as TaleState }} />;
}

function Read({
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
}: BoardProps<TaleState | LegacyTaleState> & { session: { state: TaleState } }) {
  const s = session.state,
    t = tale(s),
    small = height < 730;
  const done = taleDone(s);

  // After a right pick, the turtle swims and the page turns by itself.
  useEffect(() => {
    if (!s.solved || !active) return;
    const timer = setTimeout(() => update(taleTurnPage(s)), 1500);
    return () => clearTimeout(timer);
  }, [s, active, update]);

  if (done)
    return (
      <View style={{ alignItems: "center", gap: 12, padding: 12 }}>
        <Swim page={t.pages.length} pages={t.pages.length} width={width} />
        <PictureObject name="turtle" size={100} />
        <Heading style={{ textAlign: "center" }}>You read “{t.title}”!</Heading>
        <Copy style={{ color: C.ink, textAlign: "center" }}>The turtle swam all the way home.</Copy>
      </View>
    );

  const page = t.pages[s.page];
  const scenes = s.sides[s.page] === 0 ? [page.scene, page.miss] : [page.miss, page.scene];
  const cardWidth = Math.min(260, (Math.min(width, 560) - 12) / 2),
    pictureHeight = Math.round(cardWidth * (small ? 0.62 : 0.74));
  const reader = session.names?.[taleReader(s)] ?? `Player ${taleReader(s) + 1}`;

  function pick(side: number) {
    if (!active) return;
    const next = talePick(s, side);
    if (next === s) return;
    if (coach.active) coach.done();
    // Only a first pick on her own counts as practice.
    if (!s.wrong && !s.heard) {
      practice("read.meaning", next.solved);
      practice(t.skill, next.solved);
    }
    if (next.solved) cheer(s.page === t.pages.length - 1 ? "big" : "right");
    else sound("turtle-tales-look", true);
    update(next);
  }

  const cards = (
    <View style={{ flexDirection: "row", gap: 10, justifyContent: "center" }}>
      {scenes.map((scene, side) => {
        const right = side === s.sides[s.page];
        return (
          <Choice
            key={`${s.page}-${side}`}
            label={`Picture ${side + 1}: ${sceneLabel(scene)}`}
            width={cardWidth}
            state={s.solved && right ? "right" : s.wrong && !right ? "wrong" : "idle"}
            disabled={s.solved || (s.wrong && !right) || !active}
            onPress={() => pick(side)}
          >
            <Scene scene={scene} width={cardWidth - 10} height={pictureHeight} />
          </Choice>
        );
      })}
    </View>
  );

  return (
    <View style={{ alignItems: "center", gap: small ? 6 : 10 }}>
      {session.options.mode === "together" && (
        <Copy style={{ color: C.teal, fontWeight: "800", fontSize: 22, textAlign: "center" }}>{reader} reads</Copy>
      )}
      <Swim page={s.page + (s.solved ? 1 : 0)} pages={t.pages.length} width={width} />
      <Copy style={{ fontSize: 14, color: C.ink, textAlign: "center" }}>{t.title}</Copy>
      <ReadingText
        text={page.text}
        compact={small}
        highlight={s.wrong && !s.solved ? page.cue : undefined}
        onWord={(_, w) => { if (active) { assistance?.(); sound(wordAudio(w)); } }}
      />
      <Copy style={{ color: C.ink, fontSize: 18, fontWeight: "700", textAlign: "center" }}>
        {s.solved ? "Yes! That’s the one." : s.wrong ? "Look at the glowing word." : "Read it. Which picture matches?"}
      </Copy>
      <CoachSpot active={coach.active && !s.solved && !s.wrong} handAt="none">
        {cards}
      </CoachSpot>
      {s.wrong && !s.solved && (
        <Button
          compact
          quiet
          icon="sound-on"
          disabled={!soundOn}
          onPress={() => {
            if (!active) return;
            if (!s.heard) update(taleHear(s));
            assistance?.();
            sound(`turtle-tales-${t.id}-page-${s.page}`);
          }}
        >
          Read it to me
        </Button>
      )}
    </View>
  );
}

export function Art({ size }: { size: number }) {
  return <PictureObject name="turtle" size={size} />;
}
