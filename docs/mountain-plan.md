# The mountain: the rise and the climb as one family (roadmap, 1 Oct, rewritten in build 205)
Ross, 1 Oct: the rise through the climb is one reimagined family, not the rise plus five puzzle screens. One look
that changes with height (palette, ground, stones, plants), one set of assets, one progression of enemies and
obstacles, secrets and hidden areas on every screen, side quests along the way. The climb's puzzles come back as
features of that family. Some screens are fixed and zoomed out, the rest move like the rise. Each seed decides
which way the mountain runs (left or right), and the layout follows it. Until the reeds open, all real play stays
west of them; only test links (?mountain) start past them.

## One generator
The rise is the first screen of the family, and rise.js becomes the family's builder: one function that lays out a
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
- The ornithologist: collects eggs from certain birds (the robin's, a hawk's, a mountain bird's), found in nests
  hidden up the mountain (the secrets); he really wants to try carrot juice.
- Carrot juice: two carrots; a little vigor back; thrown, every rabbit in range fights over it.
- The tortoise, in its hollow where the wind drops to a breeze: loves peaches; for peaches it gives peach stones
  (and what it gave before: the step up in vigor depth, the way on to the crags).
- Trees: peach stones grow peach trees that bear peaches in time. Where trees grow is Ross's call (below).

## Builds (main's BUILD plus one each, one at a time)
205 the reeds hold (dash and lunge stepped in pieces). FABLE.
206 the wind by height (built, waiting on Ross's OK of the mockup). Opus.
207 the generator: rise.js becomes the family's builder; the rise rebuilt on it, no change in play (every test's output
    and the draw-record hash identical). FABLE.
208 direction by seed: the rise and everything after it run left or right as the seed says; f1's way down moves to
    match. FABLE.
209 the height table: palette, ground, stones, plants and rabbit size and temper by height (the rise shows the first
    steps). FABLE.
210 m1 on the generator (climb1 out of climb.js); its secret. FABLE.
211 hawks hunt rabbits; nests and eggs as secrets; the ornithologist and his egg quest. FABLE.
212 m2. 213 m3 inside, its hidden area. 214 m4, rabbits drive off the hawks. FABLE each.
215 m5, the buff rabbits, carrot juice (and the ornithologist's taste of it); climb.js deleted. FABLE.
216 the tortoise's hollow, peaches, peach stones. FABLE.
217 trees: growing peach trees where Ross chooses, harvests. FABLE.
218 the windmill. Opus (FABLE if it does more than turn).
Mockups: a still for every new look just before its build (the generator's palette by height before 209, the
hawk lifting a rabbit before 211, the ornithologist before 211, the interior before 213, the buff rabbit before
215, the hollow before 216, the windmill before 218).

## Waiting on Ross
1. The wind mockup (206): OK, or bigger or warmer dust, a softer fur tuft.
2. The windmill: which mushroom (f1 has none; the nearest field mushroom is the old foothill farm's, west of f1),
   and does it only turn with the wind, or do something (grind, pump, a spore landmark)?
3. Direction: each seed picks whether the mountain runs left or right (the read of "pan left or right").
4. The ornithologist: where he lives (default: by the windmill), which birds' eggs, what he gives for them.
5. Trees: one orchard (default: on the foothill farm), farm patches that convert to tree plots, special spots in
   the world where certain trees grow, or a mix.
6. Any secrets or hidden areas you already picture; otherwise they are designed screen by screen.
