import React from "react";
import { View } from "react-native";
import Svg, { Line } from "react-native-svg";
import { C, Copy } from "../components/ui";
import { ObjectGlyph } from "../learn/art/Objects";
import { mathResult, type MathQuestion } from "../math/questions";

/** Pictures only render the shared question; the arithmetic engine supplies the remaining amount. */
export function PracticeMathPicture({ question: q }: { question: MathQuestion }) {
  const adding = q.operation === "add";
  const count = adding ? mathResult(q) : q.a;
  const label = adding ? `${q.a} shells and ${q.b} more shells. Count them together.`
    : `${q.a} shells. ${q.b} are crossed out. Count the shells left.`;
  return <View accessible accessibilityLabel={label} style={{ alignItems: "center", gap: 4 }}>
    <Svg width={280} height={Math.ceil(count / 10) * 32} viewBox={`0 0 280 ${Math.ceil(count / 10) * 32}`}
      accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {Array.from({ length: count }, (_, i) => {
        const x = (i % 10) * 28, y = Math.floor(i / 10) * 32;
        const crossed = !adding && i >= mathResult(q);
        return <React.Fragment key={i}>
          <ObjectGlyph name="shell" x={x} y={y} size={26} color={adding && i >= q.a ? "blue" : "coral"} />
          {crossed && <Line x1={x + 2} y1={y + 25} x2={x + 24} y2={y + 2} stroke={C.ink} strokeWidth={3} />}
        </React.Fragment>;
      })}
    </Svg>
    <Copy style={{ fontSize: 14, color: C.ink, textAlign: "center" }}>{label}</Copy>
  </View>;
}
