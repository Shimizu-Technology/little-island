import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Recovery } from "../components/Recovery";
import { Copy, styles } from "../components/ui";
import { AppState, View } from "react-native";
import { SaveStatus } from "../components/SaveStatus";
import { router, useIsFocused } from "expo-router";
import { useAudioPlayerStatus } from "expo-audio";
import { topicSpeechKey } from "../explore/content";
import { ExploreScreen } from "../explore/ExploreScreen";
import { useStore } from "../state/Store";
import { useSoundControls } from "../components/Audio";
export default function Explore() {
  const store = useStore();
  if (!store.ready)
    return (
      <SafeAreaView style={styles.page}>
        <Copy>Opening your discoveries…</Copy>
      </SafeAreaView>
    );
  if (store.recovery)
    return (
      <SafeAreaView style={styles.page}>
        <Recovery />
      </SafeAreaView>
    );
  return <ExploreReady key={store.epoch} />;
}
function ExploreReady() {
  const store = useStore(),
    focused = useIsFocused(),
    { play, stop: stopAudio, player } = useSoundControls(store.save.settings.sound && focused),
    status = useAudioPlayerStatus(player);
  const [speaking, setSpeaking] = useState<string>();
  const ownedPlayer = useRef<typeof player | null>(player);
  useLayoutEffect(() => {
    ownedPlayer.current = player;
    // Mark disposed before the audio hook releases its native shared object and child passive cleanups run.
    return () => {
      ownedPlayer.current = null;
    };
  }, [player]);
  const stop = useCallback(() => {
    if (ownedPlayer.current !== player) return;
    try {
      stopAudio();
    } catch {
      /* The transcript stays available when native audio is unavailable. */
    }
    setSpeaking(undefined);
  }, [player, stopAudio]);
  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => {
      if (s !== "active") stop();
    });
    return () => sub.remove();
  }, [stop]);
  useEffect(() => {
    if (!focused || !store.save.settings.sound || store.save.settings.narration === false || status.didJustFinish) stop();
  }, [focused, store.save.settings.sound, store.save.settings.narration, status.didJustFinish, stop]);
  useEffect(() => { stop(); }, [store.save.settings.voice, store.save.settings.narrationVolume, stop]);
  return (
    <View style={{ flex: 1 }}>
      {store.error && <SafeAreaView edges={["top", "left", "right"]} style={{ backgroundColor: "#FCFAF4", paddingHorizontal: 18 }}><SaveStatus /></SafeAreaView>}
    <ExploreScreen
      key={store.epoch}
      favorites={store.save.explore?.favorites ?? []}
      onToggleFavorite={store.toggleFavorite}
      onBack={() => (router.canGoBack() ? router.back() : router.replace("/"))}
      onStop={stop}
      narrationEnabled={store.save.settings.sound && (store.save.settings.narration ?? true)}
      speakingTopicId={speaking?.startsWith("explore-") ? speaking.slice(8) : undefined}
      onCompleteTopic={(topic, progress) => store.exploreUpdate(progress, store.epoch, topic)}
      progress={store.save.explore?.progress}
      onProgressChange={(next) => store.exploreUpdate(next, store.epoch)}
      onToggleSound={() => store.settings({ sound: !store.save.settings.sound })}
      speakingInstructionId={speaking && !speaking.startsWith("explore-") ? speaking : undefined}
      onStopInstruction={stop}
      onSpeakInstruction={(key) => {
        if (ownedPlayer.current !== player) return;
        if (play(key)) setSpeaking(key); else setSpeaking(undefined);
      }}
      onSpeak={(id) => {
        if (ownedPlayer.current !== player) return;
        if (play(topicSpeechKey(id))) setSpeaking(`explore-${id}`); else setSpeaking(undefined);
      }}
    />
    </View>
  );
}
