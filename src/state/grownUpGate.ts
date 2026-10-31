/**
 * A light parental gate: a times-table question answered by typing, not by choosing.
 * A child practising addition can't learn one fixed answer or guess from three buttons.
 */
export type Gate = { a: number; b: number; answer: number };
export function makeGate(rng: () => number = Math.random): Gate {
  const pick = () => 6 + Math.floor(rng() * 4); // 6–9
  const a = pick(),
    b = pick();
  return { a, b, answer: a * b };
}
export function gateAccepts(gate: Gate, typed: string): boolean {
  const value = typed.trim();
  return /^\d{1,3}$/.test(value) && Number(value) === gate.answer;
}
