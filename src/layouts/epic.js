// ===== layouts/epic.js: the canyon's plates, pits and seams (?edit=epic; S copies this file: paste it over this
// one). Composed 7 Oct as the stone's test screen (docs/parked/mock-epic.js), moved into the game in 236. The format
// is layouts/mt2.js's: 0 the north cliff band three tiles thick, 1 a second band on it, 2 and 3 the cave's walls, 4 its
// roof with a mouth south, 5 a shelf east, 6 a tier on it, 7 a ridge by the side canyon; a crack on the band's crown;
// a ravine through the shelf. 8 to 17 the ways up (237, Ross: cannot jump onto platforms; a held jump reaches about a
// tile, every face here is over it): steps of 0.5 to 0.8 against each face, discs of brush: 8 the ridge's, 9 to 13 a
// stair up the band's west end to the second band, 14 the shelf's (at its west end, clear of the ravine's rim), 15 the tier's, 16, 18 and 17 the cave's wall and roof (0.6, 1.2, the wall 1.8, 2.3, the roof 2.8).
LAYOUTS.epic = {
  "plates": [
    {"kind": "brush", "seed": 11, "base": 0, "thick": 3.0, "tone": 134, "under": -1, "strokes": [{"r": 3.2, "pts": [[18, 6], [30, 5], [42, 7]]}], "plates": []},
    {"kind": "brush", "seed": 12, "base": 3.0, "thick": 2.4, "tone": 134, "under": 0, "strokes": [{"r": 2.2, "pts": [[22, 5], [40, 6]]}], "plates": []},
    {"kind": "brush", "seed": 21, "base": 0, "thick": 1.8, "tone": 134, "under": -1, "strokes": [{"r": 1.4, "pts": [[20, 14], [20, 22]]}], "plates": []},
    {"kind": "brush", "seed": 22, "base": 0, "thick": 1.8, "tone": 134, "under": -1, "strokes": [{"r": 1.4, "pts": [[25.5, 14], [25.5, 22]]}], "plates": []},
    {"kind": "brush", "seed": 23, "base": 1.8, "thick": 1.0, "tone": 134, "under": -1, "strokes": [{"r": 3.4, "pts": [[22.7, 13.5], [22.7, 19]]}], "plates": []},
    {"kind": "brush", "seed": 31, "base": 0, "thick": 1.6, "tone": 134, "under": -1, "strokes": [{"r": 2.6, "pts": [[32, 16], [44, 15], [48, 20]]}], "plates": []},
    {"kind": "brush", "seed": 32, "base": 1.6, "thick": 1.4, "tone": 134, "under": 5, "strokes": [{"r": 2.0, "pts": [[36, 12], [46, 12.5]]}], "plates": []},
    {"kind": "brush", "seed": 41, "base": 0, "thick": 1.2, "tone": 134, "under": -1, "strokes": [{"r": 1.6, "pts": [[8, 10], [12, 18]]}], "plates": []},
    {"kind": "brush", "seed": 51, "base": 0, "thick": 0.6, "tone": 134, "under": -1, "strokes": [{"r": 0.9, "pts": [[13.0, 19.6]]}], "plates": []},
    {"kind": "brush", "seed": 52, "base": 0, "thick": 0.8, "tone": 134, "under": -1, "strokes": [{"r": 1.0, "pts": [[12.6, 9.6]]}], "plates": []},
    {"kind": "brush", "seed": 53, "base": 0, "thick": 1.6, "tone": 134, "under": -1, "strokes": [{"r": 1.0, "pts": [[13.6, 8.4]]}], "plates": []},
    {"kind": "brush", "seed": 54, "base": 0, "thick": 2.3, "tone": 134, "under": -1, "strokes": [{"r": 1.0, "pts": [[14.8, 7.2]]}], "plates": []},
    {"kind": "brush", "seed": 55, "base": 3.0, "thick": 0.8, "tone": 134, "under": 0, "strokes": [{"r": 0.9, "pts": [[19.0, 7.0]]}], "plates": []},
    {"kind": "brush", "seed": 56, "base": 3.0, "thick": 1.6, "tone": 134, "under": 0, "strokes": [{"r": 0.9, "pts": [[20.4, 6.6]]}], "plates": []},
    {"kind": "brush", "seed": 57, "base": 0, "thick": 0.8, "tone": 134, "under": -1, "strokes": [{"r": 1.1, "pts": [[30.6, 18.9]]}], "plates": []},
    {"kind": "brush", "seed": 58, "base": 1.6, "thick": 0.7, "tone": 134, "under": 5, "strokes": [{"r": 1.0, "pts": [[33.6, 13.6]]}], "plates": []},
    {"kind": "brush", "seed": 59, "base": 0, "thick": 1.2, "tone": 134, "under": -1, "strokes": [{"r": 1.0, "pts": [[18.0, 20.6]]}], "plates": []},
    {"kind": "brush", "seed": 60, "base": 1.8, "thick": 0.5, "tone": 134, "under": 2, "strokes": [{"r": 0.8, "pts": [[19.8, 21.6]]}], "plates": []},
    {"kind": "brush", "seed": 61, "base": 0, "thick": 0.6, "tone": 134, "under": -1, "strokes": [{"r": 1.0, "pts": [[16.8, 21.3]]}], "plates": []}
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
