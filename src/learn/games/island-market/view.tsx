import React, { useCallback, useEffect, useRef, useState } from "react";
import { Animated, View } from "react-native";
import { Text } from "../../../components/Text";
import { Button, C, IconButton, PressableScale } from "../../../components/ui";
import type { BoardProps } from "../../types";
import { CoachSpot } from "../../Coach";
import { BasketShape, Crate, Customer, Mango, MarketArt, ShellCoin, ShellIcon, customerName, useShake } from "../../kit/NumberParts";
import { COINS, pieceTotal, splitNumber, type Pieces } from "../../kit/numbers";
import { marketMax, marketOrder, nextCustomer, packPiece, serve, server, type MarketState } from "./engine";
import type { MarketOrder } from "./orders";

const ink = C.ink;
type Part = "tens" | "ones" | 0 | 1 | 2 | 3;

/** A speech bubble pointing left at the customer. */
function Bubble({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <View accessible accessibilityLabel={label} style={{ flexShrink: 1 }}>
      <View
        style={{
          backgroundColor: C.paper,
          borderRadius: 20,
          borderWidth: 3,
          borderColor: ink,
          paddingHorizontal: 12,
          paddingVertical: 6,
          alignItems: "center",
          justifyContent: "center",
          minHeight: 64,
        }}
      >
        {children}
      </View>
      <View
        style={{
          position: "absolute",
          left: -9,
          top: 22,
          width: 16,
          height: 16,
          backgroundColor: C.paper,
          borderLeftWidth: 3,
          borderBottomWidth: 3,
          borderColor: ink,
          transform: [{ rotate: "45deg" }],
        }}
      />
    </View>
  );
}
const Big = ({ children, size = 44 }: { children: React.ReactNode; size?: number }) => (
  <Text style={{ fontSize: size, fontWeight: "900", color: ink, lineHeight: size * 1.1 }}>{children}</Text>
);
function Person({ who, happy, size, name }: { who: number; happy: boolean; size: number; name: string }) {
  return (
    <View style={{ alignItems: "center" }}>
      <Customer who={who} happy={happy} size={size} />
      <Text style={{ fontSize: 14, fontWeight: "900", color: ink }}>{name}</Text>
    </View>
  );
}

/** What this customer wants, said with pictures and one big number. */
function Order({ order, who, happy, compact }: { order: MarketOrder; who: number; happy: boolean; compact: boolean }) {
  const size = compact ? 86 : 112;
  if (happy)
    return (
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
        <Person who={order.kind === "add" ? 0 : who} happy size={size} name={order.kind === "add" ? "Auntie" : customerName(who)} />
        {order.kind === "add" && <Person who={1} happy size={size} name="Kiko" />}
        <Bubble label="Thank you!">
          <Big size={30}>Thank you!</Big>
        </Bubble>
      </View>
    );
  if (order.kind === "add") {
    const friend = (w: number, n: number, name: string) => (
      <View style={{ alignItems: "center", gap: 2 }}>
        <View
          accessible
          accessibilityLabel={`${name} wants ${n}`}
          style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: C.paper, borderRadius: 18, borderWidth: 3, borderColor: ink, paddingHorizontal: 12 }}
        >
          <Big size={40}>{n}</Big>
          <Mango size={32} />
        </View>
        <Person who={w} happy={false} size={size * 0.72} name={name} />
      </View>
    );
    return (
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12 }}>
        {friend(0, order.a, "Auntie")}
        <Big size={40}>+</Big>
        {friend(1, order.b, "Kiko")}
      </View>
    );
  }
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
      <Person who={who} happy={false} size={size} name={customerName(who)} />
      {order.kind === "pack" ? (
        <Bubble label={`${order.a} mangoes, please`}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Big size={56}>{order.a}</Big>
            <Mango size={52} />
          </View>
        </Bubble>
      ) : order.kind === "subtract" ? (
        <Bubble label={`We had ${order.a}. We sold ${order.b}. How many are left?`}>
          <Text style={{ fontSize: 16, fontWeight: "800", color: ink }}>Had {order.a}, sold {order.b}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Big size={40}>
              {order.a} − {order.b}
            </Big>
            <Mango size={34} />
          </View>
        </Bubble>
      ) : (
        <Bubble label={`It costs ${order.b} shells. I pay ${order.a}. My change, please.`}>
          <Text style={{ fontSize: 18, fontWeight: "800", color: ink }}>It costs {order.b}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={{ fontSize: 18, fontWeight: "800", color: ink }}>I pay</Text>
            <Big size={36}>{order.a}</Big>
            <ShellIcon size={30} />
          </View>
          <Text style={{ fontSize: 16, fontWeight: "800", color: ink }}>My change?</Text>
        </Bubble>
      )}
    </View>
  );
}

/** The basket: everything she has packed, each piece tappable to take it back. */
function Basket({
  pieces,
  money,
  total,
  width,
  disabled,
  take,
  shake,
}: {
  pieces: Pieces;
  money: boolean;
  total: number;
  width: number;
  disabled: boolean;
  take: (part: Part) => void;
  shake: Animated.Value;
}) {
  const items: { part: Part; key: string }[] = money
    ? ([3, 2, 1, 0] as const).flatMap((i) => Array.from({ length: pieces.coins[i] }, (_, k) => ({ part: i as Part, key: `c${i}-${k}` })))
    : [
        ...Array.from({ length: pieces.tens }, (_, k) => ({ part: "tens" as Part, key: `t${k}` })),
        ...Array.from({ length: pieces.ones }, (_, k) => ({ part: "ones" as Part, key: `o${k}` })),
      ];
  const basketW = Math.min(width - 96, 360),
    small = items.length > 14;
  const [basketH, setBasketH] = useState(118);
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 }}>
      <View
        accessibilityLabel={`Basket: ${total}${money ? " shells" : " mangoes"}`}
        onLayout={(e) => setBasketH(Math.round(e.nativeEvent.layout.height))}
        style={{ width: basketW, minHeight: 118, paddingTop: 22, paddingHorizontal: 18, paddingBottom: 12, justifyContent: "center" }}
      >
        <BasketShape width={basketW} height={basketH} />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 3, justifyContent: "center", alignItems: "flex-end" }}>
          {items.length === 0 && <Text style={{ fontSize: 16, fontWeight: "800", color: "#6E4426" }}>Empty</Text>}
          {items.map((it) => (
            <PressableScale
              key={it.key}
              accessibilityRole="button"
              accessibilityLabel={
                it.part === "tens" ? "Take back a crate of ten" : it.part === "ones" ? "Take back a mango" : `Take back a ${COINS[it.part as number]} shell`
              }
              disabled={disabled}
              onPress={() => take(it.part)}
              amount={0.88}
              style={{ minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" }}
            >
              {it.part === "tens" ? (
                <Crate size={small ? 46 : 54} />
              ) : it.part === "ones" ? (
                <Mango size={small ? 30 : 36} />
              ) : (
                <ShellCoin value={COINS[it.part as number]} size={small ? 32 : 38} />
              )}
            </PressableScale>
          ))}
        </View>
      </View>
      <Animated.View style={{ minWidth: 70, alignItems: "center", transform: [{ translateX: shake }] }}>
        <Text style={{ fontSize: 52, fontWeight: "900", color: ink, lineHeight: 58 }}>{total}</Text>
        {money ? <ShellCoin value={1} size={30} /> : <Mango size={30} />}
      </Animated.View>
    </View>
  );
}

function Pile({ label, onPress, disabled, children }: { label: string; onPress: () => void; disabled: boolean; children: React.ReactNode }) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      amount={0.92}
      style={{
        flex: 1,
        minHeight: 92,
        maxWidth: 200,
        borderRadius: 20,
        borderWidth: 3,
        borderColor: "#C99362",
        backgroundColor: "#FFF4DD",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 6,
      }}
    >
      {children}
    </PressableScale>
  );
}
const MangoPile = () => (
  <View style={{ alignItems: "center" }}>
    <View style={{ flexDirection: "row", marginBottom: -14 }}>
      <Mango size={34} />
      <Mango size={34} />
    </View>
    <View style={{ flexDirection: "row" }}>
      <Mango size={34} />
      <Mango size={34} />
      <Mango size={34} />
    </View>
  </View>
);

function CompareCard({ who, n, onPress, disabled, wrong, happy }: { who: number; n: number; onPress: () => void; disabled: boolean; wrong: number; happy: boolean }) {
  const shake = useShake(wrong);
  const parts = splitNumber(n);
  return (
    <Animated.View style={{ flex: 1, transform: [{ translateX: shake }] }}>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={`${customerName(who)} wants ${n}`}
        disabled={disabled}
        onPress={onPress}
        style={{
          minHeight: 250,
          borderRadius: 22,
          borderWidth: 3,
          borderColor: happy ? C.teal : "#C99362",
          backgroundColor: happy ? C.success : "#FFF4DD",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
          padding: 8,
        }}
      >
        <Customer who={who} happy={happy} size={76} />
        <Text style={{ fontSize: 15, fontWeight: "900", color: ink }}>{customerName(who)}</Text>
        <View style={{ backgroundColor: C.paper, borderRadius: 16, borderWidth: 3, borderColor: ink, paddingHorizontal: 12 }}>
          <Big size={44}>{n}</Big>
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", alignItems: "flex-end", gap: 1, minHeight: 34 }}>
          {Array.from({ length: parts.tens }, (_, i) => (
            <Crate key={`t${i}`} size={30} />
          ))}
          {Array.from({ length: parts.ones }, (_, i) => (
            <Mango key={`o${i}`} size={18} />
          ))}
        </View>
      </PressableScale>
    </Animated.View>
  );
}

export function Board({ session, update, practice, sound, active, width, coach, cheer }: BoardProps<MarketState>) {
  const s = session.state,
    o = session.options,
    order = marketOrder(s),
    money = order?.kind === "change";
  const total = pieceTotal(s.pieces, money);
  const who = s.index % 4;
  const [feedback, setFeedback] = useState<"under" | "over" | null>(null);
  const [pickWrong, setPickWrong] = useState({ n: 0, key: 0 });
  const [bump, setBump] = useState(0);
  const shake = useShake(bump);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);
  const packing = s.phase === "pack" || s.phase === "order";
  const orderAudio = order ? `island-market-${order.id}` : "island-market-finish";

  // Each new customer says their order. The first waits for the game's spoken intro.
  useEffect(() => {
    if (!active || !packing) return;
    const t = setTimeout(() => sound(orderAudio, true), session.revision === 0 ? 3700 : 450);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, s.index, packing]);
  // A served customer says thank you, then the next one steps up.
  useEffect(() => {
    if (!active || s.phase !== "served") return;
    const t = setTimeout(() => update(nextCustomer(s)), 2100);
    return () => clearTimeout(t);
  }, [active, s, update]);
  useEffect(() => {
    if (!active || s.phase !== "done") return;
    const t = setTimeout(() => sound("island-market-finish", true), 1800);
    return () => clearTimeout(t);
  }, [active, s.phase, sound]);

  function change(part: Part, delta: 1 | -1) {
    if (!active || !packing) return;
    const next = packPiece(s, o, part, delta);
    if (next === s) return;
    if (coach.active) coach.done();
    setFeedback(null);
    sound(`reef-race-number-${pieceTotal(next.pieces, money)}`, true);
    update(next);
  }
  function give(choice?: number) {
    if (!active || !order || !packing) return;
    const next = serve(s, choice);
    practice(order.skill, next !== s);
    if (next === s) {
      if (order.kind === "compare") {
        setPickWrong((w) => ({ n: choice ?? 0, key: w.key + 1 }));
        sound("island-market-compare-try", true);
        return;
      }
      const kind = total < order.target ? "under" : "over";
      setFeedback(kind);
      setBump((k) => k + 1);
      sound(`island-market-${kind}`, true);
      return;
    }
    if (coach.active) coach.done();
    setFeedback(null);
    cheer();
    later(() => sound("island-market-served", true), 550);
    update(next);
  }

  if (s.phase === "done" || !order)
    return (
      <View style={{ gap: 12, alignItems: "center", padding: 12 }}>
        <MarketArt size={Math.min(260, width)} />
        <View style={{ flexDirection: "row", gap: 4 }}>
          {[0, 1, 2, 3].map((w) => (
            <Customer key={w} who={w} happy size={Math.min(70, width / 5)} />
          ))}
        </View>
        <Text style={{ fontSize: 24, fontWeight: "900", color: ink, textAlign: "center" }}>Everyone has their mangoes!</Text>
        <IconButton icon="sound-on" label="Hear it again" onPress={() => sound("island-market-finish")} />
      </View>
    );

  const served = s.phase === "served";
  const compact = width < 360;
  const crates = !money && (o.pace !== "easy" || order.target >= 10);
  const turnName = o.mode === "together" ? session.names?.[server(s)] ?? `Player ${server(s) + 1}` : null;
  const prompt =
    feedback === "under"
      ? "A little more!"
      : feedback === "over"
      ? "Too many! Tap one to take back."
      : served
      ? `Yes! ${order.target} ${money ? "shells" : "mangoes"}!`
      : order.kind === "compare"
      ? "Who wants more? Tap them!"
      : money
      ? "Tap shells to give the change."
      : order.kind === "add"
      ? "Fill one basket for both!"
      : order.kind === "subtract"
      ? "Put the ones left in the basket."
      : "Fill the basket, then tap Give it!";
  const mangoPile = (
    <Pile label="Add one mango" onPress={() => change("ones", 1)} disabled={!active || served || total + 1 > marketMax(o)}>
      <MangoPile />
      <Text style={{ fontSize: 18, fontWeight: "900", color: ink }}>+1</Text>
    </Pile>
  );
  return (
    <View style={{ gap: 10, maxWidth: 560, width: "100%", alignSelf: "center" }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, minHeight: 44 }}>
        <View accessibilityLabel={`Customer ${s.index + 1} of ${s.orders.length}`} style={{ flexDirection: "row", gap: 5 }}>
          {s.orders.map((_, i) => (
            <View
              key={i}
              style={{
                width: 14,
                height: 14,
                borderRadius: 7,
                borderWidth: 2,
                borderColor: ink,
                backgroundColor: i < s.served.length ? C.teal : i === s.index ? C.gold : "transparent",
              }}
            />
          ))}
        </View>
        {turnName && (
          <View style={{ backgroundColor: C.paper, borderRadius: 14, borderWidth: 2, borderColor: C.teal, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ fontSize: 15, fontWeight: "900", color: ink }}>{turnName}’s turn</Text>
          </View>
        )}
        <IconButton icon="sound-on" label="Hear the order again" onPress={() => sound(orderAudio)} />
      </View>
      {order.kind === "compare" ? (
        <CoachSpot active={coach.active && packing} handAt="none">
          <View style={{ flexDirection: "row", gap: 10 }}>
            {[order.a, order.b].map((n, i) => (
              <CompareCard key={i} who={i as 0 | 1} n={n} onPress={() => give(n)} disabled={!active || served} wrong={pickWrong.n === n ? pickWrong.key : 0} happy={served && n === order.target} />
            ))}
          </View>
        </CoachSpot>
      ) : (
        <View style={{ alignItems: "center" }}>
          <Order order={order} who={who} happy={served} compact={compact} />
        </View>
      )}
      <Text
        accessibilityLiveRegion="polite"
        style={{ fontSize: 20, fontWeight: "900", color: feedback === "over" ? C.error : ink, textAlign: "center", minHeight: 28 }}
      >
        {prompt}
      </Text>
      {order.kind !== "compare" && (
        <>
          <Basket
            pieces={s.pieces}
            money={money}
            total={total}
            width={width}
            disabled={!active || served}
            take={(part) => change(part, -1)}
            shake={shake}
          />
          {!served && (
            <View style={{ flexDirection: "row", gap: 8, justifyContent: "center" }}>
              {money ? (
                COINS.map((value, i) => {
                  const pile = (
                    <Pile
                      key={value}
                      label={`Add a ${value} shell`}
                      onPress={() => change(i as Part, 1)}
                      disabled={!active || total + value > marketMax(o)}
                    >
                      <ShellCoin value={value} size={46} />
                    </Pile>
                  );
                  return i === 0 ? (
                    <CoachSpot key={value} active={coach.active} style={{ flex: 1 }}>
                      {pile}
                    </CoachSpot>
                  ) : (
                    pile
                  );
                })
              ) : (
                <>
                  <CoachSpot active={coach.active} style={{ flex: 1, maxWidth: 200 }}>
                    {mangoPile}
                  </CoachSpot>
                  {crates && (
                    <Pile label="Add a crate of ten mangoes" onPress={() => change("tens", 1)} disabled={!active || total + 10 > marketMax(o)}>
                      <Crate size={70} />
                      <Text style={{ fontSize: 18, fontWeight: "900", color: ink }}>+10</Text>
                    </Pile>
                  )}
                </>
              )}
            </View>
          )}
          {!served && (
            <Button disabled={!active || total === 0} onPress={() => give()} style={{ minHeight: 58, alignSelf: "stretch" }}>
              Give it!
            </Button>
          )}
        </>
      )}
    </View>
  );
}

export function Art({ size }: { size: number }) {
  return (
    <View
      accessibilityLabel="An island market with mangoes and a friendly customer"
      style={{ width: size, height: size, justifyContent: "center", alignItems: "center" }}
    >
      <MarketArt size={size * 0.9} />
      <View style={{ position: "absolute", right: 0, bottom: size * 0.08 }}>
        <Customer who={1} happy size={size * 0.34} />
      </View>
    </View>
  );
}
