# Crimson Cipher

Crimson Cipher is a web-based puzzle solver for Crimson Desert. It focuses on puzzle types that can be reduced to discrete states and solved by search/brute force, instead of lore-dependent or subjective visual riddles.

## Scope

First-class puzzle types:

- Pillar Height Equalizer
- Push Block Circuit Grid
- Sliding / Rotating Puzzle

Excluded for now:

- Lore, mural, or location-knowledge puzzles
- Combat, traversal, or quest-dialog puzzles
- Simple fixed-sequence puzzles
- Puzzle types that are technically solvable but not valuable enough for the first version

## Product Phases

### Phase 1: Core Algorithms

Build reliable local solvers first:

- Manual puzzle initialization for each supported type
- State normalization into typed solver inputs
- Brute-force/search algorithms with deterministic solution output
- Editable state previews before solving
- Tests for solver correctness and edge cases

### Phase 2: Shared Results

Let players reuse solved puzzles without uploading or solving again:

- Save a user's solved puzzle result
- Generate a normalized puzzle fingerprint
- Search existing solutions by puzzle type, location/name, state fingerprint, and tags
- Show a direct solution if a matching solved puzzle already exists
- Fall back to upload/manual setup only when no match is found

## Development

```bash
npm install
npm run dev
```

Local app:

```text
http://127.0.0.1:5173/
```

Validation:

```bash
npm test
npm run build
npm run lint
```

## Research

Puzzle support notes live in:

- `docs/research/puzzle-type-support.md`
- `docs/roadmap.md`
