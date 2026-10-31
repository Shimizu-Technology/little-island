import React, { useEffect, useRef } from "react";
import { View } from "react-native";
import { Button, C, Chip, Copy, Heading, styles } from "../../components/ui";
import type { BoardProps } from "../types";
import { growthDraft, growthMove, growthProgress, growthQuestions } from "./engine";
import type { GrowthAction, GrowthState } from "./types";
import { CoachSpot } from "../Coach";
import { AnswerTile } from "../AnswerTile";
import { NumbersVisual } from "./NumbersVisual";
import { LiteracyVisual } from "./LiteracyVisual";
import { DiscoveryVisual } from "./DiscoveryVisual";

export const growthSpeechKey = (game: string, stage: string, id: string, part: "prompt" | "explanation") => `growth-${game}-${stage}-${id}-${part}`;
export function GrowthBoard({ session, update, active, width, sound, stopSound, soundOn, cheer, coach }: BoardProps<unknown>) {
  const state = session.state as GrowthState, questions = growthQuestions(session.game, session.options, state), progress = growthProgress(state, questions);
  const q = questions[progress.index];
  const draft = state.draft ?? [];
  const setDraft = (next: number[]) => { if (active) update(growthDraft(state, next, questions)); };
  const spoken = useRef<string | null>(null);
  useEffect(() => {
    if (!q || !active || !soundOn || spoken.current === q.id) return;
    spoken.current = q.id;
    // Marked automatic: tap-to-hear mode keeps this silent.
    sound(growthSpeechKey(session.game, session.options.stage!, q.id, "prompt"), true);
  }, [q, active, soundOn, session.game, session.options.stage, sound]);
  if (!q) return <Copy style={{ textAlign: "center" }}>Your ideas are explored and your practice is saved.</Copy>;
  function move(action: GrowthAction) {
    if (!active) return;
    const next = growthMove(state, action, questions);
    if (next === state) return;
    if (coach.active) coach.done();
    const after = growthProgress(next, questions);
    stopSound();
    update(next);
    if (!progress.solved && after.solved) cheer("right");
    if (action.type === "help") sound(growthSpeechKey(session.game, session.options.stage!, q.id, "explanation"));

  }
  const Visual = ["reef-race", "island-market", "shell-math", "number-hop", "quick-practice"].includes(session.game) ? NumbersVisual : ["sound-boat", "which-one", "turtle-tales", "hafa-adai"].includes(session.game) ? LiteracyVisual : DiscoveryVisual;
  const value = draft.map(i => q.tiles![i]).join("|");
  return <View style={{ gap: 14, width: "100%", maxWidth: 720, alignSelf: "center" }}>
    <Copy style={{ color: C.teal, fontWeight: "700" }}>Idea {progress.index + 1} of {questions.length} · {q.skillLabel}</Copy>
    {session.options.mode !== "solo" && <Copy style={{ fontWeight: "800" }}>{session.names?.[(state.starter + progress.index) % 2] ?? `Player ${1 + (state.starter + progress.index) % 2}`}’s turn</Copy>}
    {!!q.context && !["sound-boat", "which-one", "turtle-tales", "hafa-adai"].includes(session.game) && <Copy style={{ fontSize: 20, lineHeight: 29 }}>{q.context}</Copy>}
    <Heading style={{ fontSize: 23 }}>{q.prompt}</Heading>
    <Button quiet compact icon="sound-on" disabled={!soundOn || !active} onPress={() => sound(growthSpeechKey(session.game, session.options.stage!, q.id, "prompt"))}>Hear the question</Button>
    <Visual key={`${session.id}-${q.id}`} question={q} showHelp={progress.shown || progress.solved} width={width} disabled={!active || progress.solved} onHelp={() => move({ type: "help" })} />
    {q.tiles ? <View style={{ gap: 10 }}>
      <Copy style={{ fontSize: 23, textAlign: "center", minHeight: 38 }}>{draft.length ? draft.map(i => q.tiles![i]).join(" · ") : "Tap the pieces in order"}</Copy>
      <View style={[styles.row, { flexWrap: "wrap", justifyContent: "center" }]}>{q.tiles.map((tile, i) => <Chip key={i} selected={draft.includes(i)} onPress={() => { if (active && !progress.solved && !draft.includes(i) && draft.length < q.answer.split("|").length) setDraft([...draft, i]); }}>{tile}</Chip>)}</View>
      <View style={[styles.row, { flexWrap: "wrap", justifyContent: "center" }]}>
        <Button quiet compact disabled={!active || progress.solved || !draft.length} onPress={() => setDraft(draft.slice(0, -1))}>Undo piece</Button>
        <Button compact disabled={!active || progress.solved || draft.length !== q.answer.split("|").length} onPress={() => move({ type: "answer", value })}>Check it</Button>
      </View>
    </View> : <View style={{ gap: 10 }}>{state.orders[progress.index].map(value => {
      const choice = q.choices.find(c => c.value === value)!;
      return <AnswerTile key={value} label={choice.label} selected={progress.shown && q.answer === value} wrong={progress.wrong === value} correct={progress.solved && q.answer === value} disabled={!active || progress.solved || progress.wrong === value} onPress={() => move({ type: "answer", value })}><Copy style={{ color: C.ink, fontWeight: "900", fontSize: 19, textAlign: "center" }}>{choice.label}</Copy></AnswerTile>;
    })}</View>}
    {!!progress.wrong && !progress.solved && <View accessibilityLiveRegion="polite"><Copy>Try another idea. Show me can help.</Copy></View>}
    {(progress.shown || progress.solved) && <View accessibilityLiveRegion="polite" style={{ padding: 16, backgroundColor: C.paper, borderRadius: 16, gap: 8 }}>
      <Copy style={{ fontWeight: "800" }}>{progress.solved ? "That works!" : "Let’s work it out"}</Copy><Copy>{q.explanation}</Copy>
      <Button quiet compact icon="sound-on" disabled={!soundOn || !active} onPress={() => sound(growthSpeechKey(session.game, session.options.stage!, q.id, "explanation"))}>Hear why</Button>
    </View>}
    {progress.solved ? <Button disabled={!active} onPress={() => move({ type: "next" })}>{progress.index === questions.length - 1 ? "Finish round" : "Next idea"}</Button> : <CoachSpot active={coach.active}><Button quiet disabled={!active || progress.shown} onPress={() => move({ type: "help" })}>Show me</Button></CoachSpot>}
  </View>;
}
