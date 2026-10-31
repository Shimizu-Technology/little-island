import React, { useLayoutEffect, useRef } from "react";
import { View } from "react-native";
import { Text } from "../../../components/Text";
import { Button, C, Copy } from "../../../components/ui";
import { HopVisual, ShellVisual } from "../../../math/MathVisual";
import { mathAnswer, mathEquation, mathSkill, mathSpeechKey } from "../../../math/questions";
import { CoachSpot } from "../../Coach";
import { AnswerTile } from "../../AnswerTile";
import type { BoardProps } from "../../types";
import { mathConfig, mathMove, questionOf, type MathAction, type MathGame, type MathRound } from "./round";

/** Shared controls keep retries, assistance and completion accounting identical. */
export function MathBoard(props: BoardProps<MathRound> & { game: MathGame }) {
  const { session, game, active, update, practice, notePractice, stopSound, sound, soundOn, cheer, coach, width } = props;
  const s = session.state, q = questionOf(s), config = mathConfig(session.options, game);
  // Advance the local guard before any external callback. A rapid second tap cannot
  // complete the same question twice, even before the saved props come back.
  const live = useRef(s);
  const context = useRef({ active, id: session.id });
  useLayoutEffect(() => {
    live.current = s;
    context.current = { active, id: session.id };
    return () => { context.current.active = false; };
  }, [s, active, session.id]);
  useLayoutEffect(() => {
    if (!active || !soundOn) stopSound();
    return () => stopSound();
  }, [active, soundOn, session.id, stopSound]);
  function move(action: MathAction) {
    if (!context.current.active || context.current.id !== session.id || live.current !== s) return;
    const next = mathMove(s, game, action);
    if (next === s) return;
    live.current = next;
    stopSound();
    coach.done();
    if (next.helped) props.assistance?.();
    update(next);
    if (next.solved && !s.solved) {
      const skill = mathSkill(q, config.limit);
      practice(skill, !next.helped);
      notePractice?.(skill, next.helped);
      cheer("right");
    }
  }
  if (s.index === s.questions.length) return <Copy style={{ color: C.ink, textAlign: "center" }}>All {s.questions.length} questions explored. Play again whenever you like.</Copy>;
  const quick = game === "quick-practice", ready = quick || s.steps === q.b;
  const reveal = s.solved || s.shown;
  const instruction = quick ? q.blank === "second" ? "Which number goes in the middle?" : "Which number fills the gap?"
    : !ready ? q.operation === "add" ? game === "shell-math" ? `Join ${q.b} shells.` : `Make ${q.b} hops forward.`
      : game === "shell-math" ? `Take away ${q.b} shells.` : `Make ${q.b} hops back.`
    : game === "shell-math" ? "How many shells are there now?" : "Where did you land?";
  return <View style={{ gap: 10, alignSelf: "center", width: "100%", maxWidth: 700 }}>
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
      <Copy style={{ fontSize: 14, color: C.ink }}>Question {s.index + 1} of {s.questions.length}</Copy>
      <Button compact quiet icon="sound-on" disabled={!active || !soundOn} onPress={() => {
        if (context.current.active && context.current.id === session.id && live.current === s) { stopSound(); sound(mathSpeechKey(q)); }
      }}>Hear</Button>
    </View>
    <Text accessibilityRole="header" style={{ color: C.ink, fontSize: 18, fontWeight: "700", textAlign: "center" }}>{instruction}</Text>
    <Text accessibilityLabel={mathEquation(q, reveal)} style={{ fontSize: width < 350 ? 34 : 42, fontWeight: "900", color: C.ink, textAlign: "center" }}>{mathEquation(q, reveal)}</Text>
    {!quick && (game === "number-hop"
      ? <HopVisual question={q} steps={s.steps} limit={config.limit} width={width} />
      : <ShellVisual question={q} steps={s.steps} width={width} />)}
    {quick && reveal && <ShellVisual question={q} steps={q.b} width={width} />}
    {!quick && !ready && <CoachSpot active={coach.active && active}>
      <Button disabled={!active} onPress={() => move({ type: "step" })} style={{ minHeight: 60 }}>
        {game === "shell-math" ? q.operation === "add" ? "Join one shell" : "Take away one shell" : q.operation === "add" ? "Hop forward one →" : "← Hop back one"}
      </Button>
    </CoachSpot>}
    {ready && !s.solved && <CoachSpot active={coach.active && active} handAt="none">
      <View style={{ flexDirection: "row", gap: 10 }}>
        {q.choices.map(answer => <AnswerTile key={answer} label={`Choose ${answer}`} disabled={!active} wrong={s.wrong === answer} correct={s.solved && answer === mathAnswer(q)} onPress={() => move({ type: "answer", answer })} style={{ flex: 1, minHeight: 64 }}>
          <Text style={{ fontSize: 32, fontWeight: "900", color: C.ink }}>{answer}</Text>
        </AnswerTile>)}
      </View>
    </CoachSpot>}
    <View accessibilityLiveRegion="polite">
      {s.solved ? <Copy style={{ color: C.ink, textAlign: "center", fontWeight: "700" }}>{s.helped ? "We worked it out together." : "You worked it out!"} {mathEquation(q, true)}</Copy>
        : s.wrong !== null ? <Copy style={{ color: C.ink, textAlign: "center" }}>Let’s look again. You can try another number or tap Show me.</Copy>
          : s.shown ? <Copy style={{ color: C.ink, textAlign: "center" }}>Follow the picture, then tap the number that fills the gap.</Copy> : null}
    </View>
    {s.solved ? <Button disabled={!active} onPress={() => move({ type: "next" })}>{s.index === s.questions.length - 1 ? "Finish round" : "Next question"}</Button>
      : <Button quiet compact icon="help" disabled={!active || s.shown} onPress={() => move({ type: "show" })}>{s.shown ? "Picture shown" : "Show me"}</Button>}
  </View>;
}
