# Quest: handoff notes (as of build 64, 26 Sep 2026)

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

## Conventions that matter
- Everything is in fractions of the screen (fx, fy) at gen time; UNIT = one tile in px (H/14 landscape). Anything that must be
  jumpable/hoppable is laid out in TILES at enterScene (stepping stones, ravine rock columns, ledges, ravines on the crags).
- Runtime per-screen state lives in RT[id] = {deadAt, items, pulled(Set), flags}. Barriers: solids with `bar`; broken when
  rt.flags[bar] is true (breakBarrier). showFlag: solid appears only when rt.flags[showFlag] (camp pieces).
- Save format v16. Settings in localStorage 'quest-settings'. Three save slots.
- Test modes share ALL gameplay code. ARENA/PUZZLE only add a hub screen, a kit, and a few System items. Keep it that way.
- Text: say(text, x, y, {key, life, tip, color}). key 'pip'/'npc' = speech (holds titles). tips go to the menu marquee only.
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
- Keys: arrows move, Space jump, F act/weapon, R swap (hold = wheel), A/S/D quick slots, E fire, M menu.
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
- Never use pressure plates language: woods puzzles are cracked keystones (throw a rock), buried rocks (stomp to knock loose,
  then rock and heave), brambles (thrown rock), the gremlin burrow (thrown rock).

## Testing (headless, node)
`tests/*.js` eval index.html with a fake canvas/audio (see the top of t21.js). Run from /tmp with index.html at
/mnt/user-data/outputs/index.html (or edit the path). Useful ones:
- t21 full game tour to the rescue  - t57 garden/robin lesson  - t56 opening + camp build  - t59 twilight/forest/hole
- t42 stepping stones (12 crossings) - t44 rock columns + crags - t51/t52 wind sets & rides - t60 food levels/gusts/HUD
- t61 quick slots + fixed text - t62 acorn skill (hit rates by level, level-up once, save round trip) - t63 quest chain, log order, fold, old-save backfill - t64 seed-slot planting, Pip gather lines - t43 puzzle mode (11 stones) - t47 arena (4 zones) - t33 text overlap - t41 legibility
- t33 frames-with-overlap baseline: 104 at build 61, 122 at build 63 (quest titles), 95 at build 64; worst pair/res/off still 0.
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
