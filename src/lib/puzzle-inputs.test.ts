import { describe, expect, test } from "vitest"

import {
  parseBooleanMask,
  parseGridSize,
  parseLabeledIndexList,
  parseLabeledNumberRows,
  parseNumbers,
} from "./puzzle-inputs"

describe("puzzle input parsers", () => {
  test("parses comma separated numbers with whitespace", () => {
    expect(parseNumbers("1, 2,3, 0")).toEqual([1, 2, 3, 0])
  })

  test("parses a compact boolean mask", () => {
    expect(parseBooleanMask("1010")).toEqual([true, false, true, false])
  })

  test("parses grid dimensions written with x", () => {
    expect(parseGridSize("3 x 4")).toEqual({ width: 3, height: 4 })
  })

  test("parses labeled circuit press definitions", () => {
    expect(parseLabeledIndexList("top: 0, 1, 2\nmiddle: 4, 7")).toEqual([
      { id: "top", label: "top", toggles: [0, 1, 2] },
      { id: "middle", label: "middle", toggles: [4, 7] },
    ])
  })

  test("parses labeled pillar delta rows", () => {
    expect(parseLabeledNumberRows("A: +1, +1, 0\nB: 0, -1, 0")).toEqual([
      { id: "A", label: "A", delta: [1, 1, 0] },
      { id: "B", label: "B", delta: [0, -1, 0] },
    ])
  })
})
