import React, { useEffect, useState } from "react";
import { Animated, View } from "react-native";
import Svg, { Circle, Ellipse, G, Path, Rect, Text as SvgText } from "react-native-svg";
import { Button, C, Copy, IconButton, PressableScale } from "../../../components/ui";
import { easeInOut, nativeDriver, useReducedMotion } from "../../../components/motion";
import type { BoardProps } from "../../types";
import { CoachSpot } from "../../Coach";
import { CreatureArt } from "../tide-pool/view";
import {
  commands,
  currentLevel,
  run,
  solved,
  solve,
  tick,
  trail,
  type Command,
  type CrabState,
  type Level,
  type Trail,
  type Walker,
} from "./engine";
export const cardLabel: Record<Command, string> = {
  up: "Up",
  right: "Right",
  down: "Down",
  left: "Left",
  forward: "Walk",
  "turn-left": "Turn left",
  "turn-right": "Turn right",
  repeat: "Again ×2",
};
export function ArrowArt({ command, size = 26, color = C.ink }: { command: Command; size?: number; color?: string }) {
  const turn = command.startsWith("turn"),
    repeat = command === "repeat";
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" accessible accessibilityLabel={cardLabel[command]}>
      <G rotation={command === "right" ? 90 : command === "down" ? 180 : command === "left" ? 270 : 0} origin="20,20">
        {repeat ? (
          <G>
            <Path d="M8 22A12 12 0 1 1 20 32" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" />
            <Path
              d="M2 16L8 24L14 16"
              fill="none"
              stroke={color}
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <SvgText x="21" y="25" textAnchor="middle" fontSize="11" fontWeight="700" fill={color}>
              ×2
            </SvgText>
          </G>
        ) : (
          <Path
            d={
              turn
                ? command === "turn-left"
                  ? "M28 35V20Q28 10 16 10H7M15 2L7 10L15 18"
                  : "M12 35V20Q12 10 24 10H33M25 2L33 10L25 18"
                : "M20 35V7M8 19L20 7L32 19"
            }
            fill="none"
            stroke={color}
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {command === "forward" && (
          <G fill={color} opacity={0.55}>
            <Ellipse cx="12" cy="30" rx="2.5" ry="3.5" />
            <Ellipse cx="28" cy="24" rx="2.5" ry="3.5" />
          </G>
        )}
      </G>
    </Svg>
  );
}
/** A real-looking scallop seashell: a ridged fan with a little hinge. */
function Seashell({ x, y }: { x: number; y: number }) {
  return (
    <G transform={`translate(${x} ${y})`}>
      <Path
        d="M25 41L9 21Q8 9 25 8Q42 9 41 21Z"
        fill="#F4C3A8"
        stroke="#B5694E"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <Path d="M25 40V10M25 40L16 12M25 40L34 12M25 40L11 19M25 40L39 19" stroke="#C97B5E" strokeWidth="1.6" />
      <Path d="M20 41H30L28 45H22Z" fill="#E29F84" stroke="#B5694E" strokeWidth="1.5" />
    </G>
  );
}
/** The crab's little house: a rock with a round door. */
function CrabHouse({ x, y }: { x: number; y: number }) {
  return (
    <G transform={`translate(${x} ${y})`}>
      <Path d="M4 44Q3 14 25 8Q47 14 46 44Z" fill="#A89584" stroke="#6F5F52" strokeWidth="2" />
      <Path d="M15 44V33Q15 23 25 23Q35 23 35 33V44Z" fill="#4D3B31" />
      <Circle cx="18" cy="16" r="3" fill="#C9B8A7" />
      <Path d="M36 13Q41 4 45 9" stroke="#3F8A6E" strokeWidth="3" fill="none" strokeLinecap="round" />
    </G>
  );
}
function Footprint({ x, y, facing }: { x: number; y: number; facing: number }) {
  return (
    <G transform={`translate(${x + 25} ${y + 25}) rotate(${facing * 90})`} opacity={0.85}>
      <Ellipse cx="-7" cy="6" rx="4" ry="5.5" fill="#8A6A4C" />
      <Ellipse cx="7" cy="-6" rx="4" ry="5.5" fill="#8A6A4C" />
      <Circle cx="-9" cy="-1" r="1.6" fill="#8A6A4C" />
      <Circle cx="-5" cy="-1.5" r="1.6" fill="#8A6A4C" />
      <Circle cx="5" cy="-13.5" r="1.6" fill="#8A6A4C" />
      <Circle cx="9" cy="-13" r="1.6" fill="#8A6A4C" />
    </G>
  );
}
export function Beach({
  level,
  walker,
  size,
  plan,
  showBump,
  facingHint,
  wobble,
}: {
  level: Level;
  walker: Walker;
  size: number;
  plan?: Trail;
  showBump?: boolean;
  facingHint?: boolean;
  wobble?: number;
}) {
  const reduced = useReducedMotion();
  const cellPx = size / 5;
  const [pos] = useState(
    () => new Animated.ValueXY({ x: (walker.pos % 5) * cellPx, y: Math.floor(walker.pos / 5) * cellPx })
  );
  const [shake] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const to = { x: (walker.pos % 5) * cellPx, y: Math.floor(walker.pos / 5) * cellPx };
    if (reduced) {
      pos.setValue(to);
      return;
    }
    const a = Animated.timing(pos, { toValue: to, duration: 360, easing: easeInOut, useNativeDriver: nativeDriver });
    a.start();
    return () => a.stop();
  }, [walker.pos, cellPx, reduced, pos]);
  useEffect(() => {
    if (!wobble || reduced) return;
    shake.setValue(0);
    const a = Animated.sequence(
      [1, -1, 1, -1, 0].map((v) => Animated.timing(shake, { toValue: v, duration: 80, useNativeDriver: nativeDriver }))
    );
    a.start();
    return () => a.stop();
  }, [wobble, reduced, shake]);
  let shell = 0;
  const cells = level.rows.join("").split("");
  const start = { pos: cells.indexOf("C") };
  const bumpAt = plan && plan.bumpCard !== null && showBump ? plan : null;
  return (
    <View style={{ width: size, height: size, alignSelf: "center" }}>
      <Svg
        width={size}
        height={size}
        viewBox="0 0 250 250"
        accessible
        accessibilityLabel={`Beach. The crab is in row ${Math.floor(walker.pos / 5) + 1}, column ${(walker.pos % 5) + 1}.${
          plan ? ` Your plan walks ${plan.steps.length} squares.` : ""
        }${bumpAt ? " The plan bumps into something." : ""}${walker.bump ? " The crab bumped." : ""}`}
      >
        <Rect x="0" y="0" width="250" height="250" rx="16" fill="#F6E3B9" />
        {cells.map((c, i) => {
          const x = (i % 5) * 50,
            y = Math.floor(i / 5) * 50;
          return (
            <Rect
              key={`g${i}`}
              x={x + 2}
              y={y + 2}
              width="46"
              height="46"
              rx="9"
              fill={(i + Math.floor(i / 5)) % 2 ? "#F9EBCB" : "#F3DDAE"}
            />
          );
        })}
        {plan && plan.steps.length > 0 && (
          <Path
            d={[start.pos, ...plan.steps.map((st) => st.pos)]
              .map((q, i) => `${i ? "L" : "M"}${(q % 5) * 50 + 25} ${Math.floor(q / 5) * 50 + 25}`)
              .join("")}
            fill="none"
            stroke="#8A6A4C"
            strokeOpacity={0.45}
            strokeWidth="5"
            strokeDasharray="1 9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {cells.map((c, i) => {
          const x = (i % 5) * 50,
            y = Math.floor(i / 5) * 50,
            gone = c === "S" && !!(walker.shells & (1 << shell++));
          return c === "#" ? (
            <G key={i}>
              <Rect x={x + 2} y={y + 2} width="46" height="46" rx="9" fill="#DDBB8C" />
              <Path
                d={`M${x + 8} ${y + 42}V${y + 22}H${x + 13}V${y + 12}H${x + 21}V${y + 22}H${x + 29}V${y + 12}H${x + 37}V${y + 22}H${x + 42}V${y + 42}Z`}
                fill="#A9845F"
              />
              <Path
                d={`M${x + 22} ${y + 42}V${y + 33}Q${x + 25} ${y + 29} ${x + 28} ${y + 33}V${y + 42}Z`}
                fill="#7E6146"
              />
            </G>
          ) : c === "S" && !gone ? (
            <Seashell key={i} x={x} y={y} />
          ) : c === "H" ? (
            <CrabHouse key={i} x={x} y={y} />
          ) : null;
        })}
        {plan?.steps.map((st, i) =>
          cells[st.pos] === "." || cells[st.pos] === "C" ? (
            <Footprint key={`f${i}`} x={(st.pos % 5) * 50} y={Math.floor(st.pos / 5) * 50} facing={st.facing} />
          ) : (
            <Rect
              key={`f${i}`}
              x={(st.pos % 5) * 50 + 3}
              y={Math.floor(st.pos / 5) * 50 + 3}
              width="44"
              height="44"
              rx="9"
              fill="none"
              stroke={C.teal}
              strokeWidth="3"
              strokeDasharray="5 4"
            />
          )
        )}
        {bumpAt && (
          <G
            transform={`translate(${(bumpAt.bumpPos % 5) * 50 + 25 + [0, 15, 0, -15][bumpAt.bumpFacing]} ${
              Math.floor(bumpAt.bumpPos / 5) * 50 + 25 + [-15, 0, 15, 0][bumpAt.bumpFacing]
            })`}
          >
            <Path
              d="M0 -12L3 -4L11 -6L6 1L12 7L3 6L0 13L-3 6L-12 7L-6 1L-11 -6L-3 -4Z"
              fill="#E4573D"
              stroke="#FFF"
              strokeWidth="1.5"
            />
          </G>
        )}
      </Svg>
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: cellPx,
          height: cellPx,
          alignItems: "center",
          justifyContent: "center",
          transform: [
            { translateX: pos.x },
            { translateY: pos.y },
            { rotate: shake.interpolate({ inputRange: [-1, 1], outputRange: ["-14deg", "14deg"] }) },
          ],
        }}
      >
        <CreatureArt kind="crab" size={cellPx - 6} />
        {facingHint && (
          <View
            style={{
              position: "absolute",
              width: 0,
              height: 0,
              borderLeftWidth: 7,
              borderRightWidth: 7,
              borderBottomWidth: 10,
              borderLeftColor: "transparent",
              borderRightColor: "transparent",
              borderBottomColor: C.teal,
              transform: [{ rotate: `${walker.facing * 90}deg` }, { translateY: -cellPx / 2 - 2 }],
            }}
          />
        )}
      </Animated.View>
    </View>
  );
}
export function Board({
  session,
  update,
  practice,
  assistance,
  sound,
  width,
  height,
  active,
  coach,
  cheer,
}: BoardProps<CrabState>) {
  const s = session.state,
    l = currentLevel(s),
    w = run(l, s.program.slice(0, s.cursor)),
    done = s.completed.length === 3,
    won = !done && solved(l, w),
    reduced = useReducedMotion(),
    [hint, setHint] = useState(false),
    [wobble, setWobble] = useState(0),
    [flash] = useState(() => new Animated.Value(0));
  const plan = trail(l, s.program);
  const together = session.options.mode === "together";
  const seat = ((s.starter + s.cards) % 2) as 0 | 1;
  const name = session.names?.[seat] || `Player ${seat + 1}`;
  useEffect(() => {
    if (!active || !s.running) return;
    const timer = setTimeout(
      () => {
        const before = run(l, s.program.slice(0, s.cursor));
        const n = tick(s),
          result = run(l, n.program.slice(0, n.cursor));
        update(n);
        if (result.bump) {
          practice("think.debug", false);
          sound("crab-commands-bump", true);
          setWobble((v) => v + 1);
        } else if (solved(l, result)) {
          practice(l.skill, true);
          if (s.debugging) practice("think.debug", true);
          cheer(s.completed.length === 2 ? "big" : "right", "crab-commands-home");
        } else if (result.shells !== before.shells) cheer();
        else sound("tap");
      },
      reduced ? 120 : 560
    );
    return () => clearTimeout(timer);
  }, [s, l, active, update, practice, sound, reduced, cheer]);
  // The bumped card blinks a few times so she can see which one to change.
  useEffect(() => {
    if (!wobble) return;
    flash.setValue(0);
    if (reduced) {
      flash.setValue(1);
      return;
    }
    const a = Animated.loop(
      Animated.sequence([
        Animated.timing(flash, { toValue: 1, duration: 220, useNativeDriver: nativeDriver }),
        Animated.timing(flash, { toValue: 0.25, duration: 220, useNativeDriver: nativeDriver }),
      ]),
      { iterations: 4 }
    );
    a.start(() => flash.setValue(1));
    return () => a.stop();
  }, [wobble, reduced, flash]);
  const edit = (program: Command[], placed = false) => {
    if (!active || s.running) return;
    update({ ...s, program, cursor: 0, cards: placed ? Math.min(1000000, s.cards + 1) : s.cards });
    setHint(false);
    setWobble(0);
  };
  const shortest = solve(l);
  const firstCard = shortest[0];
  const bumpedCard = w.bump ? s.cursor - 1 : null;
  const planBumps = plan.bumpCard !== null;
  const beachSize = Math.min(width, height < 740 ? 200 : 280);
  const prompt = done
    ? "Every crab is home!"
    : won
      ? "Home! Great plan!"
      : w.bump
        ? "Bump! Change the red card."
        : s.running
          ? "Watch the crab walk!"
          : s.cursor > 0
            ? "Almost! Add more cards."
            : "Plan the crab's path, then Go!";
  const promptKey = won ? "crab-commands-home" : w.bump ? "crab-commands-bump" : "crab-commands-plan";
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
        <Copy style={{ fontWeight: "700", color: C.ink, flex: 1, fontSize: 18 }}>{prompt}</Copy>
        <IconButton icon="sound-on" label="Hear this instruction" onPress={() => sound(promptKey)} />
      </View>
      {!done && (
        <Copy style={{ fontSize: 13, color: C.ink }}>
          Beach {s.completed.length + 1} of 3{together ? ` · ${name} adds a card` : ""}
        </Copy>
      )}
      <Beach
        level={l}
        walker={w}
        size={beachSize}
        plan={done ? undefined : plan}
        showBump={!s.running}
        facingHint={l.pace !== "easy"}
        wobble={wobble}
      />
      {!done && (
        <>
          <View
            accessibilityLabel={`Your plan: ${s.program.length ? s.program.map((c) => cardLabel[c]).join(", ") : "empty"}`}
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 5,
              minHeight: 52,
              backgroundColor: C.paper,
              padding: 4,
              borderRadius: 12,
              alignItems: "center",
            }}
          >
            {s.program.length === 0 && (
              <Copy style={{ fontSize: 14, padding: 6, color: C.ink }}>Your plan: tap arrows below</Copy>
            )}
            {s.program.map((c, i) => {
              const bad = i === bumpedCard || (!s.running && s.cursor === 0 && planBumps && plan.bumpCard === i);
              const runningCard = s.running && s.cursor === i;
              return (
                <PressableScale
                  key={i}
                  accessibilityRole="button"
                  accessibilityLabel={`Card ${i + 1}: ${cardLabel[c]}${bad ? ", this card bumps" : ""}. Tap to take it out`}
                  disabled={s.running}
                  onPress={() => edit(s.program.filter((_, j) => j !== i))}
                  style={{ width: 44, height: 44 }}
                >
                  <Animated.View
                    style={{
                      flex: 1,
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 9,
                      borderWidth: 3,
                      borderColor: bad ? "#E4573D" : runningCard ? C.teal : C.line,
                      backgroundColor: bad ? "#FCE1D8" : runningCard ? C.soft : C.cream,
                      opacity: i === bumpedCard ? flash.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }) : 1,
                    }}
                  >
                    <ArrowArt command={c} size={24} color={bad ? "#B2381F" : C.ink} />
                  </Animated.View>
                </PressableScale>
              );
            })}
          </View>
          {won ? (
            <Button
              onPress={() => {
                setHint(false);
                update({
                  ...s,
                  completed: [...s.completed, s.program.slice(0, s.cursor)],
                  program: [],
                  cursor: 0,
                  running: false,
                  debugging: false,
                });
              }}
            >
              {s.completed.length === 2 ? "Finish!" : "Next beach"}
            </Button>
          ) : (
            <>
              {commands(l.pace).includes("repeat") && <Copy>Again ×2: → + [→ →] = one move + two more, three total.</Copy>}
              <View style={{ flexDirection: "row", gap: 6 }}>
                {commands(l.pace).map((c) => {
                  const card = (
                    <PressableScale
                      accessibilityRole="button"
                      accessibilityLabel={`Add ${cardLabel[c]} card`}
                      disabled={s.running || s.program.length >= 80}
                      onPress={() => {
                        sound(`crab-commands-card-${c}`, true);
                        edit([...s.program, c], true);
                        if (coach.active) coach.done();
                      }}
                      style={{
                        minHeight: 66,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: C.paper,
                        borderRadius: 14,
                        borderWidth: 2,
                        borderColor: "#E7C9B9",
                        opacity: s.running ? 0.5 : 1,
                      }}
                    >
                      <ArrowArt command={c} size={34} />
                      <Copy style={{ fontSize: 12, color: C.ink, fontWeight: "700" }}>{cardLabel[c]}</Copy>
                    </PressableScale>
                  );
                  return (
                    <View key={c} style={{ flex: 1 }}>
                      {c === firstCard && s.program.length === 0 ? (
                        <CoachSpot active={coach.active} handAt="bottom-right">
                          {card}
                        </CoachSpot>
                      ) : (
                        card
                      )}
                    </View>
                  );
                })}
              </View>
              <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                <Button
                  icon="right"
                  disabled={s.running || s.program.length === 0 || !active}
                  style={{ flex: 1 }}
                  onPress={() => {
                    setWobble(0);
                    practice("think.sequence", solved(l, run(l, s.program)));
                    if (s.program.includes("repeat")) practice("think.loops", solved(l, run(l, s.program)));
                    update({ ...s, cursor: 0, running: true });
                  }}
                >
                  Go!
                </Button>
                <Button compact quiet disabled={s.running || s.program.length === 0} onPress={() => edit([])}>
                  Clear
                </Button>
                <Button
                  compact
                  quiet
                  disabled={s.running}
                  onPress={() => {
                    if (!hint) assistance?.();
                    setHint(!hint);
                    if (!hint) sound("crab-commands-hint");
                  }}
                >
                  Hint
                </Button>
              </View>
              {hint && (
                <View style={{ gap: 4 }}>
                  <Copy style={{ fontSize: 13, color: C.ink }}>One plan that works:</Copy>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
                    {shortest.map((c, i) => (
                      <PressableScale
                        key={i}
                        accessibilityRole="button"
                        accessibilityLabel={`Hint card ${i + 1}: ${cardLabel[c]}`}
                        onPress={() => sound(`crab-commands-card-${c}`)}
                        style={{
                          minWidth: 44,
                          minHeight: 44,
                          backgroundColor: C.paper,
                          borderRadius: 8,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <ArrowArt command={c} size={22} />
                      </PressableScale>
                    ))}
                  </View>
                </View>
              )}
            </>
          )}
        </>
      )}
    </View>
  );
}
export function Art({ size }: { size: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <CreatureArt kind="crab" size={size * 0.8} />
    </View>
  );
}
