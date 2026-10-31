import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path, Rect, Text as SvgText } from 'react-native-svg';
import { Button, C, Copy } from '../../../components/ui';
import { useReducedMotion } from '../../../components/motion';
import type { BoardProps } from '../../types';
import { advance, canWrap, draw, drawingFeedback, initialProgram, programIssue, replaceBlock, solves, wrapIssue, type Block, type TurtleState } from './engine';
const name = (b: Block): string => b.kind === 'forward' ? `Forward ${b.n}` : b.kind === 'turn' ? `Turn ${b.angle}°` : b.kind === 'color' ? `${b.color} pen` : `Repeat ×${b.times}`;
export function Art({ size }: { size: number }) { return <Svg width={size} height={size} viewBox="0 0 80 80"><Circle cx={40} cy={39} r={27} fill="#83BEAD" stroke="#315F60" strokeWidth={3}/><Path d="M20 43Q40 18 60 43M24 48h32M40 21v37" stroke="#5A9383" strokeWidth={3} fill="none"/><Circle cx={61} cy={37} r={3} fill="#315F60"/></Svg>; }
export function Board({ session, update, practice, assistance, cheer, width, active, coach }: BoardProps<TurtleState>) {
  const s = session.state, task = s.tasks[Math.min(s.done, 3)], goal = draw(task.target) || [], fullTrace = draw(s.program) || [], traced = fullTrace.slice(0, s.cursor), steps = Math.max(1, fullTrace.length);
  const won = !s.free && s.done < 4 && !s.running && s.cursor > 0 && solves(task, s.program), reduced = useReducedMotion();
  const [message, setMessage] = useState(''), [editing, setEditing] = useState<{path: number[]; block: Block} | null>(null);
  const feedback = !s.free && s.cursor > 0 && !s.running && !won ? drawingFeedback(task, s.program) : null;
  useEffect(() => {
    if (!active || !s.running) return;
    const id = setTimeout(() => {
      const finished = s.cursor + 1 >= steps;
      update(advance(s));
      if (finished) {
        if (s.free) { cheer('right'); setMessage('Your own turtle picture!'); }
        else if (solves(task, s.program)) { practice(s.level >= 3 ? 'think.loops' : 'think.geometry', true); cheer(s.done === 3 ? 'big' : 'right'); setMessage('Shape traced!'); }
        else { practice('think.debug', false); setMessage(drawingFeedback(task, s.program).message); }
      }
    }, reduced ? 15 : Math.max(35, Math.min(220, 5000 / steps)));
    return () => clearTimeout(id);
  }, [s, task, steps, active, reduced, update, practice, cheer]);
  const change = (program: Block[]) => {
    if (!active || s.running) return;
    const issue = programIssue(program);
    if (issue) { setMessage(issue); return; }
    update({ ...s, program, cursor: 0 }); setMessage(''); setEditing(null);
  };
  const add = (block: Block) => {
    if (s.program.length >= task.limit) { setMessage('The plan is full. Edit or remove a block first.'); return; }
    change([...s.program, block]); coach.done();
  };
  const wrap = (times: number) => {
    const issue = wrapIssue(s.program, times);
    if (issue) { setMessage(issue); return; }
    change([{ kind: 'repeat', times, body: s.program }]);
  };
  const size = Math.min(width - 36, 360), point = traced.at(-1)?.to || { x: 100, y: 80 };
  const renderBlock = (block: Block, path: number[]): React.ReactNode => <View key={path.join('.')} style={{gap:5, padding:7, borderRadius:10, backgroundColor:block.kind === 'repeat' ? '#F5D398' : '#DCE9E3', borderLeftWidth:path.length>1?3:0,borderColor:'#648B80'}}>
    <View style={{flexDirection:'row',gap:6,alignItems:'center'}}>
      {block.kind === 'repeat' ? <Copy style={{flex:1,fontWeight:'800'}}>{name(block)} · body below</Copy> : <Button compact quiet style={{flex:1}} label={`Edit block ${path.map(i=>i+1).join('.')}: ${name(block)}`} disabled={!active || s.running || won} onPress={()=>setEditing({path,block})}>{name(block)} ✎</Button>}
      {path.length===1 && <Button compact quiet label={`Remove block ${path[0]+1}`} disabled={!active || s.running || won} onPress={()=>change(s.program.filter((_,i)=>i!==path[0]))}>✕</Button>}
    </View>
    {block.kind==='repeat' && block.body.map((child,i)=>renderBlock(child,[...path,i]))}
  </View>;
  return <View style={{gap:9,alignItems:'center'}}>
    <Copy style={{fontSize:18,fontWeight:'700',color:C.ink,alignSelf:'stretch'}}>{s.done===4?'Turtle artist!':`Drawing ${s.done+1} of 4 · ${s.level>=3?'Use repeat to trace the shape':'Trace the faint shape'}`}</Copy>
    <Svg width={size} height={size*.8} viewBox="-50 -55 400 320" accessible accessibilityLabel={`Sand canvas. Grid squares are 10 units. Target lengths: ${[...new Set(goal.map(a=>Math.round(Math.hypot(a.to.x-a.from.x,a.to.y-a.from.y))))].join(', ')} units. ${traced.length} drawn lines.`}>
      <Rect x={-50} y={-55} width={400} height={320} rx={18} fill="#F8E7BF"/>
      {Array.from({length:39},(_,i)=><Path key={`v${i}`} d={`M${-40+i*10} -45V255`} stroke="#E2CEA7" strokeWidth={.6}/>)}
      {Array.from({length:31},(_,i)=><Path key={`h${i}`} d={`M-40 ${-50+i*10}H340`} stroke="#E2CEA7" strokeWidth={.6}/>)}
      <Path d="M-25 -10V-20H75V-10M25 -20V-13" stroke="#725B36" strokeWidth={2} fill="none"/>
      {[0,50,100].map((n,i)=><SvgText key={n} x={-25+i*50} y={-28} fontSize={13} fill="#58462E" textAnchor="middle">{n}</SvgText>)}
      {(s.free?[]:goal).map((a,i)=><Path key={i} d={`M${a.from.x} ${a.from.y}L${a.to.x} ${a.to.y}`} stroke={feedback?.segment===i?'#AD4D35':'#9B8868'} strokeWidth={feedback?.segment===i?10:7} strokeDasharray="2 7" strokeLinecap="round" fill="none"/>)}
      {traced.map((a,i)=><Path key={i} d={`M${a.from.x} ${a.from.y}L${a.to.x} ${a.to.y}`} stroke={feedback?.segment===i?'#AD4D35':a.color==='coral'?'#E68E82':a.color==='gold'?'#B9861E':'#348B7E'} strokeWidth={4} strokeLinecap="round" fill="none"/>)}
      {!s.free && goal.slice(0,4).map((a,i)=><SvgText key={i} x={(a.from.x+a.to.x)/2} y={(a.from.y+a.to.y)/2-9} fontWeight="bold" fontSize={15} fill="#58462E">{Math.round(Math.hypot(a.to.x-a.from.x,a.to.y-a.from.y))}</SvgText>)}
      <Circle cx={point.x} cy={point.y} r={10} fill="#6CB5A4" stroke="#2D756B" strokeWidth={2}/><Circle cx={point.x+5} cy={point.y-3} r={2} fill="#234B4F"/>
    </Svg>
    <Copy>1 grid square = 10 units · numbers label target lengths</Copy>
    <Copy style={{fontSize:15,color:C.ink}}>{message||`Your program: ${s.program.length} of ${task.limit} blocks`}</Copy>
    <View style={{alignSelf:'stretch',gap:6,padding:6,borderRadius:14,backgroundColor:C.paper}}>{!s.program.length&&<Copy style={{padding:10}}>Tap a block to begin</Copy>}{s.program.map((b,i)=>renderBlock(b,[i]))}</View>
    {editing && <View style={{alignSelf:'stretch',gap:6,padding:10,backgroundColor:'#FFF4D4',borderRadius:12}}><Copy style={{fontWeight:'800'}}>Change {name(editing.block)} · keep the rest of the loop</Copy><View style={{flexDirection:'row',flexWrap:'wrap',gap:6}}>{(editing.block.kind==='forward'?[60,70,80,90,100].map(n=>({kind:'forward',n} as Block)):editing.block.kind==='turn'?[45,60,90,120].map(angle=>({kind:'turn',angle} as Block)):['coral','teal','gold'].map(color=>({kind:'color',color} as Block))).map(b=><Button key={name(b)} compact disabled={!active||s.running} onPress={()=>change(replaceBlock(s.program,editing.path,b))}>{name(b)}</Button>)}<Button compact quiet onPress={()=>setEditing(null)}>Cancel edit</Button></View></View>}
    {(won||s.free)&&<View style={{alignSelf:'stretch',gap:8}}><Button onPress={()=>{const done=s.done+1;update({...s,done,program:done<4?initialProgram(s.tasks[done]):[],cursor:0,running:false,free:false});setMessage('');setEditing(null);}}>{s.done===3?'Finish!':'Next shape'}</Button>{won&&<Button quiet onPress={()=>{update({...s,free:true,program:[],cursor:0});setMessage('Free draw: add any blocks!');}}>Free draw</Button>}</View>}
    {s.done<4&&(!won||s.free)&&<>
      <View style={{flexDirection:'row',flexWrap:'wrap',gap:6,justifyContent:'center'}}>{[60,70,80,90,100].map(n=><Button key={n} compact quiet label={`Add forward ${n}`} disabled={!active||s.running} onPress={()=>add({kind:'forward',n})}>↑ {n}</Button>)}{[45,60,90,120].map(angle=><Button key={angle} compact quiet label={`Add turn ${angle} degrees`} disabled={!active||s.running} onPress={()=>add({kind:'turn',angle})}>↻ {angle}°</Button>)}</View>
      {s.level>=3&&<><Copy>↻ ×2 = [↑ ↻] + [↑ ↻] · two whole-body runs</Copy><View style={{flexDirection:'row',flexWrap:'wrap',justifyContent:'center',gap:6}}>{[2,3,4,6,8].map(times=><Button key={times} compact quiet label={`Wrap plan in repeat ${times}`} disabled={!active||s.running} onPress={()=>wrap(times)} style={{backgroundColor:canWrap(s.program,times)?'#F5D398':'#E7E0D4'}} >Repeat ×{times}</Button>)}</View>{!canWrap(s.program,2)&&<Copy>{wrapIssue(s.program,2)}</Copy>}</>}
      {s.level>=2&&<View style={{flexDirection:'row',gap:6}}>{(['coral','teal','gold'] as const).map(color=><Button key={color} compact quiet label={`Add ${color} pen`} disabled={!active||s.running} onPress={()=>add({kind:'color',color})}>{color} pen</Button>)}</View>}
      <View style={{flexDirection:'row',gap:8,alignSelf:'stretch'}}><Button style={{flex:1}} disabled={!active||!s.program.length||s.running} onPress={()=>{const issue=programIssue(s.program);if(issue){setMessage(issue);return;}update({...s,cursor:0,running:true,attempts:s.attempts+1});setEditing(null);setMessage('Watch the turtle draw!');}}>Draw ▶</Button><Button quiet disabled={!active||s.running} onPress={()=>{assistance?.();update({...s,program:task.target,cursor:0,helped:true});setEditing(null);setMessage('Here is one way. Press Draw!');}}>Show me</Button></View>
    </>}
  </View>;
}
