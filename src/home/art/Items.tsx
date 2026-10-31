import { LivingArt, hasLivingArt } from './LivingArt';
import { SeatArt, hasSeatArt } from './SeatArt';
import type { ArtLayer, ItemVisualState } from '../world';
import React from "react";
import Svg, { Circle, Ellipse, G, Path, Rect, Defs, Filter, FeColorMatrix, LinearGradient, Stop, Text as SvgText } from "react-native-svg";
import { StickerArt } from "../../arcade/Art";
import type { StickerId } from "../../arcade/progress";
import type { ItemId } from "../catalog";
import { material, shade } from "./Tint";
import type { TintId } from "../catalogMore";
import { ItemFinish, ItemLife, ItemMotion } from "./Finish";
const ink = "#385451",
  wood = "#D99E6C",
  pale = "#FFF1D3",
  defaultCoral = "#EC9989",
  defaultTeal = "#79BDB1";
const star = "M0-10L3-3L10-3L5 2L7 10L0 6L-7 10L-5 2L-10-3L-3-3Z";
export function ItemArt({
  item,
  active = false,
  size = 120,
  mirrored = false,
  rotation = 0,
  foreground = false,
  muted = false,
  tint = "original",
  animated = false,
  reduced = false,
  layer = "all",
  state,
}: {
  layer?: ArtLayer;
  state?: ItemVisualState;
  item: ItemId;
  active?: boolean;
  size?: number;
  mirrored?: boolean;
  rotation?: number;
  foreground?: boolean;
  muted?: boolean;
  tint?: TintId;
  animated?: boolean;
  reduced?: boolean;
}) {
  if (hasLivingArt(item)) return layer === 'front' ? null : <LivingArt id={item} size={size} state={state ?? {on: active}} mirrored={mirrored} rotation={rotation} tint={tint} reduced={reduced}/>;
  if (hasSeatArt(item)) return <SeatArt id={item} size={size} layer={foreground ? "front" : layer} mirrored={mirrored} rotation={rotation} tint={tint} state={state ?? {on: active}} motion={art => <ItemMotion active={active} animated={animated} reduced={reduced}>{art}</ItemMotion>}/>;
  if (layer === 'front') return null;
  const coral = item === "aquarium" ? defaultCoral : material(tint, defaultCoral);
  const teal = ["plant", "aquarium"].includes(item) ? defaultTeal : item === "surfboard" && tint !== "original" ? shade(material(tint, defaultTeal), .35) : material(tint, defaultTeal);
  const paint = (original: string) => material(tint, original);
  const highlight = (original: string) => tint === "original" ? original : shade(material(tint, original), .35);
  if (item.startsWith("sticker:")) return <StickerArt id={item.slice(8) as StickerId} size={size} />;
  if (foreground) return <Svg width={size} height={size} viewBox="0 0 150 130" accessible={false}><G transform={`translate(${mirrored !== (rotation === 180 || rotation === 270) ? 150 : 0} 0) scale(${mirrored !== (rotation === 180 || rotation === 270) ? -1 : 1} 1)`} stroke={ink} strokeWidth={2.5} strokeLinejoin="round"><Path d="M44 95L125 87V94L44 102Z" fill={coral}/></G></Svg>;
  const legs = (
    <G stroke={ink} strokeWidth={3} strokeLinecap="round">
      <Path d="M33 92L29 116M112 92L117 116" />
      <Path d="M38 95L35 115M108 96L111 115" stroke={wood} strokeWidth={7} />
    </G>
  );
  const books = (
    <G strokeWidth={2}>
      {[0, 1, 2, 3, 4].map((n) => (
        <G key={n} transform={`translate(${34 + n * 16} 40) rotate(${n === 4 ? 8 : 0})`}>
          <Rect width={12} height={43 - (n % 2) * 8} rx={2} fill={[coral, teal, "#E4BF65", "#B7A6CF", "#8FBACB"][n]} />
          <Path d="M3 7H9M3 28H9" stroke={pale} />
        </G>
      ))}
    </G>
  );
  return (
    <Svg width={size} height={size} viewBox="0 0 150 130" accessible={false}>
      <Defs><LinearGradient id={`item-coral-${item}`} x1="0%" y1="0%" x2="15%" y2="100%"><Stop offset="0%" stopColor={shade(coral,.3)}/><Stop offset="45%" stopColor={coral}/><Stop offset="100%" stopColor={shade(coral,-.18)}/></LinearGradient><LinearGradient id={`item-teal-${item}`} x1="0%" y1="0%" x2="15%" y2="100%"><Stop offset="0%" stopColor={shade(teal,.3)}/><Stop offset="45%" stopColor={teal}/><Stop offset="100%" stopColor={shade(teal,-.18)}/></LinearGradient><Filter id={`muted-${item}`}><FeColorMatrix type="saturate" values="0"/></Filter></Defs>
      <G filter={muted ? `url(#muted-${item})` : undefined}>
      <Ellipse cx={75} cy={119} rx={57} ry={7} fill="#44645A" opacity={0.12} />
      <G
        transform={`translate(${mirrored ? 150 : 0} 0) scale(${mirrored ? -1 : 1} 1)`}
        stroke={ink}
        strokeWidth={2.1}
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        <G transform={rotation === 180 || rotation === 270 ? "translate(150 0) scale(-1 1)" : undefined}>
          <ItemMotion active={active} animated={animated} reduced={reduced}>
          {item === "robot-buddy" ? (
            <><Rect x={41} y={39} width={68} height={68} rx={15} fill={`url(#item-teal-${item})`}/><Path d="M75 39V26"/><Circle cx={75} cy={23} r={5} fill="#E7BD68"/><Circle cx={59} cy={68} r={5} fill={pale}/><Circle cx={91} cy={68} r={5} fill={pale}/><Path d="M59 83Q75 99 91 83" fill="none" stroke={pale} strokeWidth={4}/><Path d="M51 107V118M99 107V118" strokeWidth={7}/></>
          ) : item === "computer-desk" ? (
            <><Path d="M20 81H130V97H20Z" fill={wood}/><Path d="M31 96V119M119 96V119" stroke={wood} strokeWidth={8}/><Rect x={42} y={23} width={66} height={53} rx={5} fill="#3A526B"/><Rect x={47} y={28} width={56} height={39} rx={2} fill="#A8D1CB"/><Path d="m62 42-8 6 8 6m27-12 8 6-8 6M73 54l6-15" fill="none" stroke="#3A526B" strokeWidth={3}/><Path d="M75 76v9M59 86h32" stroke="#3A526B" strokeWidth={5}/></>
          ) : item === "bed" ? (
            <>
              <Path d="M18 41L116 34L135 92L36 105Z" fill={wood} />
              <Path d="M18 42V88L36 105V61Z" fill="#BA805D" />
              <Path d="M19 44Q15 20 27 19L108 14Q121 13 122 35L124 50" fill="#E9BF91" />
              <Path d="M23 49L115 42L131 84L37 96Z" fill={pale} />
              <Path d="M30 64L120 56L130 84L38 96Z" fill={`url(#item-teal-${item})`} />
              <Path d="M39 66L47 94M55 64L64 92M72 63L80 89M88 61L96 87" stroke={highlight("#A7D7C7")} />
              <Path d="M30 48Q32 38 40 39L72 36Q83 38 83 50L39 55Z" fill="#FFF9E9" />
              <Path d="M37 104V117M128 92V107" strokeWidth={7} />
              <Circle cx={31} cy={29} r={3} fill={pale} />
            </>
          ) : item === "rug" || item === "mat" ? (
            <>
              <Ellipse cx={75} cy={91} rx={67} ry={26} fill={item === "rug" ? teal : paint("#D9B87F")} />
              <Ellipse
                cx={75}
                cy={91}
                rx={58}
                ry={20}
                fill="none"
                stroke={item === "rug" ? "#D6EBDD" : highlight("#F6DFAB")}
                strokeWidth={4}
              />
              {[0, 1, 2, 3, 4, 5].map((n) => (
                <Path
                  key={n}
                  d={`M${28 + n * 18} 76L${28 + n * 18} 106`}
                  stroke={item === "rug" ? "#A6D3C4" : "#AB8558"}
                  strokeWidth={2}
                />
              ))}
              <Path d="M15 83L5 81M14 93L3 94M18 103L8 107M135 83L145 81M136 93L147 94M132 103L142 107" />
            </>
          ) : item === "table" || item === "checkers" ? (
            <>
              {legs}
              <Ellipse cx={75} cy={79} rx={62} ry={23} fill={wood} />
              <Ellipse cx={75} cy={74} rx={62} ry={23} fill={pale} />
              {item === "checkers" ? (
                <G transform="translate(39 58)">
                  {Array.from({ length: 24 }, (_, n) => (
                    <Rect
                      key={n}
                      x={(n % 6) * 12}
                      y={Math.floor(n / 6) * 8}
                      width={12}
                      height={8}
                      fill={(n + Math.floor(n / 6)) % 2 ? teal : pale}
                      strokeWidth={0.5}
                    />
                  ))}
                  {[0, 2, 4].map((n) => (
                    <Ellipse key={n} cx={n * 12 + 6} cy={5} rx={4} ry={2} fill={`url(#item-coral-${item})`} />
                  ))}
                </G>
              ) : (
                <>
                  <Ellipse cx={76} cy={71} rx={20} ry={8} fill={`url(#item-coral-${item})`} />
                  <Path d="M73 68Q79 56 86 63" fill={`url(#item-teal-${item})`} />
                </>
              )}
            </>
          ) : item === "chair" ? (
            <>
              <Path d="M40 74V30Q41 17 54 17H97Q107 17 107 30V76" fill={`url(#item-coral-${item})`} />
              <Path d="M51 32V58M75 31V57M96 32V57" stroke={highlight("#F9C9AC")} strokeWidth={5} />
              <Path d="M32 83L112 78L125 91L44 99Z" fill={paint("#F7BD9C")} />
              <Path d="M44 100V119M118 93V113M36 84V103" stroke={wood} strokeWidth={7} />
            </>
          ) : item === "shelf" || item === "books" || item === "trophies" ? (
            <>
              <Rect x={22} y={24} width={106} height={87} rx={7} fill={wood} />
              <Rect x={29} y={31} width={92} height={68} rx={3} fill="#B98160" />
              <Path d="M29 66H121M25 106H125" stroke="#F4CD9C" strokeWidth={7} />
              {item === "books" ? (
                <G transform="translate(0 -5) scale(1 .8)">{books}</G>
              ) : item === "trophies" ? (
                <G fill="#EDC367">
                  <Path d="M58 34H92L86 52L75 57L64 52Z" />
                  <Path
                    d="M58 36Q39 33 53 48L64 49M92 36Q111 33 97 48L86 49M75 57V65M63 65H87"
                    fill="none"
                    strokeWidth={4}
                  />
                </G>
              ) : (
                <>
                  <Circle cx={47} cy={49} r={11} fill={`url(#item-teal-${item})`} />
                  <Path d={star} transform="translate(94 48)" fill="#EBC76B" />
                </>
              )}
              <Rect x={38} y={78} width={29} height={20} rx={4} fill={`url(#item-teal-${item})`} />
              <Path d="M47 84H58" stroke={pale} />
              <Path d="M85 98V78H96V98M102 98V74H112V98" fill={`url(#item-coral-${item})`} />
            </>
          ) : item === "plant" ? (
            <>
              <Path d="M58 87Q70 66 74 28M76 86Q83 60 107 48" fill="none" strokeWidth={5} />
              <Path
                d="M73 50Q38 51 34 26Q65 18 73 50M76 37Q72 8 100 12Q109 30 76 37M83 66Q88 35 121 41Q122 65 83 66M67 71Q35 75 29 53Q54 43 67 71"
                fill={`url(#item-teal-${item})`}
              />
              <Path d="M47 84H100L93 113Q75 124 55 113Z" fill={`url(#item-coral-${item})`} />
              <Path d="M51 94H96" stroke={highlight("#F9C9AC")} strokeWidth={5} />
            </>
          ) : item === "lamp" || item === "island-lamp" ? (
            <>
              {active && <Circle cx={75} cy={57} r={56} fill="#FFE7A0" stroke="none" opacity={0.55} />}
              <Ellipse cx={75} cy={114} rx={25} ry={7} fill={wood} />
              <Path d="M75 107V55" stroke={wood} strokeWidth={8} />
              <Path d="M50 18H99L118 64Q75 81 32 64Z" fill={active ? "#FFEAA6" : paint("#E9C475")} />
              {item === "island-lamp" ? (
                [0, 1, 2, 3, 4].map((n) => (
                  <Path
                    key={n}
                    d={`M${52 + n * 11} 23L${39 + n * 18} 61M41 ${35 + n * 9}H109`}
                    stroke="#B99055"
                    strokeWidth={1.5}
                  />
                ))
              ) : (
                <Path d="M47 56Q76 67 104 56" stroke={pale} strokeWidth={5} />
              )}
              <Path d="M100 70V84" strokeWidth={2} />
              <Circle cx={100} cy={87} r={3} fill={`url(#item-coral-${item})`} />
            </>
          ) : item === "toy-box" ? (
            <>
              <Path d="M24 66L121 61V109Q72 127 24 110Z" fill={`url(#item-coral-${item})`} />
              <Path d={active ? "M24 64L36 28L128 26L121 61Z" : "M24 66L33 52L128 49L121 61Z"} fill="#E9BA76" />
              {active && (
                <>
                  <Circle cx={55} cy={65} r={15} fill="#DFC282" />
                  <Circle cx={44} cy={52} r={6} fill="#DFC282" />
                  <Circle cx={65} cy={52} r={6} fill="#DFC282" />
                  <Circle cx={50} cy={61} r={1.5} />
                  <Circle cx={59} cy={61} r={1.5} />
                  <Path d={star} transform="translate(96 60)" fill={`url(#item-teal-${item})`} />
                </>
              )}
              <Path d={star} transform="translate(74 92)" fill={pale} />
              <Path d="M33 106Q73 119 111 107" stroke={tint === "original" ? "#C67D69" : shade(material(tint, defaultCoral), -.18)} />
            </>
          ) : item === "blocks" ? (
            <>
              {[
                [29, 81, coral, "1"],
                [74, 81, teal, "2"],
                [52, 41, "#E7C36B", "3"],
              ].map(([x, y, color, label]) => (
                <G key={String(label)}>
                  <Rect x={Number(x)} y={Number(y)} width={42} height={38} rx={5} fill={String(color)} />
                  <Path d={`M${Number(x) + 5} ${Number(y) + 4}H${Number(x) + 35}`} stroke={pale} />
                  <SvgText
                    x={Number(x) + 21}
                    y={Number(y) + 28}
                    fontSize={28}
                    fontWeight="bold"
                    textAnchor="middle"
                    stroke="none"
                    fill={pale}
                  >
                    {label}
                  </SvgText>
                </G>
              ))}
            </>
          ) : item === "abacus" ? (
            <>
              <Path d="M23 114V28Q23 20 32 20H118Q126 20 126 28V114" stroke={wood} strokeWidth={9} fill="none" />
              {[0, 1, 2].map((r) => (
                <G key={r}>
                  <Path d={`M30 ${43 + r * 25}H120`} strokeWidth={3} />
                  {[0, 1, 2, 3].map((n) => (
                    <Rect
                      key={n}
                      x={36 + n * 19}
                      y={34 + r * 25}
                      width={12}
                      height={18}
                      rx={6}
                      fill={[coral, teal, "#E4BF65"][r]}
                    />
                  ))}
                </G>
              ))}
              <Path d="M15 117H43M108 117H137" strokeWidth={5} />
            </>
          ) : item === "beanbag" ? (
            <>
              <Path d="M21 101Q9 76 37 64Q47 21 87 35Q116 40 126 80Q146 111 114 118H48Q27 118 21 101Z" fill={paint("#B9A8CE")} />
              <Path
                d="M35 80Q54 64 83 72Q109 79 114 100M43 104Q69 116 98 105"
                fill="none"
                stroke={highlight("#D7CBE5")}
                strokeWidth={5}
              />
              <Path d="M47 81L74 75L98 86L72 94Z" fill={pale} />
              <Path d="M72 94V82" />
            </>
          ) : item === "aquarium" ? (
            <>
              <Path d="M34 106V119M116 106V119" stroke={wood} strokeWidth={7} />
              <Rect x={20} y={27} width={112} height={79} rx={13} fill="#B6E2DD" />
              <Path d="M25 45Q50 39 76 45Q103 51 127 45" fill="none" stroke="#F0FCED" strokeWidth={4} />
              <Path d="M25 96Q75 85 127 96V101H25Z" fill="#E7D4A1" />
              <Path d="M39 94Q28 75 40 64Q52 76 42 89M111 92Q120 76 108 67" fill={`url(#item-teal-${item})`} />
              <G transform={active ? "translate(25 -6)" : undefined}>
                <Path d="M76 67L92 60V79Z" fill={`url(#item-coral-${item})`} />
                <Ellipse cx={67} cy={70} rx={17} ry={11} fill="#EDBE65" />
                <Circle cx={60} cy={68} r={2} />
              </G>
              <Circle cx={101} cy={54} r={4} fill="none" stroke="white" />
              <Circle cx={109} cy={40} r={2} fill="white" stroke="none" />
              <Path d="M29 25H124" stroke={wood} strokeWidth={7} />
            </>
          ) : item === "telescope" ? (
            <>
              <Path d="M73 67V86L43 118M73 86L105 118M73 86L72 121" stroke={wood} strokeWidth={5} />
              <G transform="rotate(-28 75 50)">
                <Rect x={27} y={34} width={95} height={28} rx={6} fill={`url(#item-teal-${item})`} />
                <Rect x={19} y={30} width={19} height={36} rx={5} fill={pale} />
                <Rect x={119} y={39} width={15} height={18} rx={3} fill={wood} />
                <Path d="M48 40H91" stroke="#BCE2D2" strokeWidth={5} />
              </G>
            </>
          ) : item === "globe" ? (
            <>
              <Ellipse cx={75} cy={117} rx={28} ry={6} fill={wood} />
              <Path d="M75 114V94M51 22Q23 61 60 91Q93 112 116 63" fill="none" stroke={wood} strokeWidth={7} />
              <Circle cx={77} cy={54} r={37} fill="#8DCBD6" />
              <Path
                d="M50 29L69 26L77 44L66 54L48 48M90 54L110 50L110 67L99 78L92 71L82 72L78 61Z"
                fill="#93B98B"
                strokeWidth={1.5}
              />
              <Ellipse cx={77} cy={54} rx={17} ry={36} fill="none" opacity={0.4} />
              <Path d="M43 54H110" opacity={0.4} />
            </>
          ) : item === "arcade" ? (
            <>
              <Path d="M40 15H107L115 75L125 110L35 119L28 80Z" fill={`url(#item-teal-${item})`} />
              <Path d="M42 32H101L105 72H36Z" fill="#38545E" />
              <Path d="M49 40H93L96 64H44Z" fill="#ABD8D1" />
              <Path d={star} transform={`translate(70 51) scale(${active ? 1.3 : 0.8})`} fill="#F6D574" />
              <Path d="M33 77H114L121 91L32 99Z" fill={`url(#item-coral-${item})`} />
              <Path d="M53 85V77" strokeWidth={4} />
              <Circle cx={53} cy={75} r={5} fill={pale} />
              <Ellipse cx={92} cy={84} rx={7} ry={3} fill="#E8C068" />
              <Path d="M53 105H96" stroke={pale} strokeWidth={4} />
            </>
          ) : item === "chime" ? (
            <>
              <Path d="M75 10V31M43 43Q75 21 107 43M48 42V79M75 36V91M103 42V72" fill="none" stroke={wood} />
              {[0, 1, 2].map((n) => (
                <G
                  key={n}
                  transform={`translate(${48 + n * 27} ${n === 1 ? 98 : n === 2 ? 79 : 86}) rotate(${active ? (n - 1) * 15 : 0})`}
                >
                  <Path d="M-13-8Q-16-24 0-19Q16-24 13-8L4 6H-4Z" fill={[coral, pale, teal][n]} />
                  <Path d="M-7-13L-2 2M2 2L7-13" stroke="#BB987A" strokeWidth={1.5} />
                </G>
              ))}
            </>
          ) : (
            <>
              <Path d="M73 117Q41 92 48 53Q51 18 74 7Q99 22 102 56Q109 94 83 118Z" fill={`url(#item-coral-${item})`} />
              <Path d="M74 9L82 118" stroke={pale} strokeWidth={7} />
              <Path d="M51 58L99 49M49 72L101 63" stroke={teal} strokeWidth={8} />
              <Path d="M84 94L95 106L86 116Z" fill={`url(#item-teal-${item})`} />
            </>
          )}
          <ItemFinish id={item} color={paint(defaultCoral)}/>
          </ItemMotion>
          <ItemLife id={item} color={paint(defaultCoral)} active={active} animated={animated} reduced={reduced}/>
        </G>
      </G>
      </G>
    </Svg>
  );
}
