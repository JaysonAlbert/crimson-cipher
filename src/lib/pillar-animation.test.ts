import { describe, expect, test } from "vitest"

import { getPillarAnimationFrame } from "./pillar-animation"

describe("getPillarAnimationFrame", () => {
  test("returns current heights and changed pillar indexes for a solution step", () => {
    const frame = getPillarAnimationFrame(
      {
        moveIds: ["A", "A", "B"],
        states: [
          [0, 1, 2],
          [1, 2, 2],
          [2, 3, 2],
          [2, 2, 2],
        ],
      },
      2
    )

    expect(frame).toEqual({
      stepIndex: 2,
      moveId: "A",
      heights: [2, 3, 2],
      changedIndexes: [0, 1],
      canGoBack: true,
      canGoForward: true,
    })
  })

  test("clamps out of range steps", () => {
    const frame = getPillarAnimationFrame(
      {
        moveIds: ["A"],
        states: [
          [0, 1],
          [1, 1],
        ],
      },
      8
    )

    expect(frame.stepIndex).toBe(1)
    expect(frame.canGoForward).toBe(false)
  })
})
