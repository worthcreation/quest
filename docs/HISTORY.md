# Quest: build history (newest first)
Moved out of HANDOFF.md in build 156. One short entry per build goes at the top.

## Build 161: a ship command that stops if the folder is missing
- The ship command starts with cd ~\quest -ErrorAction Stop: when ~\quest didn't exist, the old line carried on and
  unzipped and deleted in whatever folder PowerShell was in. The docs say where the repo lives and how to clone it.

## Build 160: docs are always given whole
- PROJECT_INSTRUCTIONS.md and QUEST_WAYS_OF_WORKING.md: project text is always given as the full current file.

## Build 159: the ship command is PowerShell
- The ship command is written for Windows PowerShell 5.1 (steps joined with ;, Expand-Archive instead of unzip) and
  given in a powershell code block. PROJECT_INSTRUCTIONS.md, QUEST_WAYS_OF_WORKING.md and HANDOFF.md say so.

## Build 158: project description, and refining it at handoff
- docs/PROJECT_DESCRIPTION.md (mood, theme, direction). PROJECT_INSTRUCTIONS.md and QUEST_WAYS_OF_WORKING.md say a
  handoff refines the instructions against the source, and the description only if the direction changed.

## Build 157: project instructions brought up to date
- PROJECT_INSTRUCTIONS.md rewritten to match the source (build.sh, src/ topic files, BUILD in src/draw.js, git add -A,
  current design rules and story); the same text goes in the claude.ai Project instructions.

## Build 156: handoff docs rewritten against the source
- QUEST_WAYS_OF_WORKING.md checked claim by claim against build 156 (grep for callers); HANDOFF.md rewritten as a
  current-state document; this history split out; PROJECT_INSTRUCTIONS.md updated to build.sh and src/ topic files.

## Build 155: the wind drives you back down
- On the windy crossing the gusts now come up the mountain at you and drive you back (10 on the ground, 14 in the air,
  mostly back toward the far end). Sheltered means a big rock just nearer the camera than you (within its width and
  about 1.6 tiles behind it). Blown back past the start and you're on the screen before (climb3), near its end, with a
  scroll ("Blown back"). The streaks on this screen run up the mountain.
- build.sh now runs node --check on every source file (a stray // had swallowed part of a line twice this session).
- Test climb: blown back from the open near the start lands you on climb3. 62 of 62.

## Build 154: climb4 is the windy crossing
- climb4 ('The windy crossing') replaces the steep way. A gap field (like climb3) with three wide rifts across the way
  and six bare islands out in them (islands are simply ground inside the gap shape), and seven big rocks on the banks
  (d.boulders [x, z, r]: solid, drawn with drawJagged and the soil line, depth-sorted around you).
- d.windy: the gusts blow across the way (dir left or right, shown by the streaks), warn for 1.4 s, blow for 2 s and
  hard (6.5 on the ground, 9 in the air), with 3.5-5 s calms. Out in the open, a gust pushes you off an island or over
  an edge. Standing just downwind of a big rock (within its depth and about 1.5 tiles of its far side) you're
  sheltered and don't move; "sheltered" shows over you. The first warning shows a scroll: "Get behind a big rock, on
  the side away from the wind!"
- Tests: climb covers blown off a bare island vs sheltered behind a rock (didn't move); the side-view bot keeps its
  vigor topped up (falls now cost the screen). 62 of 62. tools/shot.js B154=1.

## Build 153: worn out on a climb, start the screen over
- The faint cutscene never ran on climb screens (the climb takes over the update), so running out of vigor left a black
  screen. hurtHero now checks for a climb first: vigor back to full, the screen starts over (newClimb), a quick fade
  and a scroll ("Worn out. Back to the start of this climb."). Works for the side view too.

## Build 152: climb3 is a broken meadow
- climb3 ('The broken meadow') replaces the switchbacks: open ground seen from higher up (camH 7.5), with four rifts
  running across the way (edges wander; the third is wide except for a narrow place near x 1.6), three chasms (ovals),
  and a short ravine running down at an angle. A screen can now be defined by gap(x, z) instead of a centre-line
  ravine; paintGapField draws any such field (grass cells, dark floors, the far wall of each hole toward you, side
  walls, crisp lips). Finish anywhere past goalZ (goalAny). Test climb: straight down through the narrow place,
  jumping each rift, gets across without a fall. 62 of 62.

## Build 151: tiles that follow the real edges
- The climb's tile grid colours each tile in quarters (halves far off), each quarter tested on its own, so the blue
  and green follow the true edge instead of whole tiles flipping on their centre point. The exact collision edges
  (both ravine lips, every island rim) are drawn over it as bright cyan lines: that line is where you fall.

## Build 150: the tile grid in perspective on the climb
- With System > Show tiles on, the climb screens draw their own grid (drawClimbTiles): one-tile squares laid on the
  ground and shrinking into the distance; blue over the ravine, green on islands, gold under you; the ravine's width
  (in tiles) labelled at each narrow point; mid-jump, how far you've jumped so far. The flat screen grid is skipped on
  the climb (it meant nothing there).

## Build 149: the shadow leads, never trails
- The shadow is now your current position plus a smoothed offset toward the landing (c.shox/c.shoz eased in the update;
  drawn at c.x + offset), so it moves with you and eases ahead in the direction you're going. Before, it was a point
  chasing a target, which lagged behind you at take-off and looked like it slid backwards first. Checked: across a
  whole running jump it's never behind you. SHADOW lead/follow tuning keys unchanged.

## Build 148: a steadier shadow, tunable live
- The shadow is its own point now (c.shx, c.shz, moved in updateClimb): it chases a target part of the way from you
  toward the landing (SHADOW.lead of the way, reached at SHADOW.arrive of the jump), with smoothing (SHADOW.follow), so
  steering mid-air no longer makes it jump about. Measured: at most about 0.05 tiles a frame. SHADOW = { lead 0.55,
  arrive 0.9, follow 7 } at the top of climb.js.
- On the ?mountain link: [ and ] change the lead, - and = the follow, with a readout at the bottom left, so the sweet
  spot can be found by feel; tell me the numbers and they become the defaults.

## Build 147: the shadow travels
- In the air the shadow starts under you and glides (eased) to the landing spot, arriving at three quarters of the
  jump, a little before you do (c.airDur set at the jump).

## Build 146: the shadow grows as you come down
- In the air the shadow's size follows your height: about a fifth of full size at the top of the jump, growing
  (quadratically) to full size as you land (c.peakH tracks the jump's top).

## Build 145: your shadow is the aim
- The landing ring is gone. In the air your shadow runs ahead of you to where you'll come down (it leads at 55% the
  moment you jump and reaches the landing spot quickly; climb.js drawClimb). Over the drop it's drawn far below, small
  and faint, so a bad jump shows at once. The first climb screen you reach shows a scroll: "Pay attention to your
  shadow. In the air, it shows where you'll land."

## Build 144: stepping stones that work
- climb2's islands are round now (the same size in depth as across; they were squashed in depth, so lining up was
  near impossible), bigger (radius about a tile), six of them in a zigzag path down and across.
- Air steering is stronger (you can correct a jump), and the pace near and far is more even.
- While you're in the air a ring shows where you'll land: green over solid ground, red over the drop.
- Test climb: a player-like bot hops the whole stepping path across. 62 of 62.

## Build 143: open green, only the ravines (testing)
- climbBand returns 12 for now, so the green runs out past the sides of the screen; the only obstacle on the trail
  screens is the interior ravine (and its islands on climb2). The zig() ledge closures are ignored while this is on.

## Build 142: just the green platforms
- To prove the concept, the trail screens drop the crags and the distant grey peaks: only the green ledges, their brown
  faces (the ravine side and the outer side), crisp dark edges on both, over the valley. Off any edge you fall (the
  ravine, or a ledge's outer edge, including where a ledge runs out past a crossing), back to your last safe spot.
  The crag painter (crag()) is still in climb.js, unused.

## Build 141: test links for the climb and any screen
- ?mountain starts straight on climb1 (no creator, no opening; story set to the adventure with the tortoise's blessing,
  a sword and acorns). The last climb screen loops back to the first instead of leaving. ?scene=<id> (e.g.
  ?scene=f3) starts on any screen the same way. While a test link is in use, keys 1 to 5 jump to climb1-5 and 0 to
  the first field (testHops, climb.js). Both links show a scroll saying so.

## Build 140: the climb as a zigzag of crossings, on level ledges between crags
- zig(crossings) (climb.js) builds a screen's ravine width and ledge widths from a list of crossings [z, side you
  arrive on]: the ravine narrows to a jump near each crossing and stays wide between; just past each crossing the side
  you came along is closed by crags (the ledge ramps down to nothing), so you must cross, back and forth down the screen.
  climb1, climb3 (five crossings) and climb4 use it; climb2 keeps its islands.
- The ledges are level grass (no more slopes falling away under you); beyond each ledge a crag wall rises and steps
  back (its face toward you, its rock top), following the ledge's edge, so the walkable ground is clearly bounded.
  Walking is held to the ledge; at a closure you can't go on along that side.
- The ravine's edge is drawn crisp: a dark line with a light grass rim along both lips. Islands have solid sides.
- Test climb: straight down the right ledge you're stopped before the first crossing. 62 of 62.

## Build 139: five climb screens, in a chain
- climb.js is data-driven now: CLIMBS[id] = { name, kind: 'trail' | 'side', cam {f, horizon, camH}, mirror, cx(z),
  hw(z), islands [[x from centre, z, r]], start [dx, z], goalZ, next }. Trail screens share one engine and painter;
  mirror flips the view (and the arrow keys) so the climb can run the other way.
  - climb1 The wind trail (as build 138).
  - climb2 Stepping stones: a wide chasm (5 tiles), mirrored, five grass-topped islands to hop.
  - climb3 The switchbacks: the chasm zigzags tightly (period 10) and narrows to under a tile in places.
  - climb4 The steep way: a high camera looking nearly straight down; mirrored.
  - climb5 The last ledges: a side view. Ledges climb to the right with gaps; arrows walk, Space jumps; the wind blows
    down the mountain against you; fall and you're back on the last ledge you stood on (1 vigor). The far ranges drift
    slower (parallax); the valley below.
  Each ends at a red flag and moves you on; the last drops you into the crags (peak1).
- Testing: "Try the climb (all five, in a row)", plus "just: <name>" for each of the other four.
- Test climb covers all five. 62 of 62. tools/shot.js B139=1.

## Build 138: the climb prototype (a new kind of screen)
- src/climb.js (in ORDER after highlands), scene 'climb1', reached from System > Testing > "Try the climb (prototype)";
  it returns you to where you were when you finish. A fixed camera looks down a trail that winds away into the
  distance: climbCx(z) is the chasm's centre line (switchbacks), climbHw(z) its half-width (narrowing to about 1 tile
  and widening to about 4). You are at (x, z) on the green slopes (left rises away, right falls to the valley), drawn
  bigger the nearer you are. Arrows move you (down = nearer = up the climb). Space is a running jump (about 2.9 wide);
  land over the chasm and you fall, lose 1 vigor and return to your last safe spot. The wind: calm, a warning rustle,
  then a 1.6 s blow that shoves you further off and sideways (harder in the air), enough to push you into the chasm.
  Reach the red flag on the near left slope to finish. The still world is painted once into a picture (paintClimb).
- engine: state.climb (like state.rapids) takes over update; drawScene hands off to drawClimb.
- Test: climb (new). 62 of 62. tools/shot.js B138=1.

## Build 137: one Pip at camp; spores as light
- Two Pips at camp after the homecoming: the scene made a following Pip beside the camp's own Pip. Now the camp Pip
  (npc, home) is moved to the fire and does the talking, state.pip is cleared, and drawing never shows a following Pip
  in a scene where a Pip lives (sc.npcs pip that npcHere).
- New particle 'spore' (drawFx): a soft violet glow with a bright core, both fading. The homecoming swirl, the Hollow
  mushroom's burst and the drifting motes from found mushrooms all use it: sparks zip away and fizzle; a few motes drift
  about afterward (and the floaters in the Hollow). The burst no longer strews little spore pickups: 8 spores cling to
  you (inv.spores), and Pip's line matches ("they're clinging to you already").
- 61 of 61.

## Build 136: the mountainside, built from the mockups
- Each path screen (f2-f6) has the rock on one side and the drop on the other (corridor.rock 'L' or 'R', alternating).
  paintMountainSides (draw.js, cached per screen) paints:
  - the rock side: crags scattered back from the grass, tiny at its edge and growing fast into tall giants (sizes by
    distance, drawn taller than wide so the lines run up), strays out on the grass, no internal seams, the big ones set
    back so none leans over the way;
  - the drop side: near-black green-brown depths full of small crags, smaller and darker deeper; a brown cliff face
    below the broken, grass-hung lip; and islands.
- Walking: the rock side is a wall (clampCorridor); off the drop side you fall (isChasm, unless you're on an island).
  Creatures keep to the way on both sides. corridorSpan leaves room for the drop away from the openings (at least 30%
  of the width), and never closes under 2.5 tiles.
- Islands (corridor.islands, up to two per screen, clear of the rifts): a grass-topped pillar out over the drop, 1.4
  tiles from the edge (a running jump is about 2.4), with an acorn or a stick on it. onIsland() for walking and falling.
- Test: mountain-side (new: walking off the drop falls, a running jump lands on the island, the rock holds). 61 of 61.
- The mockup stills are in tools/shot.js (MOCK4=1) for reference.

## Build 135: broad platforms, a narrow way now and then
- corridorSpan is mostly broad ground now (about half the screen across, wandering, with an occasional deeper bite),
  still running diagonally between the openings; the rock is the minority at the sides. Each path screen has one
  pinch (corridor.pinch, on solid ground between rifts, chosen at build): there the rock closes to a narrow way about
  2.5 tiles across. The rifts cross the broad platforms as before. Ledges use the usual spread on broad ground and two
  across a narrow stretch.

## Build 134: sticks from the trees; the river stone waits for Pip
- The glade has only about six sticks lying about now: four spread well apart (at least 4 tiles), and a couple lying
  by trees. The rest come down out of the trees: a pound by a tree (the nearest one) while camp still needs sticks
  brings down one or two (6 s per tree before it drops again); otherwise a pound shakes acorns as before.
- Pip teaches it: PIP_LINES 'slam-trees' when there are no sticks lying about, and the sticks step's reminders point at
  the nearest tree ("Give a tree a good thump!").
- The riverbank's stuck stone (early: true) can't be loosened or pulled until Pip has said his 'stone-loosen' line
  (pullLocked).
- Test: sticks-trees (new). 60 of 60.

## Build 133: the mountain path
- f2 to f6 (the climb, not f1 or the tortoise's f7) are now a mountain path: sc.corridor {n, s, seed}; the south
  opening sits on the far side from the north one, so the way runs diagonally. corridorSpan(sc, fy) (world.js) gives
  its sides: a smooth diagonal, wandering, 2 to about 4.5 tiles across, with bites taken out. Beyond it, the mountain:
  drawMountainSides/paintMountainSides (draw.js, cached per screen) draw dark rock with rough stones heaped along the
  foot, fading into shadow, and a broken edge. clampCorridor (engine.js) keeps you and every creature on the way.
- fitToCorridor: every ravine on the path runs right across it (touching ones merge), side boulders go, the ground by
  each ravine is cleared, updrafts, plants, spawns and items move onto the way, and the worn track runs down its middle.
  Rock columns and landing ledges are laid out on the way itself (two ledges per bank).
- Ravine depth: eight layers of stones, big (a tile) at the lips down to pebbles at the bottom, much darker below.
- 59 of 59. tools/shot.js B133=1.

## Build 132: lumpy stones; the zigzag soil line
- drawRock (draw.js) draws a lumpy, irregular stone (seven bumps joined by curves, a lit top, a couple of pits) from a
  seed, so each stone has its own shape: the same one in the ground, in your arms, in the air and where it lands
  (rockSeedOf(pl) for buried ones; state.carrySeed; shot.seed; item.seed).
- drawSoilLine: the zigzag brown line where a stone meets the ground. Buried throwing stones show their lumpy back
  above it (no brown oval, no grass blades, no mud sheen); the hole a pulled stone leaves is a dark dip with the line.
- Crags: the drop shadow and the dirt clods are gone; just the zigzag line round the base.
- 59 of 59.

## Build 131: broken ravine edges; the climb turns craggy; a diagonal climb
- Ravine edges wander (chasmSpan in engine.js, up to about a third of a tile either way, fixed per ravine): isChasm
  uses them, so walking, falling and jumping match what's drawn. drawBrokenChasm (draw.js) draws the shape, the stone
  fill clipped to it, and crumbling lips along each wandering edge (grass in the fields, rock on the crags). The High
  Reaches drops stay straight (they're cliff edges with the view).
- Boulders turn craggy up the climb: in f1 none, then a growing share each field screen, all of them from f6 on and in
  the crags and High Reaches (s.craggy, drawn with drawJagged, sunk in the ground).
- The climb steps up and to the right: peak1 -> peak2 and peak3 -> hr1 leave from the top-right corner and arrive at
  the bottom-left of the next screen. checkEdges now always brings you in at the far screen's own opening when the
  openings don't line up. MAP_LAYOUT: peak2 [6,8], peak3 [6,7], hr1-3 [7,6..4]; caves, falls, marsh, swamp and hollow
  shifted one column right to make room.
- 59 of 59.

## Build 130: scrolls only
- The bottom-left feed is gone: notice() (pickups, counts, item notes) now makes a small title-less scroll; a quick
  run of them shares one scroll (the newest line replaces the last while it's up); a real alert (showScroll) bumps a
  pickup note. Scrolls wrap at up to 84% of the screen (900 px) so long lines fit on one or two lines, and are at least
  11 font-widths wide.

## Build 129: the riverbank boulder takes a thrown rock; boulders sit in the ground
- The riverbank boulder (stonecrag, 2 tiles) no longer breaks to a pound: it takes two thrown-rock hits. A heavy stone
  is stuck in the ground nearby (pullable 'riverrock', early: true, so it isn't locked before the adventure): pound
  beside it to loosen it, hold F, rock it, pull it up, throw. Pip walks you through it in three lines (stone-crag,
  stone-loosen, stone-throw). A rock that bounces off a boulder never buries itself (s.bounced), so you can throw it
  again.
- Every crag is drawn sunk into the ground: the floor colour banked up round its foot with a wavy dirt rim and clods.
- Test woods-gremlins updated (pound does nothing; loosen, pull, two throws, six stones). 59 of 59.

## Build 128: the High Reaches freeze found and fixed; stone-filled ravines; the valley up close
- The freeze: hit a mantis (or anything new) and it's stunned; when the stun ends, resumeMode looked up a table that
  had no entry for mantis or hawk and threw, every frame. The loop kept running but the update died before moving you,
  so the screen froze. resumeMode now gives any creature without an entry a sensible mode. Also, enemies, hazards and
  shots now update inside their own guards, so one creature's bug can't stop you moving again.
- New test scene-smoke: every scene (46), creatures woken from a stun, three seconds of walking, swinging, throwing and
  pounding; fails on any error. It would have caught the freeze.
- Ravines (fields and the High Crags) are filled with clusters of the woods' rough stones (drawRavineStones /
  paintRavineStones, drawn once per ravine into a cached picture): big and lit near the lips, smaller and darker toward
  the middle. drawJagged takes an optional context.
- The view down from the Windy Ledge is much closer: fields, a river about a tile and a half across with sandy banks
  and moving glints, treetops either side, light haze, big clouds drifting through, bigger rising birds.
- 59 of 59.

## Build 127: stones in a boulder; gremlins who tease
- Riverbank: three smooth stones lie along the bank; the rest are inside a 2-tile boulder by the water (crag
  'stonecrag', pound: true, drops: {stone: 3}). A pound beside it counts as a hit (slamDown); it breaks after two and
  scatters three smooth stones. Pip points at it when you're short and none are lying about (PIP_LINES 'stone-crag').
  crag() takes extra options; hitCrag drops o.drops if set (else a throwable rock).
- w1: a gremlin peeks over the way-out boulder (feat.peek, drawPeekGremlin, depth-sorted so the boulder hides its body);
  it cackles and ducks away when you come within 5.5 tiles. Pip: "Did you SEE that?!"
- w2: halfway across (and before its boulder breaks) a taunting gremlin runs in from the east (updateTaunter, tauntAI
  in critters.js): stops ~2.6 tiles off to jeer, leaps away whenever you come close, swing or charge; never hittable;
  after four leaps (or 9 s) it runs back east, laughing, and is gone for good (flags.taunted). Pip: "Ignore it!".
- Test: woods-gremlins (new). 58 of 58.

## Build 126: the pack's icon belt; the Map as pages of places
- The pack's tabs are an icon belt (drawTabIcon, draw-ui.js): Gear a sword, Craft the mat, Food a turnip, Seeds a seed,
  Materials a stick, Quests a scroll, Map Pip's journal, Status you (your colour and a vigor sliver), System a cog. The
  tab you're on shows its short name under the belt (TAB_TITLE; Status reads "You").
- The Map: a page for every place you've been (mapPages, shown once you've been anywhere past the first screen), each a
  tiny picture of the place (sceneMini, cached: floor, river, drops, paths, trees and rocks, the mushroom), laid out as
  they join. Places with a traveler's mushroom you've found glow purple; you're a square in your colour. Arrows move to
  the nearest page that way; the place's name shows under the pages. Nothing is said about spores until the spores
  answer you (sporesAwake: after the rescue): then a purple page shows its cost as dots and your count, and F jumps.
  No explanatory text on the page.
- Test spores-map updated. 57 of 57. tools/shot.js B126=1.

## Build 125: Pip teaches, the pinned note only in the pack, slots that flash
- The pinned coach note draws only while the pack is open (where Pip can't talk). Out in the world, each coach step is
  said once by Pip in his own bubble instead; never both at once. The pound lesson is Pip's lines and reminders only.
- Pip's first ripe turnip: pipWithYou is true in the meadow while a turnip is ripe and you've never harvested
  (firstPullReady), even after the rescue, and PIP_LINES 'pull-turnip' has him stand by it: hold F, rock it, pull up
  (or just F at a high farming level). That harvest completes his garden quest.
- flashSlot / flashFor (gear.js): when Pip's line suggests something (swing, lunge, pound: F; throw acorns: the acorn
  key; eat: the food key; marsh fire), that slot glows and pulses for 4 s and the faded HUD comes up. say() calls
  flashFor on Pip's lines.
- Pip's pace: measured at 8 tiles/s top (catching up) against your 11; PIP_PACE 0.53 is in force (build 116).
- Test: pip-teaches (new). 57 of 57.

## Build 124: the creator screen fixed
- head.html styled every <canvas> as full-screen, which blew the creator's colour wheel and preview up to fill the
  window and hid the name box and Begin. The rule now targets #game only, and the creator canvases carry their own
  size (the wheel scales down to 62vw on narrow screens; the overlay scrolls if needed). Checked with jsdom computed
  styles. Any new canvas in the page gets normal sizing now.

## Build 123: everything you gain is in the pack; the High Reaches card
- Gear now also lists: the lantern, Wick's letter (kept on pickup, inv.letter; F: Read, LETTER_TEXT in items.js),
  journal pages (until you have the journal), the toad's beans (until you hand them over), the tortoise's blessing,
  the red crystal beetle, timed buffs (luminescence, lurker slime), and every plan you've been taught but not yet made
  ("Plan: Ironwood guard: make it at the workbench"). Rule going forward: anything the player gains must appear in the
  pack somewhere.
- The High Reaches card: timed by the real clock (not frames), any key (F, jump, M, R) after 1 s or 8 s closes it, and
  it's wrapped so an error can never leave it stuck on screen. It opens close on the peak (2.6x) and pulls back slowly
  to 1.25x; the title fades in after a second; "F to go on" at the bottom.
- 56 of 56. tools/shot.js B123=1.

## Build 122: the pound lesson comes first
- In Pip's garden the robin starts hidden in its hollow tree and stays there (robinHiding in critters.js: meadow,
  garden story, not yet flushed, no seeds yet). Pip's first line tells you: jump, then F in the air, pound the ground by
  the trunk. COACH.pound pins it ("Jump (Space), then F in the air: pound the ground by the hollow tree", then "Out it
  comes! Grab the seeds it dropped"). The pound (flushBird) sets inv.robinFlushed and the robin bursts out dropping the
  first seeds (guaranteed as before). Only then does running at it work; reminders switch from pound tips to chase
  tips once it's out.
- Tests: garden and garden-robin pound by the trunk first. 56 of 56.

## Build 121: your name and colour; no eyes for Pip; one sound per press; recent recipes
- New game: after "tap to begin", openCreator (draw-ui.js) shows a DOM overlay: a name box and a full colour picker
  (a hue ring round a saturation/lightness square, drag or click; arrows fine-tune), a preview square, and Begin.
  Stored as inv.heroName / inv.heroColor (saved with the game); heroColor() colours you everywhere; Pip says your name
  in his third opening line; the Status tab heads with your name and colour. The game ignores keys while the creator is
  open. TEST_MODE (flipped by the test harness and shot.js) skips it. Smoke-tested in jsdom (not in the suite).
- Pip has no eye dots (drawPip).
- sfx: every sound is wrapped so the same one asked twice within 70 ms plays once, and the menu clicks (tock, pickup)
  don't stack. That was the doubled confirm.
- The Craft tab's Make column lists only the RECENT_RECIPES (2) most recently made or heard-about recipes
  (inv.recipeT via touchRecipe); older ones still work if you lay the things out yourself.
- 56 of 56.

## Build 120: spores on the Map tab, mushrooms everywhere damp, Wick's cellar
- Spore travel lives on the Map tab (tabShown: journal maps or any mushroom found). sporeCells() (menu.js) lists every
  traveler's mushroom you've found with the cost from here; F on one, Travel. The map draws above the row. F at a
  found mushroom opens the Map tab (openMapTab). Travel works from anywhere; the spore cost is from where you stand.
- Each traveler's mushroom is its own (SHROOM_LOOKS, drawTravelShroom in draw.js): height, stem, cap (dome, cone,
  flat, bell, frilled), shade of purple, and markings (spots, rings, stripes, glowing dots).
- Little mushrooms (feat.minis, drawMiniShrooms): clusters strewn about woods (14), caves and hollows (16, faintly
  glowing), swamp and marsh (8), forest screens (5); none in the open fields.
- Old Wick's cellar: a trapdoor in the shack floor (feat.trapdoor, interactTrapdoor, hint "Go down") to 'cellar': dark
  (sc.dim: a light pool round you, bigger with the lantern), crates and barrels, 26 clusters of mushrooms, an acorn and
  a pepper seed. Ladder back up is the north edge.
- Test: spores-map (new). 56 of 56. tools/shot.js B120=1.

## Build 119: menacing reeds
- The reed wall at the marsh's end (solid 'reeds', burned away by marsh fire) is drawn as a wall of great dark reeds:
  nine thick stalks each (dark at the foot, olive at the top), saw-edged blades bowing out, black bulrush heads with
  spikes, a dark mass at their feet, a few thorns catching the light. The wall is taller and wider (rU 0.9, 0.3-0.7).
- Marsh and swamp reed clumps are thicker too: four stalks, a serrated blade, a bulrush head, a shadow.

## Build 118: one Pip; vigor layers by opacity
- drawPip(x, y, {side, bound}) (draw.js) is the only way Pip is drawn: following you, as an npc (camp, the cave), in
  the glimpse, tied up. It applies PIP_SIZE, his colour and his eyes. (Before, three places each drew him their own way,
  which is why the 60% size only reached one of them.)
- Vigor bar: each layer of 17 is drawn at alpha 1 - 0.53 x 0.55^i: the first at 47%, the second 71%, the third 84%,
  richer and more solid as they stack.

## Build 117: sword swings cost vigor
- SWING_COST (top of combat.js, 0.35 to start) is spent on every slash; too tired and the swing doesn't happen ("Too
  tired..."). Existing costs unchanged: lunge 0.6, whirlwind 1.5 to start then 0.35 per beat, pound 0.8. To be tuned.

## Build 116: Pip at 53% pace
- PIP_PACE = 0.53 (top of pip.js) scales everything Pip does: wandering on the jetty, the run for the dirt, leading,
  visits, going on ahead, pottering, and his hops (each hop lasts longer). The re-place rules (stuck 1.5 s, or more
  than 14 tiles away) are unchanged.

## Build 115: Pip found some great dirt
- There's no garden yet: Pip's third opening line ends "Come on, I saw some great dirt down here!" (INTRO_LINES, pip.js),
  and on arrival he says "See? Great dirt! It'll be a garden in no time. First we need seeds..." (TUTORIAL seeds step).
  The longer line runs to two pages, so the opening tests now read until the intro is done rather than three presses.

## Build 114: the High Reaches (first pass)
- New file src/highlands.js (in ORDER after world): genHighlands(S, add) builds hr1-hr3 north of peak3 (peak3 gained a
  north exit); sc.vista marks the drops, drawn by drawHighVista (drawValleyBelow / drawCloudSea: haze, forest, river,
  clouds below, rising bird dots) and drawLedgeLips, called from drawScene after the ground. Falling off a drop is a
  normal chasm fall.
- Creatures: 'hawk' (hawkAI: circle, dive, strike or grab; updateGrab carries you, F lets go, drop over a chasm sends
  you a screen lower), 'mantis' (mantisAI). makeEnemy delegates both to makeHighCritter. Solid 'crystalbug' (grand /
  tormented, some twitch) drawn by drawCrystalBug. Worm npc (drawWormNpc, wormLines); snorkels and tunnels.
- The red crystal beetle: feat.beetle on hr2, interactBeetle (F) sets inv.beetle; updateBeetle each frame (vigor near
  crystal or wind, feeds you when low); drawBeetleOnHero in drawWorn.
- The title card: state.highTitle on first arrival at hr3 (drawHighTitle, last in draw; F skips).
- Region 'high' banner theme. MAP_LAYOUT hr1-3 at [5,6]..[5,4]; MAP_NAMES.
- Vigor rest regen x0.55 (engine.js).
- Design: docs/high-reaches.md. Test: high-reaches. 55 of 55. tools/shot.js B114=1.

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
