# Quest: handoff (build 206, 1 Oct 2026)
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
  seed 1000003, TEST_MODE on). 67 tests, one after another, about 2 minutes in the container. Each prints `errs N`;
  0 is a pass (robin-drop prints none and passes). While working, run only the ones you touch: `node tests/<name>.js`.
  `node tools/overlap.js` checks 300 worlds for overlapping things (want 0).
- Ship: `node tools/ship-local.js NN "Build NN: ..." [scene]` bumps BUILD, builds, stops if `node tools/dead.js` lists
  an unused top-level name (delete it, or mark it `// keep: <reason>`), runs every test and the overlap check, stopping
  at the first failure, then, with `--zip` (it needs the zip command), packages /mnt/user-data/outputs/quest-bNN.zip
  (older ones removed; what goes in is PACK in ship-local.js) and prints the commit line and links (tools/links.js).
  Without --zip it prints the line for a working tree already at ~\quest (tools/links.js --local); not used now.
- On the Mac (Ross uses it now and then; he says which machine), give the zsh line above the printed one:
  `cd ~/quest && unzip -o ~/Downloads/quest-bNN.zip -d . && rm ~/Downloads/quest-bNN.zip && git add -A && git commit
  -m "..." && git push` (the Mac clone pushes as worthcreation@; if Safari unzipped it, rsync the folder instead).
- The reply that ships ends with the printed line (Windows PowerShell, in a ```powershell block): `cd ~\quest
  -ErrorAction Stop; Expand-Archive -Force ~\Downloads\quest-bNN.zip .; Remove-Item ~\Downloads\quest-bNN.zip; git
  add -A; git commit -m "Build NN: ..."; git push`, and every play-test link.
- Audit: `node tools/audit.js` (about 6 s; WAYS 5) at the start of a cleanup chat and at every handoff; `--save` at a
  handoff updates docs/audit-baseline.json. Last run (build 210): audit: 11461 lines, 0 unused, 0 functions over 150, 0 repeats, 160 state fields, frames avg 0.69 ms (2 slow, 0 errors); the slow ones are a climb screen's draw and the rise's (the ravines).
- Model: the first line of every reply says FABLE or Opus (WAYS 7a); a Fable task on Opus stops until Ross switches
  in the model menu.
- Handoff (end of a chat, or when Ross says "handoff"): HANDOFF's current state and Next task, `node tools/audit.js
  --save` with its line copied in, PROJECT_INSTRUCTIONS.md to match, docs/design-rules.md's Story so far if the story
  changed, docs/PROJECT_DESCRIPTION.md only if the mood,
  theme or direction changed. The handoff reply ends with three things: the full PROJECT_INSTRUCTIONS.md text in a
  code block only if it changed (Ross pastes it into the Project settings), else "PROJECT_INSTRUCTIONS unchanged";
  the model the next chat starts on and why, then the exact first message for the next chat in a code block, opening
  with that model (Ross picks it in the model menu before sending); and any files to delete by hand in ~\quest.
- Render (only when asked): `B<NN>=1 node tools/shot.js` runs the render block for that build and writes PNGs to /tmp
  (on Windows node that's C:\tmp, which must exist). MOCK4=1 is the mountainside still (it and tools/render.js still
  write to /mnt/user-data/outputs, a container path: repoint before use); B139/B150/B154 are the climb screens; B165 is
  the rise (eight spots: the way in, along it by the ravines, the way out; plus the tiles; SW=390 SH=844 for a phone).
- Links (every reply that ships gives all of them, as tools/links.js prints them; that file is the one list): `?seed=N` (a fresh 7-digit prime each build; the jetty opening), `?arena`,
  `?puzzle`, `?mountain` (climb1 to climb5; keys 1-5 jump between them, 0 to the first field, [ ] and - = tune the
  shadow), `?scene=<id>` (start on any screen id in MAP_LAYOUT, rise included, or climb1-climb5; there is no f2 now), `?overview=N` (the same world as
  one map; bare ?overview for a random one), `?model` (the drawn hero outside the arena). Any of them combine with
  &seed=N. If a link is added, renamed or removed in src/, change this list in the same build.

## File map (src/, in load order)
- world.js      world generation: genWorld calls one function per region (genCamp to genHollow, in rng order), then
                the tail; solids, exits, barriers, crag(), pullable(), MAP_LAYOUT/MAP_NAMES, SHROOM_NAMES, the
                cellar; genField is the first field only (f1)
- highlands.js  the High Reaches (hr1-hr3): enterHighlands (title card, vista birds), vistas, hawks, mantises,
                crystal bugs, worms, the red beetle
- climb.js      the climb screens (climb2-climb5; climb1 became mt1 in 207): CLIMB_TUNE and CLIMB_SPECS (every number, to dial in), climbScreen
                (spec to CLIMBS[id]), trail and gap-field painters, side view, wind,
                shadow aim (SHADOW), tile overlay, test links (MOUNTAIN, START_SCENE, testHops)
- mountain.js   the mountain family's generator (build 206, docs/mountain-plan.md). MTN (specs by scene id; RISE the rise's,
                M1 the wind shelf's (scene mt1, 207): size, foot, pathY, pathD, layout, scene, finish). Ravines (208): a
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
  a pass at the far end onto the wind shelf mt1, 207), mt1 (the same shape of screen: in at the north-west corner,
  the ravine along the way, a pass south at the far end onto mt2), mt2 the stepping path (fixed view, the whole
  screen at once: islands across a wall-to-wall drop, a pass south onto climb3, 211), the climb climb3 to climb5 (climb.js, its own
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
acorn-skill arena book-tiles camp-patch camp-talk camp-tour climb combat-crops combat-rhythm craft-sections crafting
fluff garden-robin garden gather-skill gathering growth-gusts-shroom gusts heavy-stone high-reaches hole homecoming
hud-banners intro-wander lanes ledge-ride lesson opening pack patch-hints pickup-sparkles
pip-ahead pip-bounce pip-brambles pip-leading pip-post pip-teaches place-tag plot-tips puzzles quests rabbits reminders rise riverbank
robin-drop robin-home rocks-banners scene-smoke slots smoke speech spores-map stepping-stones sticks-trees stones rise-ravines reeds-hold windshelf
text-layout tips-prompts tour wind-rocks wood-sword woods-gremlins woods. scene-smoke visits every screen with every
creature woken from a stun (it would have caught the High Reaches freeze).

## The climb, where it stands (tune with ?mountain)
1 The wind trail: remade as the wind shelf, mt1 (207, below; it still has its own cy/hw ravine with a floor and its
walls of stone, untouched by 208 to 210). 2 Stepping stones: round islands in a wide ravine.
3 The broken meadow: rifts across the way, chasms, a short ravine (gap field). 4 The windy crossing: rifts with bare
islands, big rocks to shelter behind; gusts drive you back to screen 3. 5 The last ledges: a side view.
Your shadow is the aim (it leads toward the landing, small at the top of a jump). Ross, 1 Oct: the islands are hard
to read without the tiles turned on: on the remade screens islands are at least 2 tiles across; the perspective stays. Open green for now (CLIMB_TUNE.ledge 12, no
crags); worn out restarts the screen. Open questions: final look, how the screens join the world, crags or not.

## The wind shelf, mt1 (build 207)
Out of the rise's pass, 64 x 30 tiles, the rise's kind of screen (in at the north-west corner, moving camera, a pass
south at the far end, onto mt2). Not yet on 208's ravine generator (its own build). M1.rav is the ravine: x 5 to 48, cy wanders, hw 2.5 (5 across)
narrowing to 0.65 (a 1.3-tile jump) at x 13, 25, 36 so the path zigzags bank to bank (M1.side), widening to 3.5 at
x 42 where an island (r 1.0, on a pillar) sits between a ledge on each bank: rides only (gaps 2.5). Ledge pairs at
x 19 and 30.5 for strong-gust rides; sc.rocks hold them (ledge: true; island: true for the pillar). A jump carries
2.2 tiles at vigor 8 (jumpReach), so a crossing wants the jump within 0.9 of the lip; isChasm is a point test.
Three hares (MONSTERS.hare: r 0.58, hp 3, drawSnarl), two carrots and an acorn on the island (sc.initItems).
Dials: rav.hw (wide 2.5, the 1.85 drop at crossings), cross, island, floor, earth, stoneAt, dx 0.5, fine 6.

## The stepping path, mt2 (build 211)
Out of the wind shelf's pass, 40 x 24, a fixed screen (M2.fixed { p: 0.55 }: the whole screen in view at zoom
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
tests/windshelf.js plays it end to end. Test links: ?scene=mt1, ?mountain then key 1.

## The rise, where it stands (build 210)
The second screen of the fields, where f2 was: 86 tiles west to east and 30 deep, on the main game (sceneSize: W and H
are its own size in px while it's current; the drawing, drawMtn, is its own). f1's south way leads in at the
north-west corner; at the far end the pass leads south onto the wind shelf (mt1). The view: straight down at the west
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

## Next task (on Opus unless marked: WAYS 7a)
FABLE: 212 m3 inside the mountain (scene mt3), moving camera: rifts that crack open ahead of you (the climb's climb3
pieces: rifts, holes, slants, a narrow place), a hidden area; on the generator (mountain.js: a spec in MTN, ravines
from genRavine or laid by hand as m2Ravine does, nothing walled with stones, the edges and mtnHold hold); in from
mt2's pass (M2.finish's south exit, now to climb3), out south onto climb4; remove climb3 from CLIMB_SPECS, world.js's
climb list, MAP_LAYOUT (mt3: [4, 7]), MAP_NAMES, tests/climb.js's 3, HISTORY, mountain-plan, design-rules story; a
still first, then a test played like a person (tests/stepping-path.js is the pattern). m1 (mt1) is still on the old
cy/hw ravine with walls of stone; its move to the 208 generator is its own build. Ross's three open calls on m2 (the
big flat floor and the walls' height, island size, grassy or bare) still stand: dials listed under The stepping path.
Also waiting on Ross: his hand-adjusted stills of the climb screens (he asked for stills of the rise and every climb
screen at the start of the 208 chat; those were delivered as quest-b207-stills.zip). When they come, they set the look
for m2 onward; read them before the m2 still.
Parked from 208 (Ross's call later): spider ravines and round pits (genRavine has 'spider'; 'round' was deleted), very
large wall stones, the brink band over a prop standing at a lip (props keep a third of a tile clear; widen if it shows).

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
   (210), ~~211 m2 the stepping path~~ (211). NEXT: 212 m3 inside, 213 m4, 214 m5 and
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
