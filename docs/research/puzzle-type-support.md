# Crimson Cipher Puzzle Type Research

Date: 2026-05-03

## Product Boundary

Crimson Cipher should focus on Crimson Desert puzzle types that can be represented as a discrete state graph and solved by search/brute force after either:

1. Manual initialization by the user.
2. Screenshot/photo recognition into the same discrete state.

Avoid puzzle types whose solution depends mainly on world knowledge, quest lore, mural interpretation, location memory, combat, traversal execution, or subjective image matching.

## First Supported Types

### 1. Pillar Height Equalizer

Reference image: `public/reference-puzzles/pillar-height-equalizer.svg`

Observed in guides as ancient ruins puzzles where several pillars must be adjusted to the same height, with each pedestal slot controlling a different subset of pillars. This is a strong fit because the state can be encoded as integer heights and each action as a vector delta over affected pillars.

Initial UX:

- Manual mode: user enters pillar count, current heights, target height, and each control's affected pillars.
- Photo mode later: detect vertical pillar tops and infer relative heights; user confirms affected sets after trying each control once.

Solver:

- BFS or A* over height vectors.
- Optional linear/integer constraint shortcut when each move has reversible fixed deltas.
- Output minimal or near-minimal move sequence.

Why supported:

- Complex enough to be useful.
- Does not need lore.
- User can initialize it from observation.
- Screenshot detection is plausible.

Sources:

- Shacknews describes Deepfog Basin as moving pillars to equal height, with four slots controlling different pillar subsets: https://www.shacknews.com/article/148788/how-to-solve-the-puzzle-at-the-deepfog-basin-everfrost-ruins-in-crimson-desert
- Pywel describes Duskwood Hill Ruins as five pillars that must be raised to the same level: https://www.pywel.app/en/guides/puzzles/duskwood/
- Game8 lists Deepfog/Duskwood pillar-height ruins and notes slots change different sets of pillars: https://game8.co/games/Crimson-Desert/archives/587684

### 2. Push Block Circuit Grid

Reference image: `public/reference-puzzles/push-block-circuit-grid.svg`

Observed in guides as wall/floor button or block puzzles where the player pushes blocks/buttons to route power from one end to another. This matches the user's M x N matrix example: each square can be pressed/pushed, and the target is a continuous powered route or circuit pattern.

Initial UX:

- Manual mode: user selects grid size, toggles tile states, marks source/target, and defines press effects.
- Photo mode later: detect grid cells, depressed/raised states, visible circuit paths, source, and target nodes.

Solver:

- Bitmask BFS over grid states.
- Connectivity validation for source-to-target routes.
- If one press affects adjacent blocks, encode each press as a bitmask transition.
- For larger boards, use A*, bidirectional BFS, or SAT-style constraints.

Why supported:

- This is probably the best flagship type: painful by hand, naturally brute-forceable, and compatible with both manual and screenshot workflows.
- It does not require knowing what the final image is if the goal is visible power connectivity.

Sources:

- Game8's Power Flow and ancient ruins entries describe moving circular blocks or pressing wall buttons to guide power/connect routes: https://game8.co/games/Crimson-Desert/archives/587684
- Vault describes Timberdale Cliff as a block-pushing mechanic where one block affects adjacent blocks, with a connected path preview: https://vaultgg.app/guides/timberdale-cliff-ruins
- PC Gamer's guide index references Root's End and Toward the Nest as Abyss power/circuit puzzle flows: https://www.pcgamer.com/games/action/crimson-desert-guide/

### 3. Puzzle / Sliding Tile / Rotating Fragment

Reference images:

- `public/reference-puzzles/sliding-block-puzzle.svg`
- `public/reference-puzzles/rotating-tile-picture-puzzle.svg`

Support only the versions whose target can be formalized without game-world knowledge:

- Sliding numbered/order puzzles.
- Route-fragment sliding puzzles where tile edges must connect.
- Rotating fragment puzzles where edge symbols, lines, or circuit segments align.
- Picture puzzles only if the target image is visible in the puzzle UI or can be uploaded by the user.

Do not prioritize puzzles where the answer is "make this look like a place, mural, or lore image" unless the user provides the target image.

Initial UX:

- Manual mode: choose board size, empty cell, tile IDs or edge connectors.
- Photo mode later: detect board grid, empty slot, tile identity, and/or edge connectors.

Solver:

- Sliding puzzles: parity check, A*, IDA*.
- Rotating fragments: finite rotation enumeration with edge-compatibility scoring.
- Mixed slide/rotate: A* with admissible heuristic only for small boards; otherwise guided search.

Why supported:

- Good fit when the goal is structural, numbered, or visibly provided.
- Avoids subjective "recognize this scenic image" cases.

Sources:

- PC Gamer lists Bluemont Manor Strongbox as "Align the picture" and other puzzle entries involving symbol/grid alignment: https://www.pcgamer.com/games/action/crimson-desert-guide/
- Pywel documents rotating cylinder/picture-band and piston strongbox mechanisms, which are solvable as linked mechanical states: https://www.pywel.app/en/guides/puzzles/

## Not First-Class Targets

These may exist in Crimson Desert, but should not be core project scope now:

- Five-in-a-row / Gomoku stone board: solvable, but too simple and less valuable for this tool.
- Bell/key/melody sequence: often just fixed-order input once clues are known.
- Pure battery/socket placement: more spatial/traversal than brute-force logic unless reduced to a small grid.
- Light reflection puzzles: algorithmically possible, but screenshot recognition and 3D ray geometry add implementation risk; consider later only if many players need it.
- Lore/mural/location image matching: excluded unless the target reference is provided by the user.
- Combat, traversal, ability-gating, or quest-dialog puzzles.

## Recommended MVP

Build the first version around three modes:

1. Pillar solver.
2. Circuit grid solver.
3. Sliding/rotating puzzle solver.

Each mode should support manual setup first, then add photo-assisted setup as a second layer. The recognition layer should always produce an editable state before solving, because Crimson Desert screenshots can be angled, occluded, or visually noisy.

## Phase Strategy

Phase 1 should focus on core algorithms and manual initialization. The product is successful when a player can represent a supported puzzle as a discrete state and receive a valid brute-force/search solution.

Phase 2 should add a shared solution library. Once a user solves a puzzle, Crimson Cipher should save the normalized puzzle state and solution so other players can search and use the result directly. For matched puzzles, players should not need to upload a screenshot or re-enter the puzzle state.

The shared library should be keyed by a stable puzzle fingerprint rather than screenshots. Fingerprints should be built from puzzle type, dimensions, initial state, target state, and move/control definitions. Photo recognition remains useful, but it becomes a setup shortcut rather than the only path.
