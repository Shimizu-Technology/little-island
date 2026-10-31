import React from 'react';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { badgeInfo, type BadgeId } from './engine';

/** Shared original artwork: the room wall and full-size badges use identical glyphs. */
export function BadgeGlyph({ id, earned = true }: { id: BadgeId; earned?: boolean }) {
  const { track, color } = badgeInfo(id), tier = Number(id.slice(-1));
  const ink = earned ? '#294E48' : '#A39B86', paper = earned ? '#FFF7DF' : '#EEE4CF', accent = earned ? color : '#D6CEBB';
  let picture: React.ReactNode;
  if (track === 'math') picture = [
    <G key="counter"><Rect x={24} y={20} width={32} height={41} rx={6} fill={paper}/><Rect x={29} y={26} width={22} height={10} rx={2} fill={accent}/><Path d="M31 43h4m10 0h4M31 51h4m10 0h4" stroke={ink} strokeWidth={4}/></G>,
    <G key="blocks"><Rect x={16} y={39} width={24} height={22} rx={3} fill={paper}/><Rect x={41} y={39} width={23} height={22} rx={3} fill={accent}/><Rect x={29} y={17} width={24} height={22} rx={3} fill={paper}/><Path d="M37 25h8m-4-4v8M24 50h8M49 48l7 7m0-7-7 7" stroke={ink} strokeWidth={3}/></G>,
    <G key="abacus"><Path d="M18 61V20h44v41M19 32h42M19 44h42M19 55h42" fill="none" stroke={paper} strokeWidth={5}/>{[27,38,49].map((x,i)=><G key={x}><Circle cx={x} cy={32} r={5} fill={ink}/><Circle cx={x+4-i*5} cy={44} r={5} fill={accent}/></G>)}</G>,
    <G key="star"><Path d="m40 14 8 16 18 3-13 13 3 18-16-9-16 9 3-18-13-13 18-3Z" fill={paper}/><Path d="M31 39h18m-9-9v18" stroke={ink} strokeWidth={4}/></G>,
  ][tier-1];
  else if (track === 'reading') picture = [
    <G key="words"><Path d="M15 24q14-6 25 2 11-8 25-2v34q-14-5-25 2-11-7-25-2Z" fill={paper}/><Path d="M40 26v34M22 34h10m-10 8h10M48 34h10m-10 8h10" stroke={ink} strokeWidth={2.5}/></G>,
    <G key="page"><Path d="M24 15h27l10 11v39H24Z" fill={paper}/><Path d="M51 15v13h10M31 37h22m-22 9h18m-18 9h22" fill="none" stroke={ink} strokeWidth={3}/><Path d="m17 46 9 9-9 9" fill="none" stroke={accent} strokeWidth={5}/></G>,
    <G key="story"><Path d="M16 20h48v34H43L29 65V54H16Z" fill={paper}/><Path d="m40 25 4 9 10 1-7 7 2 10-9-5-9 5 2-10-7-7 10-1Z" fill={accent}/></G>,
    <G key="worm"><Rect x={17} y={49} width={47} height={12} rx={3} fill={paper}/><Path d="M25 47V32q0-14 13-14 14 0 14 14v15" fill={paper} stroke={ink} strokeWidth={3}/><Circle cx={33} cy={30} r={2.5} fill={ink}/><Circle cx={44} cy={30} r={2.5} fill={ink}/><Path d="M33 38q5 5 11 0M24 55h33" fill="none" stroke={ink} strokeWidth={2}/></G>,
  ][tier-1];
  else if (track === 'science') picture = [
    <G key="lens"><Circle cx={35} cy={33} r={16} fill={paper} stroke={ink} strokeWidth={4}/><Path d="m47 45 15 17" stroke={paper} strokeWidth={9}/><Path d="M28 33h14m-7-7v14" stroke={accent} strokeWidth={3}/></G>,
    <G key="planet"><Ellipse cx={40} cy={40} rx={29} ry={10} rotation={-25} origin="40,40" fill="none" stroke={paper} strokeWidth={5}/><Circle cx={40} cy={40} r={18} fill={paper}/><Path d="M26 31q15 5 27-2M24 41q12-6 18 4t13 3" fill="none" stroke={accent} strokeWidth={5}/></G>,
    <G key="flask"><Path d="M30 17h20M34 18v20L19 60q-2 5 5 5h32q7 0 5-5L46 38V18" fill={paper} stroke={ink} strokeWidth={3}/><Path d="m29 47-8 14h38l-8-14Z" fill={accent}/><Circle cx={38} cy={53} r={3} fill={paper}/><Circle cx={45} cy={32} r={2} fill={accent}/></G>,
    <G key="inventor"><Path d="M29 49q-19-24 3-32 26-8 26 14 0 10-9 18v10H29Z" fill={paper}/><Path d="M31 64h16M34 52V37l6 6 6-6v15M40 7V2M12 24l-6-3M66 24l7-3" stroke={ink} strokeWidth={3} fill="none"/></G>,
  ][tier-1];
  else if (track === 'coding') picture = [
    <G key="steps"><Rect x={21} y={20} width={38} height={42} rx={8} fill={paper}/><Circle cx={31} cy={35} r={3} fill={ink}/><Circle cx={49} cy={35} r={3} fill={ink}/><Path d="M29 47q11 10 22 0" fill="none" stroke={ink} strokeWidth={3}/></G>,
    <G key="loop"><Path d="M26 24a21 21 0 1 1-8 21M15 33l3 12 12-3" fill="none" stroke={paper} strokeWidth={6}/></G>,
    <G key="debug"><Rect x={18} y={18} width={44} height={44} rx={6} fill={paper}/><Path d="M27 31h27M27 40h18M27 50h12m14-2 5 5-5 5" fill="none" stroke={ink} strokeWidth={3}/></G>,
    <G key="coder"><Rect x={15} y={20} width={50} height={35} rx={5} fill={paper}/><Path d="m30 32-7 6 7 6m20-12 7 6-7 6M32 62h16M40 55v7" fill="none" stroke={ink} strokeWidth={3}/></G>,
  ][tier-1];
  else if (track === 'chamoru') picture = [
    <G key="flower">{[0,60,120,180,240,300].map(a=><Ellipse key={a} cx={40} cy={27} rx={8} ry={14} rotation={a} origin="40,40" fill={paper}/>)}<Circle cx={40} cy={40} r={8} fill={accent}/></G>,
    <G key="neighbor"><Path d="M14 36 29 21l15 15v25H14Zm26 0 15-15 15 15v25H40Z" fill={paper}/><Path d="M24 61V47h9v14m17 0V47h9v14M16 36h25m1 0h26" stroke={ink} strokeWidth={2.5} fill="none"/></G>,
    <G key="woven"><Rect x={17} y={18} width={46} height={44} rx={4} fill={paper}/><Path d="M25 18v44m10-44v44m10-44v44m10-44v44M17 27h46m-46 11h46M17 49h46" stroke={accent} strokeWidth={5}/><Path d="M22 65h36" stroke={ink} strokeWidth={3}/></G>,
    <G key="island"><Circle cx={41} cy={27} r={12} fill={paper}/><Path d="M14 59q27-20 52 0M12 65q10-6 19 0t18 0 19 0M43 50q-5-21 1-24m0 4q-14-13-21 0m21 0q10-13 19-1" stroke={ink} strokeWidth={3} fill="none"/></G>,
  ][tier-1];
  else if (track === 'arcade') picture = [
    <G key="controller"><Path d="M25 27h30q10 1 12 24t-14 7l-7-7H34l-7 7Q9 71 13 51t12-24" fill={paper}/><Path d="M22 38v14m-7-7h14" stroke={ink} strokeWidth={3}/><Circle cx={51} cy={40} r={3} fill={accent}/><Circle cx={58} cy={47} r={3} fill={accent}/></G>,
    <G key="levels"><Path d="M16 62V49h16V35h16V20h16v42Z" fill={paper}/><Path d="m22 37 14-15m-9 0h9v9" fill="none" stroke={ink} strokeWidth={4}/></G>,
    <G key="world"><Circle cx={40} cy={40} r={24} fill={paper}/><Ellipse cx={40} cy={40} rx={11} ry={24} stroke={ink} strokeWidth={2} fill="none"/><Path d="M17 34h46M17 47h46" stroke={ink} strokeWidth={2}/><Path d="m59 11 3 7 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1Z" fill={accent}/></G>,
    <G key="bolt"><Path d="M43 13 22 44h16l-5 24 26-35H43l7-20Z" fill={paper}/><Path d="M15 22h9M58 57h10M16 58l7-6M59 20l7-5" stroke={ink} strokeWidth={3}/></G>,
  ][tier-1];
  else picture = [
    <G key="dice"><Rect x={18} y={18} width={44} height={44} rx={9} fill={paper}/>{[[29,29],[51,29],[40,40],[29,51],[51,51]].map(([x,y])=><Circle key={`${x}-${y}`} cx={x} cy={y} r={4} fill={ink}/>)}</G>,
    <G key="sport"><Path d="M25 23h30v13q0 19-15 19T25 36Z" fill={paper}/><Path d="M25 28H15q0 17 14 17m26-17h10q0 17-14 17M40 55v9m-12 0h24" stroke={ink} strokeWidth={3} fill="none"/><Path d="m40 28 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z" fill={accent}/></G>,
    <G key="strategy"><Path d="M23 62h35l-4-9H29l5-12-12-2 7-17 14-8 11 14-7 25" fill={paper} stroke={ink} strokeWidth={2.5}/><Circle cx={39} cy={27} r={2.5} fill={ink}/><Path d="M22 64h38" stroke={ink} strokeWidth={3}/></G>,
    <G key="crown"><Path d="m16 25 13 10 11-18 11 18 13-10-7 32H23Z" fill={paper}/><Path d="M24 49h32M25 62h30" stroke={ink} strokeWidth={3}/><Circle cx={40} cy={42} r={4} fill={accent}/></G>,
  ][tier-1];
  return <G opacity={earned ? 1 : 0.72}><Path d="m25 59-4 18 19-8 19 8-4-18" fill={accent} stroke={ink} strokeWidth={2}/><Path d="M40 4 67 17v24q-2 22-27 31Q15 63 13 41V17Z" fill={accent} stroke={ink} strokeWidth={2}/><Path d="M40 9 62 20v21q-1 18-22 26-21-8-22-26V20Z" fill="none" stroke={paper} strokeWidth={1.5}/>{picture}</G>;
}
export function BadgeArt({ id, earned = true, size = 80 }: { id: BadgeId; earned?: boolean; size?: number }) {
  return <Svg width={size} height={size} viewBox="0 0 80 80" accessible={false}><BadgeGlyph id={id} earned={earned}/></Svg>;
}
