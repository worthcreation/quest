# Quest: handoff notes (as of build 113, 27 Sep 2026)

## What this is
Browser RPG, Zelda meets EarthBound. One file, `index.html`, on GitHub Pages: https://worthcreation.github.io/quest/
Repo: https://github.com/worthcreation/quest (personal account `worthcreation`).

## The single source of truth
`index.html` is the whole game. It is assembled from split source parts (in `src/` here) with:

    cd src && cat head.html p1.js p2.js p3.js p4.js p6.js p7.js p8.js p9.js p10.js p11.js p12.js p13.js p14.js p5.js > ../index.html

Note the order: p5.js goes LAST (it has drawItemIcon, resize, startup). src/, tests/ and tools/ live in the repo from build 64 on.

Ship step (every build): one download, quest-bNN.zip, laid out like the repo root. Then
    cd ~/quest && unzip -o ~/Downloads/quest-bNN.zip && rm ~/Downloads/quest-bNN.zip && git add . && git commit -m "Build N: ..." && git push
Next chat: git clone https://github.com/worthcreation/quest.git (github.com is reachable from the container) and work in src/.

## File map
- head.html   HTML, CSS, touch buttons (#pad, #act, #jump, #dash(A), #eat(S), #slotd(D), #throw(swap), #fire, #menubtn)
- p1.js       constants (DEFAULT_KEYS, ACTION_NAMES), world generation (all screens), newInv, state object, SEEDS, MATS
- p2.js       input (held/pressedNow), touch, say()/text system entry, settings
- p3.js       enterScene, collisions (F table), chasms/rocks/stones, jump, wind (updateWind, rideGust), pull mechanic, drops table, collect()
- p4.js       combat, enemies AI, damage, slam, birds
- p5.js       drawItemIcon, drawItems, enemies drawing, text layout (layoutTexts), resize, boot   (LAST in the cat)
- p6.js       interact(), farming (PATCH levels), findInteractable, Pip guide + story lines, cutscenes (intro/dusk/abduct/sword), river quest, pack menu, save/load, breakBarrier
- p7.js       drawing: ground, solids, hero (drawHero), HUD (drawHUD), menu screens, tips, BUILD constant
- p8.js       overview map (MAP_LAYOUT, REGION_COLOR, MAP_NAMES)
- p9.js       arena mode (?arena): ARENA_ZONES on real screens, arenaKit
- p10.js      puzzle mode (?puzzle): PUZZLES list, portals, records in localStorage 'quest-puzzles'
- p11.js      drawn hero model (arena only / &model): POSES, drawHeroModel, pose sheet (mirror in arena glade)
- p12.js      wind ledges, landing shadow, ravines drawing, Wick's jetty (placeDock/drawJetty), shack drawing
- p13.js      camp building & crafting (RAW, RECIPES, craft mat), lean-to interior, old jetty, STORY flags,
              quest log (QUESTS chains, updateQuests, questView)
- p14.js      food ranges & crop levels (FOOD, cropLevel, farmLevel, eatFood, CROP_PERK), mushroom glow, quick slots (SLOT_KEYS, useSlot, drawSlotBar),
              skills (SKILLS, skillUse, skillLevel, setSkillLevel, SKILL_COLOR), acorn spread/homing (acornSpread, steerAcorn)

## Build 113: forest boulders, one at a time
- New solid 'crag' (world.js crag(sc, id, at, size)): ONE boulder, 1 to 5 tiles across, a varied grey/brown colour,
  hp = size. hitCrag (items.js) counts every thrown-rock hit, shows "Cracking! n more." and draws more and longer
  cracks each hit; the last hit breaks it into flying pieces, and one piece is a throwable rock left at its foot.
  Only that boulder breaks (its bar id is its own). A rock that bounces off lands where you can reach it
  (freeItemSpot). Sword swings don't break them.
- The woods now: w1 exit boulder (4 tiles, crack1) set in the opening against the edge, two 1-tile practice boulders;
  w2 exit boulder (4 tiles, crack2; breaking it starts the ambush), one 2-tile boulder; w3: the sword in the stump
  under a cluster of four brambles (a thrown rock clears them), a 2-tile boulder, and ONE 4-tile stone over the cave
  mouth (crag 'cave', gap: true) with a narrow dark gap beside it that gremlins squeeze through. No rings, rows,
  keystones or pens remain in the woods (the old stoneRing/ringBarrier/keystone helpers are still defined for
  elsewhere but unused here).
- Exits now only take you through the opening itself (checkEdges checks along within a..b, +-0.04), so a boulder
  sized a bit bigger than its opening is enough to block it. Collision for crags is 1.15 x their size.
- Pip is drawn at 60% of your size (PIP_SIZE, feet on the same ground line).
- Pip's woods lines match (little boulders to practise on; big ones take a few hits; each breaking one leaves a rock).
- Tests: hole and stones rewritten for single boulders. 54 of 54.

## Build 112: gear in columns (wear folded in), Status as cards, rusty steel everywhere, three mat places
- The Wear tab is gone; the Gear tab has three columns: Weapons & tools | Abilities (and upgrades) | Wearing (every
  wearable you own; F on one to wear or take off). Each row is the icon, the name and a short note under it (c.desc,
  drawn by drawCraftColumns, which now takes column headers and serves Craft and Gear). Column navigation works for
  any tab whose cells carry col.
- Status is drawn as cards (drawStatusCards): a vigor bar across the top, then two-across cards for Acorns, Sword,
  Gathering and Farming: coloured strip, name, level pips, a progress bar, "now" and "next" in one short line each
  (SKILL_INFO rewritten short). Upgrades are small badges underneath. statusRows() remains for tests.
- The steel sword icon (Gear screen, slots) is drawn with drawSteelBlade (rust and all). At the sword reveal, the
  moment you take it the old sword goes on F and into your hand (setSlot + equip), so the hold-up is the steel blade.
- A stone kind's tint is laid on the jagged stone itself (drawJagged tint) instead of a round blob over it, which
  was reading as an old smooth rock underneath.
- craftSlots() is 3, full stop (the bench no longer adds a fourth).
- 54 of 54. tools/shot.js B112=1.

## Build 111: the woods reworked: no mud, the ambush, the cave heap
- No mud pits anywhere in the woods (world.js no longer pushes sc.mud). A thrown rock can still bury itself in soft
  ground (earthen, 20%); buried rocks all look and work the same: flush in the soil, stomp to pop them up at a tilt
  (a visible jolt: knockT_ flag drives a 0.5 s pop), then rock and pull.
- w2: one row of big boulders across the east exit, its cracked keystone out front on dry ground; the old second row
  (the 'burrow' hole) is gone. Breaking it starts the ambush: gremlins burst in from the east edge, grab Pip, and run
  off east, deeper into the dark; you can't catch them. New lines: "The way's open! ... Did those bushes just
  giggle?" and "They ran off with Pip, deeper into the dark! After them!". The rescue quest line matches.
- w3: the old sinkhole is now a cave mouth (feat.cave): a rocky outcrop with a dark arch, heaped round with big
  boulders (ringBarrier 'cave'); the one facing you is cracked (a stone kind). The gremlins slip between the boulders
  (the glimpse on entering w3); break the cracked one and the heap comes down; walk into the arch to go down into the
  cave (c1). Coming back out of the cave puts you in front of the mouth.
- The sword pen on w3 is a ring of smaller rough boulders (stoneRing: 'wedge', small), not a row of pebbles; gremlins
  don't slip through the small ones.
- hitStone uses the cracked stone of a barrier for its toughness (a heap can mix plain boulders and one cracked one).
- Tests: hole (ambush, cave heap, into the cave) and woods (no mud) updated. 54 of 54.

## Build 110: stones, barriers, the tent lantern
- The lantern is a fixture by Pip's bed from the start (drawTentLantern, lanternSpot): unlit glass by day, lit with the
  candles at twilight (candles are unlit stubs by day). At twilight F takes it (interactLantern, hint "Take lantern").
  The dusk scene no longer drops a lantern item.
- Throwing a carried stone never swings: the blade is put away while you carry (not drawn), and a throw clears the
  press and holds off swings for 0.4 s (state.noSwingUntil).
- Buried rocks: flush with the soil at first (a round back and a packed rim showing); once stomped loose they pop up
  and sit tilted with a gap beside them (drawPullable).
- Breakable (cracked) stones and barrier boulders are drawn with drawJagged: big, irregular, faceted, lit and shadowed
  faces, nothing like a smooth throwing stone. Keystones 1.0 tiles, practice stones 0.7, barrier boulders 0.85, thrown
  rocks 0.6.
- Barriers: one big irregular boulder per solid, set tight against the edge (x 0.968) and past both ends of the
  opening (+-0.08), so an unbroken barrier can't be slipped round (stones test: 0 of 14 walks got through). No log or
  stone-row barriers remain.
- Gremlins slip through the barrier boulders (collideSolids skips 'wedge' for gremlins).
- Test: stones (new). 54 of 54. (Note for scripts: WORLD solids have fx/fy; state.solids have x/y.)

## Build 109: R is the only swap; the journal quest starts in the morning
- R (actions.js): press it and the wheel opens on the key you last used (state.lastSlot: set by A/S/D presses and by F
  outside menus); while R is held, A/S/D/F switch the key being chosen for (no swing, no use); each wheel lists only
  what that key can hold (radialOptions(slot) filtered by laneAllows, plus Empty); arrows point; let go of R to set it.
  Tap-R blade cycling and the hold-A/S lane wheels are gone; A and S are tap-to-use (marsh fire still holds).
- Morning (end of the sporehome scene): Pip, three lines that wait for F: sleep, then "where's my journal?", the
  gremlins took it, follow the torn pages; then the journal quest starts (inv.journal = 1, spawnPages; its banner
  follows) and the Morning scroll shows.
- Tests: lanes rewritten for R; homecoming checks the journal quest. 53 of 53.

## Build 108: the long twilight, the spore homecoming, morning; the stump sword; marsh fire on S/A
- Sword reveal: your hand is empty while the old sword comes up (draw.js skips drawSword during the 'sword' cut until
  it's yours), and the stump blade is drawn with drawSteelBlade (the same grey steel and rust as the sword in hand).
- Twilight no longer ends at the sword scene: state.dusk stays on through the woods, the cave and the rescue.
- startRescue is now a scene ('sporehome' in updateCut): "Hold on tight!", purple spores whirl round you (capped at a
  handful a frame), mushroom puffs, the world goes violet (state.sporeTint), a flash, and you're at camp by the fire,
  still twilight; three lines from Pip (wait for F); lights out, "Z z z"; morning: dusk off, a warm dawn glow that
  fades over 12 s (state.dawn), vigor full, forest music; a scroll: "Morning. The world is your oyster. Explore, and
  keep filling in Pip's map." Pip's spore-travel explanation at camp (talk) is unchanged.
- Marsh fire on A or S: holding that key breathes (HOLD_ABILITIES in actions.js skips the lane wheel for it). Swap
  what's on that key with R + the key, or in the pack. Open design question (Ross): a better quick-swap.
- Test: homecoming (new). 53 of 53.

## Build 107: the heavy stones wait for twilight
- pullLocked(pl) (items.js): big buried rocks (kind 'rock', not mud rocks) are scenery until storyAt('adventure'): no
  pounding loose (knockRocks), no grip (updatePull), no hint chips, no 'Pull' interactable, and they don't block your
  sword or the patch code. The rocks are still drawn and still solid. Test: heavy-stone. 52 of 52.

## Build 106: combat guidance you can't miss
- It wasn't showing because Pip's gathering small talk ("Let's keep looking around...") filled the air on arrival, and
  every line waits for quiet. Now tutorial lines take priority: tutorialPending(sc) holds pipGatherTalk back while the
  current step has a line to say here, and a tutorial line clears any free small talk that's showing.
- The rabbits step says "There they are! Watch their eyes: when they flash red, jump aside. Then swing!" on the field
  (and "And go! South, to the rabbits!" elsewhere).
- COACH.combat pins the basics at the top on the rabbits' field until they're done: "Eyes flash red? Get out of the
  way! Then swing (F) while it's close." until the first rabbit falls (inv.rabbitKills, counted in kill()), then "Got
  one! Now the other. Or hold F, let go: lunge." until the second.
- Test: rabbits extended. 51 of 51.

## Build 105: HUD bottom-right and quiet; pickups in a bottom-left feed
- The vigor bar and slots sit in the bottom-right corner (top-left on touch, clear of the buttons). They fade to 28%
  when nothing's happening: the bar brightens while vigor changes (hurt, spent, resting) and when it's low (always
  full then); the slots brighten when one is used or changes (state.slotLit; note state.slotT is the tidy timer), and
  in the pack or a wheel. hudRect follows them.
- Pickups, counts and item notes (say() with keys item, raw*, mat, matdrift, spore, seedtip, loose, food, acorns) go to
  notice() instead: a small feed in the bottom-left, newest at the bottom, up to six lines, each fading after ~4 s
  (drawFeed).
- tools/shot.js B105=1.

## Build 104: two lunges for a wooden sword; scrolls at the bottom; Pip strolls ahead
- A wooden sword takes two lunges that land (inv.woodLunges): the first cracks it ("Crack! One more like that and it's
  kindling."), the second splits it. A new wooden sword resets the count. Lunges at air don't count.
- Scrolls sit near the bottom edge (H - height - max(18, 4% of H)), paper at 72% opacity so the world shows through
  while the ink stays readable.
- Pip going on ahead (and coming back to hurry you) moves at 60% of his usual pace.

## Build 103: banners are for quests only
- Only a quest's start and its end use the big banner (quests.js calls showTitle with 'herald'). showTitle with 'relic' or
  'quest' (items, recipes, relics, charms, the lantern, the rod, the journal, the mushroom, The Blade, arena and puzzle
  results) now becomes a small scroll in the lower half (showScroll, text.js). Level-ups pass status=true to add
  "Status (M) has more"; other scrolls leave it off. Place names on entering a screen and the ending are unchanged.
- Test: rocks-banners checks an item alert is a scroll and a quest start is still a banner. 51 of 51.

## Build 102: two rabbits, the rage tell, combat talk, the quest HUD as background, rusty steel
- f2 has two rabbits (the world field table's second entry; the ravine field is back to one).
- Rabbits (and gremlins, which share the AI) have a tell: 'rage', 0.55 s stock-still with eyes flashing red, before
  they dart (critters.js AI.rabbit, drawn in draw-ui.js).
- Pip on f2 with a blade and fluff still needed (PIP_LINES combat-eyes, combat-swing): watch the eyes, get out of the
  way; then swing while it's close, or hold and let go for a lunge. Said where he stands.
- The quest HUD is the bottom screen layer: drawn right after the world (draw.js), before hints, bubbles, the coach,
  scrolls and banners; always in its corner (no longer pushed under banners); text no longer steers round it
  (reservedRects drops questHudRect).
- The steel blade: grey with a thin shine, mottled with rust (10 blooms unhoned, 6, then 3, fading), clean at edge 3.
- Test: rabbits (new). 51 of 51.

## Build 101: the wooden lunge, no wooden whirlwind, level-up scrolls, Status now/next
- Wooden sword: slashes on release (combat.js: a press doesn't start the slash when the blade is wood; letting go before
  the lunge charges does), so holding F gives a clean lunge. A wooden lunge deals at least 2.2 x power (a rabbit is 2 hp),
  runs through everything in its line (two rabbits side by side), and the sword splits at the end of the lunge only if
  it struck something. The seven-slash rhythm never spins with wood (ch.n resets).
- Level-ups: showScroll(title, text) (text.js) puts a small parchment scroll in the lower half for ~5 s, with "Status (M)
  has more"; skills and farming use it (skillUse, gainCropXp). drawScroll runs under the banner layer, outside menus.
- Status: each skill (acorns, sword, gathering) shows level and progress, then "now" and "next" lines from SKILL_INFO
  (skills.js); farming shows its level (from harvests) with now / next. Dodge and the unused farm skill are hidden.
- Test: wood-sword extended (lunge fells two, splits; air lunge doesn't; no wooden spin; scroll; Status rows). 50 of 50.

## Build 100: wooden sword wears only on hits; no whirlwind from a pound; lantern opposite the blade
- bladeWear(1) now only on hits (slash, stab, whirl hits); swinging or lunging at air costs nothing (the lunge and a
  whirlwind still split it at the end). Two rabbits take about 8 hits; 14 durability leaves ~6.
- The pound -> strike -> whirlwind chain is off (poundChain is still set but unused). The only way to spin is seven
  slashes in the rhythm; with a wooden sword that spin splits it at the end.
- The lantern hangs on the side opposite the blade (drawWorn uses -side).
- Test: wood-sword (new). 50 of 50.

## Build 99: quest info under banners
- The quest banner sits at the top (H * 0.18) and records state.bannerRect; while one is up, bannerBelow() gives the y
  just under it, and the pinned coach note and the quest HUD move down there. Draw order puts the banner on top of
  both (drawCoach runs before drawTitle; inside the pack it's drawn again over the menu). tools/shot.js B99=1.

## Build 98: camp built piece by piece, the camp tour, coached steps, craft columns, twilight
- Camp parts (craft.js): CAMP_PARTS (fire: 5 stones then tinder; bench: 2 frames), campParts() in rtFor('camp').flags.parts,
  setCampPart(b) at a mark sets what you carry. Recipes: tinder (stick + stick), benchframe (stick + stick + glue);
  the old firering / benchkit recipes are gone (an old save still holding one sets it whole). CAMP_NEED 5/6/4; riverbank
  6 stones, glade 10 sticks, f2 2 rabbits. drawBuildSpots shows the ring's five places and the bench's two frames.
- The camp tour (tutorial.js, steps tour-fire .. tour-exit): Pip walks to each mark and says a line, then the lean-to;
  step.lead walks him to the door / the flap / the camp exit and he slips out of sight (state.pipGone, cleared on scene
  change). Stops are done once said and you came near (TUT.followed) or 9 s pass. Finished steps latch in
  inv.tutDone. Jumping in (tada flagged but never said) skips the tour (TUT.noTour).
- Coached steps (tutorial.js COACH, startCoach, coachUpdate in update, drawCoach over everything): the wooden sword
  after the lesson, tinder once the ring's stones are set, glue + frames once the fire is lit. Each step stays pinned
  until its done() is true, menus included.
- Craft tab in three columns (craftCells col 0/1/2, drawCraftColumns, column navigation in updatePack): Make, Materials,
  Made (greyed record).
- Book: a fixed pill under it ("← → turn pages · F close") and "7-8 of 9" above; two new pages: Pip's map (drawBookMap:
  walked places inked and named, next-door places dashed "?", arrows off the page for what's beyond) and Still to map
  (mapTodo: half-seen places plus rumours of the pool, the peaks, the digging).
- Twilight: after camp, around home, MUSIC.twilight and ambience 'night' (soft breeze), crickets and an occasional owl
  (sfx.cricket / sfx.owl, scheduled in update), candles flickering in the lean-to at dusk (drawCandles).
- speechPages keeps a leading ellipsis. Pip is pushed by gusts (and sometimes says so).
- Tests: camp-tour (new); opening, gathering, camp-talk updated for the new camp. 49 of 49.
- To design next (Ross): what the workbench and fire can be upgraded into, and what bigger crafting happens there.

## Build 97: what F does, one handler per thing
- interact() (interact.js) is now a driver over INTERACTIONS, an ordered list of handlers, each about one kind of
  thing: interactTalk (paging a conversation), interactHandsFull (a carried rock owns F), interactPickup, interactMirror,
  interactPortals, interactFishing, interactRiverQuest, interactMushroom, interactPeople, interactTentDoor,
  interactBedroll, interactChest, interactBook, interactBuild (camp marks), interactCampfire, interactBench,
  interactPatches (plant/compost menu, harvest handoff), interactLift (a loose rock). A handler returns true when it
  used the press, false to stop (hands full, mid-talk), or nothing to pass. The order in the list is the priority.
  Bodies are the old blocks moved verbatim; nearPull is computed once in the driver and handed to each.
- PIP_GAP is a `let` now, so the harness (or a test) can shorten Pip's gap between lines.
- Suite unchanged: 48 of 48.

## Build 96: tests fast and deterministic
- tests/harness.js is the one place the browser mocks live; every test starts `const src = require('./harness.js').src;`
  (the ?arena / ?puzzle tests set global.location first). It seeds Math.random (mulberry32, HARNESS_SEED to vary) and
  fixes the world seed (?seed=1000003, WORLD_SEED to vary), so a test does exactly the same thing every run.
- Drawing was ~70% of test time. draw.js has `let DRAW_SCENE_STRIDE = 1`; the harness sets it to 4 in the source it
  hands the test, so the world layer is drawn every 4th frame while HUD, text boxes, hints and menus still draw every
  frame (FULL_DRAW=1 restores everything). Suite: 75 s, was about 4 minutes. run.js skips harness.js.
- The determinism caught the "seed on the ground you can't pick up" flake: the robin sometimes dropped its seed inside
  the hollow tree's trunk, out of reach. freeItemSpot (items.js) nudges a dropped thing out of any solid; the robin's
  drop uses it. The garden tests also step next to an item before walking onto it (walkTo has no pathfinding).
- Open (harness-only): a few tests still time gaps in real seconds (PIP_GAP is a const 8); if the reminder tests ever
  need to go faster, make PIP_GAP a `let` and set it from the harness.

## Build 95: Pip's remaining lines as data, and design pages
- PIP_LINES (tutorial.js, after TUTORIAL): every non-tutorial Pip line (compost, chest, pounding, the tent book, the
  mushroom, the glade's brambles/rock/throw, the woods' practice stones, gate, mud) as entries {key, scene, when, at,
  sight, text}; updatePip walks the list and pipSay says each once. The abduction trigger (w2, boulders down) stays in
  pip.js. updatePip is now behaviour only.
- docs/: keys.md, pip.md, crafting.md, farming.md, README.md. Rules in plain words, one page per system; change the
  page first, then the code.
- Tests unchanged, 48 of 48.

## Build 94: the tutorial as one ordered list (src/tutorial.js)
- TUTORIAL is an array of steps in play order: seeds, plant, tocamp, tada, sticks, stones, fluff, lesson, sword, rabbits,
  build, homebase. A step has done() (what must be true to move on), goal() (which screen Pip leads to), scene and
  spot (where Pip stands to say it), say() (the line; key() when it should be re-said as things change), hold (waits
  for F), once (a pipTips flag), remind() (nag phrasings used in turn) and remindAt(n) (where he stands to nag),
  after() (side effects: the lesson marks the wooden sword recipe heard). Steps also count as done when the story
  is already past them, so saves and tests that jump in still work.
- tutorialStep() is the first step not done; tutorialGoal() feeds pipExit; tutorialTalk() (pip.js) says the step's line
  once at its spot (tutorial lines don't wait for the usual 8 s gap), and at camp mid-gathering reads the next mark
  (campMarkLine) instead. remindNow() takes its phrasings and spots from the step. The old per-block gating in
  updatePip (garden, tocamp, camp marks, gathering, lesson, and-go) is gone; what's left in pip.js is flavour
  (compost, the chest, pounding, the mushroom, the woods lines) and the feather -> dusk handoff.
- To change what Pip says or where the early game goes, edit tutorial.js. Adding a step is one object in the list.
- Not yet moved to data: RECIPES (craft.js), QUESTS (quests.js) and BOOK_PAGES (menu.js) are already plain tables
  in their own files; Pip's later-game lines are still inline in pip.js.
- Tests updated for the driver: gathering (uses tutorialGoal, jumps in with the story set), pip-leading, garden.

## How the code is laid out (build 93 reorganization)
- `src/` is split by topic; `src/ORDER` lists the load order; `sh build.sh` concatenates head.html plus those files into
  index.html (no bundler, same single-file deploy). Each file opens with a one-line header saying what's in it:
  world, input, text, engine, items, combat, critters, interact, actions, pip, cutscenes, menu, save, craft, quests,
  gear, skills, draw, draw-ui, draw-hero, arena, puzzles, boot. Functions are hoisted, so only top-level statements
  care about order (world runs at load, boot runs last; a const's own loops sit in its file).
- Older notes below refer to p1..p14. Roughly: p1 -> world, p2 -> input + text, p3 -> engine + items, p4 -> combat +
  critters (+ items for trees/loose spots), p5 -> draw-ui + boot, p6 -> interact / actions / pip / cutscenes / menu /
  save / critters(flocks, webs), p7 -> draw + draw-ui, p8 -> world, p9 -> arena, p10 -> puzzles, p11 -> draw-hero,
  p12 -> draw, p13 -> craft + quests, p14 -> gear + skills.
- Tests are named by scenario in `tests/` (opening, garden, camp-talk, gathering, fluff, lesson, tour, woods, slots,
  lanes, combat-crops, quests, pack, hud-banners, puzzles, arena, ...). `node tests/run.js` runs them all (or
  `node tests/run.js garden lanes` for some) and prints ok/FAIL per test plus a tally; every test reads ../index.html
  relative to itself, so they run from a clone. t40 and t61 were dropped (stale). tools/shot.js and overlap.js read
  ../index.html the same way.
- Still to do from the plan: pull Pip's lines, quests, recipes and the tutorial order into data tables (pip.js is the
  place to start), and replace the scattered early-game gates with one ordered tutorial list.

## Build 92 in short
- No crafting talk before the lesson: Pip's earlier craft lines (sword-first, woodsword, craft2, craft3) are off, and
  camp marks say "Got it all for the fire ring! We'll put it together soon." until the lesson has happened.
- The crafting lesson (p6, pipTips.craftLesson): once you have two tufts of fluff and the camp still needs one, Pip
  says a held line (F turns each page): the bench needs one more, the rabbits are south and mean, time to learn
  crafting, open the pack, Craft tab, pick the wooden sword under Recipes (F lays out three sticks), F on Combine. With
  fewer than three sticks he sends you for sticks first. The wooden sword recipe is marked heard. "And go! South, to
  the rabbits!" follows once you hold a blade.
- The feather is back: at home base Pip's line waits for F ("Home base! We did it! Here, I found this feather. It's
  for you." with a bounce), then the feather (banner, worn), then dusk.
- The lantern is a real pickup: during the dusk scene it's placed on the floor by the bedroll (tentin) and Pip says
  "Grab the lantern by my bed." No lantern, no light pool. Picked up, it hangs at your side and flickers (drawWorn),
  with its own icon.
- Tests: t92. tools/shot.js B92=1.

## Build 91 in short
- Keys keep their jobs (laneAllows, p14): F takes blades only, D throwables only, A/S food and abilities. setSlot refuses
  anything else, the pack only offers the right keys, R + key lists only what fits, tap R steps F between blades. The
  hand always holds F's blade (syncEquip); slotWeaponHeld is off.
- Acorns throw from their own key (the throw code in p6 reads that key; a carried rock still throws with F), so you can
  wind up an acorn on D and swing the blade on F at once; the acorn shows in the off hand while you wind up.
- Sword practice counts now (skillUse('sword') on slashes and stabs, hits double). It shapes the big moves: whirlwind
  length 1.2 s + 0.45 s per level (to 3 s; beats can stretch it to 1.6x), hits x0.7 to x1.1, then a rest of 8 s down to
  2 s before the next ("Too dizzy to spin again yet."); the lunge (charged stab) charges faster and reaches / hits x0.8
  to x1.2. A wooden sword flies apart at the end of a whirlwind or a lunge.
- Crops pull like rocks and the sword: ripe patches join the pullables (syncCropPulls, kind 'crop'); hold F, rock
  left/right CROP_ROCKS[farm level] times (3, 2, 2, 1, 1, then 0), then up. At the top it's just F. The pull hands the
  harvest to the patch code (state.cropFree). updatePull now takes the nearest pullable; crop pullables don't block the
  patch code (nearPull).
- Tests: t91; t65 pulls its crop; t85 drops the old hold-time check.

## Build 90 in short
- No seed key. Seeds are no longer slotted (slotOptions leaves them out; seedSlotKey() is null; old saves' seed slots
  are emptied, inv.slotV 3). F at an empty patch opens a small menu (ask) listing "Plant <seeds> (n)" for every seed
  you carry and "Compost (3 acorns)" when you can pay; nothing on offer gives a short hint. The hint chip reads
  "F Plant / Compost" (whichever apply).
- A and S are both for food and abilities: things go to S, then A if S is taken; holding either shows the same wheel.
- Gathering is led (gatherGoal, p6; pipExit now uses it while gathering): sticks (glade) -> stones (riverbank) -> fluff
  (first field) -> if fluff is still short: no blade and under 3 sticks, back to the glade; 3 sticks, stay and craft;
  blade in hand, the rabbits' field -> camp when all's in. On the bare first field Pip says, in order: "Need one more!
  There are rabbits to the south... but they are mean!", then "Do you have enough sticks? Get some more back in the
  glade." or "Use what you have: slap together a wooden sword! M, Craft: stick, stick, stick. Then Combine." (and the
  wooden sword recipe is marked heard, so it lays itself out), then, as soon as you have a blade, "And go! South, to
  the rabbits!".
- Tests: t90; t56/t57/t64/t65 plant through the menu.

## Build 89 in short
- Lanes (p14 laneOf / laneOptions / LANE_NAME): F = act + blade (sword, wooden sword), D = throw (acorns), S = use
  (food, abilities), A = seeds. New things auto-equip only into their own key, and only if it's empty; a second food or
  seed waits in the pack. Anything can still be put anywhere from the pack or R + key.
- A and S: a tap uses on release; holding past 0.22 s opens that lane's wheel (state.radial.lane, world slowed), steer
  with the arrows, let go of the key to put the highlighted one there (updateAbilities, p6). D still uses on press
  (holding D aims a throw). A one-time line explains tap vs hold when a lane first has a choice. Book page "Your keys".
- QWER as a second row is not built; the lanes leave room for it (same lanes, a second choice each).
- Tests: t89.

## Build 88 in short
- Thrown rocks can bury themselves anywhere on soft ground, not only in mud: a 20% chance on EARTHEN areas (forest,
  woods, field, marsh, swamp), off rock slabs and water (earthen(), p3). Same buried rock as mud: pound, rock, heave.
  sinkRock(x, y, how) says "Thunk. It buried itself in the soft earth." for these.
- Breakable (cracked) stones are bigger than a thrown rock: keystones 0.8 tiles, the practice stones 0.7 (thrown 0.6).
- One banner style: showTitle maps 'relic' and 'quest' to the region's 'herald' ribbon (min 3.6 s), with room for long
  subtitles. Quest-ish one-offs that doubled up with the quest banners are gone (Find Pip x2, Sidequest: Downriver,
  The Stolen Journal, Pip is safe); "The Blade" uses the ribbon. Place names on entering a screen stay as they were.
- Tests: t88.

## Build 87 in short
- Trees drop sticks as well as acorns when shaken or pounded (dropAcorn, p4: 40% stick).
- Craft mat: craftSlots() (p13) is always at least 3, and 4 once the workbench stands (more can be added later); all
  places always show. The "now you can combine three" step is gone.
- Craft tab in sections: The mat, Recipes, Made (glue, camp pieces: things you crafted), Materials (things you found).
  Section-heavy grids shrink their cells to clear the detail panel (drawPack). The duplicate recipe sums under the mat
  are gone (Recipes lists them). Tests: t87. tools/shot.js B87=1.

## Build 86 in short
- Fluff: only the first field (f1) has any lying about, two tufts mid-screen, and loose fluff blows with the gusts (p3,
  gentle 0.01 / blow 0.035 x L per s) and is lost if it leaves the screen ("Whoosh! The wind took a tuft of fluff.").
  The second field's rabbit is the source: while camp is short of fluff, a rabbit always drops fluff (dropFor).
- Camp now needs 3 fluff: the workbench is a stick, glue and a fluff cushion (RECIPES benchkit), so CAMP_NEED is
  stone 2, stick 2, fluff 3; campHave, the camp quest line and Pip's bench lines follow.
- Wooden sword first: craft slots start at 3 (newInv), the glade has 7 sticks (camp 2 + sword 3 + spares), and Pip
  says "Before the rabbits: three sticks make a wooden sword" once you have 3 sticks and no blade, plus field lines
  (f1: grab the fluff before it blows; f2: make a sword first / get it straight from the source).
- The opening's finish() can no longer wind the story back to the garden.
- Tests: t86; t56 tops fluff up to 3 and builds the new bench. Open: about 1 run in 8 of t56 ends with story 1 (garden)
  after the camp is done; no reset, no intro restart and no story write was caught in 10 instrumented runs. Worth a look.

## Build 85 in short
- Crops are pulled up: at a ripe patch you hold F (interact, state.cropPull) and the crop rises and shakes out of the
  dirt; it comes up after CROP_PULL[farm level] seconds (1.1, 0.8, 0.55, 0.35, 0.15). A tap does nothing. The hint reads
  "Hold: pull up". state.frameDt is set each update for this.
- Pip never stands still in the early game: waiting ahead (p.waitAt) or at his garden post he potters about the spot.
  Heading for camp or gathering, if you don't get closer to where he's leading for 9 s, he says he'll go on ahead and
  walks off the screen past the exit (p.lead phases going / away), then 6 s later pops back in from that side, bouncing,
  to hurry you up ("Hurry up, slowpoke!" and others, in turn), walks in a little and carries on leading.
- Pip's book: rule 1 (snacks) is a carrot; "Eat something!" got the turnip.
- Tests: t85; t65 now holds F to harvest.

## Build 84 in short
- Far fewer patches, mostly by the travel mushrooms (p1). plotPattern(c, n, kind) lays patches a tile apart: for two,
  either diagonal neighbours ('diag') or one empty tile between ('gap'); larger sets are a grid with a tile between.
  Pip's garden (meadow): 2. Camp: 4, beside its mushroom. Each wild mushroom (addShroom): 2 nearby. The old farm (foot):
  6. The glade, far bank, w1, f1 and f2 no longer have patches. tools/shot.js B84=1 (with the tile overlay).

## Build 83 in short
- Action chips stack vertically above the gold ring (F on top, then the others), with the key badges lined up in one
  column (drawActionHint). tools/shot.js B83=1.

## Build 82 in short
- Pip's book (tent) is now six short pages, three to a spread (BOOK_PAGES in p6, built on open so keys are current):
  Pip's Rules, Getting about, Fighting, Growing, Making, Tired?. Each page is a title and three one-line notes, each with
  a silly pencil drawing beside it (drawDoodle in p7: a happy turnip, a smiling gremlin crossed out, a stick poking a
  glowing mushroom, the arrow keys, a jump arc, the gold F, slash / stab / pound stick figures, seed into dirt, acorn to
  compost, a sprouting turnip, the craft mat sum, fluff + fluff = glue, the X mark, a sleepy zzz, a campfire, a carrot).
  Lines wobble like pencil (wobbleLine, seeded so they hold still). BOOK is now just a length for the page turner.
- tools/shot.js: B77 renders the book (page index set in the B77 block).

## Build 81 in short
- Camp, while gathering (p6 updatePip, sc.id === 'camp'): Pip walks to the next mark still to build (fire ring, then
  workbench) and says one short line about it, keyed on your state so it changes as you gather and craft: what's
  still needed there; "Glue first: two fluff on the Craft mat (M)"; "You've got it! Craft: two stones and a stick (M)";
  "Set the fire ring down right here!". Lines stay tied to the mark (site r 7). The old long shopping line is gone;
  "My book in the tent explains stuff." follows the first camp line. Test: t81 (every stage, longest line 62 chars).

## Build 80 in short
- pipBounce (p6, called from updatePip every frame, opening included): Pip hops 1 to 3 times now and then while he's
  talking (60% on a new line with "!", 20% otherwise, plus an occasional hop mid-line). p.bz lifts only his body (p7);
  his bubble stays put.
- When progress happens (the pipRemind progress key changes: story, seeds, planting, camp materials, screen), Pip's
  free lines that were already showing fade within ~0.35 s and drop their remaining pages; a reminder visit is dropped.
- Test: t80.

## Build 79 in short
- The opening (updateIntro): while Pip talks he wanders the bank around where you started (short walks, pauses, never
  into the river, a new spot if one can't be reached in 3.5 s), his words riding along with him; after the last line he
  runs off south at 1.5x walking speed. Test: t79.

## Build 78 in short
- Pip in the garden opens with the quest's first step ('garden-open': seeds from the robin). The robin line and the
  patch line follow in order (patch talk only once you have seeds). Compost talk waits until Pip's garden quest is done.
- Pip is calmer: he waits while he's anywhere from ~3 to 9 tiles ahead on the way (and up to 4 tiles off your line),
  walks rather than dashes (1.0x, 1.35x when far, 1.2x on a visit), and is only re-placed if truly stuck (1.5 s not
  moving) or more than 14 tiles away. t78: 40 s of wandering, no pop-ins on the same screen, largest step 0.25 tiles.
- Patch tips: the seed key's Plant (if you carry seeds) and F Compost with its cost (if you can pay), each only when you
  have what it takes; nothing at all otherwise. With seeds on A/S/D and acorns in hand, F composts straight away.
- A buried rock that isn't loosened yet shows only "Space F Pound it loose" (no Pull).
- Tests: t78.

## Build 77 in short
- inView(x, y, tiles) (p3): near enough and nothing impassable on the straight line between (river, chasm, deep water,
  trees or big rocks). Notices about places wait for it. The far-side shack notice now only comes when you're over
  there looking at it (never from the near bank, never during the opening); the mushroom notice also waits for the
  opening to end.
- Action hint shows every action available at the spot as key + verb chips (actionList in p7): F first, plus the seed
  slot's Plant at a patch, Pick up when something lies at your feet, and jump-then-F to pound a buried rock loose.
- Pip's book (tentin): an open book with two pages to a spread, text flowed onto pages (a long entry carries on
  overleaf), page numbers in the corners, in Caveat (Google Fonts, linked in head.html; falls back to other cursive
  fonts offline). HAND(px, bold) builds the font string.
- System > Show tiles: a checkered overlay of the actual tiles (UNIT squares), water tinted blue, blocked ground red,
  your tile outlined (drawTiles, cached per scene; state.settings.tiles is saved).
- Tests: t77. tools/shot.js B77=1.

## Build 76 in short
- Waiting vs free words (p5 drawTexts): speech that waits for F is a solid box with a pulsing edge in the speaker's
  colour and the key badge; free speech is a light see-through bubble, italic, no edge. Both have a small tail toward
  the speaker.
- The tutorial is free text now: PIP_HOLD is empty, so only the jetty opening waits for F.
- Reminders (p6 pipRemind / remindNow): with no progress for 16 s (+6 s each time), Pip walks to something that helps and
  says it a new way: the robin (by the robin, halfway to you, by its tree), an empty patch, a camp material still
  needed, or the way on. Each situation has 4 or 5 phrasings used in turn, never the same twice running; a reminder
  visit gives up after 12 s. "Over here!" nudges and the robin-miss lines cycle through variants too. In the garden a
  reminder can take Pip off his post for a moment.
- "River stone" is now "Smooth stone" everywhere (RAW, recipes, the charm, Pip's lines, the camp quest).
- Tests: t76; t65/t69 adjusted for free text. tools/shot.js B76=1.

## Build 75 in short
- Pickups barely nudge the camera now (ZP.pickup 0.012 / 0.3 s / 1 bounce).
- Pack tabs show only when there's something behind them (tabShown: Wear once you own something to wear, Food/Seeds/
  Materials when you carry some, Map once you have the journal). Left/right skip hidden tabs (stepTab). Tabs are sized to
  their words and the font shrinks to fit, so nothing clips. The empty Wear placeholder and the always-on "Farming level"
  Gear cell are gone.
- Sections: cells can carry `sec`; packLayout starts a new row (with the section name above it) at each change, and
  up/down move by rows. Gear is split into Weapons, Abilities, Upgrades, Tools. Detail text wraps (two lines) instead of
  running off the panel.
- New Status tab (statusRows): vigor and depth, every skill with level and progress, gathering reach, garden levels,
  upgrades. Read-only.
- System > Testing: set levels (menu view 'levels', LEVEL_ROWS): every skill, vigor depth, turnip bonus; left/right or F
  to change, plus everything to the top / back to zero. D steps back to System from sub-screens.
- Tests: t75. tools/shot.js B75=1.

## Build 74 in short
- Robin seed drops: during Pip's garden lesson a startle drops seeds 80% of the time (was 40%; the first is still
  certain). Outside the lesson it stays 40% (scareBird, p4). Test: t74.

## Build 73 in short
- Text boxes no longer dodge things frame by frame. A box that belongs to a speaker (Pip) searches for clear room once,
  then keeps that offset from the speaker and glides with them (t.off, t.sx/t.sy in layoutTexts); a new page keeps the
  spot. Other boxes were already fixed once placed. Speech always shows (if there's no clear room it sits in its
  preferred spot rather than hiding). Moving the hero no longer moves any box.
- Pip leads without circling (p6 updatePip): he keeps to one side of your line toward the exit (p.lane), waits once
  he's 3 to 6.5 tiles ahead on the way (looking back at you), and if you run past him he catches up along his own side.
  placePipNearHero now puts him ahead of you toward the exit, never behind.
- Tests: t73 (turn angle around you, lane switches, catching up, bubble offset while you walk about).

## Build 72 in short
- Gathering skill (p14 SKILLS.gather, 12 quiet levels; gatherGain on every pickup, rare and secret things count triple).
  gatherReach() = 1.15 + 0.3 per level: how far F reaches, and where the faint selection ring shows under items (p5).
  Items have a tier (GATHER_TIER: common, uncommon, rare, secret; unknown types count as uncommon). autoRange(type):
  from AUTO_NEED [3, 6, 9, 12] a thing drifts to you on its own (it.magnet, p3 item loop) from 0.8 tiles, +1.2 per
  level, and at 12 from anywhere on screen. GLOW_NEED [0, 0, 5, 11]: rare things only show their ring from level 5,
  secret ones from 11. Level 0 is contact only: stand on it and press F. ~40 pickups to reach level 3.
- Hidden loose-ground spots (the pound finds) show as a faint scuff from gathering level 5, plainer with each level,
  with an occasional glint from 9 (drawLooseHints, p4, drawn in drawGround).
- Tests: t72. tools/shot.js B72=1.

## Build 71 in short
- Slot labels: an old save could bring back two actions on one key (dash on D from before slotd existed), which made
  the row read D S D. Loading settings now falls back to DEFAULT_KEYS when any key is bound twice. Labels are A S D F,
  each once, in order.
- Speech (keys pip/npc) never goes to the bottom reading panel. say() splits it into pages of a sentence or two
  (speechPages, ~80 chars); F turns the page (nextPage), timed speech turns its own pages. Pip's words carry who:'pip'
  and ride above Pip wherever Pip is (layoutTexts), in Pip's colour, in a narrower bubble. The panel is only for
  letters, pages and signs.
- Pip is lighter: only PIP_HOLD lines (the garden lesson, heading to camp, home base, the tent, the chest) wait for F;
  every other hint fades on its own at 0.9 size, with at least PIP_GAP (8 s) between them. The gathering tally stays
  out of the tent.
- Pip leads 4.2 tiles out (was 2.2), about 4 tiles ahead in practice.
- Pip follows you into the tent (pipWithYou allows tentin). The chest starts with 2 turnip seeds and 3 acorns (newInv;
  older saves get them once via inv.chestStocked), and Pip mentions them and compost inside.
- Quest complete: the same banner as a new quest, with the quest's QUEST_DID line under it, a fanfare, 4.6 s, not held.
- Tests: t71. tools/shot.js B71=1.

## Build 70 in short
- Quest banners (style 'herald', p5): the banner is drawn once into its own canvas (heraldImage, cached on the title as
  T.img) and each frame only moved, unrolled from the middle and faded with smootherstep, so it no longer stutters (the
  old per-frame shadowBlur was the cost). Themed by region: REGION_THEME, regionOf(sc) (sc.region, default 'vale').
  Everything built so far is the Vale: green cloth ribbon, notched tails, gold trim, leaf sprigs. A new region sets
  sc.region and adds a theme. "Quest complete" uses the same banner (see build 71).
- Vigor bar (p7 drawHUD): one layer = 17 vigor. Below 17 the bar grows with max vigor; at 17 it is the full width of the
  slot row. Every further 17 lays another fill over the same bar, darker and more solid (layer(i), k = 1 - 0.55^i, no
  limit); the top layer's room shows faintly; low vigor pulses a red frame. The depth gaps themselves already widen
  (baseVig: 8, 12, 18, 27, 41, 61...). state.vigorBar records the geometry.
- Slots: only filled slots draw, in A S D F order, as a group centred under the vigor bar (drawSlotBar).
- Sparkles on items (drawGlints): about 1 to 2 per 10 s far off, one at a time (two at most within reach), 9 in 10 tiny
  and faint (0.035 to 0.07 tiles, alpha under ~0.35), the rest up to the old size, 0.15 to 0.65 s each, and never twice
  in the same spot running.
- Tests: t70 (bar sizes/layers/centring, sparkle rates and sizes, banner caching and region, held completion banner).
  tools/shot.js B70=1.

## Build 69 in short
- Text stays while it's relevant. say(..., {site: {x, y, r}}) ties held text to a place: walk more than r tiles away and it
  lets go and fades (updateTexts in p4). Held speech without a site lets go 11 tiles from where it was said. pipSay takes
  a 5th arg `site`; visits pass their spot. At the garden patches (within 4 tiles, with seeds) Pip says "Stand over here and
  shove them in the dirt! They love this stuff." (site r 6).
- Vigor bar is a fixed width: exactly the A S D F row (s * 5.85), whatever the vigor depth (p7 drawHUD).
- Blades: bladeKind() (p14) = 'steel' (the stump sword) or 'wood'. Combat, slams and hero drawing use it instead of
  inv.sword; story checks (pipWithYou etc.) still use inv.sword. Wooden sword: 3 sticks on the mat, inv.woodsword =
  WOOD_SWORD (14) durability; bladeWear(1) per swing (slash start, stab start) and per landed hit (slash, stab, whirl);
  splinters from 5 down, shatters at 0 (fx, line, slot clears). Hits at 0.6x. It's a weapon slot entry like the others.
  Measured: 13 swings at nothing, or 7 landed strikes.
- Crafting rework (p13). Field (the mat, anywhere): camp raw/pieces, small charms, the wooden sword, augmentations and
  food. Ingredients come from one pool: stockOf/takeStock cover raw, MATS, acorns and food. RECIPES now carry kind:
  raw | piece | wear | weapon | aug | food. New: woodsword (3 sticks), thornwrap (thorn + fluff: +1 damage, 8 hits),
  emberoil (ember + glue: sets alight, 6 hits), mash (turnip + carrot), salad (mash's two + berries), trailmix (acorn +
  berries: speed). Augmentations (inv.aug {id, n}, AUG in p14) coat the held blade and count down in augBonus(); drawn by
  augGlint. Bench (FORGE, p6): big enhancements, now also Silk sling and Horn-lashed blade: diver silk and charger horn
  drops are materials (silkpart/hornpart) worked there, no longer automatic. The Stalker's Step stays automatic (not a
  weapon).
- Knowing recipes: inv.known (made) and inv.heard (told). recipeBook() lists both in the Craft tab; F on one lays it out
  (layOut) and jumps the cursor to Combine. Sources: Pip ("Three sticks lashed together make a sword!" out gathering with
  3 sticks), Pip's reward line (mash), journal pages 5 and 8 (PAGE_LORE: ember oil, thorn wrap), and trial and error.
  matHint(): "Almost. It feels like it wants one more thing." when the mat is one short of any recipe; "...and there's room
  for one more thing." when it matches a recipe that has an unmade bigger cousin (glue -> mitts, emberoil -> embercharm,
  mash -> salad).
- Keys and slots: an entry sits in one slot only; remapping a key that's taken swaps (assignKey), so A S D F are each
  bound once. Touch buttons checked for overlap.
- Tests: t69 (12 checks). tools/shot.js B69=1.

## Build 68 in short
- Mushrooms, mellower (p14). shroomGlow: three slow waves (one wobbling its own speed) through pow 4.2: mean 0.17, above 0.6
  about 4% of the time, below 0.3 about 84%, still reaching ~1 now and then. Ripples are now individual (state.shroomRip[key]):
  random timing, speed, reach, flatness, line width, pattern (one, two, dash, waver) and strength = ceiling * rnd^2.6, so the
  old strength (SHROOM_RIP_CALM 0.14, SHROOM_RIP_MAX 0.35 just after waking) is the top and most sit far under it
  (median ~0.016, p90 ~0.08). Cap sparkle and motes slowed to match (p7 'shroom').
- No logs or ropes anywhere in the woods. Barrier kind 'wedge' = a heap of boulders wedged on a cracked keystone (p1 w1/w2/w3,
  drawn in p7 drawSolid). keystone() rope is always null now. Pip's lines say boulders and mud.
- Mud: sc.mud = [[fx, fy, radius tiles]] (w1 in front of the keystone, w2 all around it, w3 in front of its keystone),
  drawn by drawMud in p12, slows you (x0.55, p3 movement). A thrown rock that lands in mud, or one set down in it, sinks:
  sinkRock() adds a runtime buried rock (rt.flags.mudRocks, synced into sc.pullables by syncMudRocks on enterScene). It is
  a normal buried rock: pound beside it (knockRocks), rock it and heave (updatePull/freePullable), which removes it again.
- Abduction (p6 'abduct'): no camera lock, you steer the whole time (movement done inside the cut). Get within 1.6 tiles
  and Pip and the gremlins spring 3.2 to 4 tiles away in a 0.3 s arc (p.hz / g.hz lift, drawn in p7), biased toward the
  hole, with a jeer the first time. They're dragged on to the hole between hops; c.gone ends it (forced by 11 s).
  Its lines pass hold:false.
- The sword is hidden: a dark, moss-covered knob sunk in the stump, faint from afar; the Pull label only shows within
  0.9 tiles; w3's area line no longer mentions a glint. Pulling it runs a longer reveal (startSwordCut / 'sword' cut /
  drawSwordReveal in p7): rumble and moss, light fanning out of the stump (0 to 1.5 s), the blade rising rust and all with a
  line of light running up it (1.5 to 3.1 s), then it's yours (inv.sword set at 3.1 s), the leap, rays, "THE BLADE".
- New quest alert: showTitle(name, 'a new quest', 'herald', 3.6), never held: fades up in gold over a soft band of
  light, lingers, melts away (p5 drawTitle 'herald'). Quest complete is still held for F.
- Tests: t68 (12 checks). t65 steps 10/11 updated for the fleeting alert. tools/shot.js B68=1.

## Build 67 in short
- F picks things up. Walking over an item no longer takes it (p3 update loop), except TOUCH_PICKUP (spore, spores7, wisp).
  itemAtFeet()/pickUpHere() in p3 (reach PICK_R = 1.15 tiles, grounded, not carrying); interact() calls it right after the
  carry check, so held text is cleared first, then pickup, then everything else. pickUpHere runs tidySlots at once.
- No button or label for items. The cue is sparkle: drawGlints() in p5 (state kept in the GLINTS WeakMap, never on the item,
  so saves stay clean). Rate 0.3/s far, rising with nearness, +6/s within reach; each glint has a random life and a kind
  that gets fancier the closer you are (star4, star8, spin, motes, ring); in reach they turn warm gold. t67: 4 s counts
  far/near/reach, all five kinds only in reach.
- Pounding: every outdoor screen gets 2 or 3 hidden loose spots (rt.flags.loose, made on first pound there). slamDown ->
  poundLoose(): within 1.7 tiles a spot gives one find from LOOSE_FINDS (local seed, acorn, stone, stick, berries, thornseed,
  carrotseed, emberseed) and is spent; within 3.5 tiles the ground rattles (dirt motes). Nothing marks them.
- Pip, once each: "Try pounding around in different places..." (out gathering, after the camp shopping list) and "Get enough
  of those acorns, and you can make some awesome compost!" (first acorns, before the adventure). The first patch step is
  now "work in acorn compost" and the choice reads "Compost it: ...".
- Quest HUD: light and see-through by default (row alpha 0.38, faint box). A milestone (new quest, step done) sets
  state.qPulse[id]; that row is bold, gold-edged and glowing for Q_BRIGHT 3.5 s, then fades back over Q_FADE 2.5 s.
  A finished tracked quest shows ticked in green (state.qDone) for Q_DONE 6 s, then goes. questGlow(t) in p13.
- Tests: t67 (11 checks). t56/t57/t64/t65 now press F on items and use the seed slot's key.

## Build 66 in short (slots, wheel, wearables; all in p14 unless noted)
- One slot model. inv.slots = {a, s, d, f}, each {kind: weapon|food|seed|ability, id} or null; inv.slotV = 2 (older saves'
  'auto' slots convert in slotsOf). slotOptions() is the single list of what can be slotted; entryCount/entryInfo describe any
  entry; setSlot(k, e) moves an entry (it leaves any other slot); useEntry(e) is the single "use it" path for slot keys, the
  wheel and F. Nothing else should hand-roll food/seed/weapon lists.
- Slots start empty and draw nothing (no box, no letter). tidySlots() (4x/s from update) clears slots whose thing ran out and
  drops newly owned things into an empty slot (weapons F first, the rest A/S/D). A full bar is never overwritten: one tip
  points to R and the pack (tipsSeen.slotsFull). inv.slotSeen tracks what has been offered.
- F is the dynamic action: interact() first; if nothing is here, F uses the F slot (weapon: equips it and combat runs; other:
  useEntry). A weapon on A/S/D: slotWeaponHeld() (inside held.act) makes that key act as the weapon key and sets
  state.slotAct, which skips interact(). Same swing/stab/throw code for every key. syncEquip() keeps state.equip valid.
- Seeds on A/S/D: that key plants; seeds on F: F plants (interact's plot branch). seedSlotKey() looks at all four.
- Wheel: hold R = consumables for use now (food, seeds). Hold R + A/S/D/F = everything slottable for that slot plus "Empty";
  let go of R to set it. Tap R steps F through weapons. World runs at 0.05x while the wheel is open. radialOptions/
  radialLabel/applyRadial/cycleEquip in p6, drawRadial in p7.
- Menus: D backs out (acts -> grid -> tabs -> closed; other views close; ask() choices cancel). F selects. menuBack() in p6.
- Wearables: WEAR table (cap = Stalker cap, stonecharm, mitts, embercharm, feather), inv.gear (owned), inv.worn, wearSlots() =
  2 (+1 Pip rescued, +1 tortoise). wears(id) is the only check effects use. Pack tab "Wear" toggles them. drawWorn() draws
  every worn thing on the hero. Effects: cap (old scalp checks), stonecharm in hurtHero (x0.75), mitts in eatFood (x1.25) and
  turnip regen (x2), embercharm sets burn on acorn hits (p6 updateShots) and unlocks the Flare ability (flare() in p14).
  Sources: cap from the stalker parts as before; feather from Pip at "Home base"; the charms are craft-mat recipes
  (RECIPES entries with wear: true; mats like ember can go on the mat; mitts need a first harvest).
- Pip: during a pipSay visit Pip stays at the thing until you've read the line (held 'pip' text), even with you beside it.
  Conversations (npcTalk) no longer freeze you; screen exits wait until the talk ends.
- Tests: t66 (30 checks: empty start, auto-equip order, no overwrite + tip, each key using its slot, sword on A, food on F,
  wheel use/assign/slowdown, tap R, D back in menus, crafting and wearing charms, stone charm damage, Flare, Pip waiting,
  walking in conversations, old-save slots). t61 predates the empty-start slots and is stale in its expectations.
  tools/shot.js B66=1 renders the HUD, both wheels and the Wear tab.

## Build 65 in short
- Opening is no longer a cutscene. startIntro puts you on the bank at the jetty's foot (solids within 2.6 tiles of that spot are
  removed at world start) and sets state.intro = {step, gone}. updateIntro (called from updatePip) says INTRO_LINES one at a time,
  each waiting for F; checkEdges refuses every exit while !intro.gone; drawHUD hides until then. After the third line Pip walks
  off the south edge, then state.intro = null and inv.story = STORY.garden.
- Held text: say() with key 'pip'/'npc' now holds (life 1e9, t.hold) until F or a tap; showTitle(..., hold=true) does the same
  for New quest / Quest complete. dismissHeld() runs in update() right after readPresses and eats that F press (title first,
  then the oldest held speech). updateCut returns early while heldText(), so cutscene timelines pause on a line.
  Narration inside an action beat passes hold:false (raft lines, Pip's "Over here!"). NPC conversations (startTalk/advanceTalk)
  page themselves and pass hold:false. pipSay/pipGatherTalk/the robin's "not this time" line wait while speakingNow().
  drawReadOn() draws the key badge on held boxes and titles.
- Garden phase (inv.story === STORY.garden): Pip stands at gardenSpot() (beside meadow plot 0), state.pip.atGarden, never
  visits, hidden on every other screen. Lesson lines are said from there, gated by the hero being within 7 tiles.
- Quest HUD: drawQuestHud() in p13 (called from drawHUD), top right, up to 3 tracked current quests; state.questHudRect is
  reserved in reservedRects. inv.qtrack[id] = true means tracked; trackQuest(id, on), tracked(id) (no qtrack object = all on).
  New quests start tracked. Quests tab: F on a current row toggles it; green dot + "active" on the row. Completed quests drop off.
- Seeds: SEEDS in p3 now has turnipseed/carrotseed/pepperseed/squashseed with crop and n:[lo,hi] (vegetables per seed), plus
  the material seeds. SEED_OF, CROP_SEEDS, localSeed(sc) (a 'seed' in a stone/fish/flock drop becomes the local crop's seed).
  Robin drops turnipseed (first guaranteed), rabbits carrotseed, gremlins turnipseed. seedOfPlot/cropOfPlot in p6 resolve what a
  patch holds (old saves planted 'seed'). migrateSeeds(inv) runs on load: bag.seed -> turnipseed, favSeed, slot ids, plot seeds.
  Icons in p5 drawItemIcon follow the real seeds. Harvest gives n[0]..n[1] (+ patch bonus / crop-level extra).
- Food: turnip goes into inv.turnipRegen and trickles back (max(0.35, R/8) vigor per second, in update), 30% + 8%/crop level
  chance to raise max vigor; carrot heals on the spot as before. FOOD_INFO says so.
- Pip's garden quest: last step "Harvest a turnip" (harvests > 0). QUESTS[].reward() runs on completion (not on quiet backfill):
  1 turnip, 1 carrot, 1 carrotseed.
- Tests: t65 covers all of the above (34 checks). t21/t56/t57 updated for held text and the new opening. tools/shot.js: B65=1.

## Conventions that matter
- Everything is in fractions of the screen (fx, fy) at gen time; UNIT = one tile in px (H/14 landscape). Anything that must be
  jumpable/hoppable is laid out in TILES at enterScene (stepping stones, ravine rock columns, ledges, ravines on the crags).
- Runtime per-screen state lives in RT[id] = {deadAt, items, pulled(Set), flags}. Barriers: solids with `bar`; broken when
  rt.flags[bar] is true (breakBarrier). showFlag: solid appears only when rt.flags[showFlag] (camp pieces).
- Save format v16. Settings in localStorage 'quest-settings'. Three save slots.
- Test modes share ALL gameplay code. ARENA/PUZZLE only add a hub screen, a kit, and a few System items. Keep it that way.
- Text: say(text, x, y, {key, life, tip, color, hold}). key 'pip'/'npc' = speech: held until F unless hold:false (holds titles). tips go to the menu marquee only.
  Prompts "F to ..." are replaced by the action ring + label (findInteractable). Text boxes are placed once and fixed (t.pos).
- Pip: pipSay(key, text, at, sight) says once per key, walks to `at` and waits there until you come over.
- Story flags: inv.story = STORY.garden(1) -> tocamp(2) -> gather(3) -> adventure(4). campBuilt('fire'|'tent'|'bench').
- Quests (build 63): QUESTS in p13 = chains of steps {id, name, line(), done()}; a quest opens when start() is true.
  updateQuests() (4x/s from update) advances steps in order and appends {q, s, t: playTime secs} to inv.qlog, and
  inv.quests[id] = {at, step, done}. It only watches story state; never drive the story from it. First tick after
  resetRun (load/new game) is quiet with t null, so old saves backfill without titles. New quest / Quest complete use
  showTitle(..., 'area') so they wait for speech. Chains: Pip's garden (Gather seeds, Plant seeds, Come back later =
  first harvest, inv.harvests), Set up camp (Follow Pip, Gather 2 stones/3 sticks/2 fluff counting crafted pieces,
  Build fire ring, Build bench), then Find Pip, toad's beans, journal, Downriver, mushrooms. Quests tab (main game)
  is a list: CURRENT (newest quest first, step name, progress line, "step n of m"), then a folded "Log (n)" row,
  F toggles it, entries newest first with quest and play time. Arena keeps its zone grid in that tab.
- Keys: arrows move, Space jump, F act + F slot, R tap = next weapon in F / hold = wheel (+A/S/D/F to set a slot), A/S/D slots, E fire, M menu, D back in menus.
- Planting (build 64): the quick slot holding seeds is the plant button. seedSlotKey()/seedKeyLabel() in p14; the
  patch prompt shows that key, F on an empty patch only improves it (or says "D plants."). With no seed slot, F plants.
- Pip while gathering (build 64): pipGatherTalk in p6 replaces "The woods are the other way" until the camp is built.
  On screens with camp materials (initItems, or rabbits for fluff) or off the home paths: "Let's keep looking around.
  Still need ..." or "We have what we need from here. Still need ...", repeated only when the answer changes;
  "That's everything! Back to camp." once. The woods line remains for the adventure phase.
- Skills (build 62): inv.skill[id] = {n (uses), hits, lvl}; progress = n + 2*hits crosses SKILLS[id].steps (4 levels);
  each step says SKILLS[id].lines[lvl-1] once, in SKILL_COLOR '#c9a2ff', key 'skill'. Never show numbers. Only 'acorn' is
  wired: skillUse('acorn') in launch(), skillUse('acorn', true) on an enemy hit in updateShots(). sword/dodge/farm tables
  exist with lines but nothing calls them yet. Acorns: spread ACORN_SPREAD[lvl] degrees, homing ACORN_HOME[lvl] rad/s
  toward the nearest hittable enemy inside a 36 degree cone within 4+lvl tiles. Arena System item "Acorn practice" cycles
  the level for testing (setSkillLevel). Old saves get inv.skill lazily; save format still v16.
- Never use pressure plates language: woods puzzles are cracked keystones under wedged boulders (throw a rock), buried rocks
  (stomp to knock loose, then rock and heave), mud (rocks sink; pound and pull them out), brambles (thrown rock), the
  gremlin burrow (thrown rock). No logs, ropes or tied gates.

## Testing (headless, node)
`tests/*.js` eval index.html with a fake canvas/audio (see the top of t21.js). Run from /tmp with index.html at
/mnt/user-data/outputs/index.html (or edit the path). Useful ones:
- t21 full game tour to the rescue  - t57 garden/robin lesson  - t56 opening + camp build  - t59 twilight/forest/hole
- t42 stepping stones (12 crossings) - t44 rock columns + crags - t51/t52 wind sets & rides - t60 food levels/gusts/HUD
- t65 build 65 opening, held text, garden Pip, quest HUD/tracking, seeds, turnip regen - t61 quick slots + fixed text - t62 acorn skill (hit rates by level, level-up once, save round trip) - t63 quest chain, log order, fold, old-save backfill - t64 seed-slot planting, Pip gather lines - t43 puzzle mode (11 stones) - t47 arena (4 zones) - t33 text overlap - t41 legibility
- t33 frames-with-overlap baseline: 104 at build 61, 122 at build 63 (quest titles), 95 at build 64, 39 at build 65; worst pair/res/off still 0.
- tools/overlap.js: 300 worlds, expects "overlaps 0". tools/shot.js renders PNGs with @napi-rs/canvas (npm i in tools/); SKILL=1 renders the level-up line, QUESTLOG=1 the Quests tab folded/open.
Some older tests (t15, t32, t38, t27) are stale after redesigns.

## Where things are (world)
Camp (lean-to, fire ring, bench, 6 patches, mushroom) north of the glade (start). Meadow (Pip's garden, robin) west of glade;
riverbank north of meadow (old jetty south bank; Wick's shack + jetty far bank; ford west). Woods w1..w3 east of glade
(sword at w3, sinkhole to caves). Mountain path f1..f7 south (wind sets of three, ledges, rock columns, tortoise at f7),
High Crags peak1..3 east of f7 (unlocked after the tortoise). Foothill farm west of f1. Marsh/hollow/swamp/caves as before.

## Balance / pending ideas
- Charger horn only from 2 chargers; ironwood bottleneck (3 recipes want 10); Warden enrage threshold 9 (consider 12).
- Drawn hero is shelved (arena + &model only) until reviewed.
- Ideas parked: chapter 2 dungeon under the swamp shrine, seasons, gremlin raids on the farm, rope traversal, music reacting to combo,
  new game+, co-op; unbuilt monsters (Bog Bellower, Moss Golem, Thornback boar, Nettle Sprite, Ash Wraith, Gremlin Chief,
  Mountain Roc (foreshadowed at the summit), Wind Wisp, Salamander, The Sleeper).

## Next task (suggested)
Wire the other skills through the same table: skillUse('sword') per swing and ('sword', true) per hit in p4 combat,
skillUse('dodge', true) when a dodge avoids a hit (state.dodged), skillUse('farm') per plant/harvest. Then give each
level a small effect: sword combo window, dodge cooldown, crop speed. Keep levels invisible and the lines rare.
