import type { LearnId } from "./types";
import type { LearningLevel } from "./levelOptions";
import { growthTrack } from "./growth/content";
import { engines } from "./engines";

export { levelNumbers, levelOf, optionsAtLevel, levelStage } from "./levelOptions";
export type { LearningLevel } from "./levelOptions";

type LevelName = { name: string; description: string };
const foundation: Record<LearnId, readonly [LevelName, LevelName, LevelName]> = {
  "reef-race": [
    { name: "Hop to 30", description: "Count along stones 1–30 with a spinner showing 1, 2 or 3." },
    { name: "Hop to 60", description: "Count along stones 1–60 with one die." },
    { name: "Two dice to 100", description: "Add two dice and count along stones 1–100." },
  ],
  "island-market": [
    { name: "Little mango orders", description: "Count 3–9, pack teens, then add two small orders." },
    { name: "Crates of ten", description: "Pack tens and ones and add tens within 100." },
    { name: "Orders and change", description: "Add, take away and give change with pretend shell coins." },
  ],
  "sound-boat": [
    { name: "Cat, hen and sun", description: "Spell short-vowel words, then change one sound in a word ladder." },
    { name: "Fish, crab and kite", description: "Spell blends, two-letter sounds and silent-e words." },
    { name: "Sheep, boat and star", description: "Spell vowel teams and r-controlled words, with an easier first word." },
  ],
  "turtle-tales": [
    { name: "Little word stories", description: "Read short-vowel stories and match each page to its picture." },
    { name: "Stories with blends", description: "Read stories with blends and digraphs and choose matching pictures." },
    { name: "Longer vowel stories", description: "Read stories with vowel teams and silent-e words and match pictures." },
  ],
  "which-one": [
    { name: "Little word pictures", description: "Read short-vowel sentences and choose the picture that matches every word." },
    { name: "Blends in pictures", description: "Read sentences with blends and digraphs and spot the matching details." },
    { name: "Vowels in pictures", description: "Read sentences with vowel teams and silent-e words and compare details." },
  ],
  "tide-pool": [
    { name: "Tide pool homes", description: "Find food and homes for creatures and help the coral." },
    { name: "Sunshine and tides", description: "Explore habitat needs, sunshine and changing water." },
    { name: "Fish, coral and heat", description: "Add questions about fish breathing and the effects of heat." },
  ],
  "float-sink": [
    { name: "First floating finds", description: "Predict six everyday objects, then load a boat with pebbles." },
    { name: "Floating surprises", description: "Compare seven objects and test a boat's capacity." },
    { name: "Shape and trapped air", description: "Compare eight objects, including a shape or air pair, and smaller boats." },
  ],
  "crab-commands": [
    { name: "Follow the arrows", description: "Build arrow paths on three beaches, from short to longer." },
    { name: "Walk and turn", description: "Plan paths using forward, left turns and right turns." },
    { name: "Do it again", description: "Use Again ×2 to repeat the previous command two more times." },
  ],
  "hafa-adai": [
    { name: "Six picture friends", description: "Explore six reviewed words or find pictures with visible English help." },
    { name: "Eight picture friends", description: "Explore eight reviewed words; English help in I spy is behind Peek." },
    { name: "Twelve picture friends", description: "Explore twelve reviewed words; use Peek for English help in I spy." },
  ],
  "shell-math": [
    { name: "Shell sums to 10", description: "Join or take away within 10, starting with two small questions." },
    { name: "Shell sums to 20", description: "Join or take away within 20, starting with two small questions." },
    { name: "More sums to 20", description: "Join or take away within 20 throughout the round, without the small-number warm-up." },
  ],
  "number-hop": [
    { name: "Number hops to 10", description: "Hop forward or back within 10, starting with two small questions." },
    { name: "Number hops to 20", description: "Hop forward or back within 20, starting with two small questions." },
    { name: "More hops to 20", description: "Hop within 20 throughout the round, without the small-number warm-up." },
  ],
  "quick-practice": [
    { name: "Find numbers to 10", description: "Solve three equations within 10, including a missing number." },
    { name: "Find numbers to 20", description: "Solve three equations within 20 after two small warm-up questions." },
    { name: "Missing number first", description: "Start with a missing number and use the full range within 20 throughout." },
  ],
  "beep-bot": [{ name: "One little path", description: "Put arrows in order." }, { name: "Around the corner", description: "Turn toward a shell." }, { name: "Find a way", description: "Go around sandcastles." }],
  "turtle-draw": [{ name: "Lines in sand", description: "Draw lines and corners." }, { name: "Four sides", description: "Trace squares and rectangles." }, { name: "Loop a shape", description: "Repeat to draw polygons." }],
  "tide-logic": [{ name: "Colour gates", description: "Sort by one colour." }, { name: "Big or small", description: "Sort by size." }, { name: "Two clues", description: "Join clues with and or or." }],
  "code-lab": [{ name: "Say and step", description: "Sequence actions and see the text." }, { name: "Scores and loops", description: "Update a variable and repeat a step." }, { name: "Make a function", description: "Define and call a function with a value." }],
  "pattern-path": [{ name: "Start", description: "Follow the first clues." }, { name: "Explore", description: "Try the next puzzle." }, { name: "Challenge", description: "Use more clues together." }],
  "shape-shift": [{ name: "Start", description: "Follow the first clues." }, { name: "Explore", description: "Try the next puzzle." }, { name: "Challenge", description: "Use more clues together." }],
  "logic-lagoon": [{ name: "Start", description: "Follow the first clues." }, { name: "Explore", description: "Try the next puzzle." }, { name: "Challenge", description: "Use more clues together." }],
  "weather-watch": [{"name": "Weather wardrobe", "description": "Dress for weather and choose safe activities."}, {"name": "Season garden", "description": "Turn the season dial and observe a garden."}, {"name": "Water cycle", "description": "Build evaporation, clouds, rain and runoff."}],
  "food-web": [{"name": "Reef feeding", "description": "Feed reef animals and give algae sunlight."}, {"name": "Food chains", "description": "Build energy paths from producers to consumers."}, {"name": "Branching webs", "description": "Connect branching relationships in a reef web."}],
  "space-station": [{"name": "Day & night", "description": "Rotate Earth to make day and night."}, {"name": "Moon phases", "description": "Orbit the Moon and observe its sunlit shape."}, {"name": "Planet builder", "description": "Place eight planets and compare their sizes."}],
  "times-tide": [{ name: "Fish in equal pools", description: "Make equal groups of 2, 5 or 10 fish." }, { name: "Shell arrays", description: "Build rows and repeated addition." }, { name: "Skip-count reef", description: "Count by groups across a reef array." }],
  "fraction-feast": [{ name: "Fair pie shares", description: "Cut halves and quarters." }, { name: "Fraction footsteps", description: "Find fractions on a number line." }, { name: "Fold the same amount", description: "Build equivalent fractions." }],
  "treasure-algebra": [{ name: "Sunny steps", description: "Add and subtract positive steps on a line." }, { name: "Below sea level", description: "Cross zero into negative depths." }, { name: "Missing treasure", description: "Find the number hiding in a box." }],
  "letter-lagoon": [{ name: "Hello, letters", description: "Hello, letters." }, { name: "Letter twins", description: "Letter twins." }, { name: "First sounds", description: "First sounds." }],
  "word-workshop": [{ name: "Word joinery", description: "Word joinery." }, { name: "Word endings", description: "Word endings." }, { name: "Meaning makers", description: "Meaning makers." }],
  "story-studio": [{ name: "Picture sentences", description: "Picture sentences." }, { name: "Sentence repairs", description: "Sentence repairs." }, { name: "Sentence artists", description: "Sentence artists." }],
};
export function levelInfo(game: LearnId, level: LearningLevel): LevelName {
  const own = engines[game].levelNames?.[level - 1];
  if (own) return own;
  if (level <= 3) return foundation[game][level - 1];
  const track = growthTrack(game, level === 4 ? "stretch" : "deep");
  return track ? { name: track.label, description: track.description } : { name: `Level ${level}`, description: "" };
}
export const levelTitle = (game: LearnId, level: LearningLevel) => `Level ${level} of 5 · ${levelInfo(game, level).name}`;
