/** Original Little Island courses. World units, left-to-right; y is height above sea. */
export type CourseId = "training" | "lagoon" | "canopy" | "sunset";
export type Platform = { from: number; to: number; y: number; belt?: number; oneWay?: boolean };
export type Obstacle = {
  x: number;
  y: number;
  width: number;
  height: number;
  kind: "hurdle" | "roller" | "gate";
  travel?: number;
  period?: number;
  phase?: number;
};
export type Course = {
  id: CourseId;
  name: string;
  subtitle: string;
  lesson: string;
  length: number;
  sky: string;
  land: string;
  edge: string;
  platforms: readonly Platform[];
  obstacles: readonly Obstacle[];
  checkpoints: readonly number[];
};
const LEGACY_COURSES: readonly Course[] = [
  {
    id: "training",
    name: "First footsteps",
    subtitle: "Learn to run, jump and land",
    lesson:
      "Tap Run & go to move. Jump over the coral block, then leap across the little water gap. A flag saves your checkpoint.",
    length: 31,
    sky: "#DFF2F0",
    land: "#B4D8AB",
    edge: "#548879",
    platforms: [
      { from: -2, to: 16, y: 0 },
      { from: 17.4, to: 34, y: 0 },
    ],
    obstacles: [{ x: 8, y: 0, width: 0.55, height: 0.62, kind: "hurdle" }],
    checkpoints: [1, 12, 23],
  },
  {
    id: "lagoon",
    name: "Lagoon leap",
    subtitle: "Coral hurdles & water jumps",
    lesson: "Jump the coral hurdles and water gaps. Watch the rolling coconuts! Flags save your progress.",
    length: 72,
    sky: "#DEF3EF",
    land: "#BBDDAB",
    edge: "#4B8876",
    platforms: [
      { from: -2, to: 17, y: 0 },
      { from: 19, to: 34, y: 0 },
      { from: 36.2, to: 51, y: 0 },
      { from: 53, to: 75, y: 0 },
    ],
    obstacles: [
      { x: 8, y: 0, width: 0.55, height: 0.7, kind: "hurdle" },
      { x: 26, y: 0, width: 0.65, height: 0.65, kind: "roller", travel: 0.7, period: 3 },
      { x: 43, y: 0, width: 0.6, height: 0.72, kind: "hurdle" },
      { x: 62, y: 0, width: 0.7, height: 0.7, kind: "roller", travel: 0.85, period: 2.8 },
    ],
    checkpoints: [1, 23, 40, 58],
  },
  {
    id: "canopy",
    name: "Canopy climb",
    subtitle: "Raised paths & lifting gates",
    lesson: "Jump up the terraced paths. The golden gates rise and fall: jump over a low gate or wait for your moment.",
    length: 76,
    sky: "#E5EFDA",
    land: "#9FCB89",
    edge: "#497252",
    platforms: [
      { from: -2, to: 14, y: 0 },
      { from: 15.4, to: 29, y: 0.4 },
      { from: 30.5, to: 44, y: 0.8 },
      { from: 45.4, to: 60, y: 0.4 },
      { from: 62.1, to: 79, y: 0 },
    ],
    obstacles: [
      { x: 7, y: 0, width: 0.6, height: 0.65, kind: "hurdle" },
      { x: 22, y: 0.4, width: 0.7, height: 0.8, kind: "gate", period: 3.4, phase: 0.8 },
      { x: 37, y: 0.8, width: 0.65, height: 0.85, kind: "gate", period: 2.6 },
      { x: 52, y: 0.4, width: 0.65, height: 0.6, kind: "roller", travel: 0.6, period: 3 },
      { x: 70, y: 0, width: 0.55, height: 0.75, kind: "hurdle" },
    ],
    checkpoints: [1, 18, 33, 48, 66],
  },
  {
    id: "sunset",
    name: "Sunset shuffle",
    subtitle: "Conveyors & coconut rollers",
    lesson:
      "Some paths carry you forward and some push you back. Keep running and time your jumps over the moving coconuts.",
    length: 82,
    sky: "#F8E6CF",
    land: "#E3C68A",
    edge: "#A68B5B",
    platforms: [
      { from: -2, to: 15, y: 0 },
      { from: 16.8, to: 31, y: 0, belt: 1 },
      { from: 33, to: 47, y: 0, belt: -0.9 },
      { from: 49, to: 63, y: 0.3, belt: 0.8 },
      { from: 65, to: 85, y: 0 },
    ],
    obstacles: [
      { x: 8, y: 0, width: 0.7, height: 0.65, kind: "roller", travel: 0.6, period: 2.7 },
      { x: 24, y: 0, width: 0.6, height: 0.72, kind: "hurdle" },
      { x: 40, y: 0, width: 0.7, height: 0.7, kind: "roller", travel: 0.9, period: 3.6 },
      { x: 56, y: 0.3, width: 0.7, height: 0.8, kind: "gate", period: 3 },
      { x: 74, y: 0, width: 0.7, height: 0.7, kind: "roller", travel: 1, period: 3.2 },
    ],
    checkpoints: [1, 20, 36, 52, 69],
  },
];
/** Edition 1 geometry is frozen for pre-quality-release saved rounds. */
export const COURSES: readonly Course[] = LEGACY_COURSES.map((course): Course => {
  const choices: Partial<Record<CourseId, readonly Platform[]>> = {
    lagoon: [
      { from: 23, to: 27.4, y: 1.05, oneWay: true, belt: 0.65 },
      { from: 58.5, to: 63.4, y: 1, oneWay: true },
    ],
    canopy: [
      { from: 18.5, to: 23.4, y: 1.4, oneWay: true, belt: 0.8 },
      { from: 32.5, to: 38.3, y: 1.85, oneWay: true, belt: 0.8 },
    ],
    sunset: [
      { from: 35.5, to: 41.3, y: 1.15, oneWay: true, belt: 1.35 },
      { from: 51.5, to: 57.4, y: 1.35, oneWay: true, belt: 1.1 },
    ],
  };
  const extensions: Partial<
    Record<
      CourseId,
      { length: number; platforms: readonly Platform[]; obstacles: readonly Obstacle[]; checkpoints: readonly number[] }
    >
  > = {
    lagoon: {
      length: 104,
      platforms: [
        { from: 77, to: 90, y: 0.2 },
        { from: 92, to: 107, y: 0 },
        { from: 79.5, to: 84.4, y: 1.2, oneWay: true, belt: 0.6 },
      ],
      obstacles: [
        { x: 83, y: 0.2, width: 0.7, height: 0.7, kind: "roller", travel: 0.8, period: 2.7 },
        { x: 99, y: 0, width: 0.7, height: 0.75, kind: "hurdle" },
      ],
      checkpoints: [80, 96],
    },
    canopy: {
      length: 119,
      platforms: [
        { from: 80.4, to: 94, y: 0.6 },
        { from: 96, to: 108, y: 1 },
        { from: 109.5, to: 122, y: 0 },
        { from: 83, to: 88.4, y: 1.65, oneWay: true, belt: 0.8 },
        { from: 98.5, to: 103.4, y: 2.05, oneWay: true, belt: 0.9 },
      ],
      obstacles: [
        { x: 87, y: 0.6, width: 0.65, height: 0.85, kind: "gate", period: 2.8 },
        { x: 102, y: 1, width: 0.65, height: 0.8, kind: "gate", period: 3.1, phase: 1.8 },
        { x: 115, y: 0, width: 0.7, height: 0.7, kind: "roller", travel: 0.8, period: 3 },
      ],
      checkpoints: [84, 100, 113],
    },
    sunset: {
      length: 130,
      platforms: [
        { from: 87, to: 101, y: 0, belt: -1.15 },
        { from: 103, to: 119, y: 0, belt: 1.25 },
        { from: 121, to: 133, y: 0.3 },
        { from: 89, to: 95.3, y: 1.1, oneWay: true, belt: 1.7 },
      ],
      obstacles: [
        { x: 94, y: 0, width: 0.75, height: 0.75, kind: "roller", travel: 1, period: 3.4 },
        { x: 111, y: 0, width: 0.65, height: 0.75, kind: "hurdle" },
        { x: 126, y: 0.3, width: 0.7, height: 0.8, kind: "gate", period: 3.3 },
      ],
      checkpoints: [90, 107, 124],
    },
  };
  const extension = extensions[course.id];
  const lessons: Record<CourseId, string> = {
    training:
      "Tap Run & go, then Jump at the coral sign. Jump again before the water. Your flag catches you if you fall. Stop gives you time to choose your next jump.",
    lagoon:
      "Low coral, rolling coconuts and open water! Jump onto the shell bridges to pass above the coconuts, or keep to the lower trail and jump the rollers. Both paths reach the next flag.",
    canopy:
      "Choose your way through the treetops: leap onto the fast hanging bridges, or stay on the terraces and time the rising gates. Jump early when the next island is higher.",
    sunset:
      "Read the arrows: the sand belts carry you forward or push you back. The high boardwalk skips a slow belt, but you must land your jump. Stop before a gate to choose its low moment.",
  };
  return {
    ...course,
    lesson: lessons[course.id],
    length: extension?.length ?? course.length,
    platforms: [...course.platforms, ...(choices[course.id] ?? []), ...(extension?.platforms ?? [])],
    obstacles: [...course.obstacles, ...(extension?.obstacles ?? [])],
    checkpoints: [...course.checkpoints, ...(extension?.checkpoints ?? [])],
    subtitle:
      course.id === "lagoon"
        ? "Shell bridges or the coral trail?"
        : course.id === "canopy"
          ? "Treetop shortcuts & rising gates"
          : course.id === "sunset"
            ? "Fast boardwalks & shifting sand"
            : course.subtitle,
  };
});
export function raceCourse(id: CourseId, edition: 1 | 2 = 2): Course {
  return (edition === 1 ? LEGACY_COURSES : COURSES).find((c) => c.id === id)!;
}
