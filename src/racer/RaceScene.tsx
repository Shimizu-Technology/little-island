import React, { forwardRef, memo, useImperativeHandle, useRef } from "react";
import { Platform, View } from "react-native";
import Svg, { Circle, Ellipse, G, Line, Path, Polygon, Rect, Text as SvgText } from "react-native-svg";
import { raceCourse } from "./courses";
import { obstaclePosition, RaceSession } from "./engine";
const UNIT = 38;
type Node = G<unknown>;
function move(node: Node | null, x: number, y: number, sy = 1, sx = 1, angle = 0) {
  if (!node) return;
  const c = Math.cos(angle),
    s = Math.sin(angle);
  const matrix = [c * sx, s * sx, -s * sy, c * sy, x, y];
  if (Platform.OS === "web")
    node.setNativeProps({ style: { transform: `matrix(${matrix.join(",")})` } } as unknown as Parameters<
      Node["setNativeProps"]
    >[0]);
  else node.setNativeProps({ matrix });
}
// WebShape only applies imperative presentation values inside style; native Shape accepts SVG props.
function presentation(node: Node | Path | null, props: { opacity?: number; fill?: string }) {
  if (!node) return;
  const target = node as Node; // Both SVG shapes accept these common presentation attributes.
  target.setNativeProps((Platform.OS === "web" ? { style: props } : props) as unknown as Parameters<Node["setNativeProps"]>[0]);
}
export type RaceSceneHandle = { draw: (session: RaceSession) => void };
/** Static world is memoized. Only camera, runner and obstacle SVG transforms change per frame. */
export const RaceScene = memo(
  forwardRef<RaceSceneHandle, { initial: RaceSession; width: number; height: number; reducedMotion: boolean }>(
    function RaceScene({ initial, width: frameWidth, height: frameHeight, reducedMotion }, ref) {
      // Preserve full jump headroom when a short landscape viewport scales the world down.
      const scale = Math.min(1, frameHeight / 255),
        width = frameWidth / scale,
        height = frameHeight / scale;
      const camera = useRef<Node | null>(null),
        actors = useRef<(Node | null)[]>([]),
        hazards = useRef<(Node | null)[]>([]),
        recoveryRings = useRef<(Node | null)[]>([]),
        bodies = useRef<(Node | null)[]>([]),
        feet = useRef<(Node | null)[]>([]),
        flagFills = useRef<(Path | null)[]>([]),
        lastSession = useRef(initial);
      const course = raceCourse(initial.course, initial.edition ?? 1),
        ground = height * 0.77;
      const draw = (s: RaceSession) => {
        lastSession.current = s;
        const cx = Math.max(0, Math.min(course.length * UNIT - width * 0.7, s.runners[0].x * UNIT - width * 0.26));
        move(camera.current, -cx, 0);
        for (const [i, r] of s.runners.entries()) {
          move(actors.current[i], r.x * UNIT, ground - r.y * UNIT - (i ? 5 + i * 3 : 0));
          const landing = !reducedMotion && r.landedAt !== undefined ? Math.max(0, 1 - (s.tick - r.landedAt) / 9) : 0;
          const stride =
            !reducedMotion && r.grounded && r.recovery === 0 && r.finishTick === null
              ? Math.sin(r.x * 7) * Math.min(1, Math.abs(r.vx) / 3)
              : 0;
          const celebrate = !reducedMotion && r.finishTick !== null ? Math.max(0, 1 - (s.tick - r.finishTick) / 18) : 0;
          move(
            bodies.current[i],
            0,
            -celebrate * 5,
            1 - landing * 0.12,
            1 + landing * 0.12,
            !reducedMotion && !r.grounded ? Math.max(-0.12, Math.min(0.12, r.vy * 0.015)) : 0
          );
          move(feet.current[i * 2], -3, -2, 1, 1, stride * 0.6);
          move(feet.current[i * 2 + 1], 3, -2, 1, 1, -stride * 0.6);
          presentation(recoveryRings.current[i], { opacity: r.recovery > 0 ? 1 : 0 });
          presentation(bodies.current[i], { opacity: r.recovery > 0 ? 0.45 : 1 });
        }
        for (const [i, flag] of flagFills.current.entries())
          presentation(flag, { fill: i <= s.runners[0].checkpoint ? "#E8B64E" : "#FFF7DC" });
        for (const [i, o] of course.obstacles.entries()) {
          const p = obstaclePosition(o, s.tick);
          // No cosmetic spin/bob; mechanical movement remains truthful with reduced motion.
          move(hazards.current[i], p.x * UNIT, ground - o.y * UNIT, o.kind === "gate" ? p.height / o.height : 1);
        }
      };
      useImperativeHandle(ref, () => ({ draw }));
      React.useLayoutEffect(() => {
        draw(lastSession.current);
      });
      return (
        <View
          accessible={false}
          style={{
            overflow: "hidden",
            borderRadius: 22,
            borderWidth: 2,
            borderColor: "#246858",
            backgroundColor: course.sky,
          }}
        >
          <Svg width="100%" height={frameHeight} viewBox={`0 0 ${width} ${height}`} accessible={false}>
            <Rect width={width} height={height} fill={course.sky} />
            <Circle cx={width * 0.83} cy={height * 0.18} r={24} fill="#F6D784" />
            <Path
              d={`M-20 ${ground - 30} Q${width * 0.15} ${ground - 115} ${width * 0.38} ${ground - 30} T${width + 30} ${ground - 20} L${width + 30} ${height} H-20Z`}
              fill="#A3CFC2"
              opacity={0.42}
            />
            <Rect y={ground + 18} width={width} height={height} fill="#7ABBB8" />
            {[0.1, 0.35, 0.6, 0.88].map((v, i) => (
              <Path
                key={i}
                d={`M${v * width} ${ground + 42 + (i % 2) * 17} q15 -5 30 0 t30 0`}
                stroke="#BCE1D8"
                strokeWidth={3}
                fill="none"
              />
            ))}
            <G ref={camera}>
              {Array.from({ length: Math.ceil(course.length / 9) }, (_, i) => (
                <G key={`landmark${i}`} transform={`translate(${(i * 9 + 4) * UNIT},${ground})`} opacity={0.55}>
                  {course.id === "canopy" ? (
                    <G>
                      <Path d="M0 8 Q-15 -65 -4 -112" stroke="#697F4D" strokeWidth={11} fill="none" />
                      <Ellipse cy={-112} rx={43} ry={25} fill="#7DA86A" />
                      <Ellipse cx={-29} cy={-100} rx={29} ry={22} fill="#93B677" />
                    </G>
                  ) : course.id === "sunset" ? (
                    <G>
                      <Path d="M-8 12 L4 -74 L11 -74 L0 12Z" fill="#C6A36E" />
                      <Path d="M7 -72 Q-28 -111 -43 -80 Q-12 -96 7 -72 Q38 -109 54 -77 Q28 -93 7 -72Z" fill="#859C6A" />
                    </G>
                  ) : (
                    <G>
                      <Path
                        d="M-15 15 Q-35 -6 -29 -26 M-15 15 L-8 -36 M-15 15 Q8 -4 10 -21"
                        stroke="#DFA58B"
                        strokeWidth={8}
                        strokeLinecap="round"
                        fill="none"
                      />
                    </G>
                  )}
                </G>
              ))}

              {course.platforms.map((p, i) => {
                const x = p.from * UNIT,
                  y = ground - p.y * UNIT,
                  w = (p.to - p.from) * UNIT;
                return (
                  <G key={i}>
                    {!p.oneWay && <Rect x={x} y={y} width={w} height={height + 100} fill={course.edge} />}
                    {p.oneWay && (
                      <G>
                        <Line x1={x} y1={y - 20} x2={x + w} y2={y - 20} stroke="#8E7860" strokeWidth={2} />
                        {Array.from({ length: Math.ceil(w / 40) }, (_, n) => (
                          <Line
                            key={n}
                            x1={x + n * 40}
                            y1={y - 20}
                            x2={x + n * 40}
                            y2={y + 5}
                            stroke="#8E7860"
                            strokeWidth={2}
                          />
                        ))}
                      </G>
                    )}
                    <Polygon
                      points={`${x},${y} ${x + 10},${y - 12} ${x + w + 10},${y - 12} ${x + w},${y}`}
                      fill={p.oneWay ? "#E8C98D" : course.land}
                    />
                    <Rect x={x} y={y} width={w} height={8} fill={p.oneWay ? "#D3AE70" : course.land} />
                    {!p.oneWay &&
                      Array.from({ length: Math.ceil(w / 48) }, (_, n) => (
                        <Path
                          key={n}
                          d={`M${x + n * 48 + 10} ${y + 28} l8 3 m12 18 l6 -2`}
                          stroke={course.land}
                          opacity={0.35}
                          strokeWidth={2}
                        />
                      ))}
                    {p.oneWay && course.id === "lagoon" && (
                      <Path
                        d={`M${x + w / 2 - 9} ${y - 21} q9 -18 18 0 l-9 4Z`}
                        fill="#F7D9AD"
                        stroke="#B78969"
                        strokeWidth={1.5}
                      />
                    )}
                    {p.belt &&
                      Array.from({ length: Math.floor(w / 35) }, (_, n) => (
                        <Path
                          key={`b${n}`}
                          d={`M${x + 15 + n * 35} ${y - 5} l${p.belt! > 0 ? 7 : -7} -3 l${p.belt! > 0 ? -7 : 7} -3`}
                          stroke="#5E654E"
                          fill="none"
                          strokeWidth={2}
                        />
                      ))}
                  </G>
                );
              })}
              {course.platforms
                .filter((p) => !p.oneWay && p.to < course.length)
                .map((p) => (
                  <G key={`gap${p.to}`} transform={`translate(${(p.to - 1.7) * UNIT},${ground - p.y * UNIT - 35})`}>
                    <Rect x={-20} y={-16} width={48} height={22} rx={7} fill="#FFF7DC" />
                    <SvgText x={4} y={-1} fontWeight="bold" fontSize={10} textAnchor="middle" fill="#246858">
                      JUMP ↗
                    </SvgText>
                  </G>
                ))}
              {course.platforms
                .filter((p) => p.oneWay)
                .map((p) => (
                  <G
                    key={`choice${p.from}`}
                    transform={`translate(${(p.from - 1.9) * UNIT},${ground - p.y * UNIT - 24})`}
                  >
                    <Rect x={-24} y={-15} width={65} height={23} rx={8} fill="#FFF8E6" />
                    <SvgText x={8} y={0} textAnchor="middle" fontSize={10} fontWeight="bold" fill="#246858">
                      HIGH ↗
                    </SvgText>
                  </G>
                ))}
              {course.obstacles.map((o, i) => (
                <G key={`warning${i}`} transform={`translate(${(o.x - 2.4) * UNIT},${ground - o.y * UNIT})`}>
                  <Path d="M-10 -12 L0 -29 L10 -12Z" fill="#F3D279" stroke="#8C6F38" />
                  <SvgText x={0} y={-15} textAnchor="middle" fontSize={11} fontWeight="bold" fill="#634B35">
                    !
                  </SvgText>
                </G>
              ))}
              {course.checkpoints.map((x, i) => {
                const p = course.platforms.find((p) => x >= p.from && x <= p.to)!;
                const y = ground - p.y * UNIT;
                return (
                  <G key={x}>
                    <Line x1={x * UNIT} y1={y} x2={x * UNIT} y2={y - 54} stroke="#426D60" strokeWidth={3} />
                    <Path
                      ref={(n) => {
                        flagFills.current[i] = n;
                      }}
                      d={`M${x * UNIT} ${y - 54} l26 5 l-26 12Z`}
                      fill="#FFF7DC"
                    />
                    <SvgText x={x * UNIT + 6} y={y - 42} fontSize={11} fontWeight="bold" fill="#246858">
                      {i + 1}
                    </SvgText>
                  </G>
                );
              })}
              {course.obstacles.map((o, i) => (
                <G
                  ref={(n) => {
                    hazards.current[i] = n as unknown as Node;
                  }}
                  key={i}
                >
                  {o.kind === "roller" ? (
                    <G>
                      <Circle
                        cy={(-o.height * UNIT) / 2}
                        r={(o.width * UNIT) / 2}
                        fill="#B9744D"
                        stroke="#F7D397"
                        strokeWidth={3}
                      />
                      <Circle cy={(-o.height * UNIT) / 2} r={4} fill="#754B3D" />
                      <Path
                        d={`M-7 ${(-o.height * UNIT) / 2 - 7} l14 14 M7 ${(-o.height * UNIT) / 2 - 7} l-14 14`}
                        stroke="#DCAC6E"
                        strokeWidth={2}
                      />
                    </G>
                  ) : (
                    <G>
                      <Rect
                        x={(-o.width * UNIT) / 2}
                        y={-o.height * UNIT}
                        width={o.width * UNIT}
                        height={o.height * UNIT}
                        rx={4}
                        fill={o.kind === "gate" ? "#E0B353" : "#CB775B"}
                        stroke="#FFF0CF"
                        strokeWidth={2}
                      />
                      <Path
                        d={`M${(-o.width * UNIT) / 2 + 5} ${-o.height * UNIT + 5} v${o.height * UNIT - 10}`}
                        stroke="#FFFFFF"
                        opacity={0.5}
                        strokeWidth={3}
                      />
                    </G>
                  )}
                </G>
              ))}
              <G transform={`translate(${course.length * UNIT},${ground})`}>
                <Line y2={-78} stroke="#214D44" strokeWidth={4} />
                <Rect y={-78} width={44} height={28} rx={3} fill="#FFF9E6" />
                {[0, 1, 2, 3].map((n) => (
                  <Rect key={n} x={n * 11} y={-78 + (n % 2) * 14} width={11} height={14} fill="#246858" />
                ))}
                <SvgText x={-12} y={-88} fontSize={11} fontWeight="bold" fill="#214D44">
                  FINISH
                </SvgText>
              </G>
              {[...initial.runners.keys()].reverse().map((i) => (
                <G
                  key={i}
                  ref={(n) => {
                    actors.current[i] = n as unknown as Node;
                  }}
                >
                  <G
                    ref={(n) => {
                      recoveryRings.current[i] = n as unknown as Node;
                    }}
                    opacity={0}
                  >
                    <Ellipse cy={1} rx={17} ry={7} fill="none" stroke="#E6B34D" strokeWidth={3} />
                    <Path d="M-14 -36 l4 -6 M14 -36 l-4 -6" stroke="#D6A441" strokeWidth={3} />
                  </G>
                  <Ellipse cy={2} rx={10} ry={4} fill="#214D44" opacity={0.18} />
                  <G
                    ref={(n) => {
                      bodies.current[i] = n as unknown as Node;
                    }}
                  >
                    <Rect
                      x={-7}
                      y={-23}
                      width={14}
                      height={18}
                      rx={7}
                      fill={["#246858", "#C57753", "#4A82A3", "#9A719E"][i]}
                      stroke="#FFF8E8"
                      strokeWidth={1.5}
                    />
                    <Circle
                      cy={-24}
                      r={6}
                      fill={["#246858", "#C57753", "#4A82A3", "#9A719E"][i]}
                      stroke="#FFF8E8"
                      strokeWidth={1.5}
                    />
                    <Circle cx={4} cy={-25} r={1.7} fill="#FFF8E8" />
                    <Path d="M-9 -19 l-4 6 M9 -19 l4 -5" stroke="#214D44" strokeWidth={3} strokeLinecap="round" />
                    {[0, 1].map((leg) => (
                      <G
                        key={leg}
                        ref={(n) => {
                          feet.current[i * 2 + leg] = n as unknown as Node;
                        }}
                      >
                        <Path d="M0 -4 v6 l4 0" stroke="#214D44" strokeWidth={3} strokeLinecap="round" />
                      </G>
                    ))}
                    <Path d="M-5 -17 l10 0" stroke="#F5D481" strokeWidth={3} />
                  </G>
                  {i === 0 && <Path d="M-5 -46 l5 6 l5 -6Z" fill="#E3B151" />}
                  <SvgText y={-52} textAnchor="middle" fontSize={10} fontWeight="bold" fill="#214D44">
                    {i === 0 ? "YOU" : initial.runners[i].name}
                  </SvgText>
                </G>
              ))}
            </G>
          </Svg>
        </View>
      );
    }
  ),
  // HUD ticks do not rebuild the entire SVG world. Live positions enter through draw().
  (a, b) =>
    a.initial.id === b.initial.id && a.width === b.width && a.height === b.height && a.reducedMotion === b.reducedMotion
);
