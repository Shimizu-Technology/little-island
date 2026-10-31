import { Board as PatternBoard } from "../src/learn/games/pattern-path/view";
import { tasks, type ScienceState } from "../src/learn/games/weather-watch/model";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { ScienceBoard } from "../src/learn/games/weather-watch/ScienceBoard";
import { engine as weather } from "../src/learn/games/weather-watch/engine";
import { optionsAtLevel } from "../src/learn/levels";
import { random } from "../src/games/types";
vi.mock("../src/components/motion", () => ({ useReducedMotion: () => true }));
vi.mock("../src/islander/active", async () => {
  const { defaultLook } = await import("../src/islander/look");
  return { useActiveIslanderLook: () => defaultLook };
});
vi.mock("react-native", () => ({
  TextInput: "input",
  View: ({ children, style, accessibilityLabel }: { children: React.ReactNode; style?: React.CSSProperties; accessibilityLabel?: string }) => <div data-label={accessibilityLabel} style={style}>{children}</div>,
}));
vi.mock("react-native-svg", () => ({
  default: "svg",
  G: "g",
  Path: "path",
  Circle: "circle",
  Ellipse: "ellipse",
  Rect: "rect",
  Line: "line",
  Text: "text",
  Defs: "defs",
  RadialGradient: "radialGradient",
  Stop: "stop",
}));
vi.mock("../src/learn/Coach", () => ({
  CoachSpot: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("../src/components/ui", () => ({
  font: "Arial", C: { ink: "#123" },
  Copy: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  Button: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
  PressableScale: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
}));

const options = optionsAtLevel({mode:"solo",pace:"easy"},4);
const baseProps = {update:()=>{},practice:()=>{},skills:{},sound:()=>{},stopSound:()=>{},soundOn:false,width:390,height:844,active:true,coach:{active:false,done:()=>{}},cheer:()=>{}};
it("renders matrix middle row left to right, without trail curves",()=>{
 const state={version:1 as const,level:5,seed:17,index:3,total:4 as const,helped:false};
 const html=renderToStaticMarkup(<PatternBoard {...baseProps} session={{game:"pattern-path",version:1,id:"test",revision:0,options,state}}/>);
 expect(html).toContain('data-label="Stone 4:');
 expect(html).toMatch(/data-label="Stone 4:[^"]*" style="[^"]*left:6px/);
 expect(html).toMatch(/data-label="Stone 6:[^"]*" style="[^"]*left:290px/);
 expect(html).not.toContain('stroke-dasharray="4 12"');
});
it("weather offers replayable goal and result narration with visible transcript",()=>{
 const state=weather.create(optionsAtLevel(options,1),{skills:{},rng:random(1),starter:0,today:0});
 const html=renderToStaticMarkup(<ScienceBoard {...baseProps} game="weather-watch" session={{game:"weather-watch",version:1,id:"test",revision:0,options:optionsAtLevel(options,1),state:{...state,tested:true,actions:1,values:[2]}}}/>);
 expect(html).toContain('Hear the goal');expect(html).toContain('Hear why');expect(html).toContain('coat keeps warmth');expect(html).not.toContain('Reset clears a chain');
});
it("weather teaches scales, then removes exact numeric readouts for practice",()=>{
 const state=weather.create(options,{skills:{},rng:random(1),starter:0,today:0});
 const q=tasks('weather-watch',4,state.seed);
 const render=(s:ScienceState)=>renderToStaticMarkup(<ScienceBoard {...baseProps} game="weather-watch" session={{game:"weather-watch",version:1,id:"test",revision:0,options,state:s}}/>);
 expect(render(state)).toContain(`Thermometer ${q[0].target[0]} °C`);
 const html=render({...state,index:1,records:[q[0].target]});
 expect(html).toContain('without printed answers');expect(html).not.toContain(`Thermometer ${q[1].target[0]} °C`);
 expect(html).not.toContain(`${q[1].target[1]} mm</text>`);expect(html).toContain('mm</text>');
});
