// Pure scene layout facts shared by the picture art and content tests (no React).
/** Where the top of each object sits in its 0–100 drawing, so "on" rests on it instead of floating. */
export const objectTop: Record<string, number> = {
  rug: 46, mat: 52, road: 42, log: 50, leaf: 40, sand: 52, coat: 22, bed: 34, bike: 30, rock: 30,
  box: 24, tub: 40, cup: 50, mug: 22, pot: 22, jar: 14, boat: 40, ship: 30, bus: 22, van: 26, car: 34,
  nest: 44, pond: 50, tree: 8, shell: 16, dish: 46, cat: 22, dog: 22, toad: 18, bee: 12, fox: 30, pig: 22, hen: 22,
  goat: 30, sheep: 26, seal: 28, crab: 30, duck: 30, frog: 18, fish: 34, turtle: 32,
};
/** Things "in" can sensibly describe, and how being inside them is drawn. */
export const insideStyle: Record<string, "water" | "buried" | "canopy" | "container" | "blanket"> = {
  pond: "water", sea: "water", pool: "water", sand: "buried", tree: "canopy",
  box: "container", tub: "container", cup: "container", mug: "container", pot: "container", jar: "container",
  nest: "container", boat: "container", ship: "container", bed: "blanket", shell: "container",
  bus: "container", van: "container", car: "container", hut: "container",
};
