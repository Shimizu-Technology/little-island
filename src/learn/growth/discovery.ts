import type { GrowthQuestion, GrowthTracks } from "./types";

function question(id: string, skill: string, skillLabel: string, prompt: string, context: string, answers: string[], explanation: string, scene?: GrowthQuestion["scene"]): GrowthQuestion {
  return { id, skill, skillLabel, prompt, context, choices: answers.map((label, i) => ({ value: String(i), label })), answer: "0", explanation, ...(scene ? { scene } : {}) };
}
const tideCases = [
  { id: "shade", factor: "shade", animal: "coral", a: "Shaded water stayed cooler.", b: "Sunny water became warmer.", held: "the same starting water temperature and amount of water", conclusion: "In these trials, shade helped keep the water cooler." },
  { id: "algae", factor: "amount of algae", animal: "snails", a: "Snails with algae had food to eat.", b: "Snails without algae had no algae to eat.", held: "the same kind and number of snails and the same water", conclusion: "In these trials, the algae provided food for the snails." },
  { id: "shelter", factor: "rock shelter", animal: "crabs", a: "Crabs with a rock could hide underneath it.", b: "Crabs without a rock had no rock to hide under.", held: "the same kind and number of crabs and the same water", conclusion: "The rock provided a hiding place in this model." },
  { id: "tide", factor: "water depth", animal: "fish", a: "The deeper pool still covered the fish.", b: "The shallow pool left part of the fish above water.", held: "the same fish model and pool shape", conclusion: "The deeper pool kept this fish model covered." },
  { id: "heat", factor: "water temperature", animal: "coral", a: "Coral in the cooler trial kept its color.", b: "Coral in the very warm trial became pale.", held: "the same coral model, light and water clarity", conclusion: "Very warm water was linked with pale coral in these trials." },
  { id: "clarity", factor: "water clarity", animal: "seagrass", a: "More light reached the seagrass in clear water.", b: "Less light reached it in cloudy water.", held: "the same light above the water and the same water depth", conclusion: "Clearer water let more light through in these trials." },
];
const tideStretch = tideCases.flatMap(c => [
  question(`${c.id}-fair`, "sci.fair-tests", "Changing one factor", `You want to test ${c.factor}. What should change?`, `Make two trials with ${c.held}.`, [`Only the ${c.factor}`, "Everything at once", "Nothing at all"], `Change only the ${c.factor}. Keep ${c.held} so the comparison can help answer your question.`),
  question(`${c.id}-observe`, "sci.observation-evidence", "Using observations", "Which statement matches the observations?", `${c.a} ${c.b}`, [c.conclusion, "All habitats always act exactly the same.", "There was no difference between the trials."], c.conclusion, { kind: "trials", labels: ["Trial A", "Trial B"], text: `${c.a}\n${c.b}` }),
]);
const tideDeep = tideCases.flatMap(c => [
  question(`${c.id}-transfer`, "sci.transfer-evidence", "Applying evidence carefully", `A new ${c.animal} habitat is different. How should you use this result?`, `${c.a} ${c.b}`, [`Use the result to make a prediction, then test ${c.factor} in the new habitat.`, "Assume every habitat will give exactly the same result.", "Change every setting so you cannot compare."], "Evidence helps make a prediction. A new habitat can have other differences, so compare trials there too."),
  question(`${c.id}-repeat`, "sci.repeated-trials", "Checking a pattern", "What would make this conclusion better supported?", c.conclusion, [`Repeat the comparison, changing only ${c.factor}.`, "Keep only the trial you like best.", "Change two other factors at the same time."], `Repeat trials and look for a consistent pattern. Keep ${c.held}. One scripted example is not proof for every real habitat.`),
]);
const floatCases = [
  { id: "clay", a: "A clay ball sinks.", b: "The same clay shaped into a wide, hollow bowl floats before it fills with water.", factor: "shape", held: "the same amount of clay", result: "Shape can change whether the same clay floats.", bad: "Clay always floats, whatever its shape." },
  { id: "bottle", a: "A capped bottle with air inside floats.", b: "The same bottle filled with water sinks in this trial.", factor: "what fills the bottle", held: "the same bottle", result: "Keeping air inside changed the outcome in this trial.", bad: "The color of the bottle made it sink." },
  { id: "foil", a: "A tightly rolled foil ball sinks in this trial.", b: "The same foil shaped into a broad boat floats.", factor: "shape", held: "the same piece of foil", result: "The broad boat shape held air and floated in this trial.", bad: "Metal can never float." },
  { id: "wood", a: "A small piece of this dry wood floats.", b: "A larger piece of the same dry wood also floats.", factor: "size", held: "the same kind of dry wood", result: "Larger does not always mean sinking.", bad: "Every large object must sink." },
  { id: "load", a: "This boat floats with two identical counters.", b: "This boat sinks with six of those counters.", factor: "number of counters", held: "the same boat and kind of counter", result: "Adding enough weight can make a floating boat sink.", bad: "A boat that floats can never sink." },
  { id: "material", a: "This solid cork block floats.", b: "A solid metal block of the same size sinks.", factor: "material", held: "the same block size and shape", result: "Material matters as well as size and shape.", bad: "Objects of the same size always float or sink together." },
];
const floatStretch = floatCases.flatMap(c => [
  question(`${c.id}-compare`, "sci.material-shape-air", "Comparing material, shape and air", "What changed between these trials?", `${c.a} ${c.b}`, [c.factor, "Only the name of the object", "Nothing"], `The changed factor was ${c.factor}. The comparison used ${c.held}.`, { kind: "trials", labels: ["Trial A", "Trial B"], text: `${c.a}\n${c.b}` }),
  question(`${c.id}-conclude`, "sci.floating-evidence", "Explaining floating observations", "Which idea is supported by these trials?", `${c.a} ${c.b}`, [c.result, c.bad, "The trials tell us nothing about these objects."], `${c.result} These are particular trials; real objects can differ.`),
]);
const capacity = [3, 4, 5, 6, 7, 8].flatMap(n => [
  question(`capacity-${n}`, "sci.capacity-prediction", "Predicting from repeated trials", "What is a reasonable prediction for the next matching trial?", `The same boat held ${n} identical counters, but sank with ${n + 1}, in three trials. Use the same boat and counters again.`, [`It will probably hold ${n} and sink with ${n + 1}.`, `It will certainly hold ${n + 20}.`, "It cannot be tested again."], `Three matching trials support predicting about ${n} counters. A prediction can be checked; it is not a guarantee.`, { kind: "trials", labels: ["Trial 1", "Trial 2", "Trial 3"], values: [n, n, n], text: "Counters held before sinking" }),
  question(`fair-capacity-${n}`, "sci.fair-capacity-test", "Comparing boat capacity fairly", "Which comparison tests the effect of boat shape fairly?", `Boat A held ${n} counters. You want to compare its shape with Boat B.`, ["Use equal pieces of foil, different shapes and the same counters.", "Use a bigger piece of foil and lighter counters for Boat B.", "Use different counters and stop before either boat sinks."], "Use equal amounts of material and the same counters. Then shape is the factor you change."),
]);

export function runArrowProgram(start: readonly number[], commands: readonly string[], size = 5): number[] | null {
  let [x, y] = start;
  for (const c of commands) {
    const d = c === "→" ? [1, 0] : c === "←" ? [-1, 0] : c === "↓" ? [0, 1] : c === "↑" ? [0, -1] : null;
    if (!d) return null;
    x += d[0]; y += d[1];
    if (x < 0 || y < 0 || x >= size || y >= size) return null;
  }
  return [x, y];
}
const cell = (x: number, y: number) => `${String.fromCharCode(65 + x)}${y + 1}`;
const routes = [
  { start: [0, 0], path: ["→", "↓", "→"] }, { start: [1, 0], path: ["↓", "→", "↓"] },
  { start: [3, 0], path: ["←", "↓", "←"] }, { start: [4, 1], path: ["↓", "←", "↓"] },
  { start: [0, 4], path: ["→", "↑", "→"] }, { start: [2, 4], path: ["↑", "←", "↑"] },
];
const debug = routes.flatMap((r, i) => [1, 2].map(index => {
  const end = runArrowProgram(r.start, r.path)!;
  const shown = r.path.map((a, j) => j === index ? "?" : a).join(" ");
  const answers = [r.path[index], ...["→", "←", "↓", "↑"].filter(a => a !== r.path[index]).slice(0, 2)];
  return question(`debug-${i}-${index}`, "think.debug-program", "Repairing a program", `Which arrow replaces ? to reach ${cell(end[0], end[1])}?`, `Start at ${cell(r.start[0], r.start[1])}. Read left to right: ${shown}`, answers, `Use ${r.path[index]}. The repaired program is ${r.path.join(" ")}. It reaches ${cell(end[0], end[1])}.`, { kind: "program", values: [5, ...r.start, ...end], labels: r.path.map((a, j) => j === index ? "?" : a) });
}));
const loops = [
  { start: [0, 0], block: ["→", "↓"], times: 2 }, { start: [0, 0], block: ["→", "→", "↓"], times: 2 },
  { start: [4, 0], block: ["←", "↓"], times: 2 }, { start: [4, 4], block: ["←", "↑"], times: 2 },
  { start: [0, 4], block: ["→", "↑"], times: 3 }, { start: [0, 0], block: ["↓", "→"], times: 3 },
];
const loopQuestions = loops.flatMap((r, i) => {
  const expanded = Array.from({ length: r.times }, () => r.block).flat();
  const end = runArrowProgram(r.start, expanded)!;
  const other = [[0, 0], [4, 4], [0, 4], [4, 0]].filter(p => p[0] !== end[0] || p[1] !== end[1]).slice(0, 2);
  return [
    question(`loop-${i}-landing`, "think.repeat-block", "Repeating a whole block", "Where does the crab finish?", `Start at ${cell(r.start[0], r.start[1])}. Repeat the whole block [${r.block.join(" ")}] ${r.times} times in total.`, [cell(end[0], end[1]), ...other.map(p => cell(p[0], p[1]))], `Repeat every arrow in the block, in order: ${expanded.join(" ")}. The crab finishes at ${cell(end[0], end[1])}.`, { kind: "program", values: [5, ...r.start], labels: r.block, text: `Repeat block ${r.times} times in total` }),
    question(`loop-${i}-equivalent`, "think.equivalent-programs", "Comparing equivalent programs", "Which expanded program does exactly the same moves?", `Repeat [${r.block.join(" ")}] ${r.times} times in total.`, [expanded.join(" "), [...r.block].reverse().flatMap(c => Array(r.times).fill(c)).join(" "), [...expanded, "→"].join(" ")], `A block repeat repeats the whole ordered block. Expand it as ${expanded.join(" ")}. Repeating each arrow separately changes the order.`, { kind: "program", values: [5, ...r.start], labels: r.block, text: `Repeat block ${r.times} times in total` }),
  ];
});
export const discoveryTracks: GrowthTracks = {
  "tide-pool": { stretch: { label: "Fair habitat tests", description: "Change one factor and explain observations.", questions: tideStretch }, deep: { label: "Evidence & new habitats", description: "Repeat trials and apply evidence carefully.", questions: tideDeep } },
  "float-sink": { stretch: { label: "Shape, material & air", description: "Compare why particular objects float or sink.", questions: floatStretch }, deep: { label: "Capacity & fair trials", description: "Use repeated trials to predict and compare capacity.", questions: capacity } },
  "crab-commands": { stretch: { label: "Find & fix a bug", description: "Repair missing commands on a numbered grid.", questions: debug }, deep: { label: "Repeat whole blocks", description: "Expand loops and compare equivalent programs.", questions: loopQuestions } },
};
