import React from "react";
import { View } from "react-native";
import { Heading } from "../../components/ui";
import { BallArt, BeetleArt, HuskArt } from "./Art";
import { Bob } from "./Motion";
export const actionInstruction = (palm: boolean, learning: boolean, together = false) =>
  palm
    ? learning
      ? "Toss at the answer that matches."
      : "Slide to aim. Hold to toss beetles into nets!"
    : together
      ? "Drag your paddle. Play from opposite ends!"
      : learning
        ? "Return the ball. Count each splash together!"
        : "Drag your paddle. Bounce the ball past your buddy!";
export function Demo({ palm, learning }: { palm: boolean; learning: boolean }) {
  return (
    <View
      style={{
        width: 290,
        height: 160,
        overflow: "hidden",
        borderRadius: 24,
        backgroundColor: "#266E78",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {palm ? (
        <>
          <View style={{ flexDirection: "row", gap: 38 }}>
            <View>
              <BeetleArt size={65} />
              {learning && <Heading style={{ color: "#FFF5CF", textAlign: "center" }}>4</Heading>}
            </View>
            <View>
              <BeetleArt size={65} />
              {learning && <Heading style={{ color: "#FFF5CF", textAlign: "center" }}>5 ✓</Heading>}
            </View>
          </View>
          <Bob>
            <HuskArt size={38} />
          </Bob>
          <Heading style={{ color: "#FFF5CF", fontSize: 20 }}>{learning ? "2 + 3 = 5" : "↑ Slide & hold ↑"}</Heading>
        </>
      ) : (
        <>
          <View style={{ backgroundColor: "#EC8177", width: 100, height: 16, borderRadius: 12 }} />
          <Bob>
            <BallArt size={60} />
          </Bob>
          <View style={{ backgroundColor: "#56D7BE", width: 100, height: 16, borderRadius: 12 }} />
          <Heading style={{ color: "#FFF5CF", fontSize: 20 }}>← Drag your paddle →</Heading>
        </>
      )}
    </View>
  );
}
