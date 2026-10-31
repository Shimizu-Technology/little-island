import React, { useEffect, useRef, useState } from "react";
import { Platform, View } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { Button, C, Chip, Copy, Heading, PressableScale, styles } from "../../../components/ui";
import type { BoardProps } from "../../types";
import { CoachSpot } from "../../Coach";
import { chamoruWord, type ChamoruWord } from "../../content/chamoru";
import { chooseActivity, IslandState, islandProgress, tapItem } from "./engine";
import { WordPicture } from "./pictures";
export const wordAudioKey = (id: string) => `hafa-adai-word-${id.replaceAll(".", "-").replaceAll("_", "-")}`;
const first = (english: string) => english.split(" / ")[0];
/** Food sits on the table first; everything else gathers on the blanket. */
const placeOrder: ChamoruWord["category"][] = ["food", "colors", "numbers", "greetings", "family", "body_parts"];
/** The picnic behind the pictures: bunting, sea, a table along the back and a checked blanket. */
function Picnic({ tableTop, rowHeight, rows }: { tableTop: number; rowHeight: number; rows: number }) {
  const h = tableTop + rowHeight * rows + 12;
  const blanketTop = tableTop + rowHeight + 6;
  return (
    <View style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0 }} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox={`0 0 300 ${h}`} preserveAspectRatio="none">
        <Rect width={300} height={h} fill="#F5E5BB" />
        <Rect width={300} height={tableTop + 10} fill="#D6E9E8" />
        <Path d={`M0 ${tableTop - 6}q75-12 150 0t150 0v18H0z`} fill="#8DC5C7" />
        <Path d="M0 4q150 26 300 0" fill="none" stroke="#8E9F83" strokeWidth={2} />
        {[20, 62, 104, 146, 188, 230, 272].map((x, i) => (
          <Path
            key={x}
            d={`M${x} ${8 + Math.abs(150 - x) * -0.03 + 6}l14 1-7 11z`}
            fill={["#C56D50", "#72A5B6", "#E1B251"][i % 3]}
          />
        ))}
        {/* Table */}
        <Rect x={8} y={tableTop + rowHeight - 4} width={284} height={9} rx={3} fill="#AF794D" />
        <Path
          d={`M22 ${tableTop + rowHeight + 5}v10M278 ${tableTop + rowHeight + 5}v10`}
          stroke="#8E5F3A"
          strokeWidth={5}
        />
        {/* Blanket */}
        {rows > 1 && (
          <>
            <Rect x={6} y={blanketTop} width={288} height={rowHeight * (rows - 1) + 2} rx={10} fill="#F3D6CC" />
            {Array.from({ length: 12 }, (_, i) => (
              <Rect
                key={i}
                x={6 + i * 24}
                y={blanketTop}
                width={12}
                height={rowHeight * (rows - 1) + 2}
                fill="#E7A99A"
                opacity={0.45}
              />
            ))}
          </>
        )}
      </Svg>
    </View>
  );
}
export function Board({
  session,
  update,
  practice,
  assistance,
  sound,
  soundOn,
  active,
  width,
  coach,
  cheer,
}: BoardProps<IslandState>) {
  const s = session.state,
    p = islandProgress(s),
    options = session.options;
  const [selected, setSelected] = useState<string | null>(null),
    [peek, setPeek] = useState(false);
  const target = chamoruWord(s.items[p.cursor]),
    shown = chamoruWord(selected ?? s.taps.at(-1) ?? "");
  const spy = s.activity === "spy",
    gentle = options.pace === "easy";
  const columns = s.items.length === 6 ? 3 : width >= 600 ? 6 : 4;
  const rows = Math.ceil(s.items.length / columns);
  const gap = 6,
    pad = 8;
  // The scene has a 1px border on each side.
  const slot = Math.floor((width - 2 - pad * 2 - gap * (columns - 1)) / columns);
  const pictureSize = Math.max(44, Math.min(84, slot - (spy ? 10 : 18)));
  const rowHeight = pictureSize + (spy ? 14 : 28);
  const tableTop = 30;
  const promptKey = p.done
    ? "hafa-adai-done"
    : !spy
      ? "hafa-adai-explore"
      : gentle && target
        ? `hafa-adai-find-${target.id.replaceAll(".", "-").replaceAll("_", "-")}`
        : "hafa-adai-spy";
  // The frame says the goal when a round opens; after that, speak each new direction.
  const fresh = useRef(session.revision === 0);
  useEffect(() => {
    // Web reloads have no user activation yet. The visible directions button remains
    // available; only auto-play after a gesture, so browsers never reject initial speech.
    const canAutoPlay =
      Platform.OS !== "web" || (typeof navigator !== "undefined" && navigator.userActivation?.hasBeenActive);
    if (!active || !soundOn || !canAutoPlay) return;
    const wait = fresh.current ? 3700 : 0;
    fresh.current = false;
    const timer = setTimeout(() => sound(promptKey, true), wait);
    return () => clearTimeout(timer);
  }, [active, soundOn, sound, promptKey]);
  function select(id: string) {
    if (!active) return;
    if (coach.active) coach.done();
    setSelected(id);
    const correct = !spy || id === target?.id;
    const next = tapItem(s, id);
    if (next !== s) {
      // Exploring is browsing, not an answer: only I spy finds count as practice.
      if (spy) practice(chamoruWord(target!.id)!.skill, correct);
      update(next);
    }
    if (spy && correct) {
      cheer();
      setPeek(false);
      setSelected(null);
    } else sound(spy ? "hafa-adai-compare" : wordAudioKey(id), spy);
  }
  const placed = [...s.items].sort((a, b) => {
    const ca = placeOrder.indexOf(chamoruWord(a)!.category),
      cb = placeOrder.indexOf(chamoruWord(b)!.category);
    return ca - cb || a.localeCompare(b);
  });
  // Explore shows where to tap; I spy never points at the answer.
  const coachId = spy ? undefined : placed[0];
  const missed = spy && !p.done && shown && ((selected && selected !== target?.id) || p.missed);
  return (
    <View style={{ gap: 10 }}>
      {options.mode === "solo" && (
        <View style={[styles.row, { flexWrap: "wrap" }]}>
          {(["explore", "spy"] as const).map((activity) => (
            <Chip
              key={activity}
              selected={s.activity === activity}
              onPress={() => {
                if (s.activity === "explore" && s.taps.length > 0) assistance?.();
                update(chooseActivity(s, activity, options));
                setSelected(null);
                setPeek(false);
              }}
            >
              {activity === "explore" ? "Explore" : "I spy"}
            </Chip>
          ))}
        </View>
      )}
      <View
        style={{ backgroundColor: C.paper, borderRadius: 16, padding: 12, gap: 4 }}
        accessibilityLiveRegion="polite"
      >
        {p.done ? (
          <>
            <Heading style={{ fontSize: 22 }}>
              {options.mode === "versus"
                ? p.scores[0] === p.scores[1]
                  ? "A good tie!"
                  : `${session.names?.[p.scores[0] > p.scores[1] ? 0 : 1] ?? "Player"} wins!`
                : spy
                  ? "You found every word!"
                  : "You explored the whole picnic!"}
            </Heading>
            <Copy style={{ color: C.ink }}>Every word has a picture friend.</Copy>
          </>
        ) : spy && target ? (
          <>
            <Copy style={{ fontSize: 15, color: C.ink }}>
              {options.mode === "versus" ? `${session.names?.[p.player] ?? "Player " + (p.player + 1)}: ` : ""}Find this
              word’s picture
            </Copy>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Heading style={{ fontSize: 32, flex: 1 }}>{target.term}</Heading>
              {!gentle && (
                <Button
                  quiet
                  compact
                  icon={peek ? "eye-off" : "eye"}
                  label={peek ? "Hide the English help" : "Peek at the English help"}
                  onPress={() => {
                    setPeek(!peek);
                    if (!peek) { assistance?.(); sound(wordAudioKey(target.id)); }
                  }}
                >
                  {peek ? "Hide" : "Peek"}
                </Button>
              )}
            </View>
            {(gentle || peek) && (
              <Copy style={{ fontSize: 14, color: C.muted }}>English: {first(target.english).toLowerCase()}</Copy>
            )}
          </>
        ) : (
          <>
            <Heading style={{ fontSize: 22 }}>Welcome to our picnic!</Heading>
            <Copy style={{ color: C.ink }}>Tap a picture to see its word.</Copy>
          </>
        )}
      </View>
      <View
        style={{
          borderRadius: 20,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: "#DCC895",
          paddingHorizontal: pad,
          paddingTop: tableTop,
          paddingBottom: 12,
        }}
      >
        <Picnic tableTop={tableTop} rowHeight={rowHeight} rows={rows} />
        <View style={{ flexDirection: "row", flexWrap: "wrap", columnGap: gap }}>
          {placed.map((id) => {
            const word = chamoruWord(id)!,
              found = spy && s.items.indexOf(id) < p.cursor,
              visited = !spy && p.visited.has(id),
              wrong = spy && missed && shown?.id === id;
            const tile = (
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel={
                  spy
                    ? `Picture ${placed.indexOf(id) + 1}: ${first(word.english)}${found ? ", found" : ""}`
                    : `${first(word.english)}${visited ? ", seen" : ""}`
                }
                accessibilityHint={spy ? undefined : "Shows its word"}
                onPress={() => select(id)}
                amount={0.94}
                style={{
                  width: slot,
                  height: rowHeight,
                  alignItems: "center",
                  justifyContent: "flex-end",
                  paddingBottom: 4,
                  borderRadius: 14,
                  borderWidth: 3,
                  borderColor: found ? "#4F8A66" : wrong ? C.gold : "transparent",
                  backgroundColor: found ? "#E3EFE3AA" : "transparent",
                }}
              >
                <WordPicture word={word} size={pictureSize} caption={false} />
                {!spy && (
                  <Copy style={{ fontSize: 12, lineHeight: 14, textAlign: "center", color: C.ink, fontWeight: "700" }}>
                    {first(word.english)}
                  </Copy>
                )}
                {(found || visited) && (
                  <View
                    style={{
                      position: "absolute",
                      top: 2,
                      right: 2,
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: "#4F8A66",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Svg width={12} height={12} viewBox="0 0 12 12">
                      <Path d="M2 6l3 3 5-6" stroke="#FFF" strokeWidth={2} fill="none" strokeLinecap="round" />
                    </Svg>
                  </View>
                )}
              </PressableScale>
            );
            return (
              <View key={id}>
                {id === coachId && !p.done ? (
                  <CoachSpot active={coach.active} handAt="bottom-right">
                    {tile}
                  </CoachSpot>
                ) : (
                  tile
                )}
              </View>
            );
          })}
        </View>
      </View>
      {shown && !p.done && (!spy || missed) && (
        <View
          style={{
            backgroundColor: C.paper,
            borderRadius: 14,
            padding: 10,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
          }}
          accessibilityLiveRegion="polite"
        >
          <WordPicture word={shown} size={54} caption={false} />
          <View style={{ flex: 1 }}>
            <Heading style={{ fontSize: 22 }}>{shown.term}</Heading>
            {spy ? (
              <Copy style={{ fontSize: 14, color: C.ink }}>That picture’s word. Try again!</Copy>
            ) : (
              <Copy style={{ fontSize: 14, color: C.ink }}>{shown.english}</Copy>
            )}
          </View>
        </View>
      )}
      <View style={[styles.row, { flexWrap: "wrap" }]}>
        <Button quiet compact icon="sound-on" disabled={!soundOn} onPress={() => sound(promptKey)}>
          Hear the directions
        </Button>
      </View>
      {options.mode === "versus" && (
        <Copy style={{ fontSize: 13, color: C.ink }}>
          {session.names?.[0]}: {p.scores[0]} · {session.names?.[1]}: {p.scores[1]} first-try finds. Pass after each
          word.
        </Copy>
      )}
      <Copy style={{ fontSize: 11, lineHeight: 15 }}>
        CHamoru words are text only. English directions can be heard.
      </Copy>
    </View>
  );
}
export function Art({ size }: { size: number }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Circle cx={50} cy={50} r={44} fill="#F6DBA7" />
      <Path d="M10 25q40 17 80 0" fill="none" stroke="#477D72" strokeWidth={2} />
      <Path d="M23 30h15l-7 14zM48 33h15l-7 14zM72 30h15l-7 14z" fill="#C56D50" />
      <Rect x={20} y={62} width={60} height={10} rx={3} fill="#AF794D" />
      <Path d="M26 72v15M74 72v15" stroke="#AF794D" strokeWidth={5} />
      <Path d="M39 43q16-5 11 10T34 62q-13-6 5-19" fill="#E1B251" />
      <Path d="M42 43q1-10 12-8-2 9-12 8" fill="#67947B" />
      <Path d="M57 50q12-22 23 0-11 18-23 0" fill="#72A5B6" />
      <Circle cx={62} cy={48} r={1.5} fill="#244F48" />
    </Svg>
  );
}
