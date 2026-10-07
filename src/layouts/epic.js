// ===== layouts/epic.js: the canyon's plates, pits and seams (?edit=epic; S copies this file: paste it over this
// one). Composed 7 Oct as the stone's test screen (docs/parked/mock-epic.js), moved into the game in 236. The format
// is layouts/mt2.js's: 0 the north cliff band three tiles thick, 1 a second band on it, 2 and 3 the cave's walls, 4 its
// roof with a mouth south, 5 a shelf east, 6 a tier on it, 7 a ridge by the side canyon; a crack on the band's crown;
// a ravine through the shelf.
LAYOUTS.epic = {
  "plates": [
    {"kind":  "brush", "seed":  11, "base":  0, "thick":  3.0, "tone":  134, "under":  -1, "strokes":  [{"r":  3.2, "pts":  [[18, 6], [30, 5], [42, 7]]}], "plates":  []},
    {"kind":  "brush", "seed":  12, "base":  3.0, "thick":  2.4, "tone":  134, "under":  0, "strokes":  [{"r":  2.2, "pts":  [[22, 5], [40, 6]]}], "plates":  []},
    {"kind":  "brush", "seed":  21, "base":  0, "thick":  1.8, "tone":  134, "under":  -1, "strokes":  [{"r":  1.4, "pts":  [[20, 14], [20, 22]]}], "plates":  []},
    {"kind":  "brush", "seed":  22, "base":  0, "thick":  1.8, "tone":  134, "under":  -1, "strokes":  [{"r":  1.4, "pts":  [[25.5, 14], [25.5, 22]]}], "plates":  []},
    {"kind":  "brush", "seed":  23, "base":  1.8, "thick":  1.0, "tone":  134, "under":  -1, "strokes":  [{"r":  3.4, "pts":  [[22.7, 13.5], [22.7, 19]]}], "plates":  []},
    {"kind":  "brush", "seed":  31, "base":  0, "thick":  1.6, "tone":  134, "under":  -1, "strokes":  [{"r":  2.6, "pts":  [[32, 16], [44, 15], [48, 20]]}], "plates":  []},
    {"kind":  "brush", "seed":  32, "base":  1.6, "thick":  1.4, "tone":  134, "under":  5, "strokes":  [{"r":  2.0, "pts":  [[36, 12], [46, 12.5]]}], "plates":  []},
    {"kind":  "brush", "seed":  41, "base":  0, "thick":  1.2, "tone":  134, "under":  -1, "strokes":  [{"r":  1.6, "pts":  [[8, 10], [12, 18]]}], "plates":  []}
  ],
  "pits": [
  ],
  "seams": [
    {"spine": [[24, 3], [34, 4.5], [40, 3.5]], "top": 5.4}
  ],
  "ravines": [
    {"spine": [[34, 16.8], [44, 16.2]], "w": 2.8, "depth": 1.6, "top": 1.6, "seed": 61}
  ]
};
