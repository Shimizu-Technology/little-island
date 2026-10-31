import React from "react";
import { View } from "react-native";
import type { PracticeSettings } from "../practice/types";
import type { ArcadeSceneProps } from "./PlayScene";
import type { ArcadeTeachProps } from "./PlayTeaching";
import type { ArcadeFamily } from "./FamilySetup";
import { Scenery } from "./games/scrolling/Art";
import { Rehearsal } from "./games/scrolling/Teaching";
import { ScrollBoard } from "./games/scrolling/Board";
import { flightLevel, flightLevels, runLevel, runLevels } from "./games/scrolling/content";
import { createRail, railLevel, railLevels } from "./games/rail-parade/engine";
import { RailBoard } from "./games/rail-parade/View";
import { createCrab, crabLevel, crabLevels } from "./games/crab-crossing/engine";
import { CrabBoard } from "./games/crab-crossing/View";
import { GridBackdrop } from "./games/grid/Art";
import { GridTeaching } from "./games/grid/Teaching";
import { createPalm, palmLevel, palmLevels } from "./games/palm-patrol/engine";
import { beachLevel, beachLevels, createBeach } from "./games/beach-ball/engine";
import { Scene as ActionScene } from "./action/Art";
import { Demo, actionInstruction } from "./action/Teaching";
import { BeachBoard, PalmBoard } from "./action/Playfield";
import { wordEntry } from "../learn/kit/reading";
import type { ArcadeId, ArcadeLevel, ArcadeResult, LevelId } from "./types";
import type { OutfitId } from "./progress";
import { createReef, reefLevel, reefLevels, type ReefState } from "./games/reef-builder/engine";
import { ReefBoard } from "./games/reef-builder/View";
import { createSong, songLevel, songLevels } from "./games/shell-song/engine";
import { SongBoard } from "./games/shell-song/View";
import { createCargo, cargoLevel, cargoLevels } from "./games/canoe-cargo/engine";
import { CargoScene } from "./games/canoe-cargo/Art";
import { CargoBoard } from "./games/canoe-cargo/View";

/** Everything the shared game screen needs to start and frame one round of a game. */
export type ArcadeBoardProps = {
  level: ArcadeLevel | "endless";
  seed: number;
  savedReef?: ReefState;
  onSaveReef?: (state: ReefState) => void;
  helper: boolean;
  active: boolean;
  outfit: OutfitId;
  onResult: (result: ArcadeResult, helped?: boolean, winner?: 0 | 1 | null) => void;
  onTone: (tone: string, haptic?: boolean) => void;
  onSay: (key: string, automatic?: boolean) => boolean;
  debug: boolean;
  /** Measured space below the shared top bar, excluding native safe areas. */
  width: number;
  height: number;
  family: ArcadeFamily;
};
export type ArcadePlay = {
  levels: readonly ArcadeLevel[];
  level: (id: LevelId) => ArcadeLevel;
  /** Speech key for the teaching sheet and the level-start button. */
  speech: (learning: boolean, together?: boolean) => string;
  /** Optional different key spoken when a round starts (e.g. the level goal). */
  startSpeech?: (learning: boolean) => string;
  clearedTitle: string;
  Scene?: React.ComponentType<ArcadeSceneProps>;
  Teach?: React.ComponentType<ArcadeTeachProps>;
  teachingDetail?: (learning: boolean, together: boolean) => string;
  goal?: (level: ArcadeLevel | "endless", together: boolean) => string;
  fullBleed?: boolean;
  familyMatch?: boolean;
  worldNote?: (world: ArcadeLevel["world"]) => string | undefined;
  /** What Helper does in this game, shown on the level-start card and in pause. */
  helperDetail?: string;
  /** Skill credited when a learning-world level is cleared. */
  learningSkill: (level: ArcadeLevel) => { skill: string; config: PracticeSettings } | null;
  Board: (props: ArcadeBoardProps) => React.ReactElement;
};

const practice = (subject: "math" | "reading", limit: 10 | 20 = 10): PracticeSettings => ({ enabled: true, subject, limit, operation: "mixed" });
/** Preserve the grid screens' safe-area sizing without letting a scroll view swallow swipes. */
function gridSize(p: ArcadeBoardProps, crab: boolean) {
  const wide = p.width > p.height;
  return { wide, size: Math.max(160, Math.min(p.width - (wide ? 275 : 20), (p.height - (wide ? 53 : 208)) * (crab ? 9 / 11 : 1), 830)) };
}
const stormNote = (world: ArcadeLevel["world"]) => world === "w3" ? "Storm trails from level 5" : undefined;
/**
 * One entry per playable game. Adding a game means adding an entry here; the shared
 * screen (ArcadeScreen) never branches on game ids.
 */
export const arcadePlays: Record<ArcadeId, ArcadePlay> = {
  "reef-builder": {
    fullBleed: true,
    helperDetail: "Show a fit points to a place that works. Same stars.",
    levels: reefLevels,
    level: reefLevel,
    speech: learning => (learning ? "arcade-reef-ten" : "arcade-reef-intro"),
    goal: level => level !== "endless" && level.world === "learn" ? "Make ten. Let the fish swim free." : "Fill a line. Let the fish swim free.",
    clearedTitle: "A happier little reef",
    learningSkill: () => ({ skill: "num.make-ten", config: practice("math") }),
    Board: p => <ReefBoard width={p.width} height={p.height} initial={p.savedReef ?? createReef(p.level === "endless" ? p.level : reefLevel(p.level.id), p.seed, p.helper)} onSave={p.onSaveReef} active={p.active} helper={p.helper} onResult={p.onResult} onTone={p.onTone} />,
  },
  "shell-song": {
    fullBleed: true,
    levels: songLevels,
    level: songLevel,
    speech: learning => (learning ? "arcade-song-word" : "arcade-song-intro"),
    goal: level => level !== "endless" && level.world === "learn" ? "Hear the sounds. Find their picture." : "Watch the shells. Echo their song.",
    clearedTitle: "A song worth sharing",
    learningSkill: level => ({ skill: wordEntry(songLevel(level.id).word!)!.skill, config: practice("reading") }),
    Board: p => <SongBoard width={p.width} height={p.height} initial={createSong(p.level === "endless" ? p.level : songLevel(p.level.id), p.seed, p.helper)} active={p.active} helper={p.helper} outfit={p.outfit} onResult={p.onResult} onTone={p.onTone} onSay={p.onSay} debug={p.debug} />,
  },
  "canoe-cargo": {
    fullBleed: true,
    helperDetail: "Slower falling and fewer tide rows. Same stars.",
    Scene: p => <CargoScene world={p.world}/>,
    levels: cargoLevels,
    level: cargoLevel,
    speech: learning => (learning ? "arcade-cargo-sum" : "arcade-cargo-intro"),
    startSpeech: learning => (learning ? "arcade-cargo-sum-goal" : "arcade-cargo-goal"),
    goal: level => level !== "endless" && level.world === "learn" ? "Pack a row that makes the sum." : "Pack full rows. Send the cargo sailing.",
    clearedTitle: "Cargo away, captain!",
    learningSkill: level => {
      const sum = cargoLevel(level.id).targetSum ?? 10;
      return { skill: `num.add-within-${sum <= 10 ? 10 : sum <= 20 ? 20 : 100}`, config: practice("math") };
    },
    Board: p => <CargoBoard width={p.width} height={p.height} initial={createCargo(p.level === "endless" ? p.level : cargoLevel(p.level.id), p.seed, p.helper)} active={p.active} helper={p.helper} outfit={p.outfit} onResult={p.onResult} onTone={p.onTone} debug={p.debug} />,
  },
  "fruit-bat-flight": {
    levels: flightLevels,
    level: flightLevel,
    speech: learning => learning ? "arcade-flight-math" : "arcade-flight-intro",
    clearedTitle: "Golden wings!", fullBleed: true, worldNote: stormNote,
    goal: level => level !== "endless" && level.world === "learn" ? "Fly through the answer." : "Tap to flap. Follow the glowing fruit.",
    Scene: p => <Scenery game="fruit-bat-flight" world={p.world}/>,
    Teach: p => <Rehearsal game="fruit-bat-flight" learning={p.learning} onTone={p.onTone}/>,
    teachingDetail: learning => learning ? "The flight slows down for numbers. A wrong gate just comes around again." : "Tap anywhere for a flap, then glide.",
    learningSkill: level => ({ skill: `num.${level.index >= 5 && level.index % 2 === 0 ? "subtract" : "add"}-within-${level.index < 5 ? 10 : 20}`, config: practice("math", level.index < 5 ? 10 : 20) }),
    Board: p => <ScrollBoard game="fruit-bat-flight" {...p} level={p.level === "endless" ? p.level : flightLevel(p.level.id)}/>,
  },
  "lagoon-run": {
    levels: runLevels,
    level: runLevel,
    speech: learning => learning ? "arcade-run-math" : "arcade-run-intro",
    clearedTitle: "What a run!", fullBleed: true, worldNote: stormNote,
    goal: level => level !== "endless" && level.world === "learn" ? "Run into the answer lane." : "Swipe to steer. Jump up. Duck down.",
    Scene: p => <Scenery game="lagoon-run" world={p.world}/>,
    Teach: p => <Rehearsal game="lagoon-run" learning={p.learning} onTone={p.onTone}/>,
    teachingDetail: learning => learning ? "The run slows down for numbers. A wrong lane just comes around again." : "Swipe left or right. Jump coconuts and duck under palm fronds.",
    learningSkill: level => ({ skill: `num.${level.index >= 5 && level.index % 2 === 0 ? "subtract" : "add"}-within-${level.index < 5 ? 10 : 20}`, config: practice("math", level.index < 5 ? 10 : 20) }),
    Board: p => <ScrollBoard game="lagoon-run" {...p} level={p.level === "endless" ? p.level : runLevel(p.level.id)}/>,
  },
  "rail-parade": {
    levels: railLevels, level: railLevel,
    speech: learning => `arcade-rail-${learning ? "learn" : "intro"}`,
    clearedTitle: "Parade party!", fullBleed: true,
    goal: level => level !== "endless" && level.world === "learn" ? railLevel(level.id).word ? `Spell ${railLevel(level.id).word}. Find each letter.` : "Collect the numbers in order." : "Lead the chicks home. Watch for the tree snake!",
    Scene: p => <GridBackdrop crab={false} {...p}/>,
    Teach: p => <GridTeaching crab={false} learning={p.learning}/>,
    teachingDetail: learning => learning ? "The world waits for your next swipe. Take all the time you need." : "Mama walks on her own. Swipe or tap to turn. Avoid the edge, the parade, and the brown tree snake.",
    learningSkill: level => { const word = railLevel(level.id).word; return { skill: word ? wordEntry(word)!.skill : "num.count-on", config: practice(word ? "reading" : "math") }; },
    Board: p => <View style={{ flex: 1, paddingHorizontal: 7, paddingBottom: 8 }}><RailBoard initial={createRail(p.level === "endless" ? p.level : railLevel(p.level.id), p.seed, p.helper)} {...p} {...gridSize(p, false)} onResult={result => p.onResult(result, result.stars < 3)}/></View>,
  },
  "crab-crossing": {
    levels: crabLevels, level: crabLevel,
    speech: learning => `arcade-crab-${learning ? "learn" : "intro"}`,
    clearedTitle: "Home by the sea!", fullBleed: true,
    goal: level => level !== "endless" && level.world === "learn" ? `${crabLevel(level.id).name}. Hop to the next number.` : "Look, hop, ride. Reach the seaside burrow!",
    Scene: p => <GridBackdrop crab {...p}/>,
    Teach: p => <GridTeaching crab learning={p.learning}/>,
    teachingDetail: learning => learning ? "The world waits for your next hop. Tap forward or swipe to move. Take all the time you need." : "Tap anywhere to hop forward. Swipe sideways or back. Wait on the sand, look for traffic gaps, and ride the wide logs. The small arrows work too.",
    learningSkill: () => ({ skill: "num.number-line", config: practice("math") }),
    Board: p => <CrabBoard initial={createCrab(p.level === "endless" ? p.level : crabLevel(p.level.id), p.seed, p.helper)} {...p} size={p.width} wide={p.width > p.height} onResult={result => p.onResult(result, result.stars < 3)}/>,
  },
  "palm-patrol": {
    levels: palmLevels, level: palmLevel,
    speech: learning => learning ? "arcade-palm-math" : "arcade-palm-intro",
    clearedTitle: "Happy palms!", fullBleed: true,
    goal: level => actionInstruction(true, level !== "endless" && level.world === "learn"),
    Scene: p => <ActionScene palm {...p}/>,
    Teach: p => <Demo palm learning={p.learning}/>,
    teachingDetail: learning => learning ? "The matching number catches a husk. Other numbers bounce it back. Release, then press again for each new fact. Take as long as you like." : "Slide anywhere to move Coco. Tap to toss. Fronds bounce beetles back; each frond can take 3 bumps. Beetles fly away dizzy into nets.",
    learningSkill: level => ({ skill: level.index === 4 || level.index >= 7 ? "num.subtract-within-20" : "num.add-within-20", config: practice("math") }),
    Board: p => <PalmBoard initial={createPalm(p.level === "endless" ? p.level : palmLevel(p.level.id), p.seed, p.helper)} {...p}/>,
  },
  "beach-ball": {
    helperDetail: "A bigger paddle and a slower ball. Same stars.",
    levels: beachLevels, level: beachLevel,
    speech: (learning, together) => together ? "arcade-beach-together" : learning ? "arcade-beach-count" : "arcade-beach-intro",
    clearedTitle: "What a splash!", fullBleed: true, familyMatch: true,
    goal: (level, together) => actionInstruction(false, level !== "endless" && level.world === "learn", together),
    Scene: p => <ActionScene palm={false} {...p}/>,
    Teach: p => <Demo palm={false} learning={p.learning}/>,
    teachingDetail: (_, together) => together ? "Player 1 is ● at the bottom. Player 2 is ◆ at the top. Drag in your own half. First to the star goal wins!" : "You are ● at the bottom. Drag in your half to return the ball. Hit with the paddle’s edge to angle the ball.",
    // Shared counting is not evidence of an independently answered fact. The chest records actual practice.
    learningSkill: () => null,
    Board: p => <BeachBoard initial={createBeach(p.level === "endless" ? p.level : beachLevel(p.level.id), p.seed, p.helper, p.family.mode, p.family.strength)} {...p} names={p.family.names} onResult={(result, winner) => p.onResult(result, undefined, winner)}/>,
  },
};
