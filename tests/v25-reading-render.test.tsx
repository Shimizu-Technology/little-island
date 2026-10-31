import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import { ReadingBoard } from "../src/learn/games/letter-lagoon/ReadingBoard";
import { bank as stories } from "../src/learn/games/story-studio/engine";
import { bank as words } from "../src/learn/games/word-workshop/engine";
import type { State } from "../src/learn/games/letter-lagoon/puzzle";
import { optionsAtLevel } from "../src/learn/levels";
import type { BoardProps } from "../src/learn/types";

vi.mock("react-native", () => ({ View: "view" }));
vi.mock("../src/components/ui", () => ({
  C: { paper: "#fff" }, Copy: "copy", Heading: "heading", PressableScale: "pressable", Button: "button",
}));
vi.mock("../src/learn/Coach", () => ({ CoachSpot: ({children}: {children: React.ReactNode}) => <>{children}</> }));
vi.mock("../src/learn/art/Objects", () => ({ PictureObject: "picture" }));
vi.mock("react-native-svg", () => ({ default: "svg", Circle: "circle", Ellipse: "ellipse", Path: "path", Polyline: "polyline", Text: "text" }));
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const props = (game: "story-studio" | "word-workshop", level: 1 | 2 = 1): BoardProps<State> => ({
  session: { game, version: 1, id: "test", revision: 0, options: optionsAtLevel({ mode: "solo", pace: "easy" }, level),
    state: { version: 1, level, starter: 0, ids: [0,1,2,3], index: 0, placed: [], helped: false, hint: false, miss: false, clean: [] } },
  active: true, soundOn: true, width: 350, height: 740, skills: {},
  update: vi.fn(), sound: vi.fn(), stopSound: vi.fn(), practice: vi.fn(), cheer: vi.fn(), assistance: vi.fn(),
  coach: { active: false, done: vi.fn() },
});

describe("reading help and completed word actions", () => {
  it.each([1,2] as const)("L%s studio narration is on demand, reads the requested card and preserves placement", async level => {
    const p = props("story-studio", level), task = stories[level-1][0];
    let r!: ReactTestRenderer;
    await act(()=>{r=create(<ReadingBoard {...p} bank={stories} kind="studio" />)});
    expect(p.sound).not.toHaveBeenCalled();
    await act(()=>r.root.findAllByType("button").find(b=>b.props.label === "Listen again")!.props.onPress());
    expect(p.sound).toHaveBeenLastCalledWith(task.audio);
    expect(p.update).toHaveBeenLastCalledWith({ ...p.session.state, helped: true });
    const card = task.answer[0];
    await act(()=>r.root.findAllByType("button").find(b=>b.props.label === `Hear card: ${card}`)!.props.onPress());
    expect(p.sound).toHaveBeenLastCalledWith(task.cardAudio![card]);
    expect(p.assistance).toHaveBeenCalledTimes(2);
    expect(p.practice).not.toHaveBeenCalled();
    await act(()=>r.unmount());
  });
  it("offers the joined word's recording only after all parts are placed", async()=>{
    const p=props("word-workshop"),task=words[0][0];
    let r!: ReactTestRenderer;
    await act(()=>{r=create(<ReadingBoard {...p} bank={words} kind="workshop" />)});
    expect(r.root.findAllByType("button").some(b=>b.props.label?.startsWith("Hear completed word"))).toBe(false);
    p.session.state={...p.session.state,placed:task.answer};
    await act(()=>r.update(<ReadingBoard {...p} bank={words} kind="workshop" />));
    await act(()=>r.root.findAllByType("button").find(b=>b.props.label === `Hear completed word: ${task.completedWord}`)!.props.onPress());
    expect(p.sound).toHaveBeenLastCalledWith(task.completedAudio);
    expect(p.update).not.toHaveBeenCalled();
    await act(()=>r.unmount());
  });
});
