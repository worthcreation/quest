# Quest: handoff (build 163, 29 Sep 2026)
Current state only. What changed build by build is in docs/HISTORY.md (newest first). How we work is in
QUEST_WAYS_OF_WORKING.md. Read both before touching anything.

## Build, test, ship
- Build: `sh build.sh` concatenates src/head.html and the files in src/ORDER into index.html, then checks the script
  parses (fails the build if not). BUILD number: `const BUILD` in src/draw.js (shown bottom-right in game).
- Test: `node tests/run.js` runs every tests/*.js through tests/harness.js (fake canvas, seeded Math.random, world
  seed 1000003, TEST_MODE on). 62 tests, about 2 minutes, one call. Each prints `errs N`; 0 is a pass
  (robin-drop prints none and passes).
  `node tests/<name>.js` runs one. `node tools/overlap.js` checks 300 worlds for overlapping things (want 0).
- Render: `B<NN>=1 node tools/shot.js` runs the render block for that build and writes PNGs to /tmp. MOCK4=1 is the
  mountainside still; B139/B150/B154 are the climb screens.
- Ship (Windows PowerShell, shown in a ```powershell block): one download quest-bNN.zip laid out like the repo root, then
  `cd ~\quest -ErrorAction Stop; Expand-Archive -Force ~\Downloads\quest-bNN.zip .; Remove-Item ~\Downloads\quest-bNN.zip; git add -A; git commit -m "Build NN: ..."; git push`
- Links (every reply that ships gives all of them, full URLs on https://worthcreation.github.io/quest/, each checked
  against the source that build): `?seed=N` (a fresh 7-digit prime each build; the jetty opening), `?arena`,
  `?puzzle`, `?mountain` (climb1 to climb5; keys 1-5 jump between them, 0 to the first field, [ ] and - = tune the
  shadow), `?scene=<id>` (start on any screen id in MAP_LAYOUT or climb1-climb5), `?overview=N` (the same world as
  one map; bare ?overview for a random one), `?model` (the drawn hero outside the arena). Any of them combine with
  &seed=N. If a link is added, renamed or removed in src/, change this list in the same build.

## File map (src/, in load order)
- world.js      world generation: every screen, solids, exits, barriers, crag(), pullable(), corridorSpan and
                fitToCorridor (mountain path), MAP_LAYOUT/MAP_NAMES, SHROOM_NAMES, the cellar
- highlands.js  the High Reaches (hr1-hr3): vistas, hawks, mantises, crystal bugs, worms, the red beetle
- climb.js      the climb screens (climb1-climb5): CLIMBS table, trail and gap-field painters, side view, wind,
                shadow aim (SHADOW), tile overlay, test links (MOUNTAIN, START_SCENE, testHops)
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
                enemies, items, drawJagged, drawRock, drawSoilLine, BUILD
- draw-ui.js    HUD (bottom-right), scrolls, speech boxes, titles, the pack, the creator screen, begin(), the loop
- draw-hero.js  the drawn hero model (arena and &model only)
- arena.js / puzzles.js  ?arena and ?puzzle
- boot.js       startup (runs last)
docs/: keys.md, pip.md, crafting.md, farming.md, high-reaches.md, HISTORY.md, PROJECT_DESCRIPTION.md. tools/: shot.js, overlap.js.

## World layout (MAP_LAYOUT, x across, y down)
- Riverbank row: farbank, rapids, ford, riverbank, camp (with the lean-to 'tentin' and Wick's shack and cellar).
- Home row: gleampool, meadow2, meadow (garden), start (glade), then the woods w1, w2, w3 east to the cave mouth.
- Down from f1: the windy fields f1 to f7 (f2-f6 are the mountain path: rock one side, a drop with islands the other),
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
pip-ahead pip-bounce pip-brambles pip-leading pip-teaches plot-tips puzzles quests rabbits reminders riverbank
robin-drop robin-home rocks-banners scene-smoke slots smoke speech spores-map stepping-stones sticks-trees stones
text-layout tips-prompts tour wind-rocks wood-sword woods-gremlins woods. scene-smoke visits every screen with every
creature woken from a stun (it would have caught the High Reaches freeze).

## The climb, where it stands (tune with ?mountain)
1 The wind trail: a winding ravine, cross at narrow points. 2 Stepping stones: round islands in a wide ravine.
3 The broken meadow: rifts across the way, chasms, a short ravine (gap field). 4 The windy crossing: rifts with bare
islands, big rocks to shelter behind; gusts drive you back to screen 3. 5 The last ledges: a side view.
Your shadow is the aim (it leads toward the landing, small at the top of a jump). Open green for now (climbBand 12, no
crags); worn out restarts the screen. Open questions: final look, how the screens join the world, crags or not.

## Next task
The climb: decide which of climb1 to climb5 to keep (test at ?mountain, keys 1 to 5) and where they join the world
(between the windy fields and the crags), then retire the f2-f6 mountain-path screens they replace. Open with the climb:
the crag() painter in paintClimb and climbBand fixed at 12.
