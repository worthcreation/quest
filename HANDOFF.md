# Quest: handoff (build 198, 30 Sep 2026)
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
  seed 1000003, TEST_MODE on). 65 tests, one after another, about 2 minutes in the container. Each prints `errs N`;
  0 is a pass (robin-drop prints none and passes). While working, run only the ones you touch: `node tests/<name>.js`.
  `node tools/overlap.js` checks 300 worlds for overlapping things (want 0).
- Ship: `node tools/ship-local.js NN "Build NN: ..." [scene]` bumps BUILD, builds, stops if `node tools/dead.js` lists
  an unused top-level name (delete it, or mark it `// keep: <reason>`), runs every test and the overlap check, stopping
  at the first failure, then, with `--zip` (it needs the zip command), packages /mnt/user-data/outputs/quest-bNN.zip
  (older ones removed; what goes in is PACK in ship-local.js) and prints the commit line and links (tools/links.js).
  Without --zip it prints the line for a working tree already at ~\quest (tools/links.js --local); not used now.
- The reply that ships ends with the printed line (Windows PowerShell, in a ```powershell block): `cd ~\quest
  -ErrorAction Stop; Expand-Archive -Force ~\Downloads\quest-bNN.zip .; Remove-Item ~\Downloads\quest-bNN.zip; git
  add -A; git commit -m "Build NN: ..."; git push`, and every play-test link.
- Audit: `node tools/audit.js` (about 6 s; WAYS 5) at the start of a cleanup chat and at every handoff; `--save` at a
  handoff updates docs/audit-baseline.json. Last run (build 198): audit: 11188 lines, 0 unused, 1 functions over 150,
  0 repeats, 160 state fields (hammock and pipIn since 195), frames avg 0.49 ms (1 slow, 0 errors). Frame times swing with
  machine load (1.0 ms on the build 174 run): read a change there only if it's large or on one screen.
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
  the rise (seven spots: the way in, along it, the way out; plus the tiles; SW=390 SH=844 for a phone).
- Links (every reply that ships gives all of them, as tools/links.js prints them; that file is the one list): `?seed=N` (a fresh 7-digit prime each build; the jetty opening), `?arena`,
  `?puzzle`, `?mountain` (climb1 to climb5; keys 1-5 jump between them, 0 to the first field, [ ] and - = tune the
  shadow), `?scene=<id>` (start on any screen id in MAP_LAYOUT, rise included, or climb1-climb5; there is no f2 now), `?overview=N` (the same world as
  one map; bare ?overview for a random one), `?model` (the drawn hero outside the arena). Any of them combine with
  &seed=N. If a link is added, renamed or removed in src/, change this list in the same build.

## File map (src/, in load order)
- world.js      world generation: genWorld calls one function per region (genCamp to genHollow, in rng order), then
                the tail; solids, exits, barriers, crag(), pullable(), corridorSpan and
                fitToCorridor (mountain path), MAP_LAYOUT/MAP_NAMES, SHROOM_NAMES, the cellar
- highlands.js  the High Reaches (hr1-hr3): enterHighlands (title card, vista birds), vistas, hawks, mantises,
                crystal bugs, worms, the red beetle
- climb.js      the climb screens (climb1-climb5): CLIMBS table, trail and gap-field painters, side view, wind,
                shadow aim (SHADOW), tile overlay, test links (MOUNTAIN, START_SCENE, testHops)
- rise.js       the rise (id 'rise', where f2 was): RISE table, riseH (height), riseHalf (the way's half-width,
                growing with the view), riseLand (ground rows and props, laid out once in tiles), addRise (builds the
                scene with the world: solids, the reeds, two rabbits, exits to f1 and f3), sceneSize (a scene's size
                in px: the rise's own, every other the screen), riseCamera, riseView/riseZoom/riseProj, riseToScreen
                (toScreen on the rise), drawRise (ground rows, then everything standing drawn by the game's own code
                at its spot, scaled), riseCragSprite (16 crag pictures, painted once), drawRiseTiles
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
  a pass at the far end into f3), then the windy fields
  f3 to f7 (f3-f6 are the mountain path: rock one side, a drop with islands the other),
  then east to the crags peak1-peak3 and the High Reaches hr1-hr3, stepping up and to the right.
- Caves c1-c7 in a column to the east, out to fallsbank, the marsh m1-m3, the hollow h1-h3, the swamp sw1-sw3.
- climb1-climb5 exist but are not joined to the map yet (test links and System > Testing only).

## Conventions
- The design rules and story so far are in docs/design-rules.md; what follows are the code-side conventions.
- Pip and NPC lines hold until F; tutorial lines are free. One alert style: scrolls. Banners only for quest start/end.
- Anything the player gains shows in the pack (Gear lists keepsakes and plans).
- Stones: rough ones are drawJagged with the zigzag soil line; throwing stones are lumpy drawRock with a seed that
  stays with the stone (ground, arms, air, landing).
- Collision and drawing share one shape function (chasmSpan, corridorSpan, gap(x, z)); never draw an edge the game
  doesn't test.
- Anything that takes over update() (state.rapids, state.climb) handles its own death, menus and text.
- Pip speaks only through pipLine (hold: true waits for F) or pipSay (once-only). Where Pip is on a screen is decided
  in one place, pipArrive (enterScene and updatePip): on his post (pipPost: the garden, or state.pipAhead after a tour
  lead with to:) he stays; elsewhere he's out of sight and comes back in from an edge after 4 s (pipBackIn).
- Rounded boxes: rounded(x, y, w, h, r). Exits: exitToward(sc, goal), exitPoint(ex).

## Tests (tests/, by topic)
acorn-skill arena book-tiles camp-patch camp-talk camp-tour climb combat-crops combat-rhythm craft-sections crafting
fluff garden-robin garden gather-skill gathering growth-gusts-shroom gusts heavy-stone high-reaches hole homecoming
hud-banners intro-wander lanes ledge-ride lesson misc-51 mountain-side opening pack patch-hints pickup-sparkles
pip-ahead pip-bounce pip-brambles pip-leading pip-post pip-teaches place-tag plot-tips puzzles quests rabbits reminders rise riverbank
robin-drop robin-home rocks-banners scene-smoke slots smoke speech spores-map stepping-stones sticks-trees stones
text-layout tips-prompts tour wind-rocks wood-sword woods-gremlins woods. scene-smoke visits every screen with every
creature woken from a stun (it would have caught the High Reaches freeze).

## The climb, where it stands (tune with ?mountain)
1 The wind trail: a winding ravine, cross at narrow points. 2 Stepping stones: round islands in a wide ravine.
3 The broken meadow: rifts across the way, chasms, a short ravine (gap field). 4 The windy crossing: rifts with bare
islands, big rocks to shelter behind; gusts drive you back to screen 3. 5 The last ledges: a side view.
Your shadow is the aim (it leads toward the landing, small at the top of a jump). Open green for now (climbBand 12, no
crags); worn out restarts the screen. Open questions: final look, how the screens join the world, crags or not.

## The rise, where it stands (build 171)
The second screen of the fields, where f2 was: 86 tiles west to east and 30 deep. In and out as the map lays them:
f1's south way leads in at the north-west corner (x 4, a short way down between the west wall and a corner wall to
the path); at the far end the pass turns south between crag walls (x 78 to 84) and leads down into f3 (and back). It runs on the main game:
while it's the current scene, W and H are its own size in px (sceneSize; update() and enterScene() set them, drawing
and the HUD use the screen, SW and SH, and L() walks at the screen's pace), so the hero, Pip, the rabbits, items, fire,
the tutorial coach and saving are the usual code. Only the drawing is its own (drawRise): the ground in rows, then
everything standing drawn by the game's own draw code at its spot on the tipped ground, scaled with the view;
toScreen projects on the rise, so speech and hints sit right. The overview draws it as a flat thumbnail.
The view: straight down at the west end; walking east it pulls back (zoom 1.00 to 0.50 on a laptop, 0.72 on a phone:
never under 20 px of hero) and tips (0 to 54 degrees) evenly to the foot, looking a little ahead. The stone walls
widen with it: 14 tiles apart by the fields, 30 at the foot (riseHalf). Crags line the foot and two unbroken walls
line the pass. No ground lines for now (contours and haze out; Ross will add flair later); the worn path stays.
Wind as on f1: the same gusts (sc.gusts copied from f1), so you, Pip and loose fluff are nudged and shoved just as
there; five clumps of tall grass lean ahead of each gust; cloud shadows drift (4 per screen's worth of ground, 33).
No ledges to ride to: a jump into the strong gust is just a jump.
Two rabbits in the first stretch (the camp's fluff), with 9 stones and trees to duck behind. At x 20, just past a
tree at x 18, a wall of reeds crosses the way wall to wall. For now nothing gets through it, fire included (the
clumps have no bar; reedwall: true). To open it to fire later, give each clump bar: 'risereeds' (burning gas breaks
reeds with a bar). Past it is out of reach for now, and with it f3 onward from this side.
Draws at about 7 to 10 ms a frame in the node renderer (a field screen is about 3 to 4).
Open: what opens the reeds, their look (the marsh's dark bulrushes; straw-dry would suit a field), a line when you
bump them, f2's two island pickups (a stick or an acorn each), which the rise doesn't have, and continuity at the
seams: the rise's way in is at its far west and its way out at its far east, while f1's south opening and f3's north
opening sit wherever the seed put them (moving them to the matching side means regenerating those edge walls).

## Next task (on Opus unless marked: WAYS 7a)
Ross's roadmap (1 Oct). Measured before writing: Pip's river lesson comes at +26 s (boulder) and +38 s (loosen) after
the last loose stone, and the stuck stone is locked until his loosen line (pullLocked, 'early'), so until then the
boulder can't be broken; walk off mid-visit and he calls "Over here!" for good. The slot flash only fires when Pip's
words match flashFor's keywords (acorn throw, eat, marsh fire, swing/lunge/slash/pound). Vigor refills about 0.47 a
second after 1.2 s rest (empty to full in about 17 s at 8). Fainting keeps everything; saving is menu only.
1. ~~Hammocks (195), groundShadow (197), borrowing Pip's hammock (198), genWorld split (199), hawk timer (200).~~
2. River lesson: Pip at the boulder within 7 s of the last loose stone, boulder and loosen lines as one visit, the
   stuck stone never locked for good, a real-play test (no pipTips shortcut). NEXT. Opus.
3. Slot flash: Pip's lines name their slot outright instead of flashFor's keyword guessing. Opus.
4. Pip 30% calmer: walk x0.7 (PIP_PACE), lines and PIP_GAP x1.3, lessons exempt from the gap; reword the design rule
   "about half your speed". Opus.
5. Vigor experiment: a Testing row for regen x1, x0.5, x0.25 and food only. Opus.
6. Status effects above the vigor bar: one icon per buff or debuff; it starts fully shaded and a clockwise sweep
   from 12 o'clock turns it translucent as time runs out (replaces the bars under the slots). Restated to Ross;
   build once he confirms. Opus.
7. Camp chain: tinder becomes twigs (two sticks); stones placed, twigs in, Pip lights it after a couple of sparks;
   glue from carrot, turnip and rabbit fluff (so the bench waits on a harvest); bench from glue, sticks and twigs.
   FABLE (recipes, tutorial, quests, tests).
8. Compost: 3 acorns on the mat make compost for patches; advanced compost from compost, twigs and root mash; ash from
   the fire; volcanic soil with the mountain. Opus, after 7.
9. Sword chain: meet Wick at the gleaming pool (his sign already sends you there); the sword's brambles only burn
   (fire first; the wooden sword can't); a torch from camp is the suggestion; the sword opens the mountain's thick
   growth; upgrades with mats cut what swamp fire won't burn (the rise's reed wall), change the blade's look and keep
   its rust. Reorders the story: a written plan for Ross first. FABLE.
10. Sword levels: each blade kind levels with use; levels plus achievements make the total, which unlocks ability
   upgrades (SKILLS). FABLE, after 9.
11. Mushroom checkpoints: revive and save at mushrooms; mats picked up since the last one are lost on fainting (a
   big step up in harshness: Ross's call first). FABLE.
12. Light maze in the Hollow: paths show only where light falls; light sources reveal the way. FABLE, design first.
13. World breadth: mountain and river scenes, a river dungeon, strong roaming enemies, weather, day and night
   animals. FABLE, one at a time, after the climb.
14. Efficiency, only if frame times climb: a spatial grid for collision and claims, more pre-painted layers on the
   rise. Opus.
15. The climb. Parked: Ross's design call (below). FABLE, fresh chat.
The cleanup list (Ross, 30 Sep) is done: docs/state-owners.md moves 1 to 7, 9 and 11 shipped as builds 186 to 193,
each with every test's output identical before and after and the draw-record hash unchanged (WAYS 5). Move 8
(startClimb) is parked with the climb below. 162 state fields to 158.

The climb screens stay in testing exactly as they are (Ross, 29 Sep: still being designed; not joined to the world
yet). When he's ready (FABLE): which of climb1 to climb5 to keep, where they join (between the windy fields and the
crags), retiring the f3-f6 mountain-path screens, the crag() painter in paintClimb and climbBand fixed at 12, and
state-owners move 8 (climbReturn behind one startClimb, or gone with the test rows). Don't touch the climb unasked.
