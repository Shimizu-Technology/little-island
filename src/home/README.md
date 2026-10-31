# Island Home 2.4 engine

This section is the current contract. The older 1–2.3 notes below are historical.

- `starterHome()` and `migrateHome()` produce version 3. The `HomeStateV2` type name remains as a compatibility alias for existing route/personalization consumers; its version accepts 2 and 3 at restore boundaries. Characters use `WorldPose`, an optional `{itemId,socketId}` socket, and one optional `holding` instance ID. Instances use `powered` for capability toggles and `empty` for consumed drinks. Food is absent after consumption. Transient reactions and sleep timing never enter saves.
- Validation checks exact keys, IDs, room/slot uniqueness, socket existence/kind, unique socket occupancy and unique held ownership. Holding requires a same-room holdable instance. Legacy v1/v2 records are validated before migration, copied without mutating the original, and gain sockets where available. Only invalid silhouettes are relocated. Existing recovery keeps the original input and blocks replacement of invalid data. Historical coordinate envelopes remain accepted; room clips also contain those restored records.
- `drop.ts` owns worklet-safe `resolveDrop`: hand targets, mouth targets, free sockets within 85 scene units, available surface cells within 42 vertical units, then the nearest collision-free bounded floor cell. Preview and release use this function. `dropWorld()` prepares serializable data after settled edits. Drops outside every room cancel character transfers; gaps never choose an arbitrary nearest room. Tap a friend, then furniture/floor or a named room, for an alternative to dragging. Tap a small prop, then a friend, to carry it; tap the held target to put it down.
- ART metadata is read through `capabilityOf()`. Missing metadata preserves movable items; legacy seat items without authored sockets retain one seated contact. Small catalog props remain holdable as the phase-one fallback, unless capabilities explicitly disable holding. `visualBox()` supplies furniture bounds; socket pose boxes extend these bounds for a full 224-unit Islander in either facing. A clipped 8..792 × 8..552 interior contains room content. Old beach anchors now project onto interior floor positions.
- `poseBox()` positions the complete rig at its socket contact. Mirroring reflects the whole occupant box about that contact. All seat backs paint before occupants and fronts paint after every occupant, including shared bunks and benches. `MotionLink` carries occupants/fronts with furniture on the UI thread. Occupied furniture uses translation-only pickup to keep contact exact; other pickups use 1.06× and 7pt lift, with a grounded shadow. Settling removes translation before the committed layout; lift uses a short spring. Reduce Motion settles immediately. Unresolved character destinations spring back to their start. Native gesture feel still needs lead acceptance.
- Drag slop is 8pt; inventory exit is ±8pt vertically and fails at ±14pt horizontally so the strip can scroll. A second pointer clears the drag and linked occupants. Object drags block both camera pan and pinch. Overview targets enter a room; tiny objects cannot be picked up there. Interactive targets are at least 44pt. Overlapping raised items retain the named item chooser.
- Play moves furniture and friends. Design opens through one round pencil and finishes with ✓. Portrait starts at one catalog row (154pt including tabs), collapsible to 48pt; landscape docks a vertical catalog on the right. Selected Design controls are docked above the drawer. There is no permanent grid or saved pill. Undo is available in Play; navigation stays outside world history and Undo retains current camera context.
- Capability-driven food, drink, toggle and dispenser state is implemented and unit-tested. The ART Phase 2 living-prop visuals/catalog are separate. Missing authored rig actions fall back to supported idle/seated poses. Calm sleep starts after eight seconds of unchanged lying; Reduce Motion suppresses sleep marks. A 1.2-second reaction is transient.

Evidence and execution limits: sibling `little-island-games-artifacts/islander/v24/engine/REPORT.md`.

---

# Island Home integration

This is an offline, no-fail room for the family's Islanders. The implementation follows `docs/ISLANDER_2.md` and the Island Home design study, from `feat/islander` at `bedb78d`. The `/island-home` route is linked from Home’s Me area. Identity integration persists rooms in the optional personalization namespace.

## Boundaries

- `HomeScreen` accepts `ownedItems`, `ownedWallpapers`, `ownedFloors`, `badges`, `initialState`, and `renderCharacter(slot, pose)`. Update earned-item props without replacing state: earning never rearranges a room. Remount with a learner key on learner switch or restore so session history cannot cross owners.
- `renderCharacter` receives slots 0–2 and `stand`/`sit`. Supply art in a roughly 60×92-point render box; the scene scales this box as one unit. The fallback is a neutral mannequin for slot 0, Pip in a bowl for slot 1 and existing Poko art for slot 2. Map these two poses to the rig's pose IDs at integration.
- `useHomeStore` keeps session undo/redo only and calls the route-supplied `persist` transaction once per accepted settled action (including undo/redo). `/island-home` writes validated `personalization.people[learnerId].home` through Store’s commit/recovery queue, with captured learner/restore epoch checks. The route remounts on switch/restore and displays saving, saved, failed and retry states. No history or drag state is persisted. Without a persistence prop, standalone Home previews remain session-only.
- `validHome(unknown)` is the version-1 namespace validator. Unsupported or malformed input is rejected without mutation; the adapter exposes the original as `recoveryOriginal`. The integration must preserve it using the existing recovery store before any replacement, and must prevent ordinary writes during restore or owner changes. This slice does not invent a second recovery/storage system.
- `homeReducer` returns the original state and a human message for rejected edits. Reset returns `snapshot` referencing the exact pre-reset state; history makes that reset undoable. History is bounded to 40 steps outside `HomeState`.
- Starter items are always owned. Pass earned furniture IDs and `sticker:<existing arcade StickerId>` through `ownedItems`. `homeStickerItems` adapts the existing sticker array. Putting an instance away changes placement only. Duplicate sticker and furniture instances are supported; ownership is reusable.
- `HomeScreen.badges` uses the 24 milestone `BadgeId` values from `src/badges/engine.ts` (`math-1` through `classic-4`). The route derives these from the owner's milestones. Furniture and theme badge metadata provide the same exact earning rules as the Locker. `initialItem` opens the matching drawer and reveals its selected reward; the legacy six-track catalog validator is retained only for older adapters.

## Placement and art

Floor coordinates are integer cells in a 10×6 grid, with columns 8–9 reserved for the door. Wall decorations use an 8×2 anchor grid. Rugs/mats occupy a separate ground layer and may sit beneath furniture; items on the same layer cannot overlap footprints. All instances count toward 32, including decals. Furniture supports 0°/180° views; wall objects stay upright. Both directions use coherent illustrated views rather than turning a chair sideways in screen space. Art uses the same muted teal/coral/honey palette and 2.5-unit outlines throughout, with no imported imagery or unreviewed CHamoru text or latte-stone decorations.

Objects and characters share depth sorting by floor contact point. Floor coverings and wall decals render first. The bed renders at 215/800 scene units; the standing Islander box is 163/800, its seated box is 112/800 to fit the furniture, and the sidekick boxes are 129/800. Seated hip anchors match the bed, chair, rug and beanbag surfaces. An occupied chair paints its front rim after the character, while its back stays behind. Footprints retain their version-1 sizes so accepted round-1 saves stay valid. The larger illustrated silhouettes may extend beyond a collision footprint, as in a 3/4 room.

## Direct manipulation

`Drag.tsx` uses Gesture Handler Pan/Tap gestures and Reanimated shared values. Translation, lift, inventory ghost and live footprint run as worklets; no reducer or React state update runs on pointer movement. The start callback only selects the transient drag context, and release commits one reducer action. Invalid furniture moves preserve the old state. `placement.ts` supplies the same footprint check to the model and the worklet preview. Horizontal inventory gestures scroll; a vertical exit begins an inventory drag. Selecting a thumbnail then tapping the floor is also supported.

Play: drag a friend anywhere on the bounded floor; dropping within 65 scene units of the nearest bed, chair, rug or beanbag snaps to its sitting contact point. Free-floor drops clamp to the 10×6 grid. Characters can share a spot if deliberately placed together. Starter positions are distinct: Islander by the window, Pip in a bowl on the shelf, Poko on the rug.

Character records still accept the original `{slot, anchor, pose}` shape unchanged. A free floor character has exactly `{slot, anchor: "floor", pose: "stand", x, y}` with finite bounded integer coordinates. A particular seat can add `seatId`; the reference must match the anchor's item. Moving that instance carries the character; putting it away stands the character safely. Strict validation rejects mixed shapes and extra fields. Persist these extended records through the same `useHomeStore` seam.

Decorate: drag furniture on the floor/wall grid or tap to select. A floating Rotate/Mirror/Put away toolbar sits above or below the selection, clear of the top chrome. Undo/Redo exist only in Decorate. The slim bottom drawer has horizontally scrolling Furniture/Stickers/Room strips; it starts collapsed in short landscape and can be collapsed at any size. Reset is in More, with a modal confirmation and undoable snapshot.

Every scene object and friend is a focusable accessible element. Native accessibility actions provide object activation, cardinal movement, rotate/mirror/put away and named character destinations. Web: Tab to an object; Enter/Space selects or reacts; arrows move furniture in Decorate and friends on the floor; R rotates, M mirrors, Delete/Backspace puts away. S/Enter cycles character destinations. On a selected inventory thumbnail Enter/Space chooses it; focus Room floor, use arrows then Enter to place. No alternate visible object lists are needed.

Accepted placement and reactions use the existing quiet tap tone, respecting global sound and effects preferences. There is no automatic audio. Object reactions change their illustration immediately. Pick-up lifts 7 points with a small scale change and settles with a subtle spring; Reduce Motion removes both. The beach's wave line gently shimmers in opacity, and stays still with Reduce Motion. Keyboard operations settle instantly. The remaining rig fit, native gestures, VoiceOver/TalkBack, haptic/audio comfort, and physical-device acceptance belong to the lead's native/family gate.

Portrait and tall tablet layouts add sky, a cutaway roof, a porch and a beach strip. Three strict, coordinate-free standing anchors (`beach-left`, `beach-middle`, `beach-right`) extend the version-1 character namespace; original saves remain valid unchanged. Beach drops settle to these anchors. Landscape keeps the original room-first size when a full-width room plus beach will not fit. A saved beach character forces the strip to stay visible after rotation. Furniture remains on the original floor grid.

## 2.1 save and interaction contract

`HomeStateV2` is the persisted four-room namespace: `{version: 2, current, rooms}`.
Each `RoomState` has instances, characters and its own theme. `HomeState` retains the
v1 room shape solely for the art contract's `HomeState["theme"]` lookup and legacy
validation; use `HomeSave` at restore boundaries and `migrateHome` before editing.
The migration is pure and idempotent. It doubles original floor/wall coordinates,
including free-floor character positions; projection and scaled footprints preserve
the decorated layout. Malformed data is rejected, never repaired in place. The
personalization initializer migrates only validated envelopes. Restore/recovery
continues through the existing Store; the standalone adapter blocks edits on invalid
initial data.

Rooms are `home`, `kitchen`, `treehouse`, and `beach`. Friends follow the player,
standing at distinct floor positions on entry; their old seats stay in that room.
Play/Decorate is screen state and survives room switches. Undo/redo spans room edits
and switches. Reset affects only the current room.

Floor coordinates now use a 20×12 subgrid, with columns 16–19 reserved for the door;
wall decorations use 16×4. Footprints are twice the original cell dimensions. Each
room allows 48 instances. `tint` is optional, palette-validated, and only allowed on
tintable items. Both original and expanded objects receive their art contract's `tint` prop.

Only metadata-marked small items can have `on: parentId`, and the parent must be an
unstacked surface in the same room. Children must fit its footprint and cannot
intersect other children. Floor collisions ignore raised children. Moving a surface
moves its children by the same grid delta; putting it away also puts its children
away. Undo restores the complete group. Drag feedback highlights a surface before
release; named Put on buttons and accessibility actions offer the same operation.
Dragging away clears the parent and revalidates floor placement.

Islander size is always 163 scene units; Pip and Poko each keep their own 129-unit
box. Seat offsets place the constant-size rig's hips on the illustrated surface.
Seat backs render first, characters next and chair/bed/beanbag/sofa front pieces
last. The independent art slice is integrated; room defaults come from `roomDefaultTheme`.
Explicit saved themes are never replaced by defaults. New kitchen, tree house and
beach rooms start with the agreed four-item furniture sets. Native fit and depth
still require the lead's device checks.
The categorized inventory uses a horizontal FlatList with bounded render batches.

## 2.2 stage projection

Island Home now paints an 800×560 near-frontal stage. The back wall fills the top 352 units and the floor fills the lower band. The same version-2 20×12 floor and 16×4 wall coordinates remain in saved rooms; only their projection changes. `floorPoint`, `itemPoint`, `spotFromPoint`, the drag worklet preview and the visible floor grid use that projection. Placement validation, collision footprints, depth ordering and versioned save parsing retain their existing rules.

Portrait screens show the stage at the available height and allow horizontal scrolling to its side walls. Item drag and drop measure the stage origin after scrolling. The Islander box is 224 scene units, sidekick boxes are 170, and furniture illustration sizes are enlarged without changing footprints. Seat offsets match the larger rig. Each room has permanent wall details and low built-ins behind child-placed furniture; saved themes still colour the room. Interactive art uses optional worklet animation and respects Reduce Motion.

## 2.3 dollhouse and character contact

Room order fills two rooms per floor from the ground upwards. Wide phone landscape
uses four per floor. One roof, structural beams, an upstairs terrace and a ground
shoreline form a single cutaway. Overview fits 90% of the limiting viewport axis.
`HouseCamera` owns two-axis empty-floor pan with resisted edges and momentum, plus
focal-point pinch. A room tap enters close-up; double-tap toggles the overview. Room
chips glide to a room (instant with Reduce Motion), and the named zoom button is an
accessible alternative. Scene sizing commits only when a pinch settles; shared
values carry movement while fingers move. Object drags block camera pan and ignore
multi-touch. Saved coordinates, furniture footprints and stacked-parent coordinates
stay room-local at every camera scale. Transfers resolve the same two-axis building
origins used for rendering. The optional validated `settings.homeNavigationSeen`
flag dismisses the navigation hint after a successful pan or zoom; old saves need
no migration. Current room persists as before; camera offsets/zoom remain visit-local.

Room selection now changes only camera/edit context. Friends remain in their room;
a cross-room character drop transfers exactly one unique slot. Version 2 retains
its shape, and validation now allows unique slots in multiple rooms. Original v1
and v2 saves still load. Reset uses only the current room's resident slots. Undo
covers transfers and room edits through the existing history seam.

Character floor edits settle to the nearest unoccupied furniture cell. Rendering
also resolves an old overlapping floor/window anchor safely without rewriting the
saved source. Furniture edits relocate affected free-floor characters. Rugs and
raised items do not block floor contact. Furniture depth uses its footprint's
front row against character feet. Occupied-seat fronts clip below the lap, and a
nearby table paints behind the seated silhouette. Play excludes furniture notices
from both its hint and live region.
