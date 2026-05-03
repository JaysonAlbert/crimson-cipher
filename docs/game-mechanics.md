# Crimson Cipher Game Mechanics

This document records the gameplay rules that the UI, solver, tests, and future photo-recognition code must preserve.

## Shared Terms

- A solver state is the minimal discrete data needed to reproduce the puzzle.
- Manual setup and screenshot recognition must produce the same solver state shape.
- Replay must not mutate the user's manually configured puzzle state.
- Having a solution must not change the visual scale or initial display of the puzzle.
- Solution lists may be long and must scroll inside their panel instead of resizing the whole layout.

## Pillar Height

### Puzzle State

- The leftmost pillar is the fixed reference target.
- Pillar heights are non-negative integers.
- There is no fixed maximum height in the setup UI.
- The solver may use a dynamic upper bound only as a search guard.
- A controller stores a set of linked pillar indexes.
- The reference pillar cannot be linked to any controller.

### Player Actions

- Select a controller in the game scene.
- Click non-reference pillars to link or unlink them from that controller.
- Rotate a controller clockwise to raise all linked pillars by 1.
- Rotate a controller counterclockwise to lower all linked pillars by 1.
- Lowering cannot push a pillar below 0.

### Goal

- Every pillar must reach the same height as the leftmost pillar.
- Route, lore, world location, or image matching must not affect this solver.

### UI Invariants

- Linked pillars show a simple marker above the pillar.
- Controller visuals should look like game objects, not debug controls.
- Solution move labels should be human-readable, e.g. `Turn A clockwise`.
- Solution state must not affect initial-state pillar scaling.

## Circuit Grid

### Puzzle State

- The grid has configurable dimensions: `M x N`.
- Current UI bounds are 2 to 6 rows/columns to keep brute-force search responsive.
- Each cell has an initial physical state:
  - raised / convex
  - pressed / recessed
- The route layer is separate from the initial physical state.
- Route cells represent the visible circuit path that must be activated.

### Player Actions

- Start mode edits initial raised/pressed states.
- Route mode edits which cells belong to the required route.
- Pressing a cell with natural force toggles up to 5 cells:
  - the pressed cell itself
  - the cell above
  - the cell below
  - the cell to the left
  - the cell to the right
- Missing neighbors outside the board are ignored.

### Goal

- Every route cell must be pressed/recessed in the final state.
- Non-route cells are unconstrained and may end raised or pressed.
- The solver must not require the full board to match the route mask.

### UI Invariants

- Raised and pressed cells must be visually distinct:
  - raised cells look brighter and elevated
  - pressed cells look darker and recessed
- Route indication must render consistently on every route cell.
- Route borders/markers should be internal to the cell so adjacent cells cannot hide them.
- Changing grid dimensions must rebuild:
  - initial state
  - route mask
  - press definitions
  - replay step index
- After changing dimensions or edit mode, the grid must remain editable.
- Replay must only show replay state when the current step index is greater than 0.

## Solver Rules

### Pillar Solver

- Uses graph search over integer height vectors.
- Each controller expands into two solver moves:
  - clockwise delta
  - counterclockwise delta
- The goal check compares every height to the leftmost initial height.

### Circuit Solver

- Uses graph search over boolean pressed/recessed states.
- Each grid cell is one press move.
- A press move toggles the cross-shaped neighborhood.
- The goal check is route-only:

```ts
route.every((isRouteCell, index) => !isRouteCell || state[index])
```

## Regression Checklist

Before changing a game mode, verify:

- `npm test`
- `npm run lint`
- `npm run build`
- Initial display does not depend on whether a solution exists.
- Editing still works after changing dimensions or edit mode.
- Replay does not overwrite manual setup state.
- Long solution lists scroll inside the solution card.
