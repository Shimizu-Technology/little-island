import { mathEngine } from "../shell-math/engine";
export { mathMove, mathConfig, questionOf, type MathRound, type MathAction } from "../shell-math/round";
export const engine = mathEngine("quick-practice", {
  name: "Quick Practice", tagline: "Three questions. Take your time.",
  description: "Choose the number that fills the gap. Try addition, subtraction and a missing number. Show me is always here to help.",
  help: "Look at the equation and choose the number that belongs in the gap. Sometimes the missing number is in the middle. Show me uses shells to show what joins or leaves the group and fills in the equation. You can try again as often as you like. After three questions, your round is done. There is no clock.",
});
