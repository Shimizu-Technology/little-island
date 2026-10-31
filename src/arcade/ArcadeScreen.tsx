import { BadgeResultCard } from '../badges/ResultCard';
import { Companion } from "../islander/Companion";
import { LearnerChip } from "../personalization/LearnerChip";
import { bestLabel, freePlayBest, nextStarGoal } from "./presentation";
import { ShellMedal } from "./games/fruit-bat-flight/Art";
import type { ReefState } from "./games/reef-builder/engine";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, TextInput, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { newMatch, settle } from "../games/match";
import { FamilySetup, type ArcadeFamily } from "./FamilySetup";
import { PlayScene } from "./PlayScene";
import { PlayTeaching } from "./PlayTeaching";
import { router } from "expo-router";
import { Button, Chip, Copy, Heading, IconButton, PressableScale, Sheet, ToggleRow, styles } from "../components/ui";
import { Settings } from "../components/Settings";
import { SaveStatus } from "../components/SaveStatus";
import { Icon } from "../components/Icon";
import Svg, { Rect } from "react-native-svg";
import { ArcadeScene } from "./Scene";
import { Hero, StarReveal } from "./Juice";
import { ChestArt } from "./TreasureArt";
import { activeLearner } from "../learn/learners";
import { useStore } from "../state/Store";
import { GameIcon } from "../components/GameIcon";
import { ArcadeIsland, StarDisplay } from "./Art";
import { TreasureChest } from "./Chest";
import { OutfitCloset, StickerBook } from "./Collection";
import { LevelMap } from "./LevelMap";
import { Teaching } from "./Teaching";
import { useArcadeAudio } from "./audio";
import { acknowledgeArcadeBreak, arcadeBreakDue, markArcadePlaying } from "./breakClock";
import { useArcadeForeground } from "./loop";
import { arcadeShelfGames } from "./registry";
import { arcadePlays } from "./plays";
import { arcadeLearner, gameProgress, levelOpen, endlessOpen, type ChestOffer } from "./progress";
import { allLevelIds, type ArcadeGame, type ArcadeLevel, type ArcadeResult, type LevelId, starCount } from "./types";
export function ArcadeLobby() {
  const store = useStore(), person = arcadeLearner(store.save.arcade, activeLearner(store.save.learning).id);
  const [sheet, setSheet] = useState<"book" | "settings" | null>(null);
  return <View style={{ flex: 1, backgroundColor: "#077C91" }}><ArcadeScene game="reef-builder" active={!sheet}/><ScrollView contentContainerStyle={[styles.content, { padding: 20, gap: 20, maxWidth: 1000 }]}>
    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}><Button quiet compact icon="back" onPress={() => router.replace("/")}>Home</Button><Button quiet compact onPress={() => setSheet("settings")}>Settings</Button></View>
    <View style={{ alignItems: "center", gap: 8 }}><ArcadeIsland size={166}/><Heading style={{ fontSize: 38, color: "#FFF4D6" }}>Island Arcade</Heading><Copy style={{ textAlign: "center", color: "#FFF4D6", backgroundColor: "#24536A", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 }}>Pick a world. Let’s play.</Copy><Copy style={{ color: "#FFF4D6", backgroundColor: "#24536A", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 }}>{activeLearner(store.save.learning).name} · {person.stickers.length} island stickers</Copy></View>
    <SaveStatus/>
    {arcadeShelfGames().map(game => <View key={game.id} style={{ borderRadius: 28, overflow: "hidden", backgroundColor: game.surface, borderWidth: 3, borderColor: "#D9EACD" }}>
      <PressableScale accessibilityRole="button" accessibilityLabel={`Play ${game.name}, open level map`} onPress={() => router.push({ pathname: "/arcade", params: { game: game.id } })} style={{ padding: 20, gap: 14, flexDirection: "row", alignItems: "center" }}>
        <GameIcon id={game.id} size={110}/><View style={{ flex: 1, gap: 7 }}><Heading style={{ fontSize: 25, paddingRight: 32 }}>{game.name}</Heading><Copy>{game.tagline}</Copy><Copy style={{ fontSize: 14, color: game.color }}>{starCount(gameProgress(person, game.id).stars)} stars · 7 worlds</Copy><Heading style={{ fontSize: 18, color: game.color }}>Let’s play →</Heading></View>
      </PressableScale><View style={{ position: "absolute", right: 8, top: 8 }}><IconButton label={`${(store.save.favoriteGames ?? []).includes(game.id) ? "Remove favorite" : "Favorite"} ${game.name}`} icon={(store.save.favoriteGames ?? []).includes(game.id) ? "star-filled" : "star"} onPress={() => store.toggleGameFavorite(game.id)}/></View>
    </View>)}
    <Button quiet onPress={() => setSheet("book")}>Open my sticker book</Button><Copy style={{ textAlign: "center", fontSize: 13, color: "#FFF4D6" }}>No timers to wait for. No purchases. Your own little island.</Copy>
  </ScrollView><Sheet visible={sheet === "book"} title="Sticker book" onClose={() => setSheet(null)}><StickerBook person={person}/></Sheet><Settings visible={sheet === "settings"} onClose={() => setSheet(null)}/></View>;
}
export function ArcadeGameScreen({ game, debug = false }: { game: ArcadeGame; debug?: boolean }) {
  const { width, height } = useWindowDimensions(), insets = useSafeAreaInsets(), play = arcadePlays[game.id];
  const [arena, setArena] = useState({ width: width - insets.left - insets.right, height: height - insets.top - insets.bottom - 62 });
  const store = useStore(), owner = activeLearner(store.save.learning), expected = useMemo(() => ({ epoch: store.epoch, learner: owner.id }), [store.epoch, owner.id]);
  const person = arcadeLearner(store.save.arcade, owner.id), p = gameProgress(person, game.id), foreground = useArcadeForeground();
  const [level, setLevel] = useState<ArcadeLevel | "endless" | null>(null), [playing, setPlaying] = useState(false), [paused, setPaused] = useState(false);
  const [sheet, setSheet] = useState<"book" | "outfits" | "settings" | "teach" | "chest" | "leave" | null>(null), [result, setResult] = useState<ArcadeResult | null>(null);
  const [savedReef, setSavedReef] = useState<ReefState | undefined>(undefined);
  const [round, setRound] = useState(""), [seed, setSeed] = useState(1), [name, setName] = useState(owner.id === "family" ? store.save.players?.[0] ?? "Family" : owner.name);
  const [mode, setMode] = useState<ArcadeFamily["mode"]>("solo"), [strength, setStrength] = useState<ArcadeFamily["strength"]>("gentle");
  const [match, setMatch] = useState(() => newMatch(store.save.players));
  const together = !!play.familyMatch && mode === "together";
  const family: ArcadeFamily = { mode, strength, names: together ? match.names : [name, { gentle: "Bibi", steady: "Bibi ••", zippy: "Bibi •••" }[strength]] };
  const helperUsed = useRef(person.helper);
  useEffect(() => { if (playing && person.helper) helperUsed.current = true; }, [playing, person.helper]);
  const [chestOffer, setChestOffer] = useState<ChestOffer | null>(null);
  const identity = `${owner.id}:${store.epoch}`;
  const lastIdentity = useRef(identity);
  useEffect(() => {
    if (lastIdentity.current === identity) return;
    lastIdentity.current = identity;
    // Invalidate the old round without closing Settings or moving the map.
    setPlaying(false); setPaused(false); setResult(null); setRound("");
    setSavedReef(undefined); setChestOffer(null);
    setName(owner.id === "family" ? "Family" : owner.name);
  }, [identity, owner.id, owner.name]);
  function openChest() { if (person.chest?.game !== game.id) return; setChestOffer(person.chest); setSheet("chest"); }
  function closeChest() { setSheet(null); setChestOffer(null); }
  const startAfterTeach = useRef(false), credited = useRef(""), [reminder, setReminder] = useState(false), scroll = useRef<ScrollView>(null);
  const active = foreground && playing && !paused && !sheet, sound = useArcadeAudio(game.id, store.save.settings, store.save.arcade?.music ?? false, foreground && !paused, !!sheet);
  useEffect(() => { markArcadePlaying(active); return () => markArcadePlaying(false); }, [active]);
  const { arcade } = store;
  useEffect(() => { arcade({ type: "visit", game: game.id }, expected); }, [arcade, expected, game.id]);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- Latch a visible pause after external focus/background loss; returning never silently resumes a round.
  useEffect(() => { if (playing && !foreground) setPaused(true); }, [playing, foreground]);
  function toTop() { scroll.current?.scrollTo({ y: 0, animated: false }); }
  function choose(id: LevelId | "endless") {
    if (id === "endless" ? !endlessOpen(p, store.save.arcade?.unlockAll) : !levelOpen(p, id, store.save.arcade?.unlockAll)) return;
    setLevel(id === "endless" ? id : play.level(id)); setResult(null); setPlaying(false); setPaused(false); setSheet(null); toTop();
  }
  function start() {
    // eslint-disable-next-line react-hooks/purity -- This user-invoked Start handler creates round entropy, never called by render.
    const round = `arcade-${Date.now().toString(36)}-${Math.floor(Math.random() * 0x1000000).toString(36)}`;
    // eslint-disable-next-line react-hooks/purity -- User-invoked Start handler, not a render calculation.
    const nextSeed = Math.floor(Math.random() * 0x100000000);
    setSavedReef(undefined); setRound(round); setSeed(nextSeed === seed ? (seed + 1) >>> 0 : nextSeed); setResult(null); setPaused(false); setPlaying(true); setSheet(null);
    helperUsed.current = person.helper;
    if (together) setMatch(previous => ({ ...previous, names: newMatch(previous.names).names }));
    if (level === "endless" || play.familyMatch) store.rememberPlayers(together ? newMatch(match.names).names : [name]);
    sound.say((play.startSpeech ?? play.speech)(level !== "endless" && level?.world === "learn", together)); toTop();
  }
  const onSaveReef = useCallback((state: ReefState) => {
    if (round) arcade({ type: "save-round", session: { version: 1, game: "reef-builder", round, state } }, expected);
  }, [arcade, round, expected]);
  function resumeReef() {
    const session = person.session;
    if (!session || session.game !== game.id) return;
    setSavedReef(session.state); setRound(session.round); setLevel(session.state.level);
    helperUsed.current = session.state.helper || !!session.state.helped;
    setResult(null); setPaused(false); setPlaying(true); setSheet(null); toTop();
  }
  function teach(andStart: boolean) { startAfterTeach.current = andStart; setSheet("teach"); sound.say(play.speech(level !== "endless" && level?.world === "learn", together)); }
  const onResult = useCallback((next: ArcadeResult, helped = false, winner?: 0 | 1 | null) => {
    if (!level || !round || credited.current === round) return;
    credited.current = round;
    if (!arcade({ type: "finish", game: game.id, level: level === "endless" ? level : level.id, stars: next.cleared ? next.stars : 0, score: next.score, round, name: together ? match.names.join(" & ").slice(0, 24) : name }, expected)) return;
    if (together && winner != null) setMatch(previous => settle(previous, winner));
    if (level !== "endless" && level.world === "learn" && next.cleared) {
      const credit = play.learningSkill(level);
      if (credit) {
        const { skill, config } = credit, assisted = helped || helperUsed.current;
        store.recordWarmup([{ skill, helped: assisted }], config, round, expected.epoch); store.notePractice(skill, assisted, expected.epoch);
      }
    }
    sound.tone(next.cleared ? "clear" : "shell-0");
    setReminder(arcadeBreakDue(store.save.arcade?.breakMinutes ?? 0)); setResult(next); setPlaying(false); setPaused(false); toTop();
    // Store entry points are stable; these snapshots deliberately bind a result to this exact owned round.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arcade, game.id, level, round, name, expected, together, match.names, play]);
  const isLearning = !!level && level !== "endless" && level.world === "learn", levels = play.levels;
  const nextId = level && level !== "endless" ? allLevelIds[allLevelIds.indexOf(level.id) + 1] : undefined;
  const nextOpen = nextId && levelOpen(p, nextId, store.save.arcade?.unlockAll);
  const goal = level ? play.goal?.(level, together) ?? (level === "endless" ? "Make it your own." : level.goals[0]) : "";
  const onTeachPlay = () => { arcade({ type: "coached", game: game.id }, expected); if (startAfterTeach.current) start(); else setSheet(null); };
  const onHear = () => sound.say(play.speech(isLearning, together));
  const board = level && playing ? <play.Board key={round} savedReef={savedReef} onSaveReef={onSaveReef} level={level} seed={seed} helper={person.helper} active={active} outfit={p.outfit} onResult={onResult} onTone={sound.tone} onSay={sound.say} debug={debug || __DEV__} {...arena} family={family}/> : null;
  return <View style={{ flex: 1, backgroundColor: game.color }}>
    <PlayScene Scene={play.Scene} game={game.id} world={level && level !== "endless" ? level.world : "w1"} active={foreground && !paused && !sheet}/>
    <View style={[{ paddingHorizontal: 12, paddingVertical: 7, gap: 8, backgroundColor: "#24536A" }, game.id === "crab-crossing" && playing && { position: "absolute", top: 0, left: 0, right: 0, zIndex: 10, backgroundColor: "#173D4AAA" }]}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 7, alignItems: "center" }}>
        <PressableScale accessibilityRole="button" accessibilityLabel={level ? "Map" : "Arcade"} onPress={() => { if (playing) setSheet("leave"); else if (level) { setLevel(null); setResult(null); toTop(); } else router.replace("/arcade"); }} style={{ minWidth: 48, minHeight: 48, borderRadius: 24, backgroundColor: "#FFF3D7", alignItems: "center", justifyContent: "center" }}><Icon name="back" color="#2E596B"/></PressableScale>
        <View style={{ flex: 1, alignItems: "center" }}><Heading style={{ fontSize: playing ? 16 : 19, color: "#FFF6DE" }}>{game.name}</Heading>{playing && <Copy style={{ color: "#FFF1CE", fontSize: 12 }}>{level === "endless" ? "Free play" : `${game.worlds.find(w => w.id === level?.world)?.name ?? ""} · Level ${level?.index}`}</Copy>}</View>
        {playing ? <PressableScale accessibilityRole="button" accessibilityLabel="Pause" onPress={() => setPaused(true)} style={{ minWidth: 48, minHeight: 48, borderRadius: 24, backgroundColor: "#FFF3D7", alignItems: "center", justifyContent: "center" }}><Svg width={24} height={24} viewBox="0 0 24 24" accessible={false}><Rect x={5} y={4} width={5} height={16} rx={2} fill="#2E596B"/><Rect x={14} y={4} width={5} height={16} rx={2} fill="#2E596B"/></Svg></PressableScale> : <Button quiet compact onPress={() => setSheet("settings")}>Settings</Button>}
      </View>
    </View>
    {playing ? <View testID="arcade-arena" style={{ flex: 1, minHeight: 0, overflow: "hidden" }} onLayout={event => {
      const { width, height } = event.nativeEvent.layout;
      setArena(previous => previous.width === width && previous.height === height ? previous : { width, height });
    }}><SaveStatus/>{board}</View> : <ScrollView ref={scroll} contentContainerStyle={{ flexGrow: 1, width: "100%", paddingBottom: playing ? 0 : 24, gap: 12 }}>
      <SaveStatus/>
      {!level ? <>{person.session?.game === game.id && <View style={{ paddingHorizontal: 16 }}><Button onPress={resumeReef}>Continue saved Reef Builder round</Button><Copy style={{ color: "#FFF4DA", textAlign: "center" }}>Your reef, pieces and moves are saved.</Copy></View>}<LevelMap learnerChip={<LearnerChip/>} game={game} person={person} levels={levels} unlockAll={store.save.arcade?.unlockAll ?? false} onLevel={choose} onOutfits={() => setSheet("outfits")} onChest={openChest} freeBest={freePlayBest(store.save.arcade, game.id)} active={foreground && !sheet} Scene={play.Scene} worldNote={play.worldNote}/>
        <View style={{ paddingHorizontal: 16, gap: 12 }}><Button quiet onPress={() => setSheet("book")}>My sticker book</Button>
        {!!store.save.arcade?.scores.some(s => s.game === game.id) && <View style={{ padding: 16, gap: 8, borderRadius: 24, backgroundColor: "#FFF3D7" }}><Heading style={{ fontSize: 21 }}>Family free-play board</Heading>{store.save.arcade.scores.filter(s => s.game === game.id).sort((a, b) => b.score - a.score).map(s => <Copy key={s.name}>{s.name} · {s.score} points</Copy>)}</View>}</View>
      </> : result ? <View style={{ flex: 1, minHeight: Math.max(0, height - insets.top - insets.bottom - 86), justifyContent: "center", gap: 14, alignItems: "center", paddingHorizontal: 18, maxWidth: 600, width: "100%", alignSelf: "center" }}>
        <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 16 }}><Companion event={result.cleared ? "complete" : result.outcome === "stopped" ? "draw" : "loss"} size={132} active={foreground && !sheet}/>{game.id !== "lagoon-run" && <Hero game={game.id} size={116} outfit={p.outfit} mood={result.cleared ? "happy" : result.outcome === "stopped" ? "idle" : "dizzy"} active={foreground && !sheet}/>}</View><Heading style={{ textAlign: "center", fontSize: 30, color: "#FFF5D8", backgroundColor: "#24536A", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 24 }}>{result.cleared ? play.clearedTitle : result.outcome === "stopped" ? "A lovely place to stop" : "Game over"}</Heading>
        {result.cleared && <StarReveal stars={result.stars} onTone={sound.tone} active={foreground && !sheet}/>}<View style={{ width: "100%", gap: 10, backgroundColor: "#24536A", padding: 14, borderRadius: 20 }}>{game.id === "fruit-bat-flight" ? <View style={{flexDirection:"row",alignItems:"center",justifyContent:"center",gap:18}}><ShellMedal score={result.score}/><View style={{gap:3}}><Copy style={{color:"#FFF3D5",fontWeight:"900",fontSize:24}}>Score  {result.score}</Copy><Copy style={{color:"#FFF3D5",fontWeight:"800",fontSize:18}}>Best  {Math.max(p.best,result.score)}</Copy><Copy style={{color:"#D5E9E2",fontSize:12}}>Best across all modes</Copy></View></View> : <><Copy style={{ textAlign: "center", color: "#FFF3D5", fontSize: 16 }}>{result.detail}</Copy><View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 20 }}><Copy style={{ color: "#FFF3D5", fontWeight: "800" }}>Score {result.score}</Copy><Copy style={{ color: "#FFF3D5", fontWeight: "800" }}>{bestLabel} {Math.max(p.best, result.score)}</Copy></View></>}</View>
        {level !== "endless" && <Copy style={{ color: "#FFF3D5", backgroundColor: "#24536A", borderRadius: 16, padding: 12, textAlign: "center" }}>{nextStarGoal(level.goals, Math.max(result.stars, p.stars[level.id] ?? 0))}</Copy>}
        {game.id === "fruit-bat-flight" && <View style={{width:"100%"}}><Button onPress={start}>Fly again</Button></View>}
        {together && <Heading style={{ fontSize: 21, textAlign: "center", color: "#FFF4DA", backgroundColor: "#24536A", padding: 10, borderRadius: 16 }}>{match.names[0]} {match.wins[0]} : {match.wins[1]} {match.names[1]}</Heading>}
        {reminder && <View style={{ padding: 18, gap: 10, backgroundColor: "#FFF0CA", borderRadius: 24 }}><Heading style={{ fontSize: 23 }}>A little island break?</Heading><Copy>Your stars are saved. Stretch, have a drink, or keep playing together.</Copy><Button quiet onPress={() => { acknowledgeArcadeBreak(); setReminder(false); }}>Thanks · I’m comfortable</Button></View>}
        {result.cleared && person.chest?.round === round && <PressableScale accessibilityRole="button" accessibilityLabel="A sticker chest · see what’s inside" onPress={() => { sound.say("arcade-chest"); openChest(); }} style={{ width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 16, padding: 10, borderRadius: 28, backgroundColor: "#FFF1CF", borderWidth: 3, borderColor: "#DFB363" }}><ChestArt sticker={person.chest.sticker} size={112} active={foreground && !sheet}/><View style={{ flexShrink: 1 }}><Heading style={{ fontSize: 21 }}>A sticker chest!</Heading><Copy style={{ fontSize: 14 }}>See what’s inside →</Copy></View></PressableScale>}
        <BadgeResultCard round={round}/><View style={{ width: "100%", gap: 9 }}>{nextOpen && result.cleared && <Button onPress={() => choose(nextId!)}>Next level</Button>}<View style={{ flexDirection: "row", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>{game.id !== "fruit-bat-flight" && <Button quiet compact onPress={start}>{result.cleared || result.outcome === "stopped" ? "Play again" : "Try again"}</Button>}<Button quiet compact onPress={() => { setLevel(null); setResult(null); toTop(); }}>Map</Button></View></View>
      </View> : !playing ? <View style={{ flexGrow: 1, minHeight: Math.max(0, height - insets.top - insets.bottom - 162), justifyContent: "center", alignItems: "center", paddingHorizontal: 16, paddingBottom: 10 }}>
        <Hero game={game.id} size={132} outfit={p.outfit} active={foreground && !sheet}/>
        <View style={{ width: "100%", maxWidth: 480, backgroundColor: "#FFF4DA", borderRadius: 32, borderWidth: 3, borderColor: "#DCC28F", padding: 22, gap: 16, alignItems: "center", boxShadow: "0 8px 0 #285B70" }}>
          <Copy style={{ color: game.color, fontSize: 14, textAlign: "center" }}>{level === "endless" ? "Free play" : `${game.worlds.find(w => w.id === level.world)?.name} · Level ${level.index}`}</Copy><Heading style={{ textAlign: "center", fontSize: 29 }}>{level === "endless" ? "Make it your own" : level.name}</Heading>
          <Heading style={{ textAlign: "center", fontSize: 20 }}>{goal}</Heading>{person.session?.game === game.id && <Copy style={{ textAlign: "center", fontSize: 14 }}>Starting a new round replaces your saved reef. Use Map to continue it instead.</Copy>}
          <View style={{ width: "100%", gap: 9 }}>{level === "endless" ? <Copy style={{ textAlign: "center" }}>Your own pace. Finish whenever you like.</Copy> : level.goals.map((goal, i) => <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}><StarDisplay stars={i + 1} size={17}/><Copy style={{ flex: 1, color: "#345A61", fontSize: i === 0 ? 19 : 14, fontWeight: i === 0 ? "800" : "500" }}>{goal}</Copy></View>)}</View>
          <View style={{ width: "100%" }}><ToggleRow label="Helper" detail={level === "endless" ? game.id === "fruit-bat-flight" ? "Slower flight. One heart in free play. No level stars." : "Slower play. No level stars in free play." : play.helperDetail ?? "Slower play. Five hearts. Same stars."} value={person.helper} onChange={value => arcade({ type: "helper", value }, expected)}/></View>
          {play.familyMatch && <FamilySetup mode={mode} strength={strength} match={match} onMode={setMode} onStrength={setStrength} onMatch={setMatch}/>}
          {level === "endless" && !together && <View style={{ width: "100%", gap: 10 }}><Copy>Name for the local family board</Copy><TextInput accessibilityLabel="Free-play player name" value={name} maxLength={24} onChangeText={setName} style={styles.input}/><View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>{store.save.players?.map(n => <Chip key={n} selected={name === n} onPress={() => setName(n)}>{n}</Chip>)}</View></View>}
          <View style={{ width: "100%" }}><Button quiet compact onPress={() => teach(false)}>How to play · show me</Button></View>
        </View>
      </View> : board}
    </ScrollView>}
    {!playing && level && !result && <View testID="arcade-start-dock" style={{ paddingHorizontal: 16, paddingVertical: 10, backgroundColor: "#FFF4DA", borderTopWidth: 2, borderColor: "#DCC28F" }}><View style={{ width: "100%", maxWidth: 480, alignSelf: "center" }}><Button onPress={() => { if (p.coached) start(); else teach(true); }}>{p.coached ? "Let’s play" : "Show me & play"}</Button></View></View>}
    <Sheet visible={paused && !sheet} title="Your game is paused" onClose={() => setPaused(false)}><View style={{ alignItems: "center" }}><Hero game={game.id} size={100} outfit={p.outfit} active={false}/></View><Button onPress={() => setPaused(false)}>Resume play</Button><ToggleRow label="Helper" detail={level === "endless" ? game.id === "fruit-bat-flight" ? "Slower flight. One heart in free play. No level stars." : "Slower play. No level stars in free play." : play.helperDetail ?? "Slower play. Five hearts. Same stars."} value={person.helper} onChange={value => arcade({ type: "helper", value }, expected)}/><Button quiet onPress={() => teach(false)}>How to play</Button><Button quiet onPress={() => { setPaused(false); setLevel(null); setResult(null); setPlaying(false); }}>Back to level map</Button></Sheet>
    <Sheet visible={sheet === "leave"} title="Back to the map?" onClose={() => setSheet(null)}><Copy>{person.session?.round === round ? "Your reef is saved. Continue this round from the map next time." : "This round will start fresh next time. Your earned stars and stickers are saved."}</Copy><Button onPress={() => { setSheet(null); setPlaying(false); setLevel(null); setResult(null); }}>Leave round · back to map</Button><Button quiet onPress={() => setSheet(null)}>Keep playing</Button></Sheet>
    <Sheet visible={sheet === "teach"} title="Show me" onClose={() => { startAfterTeach.current = false; setSheet(null); }}>{play.Teach ? <PlayTeaching goal={goal} detail={play.teachingDetail?.(isLearning, together) ?? ""} onHear={onHear} onPlay={onTeachPlay}><play.Teach learning={isLearning} together={together} goal={goal} onTone={sound.tone}/></PlayTeaching> : <Teaching game={game} learning={isLearning} onHear={onHear} onPlay={onTeachPlay}/>}</Sheet>
    <Sheet visible={sheet === "book"} title="Sticker book" onClose={() => setSheet(null)}><StickerBook person={person}/></Sheet>
    <Sheet visible={sheet === "outfits"} title={game.hero} onClose={() => setSheet(null)}><OutfitCloset game={game} person={person} onSelect={outfit => arcade({ type: "outfit", game: game.id, outfit }, expected)}/></Sheet>
    <Sheet visible={sheet === "chest"} title="A little treasure" onClose={closeChest}>{chestOffer?.game === game.id && <TreasureChest key={chestOffer.round} offer={chestOffer} game={game} expected={expected} active={foreground && sheet === "chest"} onClose={closeChest}/>}</Sheet>
    <Settings visible={sheet === "settings"} onClose={() => setSheet(null)}/>
  </View>;
}
