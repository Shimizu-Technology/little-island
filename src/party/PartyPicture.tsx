import React from "react";
import Svg, { Circle, Ellipse, G, Line, Path } from "react-native-svg";
import { Symbol } from "../components/Art";
import { PartyWordId } from "./content";
/** Original pictures, decorative to the visible word. Never mount this inside a concealed role. */
export function PartyPicture({ word, size = 180 }: { word: PartyWordId; size?: number }) {
  let art: React.ReactNode;
  switch (word) {
    case "star": case "kite": case "shell": case "crab":
      return <Symbol name={word} size={size * 0.8} />;
    case "rabbit":
      art = <G><Ellipse cx="76" cy="43" rx="16" ry="38" fill="#D6BBA9" /><Ellipse cx="124" cy="43" rx="16" ry="38" fill="#D6BBA9" /><Ellipse cx="76" cy="43" rx="7" ry="27" fill="#EBC7BF" /><Ellipse cx="124" cy="43" rx="7" ry="27" fill="#EBC7BF" /><Ellipse cx="100" cy="99" rx="55" ry="45" fill="#D6BBA9" /><Circle cx="79" cy="92" r="5" fill="#244F46" /><Circle cx="121" cy="92" r="5" fill="#244F46" /><Path d="M93 107H107L100 114Z M100 114V122M84 121Q100 134 116 121" fill="none" stroke="#735140" strokeWidth="3" /></G>;
      break;
    case "owl":
      art = <G><Path d="M48 49L44 19 79 39Q100 32 121 39L156 19 152 49Q171 145 100 148Q29 145 48 49" fill="#9E7954" /><Circle cx="77" cy="75" r="26" fill="#F6E3B7" /><Circle cx="123" cy="75" r="26" fill="#F6E3B7" /><Circle cx="77" cy="75" r="9" fill="#244F46" /><Circle cx="123" cy="75" r="9" fill="#244F46" /><Path d="M91 91H109L100 107Z" fill="#E7BB58" /><Path d="M58 109L75 125M142 109L125 125" stroke="#D6BBA9" strokeWidth="5" /></G>;
      break;
    case "coconut":
      art = <G><Circle cx="100" cy="83" r="61" fill="#9B704B" /><Path d="M54 47L49 117M72 28L63 137M124 28L141 125M145 43L154 111" stroke="#B88C5C" strokeWidth="4" /><Circle cx="85" cy="62" r="7" fill="#624E39" /><Circle cx="108" cy="57" r="7" fill="#624E39" /><Circle cx="99" cy="80" r="7" fill="#624E39" /></G>;
      break;
    case "grapes":
      art = <G><Path d="M101 35L114 12M104 28Q143 4 145 26Q128 43 104 28" fill="#79A579" stroke="#46785D" strokeWidth="4" />{[[73,53],[104,49],[134,53],[88,80],[119,80],[103,108],[103,135]].map(([cx,cy],i)=><Circle key={i} cx={cx} cy={cy} r="19" fill={i%2 ? "#9D85AD" : "#806A98"} stroke="#F4E8CB" strokeWidth="2" />)}</G>;
      break;
    case "mango":
      art = <G><Path d="M116 33Q49 13 40 81Q30 143 91 147Q147 151 160 94Q174 45 116 33" fill="#E7BB58" /><Path d="M116 33Q49 13 40 81Q30 125 64 141Q37 88 80 52" fill="#D89659" /><Path d="M112 34Q113 9 143 10Q146 30 112 34" fill="#79A579" /></G>;
      break;
    case "cat":
      art = (
        <G>
          <Path
            d="M53 63 L49 27 L79 47 Q100 35 121 47 L151 27 L147 63 Q162 124 100 133 Q38 124 53 63Z"
            fill="#D49A65"
          />
          <Path d="M58 51 L56 36 L71 48 M142 51 L144 36 L129 48" fill="#EBC2A5" />
          <Circle cx="78" cy="83" r="5" fill="#244F46" />
          <Circle cx="122" cy="83" r="5" fill="#244F46" />
          <Path
            d="M92 99 L108 99 L100 106Z M100 106 Q91 119 82 109 M100 106 Q109 119 118 109"
            fill="#735140"
            stroke="#735140"
            strokeWidth="3"
          />
          <Path
            d="M63 100 L31 95 M63 110 L31 114 M137 100 L169 95 M137 110 L169 114"
            stroke="#735140"
            strokeWidth="3"
          />
        </G>
      );
      break;
    case "fish":
      art = (
        <G>
          <Path d="M145 80 L181 51 L181 109Z" fill="#D57D5D" />
          <Ellipse cx="91" cy="80" rx="62" ry="40" fill="#76AEB8" />
          <Path d="M78 43 Q96 13 115 45 M80 116 Q99 143 119 112" fill="#E7BB68" />
          <Circle cx="55" cy="72" r="6" fill="#244F46" />
          <Path d="M90 66 Q118 79 90 96Z" fill="#4C899E" />
          <Circle cx="22" cy="33" r="8" fill="none" stroke="#76AEB8" strokeWidth="3" />
        </G>
      );
      break;
    case "bird":
      art = (
        <G>
          <Ellipse cx="98" cy="90" rx="45" ry="37" fill="#E5B956" />
          <Circle cx="122" cy="56" r="29" fill="#E5B956" />
          <Path d="M145 52 L176 64 L145 72Z" fill="#D57D5D" />
          <Path d="M58 90 L29 70 L35 108Z" fill="#79AAB2" />
          <Path d="M85 74 Q128 80 104 113 Q75 107 85 74Z" fill="#79AAB2" />
          <Circle cx="129" cy="51" r="5" fill="#244F46" />
          <Path d="M88 125 V145 M111 125 V145 M79 145 H96 M103 145 H121" stroke="#735140" strokeWidth="4" />
        </G>
      );
      break;
    case "turtle":
      art = (
        <G>
          <Ellipse cx="93" cy="83" rx="57" ry="41" fill="#74A57D" />
          <Ellipse cx="158" cy="82" rx="23" ry="19" fill="#ADCC91" />
          <Circle cx="165" cy="76" r="4" fill="#244F46" />
          <Path d="M53 108 L41 132 L66 124 M114 115 L132 133 L141 113 M39 79 L22 87 L39 93" fill="#ADCC91" />
          <Path
            d="M77 49 L111 53 L124 83 L106 111 L72 109 L57 80Z M57 80 H124 M77 49 L86 80 L72 109 M111 53 L97 80 L106 111"
            stroke="#DBE5AE"
            strokeWidth="3"
            fill="none"
          />
        </G>
      );
      break;
    case "butterfly":
      art = (
        <G>
          <Path d="M96 85 Q24 0 26 72 Q22 105 76 95 Q19 137 61 144 Q91 145 99 99" fill="#D68A82" />
          <Path d="M104 85 Q176 0 174 72 Q178 105 124 95 Q181 137 139 144 Q109 145 101 99" fill="#E7BB68" />
          <Ellipse cx="100" cy="91" rx="6" ry="38" fill="#426F61" />
          <Path d="M97 58 Q81 25 74 43 M103 58 Q119 25 126 43" stroke="#426F61" strokeWidth="3" fill="none" />
          <Circle cx="57" cy="69" r="12" fill="#F7DBB6" />
          <Circle cx="143" cy="69" r="12" fill="#F7DBB6" />
        </G>
      );
      break;
    case "snail":
      art = (
        <G>
          <Path d="M28 126 Q17 106 53 107 L140 105 Q158 59 174 83 L176 124 Q95 144 28 126Z" fill="#A7C48A" />
          <Circle cx="88" cy="84" r="43" fill="#D79A67" />
          <Path
            d="M116 86 Q119 48 82 53 Q46 61 65 94 Q83 117 99 94 Q110 72 89 71 Q72 75 82 86"
            fill="none"
            stroke="#F4D7AF"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <Path d="M158 86 L153 59 M171 86 L179 60" stroke="#779565" strokeWidth="4" />
          <Circle cx="153" cy="59" r="4" fill="#244F46" />
          <Circle cx="179" cy="60" r="4" fill="#244F46" />
        </G>
      );
      break;
    case "apple":
      art = (
        <G>
          <Path
            d="M100 48 Q59 17 39 66 Q18 121 75 143 Q93 147 100 139 Q116 150 142 132 Q185 94 150 54 Q132 35 100 48Z"
            fill="#CB775B"
          />
          <Path d="M100 48 Q97 25 113 15" stroke="#735140" strokeWidth="7" fill="none" />
          <Path d="M107 30 Q131 5 151 21 Q133 44 107 30Z" fill="#6E9A72" />
          <Path d="M55 72 Q45 90 53 107" stroke="#F8C8AB" strokeWidth="6" fill="none" strokeLinecap="round" />
        </G>
      );
      break;
    case "banana":
      art = (
        <G>
          <Path
            d="M45 39 Q48 114 128 117 Q158 113 171 84 Q171 142 109 146 Q31 146 24 71 Q24 49 34 36Z"
            fill="#E7BB58"
            stroke="#B39246"
            strokeWidth="3"
          />
          <Path d="M37 58 Q47 132 128 133" stroke="#F7DD88" strokeWidth="7" fill="none" />
          <Path d="M30 40 L29 25 L43 24 L46 40 M166 87 L175 74" stroke="#735140" strokeWidth="6" />
        </G>
      );
      break;
    case "watermelon":
      art = (
        <G>
          <Path d="M25 55 H175 A75 82 0 0 1 25 55Z" fill="#6E9A72" />
          <Path d="M34 55 H166 A66 70 0 0 1 34 55Z" fill="#C8D891" />
          <Path d="M42 55 H158 A58 59 0 0 1 42 55Z" fill="#D98275" />
          {[
            [65, 72],
            [98, 83],
            [131, 72],
            [82, 102],
            [117, 102],
          ].map(([x, y]) => (
            <Ellipse key={x} cx={x} cy={y} rx="3" ry="5" fill="#735140" />
          ))}
        </G>
      );
      break;
    case "carrot":
      art = (
        <G>
          <Path d="M71 52 Q98 29 127 56 L87 147Z" fill="#D68B50" />
          <Path
            d="M92 51 Q45 16 75 15 Q94 19 103 48 M103 49 Q97 0 115 13 Q126 26 112 52 M112 51 Q143 10 151 29 Q147 45 119 58"
            fill="#7AA477"
          />
          <Path d="M79 73 L96 79 M95 96 L109 101 M89 120 L96 123" stroke="#A86843" strokeWidth="3" />
        </G>
      );
      break;
    case "pizza":
      art = (
        <G>
          <Path d="M28 39 Q100 4 171 39 L103 146Z" fill="#D9A66B" stroke="#BB854B" strokeWidth="3" />
          <Path d="M37 49 Q101 18 163 49 L103 136Z" fill="#E9C56B" />
          <Path d="M29 39 Q100 8 171 39" stroke="#DBAF7A" strokeWidth="16" strokeLinecap="round" />
          <Circle cx="78" cy="58" r="11" fill="#C56D50" />
          <Circle cx="127" cy="61" r="10" fill="#C56D50" />
          <Circle cx="100" cy="99" r="11" fill="#C56D50" />
          <Path d="M84 84 l7 -4 M122 90 l-5 9" stroke="#6A946A" strokeWidth="4" />
        </G>
      );
      break;
    case "icecream":
      art = (
        <G>
          <Path d="M65 79 H135 L101 154Z" fill="#D2A471" stroke="#B48D61" strokeWidth="3" />
          <Path d="M79 86 L118 121 M96 83 L126 107 M121 86 L83 124 M105 86 L75 109" stroke="#EFD0A0" strokeWidth="3" />
          <Path
            d="M53 75 Q44 52 65 43 Q62 8 100 13 Q134 9 136 42 Q159 53 146 75 Q130 92 113 79 Q100 91 87 79 Q67 91 53 75Z"
            fill="#D58F96"
          />
          <Circle cx="101" cy="14" r="10" fill="#BF6F58" />
        </G>
      );
      break;
    case "sun":
      art = (
        <G>
          <Circle cx="100" cy="80" r="40" fill="#E7BB58" />
          {Array.from({ length: 8 }, (_, i) => (
            <Line
              key={i}
              x1="100"
              y1="13"
              x2="100"
              y2="28"
              stroke="#E7BB58"
              strokeWidth="6"
              strokeLinecap="round"
              transform={`rotate(${i * 45} 100 80)`}
            />
          ))}
        </G>
      );
      break;
    case "moon":
      art = (
        <G>
          <Path d="M123 18 A64 64 0 1 0 158 125 A64 64 0 0 1 123 18Z" fill="#E7CB86" />
          <Circle cx="61" cy="81" r="10" fill="#D1B775" />
          <Circle cx="78" cy="113" r="7" fill="#D1B775" />
          <Path d="M165 26 l4 9 l10 3 l-10 3 l-4 9 l-4 -9 l-10 -3 l10 -3Z" fill="#7AAAB5" />
        </G>
      );
      break;
    case "tree":
      art = (
        <G>
          <Path d="M89 79 H112 L117 149 H82Z" fill="#9E7954" />
          <Circle cx="74" cy="69" r="38" fill="#79A579" />
          <Circle cx="124" cy="70" r="39" fill="#91B383" />
          <Circle cx="99" cy="41" r="35" fill="#6C9A72" />
          <Path d="M99 93 V129 M99 112 L82 99 M99 119 L119 100" stroke="#806447" strokeWidth="4" />
        </G>
      );
      break;
    case "flower":
      art = (
        <G>
          <Path
            d="M100 74 V151 M100 125 Q52 119 64 100 Q92 96 100 125 M100 143 Q144 133 138 115 Q113 113 100 143"
            stroke="#6B9C72"
            strokeWidth="5"
            fill="#91B383"
          />
          {Array.from({ length: 6 }, (_, i) => (
            <Ellipse key={i} cx="100" cy="39" rx="17" ry="27" fill="#D58F96" transform={`rotate(${i * 60} 100 67)`} />
          ))}
          <Circle cx="100" cy="67" r="19" fill="#E7BB58" />
        </G>
      );
      break;
    case "cloud":
      art = (
        <G>
          <Path
            d="M40 116 Q12 114 24 82 Q30 65 50 67 Q47 32 82 33 Q104 19 123 47 Q159 40 161 74 Q186 76 178 105 Q174 118 151 118Z"
            fill="#FFFFFF"
            stroke="#A5C3C3"
            strokeWidth="4"
          />
          <Path d="M59 102 H142" stroke="#DBE9E5" strokeWidth="5" strokeLinecap="round" />
        </G>
      );
      break;
    case "rainbow":
      art = (
        <G>
          {["#D58B77", "#E3B55F", "#A9C58A", "#79AFB2", "#9A8FAE"].map((color, i) => (
            <Path
              key={color}
              d={`M${25 + i * 12} 128 A${75 - i * 12} ${89 - i * 12} 0 0 1 ${175 - i * 12} 128`}
              fill="none"
              stroke={color}
              strokeWidth="12"
            />
          ))}
          <Ellipse cx="30" cy="133" rx="24" ry="13" fill="#FFFFFF" />
          <Ellipse cx="170" cy="133" rx="24" ry="13" fill="#FFFFFF" />
        </G>
      );
      break;
  }
  return (
    <Svg width={size} height={size * 0.8} viewBox="0 0 200 160" accessible={false}>
      {art}
    </Svg>
  );
}
