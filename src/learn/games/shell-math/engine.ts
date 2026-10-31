import type { LearnEngine } from "../../types";
import { createRound, type MathGame, type MathRound, validRound } from "./round";
export { mathMove, mathConfig, questionOf, type MathRound, type MathAction } from "./round";

const skills = Object.fromEntries(([10, 20] as const).flatMap(limit => [
  [`num.add-within-${limit}`, `Adding within ${limit}`],
  [`num.subtract-within-${limit}`, `Taking away within ${limit}`],
  [`num.missing-within-${limit}`, `Missing numbers within ${limit}`],
]));
export function mathEngine(game: MathGame, text: Pick<LearnEngine<MathRound>, "name" | "tagline" | "description" | "help">): LearnEngine<MathRound> {
  return {
    id: game, ...text, island: "numbers", color: "#246858", surface: "#E5EFE5",
    modes: ["solo", "together"], paces: ["easy", "medium", "hard"], mathControls: true,
    paceLabels: { easy: "Within 10", medium: "Within 20" },
    paceHelp: game === "quick-practice" ? { easy: "Three questions, including a missing number.", medium: "Three questions, including a missing number." } : undefined,
    introAudio: `${game}-intro`, helpAudio: `${game}-help`, skills,
    create: (o, c) => createRound(o, game, c.rng),
    validate: (v, o): v is MathRound => validRound(v, o, game),
    outcome: s => s.index === s.questions.length ? "done" : null,
  };
}
export const engine = mathEngine("shell-math", {
  name: "Shell Math", tagline: "Join shells. Take some away.",
  description: "Tap to join shells or take them away, then choose the number that fits. Five little discoveries, with no clock.",
  help: "Look at the equation. Tap Join one shell for addition, or Take away one shell for subtraction. Count the shells left on the sand, then choose an answer. Show me fills in the picture and equation so you can try together. You can always try again. Tap Next when you are ready.",
});
