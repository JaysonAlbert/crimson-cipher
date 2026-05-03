import type { SearchSolution } from "./solvers"

export type PillarAnimationFrame = {
  stepIndex: number
  moveId: string | null
  heights: number[]
  changedIndexes: number[]
  canGoBack: boolean
  canGoForward: boolean
}

export function getPillarAnimationFrame(
  solution: SearchSolution<number[]>,
  requestedStepIndex: number
): PillarAnimationFrame {
  const lastStepIndex = Math.max(0, solution.states.length - 1)
  const stepIndex = Math.min(Math.max(requestedStepIndex, 0), lastStepIndex)
  const heights = solution.states[stepIndex] ?? []
  const previousHeights = solution.states[stepIndex - 1] ?? heights

  return {
    stepIndex,
    moveId: stepIndex === 0 ? null : solution.moveIds[stepIndex - 1] ?? null,
    heights,
    changedIndexes: heights.flatMap((height, index) =>
      height !== previousHeights[index] ? [index] : []
    ),
    canGoBack: stepIndex > 0,
    canGoForward: stepIndex < lastStepIndex,
  }
}
