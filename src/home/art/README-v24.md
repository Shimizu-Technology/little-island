# Island Home 2.4 art integration

Phases 1 and 2 supply rendering and capability data. HomeScreen, saved relationships,
placement, targeting, and native acceptance remain engine/lead work.

- Use `ItemArt` / `MoreItemArt` with `layer="back"`, the occupant, then
  `layer="front"`. Default `all` renders both furniture layers. Keep all three
  under the same mirror transform. Do not also paint the legacy SeatFront.
- `capabilityOf(item).sockets` uses square viewport-normalised coordinates.
  The original catalog ID `bed` is named Cloud bed; no second cloud-bed ID is
  needed. Bunk bed has lower/upper sockets, bench has left/right sockets.
- Resolve `sit` to `sit-front`, `lie` to `lie` or `lie-asleep`, `bathe` to `bathe`.
  `sit-relaxed` remains unchanged; `sit-side` is a compatibility alias for the
  same seated skeleton. Holding, eating and drinking use the right hand.
- `poseBox(resolvePose(...))` gives the rendered box and contact anchor in rig
  units. Normal poses use 80×132; lying uses **144×92**, anchor **(44,46)**.
  The lying transform rotates every wardrobe layer together. `Islander.size`
  means the scale of a 132-unit standing rig, including for lying. At size 224,
  lying renders 244.36×156.12; do not stretch it into an 80×132 container.
- For a square item of scene size S and character scale C/132, position the
  character at `socket.at*S - poseBox.anchor*C/132` relative to the item's
  square top-left. Mirror this complete group about the item's centre. This is
  exactly the placement in SocketGallery. Draw every occupant between the same
  back/front pair (especially two occupied bunks). The old lap clip must go.
- Pass SVG content sized in a 24×24 box to `held`. It is centred at the right hand,
  after the arm and before the front finger stroke. It follows the pose and the
  lying transform. A held node must be SVG content, not a native View.
- Pass `reduced` to Islander and CrabFriend to hide sleep marks. These components
  have no timers. When occupied, animate the complete furniture/occupant group,
  or disable the optional furniture motion, to keep contact stable.
- CrabFriend has stand/sit/lie/held and an optional mirrored flag. Its box is
  120×110 and ground contact is (60,96). Replace the ArcadeArt home crab at the
  engine seam; the arcade game art is unchanged.
- `visualBox(item, rotation, mirrored)`, also exported from world.ts, reports a
  conservative **full SVG square**, relative to the current itemPoint anchor:
  left `-S/2`, top `-.85*S`, width/height S. This includes transparent padding.
  It matches geometry.itemSize for every catalog entry. Use this for safe display
  clamping; it does not change saved footprint rules. Bed at x=0 still has an
  engine-centred box extending left of its room: art alone cannot fix that.
- Phase 1 added the free bathtub, bubble-bath and bench. Phase 2 living props
  and their state contract are documented below.

## Reproduce the dev fixture

After `npm ci` with Node 22:

```sh
npm run export:web
V24_ART_GALLERY=dist npx vitest run tests/home-art-v24.test.tsx
LITTLE_ISLAND_PORT=43893 node scripts/serve.mjs
```

Open `/art-gallery.html`. The generated `/wardrobe.html` is for checking SVG
bounds. The fixture imports the production rig and SeatShape, uses catalog
scene sizes and published sockets, and includes every socket in both facings
and three wardrobe looks. It is not a public app route or a saved-state journey.

## Phase 2: living prop API

`ItemVisualState` is now `{ on?: boolean; empty?: boolean }`. Missing values are
false. Art is a projection of engine state, not a persistence schema. The existing
`active` prop maps to `{on: active}` only if no explicit `state` is passed.

| Item ID | capability | State to draw |
| --- | --- | --- |
| `floor-lamp`, `table-lamp`, legacy `lamp` | `toggle: 'light'` | `on: true` gives warm glow and ground pool |
| `sink-counter` | `toggle: 'water'`, `moveInPlay: false` | `on: true` gives a stream and splash |
| `tv`, `radio` | `toggle: 'power'` | `on: true` gives calm hills / music notes |
| `fridge` | `toggle: 'open'`, `dispenses` | `on: true` opens the door and reveals food |
| `fruit-bowl` | `dispenses` | always available; no toggle required |
| `mango`, `banana`, `rice-ball`, `cupcake` | `holdable`, `edible: 'food'` | normal; engine removes a consumed instance |
| `coconut-drink`, `juice` | `holdable`, `edible: 'drink'` | `empty: true` removes liquid / fades the carton label; straw remains |
| `teddy`, `ball`, `book`, `shell` | `holdable`, no `edible` | normal; no consumption |

All ten holdable items are free and small enough for surfaces. New IDs are
`tv`, `radio`, `mango`, `banana`, `rice-ball`, `cupcake`, `coconut-drink`, `juice`,
`book`, `shell`; existing free teddy and ball IDs are reused. Food/drink colours
are fixed (`tintable: false`); furniture and toys retain tint support.

```tsx
<MoreItemArt id="fridge" state={{on: true}} />
<MoreItemArt id="juice" state={{empty: true}} size={itemSize(instance)} />
<Islander pose="hold" held={<HandProp id="mango" />} />
<Islander pose="drink" held={<HandProp id="juice" state={{empty: false}} />} />
```

Import `HandProp` from `art/PropShape`. It is SVG content in the rig's 24×24
attachment box. Do not pass LivingArt or MoreItemArt as the held node: those are
standalone SVGs with room-space padding. The `drink` hand joint is now (42,68),
so the shared straw tip reaches the mouth. `eat` remains (43,57).

Water, screen, glow and notes use static art, including under Reduce Motion;
these components start no loops. Pass `reduced` to LivingArt / item art anyway.
Radio notes explicitly expose `data-notes="static"` in reduced rendering.

### Dispenser fan

Import `dispenserChoices` and `dispenserFan` from `art/living`.
`dispenserChoices('fridge', {on:true})` returns mango, banana, juice, rice-ball;
closed fridge returns no choices. Fruit bowl always returns mango, banana,
coconut-drink. Calls do not track or consume stock.

`dispenserFan(item,state)` returns `{item,x,y,size:48}` entries with 56-unit
horizontal spacing, centred around the source, and a shallow upward arc:
`x=(index-(count-1)/2)*56`, `y=-74-sin((index+1)/(count+1)*PI)*20`.
Use a separate room overlay so the icons are not scaled with a tiny fruit bowl.
`DispenserFanArt` draws the matching cream circular chips in a 224×120 viewport,
viewBox `-112 -120 224 120`. Anchor its bottom centre at the source art centre
(itemPoint.x, itemPoint.y - .35*itemSize), or a nearby clear presentation point.
Clamp the complete fan to room bounds; dock it when needed. Add labelled engine
hit targets for each chip, at least 44 screen points after camera scaling. Each
pick/drag creates a new validated instance. Cancel/dismiss changes no world data.
Neither the fan component nor the art performs dispatch, drag, saving or eating.

### Seat polish and starter data

Seated `poseBox` anchor is now **(44,107)**, at the thigh contact rather than the
hips; use that value instead of a cached Phase 1 constant. Stool socket is at
(75,94)/150; chair, rocking chair and armchair are at (75,100)/150. Bench retains
its left/right positions. Catalog scene sizes (after geometry's 1.18 multiplier)
are stool 212, armchair/rocking chair 224, sofa 271 and bench 260. Original chair
and beanbag footprints/sizes stay compatible; their drawn seat/back are broader.
`visualBox` automatically follows all changed catalog sizes. Lying size and anchor
are unchanged from Phase 1. Bed/Cloud bed is the single catalog ID `bed`.

The only model edits are the requested fresh kitchen layout: fridge, sink,
retained stove, kitchen table, stool and a fruit bowl on the table. Existing saved
rooms are not rearranged. The engine slice should retain these two small starter
hunks when integrating, alongside its own model changes.

Generate both fixtures, then serve as above:

```sh
V24_ART_GALLERY=dist V24_ART_P2=dist npx vitest run tests/home-art-v24.test.tsx tests/home-art-p2.test.tsx
```

The new fixture is `/living-gallery.html`.
