# The mountain: the rise and the climb as one family (roadmap, 1 Oct, rewritten in build 205)
Ross, 1 Oct: the rise through the climb is one reimagined family, not the rise plus five puzzle screens. One look
that changes with height (palette, ground, stones, plants), one set of assets, one progression of enemies and
obstacles, secrets and hidden areas on every screen, side quests along the way. The climb's puzzles come back as
features of that family. Some screens are fixed and zoomed out, the rest move like the rise. Each seed decides
which way the mountain runs (left or right), and the layout follows it. Until the reeds open, all real play stays
west of them; only test links (?mountain) start past them.

## One generator
The rise is the first screen of the family, and rise.js became the family's builder, mountain.js (206): one function that lays out a
mountain screen from a spec, in tiles at enterScene, from its own stream (mulberry32 of the seed and the screen id,
never the world's rng), collision and drawing from the same shape functions. A spec gives:
- size, and camera: fixed and zoomed out, or moving (the rise's pull-back and tilt);
- direction: which way the way runs, from the seed (the whole chain flips together, and f1's way down sits on the
  matching side);
- height range: from it come the palette, the ground, the stones and plants, the wind (what it carries, how hard),
  the creatures and how big and short-tempered they are;
- features: the climb's puzzles as pieces (a winding ravine crossed at its narrow points, islands over a drop,
  rifts that crack open ahead of you, bare islands with big rocks to shelter behind, side-view ledges, a way inside),
  each laid out jumpable (no gap wider than a running jump);
- secrets: at least one per screen (a nest, a nook behind a rock, a ledge you only see from below, a way in).
climb.js shrinks a screen at a time and is deleted when the last puzzle has moved.

## The progression, by height (0 the first field, 1 the High Reaches)
- Look: lush green on the rise, then dry grass and tan earth, then grey stone and grit; trees thin out, boulders
  turn to crags.
- Wind: leaves low, dust, grit, the odd tuft of fur, feathers where the hawks hunt; up to a third harder at the top.
- Rabbits: the rise's rabbits, then bigger and snarling, then fighting back; at the top, buff rabbits hopped up on
  carrot juice, bodybuilding, short-tempered, always after the next carrot or health juice; they drop hide.
- Hawks: the High Reaches' hawk (dives, grabs and carries), hunting rabbits and you; at the fourth screen the
  rabbits drive them off, and above that there are none.
- Obstacles: a narrow ravine, then islands, then rifts that open ahead of you, then bare islands in strong wind,
  then the ledges.

## The chain (directions are the seed's)
rise > m1 the wind shelf (moving) > m2 the stepping path (fixed, zoomed out) > m3 inside the mountain (moving)
> m4 the windy crossing (fixed, wide) > m5 the last ledges (side view) > the tortoise's hollow > peak1.

## Side content
- The windmill: beside a field mushroom, turning with the gusts.
- The ornithologist (Ross, 1 Oct): a traveller, not a resident. Start the game and he is struggling up the mountain
  ahead of you; you meet him now and then on the way, not on every screen. Collects eggs from certain birds (the
  robin's, a hawk's, a mountain bird's), found in nests hidden up the mountain (the secrets); he really wants to try
  carrot juice.
- Carrot juice: two carrots; a little vigor back; thrown, every rabbit in range fights over it.
- The tortoise, in its hollow where the wind drops to a breeze: loves peaches; for peaches it gives peach stones
  (and what it gave before: the step up in vigor depth, the way on to the crags).
- Trees: peach stones grow peach trees that bear peaches in time. Trees grow only in dedicated tree patches (Ross,
  1 Oct): a patch of their own kind, trees only, not convertible to an ordinary plant patch for now.

## Ravines (Ross, 1 Oct, build 208)
Bottomless, no floor or end in sight; the far walls lean toward the view and slide as you walk; set-in stones; a faint
river on the biggest; nothing inside; no islands inside (islands are laid on purpose by their own generator, after the
ravines, before the rivers); spiders and pits parked. Full rules in docs/design-rules.md.

## Islands (Ross, 1 Oct: the islands are hard to read without the tiles on)
Keep each screen's perspective as it is (no special camera over jumps). For now every island is at least 2 tiles
across, and every gap a sure running jump. Smaller platforms may come later, by Ross's call. Since 211 islands come
from genIslands (mountain.js): laid after the ravine, a pillar out of the drop each, one shape (islField) for the test and
the drawing, gaps measured on the ground along the line a player lines up on (islGapTo).

## Builds (main's BUILD plus one each, one at a time)
205 the reeds hold (dash and lunge stepped in pieces). Done.
206 the generator: rise.js became mountain.js, the family's builder (MTN specs, RISE the first); no change in play
    (test output, renders, world and draw hashes identical). Done.
New scenes first (Ross, 1 Oct):
207 m1 the wind shelf on the generator (scene mt1: m1 to m3 are the marsh's ids), out of the rise's pass, leading on
    to mt2 since 211: the ravine (M1.rav) crossed at three 1.3-tile narrows, ledge-to-ledge gust rides
    where it's wide, an island on a pillar at the widest (the secret: carrots), hares, the dry palette. Done; dials
    in M1 (rav.hw's wide 2.5 and narrow, cross, island, floor, earth, stoneAt).
208 the rise reworked (Ross, 1 Oct): bottomless ravines from a generator (spines, traced outlines, far walls leaning
    toward the view, set-in stones, a faint river on the biggest, the brink), the big one plus the reeds as the boundary,
    a slit jumped at the path, no walls of stone (the edges and the mountain hold). Done; dials in genRavine, riseRavines,
    drawMtnDrop. Parked: spider branches, round pits, big wall stones, islands (their own generator, laid on purpose).
209 the rise runs smooth: the ravines' per-frame costs cut (no canvas read-back, a field grid for the game's test,
    the outline worked out on the way in, walls culled to the screen). Done.
210 the brink lies on the ground: painted with its ravine before anything standing (you, the reeds). Done.
211 m2 the stepping path, fixed and zoomed out: a chain of islands across a wall-to-wall drop, each at least 2 tiles
    across, every gap a sure running jump, the dare a long jump off the chain. Done; dials in M2 (drop, fixed, islTop),
    m2Ravine, genIslands (r, gap, the dare's gap), the ravine's depth. The parked patch is retired.
212 m3 inside the mountain, moving camera: rifts that crack open ahead of you; a hidden area. FABLE.
213 m4 the windy crossing, fixed and wide: bare islands, big rocks to shelter behind. FABLE.
214 m5 the last ledges, side view on the main game: the buff rabbits, carrot juice; climb.js deleted. FABLE.
215 hawks hunt rabbits on m1 to m4 (the rabbits drive them off on m4); nests and eggs; the ornithologist. FABLE.
216 the tortoise's hollow, peaches, peach stones. FABLE.
217 trees. FABLE.
218 the windmill. Opus (FABLE if it does more than turn).
219 direction by seed: the whole family runs left or right as the seed says. FABLE.
Any time Ross OKs the mockup: the wind by height (docs/parked/wind-by-height.patch applies on 206: windHeight,
windPow, WIND_BITS, windFx, drawWindBit, tests/wind-height.js; 66 of 66 passed with it). Opus.
Each screen sets its own palette and creatures in its spec (the height table is no longer a build of its own).
Mockups: a still for every new look just before its build.

## Ross's answers (1 Oct, the six questions)
1. The wind mockup: OK as is (ships on Opus from docs/parked/wind-by-height.patch).
2. The windmill: by the old foothill farm's mushroom; it only turns with the wind.
3. Direction by seed: yes, each seed picks left or right.
4. The ornithologist: a traveller struggling up the mountain, met now and then (above); eggs and reward by default.
5. Trees: dedicated tree patches, trees only, not convertible (above).
6. Secrets: none pictured yet; designed screen by screen.
