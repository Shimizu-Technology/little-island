import { BadgeResultCard } from '../badges/ResultCard';
import { router } from "expo-router";
import { Text } from "../components/Text";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { AppState, BackHandler, Platform, ScrollView, StyleSheet, TextInput, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path, Rect } from "react-native-svg";
import { Button, C, Chip, Copy, Heading, Label, Status, font, GameHeader, PressableScale } from "../components/ui";
import { ExploreTopic, WORLDS, WorldId, searchTopics, topicById, topicNarration } from "./content";
import { HABITATS, LabAction, LabState, PLACES, WATER_ACTIONS, activityTopic, isDay, labAction } from "./activities";
import { labAudioKey, LabAudioKey } from "./labAudio";
import { GuidanceKey } from "./guidance";
import { ExploreLocation, ExploreProgress, exploreLocationKey, restoreExploreProgress } from "./progress";
import { LabManipulative, LabGuidance } from "./LabManipulatives";
import { TopicArt, WorldGlyph } from "./ExploreArt";
export interface ExploreScreenProps {
  favorites: readonly string[];
  onToggleFavorite: (topicId: string) => void;
  onBack: () => void;
  onCompleteTopic?: (topic: string, progress: ExploreProgress) => void;
  onSpeak: (topicId: string, transcript: string) => void;
  onStop: () => void;
  narrationEnabled?: boolean;
  speakingTopicId?: string;
  progress?: ExploreProgress;
  onProgressChange?: (next: ExploreProgress) => void;
  onToggleSound?: () => void;
  onSpeakInstruction?: (key: GuidanceKey | LabAudioKey) => void;
  onStopInstruction?: () => void;
  speakingInstructionId?: string;
}
type Location = ExploreLocation;
const locationKey = exploreLocationKey;
const activityInvitations: Record<WorldId, string> = {
  space: "Turn Earth",
  oceans: "Build a food chain",
  animals: "Match animal homes",
  weather: "Move a water drop",
  world: "Follow map clues",
};
export function ExploreScreen({
  favorites,
  onToggleFavorite,
  onBack,
  onCompleteTopic,
  onSpeak,
  onStop,
  narrationEnabled = true,
  speakingTopicId,
  progress,
  onProgressChange,
  onToggleSound,
  onSpeakInstruction,
  onStopInstruction,
  speakingInstructionId,
}: ExploreScreenProps) {
  const { width, fontScale } = useWindowDimensions();
  const [initial] = useState(() => restoreExploreProgress(progress));
  const [location, setLocation] = useState<Location>(initial.location);
  const [history, setHistory] = useState<Location[]>(initial.history);
  const [query, setQuery] = useState(initial.query);
  const [onlyFavorites, setOnlyFavorites] = useState(initial.onlyFavorites);
  const [labs, setLabs] = useState<Record<WorldId, LabState>>(initial.labs);
  const scroll = useRef<ScrollView>(null);
  const searchInput = useRef<TextInput>(null);
  const searchY = useRef(0);
  const searchAllRequested = useRef(false);
  const [showActivities, setShowActivities] = useState(false);
  const positions = useRef<Record<string, number>>(initial.positions);
  const currentY = useRef(initial.positions[locationKey(initial.location)] ?? 0);
  const pendingRestore = useRef(true);
  const currentKey = locationKey(location);
  const stopRef = useRef(() => { onStop(); onStopInstruction?.(); });
  React.useLayoutEffect(() => {
    stopRef.current = () => { onStop(); onStopInstruction?.(); };
  }, [onStop, onStopInstruction]);
  useEffect(() => () => stopRef.current(), []);
  const latestProgress = useRef<ExploreProgress>(initial);
  const saveProgress = useRef(onProgressChange);
  React.useLayoutEffect(() => {
    saveProgress.current = onProgressChange;
  }, [onProgressChange]);
  React.useLayoutEffect(() => {
    latestProgress.current = {
      version: 1,
      location,
      history,
      query,
      onlyFavorites,
      labs,
      positions: { ...positions.current },
    };
    saveProgress.current?.(latestProgress.current);
  }, [location, history, query, onlyFavorites, labs]);
  const scrollSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rememberScroll = useCallback(() => {
    if (scrollSaveTimer.current) clearTimeout(scrollSaveTimer.current);
    scrollSaveTimer.current = null;
    latestProgress.current = { ...latestProgress.current, positions: { ...positions.current } };
    saveProgress.current?.(latestProgress.current);
  }, []);
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") rememberScroll();
    });
    // Wheel/keyboard scrolling on web does not emit native drag-end events.
    if (Platform.OS === "web" && typeof window !== "undefined") window.addEventListener("pagehide", rememberScroll);
    return () => {
      subscription.remove();
      if (Platform.OS === "web" && typeof window !== "undefined") window.removeEventListener("pagehide", rememberScroll);
      rememberScroll();
    };
  }, [rememberScroll]);
  const go = (next: Location) => {
    onStop();
    onStopInstruction?.();
    positions.current[currentKey] = currentY.current;
    pendingRestore.current = true;
    setHistory((previous) => [...previous, location].slice(-24));
    setLocation(next);
  };
  const back = useCallback(() => {
    onStop();
    onStopInstruction?.();
    positions.current[locationKey(location)] = currentY.current;
    pendingRestore.current = true;
    if (history.length) {
      setLocation(history[history.length - 1]);
      setHistory(history.slice(0, -1));
    } else {
      saveProgress.current?.({ ...latestProgress.current, positions: { ...positions.current } });
      onBack();
    }
  }, [history, location, onBack, onStop, onStopInstruction]);
  useEffect(() => {
    const listener = BackHandler.addEventListener("hardwareBackPress", () => {
      back();
      return true;
    });
    return () => listener.remove();
  }, [back]);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      scroll.current?.scrollTo({ y: positions.current[currentKey] ?? 0, animated: false });
      pendingRestore.current = false;
    });
    return () => cancelAnimationFrame(frame);
  }, [currentKey]);
  useEffect(() => {
    if (!narrationEnabled) stopRef.current();
  }, [narrationEnabled]);
  const world =
    location.kind === "world" || location.kind === "activity" ? WORLDS.find((w) => w.id === location.world) : undefined;
  const topic = location.kind === "topic" ? topicById(location.id) : undefined;
  const topics = searchTopics(
    query,
    location.kind === "world" ? location.world : undefined,
    onlyFavorites ? favorites : undefined
  );
  const twoColumns = width >= 600 && fontScale < 1.5;
  const act = (id: WorldId, action: LabAction) =>
    setLabs((previous) => ({ ...previous, [id]: labAction(previous[id], action) }));
  return (
    <SafeAreaView style={s.page} edges={["top", "left", "right", "bottom"]}>
      <View style={{ paddingHorizontal: 18 }}>
        <GameHeader title="Explore" onBack={back} backLabel={history.length ? "Back" : "Games"}
          sound={onToggleSound ? { on: narrationEnabled, toggle: () => { stopRef.current(); onToggleSound(); } } : undefined}>
          {history.length > 0 && <Button quiet compact label="Back to Little Island, keep my discovery place" onPress={() => { stopRef.current(); rememberScroll(); onBack(); }}>Games</Button>}
        </GameHeader>
      </View>
      <ScrollView
        key={currentKey}
        ref={scroll}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        onScroll={(event) => {
          currentY.current = Math.max(0, Math.min(1000000, event.nativeEvent.contentOffset.y));
          if (pendingRestore.current) return;
          positions.current[currentKey] = currentY.current;
          if (scrollSaveTimer.current) clearTimeout(scrollSaveTimer.current);
          scrollSaveTimer.current = setTimeout(rememberScroll, 180);
        }}
        scrollEventThrottle={80}
        onScrollEndDrag={rememberScroll}
        onMomentumScrollEnd={rememberScroll}
        onContentSizeChange={() => {
          if (pendingRestore.current) {
            pendingRestore.current = false;
            scroll.current?.scrollTo({ y: positions.current[currentKey] ?? 0, animated: false });
          }
        }}
        contentContainerStyle={s.content}
      >
        {location.kind === "map" && (
          <>
            <Label>Follow your curiosity</Label>
            <Heading style={s.title}>Where shall we go?</Heading>
            <Copy>Five worlds. Fifty discoveries. Ready without Wi-Fi.</Copy>
            <View style={s.row}>
              <Button compact quiet onPress={() => { scroll.current?.scrollTo({ y: searchY.current, animated: false }); searchInput.current?.focus(); }}>Search</Button>
              <Button compact quiet onPress={() => { setOnlyFavorites(true); scroll.current?.scrollTo({ y: searchY.current, animated: false }); }}>Favorites</Button>
              <Button compact quiet selected={showActivities} onPress={() => setShowActivities(!showActivities)}>Activities</Button>
            </View>
            {showActivities && <View style={s.row}>{WORLDS.map((w) => <Button key={w.id} compact quiet onPress={() => go({ kind: "activity", world: w.id })}>{activityInvitations[w.id]}</Button>)}</View>}
            <DiscoveryMap
              onChoose={(id) => go({ kind: "world", world: id })}
              onActivity={(id) => go({ kind: "activity", world: id })}
            />
          </>
        )}
        {location.kind === "world" && world && (
          <>
            <View style={[s.worldHeader, { backgroundColor: world.tint }]}>
              <WorldGlyph world={world.id} size={88} />
              <View style={{ flex: 1, minWidth: 140 }}>
                <Label>10 discoveries</Label>
                <Heading style={s.title}>{world.title}</Heading>
                <Copy style={{ color: C.ink }}>{world.invitation}</Copy>
              </View>
            </View>
            <Button onPress={() => go({ kind: "activity", world: world.id })}>Try: {world.activity}</Button>
          </>
        )}
        {(location.kind === "map" || location.kind === "world") && (
          <>
            <View onLayout={(event) => {
              searchY.current = event.nativeEvent.layout.y;
              if (searchAllRequested.current && location.kind === "map") {
                searchAllRequested.current = false;
                positions.current.map = searchY.current;
                requestAnimationFrame(() => scroll.current?.scrollTo({ y: searchY.current, animated: false }));
              }
            }} style={s.sectionHeading}>
              <Heading style={{ fontSize: 24 }}>
                {location.kind === "map" ? "Find a discovery" : "Wonder about…"}
              </Heading>
              <Copy>
                {topics.length} {topics.length === 1 ? "topic" : "topics"}
              </Copy>
            </View>
            <TextInput
              ref={searchInput}
              style={s.input}
              accessibilityLabel="Search discoveries"
              placeholder="Search sky, turtles, space…"
              placeholderTextColor="#64716C"
              value={query}
              onChangeText={setQuery}
              maxLength={100}
              returnKeyType="search"
              autoCorrect={false}
            />
            <View style={s.row}>
              <Chip selected={!onlyFavorites} onPress={() => setOnlyFavorites(false)}>
                Include non-favorites
              </Chip>
              <Chip selected={onlyFavorites} onPress={() => setOnlyFavorites(true)}>
                Favorites ({favorites.length})
              </Chip>
            </View>
            {topics.length === 0 && (
              <View style={{ gap: 10 }}><Status
                title={onlyFavorites && !favorites.length ? "Your discoveries can live here" : "No discoveries found"}
                detail={
                  onlyFavorites && !favorites.length
                    ? "Open a topic and tap Save favorite. Try Include non-favorites to start exploring."
                    : "Keep your search and look in every world, or clear the search to try again."
                }
              />
              <View style={s.row}>
                {location.kind === "world" && <Button compact onPress={() => { searchAllRequested.current = true; go({ kind: "map" }); }}>Search all worlds</Button>}
                <Button compact quiet onPress={() => setQuery("")}>Clear search</Button>
              </View></View>
            )}
            <View style={s.grid}>
              {topics.map((item) => (
                <TopicCard
                  key={item.id}
                  topic={item}
                  favorite={favorites.includes(item.id)}
                  onPress={() => go({ kind: "topic", id: item.id })}
                  twoColumns={twoColumns}
                />
              ))}
            </View>
          </>
        )}
        {topic && (
          <TopicView
            key={topic.id}
            topic={topic}
            onComplete={() => onCompleteTopic?.(topic.id, latestProgress.current)}
            favorite={favorites.includes(topic.id)}
            onFavorite={() => onToggleFavorite(topic.id)}
            onRelated={(id) => go({ kind: "topic", id })}
            onActivity={() => go({ kind: "activity", world: topic.world })}
            onSpeak={() => onSpeak(topic.id, topicNarration(topic))}
            onStop={onStop}
            narrationEnabled={narrationEnabled}
            speaking={speakingTopicId === topic.id}
          />
        )}
        {location.kind === "activity" && world && (
          <>
            <Label>{world.title} · Try it yourself</Label>
            <Heading style={s.title}>{world.activity}</Heading>
            <LabGuidance
              world={world.id}
              sound={narrationEnabled}
              onSpeak={onSpeakInstruction}
              onStop={onStopInstruction}
              speaking={speakingInstructionId}
            />
            <Lab world={world.id} state={labs[world.id]} act={(action) => { stopRef.current(); act(world.id, action); }} sound={narrationEnabled} onHear={onSpeakInstruction} />
            <View style={s.row}>
              <Button quiet onPress={() => act(world.id, { type: "reset" })}>
                Start activity again
              </Button>
              <Button quiet onPress={() => go({ kind: "topic", id: activityTopic[world.id] })}>
                Read the discovery
              </Button>
            </View>
            <Copy style={{ fontSize: 13 }}>
              A simplified learning model. Shapes, sizes, and timing are changed to make the ideas easier to explore.
            </Copy>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
function DiscoveryMap({ onChoose, onActivity }: {
  onChoose: (id: WorldId) => void;
  onActivity: (id: WorldId) => void;
}) {
  return (
    <View style={s.discoveryMap}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Svg width="100%" height="100%" viewBox="0 0 500 500" preserveAspectRatio="none" accessibilityElementsHidden>
          <Rect width={500} height={500} rx={26} fill="#E3EFF0" />
          <Path
            d="M70 50q350 30 245 150T115 320t250 90"
            stroke="#90B7B6"
            strokeWidth={3}
            fill="none"
            strokeDasharray="5 9"
          />
          {[60, 205, 360, 470].map((y) => (
            <Path key={y} d={`M8 ${y}q30-12 55 0m360 20q30-12 55 0`} stroke="#B6D4D5" strokeWidth={3} fill="none" />
          ))}
        </Svg>
      </View>
      <Label style={{ textAlign: "center", paddingTop: 12 }}>Your discovery map</Label>
      <View style={s.mapGrid}>
        {WORLDS.map((world, i) => (
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={`Explore ${world.title}, 10 discoveries and ${world.activity}`}
            key={world.id}
            onPress={() => onChoose(world.id)}
            style={[
              s.mapIsland,
              {
                backgroundColor: world.tint,
                borderColor: world.color,
                transform: [{ rotate: `${i % 2 ? 2 : -2}deg` }],
              },
            ]}
          >
            <WorldGlyph world={world.id} size={68} />
            <Text style={s.islandLabel}>{world.title}</Text>
          </PressableScale>
        ))}
      </View>
      <Copy style={{ fontSize: 12, textAlign: "center" }}>An imaginary map of ideas. Tap an island to explore.</Copy>
      <View style={s.activityShelf}>
        <Heading style={{ fontSize: 21 }}>Try it yourself</Heading>
        <View style={s.row}>
          {WORLDS.map((world) => (
            <Button
              key={world.id}
              quiet
              compact
              label={`Try: ${world.activity}. ${activityInvitations[world.id]}`}
              onPress={() => onActivity(world.id)}
              style={{ backgroundColor: world.tint, borderColor: world.color, flexShrink: 1 }}
            >
              {activityInvitations[world.id]} ›
            </Button>
          ))}
        </View>
      </View>
    </View>
  );
}
function TopicCard({
  topic,
  onPress,
  favorite,
  twoColumns,
}: {
  topic: ExploreTopic;
  onPress: () => void;
  favorite: boolean;
  twoColumns: boolean;
}) {
  const world = WORLDS.find((w) => w.id === topic.world)!;
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${topic.title}${favorite ? ", saved favorite" : ""}. ${world.title}`}
      onPress={onPress}
      style={[
        s.card,
        { width: twoColumns ? "48.5%" : "100%" },
      ]}
    >
      <TopicArt topic={topic} compact />
      <View style={s.cardText}>
        <Label style={{ color: world.color }}>
          {world.title}
          {favorite ? " · Saved" : ""}
        </Label>
        <Heading style={{ fontSize: 21, letterSpacing: -0.2 }}>{topic.title}</Heading>
        <Copy style={{ fontSize: 14, lineHeight: 22 }}>{topic.short}</Copy>
        <Text style={s.read}>Let's find out ›</Text>
      </View>
    </PressableScale>
  );
}
function TopicView({
  topic,
  onComplete,
  favorite,
  onFavorite,
  onRelated,
  onActivity,
  onSpeak,
  onStop,
  narrationEnabled,
  speaking,
}: {
  topic: ExploreTopic;
  onComplete: () => void;
  favorite: boolean;
  onFavorite: () => void;
  onRelated: (id: string) => void;
  onActivity: () => void;
  onSpeak: () => void;
  onStop: () => void;
  narrationEnabled: boolean;
  speaking: boolean;
}) {
  const [showSources, setShowSources] = useState(false);
  const world = WORLDS.find((w) => w.id === topic.world)!;
  const learnGame = ["coral", "tides", "reef"].includes(topic.id) ? { id: "tide-pool", name: "Tide Pool Lab" } : ["boats", "floating", "salty", "waves"].includes(topic.id) ? { id: "float-sink", name: "Float or Sink" } : null;
  return (
    <>
      <Label>{world.title}</Label>
      <Heading style={s.title}>{topic.title}</Heading>
      <TopicArt topic={topic} />
      <View style={s.row}>
        <Button onPress={onSpeak} disabled={!narrationEnabled}>
          {speaking ? "Read again" : "Listen to discovery"}
        </Button>
        <Button quiet disabled={!speaking} onPress={onStop}>
          Stop reading
        </Button>
        <Button
          quiet
          selected={favorite}
          onPress={onFavorite}
          label={`${favorite ? "Remove" : "Save"} favorite: ${topic.title}`}
        >
          {favorite ? "Saved favorite" : "Save favorite"}
        </Button>
      </View>
      {!narrationEnabled && <Copy>Sound is off. You can read every word below.</Copy>}
      <Copy style={s.short}>{topic.short}</Copy>
      <Button onPress={onActivity}>Try: {world.activity}</Button>
      {learnGame && <Button quiet onPress={() => router.push({ pathname: "/learn", params: { game: learnGame.id } })}>Try it: {learnGame.name}</Button>}
      <View style={s.deeper}>
        <Label>A little deeper</Label>
        <Copy style={{ color: C.ink }}>{topic.deeper}</Copy>
      </View>
      <View style={[s.deeper, { backgroundColor: world.tint }]}>
        <Label>Something to try</Label>
        <Button quiet onPress={onComplete}>I finished this topic</Button><BadgeResultCard round={`explore:${topic.id}`}/>
        <Heading style={{ fontSize: 21 }}>{topic.question}</Heading>
      </View>
      <Heading style={{ fontSize: 24 }}>Keep wondering</Heading>
      <View style={{ gap: 10 }}>
        {topic.related.map((id) => {
          const related = topicById(id)!;
          return (
            <Button key={id} quiet onPress={() => onRelated(id)}>
              {related.title} ›
            </Button>
          );
        })}
      </View>
      <Button quiet compact onPress={() => setShowSources((value) => !value)}>
        {showSources ? "Hide" : "About"} this discovery
      </Button>
      {showSources && (
        <View style={s.deeper}>
          <Copy style={{ fontSize: 13 }}>
            Original Little Island explanation and illustration. Fact-checked {topic.review.checkedOn} using:
          </Copy>
          {topic.sources.map((source) => (
            <View key={source.url}>
              <Text selectable style={s.sourceTitle}>
                {source.title}
              </Text>
              <Text selectable style={s.sourceUrl}>
                {source.url}
              </Text>
            </View>
          ))}
          <Copy style={{ fontSize: 12 }}>
            Source addresses are reference text, not links out of the app. Narration reads the title, explanation,
            deeper fact, and activity prompt shown here.
          </Copy>
        </View>
      )}
    </>
  );
}
function Lab({ world, state, act, sound, onHear }: { world: WorldId; state: LabState; act: (action: LabAction) => void; sound: boolean; onHear?: (key: GuidanceKey | LabAudioKey) => void }) {
  const feedback = (title: string, success = false) => state.message ? <View accessibilityLiveRegion="polite" style={{ gap: 6 }}>
    <Status title={title} detail={state.message} success={success} />
    {onHear && labAudioKey(state.message) && <Button compact quiet disabled={!sound} onPress={() => onHear(labAudioKey(state.message)!)}>Hear this</Button>}
  </View> : null;
  if (world === "space") {
    const edge = state.turn === 2 || state.turn === 6;
    return (
      <>
        <Copy>
          Turn Earth while the Sun stays on the left. Follow the coral-colored dot: it marks one place on Earth.
        </Copy>
        <LabManipulative world="space" state={state} act={act} />
        <Status
          title={
            edge
              ? "The dot is at the edge of daylight"
              : isDay(state.turn)
                ? "The dot has daytime"
                : "The dot has nighttime"
          }
          detail="Half of Earth faces sunlight. The other half faces away. This view looks down from above the North Pole."
        />
        <View style={s.row}>
          <Button quiet onPress={() => act({ type: "turn", by: -1 })}>
            Turn back
          </Button>
          <Button onPress={() => act({ type: "turn", by: 1 })}>Turn Earth ⅛</Button>
        </View>
        <Copy>
          Challenge: put the dot fully in daylight, then fully in darkness. Eight steps make one whole turn. The real
          Earth takes about a day.
        </Copy>
      </>
    );
  }
  if (world === "oceans") return <>
    <Copy>Build one possible ocean food chain. Start with the energy source, then choose who receives that energy next.</Copy>
    {feedback(state.chain.length === 5 ? "You built a chain!" : "Try the next connection", state.chain.length === 5)}
    {state.chain.length === 5 ? <View style={s.deeper}><Heading style={{ fontSize: 23 }}>Your food chain is complete</Heading><Copy>{state.chain.join(" → ")}</Copy><Button onPress={() => act({ type: "reset" })}>Build another chain</Button></View> : <>
      <LabManipulative world="oceans" state={state} act={act} />
      <Button quiet disabled={!state.chain.length} onPress={() => act({ type: "unchain" })}>Remove last link</Button>
    </>}
    <Copy>Phytoplankton use sunlight. Some zooplankton eat phytoplankton; some small fish eat zooplankton; larger fish can eat smaller fish. Real life forms a web.</Copy>
  </>;
  if (world === "animals") {
    const done = state.habitat === HABITATS.length && !state.habitatFeedback;
    // Old saves advanced immediately: never put their previous animal's explanation under the next one.
    const oldExplanation = !state.habitatFeedback && HABITATS.some((animal) => animal.why === state.message);
    return <>
      <Copy>Find a suitable habitat for each animal. Think about food, water, shelter, and space.</Copy>
      <Copy>{state.matched.length} of {HABITATS.length} habitats found</Copy>
      {!oldExplanation && feedback(state.habitatFeedback ? "A good habitat match!" : "Habitat clue", !!state.habitatFeedback)}
      {done ? <View style={s.deeper}><Status title="Six good habitat matches!" detail="You found a suitable place for each animal." success /><Button onPress={() => act({ type: "reset" })}>Match animals again</Button></View> : <LabManipulative world="animals" state={state} act={act} />}
      {state.habitatFeedback && <Button onPress={() => act({ type: "next-animal" })}>{state.habitat === HABITATS.length ? "See all matches" : "Next animal"}</Button>}
      <Copy>These are examples of suitable habitats. An animal's whole habitat is larger than one nest, leaf, or hiding place.</Copy>
    </>;
  }
  if (world === "weather")
    return (
      <>
        <Copy>
          Move a drop through water's different states. Choose an action, watch what changes, and try a different route.
        </Copy>
        <Status
          title={
            {
              ocean: "Liquid water in the ocean",
              vapor: "Invisible water vapor",
              cloud: "Tiny drops in a cloud",
              rain: "Rain falling to land",
              ground: "Water in soil and rock",
              ice: "Frozen water: ice",
            }[state.water]
          }
          detail={state.message || "Choose what happens to the water next."}
        />
        {state.message && onHear && labAudioKey(state.message) && <Button compact quiet disabled={!sound} onPress={() => onHear(labAudioKey(state.message)!)}>Hear this</Button>}
        <LabManipulative world="weather" state={state} act={act} />
        <View style={s.row}>
          {WATER_ACTIONS[state.water].map((choice) => (
            <Button key={choice.action} onPress={() => act({ type: "water", action: choice.action })}>
              {choice.label}
            </Button>
          ))}
        </View>
        <View style={s.deeper}>
          <Label>Your recent journey</Label>
          <Copy style={{ color: C.ink }}>
            {state.journey
              .map(
                (place) =>
                  ({ ocean: "Ocean", vapor: "Vapor", cloud: "Cloud", rain: "Rain", ground: "Groundwater", ice: "Ice" })[
                    place
                  ]
              )
              .join(" → ")}
          </Copy>
        </View>
        <Copy>
          Challenge: take a trip through the ground and back to the ocean. Then try freezing and melting. Real water can
          take many more paths and much longer journeys.
        </Copy>
      </>
    );
  return (
    <>
      <Copy>
        Follow five clues around a simplified world map. Tap a numbered destination below the map to choose it. North is
        up.
      </Copy>
      {feedback("Expedition notebook")}
      {state.expedition !== PLACES.length && <LabManipulative world="world" state={state} act={act} />}
      <Copy style={{ fontSize: 13 }}>
        Green = land · Blue = ocean · Numbered dots = destinations. Shapes are simplified and polar land is stretched.
      </Copy>
      <Status
        title={
          state.expedition === PLACES.length
            ? "You completed the expedition!"
            : `Clue ${state.expedition + 1} of ${PLACES.length}`
        }
        detail={
          state.expedition === PLACES.length
            ? "You found Guam, Japan, Australia, Africa, and Antarctica. Start again to revisit the route."
            : PLACES[state.expedition].clue
        }
        success={state.expedition === PLACES.length}
      />
      {state.expedition === PLACES.length ? <Button onPress={() => act({ type: "reset" })}>Explore the map again</Button> : <View style={s.row}>
        {PLACES.map((place, index) => (
          <Button
            key={place.id}
            quiet
            disabled={state.expedition === PLACES.length}
            selected={state.visited.includes(place.id)}
            onPress={() => act({ type: "place", id: place.id })}
          >
            {index + 1}. {place.name}
          </Button>
        ))}
      </View>}

      <Copy>
        {state.visited.length} of {PLACES.length} destinations found. This map is for learning, not travel directions.
      </Copy>
    </>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.cream },
  topbar: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 10,
    gap: 12,
    width: "100%",
    maxWidth: 920,
    alignSelf: "center",
  },
  content: {
    width: "100%",
    maxWidth: 920,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 18,
  },
  title: { fontSize: 31, lineHeight: 39 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 10, alignItems: "center" },
  sectionHeading: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
    justifyContent: "space-between",
  },
  input: {
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.paper,
    borderRadius: 15,
    padding: 15,
    minHeight: 52,
    fontSize: 17,
    fontFamily: font,
    color: C.ink,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 16 },
  card: { borderRadius: 22, backgroundColor: C.paper, borderWidth: 1, borderColor: C.line, overflow: "hidden" },
  cardText: { padding: 18, gap: 9 },
  read: { fontFamily: font, color: C.teal, fontWeight: "700", fontSize: 15, marginTop: 3 },
  worldHeader: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", borderRadius: 24, padding: 20, gap: 16 },
  short: { fontSize: 20, lineHeight: 31, color: C.ink },
  deeper: { padding: 20, gap: 10, backgroundColor: "#F0F2E8", borderRadius: 20 },
  sourceTitle: { fontFamily: font, fontSize: 14, color: C.ink, fontWeight: "700" },
  sourceUrl: { fontFamily: font, fontSize: 12, color: C.muted, flexShrink: 1 },
  discoveryMap: { overflow: "hidden", borderRadius: 26, padding: 14, gap: 14 },
  activityShelf: { backgroundColor: C.paper, borderRadius: 20, padding: 16, gap: 12 },
  mapGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 14, paddingVertical: 8 },
  mapIsland: {
    flexGrow: 1,
    flexBasis: 124,
    maxWidth: 230,
    minHeight: 140,
    borderWidth: 1,
    borderRadius: 32,
    padding: 13,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  islandLabel: { fontFamily: font, fontSize: 17, fontWeight: "700", color: C.ink, textAlign: "center" },
  labPicture: {
    backgroundColor: "#E9F0E9",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },
  chain: { padding: 18, gap: 9, backgroundColor: "#E4F1F1", borderRadius: 20 },
  chainItem: { gap: 3 },
});
