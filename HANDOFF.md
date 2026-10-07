# Quest: handoff (build 237, 7 Oct 2026)
Current state only. What changed build by build is in docs/HISTORY.md (newest first). How we work is in
QUEST_WAYS_OF_WORKING.md (WAYS). Start with Next task; read other sections when the task touches them.

## Where the work happens: chat only
- In the Linux container. Start of every chat: `git clone https://github.com/worthcreation/quest.git` into
  /home/claude, `node tools/build.js`, check `const BUILD` in src/draw.js against main (the next build is main's plus
  one), read Next task. Work, then `node tools/ship-local.js NN "..." --zip` and deliver
  /mnt/user-data/outputs/quest-bNN.zip as a download. Ross unzips it into ~\quest and pushes (the printed line does
  both); then the chat's clone resets to origin/main (`git fetch; git reset --hard origin/main`) before more work.
- Claude never commits or pushes: Ross does. An unzip adds and overwrites but never deletes: when a build deletes a
  file, the reply lists what Ross must delete by hand in ~\quest.

## Build, test, ship
- Build: `node tools/build.js` (`sh build.sh` runs it too) concatenates src/head.html and the files in src/ORDER into
  index.html, then checks the script parses (fails the build if not). Edit src/, never index.html. BUILD number:
  `const BUILD` in src/draw.js (shown bottom-right in game).
- Test: `node tests/run.js` runs every tests/*.js through tests/harness.js (fake canvas, seeded Math.random, world
  seed 1000003, TEST_MODE on). 74 tests, one after another, 146 s in the container since 238, each one's time
  printed. Tests step the game without drawing (`require('./harness.js').src`, draw() returns at once); a test that
  reads the screen (hints, labels, HUD, paint order, the x-ray, the window, pixels) takes `.drawn`, and a slow one
  may draw only around the checks that need it (epic, plates, edit, rise-ravines). FULL_DRAW=1 draws everywhere.
  Off-map screens built at first visit (EPIC.late, worldScene) cost a test nothing until it goes there. Each prints `errs N`;
  0 is a pass (robin-drop prints none and passes). While working, run only the ones you touch: `node tests/<name>.js`.
  `node tools/overlap.js` checks 300 worlds for overlapping things (want 0).
- Ship: `node tools/ship-local.js NN "Build NN: ..." [scene]` bumps BUILD, builds, stops if `node tools/dead.js` lists
  an unused top-level name (delete it, or mark it `// keep: <reason>`), runs every test and the overlap check, stopping
  at the first failure, then, with `--zip` (it needs the zip command), packages /mnt/user-data/outputs/quest-bNN.zip
  (older ones removed; what goes in is PACK in ship-local.js) and prints the commit line and links (tools/links.js).
  Without --zip it prints the line for a working tree already at ~\quest (tools/links.js --local); not used now.
- On the Mac (Ross uses it now and then; he says which machine), give the zsh line above the printed one:
  `cd ~/quest && git fetch origin && git reset --hard origin/main && unzip -o ~/Downloads/quest-bNN.zip -d . && rm
  ~/Downloads/quest-bNN.zip && git add -A && git commit -m "..." && git push` (the fetch and reset first: the Mac clone
  is usually behind main, and at 211 a push from it was rejected and brought a deleted file back) (the Mac clone pushes as worthcreation@; if Safari unzipped it, rsync the folder instead).
- The reply that ships ends with the printed line (Windows PowerShell, in a ```powershell block): `cd ~\quest
  -ErrorAction Stop; Expand-Archive -Force ~\Downloads\quest-bNN.zip .; Remove-Item ~\Downloads\quest-bNN.zip; git
  add -A; git commit -m "Build NN: ..."; git push`, and every play-test link.
- Audit: `node tools/audit.js` (about 6 s; WAYS 5) at the start of a cleanup chat and at every handoff; `--save` at a
  handoff updates docs/audit-baseline.json. Last run (handoff after build 239, 7 Oct): audit: 12609 lines, 0 unused, 1 functions over 150 (drawMtn 161), 0 repeats, 162 state fields, frames avg 1.47 ms (6 slow, 0 errors): epic draws 14.3 ms, mt2 14.2, rise 7.7 (harness; since 239 the audit draws, and builds the late canyon).
  in the model menu.
- Handoff (end of a chat, or when Ross says "handoff"): HANDOFF's current state and Next task, `node tools/audit.js
  --save` with its line copied in, PROJECT_INSTRUCTIONS.md to match, docs/design-rules.md's Story so far if the story
  changed, docs/PROJECT_DESCRIPTION.md only if the mood,
  theme or direction changed. The handoff reply ends with three things: the full PROJECT_INSTRUCTIONS.md text in a
  code block only if it changed (Ross pastes it into the Project settings), else "PROJECT_INSTRUCTIONS unchanged";
  the model the next chat starts on and why, then the exact first message for the next chat in a code block, opening
  with that model (Ross picks it in the model menu before sending); and any files to delete by hand in ~\quest.
- Render (only when asked): `B<NN>=1 node tools/shot.js` runs the render block for that build and writes PNGs to /tmp
  (on Windows node that's C:\tmp, which must exist). B212 is mt2 with the plates (TILES=1 for the heights). MOCK4=1 is the mountainside still (it and tools/render.js still
  write to /mnt/user-data/outputs, a container path: repoint before use); B139/B150/B154 are the climb screens; B165 is
  the rise (eight spots: the way in, along it by the ravines, the way out; plus the tiles; SW=390 SH=844 for a phone).
- Links (every reply that ships gives all of them, as tools/links.js prints them; that file is the one list): `?seed=N` (a fresh 7-digit prime each build; the jetty opening), `?arena`,
  `?puzzle`, `?mountain` (keys 1-4 jump between mt2 and climb3 to climb5, 0 to the first field, [ ] and - = tune the
  shadow), `?scene=<id>` (start on any screen id in MAP_LAYOUT, rise included, or climb1-climb5; there is no f2 now), `?edit=mt2`, `?edit=flat` and `?edit=epic` (the layout editor, 215; flat is the empty board), `?scene=epic` (the canyon, 236: the stone's test screen, off the map), `?overview=N` (the same world as
  one map; bare ?overview for a random one), `?model` (the drawn hero outside the arena). Any of them combine with
  &seed=N. If a link is added, renamed or removed in src/, change this list in the same build.

## File map (src/, in load order)
- world.js      world generation: genWorld calls one function per region (genCamp to genHollow, in rng order), then
                the tail; solids, exits, barriers, crag(), pullable(), MAP_LAYOUT/MAP_NAMES, SHROOM_NAMES, the
                cellar; genField is the first field only (f1)
- highlands.js  the High Reaches (hr1-hr3): enterHighlands (title card, vista birds), vistas, hawks, mantises,
                crystal bugs, worms, the red beetle
- climb.js      the climb screens (climb2-climb5; climb1 became mt1 in 207, retired 213): CLIMB_TUNE and CLIMB_SPECS (every number, to dial in), climbScreen
                (spec to CLIMBS[id]), trail and gap-field painters, side view, wind,
                shadow aim (SHADOW), tile overlay, test links (MOUNTAIN, START_SCENE, testHops)
- plates.js     the plate (212, docs/mountain-plan.md "Plates"): plateOutline (a seed's worn squarish ring), plateHas (the one
                shape), plateKind, plateAdd/platePit/plateSeam, plateLayout (each plate's li: its line in the layout) (a screen's m.plates reads LAYOUTS[id],
                or the editor's copy; platesLay works out keys, pit cuts, floors), plateTopAt (with a predicate: the hero's skips overhangs), plateOverHero, polyDiff/polyArea (each plate's pieces p.O
                and holes p.holes, worked out in platesLay, 222), tunnelRing (a tunnel is a pit with a roof and q.tunnel), plateHold, platesAt; platesLay's painter's order
                (fkey, the faces' turn: chain, wholly-above, then whose foot is south where two overlap, a dependency order from
                the north; key, the top's turn: by height from PL_TOPKEY, drawPlateFaces then drawPlate, 220); the drawing: plateTex
                (a top's texture once, tile space, cached by seed and size in PL_TEX), plateLay (laid through the projection), platePaintFaces (faces north
                only), platePaintBrink/Lip, platePaintSeam, platesBase (the base's wash in 8-tile chunks), drawPlate,
                drawPlateTiles (no drawPit: the pit is drawn in drawPlate). mtnProj is the one projection (m.eye: the push-out); ravPal/RAV_EARTH/RAV_GREY
                colour the ravines (grey on a plates screen).
- layouts/      a plates screen's layout by scene id (LAYOUTS[id]: plates, pits, seams in tiles), laid in the editor and
                read by plateLayout at enterScene; mt2.js and flat.js (the board, empty). S in the editor copies the file; the save is pasting it over.
- mountain.js   the mountain family's generator (build 206, docs/mountain-plan.md). MTN (specs by scene id; RISE the rise's,
                M2 the stepping path's (scene mt2), FLAT the editor's flat board (scene flat, 216: no mountain, ravine or exits, off the map): size, foot, pathY, pathD, layout, scene, finish). Ravines (208): a
                screen's m.ravs, each a spine (polylines in tiles, [x, y, halfwidth]; genRavine kinds long, thin, spider by
                seed, walk with keep) or M1's old cy/hw one with a floor; ravField (the drop, one shape for isChasm via
                sc.mtnGap and the drawing), ravRings (the outline traced once, islands swallowed), mtnDrawRavs (all spines
                on a screen as one field), ravGrid/ravFieldAt (the field sampled once; the game's test reads it, 209), genRavRiver (a faint river on the biggest), mtnRavinePts, drawMtnDrop (far walls
                leaning toward the view, stones set in, river), drawMtnBrink (the brink's ground, band and lip, painted with the ravine before anything standing; the rows stop at the field's 0.4 line, 210),
                drawMtnRavine/drawMtnIsland for M1's; riseRavines (the rise's three), mtnHold (the mountain itself holds
                east of the foot, the way through the pass excepted; clampTo asks sc.mtnHold). mtnH (height), mtnColor,
                mtnHalf, mtnView/mtnZoom/mtnLead/mtnProj, mtnLand (props laid out once in tiles from m.seed, by m.layout
                with mtnWalls, mtnFootCrags, mtnTufts, mtnPass; nothing in a ravine), mtnRows (ground rows), addMtn,
                sceneSize, newMtnCam/mtnCamera (state.mtn), mtnToScreen, drawMtn (ground rows, ravines clipped to the land,
                everything standing drawn by the game's own code at its spot, scaled), mtnCragSprite, drawMtnTiles
- edit.js       the layout editor (215): ?edit=<scene> on a plates screen; startEdit, editTile (screen to tiles), editPick,
                editDown/Move/Up/Wheel (the mouse), updateEdit (the keys; true while the world stands still), editText
                (the layout as its file) / editLoad, drawEdit (labels by kind, the help line)
- input.js      keys, touch, camera, sfx (deduped), music and ambience
- text.js       say() with pages and holds, showTitle, showScroll, notice (pickup scrolls)
- engine.js     update(), enterScene, movement, jumps, wind and rides, chasms (isChasm, chasmSpan), hurtHero, checkEdges
                (no plates, logs or vanes: deleted in build 162)
- items.js      pickups, collect, drops, SEEDS, buried rocks and pulls, hitCrag, hitStone, robinHiding, stick drops
- combat.js     blades, slashes, lunge, whirlwind, pound, SWING_COST
- critters.js   enemies and AI (rabbits, gremlins incl. the peeking and taunting ones, hawks, mantises), damage, fx
- interact.js   interact(), findInteractable, patches (plotStage, PATCH), NPC talk, fishing, rapids, mushrooms
- actions.js    throwing, the R wheel and lanes, abilities (fire, dodge), shots
- pip.js        Pip: following, leading, pottering, PIP_PACE, pipWithYou, tutorial talk
- tutorial.js   TUTORIAL steps, PIP_LINES, COACH
- cutscenes.js  dusk, abduction, sword reveal, spore homecoming, rescue, ending: each scene's steps in CUT_STEPS,
                read by updateCut
- menu.js       the pack (icon belt, tabs, Map as pages of places, Status, System, Testing rows)
- save.js       saves, settings, migrations
- craft.js      camp building, RECIPES, the craft mat, STORY, campBuilt
- quests.js     QUESTS, updateQuests, storyAt, the quest HUD and log
- gear.js       slots and lanes (SLOT_KEYS, useSlot, flashSlot), FOOD, blades, wearables, plantHere (the one plant
                path; interact's patch menu calls it), heroColor
- skills.js     SKILLS, skillUse, SKILL_INFO
- draw.js       world drawing: ground, solids (SOLID_DRAW: one small draw per kind, drawSolid reads it), crags,
                ravines (drawBrokenChasm), mountain sides, hero, Pip (drawPip), enemies, items, drawJagged, drawRock,
                drawSoilLine (and soilLinePts, its points), BUILD
- draw-ui.js    item icons (ICONS: one small draw per type, drawItemIcon reads it; RAW ones are drawRawIcon in
                craft.js), enemies (MONSTERS[type].draw), HUD (bottom-right), the choice bubble (drawChoice), the place tag (top-left: screen id and seed, and under it your position in tiles;
                placeTag/placeCoords/drawPlaceTag, each line toggled in System), scrolls, speech boxes, titles, the pack, the creator screen, begin(), the loop
- draw-hero.js  the drawn hero model (arena and &model only)
- hammock.js    the lean-to's two hammocks: HAMMOCKS, hammockShape (layout in tiles, solids, landing, painter), climbIn/
                climbOut, pipHop, updateHammocks (the rock, the nap), SOLID_DRAW.hammock; either is yours to
                lie in while free (state.hammock.who, pipFree), F takes the nearer
- arena.js / puzzles.js  ?arena and ?puzzle
- boot.js       startup (runs last)
docs/: design-rules.md (the design rules and story so far; read before any change the player sees or reads), keys.md,
pip.md, crafting.md, farming.md, high-reaches.md, HISTORY.md, PROJECT_DESCRIPTION.md. tools/: build.js, ship-local.js,
links.js, dead.js, audit.js, shot.js, overlap.js, draw-record.js (records every canvas call per solid kind and item
type; run before and after a drawing refactor and compare the hashes), world-hash.js (hashes WORLD for 53 seeds; run
before and after a world.js refactor, --total for the one line).

## World layout (MAP_LAYOUT, x across, y down)
- Riverbank row: farbank, rapids, ford, riverbank, camp (with the lean-to 'tentin' and Wick's shack and cellar).
- Home row: gleampool, meadow2, meadow (garden), start (glade), then the woods w1, w2, w3 east to the cave mouth.
- Down from f1: the rise (where f2 was: in from f1 at its north-west corner, one long slope east, out south through
  a pass at the far end onto mt2; the wind shelf mt1 between them, 207, retired in 213), mt2 the stepping path (a
  fixed close view sliding with you: islands across a wall-to-wall drop, the plates' test layout on its banks, a
  pass south onto climb3, 211), the climb climb3 to climb5 (climb.js, its own
  runtime until item 3 remakes each on the main game), then east to the crags peak1-peak3 and the High Reaches hr1-hr3, stepping up and to the
  right. f3 to f7 (the windy fields' ravines and the mountain path) retired in build 204.
- Caves c1-c7 in a column to the east, out to fallsbank, the marsh m1-m3, the hollow h1-h3, the swamp sw1-sw3.
- climb1-climb5 exist but are not joined to the map yet (test links and System > Testing only).

## Conventions
- The design rules and story so far are in docs/design-rules.md; what follows are the code-side conventions.
- Pip and NPC lines hold until F; tutorial lines are free. One alert style: scrolls. Banners only for quest start/end.
- Anything the player gains shows in the pack (Gear lists keepsakes and plans).
- Stones: rough ones are drawJagged with the zigzag soil line; throwing stones are lumpy drawRock with a seed that
  stays with the stone (ground, arms, air, landing).
- Collision and drawing share one shape function (chasmSpan, gap(x, z)); never draw an edge the game
  doesn't test.
- Anything that takes over update() (state.rapids, state.climb) handles its own death, menus and text.
- Pip speaks only through pipLine (hold: true waits for F) or pipSay (once-only). Where Pip is on a screen is decided
  in one place, pipArrive (enterScene and updatePip): on his post (pipPost: the garden, or state.pipAhead after a tour
  lead with to:) he stays; elsewhere he's out of sight and comes back in from an edge after 4 s (pipBackIn).
- Rounded boxes: rounded(x, y, w, h, r). Exits: exitToward(sc, goal), exitPoint(ex).

## Tests (tests/, by topic)
acorn-skill arena book-tiles plates camp-patch camp-talk camp-tour climb combat-crops combat-rhythm craft-sections crafting
fluff garden-robin garden gather-skill gathering growth-gusts-shroom gusts heavy-stone high-reaches hole homecoming
hud-banners intro-wander lanes ledge-ride lesson opening pack patch-hints pickup-sparkles
pip-ahead pip-bounce pip-brambles pip-leading pip-post pip-teaches place-tag plot-tips puzzles quests rabbits layers reminders rise riverbank
robin-drop robin-home rocks-banners scene-smoke slots smoke speech spores-map stepping-stones sticks-trees stones rise-ravines reeds-hold
text-layout tips-prompts tour wind-rocks wood-sword woods-gremlins woods epic (the canyon played: its climbs, the
clipping at the shelf, at both screen shapes). scene-smoke visits every screen with every
creature woken from a stun (it would have caught the High Reaches freeze).

## The climb, where it stands (tune with ?mountain)
1 The wind trail: remade as the wind shelf, mt1 (207), retired in 213 (Ross: stale; the rise leads straight onto mt2). Was: its own cy/hw ravine with a floor and its
walls of stone, untouched by 208 to 210). 2 Stepping stones: round islands in a wide ravine.
3 The broken meadow: rifts across the way, chasms, a short ravine (gap field). 4 The windy crossing: rifts with bare
islands, big rocks to shelter behind; gusts drive you back to screen 3. 5 The last ledges: a side view.
Your shadow is the aim (it leads toward the landing, small at the top of a jump). Ross, 1 Oct: the islands are hard
to read without the tiles turned on: on the remade screens islands are at least 2 tiles across; the perspective stays. Open green for now (CLIMB_TUNE.ledge 12, no
crags); worn out restarts the screen. Open questions: final look, how the screens join the world, crags or not.

## The stepping path, mt2 (build 211; the plates' test screen since 212)
Since 212: grey throughout (M2.stone, stoneAt -9, no path tint; the ravine in RAV_GREY), the eye 40 tiles up (14 until 221; M2.eye,
mtnProj's push-out), close throughout (M2.fixed { p: 0.35, zoom: 0.825, follow: true }: the still's view, centred on you since
214, past the edges too, its ground eased under the view's middle), M2.plates (since 215 src/layouts/mt2.js, laid in
the editor ?edit=mt2): on the south-west bank a staggered stack of four (0.4, 0.45, 0.35, 0.45) with a pitfall punched
to the base (ledge 0.55, floor on its far side; 214), a stack of three with a 1.2 face partway up, a perch of
two steps, and a seam from the west edge to the lip; on the north bank's east end a two-step. You climb the plates (plateStepHero,
213; since 217 an overhang clear of your head, PL_HEAD 1.1, is walked under, the x-ray showing); Pip and the hares are held off them (plateHold) until layered ground. The islands and the chain are untouched; tests/stepping-path.js still plays it. The rest
of this section is 211's.
Out of the rise's pass (since 213), 40 x 24, a fixed screen (M2.fixed { p: 0.55 }: the whole screen in view at zoom
SW / (41 UNIT), never under mtnZoomMin; a phone's view slides with you, never past the ends). The drop (m2Ravine):
a neck 5 across along the middle from x 6 to 33, and between x 10 and 30 wall to wall as rows of spines 2.5 apart
reaching past both edges (the field is the nearest spine's: rows make one flat hole; their ends scallop the lips); the
river runs the neck only. Islands (genIslands, from the seed after the ravine; m.isls, each { x, y, r, s, chain, dare }):
a chain of seven, r 1.06 to 1.38, every gap on the ground 1.19 to 1.32 (islGapTo: along the line between middles, where
one's ground ends to where the next begins), first hop 1.25 off the west lip, the last nudged until the hop south onto
the bank is 1.30 (ravGapOut) without widening the gap behind it, the dare 1.69 off island 3 (two carrots, sc.initItems).
islField is the one shape (bumpy ring: r (1 + 0.1 sin 3θ + 0.06 sin 5θ)); islRing draws it: the top stays in the
ground's rows (its 0.4-inset ring is in the hole path, evenodd), brink band 0 to 0.5 inset and the lip line from
drawMtnBrink with the ravine's, the pillar's walls from drawRavWalls (the ring anticlockwise so they face out), inside
the ravine's clip, before the brink. isChasm is false on an island through sc.mtnIsle on onRock (engine.js): no shove,
h.safe set there. Tiles overlay: green on an island. Dials: M2.drop (x0, x1, wide, hwEnd, hwMid), the ravine's depth
(7, in m2Ravine), genIslands (r 1.0 to 1.4, gap 1.15 to 1.35, the dare's 1.6 to 1.75, clearances 0.7 and 1.1),
M2.islTop ('grass' or 'bare'), floor, earth, stoneAt. Open for Ross: the big flat black floor and the tall walls round
it, island size, grassy or bare (shipped as shown in the still: depth 7, as laid, grassy).
tests/stepping-path.js plays the chain end to end; tests/plates.js the plates. Test links: ?scene=mt2, ?mountain then key 1.

## The rise, where it stands (build 210)
The second screen of the fields, where f2 was: 86 tiles west to east and 30 deep, on the main game (sceneSize: W and H
are its own size in px while it's current; the drawing, drawMtn, is its own). f1's south way leads in at the
north-west corner; at the far end the pass leads south onto the stepping path (mt2; the wind shelf, mt1, retired in 213). The view: straight down at the west
end, pulling back (zoom 1.00 to 0.50 on a laptop, never under 20 px of hero) and tipping (0 to 54 degrees) evenly to
the foot. Wind as on f1 (the same gusts; tall grass leans ahead of each; cloud shadows).
Since 208 there are no walls of stone: the screen's edges hold, and east of its foot the mountain itself holds
(mtnHold, via clampTo), except within 2.2 tiles of the way through the pass. Three bottomless ravines (riseRavines,
from the screen's seed): the big one in from the north edge at x 16.5 down to the reeds, its tail boxed in reed clumps
on both banks; with the reed wall (x 20, the south 40%, nothing passes, fire included: no bar) it shuts the way east.
A slit edge to edge at x 40, a 1.0-tile running jump where the path crosses (keep 0.6 holds its line). A short thin
one in from the north at x 58. Two rabbits west of the big ravine; nothing stands in a ravine.
The look (Ross, through 208 to 210, rules in docs/design-rules.md): no floor or end in sight; the far walls lean toward
the middle of the view and slide as you walk; strata; grey stones set in from 1.5 tiles under the lip, a quarter of
each showing, a soil patch over the join; a faint tapering river at the bottom of the biggest; the brink (broken ground,
the lip line, a lighter rim) painted with the ravine before anything standing, the rows stopping at the field's 0.4
line; everything clipped to the land. Cost in the harness: 36 to 55 ms a frame by the ravines (no ravines: 11 to 15);
209 took out the stalls (no canvas read-back, a field grid for isChasm, the outline worked out on the way in).
Open: what opens the reeds, a line when you bump them, the seam with f1 (the rise's way in is at its far west, f1's
south opening wherever the seed put it), and if it still stutters on Ross's machine, flat wall colours plus one dark
wash (a still first).

## The editor (215, keys remade in 216; ?edit=<scene>, src/edit.js)
On a plates screen (one with LAYOUTS[id]: mt2, and flat, the empty board). The world stands still, the hero parked
at the way in, drawn faint. Arrows pan, the wheel zooms about the cursor, a drag on open ground pans; Q and Z (or
shift and the wheel) tilt the view (223, state.edit.p, to p 1.45); a drag with the middle button orbits it as Maya tumbles (224 turn, 229 tilt
too; shift and the middle pans; alt and left, middle, right tumble, pan, zoom: editCamDrag) (
state.edit.yaw, the camera's c.yaw: mtnProj turns the ground, mtnDepth is every draw key, platesOrder the plates'
order per turn); V resets tilt and turn; T tries it at the game's own view (never turned). Click selects (a
pit inside a plate before the plate, a seam by its line), drag moves (a plate takes its stack along), click on open
ground clears. L W D A B E pick what [ ] change: length (x, 0.2), width (y, 0.2), depth (thickness, 0.05), all three
scaled by a tenth (Ross's lwd), base (0.05; the plate then stands on nothing; a pit: its floor), ledge (a pit's); a
seam only has its width. R turns (rigidly since 223), U copies it (the same size and spot, stacked straight on it; a pit a tile over), Delete, N a plate under the cursor (on the
plate there), P a pit, C a crack (clicks lay its points, C ends; 231: the first click picks its layer, on the base a hairline, on a
layer a slit down to the base through everything under it, wider the deeper, a plate over it spanning it; [ ] its
layer), G a tunnel the same way (1.4 wide, roof 1.2: W, B, E), X the ravine brush (232: [ ] width, D [ ] depth, E [ ] slope; a drag cuts
a V ravine on the layer pressed on, 233), B the slab brush (227: [ ] set its reach, a circle at the cursor; a drag sweeps a strip,
previewed; release lays a 0.5 slab in that shape, kind 'brush' { pts, r } rebuilt from its stroke at every load by
brushOutline, selected with [ ] on its depth; the brush stays in hand, B puts it away; a stroke across a slab at the
level it lands on merges into it (228: the slab becomes a brush slab of its parts, strokes and plates, one outline, its
own thickness; wholly on a slab's top it stacks); L W scale its parts, A everything, E its reach, R turns them), T try it (the game runs; T parks you where you
stand). S copies src/layouts/<scene>.js to the clipboard (the save: paste it over that file, rebuild); O opens a
pasted one. One line at the bottom: the selected thing's numbers and the picked dimension; H opens the key sheet
(three columns), H closes it. A pit or tunnel crossing a slab's edge notches its outline (222: polyDiff; the notch's walls are faces). A pit cuts the plates standing on the base only: on open ground it does nothing yet
(a pit into the base is a build of its own, below). Labels: thickness in
the kind's colour (step green, hop yellow, high orange, face red). tests/edit.js drives editDown/editMove/editUp/
editWheel and the keys on mt2 and flat. Not in it yet: undo (O with the last S), snapping, multi-select.

What covers you (226, mountain.js): under a slab whose underside clears your head, or a tree's crown drawn after you,
a soft window (MTN_WIN 2.2 tiles, mtnWindow: the screen round you copied before the cover draws, laid back through a
radial mask); the x-ray only when boulders, crags or plates in front hide MTN_XRAY (0.7) of your box (state.mtn.cover);
trees, reeds and grass never; inside a G tunnel neither (unshown). boulderShape is the boulder's body for both.
tests/occlusion.js. Inside a pit's rim (225): ledges textured under PL_WASH, the floor darkest, one lip at the rim.

## Next task (on Opus unless marked: WAYS 7a)
The canyon (scene epic, 236; src/layouts/epic.js, EPIC in mountain.js): the stone's test screen, off the map
(?scene=epic, ?edit=epic), the mocks (docs/parked/mock-epic*.js) render it from the build. Climbable since 237: steps
of 0.5 to 0.8 against every face (layouts/epic.js 8 to 18; a held jump reaches about 1.0 at full vigor, less when
tired); you start at 28, 20. Drawn among plates by plateHeroKey (237): a plate with nothing south of your feet across
your body is behind you, so a long bent brush slab no longer paints over your head. The stone's look is in (235:
outlines roughRing'd with bites, plateWall, tops in the ground's colour with shoulder and broken lip baked in, the
contact and scree baked on the base, seamless stacks, occluded pit walls, tapering cracks, the V smoothed).
The ravine brush (232, X; plateRavine, PL_RAV) cuts a V (233: ravineH, E [ ] the slope): you slide in, a jump gets
out while the rim is within reach; drawRavineSlope draws it with depth (234).
A crack belongs to its layer (231, plateCrack, crackRing since 235). A brush stroke is traced once at release (230).
Plates paint as layers (229, platesOrder; tests/layers.js).
Ross, 6 and 7 Oct, the direction: the mountain feels empty and thin; think Grand Canyon and Everest; no 90-degree
angles, nature's lines; angled edges you slide into; things married to the environment, not stamps.
docs/mountain-beats.md: the mood arc and the three rules, to go into the docs once he takes them (o).
Since 238 the suite runs in about 160 s inside one tool call (tests step without drawing unless they read the screen;
the canyon built at its first visit; HANDOFF "Build, test, ship"). Since 239 you are drawn in front of what is behind
you next to a boulder or a step (drawMtn raises a stone south of you past you; plateHeroPick settles a plate conflict
by what hides less of you; tests/hero-order.js). Ross, 7 Oct, after 239 took over 30 minutes: the time was four
whole-canyon scans of 5 minutes each and sleeping minutes on background runs; the rules now in WAYS 7 and
PROJECT_INSTRUCTIONS (a diagnostic scan under 30 s on the spot in question, one whole-screen scan at the end, poll with
sleep 30).
NEXT, Opus, fresh chat: Ross picks from the list. If he has no pick, the audit's flag first: (cleanup 2) drawMtn is
161 lines since 239, over the 150 limit: move the plates' part (the base, the hero among a pit's layers, the hero's
key with plateHeroPick and the stones raised, the x-ray's shapes) into plates.js, no change in play, one build, Opus.
Open: (ai) the 7 wedged spots left by the canyon scan (you between a low plate in front and a taller one behind on the
screen: 32, 18.75 and 18.25, 21.25 show the x-ray): draw you in two parts, clipped between the plates, FABLE. (af) play
state set in draw code (woods-gremlins' ducking, spores-map's trapdoor only work when drawn: tests found it in 238;
move it into update), Opus. (ag) combat-rhythm's landing-shadow block never runs (no ride happens): delete it or make
a ride happen, Opus. (ae) tests/run.js in parallel on machines with more than one core (the container has one), Opus.
Parked: rise and mt2 land built lazily (about 50 s off the suite; not needed while it is under 3 minutes). (ac) the
outline's bites make small notches you can walk into, and a slab seen through a notch's sides can still overlap you;
watch in play, fewer bites on brush slabs if it shows (PL_ROUGH.bites), Opus. (x) the tops' tint and the bites as
Ross judges in play (PL_GROUND, PL_ROUGH), Opus. (y) the editor re-bakes the base texture on every plate move (its key
holds what stands on the base); watch for a stutter on a big screen, Opus. (u) the ravine tracer breaks past about 3
tiles of half-width (the rows go black), Opus. (s) the eye at 14, 20, 40 on the epic scene, a still, FABLE. (m) light
and slope on the ground, a still, Opus. (p) beat 0 (the ornithologist passes camp, the feather, Pip stays), FABLE.
(n) the looking-back ledge on the rise, Opus. (l) shadow under a slab you walk under, Opus. (j) m2 the Ledges laid
(mock-ledges.js), FABLE. (k) m3 the hush, FABLE. tests/plates.js 11 (the slope play) into its own file, Opus. (o)
docs/mountain-beats.md's rules into the docs once Ross takes them, Opus. Not built: plain plates merging when dragged
(Ross: brush only for now); a tunnel brush if he wants one.
Done this chat: ~~(ad) a fast test suite~~ (238), ~~(ah) clipping behind plates next to a boulder or a step~~ (239),
~~(aj) the waiting rules into WAYS and PROJECT_INSTRUCTIONS~~ (handoff after 239).
~~FABLE: 224 THE EDITOR'S CAMERA TURNS (yaw)~~ (224: a middle drag turns the view; HISTORY). Open from it: the
base's row colours run across the screen, not along the turned rows (grey screens only, invisible); the far range
and sky line (hz) still read the north edge.

~~(e) the cutout clean~~ (225: a pit's ledges textured under a depth wash, the floor darkest, one lip at the rim;
the stills in docs/parked/mock-pit-clean.js, with a cast-shadow look D Ross did not take).

~~(g) the occlusion split~~ (226: the window under slabs and crowns, the x-ray at 70 percent behind boulders, crags
and plates; tests/occlusion.js). Watch (g2): a 1.2 wall with you at its edge hides 73 percent, near the line; if it
flickers in play, MTN_XRAY 0.65 (Opus, one line).
~~(f) the slab brush~~ (227: B in the editor; kind 'brush' rebuilt from its points and radius; stacked where it lands;
tests/edit.js 15, plates.js 1b; HISTORY). ~~(f2) overlapping strokes merge~~ (228: into the slab crossed at the
level the stroke lands on, one outline of all its parts; HISTORY). Open from it: a stroke that closes on itself fills its hole (one outline;
a ring would need the hole as a hole); the raster is a quarter tile, so a reach under 0.3 is refused (PL_BRUSH.min);
undo is still O with the last S.

Then, from Ross's screenshot after 223 (his question "what looks off", answered in the chat; one build each):
~~(a) MOOT~~ (227 landed: tunnels and caves come from stacking brush slabs; the G tool stays for unshown passages).
Kept for the record: A tunnel's roof between layers: a 1.2 roof through 0.74 slabs cuts the second slab (0.74 to 1.48) whole, so it is
a trench open to the sky up to 1.48, not a tunnel under a roof at 1.2. Fix: E steps the roof between the layer
boundaries the strip crosses (the label shows the roof that will hold), or a slab straddling the roof is notched only
below it. Opus once Ross picks.
(b) The flat board's far edge is a hard line against the sky when tilted far: run the base out past the view or fade
it into the haze. Opus.
(c) Nothing shrinks with distance: the eye at 40 is nearly parallel, so tilted far the back slabs are as big as the
front ones (a diorama look). A real perspective for the tilted view (scale by distance along the view) is the fix;
whether play gets it too is Ross's call. FABLE.
(d) Stacked tiers of one thickness merge: tops one tone, faces one shade. Stills first: tops a touch lighter the
higher, or a dark contact line where a face meets the slab below. Opus.

FABLE: 225 LAYERED GROUND (numbered 216 when planned; 216 to 223 went to the editor's keys and the flat board, overhangs and the overlap order, the editor editing what it highlights, its key sheet, and tops painted by height: HISTORY). Faces settled in 221 (plain, the eye at 40). Tunnels built in 222. Waiting on Ross: where the pit into the ground goes. Also open, from Ross's question in 219: a PIT INTO THE GROUND (the base cut too: treat the base as a plate from floor to 0 for a pit with a floor under 0, its cut face and floor drawn under the ground's wash, the hero dropping in; one build, FABLE), to slot after layered ground or before, as Ross wants. 215 shipped the editor (section above). Where things stand after the plates chat (212 to 214, 2 Oct):
mt2 is the plates' test screen, grey, its close view following you (the eye over you), a staggered stack of four with
a pitfall punched to the base (floor on its far side, L-shaped ledges a hop apart up the south-west), a stack with a
1.2 face, a perch, a north-bank two-step, a seam; the islands' pillars solid; you hop and jump onto plates, drop off
edges, are drawn among a pit's layers (smaller the deeper), and the x-ray shows the covered part of you only. mt1 is
gone: the rise's pass leads onto mt2. Ross's calls for the editor (2 Oct): the hero parked where he stood, drawn faint;
the wheel zooms, [ ] set thickness (so a scroll never edits by accident). Both built in 215.
Cleanup list (one build each, when it suits): (1) mt2's draw cost, 15 ms in the harness: cache plateScreenBox and each
pit's projected rings per frame, skip heroHid's shapes unless a box meets yours first, plateTopAt for items and
creatures from a grid at a fifth of a tile (as the ravines' ravGrid). Opus. (2) drawMtn at 161 lines (over 150 since 239, the audit flags it): split the
plates' part (base, plates, the hero among a pit's layers, the x-ray) into plates.js. Opus.

FABLE: the mountain as PLATES (Ross, 2 Oct, a second design chat after 211; fifteen stills, no build). The look is
settled in docs/parked/mock-sheet-field.js (render it first: it writes quest-sheet-field.png at the game's zoom; present
every still with present_files). docs/mountain-plan.md's "Plates" section holds the rules. The plan, one build each:
- ~~212 THE PLATE~~ (212: as below, with these calls: the base plate is the ground's rows with the texture as a wash
  over them, run 8 tiles past the scene, in 8-tile chunks each cut to its own quad (a chunk from a source sub-rect
  showed a light seam); tops at 40 px a tile; mt2 close throughout at the still's view; the push-out only on screens
  with an eye, so the rise and mt1 are unchanged; every plate holds until 214). Was: as a stone kind (src/plates.js, before mountain in ORDER): outline from a seed (squarish superellipse,
  12 points, two rounds of corner-cutting, a small wobble: worn, not cut), a base and a thickness in tiles, breaks
  later. One shape for drawing and collision (plateHas). Drawn with the mountain's one projection (the tilt and zoom
  the rise has, then the eye's push-out from the screen's centre, 1 + z/14, linear so a tall stack never blows up; the
  ravines keep 14/(14+d), the same to first order). Faces: quads from the foot ring to the top ring on the edges that
  face the centre, ONE gradient per face straight down the screen (dark overhang band under the lip, lit stone,
  darker to the foot), the quad's facing only nudging brightness 0.5 to 1; strata as continuous rings with the
  ravine's wobble on anything over 0.3 thick; stones (drawJagged, clipped to their wall quad, a feathered wash of the
  wall's colour over the join) only on faces over 1.5. Tops: grit specks, short cracks and the odd long seam, lichen
  flakes, tone drift; then the ravine's brink (three strokes inside the edge, half the ravine's weight) and lip (a
  1.8 px dark line at 0.6 and a 1.2 px light rim at 0.3 above it) round the whole ring, so a step is never invisible.
  The base of a scene is one plate covering it, its surface the slope plus the generator's own bumps (shown by lean
  shading), the same top texture denser, loose stones lying on it. Pits: a hole through every plate above its floor,
  the tops cut at their own heights, ONE wall from the floor to the top lip with a line where each plate meets the
  next, lit by its own shade (0.8 to 0.96 whatever it faces), floor shaded darkest at the far foot, brink inside the
  lip. Cracks: a seam under half a tile wide (walls only over that), its tones all inside its own width (mid-dark,
  east half near black), painted on the base first and then on each plate's top after that top, clipped to it, so it
  jogs up every face and a plate nearer the eye hides it; a crack stops at a pit's rim. NOTHING of a hole or a crack is
  painted outside its lip; the brink belongs to the plate. Grey throughout: the mountain's ravines go grey too, with
  the hole lighting. Lights from the west. Ships with a test link (?scene=mt2 test layout) and tests/plates.js.
- ~~213 PLATES UNDERFOOT, mt1 RETIRED~~ (213, Ross 2 Oct, after looking at 212): the hero climbs the plates
  (plateStepHero: a step of 0.25 or less walks up, higher is a wall unless he is in the air at or above its top and
  lands on it; off an edge he drops to the ground below; h.lift is his ground, drawn on it and after the plate he
  stands on), the rest are still held off (plateHold) until 214; mt2's pit floor at 1.05 so a held jump climbs out;
  island tops whole (the plates' ground is painted before the ravine, so the brink pass fills their tops); the dark
  band at the neck's lip gone (the brink's ground and wash laid once, not once per ring); the wind shelf mt1 deleted
  (the rise's pass leads onto mt2; a save in mt1 loads in mt2; M1, its ledges, islands-on-pillars and the old cy/hw
  ravine code, mtnWalls, mtnFootCrags, tests/windshelf.js gone). Then in the same build, from two stills: solid pillars
  (lit by facing, one gradient fading into the drop, outermost first), the pitfall punched through a staggered stack to
  the base with L-shaped ledges a hop apart as the way out (platePit's ledge; each cut plate has its own ring, q.ring),
  the push-out capped at 3 tiles (no sky at mt2's east edge). A cave out of a pit is for m3, inside the mountain.
- ~~214 DOWN IN THE PIT, THE X-RAY~~ (214): smaller the further down (mtnPush in at()); down a pit you're drawn
  among its plates (before the ones above you: their tops and lips cover you, the x-ray shows you; only the hole's
  far walls leave your box out: PL_HERO, plateBehindHero); a faint copy of you and a dashed outline only where something drawn after you covers you (heroHid's shapes as
  a clip; state.mtn.xray); mt2's view follows you (fixed.follow), the eye over you; a pit's floor on its far side;
  your body (PL_BODY 0.35) against walls.
- ~~215 THE EDITOR~~ (215: as planned, with Ross's calls: the wheel zooms, [ ] thickness; the keys in "The editor"
  above; the layout is src/layouts/<scene>.js, LAYOUTS[id], read by plateLayout; plateStack gone (plateNext too, in 218);
  plate tops cached by seed and size).
- 225 LAYERED GROUND (the hero's part shipped in 213, the pit's near rim in 214, overhangs and the draw order where plates overlap in 217; left: the drop numbers, Pip and enemies on levels, the camera's lift, the cliff-in-front rule): ground height = the top of the highest plate at (x, y), from a grid at a fifth of a tile cached
  at enterScene; in the hero's move (one place, engine.js by mtnHold): rising more than a step is a wall unless he is
  in the air at or above the new top, a step is a walk, a drop more than a step puts him in the air at that height
  and he lands on whatever is below (a missed jump lands on the plate under; a pit is just a spot where that is several
  plates down); the camera's height follows his lifted ground. Draw order: plates by top height, standing things by
  y, and the cliff-in-front rule (a plate higher than your ground whose near edge is south of you is painted again
  over you). Enemies keep to one level; hawks fly over everything. Numbers proposed, Ross to confirm: step <= 0.25,
  hop 0.25 to 0.5 (a tap clears it unless tired), high hop 0.5 to 1 (a held jump at the start, a tap by vigor 20),
  face > 1, m2's walls >= 2.5 (past any jump); drops under 1.5 a puff, 1.5 to 3 a stagger, over 3 a heart. Measured:
  tap 0.56 / held 0.95 at start, 0.94 / 1.5 at vigor 20, tired 0.2 / 0.34.
- 226 STACKS: a stack from a foot plate up, each shifted along a lean and a little smaller (the mock's stack()), kinds
  by list; laid so stacks sit a tile and a half to two apart at a like height for the jumps between them.
- 227 m2 the ledges laid in the editor by Ross (the stepping path's drop, islands and dare deleted; genIslands stays
  for m1); 228 m1 the climb laid in the editor with the generator's grain by leg (a new scene between the rise and mt2),
  the arc camera with the 14 px floor for real, the three ravines and islands, hawks circling only; 229+ m3 (a pit into it as one way in).
Open calls (Ross): faces north only or both sides (the eye over the hero shows faces north of him, lips south, as the
ravines show far walls); m2 close throughout (my call: close; m1's crest is the glimpse); grain by leg (my call: leg 1
a sheet every 20 tiles to leg 5 every 3, all steps); the numbers above; gust rides leaving m1; the editor's keys.
Next: 216 layered ground (above). The editor is in: Ross can lay mt2's plates himself now (?edit=mt2, S, paste over
src/layouts/mt2.js, node tools/build.js).
Also waiting on Ross: his hand-adjusted stills of the climb screens (delivered as quest-b207-stills.zip).
Ross's answers to the six questions are in docs/mountain-plan.md (Ross's answers, 1 Oct).

Ross's roadmap (1 Oct). Measured before writing: Pip's river lesson comes at +26 s (boulder) and +38 s (loosen) after
the last loose stone, and the stuck stone is locked until his loosen line (pullLocked, 'early'), so until then the
boulder can't be broken; walk off mid-visit and he calls "Over here!" for good. The slot flash only fires when Pip's
words match flashFor's keywords (acorn throw, eat, marsh fire, swing/lunge/slash/pound). Vigor refills about 0.47 a
second after 1.2 s rest (empty to full in about 17 s at 8). Fainting keeps everything; saving is menu only.
1. ~~Hammocks (195), groundShadow (197), borrowing Pip's hammock (198), genWorld split (199), hawk timer (200), the
   climb's dials (201).~~
2. ~~The climb joined (203), f3 to f7 retired (204).~~ Still open: state-owners move 8 (climbReturn behind one
   startClimb, or gone with the test rows), with 211 when climb.js goes. Gust rides to a ledge (rideGust, windTarget,
   layoutLedges) live only on f1 for now; ledge-to-ledge rides come back with m1.
3. The mountain: the rise and the climb as one family (Ross, 1 Oct), docs/mountain-plan.md. New scenes first: Ross
   expected to see the reimagined flow, and 205 and 206 were groundwork. ~~205 the reeds hold~~ (205), ~~206 the
   generator~~ (206: rise.js became mountain.js, no change in play), ~~207 m1 the wind shelf~~ (207, scene mt1).
   ~~208 the rise reworked~~ (208: bottomless ravines from a generator, the
   big one plus the reeds as the boundary, no walls of stone), ~~209 the rise runs smooth~~ (209), ~~210 the brink on the ground~~
   (210), ~~211 m2 the stepping path~~ (211). Reimagined 2 Oct (see Next task): sheets, m1 the climb, m2 the ledges,
   then m3 inside, m4, m5 and
   carrot juice (climb.js deleted), 215 hawks hunt rabbits and the ornithologist's eggs, 216 the tortoise's hollow and
   peach stones, 217 trees, 218 the windmill (Opus), 219 direction by seed; all FABLE but 218. The wind by height ships whenever Ross
   OKs the mockup (patch in docs/parked, Opus). Until the reeds open, all real play stays west of them.
4. River lesson: Pip at the boulder within 7 s of the last loose stone, boulder and loosen lines as one visit, the
   stuck stone never locked for good, a real-play test (no pipTips shortcut). Opus.
5. Slot flash: Pip's lines name their slot outright instead of flashFor's keyword guessing. Opus.
6. Pip 30% calmer: walk x0.7 (PIP_PACE), lines and PIP_GAP x1.3, lessons exempt from the gap; reword the design rule
   "about half your speed". Opus.
7. Vigor experiment: a Testing row for regen x1, x0.5, x0.25 and food only. Opus.
8. Status effects above the vigor bar: one icon per buff or debuff; it starts fully shaded and a clockwise sweep
   from 12 o'clock turns it translucent as time runs out (replaces the bars under the slots). Restated to Ross;
   build once he confirms. Opus.
9. Quick craft: hold one key, a ring of what you can make now from what you carry (known recipes), pick and release:
   two or three presses, time slows rather than pausing. Materials and consumables stack; tools and weapons don't,
   each its own durability, growing with crafting level, mats applied and worn gear (one rule with sword levels).
   Restated to Ross; build once he confirms. FABLE.
10. Camp chain: tinder becomes twigs (two sticks); stones placed, twigs in, Pip lights it after a couple of sparks;
   glue from carrot, turnip and rabbit fluff (so the bench waits on a harvest); bench from glue, sticks and twigs.
   FABLE, after 9.
11. Compost: 3 acorns on the mat make compost for patches; advanced compost from compost, twigs and root mash; ash
   from the fire; volcanic soil with the mountain. Opus, after 10.
12. Sword chain: meet Wick at the gleaming pool (his sign already sends you there); the sword's brambles only burn
   (fire first; the wooden sword can't); a torch from camp is the suggestion; the sword opens the mountain's thick
   growth; upgrades with mats cut what swamp fire won't burn (the rise's reed wall), change the blade's look and keep
   its rust. Reorders the story: a written plan for Ross first. FABLE.
13. Sword levels: each blade kind levels with use; levels plus achievements make the total, which unlocks ability
   upgrades (SKILLS). FABLE, after 12.
14. Mushroom checkpoints: revive and save at mushrooms; mats picked up since the last one are lost on fainting (a
   big step up in harshness: Ross's call first). FABLE.
15. Light maze in the Hollow: paths show only where light falls; light sources reveal the way. FABLE, design first.
16. World breadth (the mountain itself is item 3): river scenes, a river dungeon, strong roaming enemies, weather, day and night
   animals. FABLE, one at a time, after the climb.
17. Efficiency, only if frame times climb: a spatial grid for collision and claims, more pre-painted layers on the
   rise. Opus.
The cleanup list (Ross, 30 Sep) is done: docs/state-owners.md moves 1 to 7, 9 and 11 shipped as builds 186 to 193,
each with every test's output identical before and after and the draw-record hash unchanged (WAYS 5). Move 8
(startClimb) is parked with the climb below. 162 state fields to 158.

The climb: CLIMB_TUNE and CLIMB_SPECS (build 201) hold every number; change one and the screen follows. The dead
painter bits (crag() inside paintClimb, an if (false) mountain), zig's unused band and climbBand are gone; the green
past the ravine is CLIMB_TUNE.ledge (12). Joining it is item 2 (builds 203 and 204); until then it runs from the test links only.
