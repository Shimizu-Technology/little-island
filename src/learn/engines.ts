import { engine as logicLagoon } from "./games/logic-lagoon/engine";
import { engine as shapeShift } from "./games/shape-shift/engine";
import { engine as patternPath } from "./games/pattern-path/engine";
import { engine as spaceStation } from "./games/space-station/engine";
import { engine as foodWeb } from "./games/food-web/engine";
import { engine as weatherWatch } from "./games/weather-watch/engine";
import type { LearnEngine, LearnId , Island } from "./types";
import { withGrowth } from "./growth/engine";
import { engine as reefRace } from "./games/reef-race/engine";
import { engine as islandMarket } from "./games/island-market/engine";
import { engine as soundBoat } from "./games/sound-boat/engine";
import { engine as turtleTales } from "./games/turtle-tales/engine";
import { engine as whichOne } from "./games/which-one/engine";
import { engine as tidePool } from "./games/tide-pool/engine";
import { engine as floatSink } from "./games/float-sink/engine";
import { engine as crabCommands } from "./games/crab-commands/engine";
import { engine as hafaAdai } from "./games/hafa-adai/engine";
import { engine as shellMath } from "./games/shell-math/engine";
import { engine as numberHop } from "./games/number-hop/engine";
import { engine as quickPractice } from "./games/quick-practice/engine";
import { engine as timesTide } from "./games/times-tide/engine";
import { engine as fractionFeast } from "./games/fraction-feast/engine";
import { engine as treasureAlgebra } from "./games/treasure-algebra/engine";
import { engine as beepBot } from "./games/beep-bot/engine";
import { engine as turtleDraw } from "./games/turtle-draw/engine";
import { stubEngine } from "./stub";
import { engine as tideLogic } from "./games/tide-logic/engine";
import { engine as codeLab } from "./games/code-lab/engine";

/** Pure engines (no React): safe to import from save validation and tests. */
import { engine as letterLagoon } from "./games/letter-lagoon/engine";
import { engine as wordWorkshop } from "./games/word-workshop/engine";
import { engine as storyStudio } from "./games/story-studio/engine";
const originalEngines: Record<LearnId, LearnEngine<unknown>> = {
  "reef-race": reefRace as LearnEngine<unknown>,
  "island-market": islandMarket as LearnEngine<unknown>,
  "sound-boat": soundBoat as LearnEngine<unknown>,
  "turtle-tales": turtleTales as LearnEngine<unknown>,
  "which-one": whichOne as LearnEngine<unknown>,
  "tide-pool": tidePool as LearnEngine<unknown>,
  "float-sink": floatSink as LearnEngine<unknown>,
  "crab-commands": crabCommands as LearnEngine<unknown>,
  "hafa-adai": hafaAdai as LearnEngine<unknown>,
  "shell-math": shellMath as LearnEngine<unknown>,
  "number-hop": numberHop as LearnEngine<unknown>,
  "quick-practice": quickPractice as LearnEngine<unknown>,
  "beep-bot": beepBot as LearnEngine<unknown>,
  "turtle-draw": turtleDraw as LearnEngine<unknown>,
  "tide-logic": tideLogic as LearnEngine<unknown>,
  "code-lab": codeLab as LearnEngine<unknown>,
  "pattern-path": patternPath as LearnEngine<unknown>,
  "shape-shift": shapeShift as LearnEngine<unknown>,
  "logic-lagoon": logicLagoon as LearnEngine<unknown>,
  "weather-watch": weatherWatch as LearnEngine<unknown>,
  "food-web": foodWeb as LearnEngine<unknown>,
  "space-station": spaceStation as LearnEngine<unknown>,
  "times-tide": timesTide as LearnEngine<unknown>,
  "fraction-feast": fractionFeast as LearnEngine<unknown>,
  "treasure-algebra": treasureAlgebra as LearnEngine<unknown>,
  "letter-lagoon": letterLagoon as LearnEngine<unknown>,
  "word-workshop": wordWorkshop as LearnEngine<unknown>,
  "story-studio": storyStudio as LearnEngine<unknown>,
};

/** Typical age span of Levels 1–5 for the original twelve games (new games declare their own). */
const originalAges: Partial<Record<LearnId, readonly [number, number]>> = {
  "reef-race": [4, 9], "island-market": [4, 9], "sound-boat": [5, 9], "turtle-tales": [5, 10], "which-one": [5, 9], "tide-pool": [4, 9],
  "float-sink": [4, 9], "crab-commands": [5, 10], "hafa-adai": [4, 12], "shell-math": [4, 9], "number-hop": [4, 9], "quick-practice": [5, 9],
};
export const engines = Object.fromEntries(Object.entries(originalEngines).map(([id, engine]) => [id, withGrowth({ ...engine, ages: engine.ages ?? originalAges[id as LearnId] })])) as Record<LearnId, LearnEngine<unknown>>;

/** Every skill label across games, for the grown-up practice view. */
export const skillLabels = (): Record<string, string> =>
  Object.values(engines).reduce<Record<string, string>>((all, e) => ({ ...all, ...e.skills }), {});
