export type DropBox={left:number;top:number;right:number;bottom:number};
export type DropPoint={x:number;y:number};
/** Serializable, worklet-safe destination rules. Prepared once per settled room edit. */
export type DropBody = { id:string; x:number; y:number; w:number; h:number; layer:string; on?:string; small?:boolean; holdable?:boolean; edible?:'food'|'drink'; left:number; right:number; top:number; bottom:number; box?:DropBox; depth?:number };
export type DropSocket = { itemId:string; socketId:string; x:number; y:number; pose:'sit'|'lie'|'bathe'; occupied?:number; pet?:boolean; priority?:number; box?:DropBox };
export type DropWorld = { bodies:DropBody[]; sockets:DropSocket[]; surfaces:{id:string;x:number;y:number;w:number;sx:number;sy:number;radius:number}[]; people:{slot:number;x:number;y:number;holding?:string;seatId?:string;handX?:number;handY?:number;mouthX?:number;mouthY?:number}[] };
export type DropResult = { kind:'floor'|'surface'|'socket'|'hand'|'mouth'; x:number;y:number;px:number;py:number;on?:string;itemId?:string;socketId?:string;slot?:number;pose?:'sit'|'lie'|'bathe';box?:DropBox };
/** Conservative standing silhouettes, in the same room units as the rendered rigs. */
export function friendBounds(slot:number){
 'worklet';
 return slot===0?{width:136,height:224}:slot===2?{width:98,height:90}:{width:170,height:170};
}
/** Union of front-painted furniture rectangles; overlapping art is counted once. */
export function occlusion(world:DropWorld,slot:number,x:number,y:number){
 'worklet';
 const size=friendBounds(slot),left=x-size.width/2,right=x+size.width/2,top=y-size.height;
 const boxes=world.bodies.filter(b=>b.box&&b.layer==='furniture'&&(b.depth??-Infinity)>y+1).map(b=>({left:Math.max(left,b.box!.left),right:Math.min(right,b.box!.right),top:Math.max(top,b.box!.top),bottom:Math.min(y,b.box!.bottom),depth:b.depth!})).filter(b=>b.right>b.left&&b.bottom>b.top);
 const edges=boxes.flatMap(b=>[b.left,b.right]).sort((a,b)=>a-b);let area=0,depth=-Infinity;
 for(const b of boxes)depth=Math.max(depth,b.depth);
 for(let i=1;i<edges.length;i++){
  const a=edges[i-1],b=edges[i];if(a===b)continue;
  const spans=boxes.filter(r=>r.left<b&&r.right>a).sort((r,s)=>r.top-s.top);let end=top,height=0;
  for(const r of spans){height+=Math.max(0,r.bottom-Math.max(end,r.top));end=Math.max(end,r.bottom);}
  area+=(b-a)*height;
 }
 return {fraction:area/(size.width*size.height),depth};
}

export function resolveDrop(world:DropWorld, subject:DropBody | {slot:number;floorOnly?:boolean}, px:number, py:number, contacts:readonly DropPoint[]=[]):DropResult|undefined {
 'worklet';
 if(!Number.isFinite(px)||!Number.isFinite(py))return;
 const item='id' in subject?subject:undefined,friend='slot' in subject?subject:undefined;
 if(item) {
  for(const person of world.people){
   const hx=person.handX??person.x+42,hy=person.handY??person.y-84,mx=person.mouthX??person.x,my=person.mouthY??person.y-160;
   const handDistance=Math.hypot(px-hx,py-hy),mouthDistance=Math.hypot(px-mx,py-my);
   if(item.edible&&mouthDistance<58&&mouthDistance<=handDistance)return {kind:'mouth',slot:person.slot,x:0,y:0,px:mx,py:my};
   if(item.holdable && handDistance<65)return {kind:'hand',slot:person.slot,x:0,y:0,px:hx,py:hy};
   if(item.edible && mouthDistance<58)return {kind:'mouth',slot:person.slot,x:0,y:0,px:mx,py:my};
  }
 } else if(!friend?.floorOnly) {
  const points=[{x:px,y:py},...contacts],sourceId=world.people.find(p=>p.slot===friend?.slot)?.seatId;
  const pointer=contacts[0];
  const liftedOutside=(s:DropSocket)=>{
   'worklet';
   const b=s.box;return s.itemId===sourceId&&!!pointer&&!!b&&(pointer.x<b.left||pointer.x>b.right||pointer.y<b.top-friendBounds(friend?.slot??0).height||pointer.y>b.bottom);
  };
  const sourceSocket=world.sockets.find(s=>s.itemId===sourceId&&!!s.pet===(friend?.slot===2));
  const sourceBox=sourceSocket?.box;
  const lifting=!!sourceSocket&&liftedOutside(sourceSocket)&&!!pointer&&!!sourceBox&&pointer.x>=sourceBox.left-90&&pointer.x<=sourceBox.right+90&&pointer.y>=sourceBox.top-friendBounds(friend?.slot??0).height&&pointer.y<=sourceBox.bottom+120;
  let best:DropSocket|undefined,distance=Infinity,priority=-Infinity;
  const free=world.sockets.filter(s=>(!lifting||s.priority!==0)&&!!s.pet===('slot' in subject&&subject.slot===2)&&(s.occupied===undefined||s.occupied===('slot' in subject?subject.slot:-1)));
  // A child can aim anywhere on the furniture, not just its small authored contact.
  for(const socket of free){
   const box=socket.box;if(!box||liftedOutside(socket))continue;
   for(const p of points){if(p.x<box.left||p.x>box.right||p.y<box.top-friendBounds(friend?.slot??0).height||p.y>box.bottom)continue;
    const d=Math.hypot(p.x-socket.x,p.y-socket.y),rank=socket.priority??1;if(rank>priority||rank===priority&&d<distance){best=socket;distance=d;priority=rank;}
   }
  }
  if(!best){distance=85;for(const socket of free){if(liftedOutside(socket))continue;const d=Math.hypot(px-socket.x,py-socket.y);if(d<distance){best=socket;distance=d;}}}
  if(best)return {kind:'socket',...best,px:best.x,py:best.y};
 }
 if(item?.small){
  let best:DropResult|undefined,distance=Infinity;
  for(const s of world.surfaces){
   if(s.id===item.id||Math.abs(px-s.sx)>s.radius||Math.abs(py-s.sy)>=42)continue;
   if(world.bodies.filter(b=>b.on===s.id&&b.id!==item.id).length>=Math.min(3,s.w))continue;
   for(let x=s.x;x<s.x+s.w;x++){
    if(world.bodies.some(b=>b.id!==item.id&&b.on===s.id&&b.x===x))continue;
    const sx=s.sx+(x-s.x-(s.w-1)/2)*38,d=(sx-px)**2+(s.sy-py)**2;
    if(sx+item.left<8||sx+item.right>792||s.sy+item.top<8||s.sy+item.bottom>552)continue;
    if(d<distance){distance=d;best={kind:'surface',x,y:s.y,on:s.id,px:sx,py:s.sy};}
   }
  }
  if(best)return best;
 }
 let best:DropResult|undefined,distance=Infinity;
 const visible:{spot:DropResult;distance:number}[]=[];let nearestDistance=Infinity,nearestDepth=-Infinity;
 const slot='slot' in subject?subject.slot:0,bounds=friendBounds(slot);
 let targetX=px,targetY=py,minDepth=-Infinity;
 if(!item){
  const hidden=occlusion(world,slot,px,py);
  if(hidden.fraction>.25)minDepth=hidden.depth;
  const source=world.bodies.find(b=>b.id===world.people.find(p=>p.slot===slot)?.seatId);
  const pointer=contacts[0]??{x:px,y:py};
  if(!friend?.floorOnly&&source?.box&&pointer.x>=source.box.left-90&&pointer.x<=source.box.right+90&&pointer.y>=source.box.top-bounds.height&&pointer.y<=source.box.bottom+120){
   targetX=(source.box.left+source.box.right)/2;targetY=Math.max(source.box.bottom,source.depth??0)+20;minDepth=Math.max(minDepth,source.depth??0);
  }
 }
 const wall=item?.layer==='wall';
 for(let y=0;y<(wall?4:12);y++)for(let x=0;x<(item?16:20);x++){
  const sx=wall?54+x*46:43+x*37.5+y*1.5,sy=wall?124+y*56:386+y*14.4;
  const left=item?.left??-bounds.width/2,right=item?.right??bounds.width/2,top=item?.top??-bounds.height,bottom=item?.bottom??0;
  if(sx+left<8||sx+right>792||sy+top<8||sy+bottom>552)continue;
  const w=item?.w??1,h=item?.h??1,layer=item?.layer??'furniture';
  if(item&&(x+w>16||y+h>(wall?4:12)))continue;
  if(world.bodies.some(b=>b.id!==item?.id&&b.on===undefined&&b.layer===layer&&x<b.x+b.w&&b.x<x+w&&y<b.y+b.h&&b.y<y+h))continue;
  const d=(sx-targetX)**2+(sy-targetY)**2,spot:DropResult={kind:'floor',x,y,px:sx,py:sy};
  if(!item){
   const hidden=occlusion(world,slot,sx,Math.min(540,sy));
   if(d<nearestDistance){nearestDistance=d;nearestDepth=hidden.fraction>.25?hidden.depth:-Infinity;}
   if(hidden.fraction<=.25)visible.push({spot,distance:d});
  }else if(d<distance){distance=d;best=spot;}
 }
 if(!item){
  minDepth=Math.max(minDepth,nearestDepth);
  // Prefer the front of the nearest occluder; a clear side is the bounded-room fallback.
  const front=visible.filter(c=>Math.min(540,c.spot.py)+1>minDepth),choices=front.length?front:visible;
  for(const c of choices)if(c.distance<distance){distance=c.distance;best=c.spot;}
 }
 return best;
}

/** Preview and release choose the same room even when the feet straddle a doorway. */
export function characterDropRoom<T extends {id:string;origin:DropPoint;world:DropWorld}>(rooms:readonly T[],slot:number,points:readonly DropPoint[]):T|undefined {
 'worklet';
 for(const p of points)for(const room of rooms)for(const s of room.world.sockets){const b=s.box;if(b&&!!s.pet===(slot===2)&&(s.occupied===undefined||s.occupied===slot)&&p.x>=room.origin.x+b.left&&p.x<=room.origin.x+b.right&&p.y>=room.origin.y+b.top-friendBounds(slot).height&&p.y<=room.origin.y+b.bottom)return room;}
 for(const p of [points[points.length-1],...points]){if(!p)continue;for(const room of rooms)if(p.x>=room.origin.x&&p.x<=room.origin.x+800&&p.y>=room.origin.y&&p.y<=room.origin.y+560)return room;}
}
