// ===== layouts/mt2.js: mt2's plates, pits and seams, laid in the editor (?edit=mt2; S copies this file: paste it over
// this one). plateLayout reads it at enterScene. A plate: its middle x, y and size w, h in tiles, its outline's seed and
// turn (rot), base and thickness above the base plate, tone, and under (the index of the plate it stands on, or -1).
// A brush slab (kind brush): its parts instead of x, y, w, h and rot: strokes (each its points and radius r) and the
// plain plates merged into it, one outline from all of them (brushOutline).
// A tunnel: its spine in tiles, width w, floor and roof (the plates between are cut along it). A seam is a crack: its
// spine and the top of the layer it is drawn on (0 the base: a hairline; higher: a slit down through the layers under it).
LAYOUTS.mt2 = {
  "plates": [
    {"x": 4.4, "y": 21, "w": 7.4, "h": 5, "seed": 60, "base": 0, "thick": 0.4, "tone": 134, "rot": 0, "under": -1},
    {"x": 4.9, "y": 20.7, "w": 6.95, "h": 4.72, "seed": 61.3, "base": 0.4, "thick": 0.45, "tone": 136, "rot": 0, "under": 0},
    {"x": 5.4, "y": 20.4, "w": 6.5, "h": 4.44, "seed": 62.6, "base": 0.85, "thick": 0.35, "tone": 138, "rot": 0, "under": 1},
    {"x": 5.9, "y": 20.1, "w": 6.05, "h": 4.16, "seed": 63.9, "base": 1.2, "thick": 0.45, "tone": 140, "rot": 0, "under": 2},
    {"x": 2.4, "y": 15.6, "w": 4.2, "h": 2.6, "seed": 80, "base": 0, "thick": 0.4, "tone": 136, "rot": 0, "under": -1},
    {"x": 3, "y": 15.3, "w": 3.75, "h": 2.32, "seed": 81.3, "base": 0.4, "thick": 1.2, "tone": 138, "rot": 0, "under": 4},
    {"x": 3.6, "y": 15, "w": 3.3, "h": 2.2, "seed": 82.6, "base": 1.6, "thick": 0.5, "tone": 140, "rot": 0, "under": 5},
    {"x": 8.2, "y": 16.3, "w": 3.2, "h": 2.2, "seed": 100, "base": 0, "thick": 0.25, "tone": 138, "rot": 0, "under": -1},
    {"x": 8.6, "y": 16, "w": 3, "h": 2.2, "seed": 101.3, "base": 0.25, "thick": 0.3, "tone": 140, "rot": 0, "under": 7},
    {"x": 31.6, "y": 4.4, "w": 3, "h": 2.2, "seed": 120, "base": 0, "thick": 0.3, "tone": 140, "rot": 0, "under": -1},
    {"x": 31.9, "y": 4.7, "w": 3, "h": 2.2, "seed": 121.3, "base": 0.3, "thick": 0.3, "tone": 142, "rot": 0, "under": 9}
  ],
  "pits": [
    {"x": 5.5, "y": 20.35, "w": 3.4, "h": 3, "seed": 13.3, "floor": 0, "ledge": 0.55}
  ],
  "seams": [
    { "spine": [[0.871, 24.5], [0.814, 24.1], [0.929, 23.7], [1.218, 23.3], [1.57, 22.9], [1.851, 22.5], [2.004, 22.1], [2.098, 21.7], [2.262, 21.3], [2.585, 20.9], [3.032, 20.5], [3.472, 20.1], [3.768, 19.7], [3.882, 19.3], [3.902, 18.9], [3.964, 18.5], [4.148, 18.1], [4.412, 17.7], [4.63, 17.3], [4.693, 16.9], [4.602, 16.5], [4.473, 16.1], [4.451, 15.7], [4.606, 15.3], [4.881, 14.9], [5.142, 14.5]], "top": 0 }
  ]
};
