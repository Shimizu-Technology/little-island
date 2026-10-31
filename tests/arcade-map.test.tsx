import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { LevelMap } from "../src/arcade/LevelMap";
import { arcadeGames } from "../src/arcade/registry";
import { songLevels } from "../src/arcade/games/shell-song/engine";
import { emptyArcadeLearner } from "../src/arcade/progress";
import { allLevelIds } from "../src/arcade/types";
const viewport = vi.hoisted(() => ({ width: 390, height: 844 }));
vi.mock("react-native", () => ({ View: ({ children, testID }: { children?: React.ReactNode; testID?: string }) => <div data-testid={testID}>{children}</div>, useWindowDimensions: () => viewport }));
vi.mock("react-native-reanimated", () => ({ default: { View: ({ children }: { children?: React.ReactNode }) => <div>{children}</div> }, useSharedValue: (value: unknown) => ({ value }), useAnimatedStyle: () => ({}), cancelAnimation: () => {}, Easing: {}, withDelay: () => {}, withRepeat: () => {}, withSequence: () => {}, withTiming: () => {} }));
vi.mock("react-native-svg", () => ({ default: () => null, Circle: () => null, Path: () => null, Rect: () => null }));
vi.mock("../src/components/ui", () => {
  const Text = ({ children }: { children?: React.ReactNode }) => <span>{children}</span>;
  const Button = ({ children, disabled, accessibilityLabel, testID }: { children?: React.ReactNode; disabled?: boolean; accessibilityLabel?: string; testID?: string }) => <button disabled={disabled} aria-label={accessibilityLabel} data-testid={testID}>{children}</button>;
  return { Button, Copy: Text, Heading: Text, PressableScale: Button };
});
vi.mock("../src/components/Text", () => ({ Text: ({ children }: { children?: React.ReactNode }) => <span>{children}</span> }));
vi.mock("../src/components/motion", () => ({ useReducedMotion: () => true }));
vi.mock("../src/arcade/Art", () => ({ StarDisplay: () => null }));
vi.mock("../src/arcade/Juice", () => ({ Hero: () => null, HudPill: ({ children }: { children?: React.ReactNode }) => <span>{children}</span> }));
vi.mock("../src/arcade/PlayScene", () => ({ PlayScene: () => null }));
vi.mock("../src/arcade/TreasureArt", () => ({ ChestArt: () => null }));
describe("shared 56-level map", () => {
  it.each([[390, 844], [1024, 768]])("renders seven world choices and only the selected world at %s×%s, respecting locks", (width, height) => {
    Object.assign(viewport, { width, height });
    const props = { game: arcadeGames.find(g => g.id === "shell-song")!, person: emptyArcadeLearner(), levels: songLevels, unlockAll: false, onLevel: vi.fn(), onOutfits: vi.fn(), onChest: vi.fn(), active: false };
    const locked = renderToStaticMarkup(<LevelMap {...props}/>);
    for (let world = 1; world <= 6; world++) expect(locked).toContain(`World ${world}`);
    expect(locked).toContain("Discover"); expect(locked).toContain("Current level");
    expect(locked).toContain('data-testid="world-w1"');
    expect(locked).not.toContain('data-testid="world-w2"');
    for (const level of allLevelIds.filter(id => id.startsWith("w1-"))) expect(locked).toContain(`data-testid="level-${level}"`);
    expect((locked.match(/data-testid="level-/g) ?? []).length).toBe(8);
    expect(locked).toMatch(/disabled=""[^>]*aria-label="[^"<]*, level 2/);
    const open = renderToStaticMarkup(<LevelMap {...props} unlockAll/>);
    expect(open).not.toContain('disabled=""');
  });
});
