import {OccupantPoseGroup} from './OccupantPoseGroup';
import { HandProp } from './art/PropShape';
import { holdableIds, dispenserFan, type HoldableId } from './art/living';
import { DispenserFanArt } from './art/DispenserFanArt';
import { capabilityOf, visualBox } from "./world";
import { canHold, dropBody, dropWorld, socketsOf } from "./interactions";
import { characterDropRoom, resolveDrop } from "./drop";
import { badgeRule, type BadgeId } from '../badges/engine';
import { HouseCamera, type HouseCameraHandle } from "./HouseCamera";
import { zoomLimits, buildingLayout, roomOrigin } from "./camera";
import { BuildingArt, BuildingTrim, TerraceArt } from "./BuildingArt";
import { stageWidth } from "./stage";
import { useSheetPresence } from "../components/sheetPresence";
import { themeRewards } from './catalog';
import { personFor } from '../personalization/model';
import React, { useCallback, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Modal,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type ViewProps,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import Svg, { Path, Circle } from "react-native-svg";
import { useSharedValue } from "react-native-reanimated";
import { ReefFish, stickerNames } from "../arcade/Art";
import { stickerIds } from "../arcade/progress";
import { useReducedMotion } from "../components/motion";
import { useSounds } from "../components/Audio";
import { useStore } from "../state/Store";
import { CrabCompanion } from "./CrabCompanion";
import { MoreItemArt, RoomShellArt } from "./art/More";
import { moreCatalog, roomIds, roomNames, tintIds, tintPalette } from "./catalogMore";
import { ItemArt } from "./art/Items";
import { RoomArt, SkyArt, ShoreArt, floorColors, wallColors } from "./art/Room";
import { floorThemes, furnitureIds, decorSpec, itemSpec, wallThemes, type ItemId } from "./catalog";
import {
  anchors,
  currentRoom,
  MAX_INSTANCES,
  dimensions,
  homeReducer,
  instance,
  owns,
  validPlacement,
  type Character,
  type HomeAction,
  type Instance,
  type Ownership,
  type Pose,
  type RoomState,
} from "./model";
import { LockBadge, LockRule } from '../personalization/LockBadge';
import { trackLabels, badgeInfo } from '../badges/engine';
import { sceneItemDepth, characterHand, furnitureDepth, characterFrame, characterDepth, characterPoint, itemPoint, itemSize, spotFromPoint, stackSpot, stackActionLabel, stackedHitWidth, surfacePoint, characterSize, seatAnchor } from "./geometry";
import { useHomeStore } from "./useHomeStore";
import { Drag, MotionLink, Footprint, emptyPreview, TrayGhost, type DragConfig } from "./Drag";

const categoryNames: Record<string, string> = { "beds-seats": "Beds & seats", "tables-storage": "Tables & storage", kitchen: "Kitchen", "plants-nature": "Plants", lights: "Lights", "toys-fun": "Toys", "rugs-floor": "Rugs", "wall-art": "Wall art" };
const DecorArt=React.memo(function DecorArt({ item, tint, ...props }: React.ComponentProps<typeof ItemArt> & { tint?: import("./catalogMore").TintId }) {
  if (moreCatalog[item]) return <MoreItemArt id={item} tint={tint} {...props} rotation={props.rotation as import("./model").Rotation | undefined} />;
  return <ItemArt item={item} tint={tint} {...props} />;
});

export type HomeScreenProps = Ownership & {
  badges?: BadgeId[];
  initialItem?: string;
  renderCharacter?: (slot: Character["slot"], pose: Pose, reaction?:string, size?:number, held?:ReactNode, reduced?:boolean) => ReactNode;
  initialState?: unknown;
  persist?: (state: import("./model").HomeStateV2) => boolean;
  saveStatus?: ReactNode;
};
const ink = "#284F4B";
type IconName = "back" | "undo" | "redo" | "rotate" | "mirror" | "away" | "more" | "down" | "lock" | "design" | "done";
function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, string> = {
    design:"M4 20L7 13L17 3L21 7L11 17ZM7 13L11 17",
    done:"M4 12L10 18L21 5",
    back: "M15 5L8 12L15 19",
    undo: "M8 5L3 10L8 15M3 10H14Q21 10 20 18",
    redo: "M16 5L21 10L16 15M21 10H10Q3 10 4 18",
    rotate: "M5 8A8 8 0 1 1 4 15M5 3V8H10",
    mirror: "M12 3V21M3 6H8V18H3ZM16 6H21V18H16Z",
    away: "M4 9H20V21H4ZM3 4H21V9H3M9 13H15",
    more: "M5 12H5M12 12H12M19 12H19",
    down: "M5 9L12 16L19 9",
    lock: "M7 10V7A5 5 0 0 1 17 7V10M5 10H19V21H5Z",
  };
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" accessible={false}>
      <Path d={paths[name]} stroke={ink} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {name === "more" && [5, 12, 19].map((x) => <Circle key={x} cx={x} cy={12} r={1.4} fill={ink} />)}
    </Svg>
  );
}
function Button({
  label,
  icon,
  onPress,
  selected,
  disabled,
  iconOnly = false,
}: {
  label: string;
  icon?: IconName;
  onPress: () => void;
  selected?: boolean;
  disabled?: boolean;
  iconOnly?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        iconOnly && {width:48,height:48,borderRadius:24,paddingHorizontal:0,justifyContent:"center"},
        selected && styles.chosen,
        { opacity: disabled ? 0.35 : pressed ? 0.7 : 1 },
      ]}
    >
      {icon && <Icon name={icon} />} {!iconOnly && <Text style={styles.label}>{label}</Text>}
    </Pressable>
  );
}
function Placeholder({ pose }: { pose: Pose }) {
  return (
    <Svg width={60} height={92} viewBox="0 0 60 92" accessible={false}>
      <Path d="M14 47Q30 38 46 47L48 69H12Z" fill="#8BBAB1" stroke={ink} strokeWidth={2} />
      <Circle cx={30} cy={24} r={18} fill="#D9B495" stroke={ink} strokeWidth={2} />
      <Circle cx={24} cy={24} r={1.5} fill={ink} />
      <Circle cx={36} cy={24} r={1.5} fill={ink} />
      <Path
        d="M26 32Q30 35 34 32M15 49L9 63M45 49L51 63"
        stroke={ink}
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d={pose === "sit" ? "M20 68L12 76H23M40 68L48 76H37" : "M22 69V85H15M38 69V85H45"}
        stroke="#4A6866"
        strokeWidth={7}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}
type KeyEvent = { nativeEvent: { key: string }; preventDefault: () => void };
/** RN native uses accessibilityActions; web additionally exposes the same operations to a keyboard. */
const keyboard = (handler: (e: KeyEvent) => void): ViewProps =>
  Platform.OS === "web" ? ({ onKeyDown: handler } as ViewProps) : {};
export function HomeScreen({ renderCharacter, badges = [], initialItem, initialState, persist, saveStatus, ...ownership }: HomeScreenProps) {
  const { width, height } = useWindowDimensions();
  const inset = useSafeAreaInsets();
  const app = useStore();
  const sound = useSounds(app.save.settings.sound);
  const reduced = useReducedMotion();
  const store = useHomeStore(ownership, initialState, persist);
  const room = currentRoom(store.state);
  const [mode, setMode] = useState<"play" | "decorate">(initialItem ? "decorate" : "play");
  const [tab, setTab] = useState<string>(themeRewards.some(t=>t.id===initialItem) ? "Room" : "Furniture");
  const [selected, setSelected] = useState<string>();
  const [selectedFriend,setSelectedFriend]=useState<{slot:Character["slot"];roomId:typeof roomIds[number]}>();
  const [placing, setPlacing] = useState<ItemId | undefined>(initialItem && (furnitureIds.includes(initialItem as typeof furnitureIds[number]) || Object.hasOwn(moreCatalog, initialItem)) ? initialItem as ItemId : undefined);
  const [draggedItem, setDraggedItem] = useState<ItemId>();
  const [collapsed, setCollapsed] = useState(false);
  const [menu, setMenu] = useState(false);
  const [roomMenu,setRoomMenu]=useState(false);
  const [savedTick,setSavedTick]=useState(false);
  React.useEffect(()=>{const show=setTimeout(()=>setSavedTick(true),0),hide=setTimeout(()=>setSavedTick(false),1100);return()=>{clearTimeout(show);clearTimeout(hide);};},[store.state]);
  const [stackMenu, setStackMenu] = useState(false);
  const [surfaceMenu, setSurfaceMenu] = useState<string>();
  const [reaction, setReaction] = useState<{slot:number;text:string;item?:Instance}>();
  const [asleep,setAsleep]=useState<number[]>([]);
  React.useEffect(()=>{const reset=setTimeout(()=>setAsleep([]),0),calm=setTimeout(()=>setAsleep(room.characters.filter(c=>c.pose==='lie').map(c=>c.slot)),3000);return()=>{clearTimeout(reset);clearTimeout(calm);};},[room.characters]);
  const reactionTimer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
  React.useEffect(()=>()=>clearTimeout(reactionTimer.current),[]);
  const reactTo=(slot:number,text="♪",item?:Instance)=>{setReaction({slot,text,item});clearTimeout(reactionTimer.current);reactionTimer.current=setTimeout(()=>setReaction(undefined),1200);};
  const [confirm, setConfirm] = useState(false);
  useSheetPresence(confirm || stackMenu || !!surfaceMenu);
  const [hint, setHint] = useState(!app.save.settings.homeNavigationSeen);
  const acknowledgeNavigation = () => { setHint(false); if (!app.save.settings.homeNavigationSeen) app.settings({homeNavigationSeen:true}); };
  const [notice, setNotice] = useState(initialItem ? `Ready: ${initialItem.replaceAll("-", " ")}. Choose a clear spot or room style.` : "");
  const owner = app.save.learning?.active ?? "family", person = personFor(app.save);
  const acknowledge = app.personalize, identityEpoch = app.epoch;
  React.useEffect(() => {
    if (initialItem && person.unseen.includes(initialItem)) acknowledge({unseen:person.unseen.filter(id=>id!==initialItem)}, {learner:owner,epoch:identityEpoch});
  }, [initialItem, person.unseen, acknowledge, owner, identityEpoch]);
  const [origin, setOrigin] = useState({ x: 0, y: 0 });
  const canvas = useRef<View>(null);
  const roomCanvases = useRef<Partial<Record<typeof roomIds[number],View|null>>>({});
  const inventory = useRef<ScrollView>(null), focusedInitialItem = useRef(false);
  const revealInitialItem = (id: string, x: number) => {
    if (id === initialItem && !focusedInitialItem.current) {
      focusedInitialItem.current = true;
      inventory.current?.scrollTo({x:Math.max(0,x-20),animated:false});
    }
  };
  const sequence = useRef(0);
  const preview = useSharedValue(emptyPreview);
  const motion=useSharedValue({id:"",dx:0,dy:0});
  const decorating = mode === "decorate";
  const sideDrawer = decorating && width > height;
  const doubleTray = false;
  const drawerHeight = decorating ? (sideDrawer ? 0 : collapsed ? 48 : 154) : 0;
  const drawerWidth = sideDrawer ? Math.min(330, width * .42) : 0;
  const headerHeight = 64;
  const availableHeight = height - inset.top - inset.bottom - drawerHeight - headerHeight;
  // A portrait viewport shows a life-sized stage and scrolls to its side walls.
  const beach = true;
  const sceneUnits = 740;
  const building = useMemo(()=>buildingLayout(roomIds.length,width/height>1.8),[width,height]);
  const closeWidth = stageWidth({ width, height }, drawerWidth, availableHeight, width>height?560:sceneUnits);
  const limits = zoomLimits(width-drawerWidth, closeWidth, availableHeight, building);
  const [zoom, setZoom] = useState(1);
  const houseCamera = useRef<HouseCameraHandle>(null);
  const effectiveZoom = Math.max(limits.min, Math.min(limits.max, zoom));
  const sceneWidth = closeWidth * effectiveZoom;
  const sceneHeight = sceneWidth * sceneUnits / 800;
  const scale = sceneWidth / 800;
  const target = room.instances.find((i) => i.id === selected);
  const blockers = room.instances.map((i) => {
    const [w, h] = dimensions(i);
    const p = surfacePoint(i);
    return { ...i, w, h, wall: i.layer === "wall", surface: !!decorSpec(i.item).surface, sx: p.x, sy: p.y, radius: itemSize(i) * .42 };
  });
  const config: DragConfig = { motion,preview, origin, scale, blockers, world:dropWorld(room) };
  const feedback = (message: string) => {
    setHint(false);
    setNotice(message);
    store.setMessage(message);
  };
  const dispatch = (action: HomeAction | { type: "undo" | "redo" }, audible = false) => {
    if (action.type !== "undo" && action.type !== "redo") {
      const result = homeReducer(store.state, action as HomeAction, ownership);
      if (result.message) {
        if(decorating)feedback(result.message);
        return;
      }
      if (audible && result.state !== store.state) sound("tap");
    }
    store.dispatch(action);
    setNotice("");
    setHint(false);
  };
  const putOn = (i: Instance, parentId: string, roomId = store.state.current) => {
    const room = store.state.rooms[roomId];
    const parent = room.instances.find(p => p.id === parentId);
    if (parent) {
      const p = surfacePoint(parent), spot = stackSpot(room.instances.filter(other => other.id === parentId || other.on === parentId || other.id === i.id), i, p.x, p.y);
      if (spot) dispatch({ type: "move", id: i.id, ...spot, roomId }, true);
      else feedback("That surface is full.");
    }
  };
  const choose = (id: ItemId) => {
    setDraggedItem(undefined);
    if (!owns(id, ownership)) {
      const spec = itemSpec(id); feedback(spec.badge ? badgeRule(spec.badge as BadgeId) : `Earn it in ${spec.track ?? "Arcade"}.`);
      return;
    }
    if (personFor(app.save).unseen.includes(id)) app.personalize({ unseen: personFor(app.save).unseen.filter(i=>i!==id) }, { learner: app.save.learning?.active ?? "family", epoch: app.epoch });
    setPlacing(id);
    setSelected(undefined);
    setHint(false);
    setNotice("Tap a clear floor spot.");
  };
  const place = (id: ItemId, px: number, py: number, roomId = store.state.current) => {
    const room = store.state.rooms[roomId];
    if (room.instances.length >= MAX_INSTANCES) {
      feedback("Put something away to make room.");
      return;
    }

    const drop=resolveDrop(dropWorld(room),dropBody(instance("",id,0,0)),px/scale,py/scale);
    if(!drop)return;
    const floor=drop.kind==='hand'||drop.kind==='mouth'?resolveDrop({...dropWorld(room),people:[],surfaces:[]},dropBody(instance("",id,0,0)),px/scale,py/scale):drop;
    const spot={x:floor?.x??0,y:floor?.y??0,...(floor?.on?{on:floor.on}:{})};
    let key: string;
    do {
      key = `home-${++sequence.current}`;
    } while (room.instances.some((i) => i.id === key));
    const candidate = { ...instance(key, id, spot.x, spot.y), ...("on" in spot && typeof spot.on === "string" ? { on: spot.on } : {}) };
    if (drop.kind!=='hand' && drop.kind!=='mouth' && !validPlacement(room.instances, candidate)) {

      return;
    }
    dispatch({ type: "place", instance: candidate, roomId,...(drop.kind==='hand'||drop.kind==='mouth'?{target:{slot:drop.slot as Character['slot'],eat:drop.kind==='mouth'}}:{}) }, true);
    setPlacing(undefined);
    setSelected(key);
  };
  const itemAction = (i: Instance, action: string, roomId = store.state.current) => {
    if (roomId !== store.state.current) dispatch({type:"room",room:roomId});
    if (action === "activate") {
      if (decorating) {
        setSelected(i.id);
        if (width > height) setCollapsed(true);
        setPlacing(undefined);
        setHint(false);
      } else {
        if(capabilityOf(i.item).toggle||itemSpec(i.item).interactive&&!capabilityOf(i.item).holdable)dispatch({ type: "toggle", id: i.id, roomId }, true);
        setSelected(i.id);
      }
    } else if (["rotate", "mirror", "put-away"].includes(action))
      dispatch({ type: action as "rotate" | "mirror" | "put-away", id: i.id, roomId }, true);
    else {
      const delta: Record<string, [number, number]> = { left: [-1, 0], right: [1, 0], back: [0, -1], forward: [0, 1] };
      if (delta[action])
        dispatch({ type: "move", id: i.id, x: i.x + delta[action][0], y: i.y + delta[action][1], roomId }, true);
    }
  };
  const switchMode = (next: "play" | "decorate") => {
    setMode(next);
    setSelectedFriend(undefined);
    if (next === "decorate") setCollapsed(false);
    setSelected(undefined);
    setPlacing(undefined);
    setNotice("");
    store.setMessage("");
    preview.value = emptyPreview;
  };
  const measure = useCallback(() => canvas.current?.measureInWindow((x, y) => setOrigin({ x, y })), []);
  // A centered canvas can move without changing its own dimensions. Measure after
  // drawer/mode layout settles, not only on the canvas's size-change event.
  useLayoutEffect(() => {
    const frame = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(frame);
  }, [measure, sceneWidth, sceneHeight, drawerHeight, inset.top, inset.bottom]);
  const placementCommand = (name: string, roomId = store.state.current) => {
    const room = store.state.rooms[roomId];
    if (!placing) return;
    const v = preview.value;
    if (name === "place") {
      const p = itemPoint(instance("", placing, v.x, v.y));
      place(placing, p.x * scale, p.y * scale, roomId);
      return;
    }
    const d: Record<string, [number, number]> = { left: [-1, 0], right: [1, 0], back: [0, -1], forward: [0, 1] };
    if (!d[name]) return;
    const wall = itemSpec(placing).layer === "wall";
    const x = Math.max(0, Math.min(wall ? 15 : 19, v.x + d[name][0])),
      y = Math.max(0, Math.min(wall ? 3 : 11, v.y + d[name][1]));
    const i = instance("", placing, x, y),
      [w, h] = dimensions(i),
      valid = room.instances.length < MAX_INSTANCES && validPlacement(room.instances, i);
    preview.value = { active: true, x, y, w, h, wall, valid };
    store.setMessage(`Column ${x + 1}, row ${y + 1}. ${valid ? "Clear spot." : "Try a clear spot."}`);
  };
  const revealSeat=(roomId:typeof roomIds[number],slot:Character['slot'],itemId?:string,socketId?:string)=>{
    const room=store.state.rooms[roomId],item=room.instances.find(i=>i.id===itemId),socket=item&&socketsOf(item).find(s=>s.id===socketId);
    if(reduced||!item||!socket)return;
    const frame=characterFrame(room,{slot,anchor:'seat',pose:socket.kind,seatId:item.id,socket:{itemId:item.id,socketId:socket.id}}),p=itemPoint(item),box=visualBox(item.item,item.rotation,item.mirrored);
    requestAnimationFrame(()=>houseCamera.current?.reveal(roomIds.indexOf(roomId),{left:Math.min(frame.left,p.x+box.left),top:Math.min(frame.top,p.y+box.top),right:Math.max(frame.left+frame.width,p.x+box.left+box.width),bottom:Math.max(frame.top+frame.height,p.y+box.top+box.height)}));
  };
  const renderEntries = (room: RoomState, roomId: typeof roomIds[number]) => {
  const send = (action: HomeAction, audible = false) => dispatch({...action,roomId},audible);
  const localConfig = {...config, world:dropWorld(room), blockers: room.instances.map(i => { const [w,h]=dimensions(i), p=surfacePoint(i);return {...i,w,h,wall:i.layer==='wall',surface:!!decorSpec(i.item).surface,sx:p.x,sy:p.y,radius:itemSize(i)*.42}; })};
  const seatActions = [
    ...anchors.filter(a => ['hello','window'].includes(a)).map(anchor=>({name:`seat-${anchor}`,label:`Move to ${anchor}`,anchor,socketId:undefined as string|undefined,seatId:undefined as string|undefined})),
    ...room.instances.flatMap(i=>socketsOf(i).map(s=>({name:`socket-${i.id}-${s.id}`,label:`${s.kind} on ${itemSpec(i.item).name}, ${s.id}`,anchor:seatAnchor(i),seatId:i.id,socketId:s.id})))
  ];
  return [
    ...room.instances.filter(i=>!room.characters.some(c=>c.holding===i.id)).map((i) => {
      const p = itemPoint(i, room.instances),
        size = itemSize(i) * scale;
      const hitWidth = stackedHitWidth(i, scale, Math.max(48, size * 0.82));
      const hitHeight = Math.max(i.on ? 44 : 48, size * (i.item === "toy-box" ? 0.58 : i.layer === "ground" ? 0.4 : 0.82));
      const [w, h] = dimensions(i);
      return {
        key: i.id,
        depth: sceneItemDepth(room,i),
        node: (
          <Drag
            testID={`object-${i.id}`}
            pointerEvents={placing || effectiveZoom <= limits.min*1.15 ? "none" : "auto"}
            accessibilityRole="button"
            accessibilityLabel={`${itemSpec(i.item).name}, ${i.state === "active" ? "active" : "resting"}`}
            accessibilityHint={
              decorating ? "Drag to move. Arrow keys move; R rotates, M mirrors, Delete puts away." : "Tap to play."
            }
            accessibilityActions={
              decorating
                ? [
                    { name: "activate", label: "Select" },
                    ...(room.instances.some(child=>child.on===i.id)?[{name:"choose-items",label:`Choose items on ${itemSpec(i.item).name}`}]:[]),
                    ...["left", "right", "back", "forward", "rotate", "mirror", "put-away"].map((name) => ({
                      name,
                      label: name.replace("-", " "),
                    })),
                    ...(decorSpec(i.item).small ? room.instances.filter(parent => !parent.on && decorSpec(parent.item).surface).map(parent => ({ name: `stack:${parent.id}`, label: stackActionLabel(parent, room.instances) })) : []),
                  ]
                : [{name:"activate",label:"Select or use"},...(room.instances.some(child=>child.on===i.id)?[{name:"choose-items",label:`Choose items on ${itemSpec(i.item).name}`}]:[]),...["left","right","back","forward"].map(name=>({name,label:`Move ${name}`}))]
            }
            onAccessibilityAction={(e) => {
              const name=e.nativeEvent.actionName;
              if(name==='choose-items'){dispatch({type:'room',room:roomId});setSurfaceMenu(i.id);}
              else if(name.startsWith('stack:'))putOn(i,name.slice(6),roomId);
              else itemAction(i,name,roomId);
            }}
            {...keyboard((e) => {
              const names: Record<string, string> = {
                ArrowLeft: "left",
                ArrowRight: "right",
                ArrowUp: "back",
                ArrowDown: "forward",
                r: "rotate",
                m: "mirror",
                Delete: "put-away",
                Backspace: "put-away",
                Enter: "activate",
                " ": "activate",
              };
              const name = names[e.nativeEvent.key];
              if (name && (decorating || ["activate","left","right","back","forward"].includes(name))) {
                e.preventDefault();
                itemAction(i, name, roomId);
              }
            })}
            enabled={decorating || capabilityOf(i.item).moveInPlay}
            reduced={reduced}
            config={{ ...localConfig, grouped:room.characters.some(c=>c.socket?.itemId===i.id||c.seatId===i.id),subject:{...dropBody(i),edible:i.empty?undefined:dropBody(i).edible}, foot: p, layer: i.layer, footprint: { w, h, wall: i.layer === "wall", id: i.id, small: !!decorSpec(i.item).small } }}
            onStart={() => {
              dispatch({type:"room",room:roomId});
              setDraggedItem(undefined);
              setSelected(undefined);
              setPlacing(undefined);
              setHint(false);
              setNotice("");
            }}
            onTap={() => {
              if (placing) return;
              if(selectedFriend){
                const world=dropWorld(room),socket=world.sockets.find(s=>!!s.pet===(selectedFriend.slot===2)&&s.itemId===i.id&&(s.occupied===undefined||s.occupied===selectedFriend.slot));
                const d=resolveDrop(world,{slot:selectedFriend.slot},socket?.x??p.x,socket?.y??p.y);
                if(d){if(selectedFriend.roomId===roomId)send(d.kind==='socket'?{type:'character',slot:selectedFriend.slot,anchor:'seat',seatId:d.itemId,socketId:d.socketId}:{type:'character',slot:selectedFriend.slot,anchor:'floor',x:d.x,y:d.y},true);else dispatch({type:'transfer',roomId:selectedFriend.roomId,room:roomId,slot:selectedFriend.slot,x:d.x,y:d.y,seatId:d.itemId,socketId:d.socketId},true);}
                if(d?.kind==='socket')revealSeat(roomId,selectedFriend.slot,d.itemId,d.socketId);
                setSelectedFriend(undefined);return;
              }
              if (capabilityOf(i.item).dispenses?.length) itemAction(i,'activate',roomId);
              else if (room.instances.some(child => child.on === i.id)) {dispatch({type:"room",room:roomId});setSurfaceMenu(i.id);}
              else itemAction(i, "activate", roomId);
            }}
            onDrop={(_x, _y, dx, dy) => {
              const drop=resolveDrop(dropWorld(room),{...dropBody(i),edible:i.empty?undefined:dropBody(i).edible},p.x+dx/scale,p.y+dy/scale);
              if(!drop)return;
              if(drop.kind==='hand'||drop.kind==='mouth'){
                send({type:'use-item',id:i.id,slot:drop.slot as Character['slot'],eat:drop.kind==='mouth'},true);
                if(drop.kind==='mouth')reactTo(drop.slot!,capabilityOf(i.item).edible==='drink'?"Sip ♡":"Yum ♡",i);
              } else send({type:'move',id:i.id,x:drop.x,y:drop.y,...(drop.on?{on:drop.on}:{})},true);
              setSelected(i.id);
            }}
            style={{
              position: "absolute",
              left: p.x * scale - hitWidth / 2,
              top: p.y * scale - size * 0.85 + size - hitHeight,
              width: hitWidth,
              height: hitHeight,
              borderWidth: roomId === store.state.current && selected === i.id ? 2 : 0,
              borderColor: "#397C6C",
              borderRadius: 18,
            }}
          >
            <View
              pointerEvents="none"
              style={{ position: "absolute", left: (hitWidth - size) / 2, top: hitHeight - size }}
            >
              <DecorArt
                item={i.item}
                size={size}
                layer={capabilityOf(i.item).sockets?.length && room.characters.some(c=>c.socket?.itemId===i.id || c.seatId===i.id)?"back":"all"}
                state={{on:i.powered ?? i.state === "active",empty:i.empty}}
                active={i.powered ?? i.state === "active"}
                animated={roomId===store.state.current && i.state=== "active" && !room.characters.some(c=>c.socket?.itemId===i.id || c.seatId===i.id)}
                reduced={reduced}
                mirrored={i.mirrored}
                tint={i.tint}
                rotation={i.rotation}
              />
            </View>
          </Drag>
        ),
      };
    }),
    ...room.instances.filter(i=>capabilityOf(i.item).sockets?.length && room.characters.some(c=>c.socket?.itemId===i.id||c.seatId===i.id)).map(i=>{
      const p=itemPoint(i),size=itemSize(i)*scale;
      return {key:`seat-front-${i.id}`,depth:furnitureDepth(i)+2,node:<MotionLink motion={motion} owner={i.id}><View pointerEvents="none" style={{position:'absolute',left:p.x*scale-size/2,top:p.y*scale-size*.85}}><DecorArt item={i.item} size={size} tint={i.tint} mirrored={i.mirrored} rotation={i.rotation} layer="front"/></View></MotionLink>};
    }),
    ...room.characters.map((c) => {
      const p=characterPoint(room,c),size=characterSize(c.slot)*scale;
      const action=reaction?.slot===c.slot?(reaction.text.startsWith('Yum')?'eat':reaction.text.startsWith('Sip')?'drink':c.pose==='stand'?'wave':undefined):c.pose==='lie'&&asleep.includes(c.slot)?'lie-asleep':c.holding&&c.pose==='stand'?'hold':undefined;
      const frame=characterFrame(room,c,action);
      return {
        key: `character-${c.slot}-${c.pose}`,
        depth: characterDepth(room, c)+(c.slot===2&&c.socket?.socketId.startsWith('pet-')?2:0),
        node: (
          <MotionLink motion={motion} owner={c.socket?.itemId??c.seatId}><Drag
            testID={`character-${c.slot}`}
            pointerEvents={placing || effectiveZoom<=limits.min*1.15 ? "none" : "auto"}
            accessibilityRole="button"
            accessibilityLabel={["Islander", "Pip", "Poko"][c.slot] + `, ${c.pose}`}
            accessibilityHint="Drag to furniture or the floor. Tap then choose a destination. Arrow keys move; S cycles seats."
            accessibilityActions={[
              ...seatActions,
              ...["left", "right", "back", "forward"].map((name) => ({ name, label: `Move ${name}` })),
            ]}
            onAccessibilityAction={(e) => {
              const a = seatActions.find(a => a.name === e.nativeEvent.actionName);
              if (a) send({ type: "character", slot: c.slot, anchor: a.anchor, ...(a.seatId ? { seatId: a.seatId,socketId:a.socketId } : {}) }, true);
              const deltas: Record<string, [number, number]> = {
                left: [-37.5, 0],
                right: [37.5, 0],
                back: [-1.5, -14.4],
                forward: [1.5, 14.4],
              };
              const d = deltas[e.nativeEvent.actionName];
              if (d)
                send(
                  {
                    type: "character",
                    slot: c.slot,
                    anchor: "floor",
                    ...spotFromPoint(p.x + d[0], p.y + d[1], 1, false)!,
                  },
                  true
                );
            }}
            {...keyboard((e) => {
              const k = e.nativeEvent.key;
              const deltas: Record<string, [number, number]> = {
                ArrowLeft: [-37.5, 0],
                ArrowRight: [37.5, 0],
                ArrowUp: [-1.5, -14.4],
                ArrowDown: [1.5, 14.4],
              };
              if (deltas[k]) {
                e.preventDefault();
                send(
                  {
                    type: "character",
                    slot: c.slot,
                    anchor: "floor",
                    ...spotFromPoint(p.x + deltas[k][0], p.y + deltas[k][1], 1, false)!,
                  },
                  true
                );
              }
              if (k === "s" || k === "Enter") {
                e.preventDefault();
                const index = seatActions.findIndex(a => c.seatId ? a.seatId === c.seatId : a.anchor === c.anchor);
                const next = seatActions[(index + 1) % seatActions.length];
                send({ type: "character", slot: c.slot, anchor: next.anchor, ...(next.seatId ? { seatId: next.seatId,socketId:next.socketId } : {}) }, true);
              }
            })}
            enabled={effectiveZoom>limits.min*1.15}
            reduced={reduced}
            config={{ ...localConfig, subject:{slot:c.slot},center:{x:frame.left+frame.width/2,y:frame.top+frame.height/2},rooms:roomIds.map((id,index)=>({id,origin:roomOrigin(index,building),world:dropWorld(store.state.rooms[id])})),sourceOrigin:roomOrigin(roomIds.indexOf(roomId),building),foot: p }}
            onTap={() => {
              setHint(false);
              if(selected && room.instances.some(i=>i.id===selected&&canHold(i))){
                const held=room.instances.find(i=>i.id===selected)!;
                send({type:'use-item',id:held.id,slot:c.slot,eat:!!capabilityOf(held.item).edible&&!held.empty},true);if(capabilityOf(held.item).edible&&!held.empty)reactTo(c.slot,capabilityOf(held.item).edible==='drink'?'Sip ♡':'Yum ♡',held);setSelected(undefined);
              } else reactTo(c.slot,c.slot===2?"Clack clack ♡":"♡");
              setSelectedFriend({slot:c.slot,roomId});
            }}
            onStart={() => {
              dispatch({type:"room",room:roomId});
              setHint(false);
              setSelected(undefined);
              setNotice("");
            }}
            onDrop={(pointerX,pointerY,dx,dy)=>roomCanvases.current[roomId]?.measureInWindow((ox,oy)=>{
              const source=roomOrigin(roomIds.indexOf(roomId),building),foot={x:source.x+p.x+dx/scale,y:source.y+p.y+dy/scale};
              const contacts=[{x:source.x+(pointerX-ox)/scale,y:source.y+(pointerY-oy)/scale},{x:source.x+frame.left+frame.width/2+dx/scale,y:source.y+frame.top+frame.height/2+dy/scale}];
              const destination=characterDropRoom(roomIds.map((id,index)=>({id,origin:roomOrigin(index,building),world:dropWorld(store.state.rooms[id])})),c.slot,[...contacts,foot])?.id;
              if(!destination)return;const target=roomOrigin(roomIds.indexOf(destination),building);
              const drop=resolveDrop(dropWorld(store.state.rooms[destination]),{slot:c.slot},foot.x-target.x,foot.y-target.y,contacts.map(q=>({x:q.x-target.x,y:q.y-target.y})));
              if(!drop)return;
              if(destination!==roomId)send({type:'transfer',slot:c.slot,room:destination,x:drop.x,y:drop.y,seatId:drop.itemId,socketId:drop.socketId},true);
              else send(drop.kind==='socket'?{type:'character',slot:c.slot,anchor:'seat',seatId:drop.itemId,socketId:drop.socketId}:{type:'character',slot:c.slot,anchor:'floor',x:drop.x,y:drop.y},true);
              if(drop.kind==='socket')revealSeat(destination,c.slot,drop.itemId,drop.socketId);
            })}

            style={{
              position: "absolute",
              left:frame.left*scale,top:frame.top*scale,width:Math.max(44,frame.width*scale),height:Math.max(44,frame.height*scale),
              borderRadius:30,borderWidth:selectedFriend?.slot===c.slot&&selectedFriend.roomId===roomId?2:0,borderColor:'#397C6C',
            }}
          >
            <OccupantPoseGroup key={c.pose} width={frame.width*scale} height={frame.height*scale} mirrored={frame.mirrored} reduced={reduced}>
              {renderCharacter?.(c.slot,c.pose,action,characterSize(c.slot)*scale,(()=>{const held=reaction?.slot===c.slot&&reaction.item?reaction.item:room.instances.find(i=>i.id===c.holding);return held?(holdableIds.includes(held.item as HoldableId)?<HandProp id={held.item as HoldableId} state={{empty:held.empty,on:held.powered}} tint={held.tint}/>:<DecorArt item={held.item} size={24}/>):undefined;})(),reduced) ?? (c.slot===0?<View style={{transform:[{scale:size/92}]}}><Placeholder pose={c.pose}/></View>:c.slot===1?<ReefFish size={size}/>:<CrabCompanion pose={c.pose==='lie'?'lie':c.pose==='stand'?'stand':'sit'} size={size} reduced={reduced} clacking={reaction?.slot===2}/>)}
            </OccupantPoseGroup>
            {asleep.includes(c.slot)&&c.pose==='lie'&&<Text pointerEvents="none" style={{position:'absolute',top:0,right:5,color:ink,fontSize:22}}>z</Text>}
            {reaction?.slot===c.slot && <Text pointerEvents="none" style={{position:'absolute',top:-25,left:0,right:0,textAlign:'center',fontSize:24,color:ink}}>{reaction.text}</Text>}
            {c.holding && (()=>{const held=room.instances.find(i=>i.id===c.holding);if(!held)return null;const hand=c.slot===0?characterHand(room,c,action):{x:p.x+30,y:p.y-40};return <Drag testID={`held-${c.slot}`} accessibilityRole="button" accessibilityLabel={`Put down ${itemSpec(held.item).name}`} enabled reduced={reduced} config={{...localConfig,foot:hand,subject:dropBody(held)}} onTap={()=>send({type:'release-held',slot:c.slot,x:c.x??10,y:c.y??8},true)} onDrop={(_x,_y,dx,dy)=>{const row=(hand.y+dy/scale-386)/14.4;send({type:'release-held',slot:c.slot,x:(hand.x+dx/scale-43-row*1.5)/37.5,y:row},true);}} style={{position:'absolute',left:(hand.x-frame.left)*scale-22,top:(hand.y-frame.top)*scale-22,width:44,height:44}}>{c.slot!==0&&<DecorArt item={held.item} size={44}/>}</Drag>;})()}
          </Drag></MotionLink>
        ),
      };
    }),
  ].sort((a, b) => a.depth - b.depth);
  };
  const toolbarPoint = target ? itemPoint(target, room.instances) : undefined;
  const toolbarTop = sideDrawer ? inset.top + headerHeight + 52 : height-inset.bottom-drawerHeight-120;

  const thumbnail = (id: ItemId, label: string) => {
    const owned = owns(id, ownership),
      spec = itemSpec(id),
      [w, h] = dimensions(instance("", id, 0, 0));
    return (
      <Drag
        key={id}
        testID={`inventory-${id}`}
        onLayout={e => revealInitialItem(id, e.nativeEvent.layout.x)}
        accessibilityRole="button"
        accessibilityLabel={`${label}${owned ? "" : `, locked, ${spec.badge ? badgeRule(spec.badge as BadgeId) : "Earn it in Arcade"}`}`}
        accessibilityHint="Drag upward into the room, or select then tap the floor."
        accessibilityActions={[{ name: "activate", label: "Choose" }]}
        onAccessibilityAction={() => choose(id)}
        {...keyboard((e) => {
          if (e.nativeEvent.key === "Enter" || e.nativeEvent.key === " ") {
            e.preventDefault();
            choose(id);
          }
        })}
        tray
        enabled={owned}
        reduced={reduced}
        config={{ ...config, subject:dropBody(instance("",id,0,0)),layer: spec.layer, footprint: { w, h, wall: spec.layer === "wall", id: "", small: !!decorSpec(id).small } }}
        onStart={() => {
          setDraggedItem(id);
          setPlacing(undefined);
          setSelected(undefined);
          setHint(false);
          setNotice("");
        }}
        onTap={() => choose(id)}
        onDrop={(x, y) => canvas.current?.measureInWindow((ox,oy)=>place(id,x-ox,y-oy))}
        style={{
          width: 88,
          height: 94,
          alignItems: "center",
          borderWidth: placing === id ? 2 : 0,
          borderColor: ink,
          borderRadius: 14,
          backgroundColor: "#FFF8E9",
        }}
      >
        <View pointerEvents="none" style={{ opacity: owned ? 1 : 0.3 }}>
          <DecorArt item={id} size={62} muted={!owned} />
        </View>
        <Text numberOfLines={1} style={styles.thumbLabel}>
          {label}
        </Text>
        {!owned && <Text numberOfLines={1} style={{fontSize:11, paddingHorizontal:6, color:ink}}>{spec.badge ? trackLabels[badgeInfo(spec.badge as BadgeId).track] : spec.track ?? "Arcade"}</Text>}
        {owned && personFor(app.save).unseen.includes(id) && <Text style={styles.meta}>New</Text>}
        {!owned && <LockBadge/>}
      </Drag>
    );
  };
  const trayItems = [...furnitureIds, ...Object.keys(moreCatalog)].filter(id => tab === "Furniture" || decorSpec(id).category === tab);
  const trayColumns = Array.from({ length: Math.ceil(trayItems.length / (sideDrawer ? 2 : 1)) }, (_, index) => trayItems.slice(index * (sideDrawer ? 2 : 1), (index + 1) * (sideDrawer ? 2 : 1)));
  return (
    <View style={styles.page}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}><SkyArt /></View>
      <Text accessibilityLiveRegion="polite" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden" }}>
        {decorating ? store.message : ""}
      </Text>
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingTop: inset.top + headerHeight,
          paddingBottom: inset.bottom + drawerHeight,
          paddingRight: drawerWidth,
        }}
      >
        <HouseCamera focusXs={roomIds.map(id=>{const hero=store.state.rooms[id].instances.find(i=>i.item===({home:'bed',kitchen:'fridge',treehouse:'hammock',beach:'lounger'}[id]));return hero?itemPoint(hero).x+(id==='home'?72:id==='treehouse'?70:id==='beach'?-110:40):400;})} cameraRef={houseCamera} initialIndex={roomIds.indexOf(store.state.current)} width={width-drawerWidth} height={Math.max(0,availableHeight)} building={building} scale={scale} zoom={effectiveZoom} minZoom={limits.min} maxZoom={limits.max} reduced={reduced} onNavigate={acknowledgeNavigation} onZoom={setZoom} onRoom={index=>{dispatch({type:'room',room:roomIds[index]});if(roomIds[index]!==store.state.current){setSelected(undefined);setPlacing(undefined);}requestAnimationFrame(measure);setTimeout(measure,reduced?0:280);}}>
        <View pointerEvents="none" style={StyleSheet.absoluteFill}><BuildingArt building={building}/></View>
        {/* Event callbacks below read placement refs only on input, never while building scenes. */}
        {/* eslint-disable-next-line react-hooks/refs */}
        {roomIds.map((roomId,index)=>{const room=store.state.rooms[roomId];return (
        <View key={roomId} ref={node=>{roomCanvases.current[roomId]=node;if(roomId===store.state.current)canvas.current=node;}} onLayout={measure} testID={`home-scene-${roomId}`} style={{ position:"absolute", left:roomOrigin(index,building).x*scale, top:roomOrigin(index,building).y*scale, width: sceneWidth, height: sceneHeight }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${roomNames[roomId]} floor`}
            accessibilityHint={
              placing
                ? "Tap to place the selected item. Arrow keys change spot and Enter places."
                : "Tap to enter this room. Double-tap to switch between the room and whole house."
            }
            accessibilityActions={[
              ...["left", "right", "back", "forward"].map((name) => ({ name, label: `Move placement ${name}` })),
              { name: "place", label: "Place selected item" },
            ]}
            onAccessibilityAction={(e) => placementCommand(e.nativeEvent.actionName,roomId)}
            {...keyboard((e) => {
              const names: Record<string, string> = {
                ArrowLeft: "left",
                ArrowRight: "right",
                ArrowUp: "back",
                ArrowDown: "forward",
                Enter: "place",
              };
              const name = names[e.nativeEvent.key];
              if (placing && name) {
                e.preventDefault();
                placementCommand(name,roomId);
              }
            })}
            onPress={(e) => {
              if (!placing) {
                if(selectedFriend){
                  const {pageX,pageY}=e.nativeEvent;
                  roomCanvases.current[roomId]?.measureInWindow((x,y)=>{const d=resolveDrop(dropWorld(room),{slot:selectedFriend.slot},(pageX-x)/scale,(pageY-y)/scale);if(!d)return;if(selectedFriend.roomId!==roomId)dispatch({type:'transfer',slot:selectedFriend.slot,roomId:selectedFriend.roomId,room:roomId,x:d.x,y:d.y},true);else dispatch(d.kind==='socket'?{type:'character',slot:selectedFriend.slot,roomId,anchor:'seat',seatId:d.itemId,socketId:d.socketId}:{type:'character',slot:selectedFriend.slot,roomId,anchor:'floor',x:d.x,y:d.y},true);});setSelectedFriend(undefined);return;
                }
                if(selected && room.instances.some(i=>i.id===selected&&canHold(i))){
                  const target=room.instances.find(i=>i.id===selected)!;
                  const {pageX,pageY}=e.nativeEvent;
                  roomCanvases.current[roomId]?.measureInWindow((x,y)=>{const d=resolveDrop(dropWorld(room),dropBody(target),(pageX-x)/scale,(pageY-y)/scale);if(d)dispatch({type:'move',id:target.id,x:d.x,y:d.y,roomId},true);});setSelected(undefined);return;
                }
                houseCamera.current?.tap(index);
                setSelected(undefined);
                return;
              }
              const { pageX, pageY } = e.nativeEvent;
              roomCanvases.current[roomId]?.measureInWindow((x, y) => place(placing, pageX - x, pageY - y, roomId));
            }}
            style={StyleSheet.absoluteFill}
          >
            <View pointerEvents="box-none" style={{ position: "absolute", width: sceneWidth, height: scale * 560 }}>
              {roomId === "home" ? <RoomArt
                theme={room.theme}
                badges={badges}
                onBadgePress={badge => {if(houseCamera.current?.canActivate())router.push({ pathname:"/badges", params:{badge} });}}
                reduced={reduced}
              /> : <RoomShellArt room={roomId} theme={room.theme} />}
            </View>
          </Pressable>
          {beach && <View pointerEvents="none" style={{ position: "absolute", top: 525 * scale, width: sceneWidth, height: 215 * scale }}>{Math.floor(index/building.columns)===0 ? <ShoreArt depth={215} /> : <TerraceArt/>}</View>}

          <View pointerEvents="none" style={{position:'absolute',left:0,top:0,width:sceneWidth,height:sceneHeight}}>
            {effectiveZoom<=limits.min*1.15 && <Text style={{position:'absolute',top:12*scale,left:24*scale,fontSize:Math.max(11,24*scale),color:'#385451',fontWeight:'700'}}>{roomNames[roomId]}</Text>}
            {index % building.columns < building.columns-1 && <><View style={{position:'absolute',right:0,top:0,width:8*scale,height:360*scale,backgroundColor:'#C29369'}}/><View style={{position:'absolute',right:0,top:360*scale,width:70*scale,height:170*scale,borderWidth:5*scale,borderBottomWidth:0,borderColor:'#C29369',borderRadius:20*scale,backgroundColor:'#C5DED344'}}/></>}
          </View>
          <View pointerEvents="box-none" style={{position:"absolute",left:8*scale,top:8*scale,width:784*scale,height:544*scale,overflow:"hidden"}}><View pointerEvents="box-none" style={{position:"absolute",left:-8*scale,top:-8*scale,width:sceneWidth,height:560*scale}}>{renderEntries(room,roomId).map((entry) => (
            <React.Fragment key={entry.key}>{entry.node}</React.Fragment>
          ))}</View></View>

          {roomId===store.state.current && draggedItem && (
            <TrayGhost preview={preview} scale={scale} size={itemSize(instance("", draggedItem, 0, 0)) * scale}>
              <DecorArt item={draggedItem} size={itemSize(instance("", draggedItem, 0, 0)) * scale} />
            </TrayGhost>
          )}

        </View>
        );})}
        <Footprint preview={preview} scale={scale} width={building.width*scale} height={building.height*scale} offset={roomOrigin(roomIds.indexOf(store.state.current),building)}/>
        <View pointerEvents="none" style={StyleSheet.absoluteFill}><BuildingTrim building={building}/></View>
        </HouseCamera>
      </View>
          {room.instances.filter(source=>source.id===selected).map(source=>{const roomId=store.state.current;
            const state={on:source.powered??source.state==='active'},fan=dispenserFan(source.item,state);if(!fan.length)return null;
            const p=itemPoint(source),fanScale=1,fanWidth=224*fanScale,height=120*fanScale;
            const left=(width-fanWidth)/2,top=inset.top+headerHeight+8;
            const take=(id:ItemId,x:number,y:number)=>{
              const created=instance(`food-${Date.now().toString(36)}-${++sequence.current}`,id,0,0),drop=resolveDrop(dropWorld(room),dropBody(created),x,y);
              dispatch({type:'dispense',source:source.id,item:id,id:created.id,x,y,roomId});
              if(drop?.kind==='mouth')reactTo(drop.slot!,capabilityOf(id).edible==='drink'?'Sip ♡':'Yum ♡',created);
            };
            return <View key={`fan-${source.id}`} pointerEvents="box-none" style={{position:'absolute',left,top,width:fanWidth,height}}>
              <View pointerEvents="none"><DispenserFanArt item={source.item} state={state}/></View>
              {fan.map(entry=><Drag key={entry.item} testID={`dispense-${entry.item}`} accessibilityRole="button" accessibilityLabel={`Take ${itemSpec(entry.item).name}`} enabled reduced={reduced} tray config={{...config,world:dropWorld(room),subject:dropBody(instance('',entry.item,0,0))}} onTap={()=>{const person=selectedFriend&&room.characters.find(c=>c.slot===selectedFriend.slot),target=person&&dropWorld(room).people.find(c=>c.slot===person.slot);take(entry.item,target?.handX??p.x,target?.handY??p.y);}} onDrop={(x,y)=>roomCanvases.current[roomId]?.measureInWindow((ox,oy)=>take(entry.item,(x-ox)/scale,(y-oy)/scale))} style={{position:'absolute',left:(112+entry.x-24)*fanScale,top:(120+entry.y-24)*fanScale,width:48*fanScale,height:48*fanScale}}><View/></Drag>)}
            </View>;
          })}

          {decorating && target && toolbarPoint && (
            <View
              testID="object-toolbar"

              style={[
                styles.toolbar,
                { flexDirection: "column", alignItems: "center", maxWidth: sideDrawer ? drawerWidth - 16 : width - 16 },
                {
                  position: "absolute",
                  left: sideDrawer ? width - drawerWidth + 8 : 8,
                  top: toolbarTop,
                  zIndex: 20,
                },
              ]}
            >
              <View style={{ flexDirection: "row" }}>
              <Button
                label="Rotate"
                icon="rotate"
                disabled={itemSpec(target.item).rotations.length < 2}
                onPress={() => dispatch({ type: "rotate", id: target.id }, true)}
              />
              <Button
                label="Mirror"
                icon="mirror"
                disabled={!itemSpec(target.item).mirror}
                onPress={() => dispatch({ type: "mirror", id: target.id }, true)}
              />
              <Button
                label="Put away"
                icon="away"
                onPress={() => {
                  dispatch({ type: "put-away", id: target.id }, true);
                  setSelected(undefined);
                }}
              />
              </View>
              {(decorSpec(target.item).tintable || decorSpec(target.item).small) && <View style={{ flexDirection: "row", alignItems: "center" }}>
              {decorSpec(target.item).tintable && <ScrollView horizontal style={{ width: decorSpec(target.item).small ? 170 : 250, maxHeight: 48 }} showsHorizontalScrollIndicator={false}>
                {tintIds.map(tint => <Pressable key={tint} accessibilityRole="button" accessibilityLabel={`${tint} colour`} accessibilityState={{ selected: (target.tint ?? "original") === tint }} onPress={() => dispatch({ type: "tint", id: target.id, tint })} style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}><View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: tintPalette[tint] ?? "#E9D7B8", borderColor: ink, borderWidth: (target.tint ?? "original") === tint ? 3 : 1 }}>{tint === "original" && <Text style={{textAlign:"center",color:ink}}>↺</Text>}</View></Pressable>)}
              </ScrollView>}
              {decorSpec(target.item).small && <Button label="Put on…" onPress={() => setStackMenu(!stackMenu)} />}
              </View>}
            </View>
          )}
      {roomMenu && <View style={{position:'absolute',top:inset.top+62,left:64,zIndex:30,padding:8,borderRadius:20,backgroundColor:'#FFF8E9',gap:4}}>
        {roomIds.map(id=><Button key={id} label={selectedFriend?`Move friend to ${roomNames[id]}`:roomNames[id]} selected={id===store.state.current} onPress={()=>{if(selectedFriend && selectedFriend.roomId!==id)dispatch({type:'transfer',slot:selectedFriend.slot,roomId:selectedFriend.roomId,room:id,x:8,y:8},true);houseCamera.current?.jump(roomIds.indexOf(id));setRoomMenu(false);setSelected(undefined);setSelectedFriend(undefined);}}/>)}
        <Button label={effectiveZoom>limits.min*1.15?'Whole house':'Close up'} onPress={()=>{houseCamera.current?.zoomRoom(roomIds.indexOf(store.state.current));setRoomMenu(false);}}/>
      </View>}
      <View
        pointerEvents="box-none"
        style={[styles.chrome, { top: inset.top + 8, left: inset.left + 8, right: inset.right + 8 }]}
      >
        <Button
          label="Back"
          icon="back"
          iconOnly
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
        />
        <Button label={roomNames[store.state.current]} icon="down" onPress={()=>setRoomMenu(!roomMenu)}/>
        <Button label={decorating?"Finish Design":"Design"} icon={decorating?"done":"design"} iconOnly selected={decorating} onPress={()=>switchMode(decorating?"play":"decorate")}/>
        <Button label="Undo" icon="undo" iconOnly disabled={!store.canUndo} onPress={()=>{dispatch({type:'undo'});setSelected(undefined);}}/>
        <Button label="More" icon="more" iconOnly onPress={() => setMenu(!menu)} />
      </View>
      {(menu || app.error) && !!saveStatus && <View pointerEvents="box-none" style={{ position: "absolute", top: inset.top + 112, left: 8, zIndex: 12, maxWidth: width - 16 }}>{saveStatus}</View>}
      {savedTick && !app.saving && !app.error && <Text pointerEvents="none" accessibilityLabel="Saved" style={{position:'absolute',right:12,top:inset.top+60,color:ink,fontSize:16}}>✓</Text>}
      {((!decorating && hint) || (decorating && notice && !notice.startsWith("Earn"))) && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss hint"
          onPress={() => {
            acknowledgeNavigation();
            setNotice("");
          }}
          style={[
            styles.hint,
            { left: 12, right: 12, bottom: inset.bottom + drawerHeight + 12, maxWidth: undefined },
          ]}
        >
          <Text style={styles.hintText}>{(decorating ? notice : "") || "Move anything. Swipe to explore. Pinch or double-tap a room to zoom."}</Text>
        </Pressable>
      )}
      {menu && (
        <View style={[styles.menu, { top: inset.top + 60, right: inset.right + 8 }]}>
          <Text style={styles.meta}>{persist ? "Your room saves on this device." : "Home stays for this visit."}</Text>
          {!!person.unseen.length && <Button label="Mark all seen" onPress={() => app.personalize({unseen:[]}, {learner:owner,epoch:app.epoch})} />}
          <Button label="Find my friends" onPress={() => {dispatch({type:'find-friends'});setMenu(false);requestAnimationFrame(()=>houseCamera.current?.reveal(roomIds.indexOf(store.state.current),{left:330,top:275,right:560,bottom:540},true));}} />
          <Button label="My badges" onPress={() => router.push("/badges")} />
          <Button
            label="Reset room"
            onPress={() => {
              setMenu(false);
              setConfirm(true);
            }}
          />
        </View>
      )}
      {decorating && (
        <View style={[styles.drawer, sideDrawer ? { top: inset.top + headerHeight, left: width - drawerWidth, right: 0, bottom: 0, height: height - inset.top - headerHeight, paddingBottom: inset.bottom } : { height: drawerHeight + inset.bottom, paddingBottom: inset.bottom }]}>
          <View style={styles.tabs}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {["Furniture", ...Object.keys(categoryNames), "Stickers", "Room"].map((t) => (
              <Button
                key={t}
                label={categoryNames[t] ?? t}
                selected={t === tab}
                onPress={() => {
                  setTab(t);
                  setCollapsed(false);
                }}
              />
            ))}
            </ScrollView>
            <Button
              label={collapsed ? "Open drawer" : "Collapse drawer"}
              icon="down"
              iconOnly
              onPress={() => setCollapsed(!collapsed)}
            />
          </View>
          {!collapsed && notice.startsWith("Earn") && <LockRule>{notice}</LockRule>}
          {!collapsed && tab !== "Room" && tab !== "Stickers" && <FlatList key={`${tab}-${sideDrawer}`} horizontal={!sideDrawer} style={{ height: sideDrawer?Math.max(100,height-headerHeight-60):100, flexGrow: 0 }} data={trayColumns} initialScrollIndex={Math.max(0, Math.floor(trayItems.indexOf(initialItem ?? "") / (doubleTray ? 2 : 1)))} keyExtractor={ids => ids.join(':')} renderItem={({item:ids}) => <View style={{ gap: 8,flexDirection:sideDrawer?"row":"column",width:sideDrawer?drawerWidth-24:undefined,justifyContent:"space-around" }}>{ids.map(id => thumbnail(id, itemSpec(id).name))}</View>} initialNumToRender={6} maxToRenderPerBatch={6} windowSize={3} contentContainerStyle={styles.strip} getItemLayout={(_,index)=>({length:98,offset:98*index,index})} />}
          {!collapsed && (tab === "Room" || tab === "Stickers") && (
            <ScrollView
              horizontal
              ref={inventory}
              testID="inventory-strip"
              showsHorizontalScrollIndicator
              contentContainerStyle={styles.strip}
            >

              {tab === "Stickers" && stickerIds.map((id) => thumbnail(`sticker:${id}`, stickerNames[id]))}
              {tab === "Room" && (
                <>
                  {wallThemes.map((wallpaper) => (
                    <Pressable
                      key={wallpaper}
                      accessibilityRole="button"
                      accessibilityLabel={`${wallpaper} walls`}
                      onLayout={e => revealInitialItem(wallpaper, e.nativeEvent.layout.x)}
                      onPress={() => { const reward = themeRewards.find(r=>r.id===wallpaper); if (reward && !ownership.ownedWallpapers?.includes(wallpaper)) feedback(badgeRule(reward.badge)); else { dispatch({ type: "theme", wallpaper }); if (personFor(app.save).unseen.includes(wallpaper)) app.personalize({ unseen: personFor(app.save).unseen.filter(id=>id!==wallpaper) }, {learner:app.save.learning?.active ?? "family", epoch:app.epoch}); } }}
                      style={[styles.swatch, { minWidth:180, height:140, backgroundColor: wallColors[wallpaper] }]}
                    >
                      <Text style={styles.label}>{wallpaper}</Text>
                      <Text style={styles.meta}>{themeRewards.find(r=>r.id===wallpaper) && !ownership.ownedWallpapers?.includes(wallpaper) ? badgeRule(themeRewards.find(r=>r.id===wallpaper)!.badge) : "Walls"}</Text>{person.unseen.includes(wallpaper) && <Text style={styles.meta}>New</Text>}
                    </Pressable>
                  ))}
                  {floorThemes.map((floor) => (
                    <Pressable
                      key={floor}
                      accessibilityRole="button"
                      accessibilityLabel={`${floor} floor`}
                      onLayout={e => revealInitialItem(floor, e.nativeEvent.layout.x)}
                      onPress={() => { const reward = themeRewards.find(r=>r.id===floor); if (reward && !ownership.ownedFloors?.includes(floor)) feedback(badgeRule(reward.badge)); else { dispatch({ type: "theme", floor }); if (personFor(app.save).unseen.includes(floor)) app.personalize({ unseen: personFor(app.save).unseen.filter(id=>id!==floor) }, {learner:app.save.learning?.active ?? "family", epoch:app.epoch}); } }}
                      style={[styles.swatch, { minWidth:180, height:140, backgroundColor: floorColors[floor] }]}
                    >
                      <Text style={styles.label}>{floor}</Text>
                      <Text style={styles.meta}>{themeRewards.find(r=>r.id===floor) && !ownership.ownedFloors?.includes(floor) ? badgeRule(themeRewards.find(r=>r.id===floor)!.badge) : "Floor"}</Text>{person.unseen.includes(floor) && <Text style={styles.meta}>New</Text>}
                    </Pressable>
                  ))}
                </>
              )}
            </ScrollView>
          )}
        </View>
      )}
      <Modal transparent visible={confirm} animationType="none" onRequestClose={() => setConfirm(false)}>
        <View accessibilityViewIsModal style={styles.scrim}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>Start fresh?</Text>
            <Text style={styles.hintText}>Your room will return to its starter layout. You can Undo.</Text>
            <Button label="Keep my room" onPress={() => setConfirm(false)} />
            <Button
              label="Reset room"
              onPress={() => {
                dispatch({ type: "reset" });
                setConfirm(false);
                setSelected(undefined);
                setPlacing(undefined);
                setDraggedItem(undefined);
                // eslint-disable-next-line react-hooks/immutability -- Reanimated shared value reset after confirmed reset.
                preview.value = emptyPreview;
              }}
            />
          </View>
        </View>
      </Modal>
      <Modal transparent visible={stackMenu} animationType="none" onRequestClose={() => setStackMenu(false)}>
        <View accessibilityViewIsModal style={styles.scrim}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>Put on…</Text>
            <ScrollView style={{ maxHeight: 240 }}>
              {target && room.instances.filter(i => !i.on && decorSpec(i.item).surface).map(parent => <Button key={parent.id} label={stackActionLabel(parent, room.instances)} onPress={() => { putOn(target, parent.id); setStackMenu(false); }} />)}
            </ScrollView>
            <Button label="Cancel" onPress={() => setStackMenu(false)} />
          </View>
        </View>
      </Modal>
      <Modal transparent visible={!!surfaceMenu} animationType="none" onRequestClose={() => setSurfaceMenu(undefined)}>
        <View accessibilityViewIsModal style={styles.scrim}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>Choose an item</Text>
            {room.instances.filter(i => i.on === surfaceMenu || i.id === surfaceMenu).sort((a, b) => Number(!!b.on) - Number(!!a.on)).map(i => (
              <Button key={i.id} label={itemSpec(i.item).name} onPress={() => {
                setSurfaceMenu(undefined);
                itemAction(i, "activate");
              }} />
            ))}
            <Button label="Cancel" onPress={() => setSurfaceMenu(undefined)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#C8DDD2", overflow: "hidden" },
  chrome: { position: "absolute", zIndex:40, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  button: {
    minWidth: 48,
    minHeight: 48,
    paddingHorizontal: 10,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF8E9EE",
    gap: 2,
  },
  label: { fontSize: 12, fontWeight: "800", color: ink },
  chosen: { backgroundColor: "#B4DCC7", borderWidth: 1, borderColor: "#4B8271" },
  segment: { flexDirection: "row", gap: 3, padding: 3, borderRadius: 21, backgroundColor: "#FFF8E9CC" },
  history: { position: "absolute", flexDirection: "row", gap: 6 },
  toolbar: {
    position: "absolute",
    flexDirection: "row",
    padding: 4,
    gap: 4,
    borderRadius: 20,
    backgroundColor: "#FFFAEE",
    boxShadow: "0 3px 12px #254C4425",
    zIndex: 600,
  },
  hint: {
    position: "absolute",
    alignSelf: "center",
    maxWidth: "85%",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#FFF8E9F0",
  },
  hintText: { fontSize: 13, color: ink, textAlign: "center" },
  drawer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#F9EFD9F5",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  tabs: { height: 48, flexDirection: "row", justifyContent: "center", gap: 4 },
  strip: { gap: 10, paddingHorizontal: 14, paddingTop: 3, paddingBottom: 5 },
  thumbLabel: { fontSize: 10, color: ink, fontWeight: "700", maxWidth: 80, paddingHorizontal: 3 },
  swatch: {
    width: 84,
    height: 86,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#7B947D",
  },
  meta: { fontSize: 11, color: ink },
  menu: { position: "absolute", padding: 12, gap: 8, borderRadius: 16, backgroundColor: "#FFF8E9", zIndex: 700 },
  scrim: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#234B4670",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  dialog: { maxWidth: 310, padding: 24, borderRadius: 24, backgroundColor: "#FFF8E9", gap: 12 },
  dialogTitle: { fontSize: 22, fontWeight: "800", color: ink, textAlign: "center" },
});
