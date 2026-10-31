import React, { useEffect, useRef, useState } from "react";
import { Platform, View, type ViewStyle } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { C, Copy, PressableScale } from "../../../components/ui";
import type { BoardProps } from "../../types";
import { chooseCube, flip, help, normalize, place, rotate, taskAt, type Cell, type ShapeState } from "./engine";

export function Board({ session, update, practice, assistance, cheer, coach, active, width }: BoardProps<ShapeState>) {
  const s = session.state, task = taskAt(s), piece = task.pieces[s.placed.length];
  const [cells, setCells] = useState<Cell[]>(piece?.cells ?? []), [hint, setHint] = useState(false), [wrong, setWrong] = useState(false), [reveal, setReveal] = useState(false);
  const boardRef = useRef<View>(null), dragStart = useRef<Cell>([0,0]);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (revealTimer.current) clearTimeout(revealTimer.current); }, []);
  const [drag, setDrag] = useState<Cell>([0,0]);
  const size = Math.max(44, Math.min(49, Math.floor((width - 42) / task.width) - 2));
  const target = task.pieces.flatMap(p => p.target.map(([x,y]) => `${x},${y}`));
  const anchorX = piece ? Math.min(...piece.target.map(c => c[0])) : -1, anchorY = piece ? Math.min(...piece.target.map(c => c[1])) : -1;
  const filled = task.pieces.slice(0, s.placed.length).flatMap(p => p.target.map(([x,y]) => `${x},${y}`));
  const normalized = cells.length ? normalize(cells) : [], maxX = cells.length ? Math.max(...normalized.map(c => c[0])) : 0, maxY = cells.length ? Math.max(...normalized.map(c => c[1])) : 0;
  const tryPlace = (x: number, y: number) => {
    const next = place(s, s.placed.length, cells, x, y), right = next !== s;
    practice("think.spatial", right);
    if (right) {
      setHint(false); setWrong(false);
      if (next.index > s.index) {
        setReveal(true); cheer("big");
        revealTimer.current = setTimeout(() => { setReveal(false); setCells(taskAt(next).pieces[next.placed.length]?.cells ?? []); update(next); coach.done(); }, 820);
      } else { setCells(taskAt(next).pieces[next.placed.length]?.cells ?? []); update(next); cheer("right"); coach.done(); }
    }
    else setWrong(true);
  };
  const drop = (pageX: number, pageY: number) => {
    setDrag([0,0]);
    boardRef.current?.measureInWindow((left, top) => {
      const x=Math.floor((pageX-left-10)/(size+2)), y=Math.floor((pageY-top-10)/(size+2));
      if(piece?.target.some(([a,b])=>a===x&&b===y)) tryPlace(anchorX,anchorY);
      else setWrong(true);
    });
  };
  if (!piece && task.cube) {
    const faceCells: [number,number][] = [[1,0],[0,1],[1,1],[2,1],[1,2],[1,3]];
    return <View style={{ gap: 14, paddingVertical: 8 }}>
      <Copy style={{ color: C.ink, fontSize: 21, fontWeight: "900" }}>Fold the cube in your mind</Copy>
      <Copy style={{ color: C.ink, fontSize: 17 }}>When this net folds, which face is opposite {task.cube.faces[2]}?</Copy>
      <View style={{ alignSelf: "center", padding: 12, backgroundColor: "#E6EBD7", borderRadius: 20 }}>{Array.from({length:4},(_,y)=><View key={y} style={{flexDirection:"row"}}>{Array.from({length:3},(_,x)=>{const i=faceCells.findIndex(([a,b])=>a===x&&b===y);return <View key={x} style={{width:58,height:58,margin:2,alignItems:"center",justifyContent:"center",backgroundColor:i<0?"transparent":"#B889B9",borderRadius:8,borderWidth:i<0?0:2,borderColor:"#365034"}}><Copy style={{fontSize:25,fontWeight:"900",color:C.ink}}>{i<0?"":task.cube!.faces[i]}</Copy></View>;})}</View>)}</View>
      <View style={{flexDirection:"row",flexWrap:"wrap",justifyContent:"center",gap:8}}>{task.cube.faces.filter(f=>f!==task.cube!.faces[2]).map(face=><PressableScale key={face} accessibilityRole="button" accessibilityLabel={`Cube face ${face}`} disabled={!active} onPress={()=>{const next=chooseCube(s,face),right=next!==s;practice("think.spatial",right);if(right){update(next);cheer("big");setWrong(false);coach.done();}else setWrong(true);}} style={{width:54,minHeight:54,alignItems:"center",justifyContent:"center",borderRadius:14,backgroundColor:"#FFF8E8",borderWidth:2,borderColor:"#8CAD75"}}><Copy style={{fontSize:23,fontWeight:"900",color:C.ink}}>{face}</Copy></PressableScale>)}</View>
      {wrong&&<Copy style={{color:"#9A542E",fontWeight:"800"}}>That face touches the middle. Try looking across the folded cube.</Copy>}
      <PressableScale accessibilityRole="button" accessibilityLabel="Help with cube net" onPress={()=>{assistance?.();update(help(s));setHint(true);}} style={{alignSelf:"flex-start",padding:13,backgroundColor:"#E8F2DF",borderRadius:14}}><Copy style={{color:C.ink,fontWeight:"800"}}>💡 Help</Copy></PressableScale>
      {hint&&<Copy style={{color:C.ink}}>Follow the net from the middle past the square below it. The opposite face is {task.cube.answer}.</Copy>}
    </View>;
  }
  if (!piece) return null;
  return <View style={{ gap: 13, paddingVertical: 7 }}>
    <Copy style={{fontSize: 21, fontWeight: "900", color: C.ink}}>{task.title}</Copy>
    <Copy style={{fontWeight: "800", color: C.ink}}>{reveal ? `${task.picture.toUpperCase()} COMPLETE!` : `PIECE ${s.placed.length+1} OF ${task.pieces.length} · ${piece.name}`}</Copy>
    <View ref={boardRef} style={{ alignSelf: "center", backgroundColor: "#E6EBD7", borderRadius: 21, padding: 8, borderWidth: 2, borderColor: reveal ? "#E3B657" : "#B9CEAD" }}>
      {Array.from({length: task.height}, (_, y) => <View key={y} style={{flexDirection: "row"}}>{Array.from({length: task.width}, (_, x) => { const key=`${x},${y}`, isTarget=target.includes(key), isFilled=isTarget&&(reveal||filled.includes(key)), isAnchor=x===anchorX&&y===anchorY&&!reveal; return <PressableScale key={key} accessibilityRole="button" accessibilityLabel={`Silhouette column ${x+1}, row ${y+1}${isAnchor ? ", placement corner" : isFilled ? ", filled" : isTarget ? ", open" : ""}`} disabled={!active || reveal || isFilled&&!isAnchor} onPress={() => tryPlace(x,y)} style={{width: size,height: size,margin: 1,borderRadius: 7,backgroundColor: isFilled ? task.pieces.find(p => p.target.some(([a,b]) => a===x && b===y))?.color : isAnchor ? "#FFF1C8" : isTarget ? "#FFF9E9" : "#D7E4D1",borderWidth: isAnchor ? 3 : isTarget ? 2 : 0,borderColor: isAnchor ? "#D29E35" : isFilled ? "#365034" : "#779463"}} />; })}</View>)}
      {reveal && <PictureDetails picture={task.picture} step={size+2} />}
    </View>
    {!reveal && <View accessible accessibilityLabel={`Drag the ${piece.name} piece to the silhouette`} onStartShouldSetResponder={() => active} onMoveShouldSetResponder={() => active} onResponderTerminationRequest={() => false} onResponderGrant={e => {dragStart.current=[e.nativeEvent.pageX,e.nativeEvent.pageY];}} onResponderMove={e => setDrag([e.nativeEvent.pageX-dragStart.current[0],e.nativeEvent.pageY-dragStart.current[1]])} onResponderRelease={e => drop(e.nativeEvent.pageX,e.nativeEvent.pageY)} onResponderTerminate={() => setDrag([0,0])} style={[{alignSelf: "center", padding: 10, backgroundColor: "#FFF9E9", borderRadius: 18, borderWidth: 2, borderColor: piece.color, transform:[{translateX:drag[0]},{translateY:drag[1]}], zIndex:2}, Platform.OS === "web" ? ({touchAction:"none"} as unknown as ViewStyle) : {}]}>
      {Array.from({length: maxY+1}, (_, y) => <View key={y} style={{flexDirection: "row"}}>{Array.from({length: maxX+1}, (_, x) => <View key={x} style={{width: 42,height: 42,margin: 1,borderRadius: 6,backgroundColor: normalized.some(([a,b]) => a===x && b===y) ? piece.color : "transparent"}} />)}</View>)}
    </View>}
    <View style={{flexDirection: "row", gap: 9, justifyContent: "center"}}>
      {s.level >= 2 && <PressableScale accessibilityRole="button" accessibilityLabel="Turn piece clockwise" onPress={() => setCells(normalize(rotate(cells)))} style={{backgroundColor: "#E2EFE2", borderRadius: 14, padding: 14, minHeight: 50}}><Copy style={{color: C.ink,fontWeight: "800"}}>↻ Turn</Copy></PressableScale>}
      {s.level >= 3 && <PressableScale accessibilityRole="button" accessibilityLabel="Flip piece" onPress={() => setCells(normalize(flip(cells)))} style={{backgroundColor: "#E2EFE2", borderRadius: 14, padding: 14, minHeight: 50}}><Copy style={{color: C.ink,fontWeight: "800"}}>⇄ Flip</Copy></PressableScale>}
    </View>
    <Copy style={{color: C.ink, textAlign: "center"}}>Drag the piece to its outline, or tap the gold corner.</Copy>
    {wrong && <Copy style={{color: "#9A542E",fontWeight: "800"}}>That outline needs a different turn or spot. Try again!</Copy>}
    <PressableScale accessibilityRole="button" accessibilityLabel="Help with this shape" onPress={() => {assistance?.();update(help(s));setHint(true);}} style={{alignSelf: "flex-start",padding: 13,backgroundColor: "#E8F2DF",borderRadius: 14}}><Copy style={{color: C.ink,fontWeight: "800"}}>💡 Help</Copy></PressableScale>
    {hint && <Copy style={{color: C.ink}}>{task.hint} Its top-left square is column {Math.min(...piece.target.map(c => c[0]))+1}, row {Math.min(...piece.target.map(c => c[1]))+1}.</Copy>}
  </View>;
}
function PictureDetails({picture,step}:{picture:string;step:number}) {
  const x=(n:number)=>n*step;
  return <Svg width={step*6} height={step*6} style={{position:"absolute",left:8,top:8}} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    {picture==="Boat"&&<><Path d={`M${x(2.45)} ${x(.25)}V${x(3.9)}`} stroke="#365034" strokeWidth="3"/><Path d={`M${x(1)} ${x(3.9)}Q${x(3)} ${x(4.7)} ${x(5)} ${x(3.9)}`} fill="none" stroke="#FFF7E5" strokeWidth="4"/><Circle cx={x(3)} cy={x(3.6)} r="5" fill="#FFF7E5"/></>}
    {picture==="House"&&<><Path d={`M${x(2.3)} ${x(4.8)}V${x(3.2)}H${x(3.1)}V${x(4.8)}`} fill="#805E49" stroke="#365034" strokeWidth="2"/><Path d={`M${x(3.5)} ${x(2.8)}H${x(4.2)}V${x(3.5)}H${x(3.5)}Z`} fill="#FFF5D7" stroke="#365034" strokeWidth="2"/></>}
    {picture==="Fish"&&<><Circle cx={x(4.75)} cy={x(2.25)} r="6" fill="#FFF9E8"/><Circle cx={x(4.75)} cy={x(2.25)} r="2.5" fill="#365034"/><Path d={`M${x(3)} ${x(2.4)}Q${x(3.6)} ${x(2.8)} ${x(3)} ${x(3.2)}`} fill="none" stroke="#FFF9E8" strokeWidth="3"/></>}
    {picture==="Rocket"&&<><Circle cx={x(3)} cy={x(2.45)} r={x(.33)} fill="#FFF8DF" stroke="#365034" strokeWidth="2"/><Path d={`M${x(2.25)} ${x(5.1)}L${x(2.65)} ${x(5.9)}L${x(3)} ${x(5.2)}L${x(3.35)} ${x(5.9)}L${x(3.75)} ${x(5.1)}`} fill="#EFBF75" stroke="#365034" strokeWidth="2"/></>}
    {picture==="Cube net"&&<Path d={`M${x(2.5)} ${x(.2)}V${x(3.8)}M${x(1.2)} ${x(1.5)}H${x(3.8)}`} stroke="#FFF8E6" strokeWidth="3" strokeDasharray="6 5"/>}
  </Svg>;
}
export function Art({size}:{size:number}) {return <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><Path d="M8 61L42 27L42 61Z" fill="#E9916F" stroke="#365034" strokeWidth="3"/><Path d="M46 27L86 27L86 65L46 65Z" fill="#5C9FA0" stroke="#365034" strokeWidth="3"/><Path d="M16 70L86 70L70 88L31 88Z" fill="#D8AE55" stroke="#365034" strokeWidth="3"/></Svg>;}
