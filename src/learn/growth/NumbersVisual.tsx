import React from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "../../components/Text";
import { C } from "../../components/ui";
import type { GrowthScene, GrowthVisualProps } from "./types";

const styles = StyleSheet.create({
  board: { alignSelf: "center", gap: 12, padding: 12, borderRadius: 18, backgroundColor: C.soft },
  row: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 },
  panel: { padding: 10, borderRadius: 12, borderWidth: 1, borderColor: C.line, backgroundColor: C.cream, gap: 8, flexShrink: 1, maxWidth: "100%" },
  label: { color: C.ink, fontSize: 17, fontWeight: "700", flexShrink: 1 },
  note: { color: C.ink, fontSize: 16, flexShrink: 1 },
  stone: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 16, borderWidth: 2, borderColor: C.teal, backgroundColor: C.paper, maxWidth: "100%" },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: C.coral, borderWidth: 1, borderColor: C.ink },
  ten: { flexDirection: "row", borderWidth: 1, borderColor: C.ink, backgroundColor: C.teal },
  unit: { width: 7, height: 16, borderRightWidth: 1, borderRightColor: C.cream },
});

function Dots({ count }: { count: number }) {
  return <View style={styles.row} accessible={false}>{Array.from({ length: count }, (_, i) => <View key={i} style={styles.dot} />)}</View>;
}

/** Amounts remain separate operands; never silently combine or regroup them. */
function Amount({ value, label, loose }: { value: number; label: string; loose: boolean }) {
  const bundles = loose ? 0 : Math.floor(value / 10), ones = loose ? value : value % 10;
  return <View style={styles.panel} accessible accessibilityLabel={`${label}: ${value} in value; ${bundles} bundles of ten and ${ones} loose ones.`}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.row} accessible={false}>
      {Array.from({ length: bundles }, (_, i) => <View key={i} style={styles.ten}>
        {Array.from({ length: 10 }, (_, j) => <View key={j} style={styles.unit} />)}
      </View>)}
    </View>
    <Dots count={ones} />
  </View>;
}

function EqualGroups({ values }: { values: readonly number[] }) {
  const [count, size, extra] = values;
  return <View style={{ gap: 10 }}>
    <Text style={styles.note}>{count} equal baskets; {size} shells in each.</Text>
    <View style={styles.row}>
      {Array.from({ length: count }, (_, i) => <View key={i} style={styles.panel} accessible accessibilityLabel={`Basket ${i + 1}: ${size} shells.`}>
        <Text style={styles.label}>Basket {i + 1}</Text><Dots count={size} />
      </View>)}
    </View>
    {extra > 0 && <View style={styles.panel} accessible accessibilityLabel={`${extra} extra shells, outside the baskets.`}>
      <Text style={styles.label}>{extra} extra shells</Text><Dots count={extra} />
    </View>}
  </View>;
}

function Stone({ text }: { text: string }) {
  return <View style={styles.stone}><Text style={styles.label}>{text}</Text></View>;
}

/** Known jump counts get one arrow each. Intermediate values require help.
 * Arrows are a route diagram, not a distance-scaled number line. */
function Path({ start, steps, help, end }: { start?: number; steps: readonly number[]; help: boolean; end?: number }) {
  const origin = start ?? (help && end !== undefined ? end - steps.reduce((a, b) => a + b, 0) : undefined);
  return <View style={styles.row}>
    <Stone text={origin === undefined ? "Start ?" : `Start ${origin}`} />
    {steps.map((step, i) => {
      const at = origin === undefined ? undefined : origin + steps.slice(0, i + 1).reduce((a, b) => a + b, 0);
      const shown = help && at !== undefined ? at : i === steps.length - 1 ? end : undefined;
      return <View key={i} style={styles.row}>
        <Text style={styles.note}>{step < 0 ? `← −${-step}` : `+${step} →`}</Text>
        <Stone text={shown === undefined ? "?" : String(shown)} />
      </View>;
    })}
  </View>;
}

function HopScene({ scene, help }: { scene: GrowthScene; help: boolean }) {
  const [a, b, c, d, e] = scene.values ?? [];
  const mode = scene.cells?.[0];
  const repeat = (step: number, count: number) => Array.from({ length: count }, () => step);
  if (mode === "missing-count") return <View style={{ gap: 8 }}>
    <Text style={styles.note}>How many jumps of {b}?</Text>
    {help ? <Path start={a} steps={repeat(b, (c - a) / b)} help />
      : <View style={styles.row}><Stone text={`Start ${a}`} /><Text style={styles.note}>→ ? jumps →</Text><Stone text={`End ${c}`} /></View>}
  </View>;
  if (mode === "equal-route") return <View style={{ gap: 8 }}>
    <Text style={styles.note}>First route: {a} jumps of {b}.</Text>
    <Path start={0} steps={repeat(b, a)} help={help} />
    <Text style={styles.note}>Same distance, using jumps of {c}. How many?</Text>
    {help && <Path start={0} steps={repeat(c, a * b / c)} help />}
  </View>;
  if (mode === "compare") return <View style={{ gap: 8 }}>
    <Text style={styles.label}>Turtle: {a} jumps of {b}</Text>
    <Path start={0} steps={repeat(b, a)} help={help} />
    <Text style={styles.label}>Crab: {c} jumps of {d}</Text>
    <Path start={0} steps={repeat(d, c)} help={help} />
  </View>;
  if (mode === "missing-start") return <Path steps={repeat(b, c)} end={a} help={help} />;
  if (mode === "mixed") return <Path start={a} steps={[...repeat(b, c), ...repeat(d, e)]} help={help} />;
  return <Path start={a} steps={repeat(mode === "back" ? -b : b, c)} help={help} />;
}

/** Static supporting models only. The common Board owns all answer/help controls.
 * No question.answer, choice highlighting, timers, gesture state or auto-reveal. */
export function NumbersVisual({ question, showHelp, width }: GrowthVisualProps) {
  const scene = question.scene;
  if (!scene) return null;
  return <View style={[styles.board, { width: Math.max(0, width) }]}>
    {scene.kind === "tens" && <>
      <Text style={styles.note}>Each long bar holds ten. Each dot is one.</Text>
      <View style={styles.row}>{scene.values?.map((n, i) => <Amount key={i} value={n}
        label={scene.labels?.[i] ?? `Part ${i + 1}`} loose={scene.cells?.[i] === "ones"} />)}</View>
    </>}
    {scene.kind === "groups" && <EqualGroups values={scene.values ?? []} />}
    {scene.kind === "hops" && <>
      <Text style={styles.note}>One arrow for each known jump. Work out the hidden stones.</Text>
      <HopScene scene={scene} help={showHelp} />
    </>}
    {scene.kind === "word" && <Text style={[styles.label, { fontSize: 22 }]}>{scene.text}</Text>}
  </View>;
}
