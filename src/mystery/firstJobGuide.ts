import { BELL, MysteryView, TASKS, countBits } from "./engine";

export type FirstJobGuide = { stage: "walk" | "water" | "explore"; growing: number };

/** A short invitation, derived from the round rather than a new saved tutorial flag.
 * Beats only advance on play, so reading/background time cannot use up the guide.
 * Later job/meeting progress and a bounded opening prevent a restored round from
 * being mistaken for a fresh start. Shared progress never proves who did a job.
 */
export function firstJobGuide(view: MysteryView): FirstJobGuide | null {
  const self = view.players.find((p) => p.id === view.selfId);
  if (
    !view.solo ||
    view.ownRole !== "crew" ||
    !view.adventure ||
    view.paused ||
    view.phase !== "explore" ||
    view.result ||
    view.sabotage ||
    !self ||
    self.out ||
    self.meetings !== 2 ||
    view.tick > 18 ||
    TASKS.some((t) => t.id !== "garden" && view.tasks[t.id] > 0)
  )
    return null;

  const garden = TASKS.find((t) => t.id === "garden")!;
  const atGarden = self.x === garden.x && self.y === garden.y;
  const growing = countBits(view.adventure.taskData.garden);
  // Require both engine representations before recognizing completion.
  if (view.tasks.garden === 3 && growing === 3)
    return atGarden ? { stage: "explore", growing } : null;
  if (view.tasks.garden !== growing || growing === 3) return null;
  // Choosing another destination is allowed; do not chase the player with a guide.
  if (TASKS.some((t) => t.id !== "garden" && self.x === t.x && self.y === t.y)) return null;
  // Once watering has begun, a return to the bell is not another first arrival.
  if (growing > 0 && self.x === BELL.x && self.y === BELL.y) return null;
  return { stage: atGarden ? "water" : "walk", growing };
}
