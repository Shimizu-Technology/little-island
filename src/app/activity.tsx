import { SaveStatus } from "../components/SaveStatus";
import { learnerPractice } from "../learn/learners";
import React, { useEffect, useRef, useState } from "react";
import { ScrollView, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Redirect, router, useLocalSearchParams, useIsFocused } from "expo-router";
import { ActivityId, activityIds } from "../state/activities";
import { useStore } from "../state/Store";
import { CardGameScreen } from "../cards/CardGameScreen";
import { CardSession, createCardSession } from "../cards/engine";
import { RaceScreen } from "../racer/RaceScreen";
import { MysteryScreen } from "../mystery/MysteryScreen";
import { PartyScreen } from "../party/PartyScreen";
import { defaultOptions } from "../games/types";
import { Button, Copy, GameHeader, styles } from "../components/ui";
import { Recovery } from "../components/Recovery";
import { useSoundControls } from "../components/Audio";
import { useRoundPractice } from "../practice/useRoundPractice";
export default function Activity() {
  const { game } = useLocalSearchParams<{ game?: string }>(),
    store = useStore();
  if (!activityIds.includes(game as ActivityId)) return <Redirect href="/" />;
  if (!store.ready)
    return (
      <SafeAreaView style={styles.page}>
        <Copy>Opening your game…</Copy>
      </SafeAreaView>
    );
  if (store.recovery)
    return (
      <SafeAreaView style={styles.page}>
        <Recovery />
      </SafeAreaView>
    );
  return <ActivityGame key={`${game}:${store.epoch}`} id={game as ActivityId} />;
}
function ActivityGame({ id }: { id: ActivityId }) {
  const store = useStore(),
    focused = useIsFocused(),
    { width } = useWindowDimensions();
  const [epoch] = useState(store.epoch);
  const mysteryScroll = useRef<ScrollView>(null);
  const expectedId = useRef(store.save.activities?.[id]?.id ?? null);
  const saved = store.save.activities?.[id];
  const [freshCard] = useState(() =>
    id === "go-fish" || id === "crazy-eights" ? createCardSession(id, defaultOptions, undefined, undefined, { round: "quick", pace: "step" }) : null
  );
  const practice = useRoundPractice(id, saved);
  const requestPractice = practice.request;
  const practiceEnabled = learnerPractice(store.save.learning, store.save.settings.practice).enabled;
  const [initialAllowed, setInitialAllowed] = useState(() => !!saved || !practiceEnabled);
  useEffect(() => {
    if (freshCard && !saved && !initialAllowed) requestPractice(() => setInitialAllowed(true), () => router.canGoBack() ? router.back() : router.replace("/"));
  }, [freshCard, saved, initialAllowed, requestPractice, practiceEnabled]);
  const { play: sound, stop: stopSound } = useSoundControls(store.save.settings.sound && focused && !practice.pending);
  const activityUpdate = store.activityUpdate;
  useEffect(() => {
    if (freshCard && initialAllowed && !saved && activityUpdate(id, freshCard, { id: null, epoch })) expectedId.current = freshCard.id;
  }, [activityUpdate, id, freshCard, saved, epoch, initialAllowed]);
  const save = (
    next: Parameters<typeof store.activityUpdate>[1],
    previous?: { id: string; revision: number } | null
  ) => {
    const accepted = store.activityUpdate(id, next, {
      id: previous?.id ?? expectedId.current,
      ...(previous ? { revision: previous.revision } : {}),
      epoch,
    });
    if (accepted) expectedId.current = next.id;
    return accepted;
  };
  const cards = saved?.game === "go-fish" || saved?.game === "crazy-eights" ? saved : freshCard;
  // The first action can race the initial-deal effect, so both use the same missing-save guard.
  const cardChange = (next: CardSession, previous: CardSession) =>
    save(next, expectedId.current === null ? undefined : previous);
  const mysterySound = { on: store.save.settings.sound, toggle: () => store.settings({ sound: !store.save.settings.sound }) };
  if (freshCard && !saved && !initialAllowed) return <SafeAreaView style={styles.page}>
    <ScrollView contentContainerStyle={styles.content}>
      <GameHeader title={id === "go-fish" ? "Go Fish" : "Crazy Eights"} onBack={() => router.canGoBack() ? router.back() : router.replace("/")} />
      <Copy>A little practice, then your new game. Your other games stay saved.</Copy>
      <Button onPress={() => practice.request(() => setInitialAllowed(true), () => router.canGoBack() ? router.back() : router.replace("/"))}>Start practice</Button>
    </ScrollView>{practice.panel}
  </SafeAreaView>;
  return (
    <SafeAreaView style={styles.page}>
      <ScrollView
        ref={id === "island-mystery" ? mysteryScroll : undefined}
        contentContainerStyle={[styles.content, { paddingHorizontal: 20, gap: 16 }]}
        keyboardShouldPersistTaps="handled"
      >
        <SaveStatus />
        {id === "island-mystery" ? (
          <MysteryScreen
            beforeNewRound={practice.request}
            roundPractice={practice}
            menuHeader={
              <GameHeader
                title="Picnic Mystery"
                onBack={() => (router.canGoBack() ? router.back() : router.replace("/"))}
                sound={mysterySound}
              />
            }
            soundControl={mysterySound}
            onActionFocus={() => mysteryScroll.current?.scrollTo({ y: 0, animated: false })}
            state={saved?.game === "island-mystery" ? saved : null}
            onSave={(next, previous) => save(next, previous)}
            active={focused}
            width={Math.min(width - 40, 1000)}
            sound={store.save.settings.sound}
            onFeedback={() => sound("tap")}
            onSpeakInstruction={(key) => sound(key)}
            onStopInstruction={stopSound}
          />
        ) : id === "racer" ? (
          <RaceScreen
            beforeNewRound={practice.request}
            roundPractice={practice}
            session={saved?.game === "racer" ? saved : null}
            records={store.save.raceRecords}
            onSave={(next) => save(next)}
            onExit={() => (router.canGoBack() ? router.back() : router.replace("/"))}
            sound={store.save.settings.sound}
            onToggleSound={() => store.settings({ sound: !store.save.settings.sound })}
            active={focused}
            onFeedback={(event) => sound(event === "finish" ? "win" : event === "checkpoint" ? "match" : "tap")}
          />
        ) : id === "word-imposter" ? (
          <PartyScreen
            beforeNewRound={practice.request}
            roundPractice={practice}
            session={saved?.game === "word-imposter" ? saved : null}
            onChange={(next, previous) => save(next, previous)}
            active={focused && !practice.pending}
            width={Math.min(width - 40, 1000)}
            sound={store.save.settings.sound}
            onSpeakInstructions={() => sound("instructions-word-imposter")}
            onBack={() => (router.canGoBack() ? router.back() : router.replace("/"))}
            onToggleSound={() => store.settings({ sound: !store.save.settings.sound })}
          />
        ) : cards ? (
          <>
            <CardGameScreen
            beforeNewRound={practice.request}
            roundPractice={practice}
              state={cards}
              onChange={cardChange}
              width={Math.min(width - 40, 1000)}
              active={focused && !practice.pending}
              sound={store.save.settings.sound}
              onFeedback={() => sound("tap")}
              onSpeakInstruction={(key) => sound(key)}
              onStopInstruction={stopSound}
              onBack={() => (router.canGoBack() ? router.back() : router.replace("/"))}
              onToggleSound={() => store.settings({ sound: !store.save.settings.sound })}
            />
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
