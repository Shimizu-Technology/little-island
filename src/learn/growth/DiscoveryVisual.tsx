import React, { useState } from "react";
import { View } from "react-native";
import { Button, C, Copy, styles } from "../../components/ui";
import type { GrowthVisualProps } from "./types";
import { runArrowProgram } from "./discovery";

export function DiscoveryVisual({ question, showHelp, disabled, onHelp }: GrowthVisualProps) {
  const scene = question.scene;
  const [steps, setSteps] = useState(0);
  if (!scene) return null;
  if (scene.kind === "trials") return <View style={{ gap: 8, padding: 16, borderRadius: 16, backgroundColor: C.paper }}>
    {(scene.text?.split("\n") ?? []).map((line, i) => <Copy key={i}>{scene.labels?.[i] ? `${scene.labels[i]}: ` : ""}{line}</Copy>)}
    {!!scene.values?.length && scene.values.map((n, i) => <Copy key={i}>{scene.labels?.[i]}: {n} counters</Copy>)}
  </View>;
  if (scene.kind !== "program") return null;
  const [size, x, y, tx, ty] = scene.values ?? [5, 0, 0];
  const repeats = Number(scene.text?.match(/(\d+)/)?.[1] ?? 1);
  const commands = Array.from({ length: repeats }, () => [...(scene.labels ?? [])]).flat();
  const position = runArrowProgram([x, y], commands.slice(0, steps), size) ?? [x, y];
  return <View style={{ gap: 10, alignItems: "center" }}>
    <View accessibilityLabel={`Crab grid. Start ${String.fromCharCode(65 + x)}${y + 1}${tx === undefined ? "" : `, target ${String.fromCharCode(65 + tx)}${ty + 1}`}`} style={{ width: "100%", maxWidth: 330, gap: 3 }}>
      {Array.from({ length: size }, (_, row) => <View key={row} style={{ flexDirection: "row", gap: 3 }}>
        {Array.from({ length: size }, (_, col) => <View key={col} style={{ flex: 1, minHeight: 38, borderRadius: 8, backgroundColor: col === tx && row === ty ? C.gold : C.paper, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.line }}>
          <Copy style={{ fontSize: 15, fontWeight: col === position[0] && row === position[1] ? "800" : "400" }}>{col === position[0] && row === position[1] ? "●" : `${String.fromCharCode(65 + col)}${row + 1}`}</Copy>
        </View>)}
      </View>)}
    </View>
    {!!scene.text && <Copy>{scene.text}</Copy>}
    <Copy style={{ fontSize: 24, letterSpacing: 2 }}>{scene.labels?.join(" ")}</Copy>
    {!commands.includes("?") && <View style={[styles.row, { flexWrap: "wrap", justifyContent: "center" }]}>
      <Button quiet compact disabled={disabled || steps >= commands.length} onPress={() => { onHelp(); setSteps(n => Math.min(n + 1, commands.length)); }}>Show one move</Button>
      <Button quiet compact disabled={!steps || disabled} onPress={() => setSteps(0)}>Reset crab</Button>
    </View>}
    {showHelp && <Copy style={{ fontSize: 14 }}>Follow the arrows in order. A block repeats every arrow inside it.</Copy>}
  </View>;
}
