import { mathEngine } from "../shell-math/engine";
export { mathMove, mathConfig, questionOf, type MathRound, type MathAction } from "../shell-math/round";
export const engine = mathEngine("number-hop", {
  name: "Number Hop", tagline: "Hop forward. Hop back.",
  description: "Start on a number and tap to hop. Forward adds; backward takes away. Five questions, at your own pace.",
  help: "Start at the circled number. For addition, tap Hop forward one. For subtraction, tap Hop back one. Each arrow is one hop. The number line follows you. When all the hops are made, choose the number where you landed. Show me draws the hops and fills in the equation. Tap Next when you are ready. There is no clock.",
});
