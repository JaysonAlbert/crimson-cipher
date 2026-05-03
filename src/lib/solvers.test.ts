import { describe, expect, test } from "vitest"

import {
  solveCircuitGrid,
  solveCircuitRoute,
  solvePillarHeights,
  solveSlidingPuzzle,
} from "./solvers"

describe("solvePillarHeights", () => {
  test("finds a short sequence that matches every pillar to a target pillar height", () => {
    const solution = solvePillarHeights({
      initial: [2, 1, 3, 1, 1],
      minHeight: 0,
      maxHeight: 4,
      moves: [
        { id: "A CW", label: "left controller clockwise", delta: [0, 1, 0, 1, 1] },
        { id: "A CCW", label: "left controller counterclockwise", delta: [0, -1, 0, -1, -1] },
        { id: "B CW", label: "center controller clockwise", delta: [0, 1, 1, 0, 0] },
        { id: "B CCW", label: "center controller counterclockwise", delta: [0, -1, -1, 0, 0] },
        { id: "C CW", label: "right controller clockwise", delta: [0, 0, 0, 1, 1] },
        { id: "C CCW", label: "right controller counterclockwise", delta: [0, 0, 0, -1, -1] },
      ],
    })

    expect(solution?.moveIds).toEqual(["A CW", "A CW", "B CCW", "C CCW"])
    expect(solution?.states.at(-1)).toEqual([2, 2, 2, 2, 2])
  })
})

describe("solveCircuitGrid", () => {
  test("finds presses that activate every required circuit cell", () => {
    const solution = solveCircuitGrid({
      width: 3,
      height: 3,
      initialOn: [false, false, false, false, false, false, false, false, false],
      targetOn: [true, false, true, false, true, false, false, true, false],
      presses: [
        { id: "top", label: "top node", toggles: [0, 1, 2] },
        { id: "middle", label: "middle node", toggles: [1, 4, 7] },
      ],
    })

    expect(solution?.moveIds).toEqual(["top", "middle"])
    expect(solution?.states.at(-1)).toEqual([
      true,
      false,
      true,
      false,
      true,
      false,
      false,
      true,
      false,
    ])
  })
})

describe("solveCircuitRoute", () => {
  test("finds presses that push every route cell down without constraining off-route cells", () => {
    const solution = solveCircuitRoute({
      width: 3,
      height: 3,
      initialPressed: [false, false, false, false, false, false, false, false, false],
      route: [true, false, true, false, true, false, true, false, true],
      presses: [
        { id: "top", label: "top node", toggles: [0, 1, 2] },
        { id: "middle", label: "middle node", toggles: [1, 4, 7] },
        { id: "bottom", label: "bottom node", toggles: [6, 7, 8] },
      ],
    })

    expect(solution?.moveIds).toEqual(["top", "middle", "bottom"])
    expect(solution?.states.at(-1)).toMatchObject([
      true,
      false,
      true,
      false,
      true,
      false,
      true,
      false,
      true,
    ])
  })
})

describe("solveSlidingPuzzle", () => {
  test("solves a reachable 3 by 3 sliding puzzle", () => {
    const solution = solveSlidingPuzzle({
      width: 3,
      height: 3,
      initial: [1, 2, 3, 4, 5, 6, 0, 7, 8],
      target: [1, 2, 3, 4, 5, 6, 7, 8, 0],
    })

    expect(solution?.moveIds).toEqual(["right", "right"])
    expect(solution?.states.at(-1)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 0])
  })
})
