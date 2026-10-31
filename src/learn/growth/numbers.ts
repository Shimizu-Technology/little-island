import type { GrowthQuestion, GrowthScene, GrowthStage, GrowthTrack, GrowthTracks } from "./types";

// Finite tables expand once at import: every full prompt/explanation is enumerable
// for offline narration. IDs depend on authored rows, never display/random order.
type Pair = readonly [number, number];
type Triple = readonly [number, number, number];
type Quad = readonly [number, number, number, number];
const tens = (values: readonly number[], labels: readonly string[], cells?: readonly string[]): GrowthScene =>
  ({ kind: "tens", values, labels, cells });
const equation = (text: string): GrowthScene => ({ kind: "word", text });
const groups = (count: number, size: number, extra = 0): GrowthScene =>
  ({ kind: "groups", values: [count, size, extra] });
const hops = (mode: string, values: readonly number[]): GrowthScene =>
  ({ kind: "hops", cells: [mode], values });

function question(game: string, stage: GrowthStage, skill: string, skillLabel: string, row: number,
  prompt: string, answer: number, explanation: string, scene: GrowthScene): GrowthQuestion {
  const choices = [...new Set([answer, answer - 1, answer + 1, answer + 10, answer - 10])]
    .filter(n => n >= 0 && n <= 100).slice(0, 4);
  for (let n = 0; choices.length < 4; n++) if (!choices.includes(n)) choices.push(n);
  return {
    id: `${game}-${stage}-${skill}-${row + 1}`, skill: `num.${skill}`, skillLabel,
    prompt, answer: String(answer), explanation, scene,
    choices: choices.map(n => ({ value: String(n), label: String(n) })),
  };
}

function shell(stage: GrowthStage): GrowthTrack {
  const deep = stage === "deep";
  const sums: readonly Pair[] = deep ? [[28, 7], [46, 8], [57, 6], [69, 5]] : [[8, 5], [9, 6], [7, 8], [6, 7]];
  const parts: readonly Pair[] = deep ? [[42, 7], [53, 8], [61, 6], [74, 9]] : [[16, 10], [18, 10], [15, 10], [19, 10]];
  const place: readonly Pair[] = deep ? [[3, 14], [4, 17], [6, 12], [7, 15]] : [[2, 4], [3, 6], [4, 2], [5, 8]];
  const packs: readonly Triple[] = deep ? [[4, 6, 3], [5, 7, 4], [6, 8, 2], [7, 5, 6]] : [[3, 4, 0], [4, 5, 0], [3, 6, 0], [4, 4, 0]];
  const questions: GrowthQuestion[] = [];
  sums.forEach(([a, b], i) => {
    const bridge = 10 - a % 10, next = a + bridge;
    questions.push(question("shell-math", stage, deep ? "bridge-ten" : "make-ten", deep ? "Bridge the next ten" : "Make ten, then add", i,
      `Combine ${a} shells and ${b} shells. How many altogether?`, a + b,
      `Move ${bridge} of the ${b} shells to ${a} to make ${next}. There are ${b - bridge} left to add. ${next} + ${b - bridge} = ${a + b}.`,
      tens([a, b], ["First pile", "Second pile"])));
    const [whole, part] = parts[i];
    questions.push(deep
      ? question("shell-math", stage, "exchange-subtract", "Open a ten to subtract", i,
        `There are ${whole} shells. Give away ${part}. How many remain?`, whole - part,
        `Open one ten: ${whole} becomes ${Math.floor(whole / 10) - 1} tens and ${whole % 10 + 10} ones. Take away ${part} ones, leaving ${whole % 10 + 10 - part} ones. ${whole} - ${part} = ${whole - part}.`,
        tens([whole, part], ["Starting shells", "Give away"]))
      : question("shell-math", stage, "decompose", "Find the other part", i,
        `${whole} shells are split into ${part} and a hidden part. How many are hidden?`, whole - part,
        `The whole is ${whole}. Take away the known part, ${part}: ${whole} - ${part} = ${whole - part}. The parts ${part} and ${whole - part} fit together again.`,
        equation(`${part} + ? = ${whole}`)));
    const [t, o] = place[i];
    questions.push(question("shell-math", stage, deep ? "regroup-ones" : "place-value", deep ? "Bundle loose ones" : "Build tens and ones", i,
      `Build a number with ${t} tens and ${o} loose ones. What number is it?`, t * 10 + o,
      deep
        ? `Bundle 10 loose ones into one new ten. Now there are ${t + 1} tens and ${o - 10} ones: ${t * 10 + o}. The amount stays the same.`
        : `Each ten holds 10. ${t} tens are ${t * 10}; add ${o} ones. ${t * 10} + ${o} = ${t * 10 + o}.`,
      tens([t * 10, o], [`${t} tens`, `${o} loose ones`], ["bundles", "ones"])));
    const [g, s, e] = packs[i];
    questions.push(question("shell-math", stage, deep ? "groups-extra" : "equal-groups", deep ? "Equal groups and leftovers" : "Count equal groups", i,
      `There are ${g} baskets with ${s} shells in each${deep ? ` and ${e} extra shells` : ""}. How many shells altogether?`, g * s + e,
      `${g} equal groups of ${s} make ${g * s}.${deep ? ` Add the ${e} extra shells: ${g * s} + ${e} = ${g * s + e}.` : ` Adding ${s} once for each basket gives ${g * s}.`}`,
      groups(g, s, e)));
  });
  return { label: deep ? "Trade tens and build groups" : "Make ten and find parts",
    description: deep ? "Regroup, subtract across a ten, and combine equal groups within 100." : "Use make-ten, hidden parts, tens and ones, and equal baskets.", questions };
}

function hop(stage: GrowthStage): GrowthTrack {
  const deep = stage === "deep";
  const forward: readonly Triple[] = deep ? [[37, 5, 6], [48, 10, 4], [69, 2, 8], [56, 5, 7]] : [[16, 2, 4], [18, 5, 3], [27, 10, 3], [29, 2, 5]];
  const back: readonly Triple[] = deep ? [[83, 5, 7], [96, 10, 6], [71, 2, 9], [94, 5, 8]] : [[34, 2, 4], [43, 5, 3], [58, 10, 2], [31, 2, 6]];
  const starts: readonly Triple[] = deep ? [[86, 10, 4], [73, 5, 7], [92, 2, 9], [97, 10, 6]] : [[32, 2, 4], [41, 5, 3], [63, 10, 3], [35, 2, 6]];
  const counts: readonly Triple[] = deep ? [[27, 77, 10], [38, 83, 5], [59, 83, 2], [46, 96, 10]] : [[18, 26, 2], [24, 44, 5], [17, 47, 10], [29, 41, 2]];
  const questions: GrowthQuestion[] = [];
  forward.forEach(([s, step, n], i) => {
    questions.push(question("number-hop", stage, "hop-forward", "Jump across tens", i,
      `Start at ${s}. Make ${n} forward jumps of ${step}. Where do you land?`, s + step * n,
      `Each forward jump adds ${step}. ${n} jumps add ${n * step}. ${s} + ${n * step} = ${s + n * step}.`, hops("forward", [s, step, n])));
    const [end, jump, count] = back[i];
    questions.push(question("number-hop", stage, "hop-back", "Jump back across tens", i,
      `Start at ${end}. Make ${count} backward jumps of ${jump}. Where do you land?`, end - jump * count,
      `Each backward jump takes away ${jump}. ${count} jumps take away ${count * jump}. ${end} - ${count * jump} = ${end - count * jump}.`, hops("back", [end, jump, count])));
    const [landing, stride, times] = starts[i];
    questions.push(question("number-hop", stage, "hop-start", "Find the missing start", i,
      `After ${times} forward jumps of ${stride}, you land at ${landing}. Where did you start?`, landing - stride * times,
      `Undo the forward jumps by going back ${times} times by ${stride}. That is ${times * stride} back. ${landing} - ${times * stride} = ${landing - times * stride}.`, hops("missing-start", [landing, stride, times])));
    const [from, to, by] = counts[i], jumps = (to - from) / by;
    questions.push(question("number-hop", stage, "hop-count", "Choose how many jumps", i,
      `Go from ${from} to ${to} using forward jumps of ${by}. How many jumps?`, jumps,
      `The distance is ${to} - ${from} = ${to - from}. Split that distance into groups of ${by}; ${jumps} groups reach ${to} exactly.`, hops("missing-count", [from, by, to])));
  });
  return { label: deep ? "Missing starts and longer jumps" : "Skip across the tens",
    description: deep ? "Plan forward and backward routes within 100, including unknown starts and jump counts." : "Use jumps of 2, 5 and 10 across tens; find a start or a jump count.", questions };
}

function reef(stage: GrowthStage): GrowthTrack {
  const deep = stage === "deep";
  const landings: readonly Triple[] = deep ? [[43, 10, 4], [58, 5, 7], [67, 2, 9], [26, 10, 6]] : [[19, 2, 4], [23, 5, 3], [14, 10, 3], [28, 2, 5]];
  const mixed: readonly Triple[] = deep ? [[38, 6, 5], [47, 5, 6], [59, 4, 5], [36, 7, 8]] : [[12, 3, 2], [18, 2, 3], [24, 4, 2], [21, 3, 3]];
  const routes: readonly Triple[] = deep ? [[6, 10, 5], [8, 5, 10], [5, 10, 2], [6, 5, 2]] : [[5, 2, 5], [4, 5, 10], [3, 10, 5], [10, 2, 10]];
  const gaps: readonly Quad[] = deep ? [[5, 10, 7, 10], [6, 5, 5, 10], [8, 2, 6, 5], [4, 10, 9, 5]] : [[3, 2, 2, 5], [2, 5, 2, 10], [4, 2, 3, 5], [3, 5, 2, 10]];
  const questions: GrowthQuestion[] = [];
  landings.forEach(([s, step, n], i) => {
    questions.push(question("reef-race", stage, "reef-landing", "Predict the landing", i,
      `Turtle starts on stone ${s} and makes ${n} forward jumps of ${step}. Which stone is next after all the jumps?`, s + n * step,
      `The jumps cover ${n} groups of ${step}, or ${n * step} stones. Start at ${s}, then add ${n * step}: land on ${s + n * step}.`, hops("forward", [s, step, n])));
    const [start, twos, fives] = mixed[i];
    questions.push(question("reef-race", stage, "reef-mixed", "Combine different jumps", i,
      `Start on stone ${start}. Make ${twos} forward jumps of 2, then ${fives} forward jumps of 5. Where do you finish?`, start + twos * 2 + fives * 5,
      `${twos} jumps of 2 cover ${twos * 2}. ${fives} jumps of 5 cover ${fives * 5}. From ${start}, add ${twos * 2}, then ${fives * 5}, to reach ${start + twos * 2 + fives * 5}.`, hops("mixed", [start, 2, twos, 5, fives])));
    const [count, by, other] = routes[i], distance = count * by;
    questions.push(question("reef-race", stage, "reef-routes", "Find an equal route", i,
      `One route has ${count} forward jumps of ${by}. For the same distance, how many forward jumps of ${other} would you need?`, distance / other,
      `The first route covers ${count} groups of ${by}: ${distance} stones. ${distance / other} jumps of ${other} also cover ${distance}. Different jump sizes can reach the same landing from the same start.`,
      hops("equal-route", [count, by, other])));
    const [an, aj, bn, bj] = gaps[i];
    questions.push(question("reef-race", stage, "reef-gap", "Compare two routes", i,
      `Both racers start on stone 0. Turtle makes ${an} jumps of ${aj}. Crab makes ${bn} jumps of ${bj}. How many stones farther does Crab go?`, bn * bj - an * aj,
      `Turtle goes ${an} groups of ${aj}, or ${an * aj} stones. Crab goes ${bn} groups of ${bj}, or ${bn * bj}. The gap is ${bn * bj} - ${an * aj} = ${bn * bj - an * aj}.`,
      hops("compare", [an, aj, bn, bj])));
  });
  return { label: deep ? "Compare and combine reef routes" : "Predict and swap reef jumps",
    description: deep ? "Reason about mixed routes, equal distances and landing gaps within 100." : "Predict jumps of 2, 5 and 10, and compare different ways across the reef.", questions };
}

function market(stage: GrowthStage): GrowthTrack {
  const deep = stage === "deep";
  const exchanges: readonly Pair[] = deep ? [[4, 3], [5, 6], [6, 2], [7, 8]] : [[2, 3], [3, 4], [4, 6], [5, 2]];
  const orders: readonly Triple[] = deep ? [[37, 28, 16], [46, 27, 18], [58, 24, 19], [29, 38, 17]] : [[14, 8, 5], [18, 7, 6], [23, 9, 8], [16, 8, 7]];
  const change: readonly Pair[] = deep ? [[80, 47], [90, 56], [70, 38], [100, 67]] : [[30, 16], [40, 27], [50, 34], [60, 48]];
  const payments: readonly Triple[] = deep ? [[65, 4, 5], [73, 6, 1], [85, 6, 5], [92, 8, 1]] : [[25, 1, 5], [32, 2, 1], [35, 2, 5], [43, 3, 1]];
  const questions: GrowthQuestion[] = [];
  exchanges.forEach(([t, o], i) => {
    const trade = deep ? 2 : 1;
    questions.push(question("island-market", stage, "market-exchange", "Trade tens for ones", i,
      `You have ${t} ten-shell coins and ${o} one-shell coins. Exchange ${trade} ten-shell ${trade === 1 ? "coin" : "coins"} for one-shell coins. How many one-shell coins now?`, o + trade * 10,
      `Each ten-shell coin trades for 10 one-shell coins. Trade ${trade} for ${trade * 10} ones, then add your ${o} ones: ${trade * 10} + ${o} = ${trade * 10 + o}. You still have ${t - trade} ten-shell coins; the total value has not changed.`,
      tens([t * 10, o], [`${t} ten-shell coins`, `${o} one-shell coins`], ["bundles", "ones"])));
    const [a, b, returned] = orders[i];
    questions.push(question("island-market", stage, "market-order", "Combine and adjust an order", i,
      `Pack ${a} mangoes, add ${b} more, then return ${returned} mangoes to the stall. How many stay in the order?`, a + b - returned,
      `First combine the two batches: ${a} + ${b} = ${a + b}. Then return ${returned}: ${a + b} - ${returned} = ${a + b - returned}.`,
      tens([a, b, returned], ["First batch", "Add", "Return to stall"])));
    const [paid, cost] = change[i];
    questions.push(question("island-market", stage, "market-change", "Make change across a ten", i,
      `Pay ${paid} shells for an order costing ${cost} shells. How much change comes back?`, paid - cost,
      `Count up from the cost to ${Math.ceil(cost / 10) * 10}: add ${10 - cost % 10}. Then add ${paid - Math.ceil(cost / 10) * 10} to reach ${paid}. The change is ${paid - cost}. Check: ${cost} + ${paid - cost} = ${paid}.`,
      tens([paid, cost], ["Paid", "Order cost"])));
    const [price, tenCoins, coin] = payments[i], left = price - tenCoins * 10;
    questions.push(question("island-market", stage, "market-payment", "Choose another payment", i,
      `An order costs ${price} shells. Instead of all ones, use ${tenCoins} ten-shell coins, then only ${coin === 5 ? "five" : "one"}-shell coins. How many ${coin === 5 ? "five" : "one"}-shell coins finish the exact payment?`, left / coin,
      `The ten-shell coins pay ${tenCoins * 10}. There are ${price} - ${tenCoins * 10} = ${left} shells left. ${left / coin} ${coin === 5 ? "five" : "one"}-shell coins pay that amount exactly. All ones or this mix can pay the same total.`,
      equation(`Cost ${price}; paid ${tenCoins} tens; finish with ${coin}-shell coins.`)));
  });
  return { label: deep ? "Exchange, order and make change" : "Trade and pay at the market",
    description: deep ? "Exchange two tens, adjust larger orders and compare exact payments within 100." : "Trade one ten, combine orders, make change and pay with different coins.", questions };
}

function quick(stage: GrowthStage): GrowthTrack {
  const deep = stage === "deep";
  const first: readonly Pair[] = deep ? [[18, 63], [27, 46], [36, 81], [38, 54]] : [[7, 23], [8, 17], [9, 32], [6, 28]];
  const second: readonly Pair[] = deep ? [[73, 46], [84, 57], [92, 68], [61, 35]] : [[24, 16], [31, 18], [35, 27], [42, 25]];
  const equivalent: readonly Triple[] = deep ? [[38, 27, 40], [46, 18, 50], [57, 26, 60], [69, 24, 70]] : [[8, 7, 10], [16, 8, 20], [27, 6, 30], [18, 9, 20]];
  const stories: readonly Triple[] = deep ? [[43, 28, 17], [56, 19, 26], [38, 37, 29], [67, 24, 38]] : [[12, 9, 7], [18, 8, 9], [23, 7, 8], [16, 9, 6]];
  const questions: GrowthQuestion[] = [];
  first.forEach(([b, result], i) => {
    const subtract = i % 2 === 1, answer = subtract ? result + b : result - b;
    questions.push(question("quick-practice", stage, subtract ? "unknown-first-sub" : "unknown-first-add", subtract ? "Find the amount before taking away" : "Find the missing first part", i,
      `What number fills the blank? ? ${subtract ? "-" : "+"} ${b} = ${result}`, answer,
      subtract ? `Put back the ${b} that were taken away. ${result} + ${b} = ${answer}. Check: ${answer} - ${b} = ${result}.`
        : `Take the known part from the whole: ${result} - ${b} = ${answer}. Check: ${answer} + ${b} = ${result}.`,
      equation(`? ${subtract ? "−" : "+"} ${b} = ${result}`)));
    const [whole, remains] = second[i];
    questions.push(question("quick-practice", stage, "unknown-taken", "Find how much was taken", i,
      `What number fills the blank? ${whole} - ? = ${remains}`, whole - remains,
      `Find the gap from ${remains} to ${whole}: ${whole} - ${remains} = ${whole - remains}. Check by taking it away: ${whole} - ${whole - remains} = ${remains}.`,
      equation(`${whole} − ? = ${remains}`)));
    const [a, add, other] = equivalent[i];
    questions.push(question("quick-practice", stage, "equivalent", "Keep both sides equal", i,
      `Both sides must have the same value. ${a} + ${add} = ${other} + ?`, a + add - other,
      `The left side is ${a} + ${add} = ${a + add}. The right side needs ${a + add - other} more than ${other}. ${other} + ${a + add - other} is also ${a + add}.`,
      equation(`${a} + ${add} = ${other} + ?`)));
    const [had, found, gave] = stories[i];
    questions.push(question("quick-practice", stage, "two-step", "Plan two steps", i,
      `You have ${had} shells, find ${found} more, then give away ${gave}. How many shells do you have now?`, had + found - gave,
      `Finding more means add: ${had} + ${found} = ${had + found}. Giving away means subtract: ${had + found} - ${gave} = ${had + found - gave}.`,
      tens([had, found, gave], ["Have", "Find", "Give away"])));
  });
  return { label: deep ? "Balance equations and plan two steps" : "Find unknowns and connect equations",
    description: deep ? "Solve unknown starts, missing subtractions, equal equations and two-step situations within 100." : "Find different missing parts, balance two sums and solve short two-step stories.", questions };
}

export const numberTracks: GrowthTracks = {
  "reef-race": { stretch: reef("stretch"), deep: reef("deep") },
  "island-market": { stretch: market("stretch"), deep: market("deep") },
  "shell-math": { stretch: shell("stretch"), deep: shell("deep") },
  "number-hop": { stretch: hop("stretch"), deep: hop("deep") },
  "quick-practice": { stretch: quick("stretch"), deep: quick("deep") },
};
