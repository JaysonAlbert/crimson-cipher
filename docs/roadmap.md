# Crimson Cipher Roadmap

## Phase 1: Core Solver Algorithms

Goal: make Crimson Cipher trustworthy as a local puzzle-solving tool before adding community storage.

### Deliverables

- Solver engine for each MVP puzzle type:
  - Pillar Height Equalizer
  - Push Block Circuit Grid
  - Sliding / Rotating Puzzle
- Manual setup UI for each puzzle type.
- Editable normalized puzzle state before solving.
- Deterministic solution output:
  - move list
  - intermediate states
  - final state
  - unsolved/error reason
- Unit tests for each solver.
- Guardrails for unsupported puzzle sizes or impossible states.

### Algorithm Focus

- Pillars: BFS/A* over bounded integer height vectors.
- Circuit grid: bitmask BFS, bidirectional BFS, or SAT-style constraints for larger boards.
- Sliding puzzles: parity checks plus A*/IDA* for larger boards.
- Rotating fragments: finite rotation enumeration with edge/route compatibility.

### Non-goals

- Accounts.
- Cloud persistence.
- Public search.
- Image recognition as a hard dependency.
- Lore or location-based puzzle interpretation.

Photo recognition can be prototyped in this phase, but it should only produce an editable state. The solver must continue to work from manual input.

## Phase 2: Shared Solution Library

Goal: once a player solves a puzzle, other players can search and use that result directly instead of uploading screenshots or rebuilding the puzzle state.

### Deliverables

- Save solved puzzle results.
- Normalize puzzle states into stable fingerprints.
- Search saved solutions by:
  - puzzle type
  - puzzle name or location
  - normalized state fingerprint
  - grid size / pillar count / board size
  - tags
- Show direct reusable solution pages.
- Provide a "no match found" fallback into manual setup or photo upload.

### Data Model Sketch

Puzzle solution:

- `id`
- `type`
- `title`
- `location`
- `fingerprint`
- `normalizedState`
- `solutionSteps`
- `createdAt`
- `source`
- `tags`

Fingerprint inputs:

- Puzzle type.
- Structural dimensions.
- Initial state.
- Target state.
- Move/control definitions.

The fingerprint should ignore screenshot-specific noise such as camera angle, brightness, UI scale, and crop.

### Quality Rules

- Saved solutions must be reproducible by the local solver.
- Users should be able to inspect the normalized state before trusting a shared solution.
- Duplicate submissions should merge around the same fingerprint instead of creating noisy repeated entries.
- A community result is a shortcut, not a replacement for the local solver.

## Phase 3 Candidate: Photo-Assisted Recognition

Goal: reduce manual setup cost after the algorithm layer and shared library are useful.

Potential scope:

- Detect pillar height levels from screenshots.
- Detect grid cells, pressed states, and circuit endpoints.
- Detect sliding puzzle tiles and empty slots.
- Always require user confirmation before solving or saving.

This phase should not block Phase 1 or Phase 2.
