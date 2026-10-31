import React from "react";
import Svg, { Circle, Ellipse, G, Path, Rect, Text as SvgText } from "react-native-svg";
import type { ChamoruWord } from "../../content/chamoru";
const ink = "#244F48", skin = "#CC976A";
const colors: Record<string, string> = { white: "#FFFFFF", red: "#C64F47", yellow: "#F2C84F", blue: "#548ECA", green: "#649962", black: "#283A40", brown: "#966443", pink: "#E9A7B8", gray: "#969FA2", orange: "#EE974B", purple: "#A381BB" };
function Person({ x, y = 20, small = false, elder = false, dress = false }: { x: number; y?: number; small?: boolean; elder?: boolean; dress?: boolean }) {
  return <G transform={`translate(${x} ${y}) scale(${small ? 0.7 : 1})`}>
    <Path d="M-9 28l-4 23M9 28l4 23M-5 50v15M5 50v15" stroke={skin} strokeWidth={6} strokeLinecap="round" />
    <Path d={dress ? "M-8 28h16l9 28h-34z" : "M-9 28h18v25h-18z"} fill={dress ? "#C56D50" : "#548F9E"} />
    <Circle cy={15} r={12} fill={skin} />
    <Path d="M-12 13q-2-19 12-17t12 17q-5-9-12-9t-12 9" fill={elder ? "#E9E5DA" : "#4D3E34"} />
    <Circle cx={-4} cy={14} r={1.2} fill={ink} /><Circle cx={4} cy={14} r={1.2} fill={ink} />
    <Path d="M-3 20q3 3 6 0" fill="none" stroke={ink} strokeWidth={1.3} />
    {elder && <Path d="M-10 14h20M-8 12h5v5h-5zM3 12h5v5H3z" fill="none" stroke={ink} strokeWidth={1} />}
  </G>;
}
/** Original geometric pictures, shared by the island scene and the picture/word Memory pack. */
export function WordPicture({ word, size = 80, caption = true }: { word: ChamoruWord; size?: number; caption?: boolean }) {
  const key = word.id.split(".")[1], number = ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"].indexOf(key) + 1;
  const head = word.category === "body_parts", food = word.category === "food";
  return <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    {word.category === "colors" && <><Path d="M24 88V15" stroke={ink} strokeWidth={4} strokeLinecap="round" /><Path d="M26 18h57l-9 20 9 20H26z" fill={colors[key]} stroke={ink} strokeWidth={2} /><Ellipse cx={50} cy={90} rx={32} ry={4} fill="#D9D5BC" /></>}
    {word.category === "numbers" && Array.from({ length: number }, (_, i) => <G key={i} transform={`translate(${18 + (i % 5) * 16} ${number > 5 ? 32 + Math.floor(i / 5) * 30 : 47})`}>
      <Path d="M-7 0q0-14 7-14t7 14L0 7z" fill="#F4CE93" stroke="#A97742" strokeWidth={1.2} /><Path d="M0-12V5M-4-10L0 5M4-10L0 5" stroke="#A97742" strokeWidth={1} />
    </G>)}
    {word.category === "family" && <><Path d="M5 80h90l-6 14H11z" fill="#E8B28F" />
      {key === "sibling" ? <><Person x={34} y={36} small dress /><Person x={67} y={36} small /></> : key === "family" || key === "children" ? <><Person x={25} y={key === "children" ? 36 : 16} small={key === "children"} dress /><Person x={72} y={key === "children" ? 36 : 16} small={key === "children"} /><Person x={48} y={43} small /></> : <Person x={50} y={key === "child" || key === "sibling" ? 36 : 16} small={key === "child" || key === "sibling"} elder={key.startsWith("grand")} dress={key === "mother" || key === "grandmother_guella"} />}
    </>}
    {head && <>
      {["head", "eye", "ear", "nose", "mouth"].includes(key) && <><Ellipse cx={50} cy={47} rx={27} ry={32} fill={skin} stroke={key === "head" ? "#EFC050" : "none"} strokeWidth={6} /><Path d="M23 37q-4-32 27-29t27 29q-9-16-27-15T23 37" fill="#4D3E34" /><Ellipse cx={21} cy={47} rx={5} ry={9} fill={key === "ear" ? "#EFC050" : skin} /><Ellipse cx={79} cy={47} rx={5} ry={9} fill={key === "ear" ? "#EFC050" : skin} /><Circle cx={39} cy={43} r={key === "eye" ? 7 : 3} fill={key === "eye" ? "#EFC050" : ink} /><Circle cx={61} cy={43} r={3} fill={ink} /><Path d="M50 44l-4 11h8" stroke={key === "nose" ? "#EFC050" : ink} strokeWidth={key === "nose" ? 6 : 2} fill="none" /><Path d="M39 64q11 8 22 0" stroke={key === "mouth" ? "#EFC050" : ink} strokeWidth={key === "mouth" ? 7 : 2} fill="none" /><Path d="M31 83h38" stroke={key === "head" ? "#EFC050" : "#548F9E"} strokeWidth={7} strokeLinecap="round" /></>}
      {key === "hand" && <Path d="M36 84V60L23 42q-3-7 4-8l13 14V20q0-8 7-5v28-32q7-5 8 4v28-28q7-3 8 5v26-21q7-3 8 5v31q0 17-12 23" fill={skin} stroke={ink} strokeWidth={2} />}
      {key === "foot" && <><Path d="M43 15h21v43q22 2 22 16 0 10-19 10H29q-12-3-7-12l18-20z" fill={skin} stroke={ink} strokeWidth={2} /><Path d="M70 63v9m7-7v8" stroke={ink} strokeWidth={2} /></>}
      {key === "heart" && <Path d="M50 84L17 51C-4 23 29 5 50 30c21-25 54-7 33 21z" fill="#CE6A61" stroke="#A04F38" strokeWidth={2} />}
    </>}
    {food && <>
      <Rect x={10} y={83} width={80} height={6} rx={2} fill="#B88756" /><Path d="M18 89v10M82 89v10" stroke="#B88756" strokeWidth={4} />
      {key === "fish" && <><Path d="M15 50q30-38 58 0-28 38-58 0M72 50l20-22v44z" fill="#70B4BB" stroke={ink} strokeWidth={2} /><Circle cx={31} cy={46} r={3} fill={ink} /><Path d="M48 36q-12 14 0 28" fill="none" stroke={ink} strokeWidth={2} /></>}
      {key === "cooked_rice" && <><Ellipse cx={50} cy={52} rx={34} ry={20} fill="#FFFDF2" stroke="#D8C99B" strokeWidth={2} /><Path d="M17 52h66q-5 33-33 33T17 52" fill="#70B4BB" />{[29,40,51,62,73].map((x,i)=><Path key={x} d={`M${x} ${43+i%2*6}l4-3`} stroke="#CCBC90" strokeWidth={2} />)}</>}
      {key === "chicken" && <><Path d="M24 61q-7-30 20-36t32 23q-2 27-31 25z" fill="#C68F50" stroke="#8F6237" strokeWidth={2} /><Path d="M67 65l14 14m-4-1q-3 10-9 3m11-3q11-3 8-9" stroke="#EEE6CE" strokeWidth={7} strokeLinecap="round" /></>}
      {key === "green_coconut" && <><Ellipse cx={50} cy={56} rx={28} ry={32} fill="#85A565" /><Path d="M42 30q-10 35 0 52M58 30q10 35 0 52" fill="none" stroke="#608447" strokeWidth={2} /><Path d="M50 27l4-13" stroke={ink} strokeWidth={4} /></>}
      {key === "soup_stew" && <><Ellipse cx={50} cy={48} rx={35} ry={17} fill="#B8753D" /><Path d="M15 48q4 37 35 37t35-37" fill="#D78367" /><Circle cx={40} cy={44} r={6} fill="#86AA64" /><Circle cx={60} cy={50} r={5} fill="#E7BB5F" /><Path d="M35 29q-9-8 0-15M55 29q-9-8 0-15" fill="none" stroke="#B4ADA0" strokeWidth={2} /></>}
      {key === "vegetable" && <><Path d="M45 28q-22-24-29 1T45 60q-8-36 23-41t13 25L45 65" fill="#6F9F5C" stroke="#477D4A" strokeWidth={2} /><Path d="M45 34v53" stroke="#D4C57B" strokeWidth={5} /></>}
      {key === "water" && <><Path d="M29 19h42l-5 66H34z" fill="#D6E7E8" stroke="#64959D" strokeWidth={2} /><Path d="M32 43q18 7 36 0l-3 38H35z" fill="#72B9C8" /></>}
      {key === "green_banana" && <><Path d="M28 21q5 54 52 41-20 40-47 13T28 21" fill="#92B75F" stroke="#557E42" strokeWidth={2} /><Path d="M29 26q-3 56 43 43" fill="none" stroke="#638C42" strokeWidth={2} /></>}
      {key === "mango" && <><Path d="M55 20q31-3 25 33T42 85Q8 77 26 44t29-24" fill="#ECC057" stroke="#B37E35" strokeWidth={2} /><Path d="M55 21q2-21 21-11-8 14-21 11" fill="#729658" /></>}
      {key === "egg" && <Ellipse cx={50} cy={54} rx={27} ry={36} fill="#F8E8CD" stroke="#BAA383" strokeWidth={2} />}
    </>}
    {word.category === "greetings" && <>
      {key === "hello" ? <><Person x={28} y={20} small={false} /><Path d="M36 49l16-21 2-13" stroke={skin} strokeWidth={6} fill="none" strokeLinecap="round" /><Person x={76} y={26} small dress /><Path d="M68 50l-10-16-1-10" stroke={skin} strokeWidth={5} fill="none" strokeLinecap="round" /><Path d="M47 8q5-6 10 0M52 4v-3" stroke="#6D9997" strokeWidth={2} fill="none" /></>
        : <><Person x={43} y={20} /><Path d="M51 49l22-23 3-15" stroke={skin} strokeWidth={6} fill="none" strokeLinecap="round" /><Path d="M78 24q12-10 5-20M86 29q12-11 7-21" stroke="#6D9997" strokeWidth={2} fill="none" /></>}
      {key === "good_morning" && <><Circle cx={18} cy={18} r={10} fill="#EFC050" /><Path d="M5 31h27" stroke="#EFC050" strokeWidth={2} /></>}
      {key === "thank_you" && <Path d="M18 49q-10-12-15-3t15 18q23-12 15-18t-15 3" fill="#C56D50" />}
      {key === "goodbye" && <><Rect x={8} y={62} width={20} height={16} rx={3} fill="#B88756" stroke={ink} strokeWidth={1.5} /><Path d="M14 62v-4h8v4" fill="none" stroke={ink} strokeWidth={1.5} /><Path d="M8 34h14M16 28l6 6-6 6" stroke="#6D9997" strokeWidth={2.5} fill="none" strokeLinecap="round" /></>}
      {caption && <SvgText x={50} y={98} textAnchor="middle" fontSize={10} fontWeight="700" fill={ink}>{word.english.split(" / ")[0]}</SvgText>}
    </>}
  </Svg>;
}
