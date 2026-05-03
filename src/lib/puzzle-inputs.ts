import type { CircuitPress, PillarMove } from "./solvers"

export function parseNumbers(value: string): number[] {
  return value
    .split(/[,\s]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => Number(part))
}

export function parseBooleanMask(value: string): boolean[] {
  return value
    .replace(/[\s,]/g, "")
    .split("")
    .filter(Boolean)
    .map((part) => part === "1")
}

export function parseGridSize(value: string): { width: number; height: number } {
  const [width, height] = value
    .toLowerCase()
    .split("x")
    .map((part) => Number(part.trim()))

  return { width, height }
}

export function parseLabeledIndexList(value: string): CircuitPress[] {
  return parseLabeledRows(value).map(({ id, values }) => ({
    id,
    label: id,
    toggles: values,
  }))
}

export function parseLabeledNumberRows(value: string): PillarMove[] {
  return parseLabeledRows(value).map(({ id, values }) => ({
    id,
    label: id,
    delta: values,
  }))
}

function parseLabeledRows(value: string): Array<{ id: string; values: number[] }> {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [rawId, rawValues = ""] = line.split(":")
      return {
        id: rawId.trim(),
        values: parseNumbers(rawValues),
      }
    })
}
