# Quest: handoff (build 169, 29 Sep 2026)
Current state only. What changed build by build is in docs/HISTORY.md (newest first). How we work is in
QUEST_WAYS_OF_WORKING.md. Read both before touching anything.

## Build, test, ship
- Build: `sh build.sh` concatenates src/head.html and the files in src/ORDER into index.html, then checks the script
  parses (fails the build if not). BUILD number: `const BUILD` in src/draw.js (shown bottom-right in game).
- Test: `node tests/run.js` runs every tests/*.js through tests/harness.js (fake canvas, seeded Math.random, world
  seed 1000003, TEST_MODE on). 64 tests, about 2 minutes, one call. Each prints `errs N`; 0 is a pass
  (robin-drop prints none and passes).
  `node tests/<name>.js` runs one. `node tools/overlap.js` checks 300 worlds for overlapping things (want 0).
- Render: `B<NN>=1 node tools/shot.js` runs the render block for that build and writes PNGs to /tmp. MOCK4=1 is the
  mountainside still; B139/B150/B154 are the climb screens; B165 is the rise (seven spots along it, plus the tiles;
  SW=390 SH=844 for a phone).
- Ship (Windows PowerShell, shown in a ```powershell block): one download quest-bNN.zip laid out like the repo root, then
  `cd ~\quest -ErrorAction Stop; Expand-Archive -Force ~\Downloads\quest-bNN.zip .; Remove-Item ~\Downloads\quest-bNN.zip; git add -A; git commit -m "Build NN: ..."; git push`
- Links (every reply that ships gives all of them, full URLs on https://worthcreation.github.io/quest/, each checked
  against the source that build): `?seed=N` (a fresh 7-digit prime each build; the jetty opening), `?arena`,
  `?puzzle`, `?mountain` (climb1 to climb5; keys 1-5 jump between them, 0 to the first field, [ ] and - = tune the
  shadow), `?scene=<id>` (start on any screen id in MAP_LAYOUT, rise included, or climb1-climb5; there is no f2 now), `?overview=N` (the same world as
  one map; bare ?overview for a random one), `?model` (the drawn hero outside the arena). Any of them combine with
  &seed=N. If a link is added, renamed or removed in src/, change this list in the same build.

## File map (src/, in load order)
- world.js      world generation: every screen, solids, exits, barriers, crag(), pullable(), corridorSpan and
                fitToCorridor (mountain path), MAP_LAYOUT/MAP_NAMES, SHROOM_NAMES, the cellar
- highlands.js  the High Reaches (hr1-hr3): vistas, hawks, mantises, crystal bugs, worms, the red beetle
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
- cutscenes.js  dusk, abduction, sword reveal, spore homecoming, rescue, ending
- menu.js       the pack (icon belt, tabs, Map as pages of places, Status, System, Testing rows)
- save.js       saves, settings, migrations
- craft.js      camp building, RECIPES, the craft mat, STORY, campBuilt
- quests.js     QUESTS, updateQuests, storyAt, the quest HUD and log
- gear.js       slots and lanes (SLOT_KEYS, useSlot, flashSlot), FOOD, blades, wearables, plantHere (the one plant
                path; interact's patch menu calls it), heroColor
- skills.js     SKILLS, skillUse, SKILL_INFO
- draw.js       world drawing: ground, solids, crags, ravines (drawBrokenChasm), mountain sides, hero, Pip (drawPip),
                enemies, items, drawJagged, drawRock, drawSoilLine (and soilLinePts, its points), BUILD
- draw-ui.js    HUD (bottom-right), the place tag (top-left: screen id and seed, and under it your position in tiles;
                placeTag/placeCoords/drawPlaceTag, each line toggled in System), scrolls, speech boxes, titles, the pack, the creator screen, begin(), the loop
- draw-hero.js  the drawn hero model (arena and &model only)
- arena.js / puzzles.js  ?arena and ?puzzle
- boot.js       startup (runs last)
docs/: keys.md, pip.md, crafting.md, farming.md, high-reaches.md, HISTORY.md, PROJECT_DESCRIPTION.md. tools/: shot.js, overlap.js.

## World layout (MAP_LAYOUT, x across, y down)
- Riverbank row: farbank, rapids, ford, riverbank, camp (with the lean-to 'tentin' and Wick's shack and cellar).
- Home row: gleampool, meadow2, meadow (garden), start (glade), then the woods w1, w2, w3 east to the cave mouth.
- Down from f1: the rise (where f2 was: one long slope west to east, into f3 through a pass), then the windy fields
  f3 to f7 (f3-f6 are the mountain path: rock one side, a drop with islands the other),
  then east to the crags peak1-peak3 and the High Reaches hr1-hr3, stepping up and to the right.
- Caves c1-c7 in a column to the east, out to fallsbank, the marsh m1-m3, the hollow h1-h3, the swamp sw1-sw3.
- climb1-climb5 exist but are not joined to the map yet (test links and System > Testing only).

## Conventions
- Pip and NPC lines hold until F; tutorial lines are free. One alert style: scrolls. Banners only for quest start/end.
- Anything the player gains shows in the pack (Gear lists keepsakes and plans).
- Stones: rough ones are drawJagged with the zigzag soil line; throwing stones are lumpy drawRock with a seed that
  stays with the stone (ground, arms, air, landing).
- Collision and drawing share one shape function (chasmSpan, corridorSpan, gap(x, z)); never draw an edge the game
  doesn't test.
- Anything that takes over update() (state.rapids, state.climb) handles its own death, menus and text.

## Tests (tests/, by topic)
acorn-skill arena book-tiles camp-patch camp-talk camp-tour climb combat-crops combat-rhythm craft-sections crafting
fluff garden-robin garden gather-skill gathering growth-gusts-shroom gusts heavy-stone high-reaches hole homecoming
hud-banners intro-wander lanes ledge-ride lesson misc-51 mountain-side opening pack patch-hints pickup-sparkles
pip-ahead pip-bounce pip-brambles pip-leading pip-teaches place-tag plot-tips puzzles quests rabbits reminders rise riverbank
robin-drop robin-home rocks-banners scene-smoke slots smoke speech spores-map stepping-stones sticks-trees stones
text-layout tips-prompts tour wind-rocks wood-sword woods-gremlins woods. scene-smoke visits every screen with every
creature woken from a stun (it would have caught the High Reaches freeze).

## The climb, where it stands (tune with ?mountain)
1 The wind trail: a winding ravine, cross at narrow points. 2 Stepping stones: round islands in a wide ravine.
3 The broken meadow: rifts across the way, chasms, a short ravine (gap field). 4 The windy crossing: rifts with bare
islands, big rocks to shelter behind; gusts drive you back to screen 3. 5 The last ledges: a side view.
Your shadow is the aim (it leads toward the landing, small at the top of a jump). Open green for now (climbBand 12, no
crags); worn out restarts the screen. Open questions: final look, how the screens join the world, crags or not.

## The rise, where it stands (build 169)
The second screen of the fields, where f2 was: 86 tiles west to east and 30 deep. f1's south way leads in at its west
end; the east end, through a pass in the mountain's foot, leads down into f3 (and back). It runs on the main game:
while it's the current scene, W and H are its own size in px (sceneSize; update() and enterScene() set them, drawing
and the HUD use the screen, SW and SH, and L() walks at the screen's pace), so the hero, Pip, the rabbits, items, fire,
the tutorial coach and saving are the usual code. Only the drawing is its own (drawRise): the ground in rows, then
everything standing drawn by the game's own draw code at its spot on the tipped ground, scaled with the view;
toScreen projects on the rise, so speech and hints sit right. The overview draws it as a flat thumbnail.
The view: straight down at the west end; walking east it pulls back (zoom 1.00 to 0.50 on a laptop, 0.72 on a phone:
never under 20 px of hero) and tips (0 to 54 degrees) evenly to the foot, looking a little ahead. The stone walls
widen with it: 14 tiles apart by the fields, 30 at the foot (riseHalf). Crags line the foot and two unbroken walls
line the pass. No ground lines for now (contours and haze out; Ross will add flair later); the worn path stays.
Two rabbits in the first stretch (the camp's fluff). Just past the first tree (x 11) a wall of reeds crosses the way
wall to wall (x 13.6, bar 'risereeds'): the marsh's reeds kind, so only fire breaks it (burning gas; the marsh fire
breath), which gates f3 onward, the mountain path and the crags behind the marsh.
Draws at about 7 to 10 ms a frame in the node renderer (a field screen is about 3 to 4).
Open: the reeds' look (they are the marsh's dark bulrushes; straw-dry would suit a field), a line when you bump them
without fire, and f2's two island pickups (a stick or an acorn each), which the rise doesn't have.

## Next task
None set after build 169 (the rise in place of f2, gated by reeds only fire breaks). The climb screens stay in testing exactly as they are (Ross, 29 Sep: still being designed; not joined to the
world yet). When he's ready: which of climb1 to climb5 to keep, where they join (between the windy fields and the
crags), retiring the f3-f6 mountain-path screens, and the crag() painter in paintClimb and climbBand fixed at 12.
Until then, wait for Ross's request; don't touch the climb unasked.

## Working from Cowork
The container never commits or pushes: Ross ships each zip from his PC. After he pushes, `git fetch` and
`git reset --hard origin/main` so the clone matches main. Deliver the zip as a download (not a preview).
