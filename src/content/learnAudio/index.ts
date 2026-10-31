import reading from "./reading";
import numbers from "./numbers";
import science from "./science";
import home from "./home";
import math from "./math";
/** Learning-game speech. Each slice owns one generated module so parallel work never edits the same file. */
export const learnSources: Record<string, number> = { ...reading, ...numbers, ...science, ...home, ...math };
