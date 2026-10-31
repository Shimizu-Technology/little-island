import { LearningCompanion, useCompanionReaction } from "../islander/Companion";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AppState, Keyboard, Platform, TextInput, View } from "react-native";
import { useSoundControls } from "../components/Audio";
import { Button, C, Copy, Heading, PressableScale, styles } from "../components/ui";
import { PictureObject, Scene } from "../learn/art/Objects";
import { sceneLabel } from "../learn/kit/reading";
import { mathEquation } from "../math/questions";
import { createPracticeSession, practiceAnswer, practiceConfigKey, type PracticeAction } from "./engine";
import { PracticeMathPicture } from "./PracticePictures";
import type { PracticeSettings, PracticeSummary } from "./types";

export type PracticePanelProps = {
  settings: PracticeSettings;
  soundOn: boolean;
  active: boolean;
  onComplete: (summary: PracticeSummary) => void;
  onCancel: () => void;
};

const foreground = () => Platform.OS === "web"
  ? typeof document === "undefined" || !document.hidden
  : AppState.currentState === "active";

/** The caller owns the Sheet, saved games and launch action. A changed config retires this round. */
export function PracticePanel(props: PracticePanelProps) {
  return <PracticeRoundPanel key={practiceConfigKey(props.settings)} {...props} />;
}

function PracticeRoundPanel({ settings, soundOn, active, onComplete, onCancel }: PracticePanelProps) {
  const [session] = useState(() => createPracticeSession(settings, Math.floor(Math.random() * 0x100000000)));
  const [state, setState] = useState(session.initial);
  const companion = useCompanionReaction("practice", active);
  const [answer, setAnswer] = useState("");
  const live = useRef({ mounted: false, active, soundOn, onComplete, onCancel });
  const introduced = useRef(false);
  const { play, stop } = useSoundControls(soundOn && active && !state.gateOpen);
  useLayoutEffect(() => {
    live.current = { mounted: true, active, soundOn, onComplete, onCancel };
  }, [active, soundOn, onComplete, onCancel]);
  useLayoutEffect(() => {
    live.current.mounted = true;
    return () => { live.current.mounted = false; stop(); };
  }, [stop]);
  useLayoutEffect(() => { if (!active || !soundOn) stop(); }, [active, soundOn, stop]);
  useEffect(() => {
    if (active && soundOn && !state.gateOpen && state.status === "playing" && state.index === 0 &&
      !state.helped && !state.solved && foreground() && !introduced.current &&
      live.current.mounted && live.current.active && live.current.soundOn && session.canHear(0)) {
      introduced.current = true;
      play("practice-intro", true);
    }
  }, [active, soundOn, state.gateOpen, state.status, state.index, state.helped, state.solved, play, session]);

  function speak(key: string, automatic = false) {
    if (live.current.mounted && live.current.active && live.current.soundOn && foreground()) play(key, automatic);
  }

  function send(action: PracticeAction) {
    if (!live.current.mounted) return;
    const result = session.dispatch(action, live.current.active && foreground());
    if (!result.changed) return;
    stop();
    setState(result.state);
    if (result.summary || result.cancelled) {
      Keyboard.dismiss();
      if (result.summary) live.current.onComplete(result.summary);
      else live.current.onCancel();
    }
    return result.state;
  }

  const q = state.questions[state.index];
  const right = practiceAnswer(q);
  const disabled = !active || state.status !== "playing";
  function choose(choice: number) {
    const next = send({ type: "choose", question: state.index, choice });
    if (!next) return;
    if (!next.solved) speak("practice-try", true);
    else if (next.results.length === 3) speak("practice-done", true);
  }
  function show() {
    const next = send({ type: "show", question: state.index });
    if (next) speak(q.kind === "math" ? "practice-show" : q.kind === "growth" ? q.speech.replace(/-prompt$/, "-explanation") : q.speech);
  }
  function closeGate() {
    send({ type: "gate-close" });
    setAnswer("");
    Keyboard.dismiss();
  }

  return <LearningCompanion event={state.solved ? (state.results.length === 3 ? "complete" : "correct") : state.wrong !== null ? "incorrect" : companion.event} desk active={active}><View style={{ width: "100%", maxWidth: 500, alignSelf: "center", gap: 12 }}>
    {/* Keep exit before the keyboard field as well as the caller's pinned Sheet close control. */}
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
      <Copy style={{ color: C.ink, flexShrink: 1 }}>{state.results.length} of 3 complete</Copy>
      <Button quiet compact onPress={() => send({ type: "cancel" })}>Cancel</Button>
    </View>
    {state.gateOpen ? <>
      <Heading style={{ fontSize: 22 }}>For a grown-up</Heading>
      <Copy>To skip practice this time, type the answer.</Copy>
      <Heading style={{ fontSize: 26 }}>{state.gate.a} × {state.gate.b} = ?</Heading>
      <TextInput
        accessibilityLabel={`Grown-up answer: ${state.gate.a} times ${state.gate.b}`}
        value={answer}
        onChangeText={text => setAnswer(text.replace(/[^0-9]/g, "").slice(0, 3))}
        keyboardType="number-pad" returnKeyType="done" autoComplete="off" textContentType="none"
        maxLength={3} editable={!disabled}
        onSubmitEditing={() => send({ type: "bypass", answer })}
        style={styles.input}
      />
      {state.gateError && <Copy style={{ color: C.error }}>That’s not it. A grown-up can try again.</Copy>}
      <Button disabled={disabled || !answer} onPress={() => send({ type: "bypass", answer })}>Skip practice and play</Button>
      <Button quiet onPress={closeGate}>Back to practice</Button>
    </> : <>
      <Copy style={{ color: C.ink, fontSize: 14, lineHeight: 20 }}>Three little questions, then your game. You can ask for help.</Copy>
      <Heading style={{ fontSize: 22 }}>{q.kind === "math" ? "Tap the missing number" : q.kind === "growth" ? q.task.prompt : "Read it. Tap the matching picture."}</Heading>
      {q.kind === "growth" ? <>
        {!!q.task.context && <Copy style={{ fontSize: 20, lineHeight: 29 }}>{q.task.context}</Copy>}
        <View style={{ gap: 8 }}>{q.choices.map((value, i) => <Button key={value} quiet selected={(state.shown || state.solved) && i === right} disabled={disabled || state.solved} onPress={() => choose(i)}>{q.task.choices.find(c => c.value === value)!.label}</Button>)}</View>
        {(state.shown || state.solved) && <Copy>{q.task.explanation}</Copy>}
      </> : q.kind === "math" ? <>
        <Heading style={{ fontSize: 32, textAlign: "center" }}>{mathEquation(q.question, state.shown || state.solved)}</Heading>
        {state.helped && <PracticeMathPicture question={q.question} />}
        <View style={{ flexDirection: "row", gap: 8 }}>
          {q.question.choices.map((number, i) => <Button key={`${state.index}-${i}`} quiet
            selected={(state.shown || state.solved) && i === right}
            disabled={disabled || state.solved}
            label={`${number}${state.shown && i === right ? ", this is the missing number" : ""}`}
            style={{ flex: 1, minHeight: 58, paddingHorizontal: 4 }} onPress={() => choose(i)}>{number}</Button>)}
        </View>
      </> : <>
        <View style={{ padding: 10, borderRadius: 14, backgroundColor: state.shown ? C.success : C.paper,
          borderWidth: state.shown ? 2 : 1, borderColor: state.shown ? C.teal : C.line }}>
          <Copy style={{ fontSize: q.kind === "word" ? 32 : 24, lineHeight: 36, color: C.ink, textAlign: "center", fontWeight: "700" }}>{q.text}</Copy>
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8 }}>
          {q.choices.map((choice, i) => {
            const marked = (state.shown || state.solved) && i === right;
            const label = typeof choice === "string" ? `A ${choice}` : sceneLabel(choice);
            return <PressableScale key={`${state.index}-${i}`} accessibilityRole="button"
              accessibilityLabel={`Picture ${i + 1}: ${label}${marked ? ", matches" : state.wrong === i ? ", try another picture" : ""}`}
              accessibilityState={{ selected: marked, disabled: disabled || state.solved }} disabled={disabled || state.solved}
              onPress={() => choose(i)} style={{ flexBasis: q.kind === "word" ? "30%" : "46%", flexGrow: 0,
                minHeight: 88, alignItems: "center", justifyContent: "center", padding: 4, borderRadius: 14,
                borderWidth: 2, borderColor: marked ? C.teal : C.line, backgroundColor: marked ? C.success : C.paper }}>
              <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                {typeof choice === "string" ? <PictureObject name={choice} size={72} /> : <Scene scene={choice} width={128} height={86} />}
              </View>
              <Copy style={{ color: C.ink, fontSize: 12, lineHeight: 18 }}>{marked ? "Matches" : `Picture ${i + 1}`}</Copy>
            </PressableScale>;
          })}
        </View>
      </>}
      <View accessibilityLiveRegion="polite">
        <Copy style={{ color: C.ink, textAlign: "center" }}>{state.solved
          ? state.results.length === 3 ? "Ready! Let’s play." : "That’s it! Ready for the next one?"
          : state.shown ? q.kind === "math" ? "Tap the missing number to try it together." : q.kind === "growth" ? "Tap the marked answer to try it together." : "Tap the picture marked Matches to try it together."
          : state.helped ? "Let’s try it together. Look again, or tap Show me." : "You can ask for help at any time."}</Copy>
      </View>
      {state.solved ? <Button disabled={disabled} onPress={() => send({ type: "next", question: state.index })}>
        {state.results.length === 3 ? "Let’s play" : "Next question"}
      </Button> : <View style={{ flexDirection: "row", gap: 8 }}>
        <Button quiet compact icon="sound-on" style={{ flex: 1 }} disabled={disabled || !soundOn}
          label={q.kind === "math" ? "Hear the math question" : "Hear the instruction"}
          onPress={() => {
            if (session.canHear(state.index)) speak(q.kind === "math" || q.kind === "growth" ? q.speech : "which-one-intro");
          }}>Hear</Button>
        <Button quiet compact style={{ flex: 1 }} disabled={disabled} onPress={show}>Show me</Button>
      </View>}
      <Button quiet compact disabled={disabled} onPress={() => {
        setAnswer("");
        send({ type: "gate-open" });
      }}>Grown-up skip</Button>
    </>}
  </View></LearningCompanion>;
}
