import { visualBox, capabilityOf, type WorldPose } from "./world";
import { canHold, socketsOf, characterForSocket, dropBody, dropWorld } from "./interactions";
import { resolveDrop, occlusion } from "./drop";
import { itemPoint, floorPoint, characterPoint } from "./geometry";
import { freeFloor } from "./freeFloor";
import { roomDefaultTheme } from "./art/roomDefaults";
import { moreCatalog, roomIds, tintIds, type RoomId, type TintId } from "./catalogMore";
import { clearFootprint } from "./placement";
import { badgeIds, floorThemes, itemIds, itemSpec, isSeat, starterItems, wallThemes, decorSpec, type ItemId } from "./catalog";
export type Rotation = 0 | 90 | 180 | 270;
export type Instance = {
  id: string;
  item: ItemId;
  x: number;
  y: number;
  rotation: Rotation;
  mirrored: boolean;
  layer: "ground" | "furniture" | "wall";
  state: "rest" | "active";
  tint?: TintId;
  on?: string;
  powered?: boolean;
  empty?: boolean;
};
export const anchors = ["hello", "window", "bed", "chair", "rug", "beanbag", "shelf", "floor", "beach-left", "beach-middle", "beach-right", "seat"] as const;
export type Anchor = (typeof anchors)[number];
export type Pose = WorldPose;
export type Character = { slot: 0 | 1 | 2; anchor: Anchor; pose: Pose; x?: number; y?: number; seatId?: string; socket?: {itemId:string;socketId:string}; holding?:string };
/** Room view retained for the immutable art contract’s HomeState["theme"] lookup. */
export type HomeState = {
  version: 1;
  scene: "room-1";
  instances: Instance[];
  characters: Character[];
  theme: { wallpaper: (typeof wallThemes)[number]; floor: (typeof floorThemes)[number] };
};
export type RoomState = Pick<HomeState, "instances" | "characters" | "theme">;
export type HomeStateV2 = { version: 2 | 3; current: RoomId; rooms: Record<RoomId, RoomState> };
export type HomeSave = HomeState | HomeStateV2;
export const currentRoom = (state: HomeStateV2): RoomState => state.rooms[state.current];
export type Ownership = {
  ownedItems?: readonly ItemId[];
  ownedWallpapers?: readonly HomeState["theme"]["wallpaper"][];
  ownedFloors?: readonly HomeState["theme"]["floor"][];
};
export const MAX_INSTANCES = 48;
const exact = (v: unknown, keys: string[]): v is Record<string, unknown> =>
  !!v &&
  typeof v === "object" &&
  !Array.isArray(v) &&
  Object.keys(v).length === keys.length &&
  keys.every((k) => Object.hasOwn(v, k));
const integer = (n: unknown): n is number => typeof n === "number" && Number.isSafeInteger(n);
const member = <T>(values: readonly T[], v: unknown): v is T => values.includes(v as T);
export function dimensions(i: Instance): readonly [number, number] {
  const [w, h] = itemSpec(i.item).footprint;
  return i.rotation % 180 ? [h * 2, w * 2] : [w * 2, h * 2];
}
export function validPlacement(instances: readonly Instance[], candidate: Instance): boolean {
  if (candidate.on !== undefined) {
    const parent = instances.find(i => i.id === candidate.on);
    if (!parent || parent.id === candidate.id || parent.on !== undefined || !decorSpec(parent.item).surface || !decorSpec(candidate.item).small) return false;
    const [w, h] = dimensions(parent), cw = 1, ch = 1;
    if (candidate.x < parent.x || candidate.y < parent.y || candidate.x + cw > parent.x + w || candidate.y + ch > parent.y + h) return false;
    if (candidate.y !== parent.y || instances.filter(i => i.on === parent.id && i.id !== candidate.id).length >= Math.min(3, w)) return false;
    return clearFootprint(instances.filter(i => i.on === parent.id).map(i => ({ ...footprint(i), w: 1, h: 1 })), { ...footprint(candidate), w: 1, h: 1 });
  }
  return clearFootprint(instances.filter(i => i.on === undefined).map(footprint), footprint(candidate));
}
function footprint(i: Instance) {
  const [w, h] = dimensions(i);
  return { id: i.id, x: i.x, y: i.y, w, h, layer: i.layer };
}
function validInstance(v: unknown, legacy = false): v is Instance {
  if (
    !exact(v, ["id", "item", "x", "y", "rotation", "mirrored", "layer", "state", ...(!legacy && v && typeof v === "object" && Object.hasOwn(v, "tint") ? ["tint"] : []), ...(!legacy && v && typeof v === "object" && Object.hasOwn(v, "on") ? ["on"] : []), ...(["powered","empty"].filter(k=>!legacy && v && typeof v === "object" && Object.hasOwn(v,k)))]) ||
    typeof v.id !== "string" ||
    !/^[a-zA-Z0-9_-]{1,48}$/.test(v.id) ||
    !member(itemIds, v.item) || (legacy && typeof v.item === "string" && Object.hasOwn(moreCatalog, v.item))
  )
    return false;
  const spec = itemSpec(v.item as ItemId);
  return (
    (!Object.hasOwn(v, "tint") || (decorSpec(v.item as ItemId).tintable === true && member(tintIds, v.tint))) &&
    (!Object.hasOwn(v, "on") || typeof v.on === "string") &&
    (!Object.hasOwn(v,"powered") || typeof v.powered === "boolean") &&
    (!Object.hasOwn(v,"empty") || (typeof v.empty === "boolean" && capabilityOf(v.item as ItemId).edible === "drink")) &&
    integer(v.x) &&
    integer(v.y) &&
    member(spec.rotations, v.rotation) &&
    typeof v.mirrored === "boolean" &&
    (!v.mirrored || spec.mirror) &&
    v.layer === spec.layer &&
    member(["rest", "active"], v.state) &&
    (v.state === "rest" || !!spec.interactive)
  );
}
function validRoom(v: unknown, legacy = false, canonical = false): v is RoomState {
  if (!exact(v, ["instances", "characters", "theme"]) || !Array.isArray(v.instances) || v.instances.length > (legacy ? 32 : MAX_INSTANCES) || !v.instances.every(i => validInstance(i, legacy))) return false;
  const items = v.instances as Instance[];
  if (new Set(items.map(i => i.id)).size !== items.length) return false;
  const placed = legacy ? items.map(i => ({ ...i, x: i.x * 2, y: i.y * 2 })) : items;
  if (!placed.filter(i=>!Array.isArray(v.characters)||!v.characters.some((c:Character)=>c?.holding===i.id)).every(i => validPlacement(placed.filter(i=>!Array.isArray(v.characters)||!v.characters.some((c:Character)=>c?.holding===i.id)), i))) return false;
  if (!exact(v.theme, ["wallpaper", "floor"]) || !member(wallThemes, v.theme.wallpaper) || !member(floorThemes, v.theme.floor)) return false;
  return Array.isArray(v.characters) && v.characters.length <= 3 && new Set(v.characters.map(c => c?.slot)).size === v.characters.length && v.characters.every(c => validCharacter(c, items, legacy, canonical));
}
export function validHome(v: unknown): v is HomeSave {
  if (!v || typeof v !== "object") return false;
  const s = v as HomeSave;
  if (s.version === 1) {
    if (!exact(v, ["version", "scene", "instances", "characters", "theme"]) || s.scene !== "room-1") return false;
    return validRoom({ instances: s.instances, characters: s.characters, theme: s.theme }, true);
  }
  if (!exact(v, ["version", "current", "rooms"]) || ![2,3].includes(s.version) || !member(roomIds, s.current) || !exact(s.rooms, [...roomIds]) || !roomIds.every(id => validRoom(s.rooms[id], false, s.version===3))) return false;
  // Friends may live in different rooms; duplicate slots across rooms are corrupt data.
  const slots = roomIds.flatMap(id => s.rooms[id].characters.map(c => c.slot));
  if(new Set(slots).size !== slots.length)return false;
  return roomIds.every(id=>{
    const room=s.rooms[id],occupied=room.characters.filter(c=>c.socket).map(c=>`${c.socket!.itemId}:${c.socket!.socketId}`),held=room.characters.flatMap(c=>c.holding?[c.holding]:[]);
    return new Set(occupied).size===occupied.length&&new Set(held).size===held.length;
  });
}
/** Pure, strict and idempotent. Never changes the source; invalid input belongs in recovery. */
export function migrateHome(v: unknown): HomeStateV2 | undefined {
 const migrated=migrateValidatedHome(v);
 return migrated&&migrated.version===3&&validHome(migrated)?migrated:undefined;
}
function migrateValidatedHome(v:unknown):HomeStateV2|undefined {
  if (!validHome(v)) return undefined;
  if(v.version===3){const rooms=Object.fromEntries(roomIds.map(id=>[id,normalizeRoom(v.rooms[id])])) as HomeStateV2['rooms'];return roomIds.every(id=>rooms[id].instances.every((i,n)=>i.x===v.rooms[id].instances[n].x&&i.y===v.rooms[id].instances[n].y&&i.on===v.rooms[id].instances[n].on))?v:{...v,rooms};}
  if(v.version!==1)return upgradeHome(v);
  const base = starterHome();
  return upgradeHome({ ...base, rooms: { ...base.rooms, home: {
    theme: { ...v.theme }, instances: v.instances.map(i => ({ ...i, x: i.x * 2, y: i.y * 2 })),
    characters: v.characters.map(c => c.anchor === "floor" ? { ...c, x: c.x! * 2, y: c.y! * 2 } : { ...c })
  } } });
}
/** Only visually invalid positions change on migration; source records are never mutated. */
export function normalizeRoom(room:RoomState):RoomState {
 let instances=room.instances.map(i=>({...i}));
 // Move furniture before its surface children, then check every drawn child too.
 const ids=[...instances.filter(i=>!i.on),...instances.filter(i=>i.on)].map(i=>i.id);
 for(const id of ids){
  const i=instances.find(i=>i.id===id)!;if(room.characters.some(c=>c.holding===id))continue;
  const p=itemPoint(i,instances),b=visualBox(i.item,i.rotation,i.mirrored);
  if(p.x+b.left>=8&&p.x+b.left+b.width<=792&&p.y+b.top>=8&&p.y+b.top+b.height<=552)continue;
  const world=dropWorld({...room,instances}),body={...dropBody(i),left:b.left,right:b.left+b.width,top:b.top,bottom:b.top+b.height};
  const spot=resolveDrop({...world,people:[],sockets:[],surfaces:i.on?world.surfaces:[]},body,p.x,p.y);
  if(!spot)throw new Error('This room needs a clear space before its layout can be repaired. Your original has been kept.');
  const dx=spot.x-i.x,dy=spot.y-i.y;
  instances=instances.map(other=>{if(other.id===id){const {on,...rest}=other;void on;return {...rest,x:spot.x,y:spot.y,...(spot.on?{on:spot.on}:{})};}return other.on===id?{...other,x:other.x+dx,y:other.y+dy}:other;});
 }
 return {...room,instances};
}
function upgradeHome(v:HomeStateV2):HomeStateV2 {
 const rooms={...v.rooms};
 for(const id of roomIds){
  const room=normalizeRoom(v.rooms[id]),used=new Set<string>();
  const characters=room.characters.map(c=>{
   // Match historical characterPoint: an implicit "seat" means the first seat.
   const seat=room.instances.find(i=>c.seatId?i.id===c.seatId:c.anchor==='seat'?isSeat(i.item):i.item===c.anchor);
   const compatible=seat&&socketsOf(seat).filter(s=>s.id.startsWith('pet-')===(c.slot===2));
   const free=compatible?.filter(s=>!used.has(`${seat!.id}:${s.id}`));
   const socket=free?.find(s=>s.id===c.socket?.socketId)??free?.[0];
   if(seat&&socket){used.add(`${seat.id}:${socket.id}`);return characterForSocket(c,seat,socket);}
   if(c.anchor==='seat'||seat&&c.pose!=='stand')return {slot:c.slot,anchor:'floor' as const,pose:'stand' as const,...freeFloor(room.instances.filter(i=>!room.characters.some(c=>c.holding===i.id)),8,8),...(c.holding?{holding:c.holding}:{})};
   return {...c};
  });
  rooms[id]={...room,characters};
 }
 return {...v,version:3,rooms};
}
/** Historical furniture anchors are input-only; v3 occupants name a compatible socket.
 * Non-furniture anchors (hello/window/beach) remain valid without relationships. */
export function validCharacter(c: unknown, items: readonly Instance[], legacy = false, canonical = true): c is Character {
  if (!c || typeof c !== "object" || (legacy && (c as Character).anchor === "seat")) return false;
  const v = c as Character;
  if(v.socket !== undefined){
   const seat=items.find(i=>i.id===v.socket?.itemId),socket=seat&&socketsOf(seat).find(s=>s.id===v.socket?.socketId);
   if(!exact(v.socket,["itemId","socketId"])||!socket||(socket.id.startsWith('pet-')!==(v.slot===2))||v.pose!==socket.kind||v.anchor!=="seat"||v.seatId!==seat?.id)return false;
  }
  const resolvedSeat=items.find(i=>v.seatId?i.id===v.seatId:i.item===v.anchor);
  if(canonical&&!v.socket&&(v.anchor==='seat'||resolvedSeat&&socketsOf(resolvedSeat).length>0))return false;
  if(v.holding!==undefined && (!items.some(i=>i.id===v.holding&&canHold(i)&&!i.on)||typeof v.holding!=="string"))return false;
  const keys =
    v.anchor === "floor"
      ? ["slot", "anchor", "pose", "x", "y"]
      : v.seatId !== undefined
        ? ["slot", "anchor", "pose", "seatId"]
        : ["slot", "anchor", "pose"];
  if (!exact(c, [...keys,...(v.socket?["socket"]:[]),...(v.holding!==undefined?["holding"]:[])]) || !member([0, 1, 2], v.slot) || !member(anchors, v.anchor) || (!v.socket && v.pose !== poseFor(v.anchor)))
    return false;
  if (v.anchor === "floor") return integer(v.x) && integer(v.y) && v.x >= 0 && v.x <= (legacy ? 9 : 19) && v.y >= 0 && v.y <= (legacy ? 5 : 11);
  return v.seatId !== undefined
    ? items.some((i) => i.id === v.seatId && (v.anchor === "seat" ? socketsOf(i).length>0 : i.item === v.anchor))
    : anchorAvailable(items, v.anchor);
}
export const poseFor = (anchor: Anchor): Pose =>
  ["bed", "chair", "rug", "beanbag", "shelf", "seat"].includes(anchor) ? "sit" : "stand";
export const anchorAvailable = (items: readonly Instance[], anchor: Anchor) =>
  !["bed", "chair", "rug", "beanbag", "shelf", "seat"].includes(anchor) || items.some((i) => anchor === "seat" ? socketsOf(i).length>0 : i.item === anchor);
export function instance(id: string, item: ItemId, x: number, y: number): Instance {
  return { id, item, x, y, rotation: 0, mirrored: false, layer: itemSpec(item).layer, state: "rest" };
}
export function legacyStarterHome(): HomeState {
  return {
    version: 1,
    scene: "room-1",
    theme: { wallpaper: "cream", floor: "honey" },
    instances: [
      instance("bed", "bed", 0, 0),
      instance("shelf", "shelf", 3, 0),
      instance("plant", "plant", 6, 0),
      instance("lamp", "lamp", 7, 2),
      instance("rug", "rug", 2, 3),
      instance("table", "table", 5, 3),
      instance("chair", "chair", 5, 4),
      instance("toys", "toy-box", 0, 4),
    ],
    characters: [
      { slot: 0, anchor: "window", pose: "stand" },
      { slot: 1, anchor: "shelf", pose: "sit" },
      { slot: 2, anchor: "rug", pose: "sit" },
    ],
  };
}
export function starterHome(): HomeStateV2 {
  const positions:readonly [string,string,number,number][]=[['bed','bed',4,0],['shelf','shelf',12,0],['plant','plant',14,4],['lamp','lamp',13,0],['rug','rug',8,8],['toys','toy-box',7,6]];
  const home:RoomState={theme:{...roomDefaultTheme.home},instances:positions.map(([id,item,x,y])=>({...instance(id,item,x,y),...(id==='lamp'?{on:'shelf'}:{})})),characters:[{slot:0,anchor:'floor',pose:'stand',x:8,y:8},{slot:1,anchor:'floor',pose:'stand',x:17,y:2},{slot:2,anchor:'floor',pose:'stand',x:6,y:10}]};
  const extra = (room: Exclude<RoomId, "home">): RoomState => {
    const starters: Record<Exclude<RoomId, "home">, readonly [string, number, number][]> = {
      kitchen: [["fridge", 6, 0], ["sink-counter", 11, 0], ["stove", 2, 0], ["fruit-bowl", 12, 6], ["kitchen-table", 11, 6], ["stool", 9, 10], ["stool", 14, 10]],
      treehouse: [["hammock", 4, 0], ["floor-cushion", 8, 7], ["floor-cushion", 11, 9], ["string-lights", 6, 0], ["lantern", 10, 2], ["teddy", 6, 8], ["book", 9, 5]],
      beach: [["bubble-bath", 4, 0], ["lounger", 10, 1], ["beach-towel", 6, 7], ["beach-towel", 11, 8], ["ball", 6, 4], ["shell", 12, 6], ["banana-plant", 14, 5]],
    };
    return { theme: { ...roomDefaultTheme[room] }, characters: [], instances: starters[room].map(([item, x, y],index) => ({...instance(`starter-${item}${starters[room].findIndex(row=>row[0]===item)===index?'':`-${index}`}`, item, x, y), ...(item === "fruit-bowl" ? {on: "starter-kitchen-table"} : item === "fridge" ? {mirrored:true} : {})})) };
  };
  return upgradeHome({ version: 3, current: "home", rooms: { home, kitchen: extra("kitchen"), treehouse: extra("treehouse"), beach: extra("beach") } });
}
export type HomeAction = (
  | {type:"dispense";source:string;item:ItemId;id:string;x:number;y:number}
  | {type:"use-item";id:string;slot:Character["slot"];eat?:boolean}
  | {type:"release-held";slot:Character["slot"];x:number;y:number}
  | { type: "transfer"; slot: Character["slot"]; room: RoomId; x: number; y: number;seatId?:string;socketId?:string }
  | { type: "place"; instance: Instance; target?:{slot:Character["slot"];eat:boolean} }
  | { type: "move"; id: string; x: number; y: number; on?: string }
  | { type: "tint"; id: string; tint: TintId }
  | { type: "room"; room: RoomId }
  | { type: "rotate" | "mirror" | "put-away" | "toggle"; id: string }
  | { type: "character"; slot: Character["slot"]; anchor: Anchor; x?: number; y?: number; seatId?: string; socketId?:string }
  | { type: "theme"; wallpaper?: HomeState["theme"]["wallpaper"]; floor?: HomeState["theme"]["floor"] }
  | { type: "find-friends" }
  | { type: "reset" }) & { roomId?: RoomId };
export type HomeResult = { state: HomeStateV2; message?: string; snapshot?: HomeStateV2 };
export function owns(item: ItemId, ownership: Ownership): boolean {
  return !!moreCatalog[item]?.free || (starterItems as readonly string[]).includes(item) || !!ownership.ownedItems?.includes(item);
}
export function homeReducer(save: HomeStateV2, action: HomeAction, ownership: Ownership = {}): HomeResult {
  const roomId = action.roomId ?? save.current;
  if (!member(roomIds, roomId)) return { state: save };
  const state = save.rooms[roomId];
  let next: RoomState = state;
  const fail = (message: string): HomeResult => ({ state: save, message });
  if (action.type === "room") {
    if (!member(roomIds, action.room) || action.room === save.current) return { state: save };
    return { state: { ...save, current: action.room } };
  }
  if(action.type==='find-friends'){
    const friends=roomIds.flatMap(id=>save.rooms[id].characters.filter(c=>c.slot!==1).map(c=>({c,room:id}))).sort((a,b)=>a.c.slot-b.c.slot);
    const rooms={...save.rooms};let destination={...state,instances:[...state.instances],characters:state.characters.filter(c=>c.slot===1)};
    for(const friend of friends){
      const c={...friend.c},room=friend.room;
      const held=save.rooms[room].instances.find(i=>i.id===c.holding);
      if(room!==roomId){
        rooms[room]={...rooms[room],characters:rooms[room].characters.filter(p=>p.slot!==c.slot),instances:rooms[room].instances.filter(i=>i.id!==c.holding)};
        if(held){let id=held.id,n=0;while(destination.instances.some(i=>i.id===id))id=`found-${++n}-${held.id}`.slice(0,48);destination.instances.push({...held,id});c.holding=id;}
      }
      const point=floorPoint(c.slot===0?9:12,10),spot=resolveDrop(dropWorld(destination),{slot:c.slot,floorOnly:true},point.x,point.y);
      if(!spot)return fail('Make a little space for your friends.');
      destination={...destination,characters:[...destination.characters,{slot:c.slot,anchor:'floor',pose:'stand',x:spot.x,y:spot.y,...(c.holding?{holding:c.holding}:{})}]};
    }
    const found={...save,rooms:{...rooms,[roomId]:destination}};return validHome(found)?{state:found}:{state:save};
  }
  if (action.type === "transfer") {
    if (!member(roomIds, action.room) || !Number.isFinite(action.x) || !Number.isFinite(action.y)) return fail("Choose a room floor.");
    const character = state.characters.find(c => c.slot === action.slot);
    if (!character) return fail("Choose a friend in this room.");
    const destination = save.rooms[action.room];
    const destinationWorld=dropWorld(destination),requested=destinationWorld.sockets.find(s=>s.itemId===action.seatId&&s.socketId===action.socketId&&(s.occupied===undefined||s.occupied===action.slot));
    const destinationDrop=resolveDrop(destinationWorld,{slot:action.slot},requested?.x??floorPoint(action.x,action.y).x,requested?.y??floorPoint(action.x,action.y).y);
    const base:Character={...(character.holding?{holding:character.holding}:{}),slot:action.slot,anchor:'floor',pose:'stand',...freeFloor(destination.instances,destinationDrop?.kind==='floor'?destinationDrop.x:action.x,destinationDrop?.kind==='floor'?destinationDrop.y:action.y)};
    const seat=destinationDrop?.itemId&&destination.instances.find(i=>i.id===destinationDrop.itemId),socket=seat&&socketsOf(seat).find(s=>s.id===destinationDrop?.socketId);
    const moved:Character=seat&&socket?characterForSocket(base,seat,socket):base;
    let held=state.instances.find(i=>i.id===character.holding);
    if(held && destination.instances.some(i=>i.id===held!.id)){
      let suffix=1;while(destination.instances.some(i=>i.id===`carry-${suffix}-${held!.id}`.slice(0,48)))suffix++;
      held={...held,id:`carry-${suffix}-${held.id}`.slice(0,48)};moved.holding=held.id;
    }
    const rooms = { ...save.rooms, [roomId]: { ...state, instances:state.instances.filter(i=>i.id!==character.holding),characters: state.characters.filter(c => c.slot !== action.slot) } };
    rooms[action.room] = { ...rooms[action.room], instances:[...rooms[action.room].instances,...(held?[held]:[])],characters: [...rooms[action.room].characters, moved] };
    rooms[action.room]=settleFriends(rooms[action.room]);
    const transferred={...save,current:action.room,rooms};return validHome(transferred)?{state:transferred}:{state:save};
  }
  if (action.type === "reset") {
    const fresh = starterHome().rooms[roomId];
    const characters = state.characters.map(c => fresh.characters.find(initial => initial.slot === c.slot) ?? {slot:c.slot,anchor:'floor' as const,pose:'stand' as const,...freeFloor(fresh.instances,c.slot*6,8)});
    return { state: {...save,rooms:{...save.rooms,[roomId]:{...fresh,characters}}},snapshot:save };
  }
  if(action.type==='dispense'){
    const source=state.instances.find(i=>i.id===action.source),cap=source&&capabilityOf(source.item);
    if(!source||!cap?.dispenses?.includes(action.item)||(cap.toggle==='open'&&!(source.powered??source.state==='active'))||state.instances.some(i=>i.id===action.id)||state.instances.length>=MAX_INSTANCES)return {state:save};
    const created=instance(action.id,action.item,0,0),spot=resolveDrop(dropWorld(state),dropBody(created),action.x,action.y);
    if(!spot)return {state:save};
    const floor=spot.kind==='hand'||spot.kind==='mouth'?resolveDrop({...dropWorld(state),people:[],surfaces:[]},dropBody(created),action.x,action.y):spot;
    const inserted={...save,rooms:{...save.rooms,[roomId]:{...state,instances:[...state.instances,{...created,x:floor?.x??0,y:floor?.y??0,...(floor?.on?{on:floor.on}:{})}]}}};
    if(spot.kind==='hand'||spot.kind==='mouth'){
      const used=homeReducer(inserted,{type:'use-item',id:created.id,slot:spot.slot as Character['slot'],eat:spot.kind==='mouth',roomId},ownership);
      return validHome(used.state)?used:{state:save};
    }
    next=inserted.rooms[roomId];
  } else if(action.type==="use-item"){
    const item=state.instances.find(i=>i.id===action.id),c=state.characters.find(c=>c.slot===action.slot);
    if(!item||!c)return {state:save};
    const cap=capabilityOf(item.item);
    if(action.eat?(!cap.edible||item.empty):(!canHold(item)))return {state:save};
    const consume=action.eat&&cap.edible==='food';
    const previous=!consume?state.instances.find(i=>i.id===c.holding&&i.id!==item.id):undefined;
    const point=characterPoint(state,c),release=previous&&resolveDrop({...dropWorld(state),people:[],surfaces:[],bodies:dropWorld(state).bodies.filter(i=>i.id!==item.id)},dropBody(previous),point.x+60,point.y);
    if(previous&&!release)return {state:save};
    next={...state,instances:state.instances.filter(i=>!consume||i.id!==item.id).map(i=>{if(previous&&release&&i.id===previous.id)return {...i,x:release.x,y:release.y};if(i.id!==item.id)return i;const {on:_,...rest}=i;void _;return {...rest,...(action.eat?{empty:true}:{})};}),characters:state.characters.map(person=>{
      const {holding,...rest}=person;
      if(person.slot===c.slot)return {...rest,...(!consume?{holding:item.id}:holding&&holding!==item.id?{holding}:{})};
      return holding===item.id?rest:person;
    })};
  } else if(action.type==='release-held'){
    const c=state.characters.find(c=>c.slot===action.slot),held=state.instances.find(i=>i.id===c?.holding);
    if(!c||!held)return {state:save};
    const p=itemPoint({...held,x:action.x,y:action.y}),spot=resolveDrop({...dropWorld(state),people:[]},dropBody(held),p.x,p.y);
    if(!spot)return {state:save};
    next={...state,instances:state.instances.map(i=>i.id===held.id?{...i,x:spot.x,y:spot.y,...(spot.on?{on:spot.on}:{})}:i),characters:state.characters.map(person=>{if(person.slot!==c.slot)return person;const {holding,...rest}=person;void holding;return rest;})};
  } else if (action.type === "place") {
    if (state.instances.length >= MAX_INSTANCES) return fail("Put something away to make room.");
    if (
      !validInstance(action.instance) ||
      !owns(action.instance.item, ownership) ||
      state.instances.some((i) => i.id === action.instance.id)
    )
      return fail("Choose an owned item.");
    next = { ...state, instances: [...state.instances, action.instance] };
  } else if (action.type === "theme") {
    if (action.wallpaper && !["cream", "lagoon", ...(ownership.ownedWallpapers ?? [])].includes(action.wallpaper))
      return fail("Earn this room style through the badge tracks.");
    if (action.floor && !["sand", "honey", ...(ownership.ownedFloors ?? [])].includes(action.floor))
      return fail("Earn this room style through the badge tracks.");
    next = {
      ...state,
      theme: { wallpaper: action.wallpaper ?? state.theme.wallpaper, floor: action.floor ?? state.theme.floor },
    };
  } else if (action.type === "character") {
    if (!state.characters.some((c) => c.slot === action.slot) || !anchorAvailable(state.instances, action.anchor))
      return fail("Put that seat in the room first.");
    if (action.anchor === "floor" && (!Number.isFinite(action.x) || !Number.isFinite(action.y))) return fail("Choose a floor spot.");
    const seat=state.instances.find(i=>action.seatId?i.id===action.seatId:i.item===action.anchor);
    const socket=seat&&socketsOf(seat).find(s=>s.id.startsWith('pet-')===(action.slot===2)&&(!action.socketId||s.id===action.socketId));
    if(socket&&state.characters.some(c=>c.slot!==action.slot&&(c.socket?.itemId===seat!.id&&c.socket.socketId===socket!.id||!c.socket&&(c.seatId===seat!.id||!c.seatId&&c.anchor===seat!.item))))return homeReducer(save,{type:'character',slot:action.slot,anchor:'floor',x:seat!.x,y:seat!.y,roomId},ownership);
    next = {
      ...state,
      characters: state.characters.map((c) =>
        c.slot === action.slot
          ? seat&&socket?characterForSocket(c,seat,socket):{
              ...(c.holding?{holding:c.holding}:{}),
              slot: c.slot,
              anchor: action.anchor,
              pose: poseFor(action.anchor),
              ...(action.anchor === "floor"
                ? freeFloor(state.instances, action.x ?? 8, action.y ?? 8)
                : action.seatId !== undefined
                  ? { seatId: action.seatId }
                  : {}),
            }
          : c
      ),
    };
  } else {
    const target = state.instances.find((i) => i.id === action.id);
    if (!target) return fail("Choose an object first.");
    const spec = itemSpec(target.item);
    if (action.type === "put-away") {
      const instances = state.instances.filter((i) => i.id !== action.id && i.on !== action.id);
      next = {
        ...state,
        instances,
        characters: state.characters.map((c) =>
          anchorAvailable(instances, c.anchor) && (!c.seatId || instances.some((i) => i.id === c.seatId))
            ? (()=>{if(!c.holding||instances.some(i=>i.id===c.holding))return c;const {holding,...rest}=c;void holding;return rest;})()
            : { ...(c.holding&&instances.some(i=>i.id===c.holding)?{holding:c.holding}:{}),slot: c.slot, anchor: "floor", pose: "stand", ...freeFloor(instances,c.slot*6,8) }
        ),
      };
    } else {
      if (action.type === "mirror" && !spec.mirror) return fail("This object stays this way round.");
      if (action.type === "toggle" && ((!spec.interactive && !capabilityOf(target.item).toggle) || (capabilityOf(target.item).holdable && !capabilityOf(target.item).toggle))) return fail(`${spec.name} is ready for your story.`);
      if (action.type === "tint" && (!decorSpec(target.item).tintable || !member(tintIds, action.tint))) return fail("Choose a paintable item.");
      const { on: _on, ...floorTarget } = target;
      void _on;
      const replacement =
        action.type === "move"
          ? { ...floorTarget, x: action.x, y: action.y, ...(action.on !== undefined ? { on: action.on } : {}) }
          : action.type === "tint" ? { ...target, tint: action.tint }
          : action.type === "rotate"
            ? {
                ...target,
                rotation: spec.rotations[(spec.rotations.indexOf(target.rotation) + 1) % spec.rotations.length],
              }
            : action.type === "mirror"
              ? { ...target, mirrored: !target.mirrored }
              : { ...target, ...(capabilityOf(target.item).toggle?{powered:!(target.powered??target.state==='active')}:{}),state:spec.interactive?(target.state === "rest" ? ("active" as const) : ("rest" as const)):target.state };
      if(action.type==='move' && action.on===undefined){
        const p=itemPoint(replacement),spot=resolveDrop({...dropWorld(state),people:[],surfaces:[]},dropBody(replacement),p.x,p.y);
        if(!spot)return {state:save};
        Object.assign(replacement,{x:spot.x,y:spot.y});
      }
      next = { ...state, instances: state.instances.map((i) => i.id === action.id ? replacement : action.type === "move" && i.on === target.id ? { ...i, x: i.x + replacement.x - target.x, y: i.y + replacement.y - target.y } : i) };
    }
  }
  if (action.type !== 'character') next = { ...next, characters: next.characters.map(c => c.anchor === 'floor' ? {...c,...freeFloor(next.instances.filter(i=>!next.characters.some(c=>c.holding===i.id)),c.x!,c.y!)} : c) };
  next=settleFriends(next);
  const result: HomeStateV2 = { ...save, rooms: { ...save.rooms, [roomId]: next } };
  if(action.type==='place'&&action.target){
    const used=homeReducer(result,{type:'use-item',id:action.instance.id,slot:action.target.slot,eat:action.target.eat,roomId},ownership);
    return validHome(used.state)?used:{state:save};
  }
  if (!validHome(result)) return {state:save};
  return { state: result };
}
// Badge art is deliberately provisional; these IDs are the integration boundary.
export const validBadges = (v: unknown) =>
  Array.isArray(v) &&
  v.length <= badgeIds.length &&
  new Set(v).size === v.length &&
  v.every((id) => member(badgeIds, id));

/** Layout edits settle free friends in front of art that would hide their silhouette. */
export function settleFriends(room:RoomState):RoomState {
 const world=dropWorld(room);let changed=false;
 const characters=room.characters.map(c=>{
  if(c.socket)return c;
  const p=characterPoint(room,c);if(occlusion(world,c.slot,p.x,p.y).fraction<=.25)return c;
  const spot=resolveDrop(world,{slot:c.slot,floorOnly:true},p.x,p.y);if(!spot)return c;
  changed=true;return {slot:c.slot,anchor:'floor' as const,pose:'stand' as const,x:spot.x,y:spot.y,...(c.holding?{holding:c.holding}:{})};
 });
 return changed?{...room,characters}:room;
}
