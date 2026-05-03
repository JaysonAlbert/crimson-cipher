export type SearchSolution<TState> = {
  moveIds: string[]
  states: TState[]
}

export type PillarMove = {
  id: string
  label: string
  delta: number[]
}

export type PillarPuzzle = {
  initial: number[]
  target?: number
  targetIndex?: number
  minHeight: number
  maxHeight: number
  moves: PillarMove[]
}

export type CircuitPress = {
  id: string
  label: string
  toggles: number[]
}

export type CircuitPuzzle = {
  width: number
  height: number
  initialOn: boolean[]
  targetOn: boolean[]
  presses: CircuitPress[]
}

export type SlidingPuzzle = {
  width: number
  height: number
  initial: number[]
  target: number[]
}

export function solvePillarHeights(
  puzzle: PillarPuzzle
): SearchSolution<number[]> | null {
  const targetHeight = resolvePillarTargetHeight(puzzle)

  return breadthFirstSearch({
    initial: puzzle.initial,
    isGoal: (state) => state.every((height) => height === targetHeight),
    key: (state) => state.join(","),
    next: (state) =>
      puzzle.moves.flatMap((move) => {
        const nextState = state.map((height, index) => height + move.delta[index])
        const inBounds = nextState.every(
          (height) => height >= puzzle.minHeight && height <= puzzle.maxHeight
        )

        return inBounds ? [{ moveId: move.id, state: nextState }] : []
      }),
  })
}

function resolvePillarTargetHeight(puzzle: PillarPuzzle) {
  if (typeof puzzle.target === "number") {
    return puzzle.target
  }

  if (typeof puzzle.targetIndex === "number") {
    return puzzle.initial[puzzle.targetIndex]
  }

  return puzzle.initial[0]
}

export function solveCircuitGrid(
  puzzle: CircuitPuzzle
): SearchSolution<boolean[]> | null {
  const expectedCells = puzzle.width * puzzle.height
  if (
    puzzle.initialOn.length !== expectedCells ||
    puzzle.targetOn.length !== expectedCells
  ) {
    return null
  }

  return breadthFirstSearch({
    initial: puzzle.initialOn,
    isGoal: (state) =>
      state.every((isOn, index) => isOn === puzzle.targetOn[index]),
    key: (state) => state.map((isOn) => (isOn ? "1" : "0")).join(""),
    next: (state) =>
      puzzle.presses.map((press) => {
        const nextState = [...state]
        for (const index of press.toggles) {
          if (index >= 0 && index < nextState.length) {
            nextState[index] = !nextState[index]
          }
        }

        return { moveId: press.id, state: nextState }
      }),
  })
}

export function solveSlidingPuzzle(
  puzzle: SlidingPuzzle
): SearchSolution<number[]> | null {
  const expectedCells = puzzle.width * puzzle.height
  if (
    puzzle.initial.length !== expectedCells ||
    puzzle.target.length !== expectedCells
  ) {
    return null
  }

  return breadthFirstSearch({
    initial: puzzle.initial,
    isGoal: (state) => arraysEqual(state, puzzle.target),
    key: (state) => state.join(","),
    next: (state) => {
      const emptyIndex = state.indexOf(0)
      const emptyRow = Math.floor(emptyIndex / puzzle.width)
      const emptyColumn = emptyIndex % puzzle.width
      const moves = [
        { id: "up", row: emptyRow - 1, column: emptyColumn },
        { id: "down", row: emptyRow + 1, column: emptyColumn },
        { id: "left", row: emptyRow, column: emptyColumn - 1 },
        { id: "right", row: emptyRow, column: emptyColumn + 1 },
      ]

      return moves.flatMap((move) => {
        if (
          move.row < 0 ||
          move.row >= puzzle.height ||
          move.column < 0 ||
          move.column >= puzzle.width
        ) {
          return []
        }

        const swapIndex = move.row * puzzle.width + move.column
        const nextState = [...state]
        nextState[emptyIndex] = nextState[swapIndex]
        nextState[swapIndex] = 0

        return [{ moveId: move.id, state: nextState }]
      })
    },
  })
}

type SearchStep<TState> = {
  moveIds: string[]
  states: TState[]
}

type SearchOptions<TState> = {
  initial: TState
  isGoal: (state: TState) => boolean
  key: (state: TState) => string
  next: (state: TState) => Array<{ moveId: string; state: TState }>
}

function breadthFirstSearch<TState>({
  initial,
  isGoal,
  key,
  next,
}: SearchOptions<TState>): SearchSolution<TState> | null {
  const queue: SearchStep<TState>[] = [{ moveIds: [], states: [initial] }]
  const visited = new Set([key(initial)])

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current) {
      break
    }

    const state = current.states[current.states.length - 1]
    if (isGoal(state)) {
      return current
    }

    for (const candidate of next(state)) {
      const candidateKey = key(candidate.state)
      if (visited.has(candidateKey)) {
        continue
      }

      visited.add(candidateKey)
      queue.push({
        moveIds: [...current.moveIds, candidate.moveId],
        states: [...current.states, candidate.state],
      })
    }
  }

  return null
}

function arraysEqual<TValue>(left: TValue[], right: TValue[]) {
  return left.length === right.length && left.every((value, index) => value === right[index])
}
