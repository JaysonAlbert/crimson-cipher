import { useMemo, useState } from "react"
import {
  ArrowDown,
  ArrowUp,
  Blocks,
  ChevronLeft,
  ChevronRight,
  CircuitBoard,
  Columns3,
  MousePointer2,
  Play,
  RotateCw,
  Target,
} from "lucide-react"

import { PillarPhaserStage } from "@/components/pillar-phaser-stage"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getPillarAnimationFrame } from "@/lib/pillar-animation"
import { solveCircuitRoute, solvePillarHeights } from "@/lib/solvers"
import type { CircuitPress, PillarMove, SearchSolution } from "@/lib/solvers"

type SolverMode = "pillars" | "circuit" | "puzzle"

type PillarResult = {
  solution: SearchSolution<number[]> | null
  error: string | null
}

type CircuitResult = {
  solution: SearchSolution<boolean[]> | null
  error: string | null
}

type CircuitEditMode = "start" | "target"

const MIN_HEIGHT = 0
const DEFAULT_CIRCUIT_WIDTH = 4
const DEFAULT_CIRCUIT_HEIGHT = 4
const MIN_CIRCUIT_SIZE = 2
const MAX_CIRCUIT_SIZE = 6

const defaultHeights = [2, 1, 3, 1, 1]
const defaultControllers: PillarMove[] = [
  { id: "A", label: "A", delta: [0, 1, 0, 1, 1] },
  { id: "B", label: "B", delta: [0, 1, 1, 0, 0] },
  { id: "C", label: "C", delta: [0, 0, 0, 1, 1] },
]
const defaultCircuitTarget = createDefaultCircuitRoute(
  DEFAULT_CIRCUIT_WIDTH,
  DEFAULT_CIRCUIT_HEIGHT
)

const gameTabs = [
  { id: "pillars", label: "Pillar Height", icon: Columns3 },
  { id: "circuit", label: "Circuit Grid", icon: CircuitBoard },
  { id: "puzzle", label: "Sliding Puzzle", icon: Blocks },
] satisfies Array<{ id: SolverMode; label: string; icon: typeof Columns3 }>

function App() {
  const [mode, setMode] = useState<SolverMode>("pillars")
  const [pillarHeights, setPillarHeights] = useState(defaultHeights)
  const [controllers, setControllers] = useState(defaultControllers)
  const [activeControllerIndex, setActiveControllerIndex] = useState(0)
  const [pillarStepIndex, setPillarStepIndex] = useState(0)
  const [circuitEditMode, setCircuitEditMode] = useState<CircuitEditMode>("target")
  const [circuitSize, setCircuitSize] = useState({
    width: DEFAULT_CIRCUIT_WIDTH,
    height: DEFAULT_CIRCUIT_HEIGHT,
  })
  const [circuitInitial, setCircuitInitial] = useState(() =>
    Array.from({ length: DEFAULT_CIRCUIT_WIDTH * DEFAULT_CIRCUIT_HEIGHT }, () => false)
  )
  const [circuitTarget, setCircuitTarget] = useState(defaultCircuitTarget)
  const [circuitStepIndex, setCircuitStepIndex] = useState(0)

  const activeController = controllers[activeControllerIndex] ?? controllers[0]
  const targetHeight = pillarHeights[0] ?? 0
  const pillarResult = useMemo(
    () => solvePillars(pillarHeights, controllers),
    [pillarHeights, controllers]
  )
  const visualMaxHeight = Math.max(targetHeight, ...pillarHeights, 1)
  const frame = pillarResult.solution
    ? getPillarAnimationFrame(pillarResult.solution, pillarStepIndex)
    : null
  const displayedHeights = frame?.heights ?? pillarHeights
  const replayMove = frame?.moveId ? parseControllerMove(frame.moveId) : null
  const displayedController = replayMove
    ? controllers.find((controller) => controller.id === replayMove.controllerId) ?? activeController
    : activeController
  const controllerDelta = displayedController?.delta.map((value) =>
    replayMove ? value * replayMove.direction : value
  )
  const circuitPresses = useMemo(
    () => createCircuitPresses(circuitSize.width, circuitSize.height),
    [circuitSize.height, circuitSize.width]
  )
  const circuitResult = useMemo(
    () =>
      solveCircuit(
        circuitSize.width,
        circuitSize.height,
        circuitInitial,
        circuitTarget,
        circuitPresses
      ),
    [circuitInitial, circuitPresses, circuitSize.height, circuitSize.width, circuitTarget]
  )
  const circuitFrame = getSolutionFrame(circuitResult.solution, circuitStepIndex)

  const updatePillarHeight = (pillarIndex: number, delta: number) => {
    setPillarStepIndex(0)
    setPillarHeights((current) =>
      current.map((height, index) =>
        index === pillarIndex ? clampHeight(height + delta) : height
      )
    )
  }

  const cycleControllerPillar = (pillarIndex: number) => {
    if (pillarIndex === 0) {
      return
    }

    setPillarStepIndex(0)
    setControllers((current) =>
      current.map((controller, controllerIndex) => {
        if (controllerIndex !== activeControllerIndex) {
          return controller
        }

        return {
          ...controller,
          delta: controller.delta.map((value, index) =>
            index === pillarIndex ? toggleLinkedPillar(value) : value
          ),
        }
      })
    )
  }

  const rotateController = (controllerIndex: number, direction: 1 | -1) => {
    setPillarStepIndex(0)
    setActiveControllerIndex(controllerIndex)
    setPillarHeights((current) =>
      current.map((height, pillarIndex) =>
        clampHeight(height + direction * (controllers[controllerIndex]?.delta[pillarIndex] ?? 0))
      )
    )
  }

  const resetExample = () => {
    setPillarStepIndex(0)
    setPillarHeights(defaultHeights)
    setControllers(defaultControllers)
    setActiveControllerIndex(0)
  }

  const toggleCircuitCell = (index: number) => {
    setCircuitStepIndex(0)
    if (circuitEditMode === "start") {
      setCircuitInitial((current) => toggleBooleanAt(current, index))
    } else {
      setCircuitTarget((current) => toggleBooleanAt(current, index))
    }
  }

  const resetCircuitExample = () => {
    setCircuitStepIndex(0)
    setCircuitEditMode("target")
    setCircuitInitial(
      Array.from({ length: circuitSize.width * circuitSize.height }, () => false)
    )
    setCircuitTarget(createDefaultCircuitRoute(circuitSize.width, circuitSize.height))
  }

  const updateCircuitSize = (axis: "width" | "height", delta: number) => {
    setCircuitStepIndex(0)
    setCircuitSize((current) => {
      const nextSize = {
        ...current,
        [axis]: clampCircuitSize(current[axis] + delta),
      }
      const cellCount = nextSize.width * nextSize.height

      setCircuitInitial(Array.from({ length: cellCount }, () => false))
      setCircuitTarget(createDefaultCircuitRoute(nextSize.width, nextSize.height))

      return nextSize
    })
  }

  return (
    <main className="dark min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col gap-4 px-4 py-4">
        <header className="flex flex-col gap-3 rounded-lg border bg-card px-4 py-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg border bg-muted">
              <CircuitBoard aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Crimson Cipher</h1>
              <p className="text-sm text-muted-foreground">Puzzle solver simulator</p>
            </div>
          </div>

          <Tabs value={mode} onValueChange={(value) => setMode(value as SolverMode)}>
            <TabsList className="grid !h-auto w-full grid-cols-3 gap-2 bg-muted/40 p-1 md:w-auto">
              {gameTabs.map((tab) => {
                const Icon = tab.icon

                return (
                  <TabsTrigger key={tab.id} value={tab.id} className="h-9 px-3">
                    <Icon aria-hidden="true" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                )
              })}
            </TabsList>
          </Tabs>
        </header>

        {mode === "pillars" ? (
          <section className="grid content-start gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
            <Card className="min-h-0">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>Pillar Height Simulator</CardTitle>
                    <CardDescription>
                      Select a controller, then click pillars to set its effect.
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">
                    {frame ? `step ${frame.stepIndex}/${pillarResult.solution?.moveIds.length ?? 0}` : "unsolved"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <PillarPhaserStage
                  frame={{
                    heights: displayedHeights,
                    changedIndexes: frame?.changedIndexes ?? [],
                    moveId: frame?.moveId ?? null,
                    targetHeight,
                    maxHeight: visualMaxHeight,
                    activeControllerId: displayedController?.id,
                    controllerDelta,
                    isReplayMove: Boolean(replayMove),
                    controllers,
                  }}
                  onPillarClick={cycleControllerPillar}
                  onControllerClick={(controllerIndex) => {
                    setActiveControllerIndex(controllerIndex)
                    setPillarStepIndex(0)
                  }}
                  onControllerRotate={rotateController}
                />

                <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto] md:items-center">
                  <div className="rounded-lg border bg-muted/20 px-3 py-2 text-sm">
                    <span className="text-muted-foreground">Move: </span>
                    <span className="font-medium">{frame?.moveId ?? "initial state"}</span>
                  </div>
                  <Button
                    variant="outline"
                    disabled={!frame?.canGoBack}
                    onClick={() => setPillarStepIndex(Math.max(0, pillarStepIndex - 1))}
                  >
                    <ChevronLeft data-icon="inline-start" />
                    Previous
                  </Button>
                  <Button
                    disabled={!frame?.canGoForward}
                    onClick={() => setPillarStepIndex(pillarStepIndex + 1)}
                  >
                    Next
                    <ChevronRight data-icon="inline-end" />
                  </Button>
                  <Button variant="outline" onClick={resetExample}>
                    <RotateCw data-icon="inline-start" />
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>

            <aside className="flex flex-col gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Setup</CardTitle>
                  <CardDescription>Set pillar heights, then use scene controls.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <section className="flex flex-col gap-2">
                    <div className="text-sm font-medium">Pillar heights</div>
                    <div className="grid grid-cols-5 gap-2">
                      {pillarHeights.map((height, index) => (
                        <div
                          key={`height-${index}`}
                          className="grid grid-rows-[auto_2rem_auto] overflow-hidden rounded-lg border bg-muted/20"
                        >
                          <button
                            type="button"
                            className="flex h-7 items-center justify-center hover:bg-muted disabled:opacity-40"
                            onClick={() => updatePillarHeight(index, 1)}
                          >
                            <ArrowUp className="size-4" aria-hidden="true" />
                          </button>
                          <div className="flex items-center justify-center border-y text-sm font-semibold">
                            {height}
                          </div>
                          <button
                            type="button"
                            className="flex h-7 items-center justify-center hover:bg-muted disabled:opacity-40"
                            disabled={height <= MIN_HEIGHT}
                            onClick={() => updatePillarHeight(index, -1)}
                          >
                            <ArrowDown className="size-4" aria-hidden="true" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </section>

                  <Button onClick={() => setPillarStepIndex(0)}>
                    <Play data-icon="inline-start" />
                    Solve pillar puzzle
                  </Button>
                </CardContent>
              </Card>

              <Card className="max-h-[28rem] overflow-hidden">
                <CardHeader>
                  <CardTitle>Solution</CardTitle>
                  <CardDescription>
                    {pillarResult.solution
                      ? `${pillarResult.solution.moveIds.length} moves`
                      : "No valid solution yet"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="min-h-0">
                  {pillarResult.solution ? (
                    <div className="flex max-h-80 flex-col gap-3 overflow-y-auto pr-1">
                      {pillarResult.solution.moveIds.map((moveId, index) => (
                        <button
                          key={`${moveId}-${index}`}
                          type="button"
                          className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 rounded-lg border bg-muted/20 p-3 text-left transition-colors hover:bg-muted data-[active=true]:border-primary data-[active=true]:bg-muted"
                          data-active={pillarStepIndex === index + 1}
                          onClick={() => setPillarStepIndex(index + 1)}
                        >
                          <span className="text-sm text-muted-foreground">{index + 1}</span>
                          <span className="text-sm font-medium">
                            {formatPillarMove(moveId)}
                          </span>
                          <ChevronRight aria-hidden="true" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
                      {pillarResult.error ?? "No solution was found."}
                    </div>
                  )}
                </CardContent>
              </Card>
            </aside>
          </section>
        ) : mode === "circuit" ? (
          <section className="grid content-start gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>Circuit Grid Simulator</CardTitle>
                    <CardDescription>
                      Draw the route, set raised and pressed blocks, then replay the force path.
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">
                    {circuitFrame
                      ? `step ${circuitFrame.stepIndex}/${circuitResult.solution?.moveIds.length ?? 0}`
                      : "unsolved"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <CircuitBoardGrid
                  width={circuitSize.width}
                  height={circuitSize.height}
                  cells={circuitStepIndex > 0 && circuitFrame ? circuitFrame.state : circuitInitial}
                  route={circuitTarget}
                  changedIndexes={circuitStepIndex > 0 ? circuitFrame?.changedIndexes ?? [] : []}
                  editMode={circuitEditMode}
                  onCellClick={toggleCircuitCell}
                />

                <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto] md:items-center">
                  <div className="rounded-lg border bg-muted/20 px-3 py-2 text-sm">
                    <span className="text-muted-foreground">Press: </span>
                    <span className="font-medium">{circuitFrame?.moveId ?? "initial state"}</span>
                  </div>
                  <Button
                    variant="outline"
                    disabled={!circuitFrame?.canGoBack}
                    onClick={() => setCircuitStepIndex(Math.max(0, circuitStepIndex - 1))}
                  >
                    <ChevronLeft data-icon="inline-start" />
                    Previous
                  </Button>
                  <Button
                    disabled={!circuitFrame?.canGoForward}
                    onClick={() => setCircuitStepIndex(circuitStepIndex + 1)}
                  >
                    Next
                    <ChevronRight data-icon="inline-end" />
                  </Button>
                  <Button variant="outline" onClick={resetCircuitExample}>
                    <RotateCw data-icon="inline-start" />
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>

            <aside className="flex flex-col gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Setup</CardTitle>
                  <CardDescription>Click grid blocks to edit the selected layer.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={circuitEditMode === "target" ? "default" : "outline"}
                      onClick={() => {
                        setCircuitStepIndex(0)
                        setCircuitEditMode("target")
                      }}
                    >
                      <Target data-icon="inline-start" />
                      Route
                    </Button>
                    <Button
                      variant={circuitEditMode === "start" ? "default" : "outline"}
                      onClick={() => {
                        setCircuitStepIndex(0)
                        setCircuitEditMode("start")
                      }}
                    >
                      <MousePointer2 data-icon="inline-start" />
                      Start
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <GridSizeStepper
                      label="Rows"
                      value={circuitSize.height}
                      onDecrease={() => updateCircuitSize("height", -1)}
                      onIncrease={() => updateCircuitSize("height", 1)}
                    />
                    <GridSizeStepper
                      label="Columns"
                      value={circuitSize.width}
                      onDecrease={() => updateCircuitSize("width", -1)}
                      onIncrease={() => updateCircuitSize("width", 1)}
                    />
                  </div>
                  <Button onClick={() => setCircuitStepIndex(0)}>
                    <Play data-icon="inline-start" />
                    Solve route
                  </Button>
                </CardContent>
              </Card>

              <Card className="max-h-[28rem] overflow-hidden">
                <CardHeader>
                  <CardTitle>Solution</CardTitle>
                  <CardDescription>
                    {circuitResult.solution
                      ? `${circuitResult.solution.moveIds.length} presses`
                      : "No valid solution yet"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="min-h-0">
                  {circuitResult.solution ? (
                    <div className="flex max-h-80 flex-col gap-3 overflow-y-auto pr-1">
                      {circuitResult.solution.moveIds.map((moveId, index) => (
                        <button
                          key={`${moveId}-${index}`}
                          type="button"
                          className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 rounded-lg border bg-muted/20 p-3 text-left transition-colors hover:bg-muted data-[active=true]:border-primary data-[active=true]:bg-muted"
                          data-active={circuitStepIndex === index + 1}
                          onClick={() => setCircuitStepIndex(index + 1)}
                        >
                          <span className="text-sm text-muted-foreground">{index + 1}</span>
                          <span className="text-sm font-medium">
                            {formatCircuitMove(moveId)}
                          </span>
                          <ChevronRight aria-hidden="true" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
                      {circuitResult.error ?? "No solution was found."}
                    </div>
                  )}
                </CardContent>
              </Card>
            </aside>
          </section>
        ) : (
          <Card className="flex flex-1 items-center justify-center">
            <CardContent className="py-20 text-center text-muted-foreground">
              Sliding Puzzle simulator comes next.
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}

function CircuitBoardGrid({
  width,
  height,
  cells,
  route,
  changedIndexes,
  editMode,
  onCellClick,
}: {
  width: number
  height: number
  cells: boolean[]
  route: boolean[]
  changedIndexes: number[]
  editMode: CircuitEditMode
  onCellClick: (index: number) => void
}) {
  return (
    <div className="rounded-none bg-[#11090a] p-6">
      <div
        className="mx-auto grid max-w-[34rem] gap-2"
        style={{ gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: width * height }, (_, index) => {
          const isPressed = cells[index]
          const isRoute = route[index]
          const isChanged = changedIndexes.includes(index)
          const cellClassName = [
            "relative aspect-square rounded-md border transition-transform focus-visible:ring-2 focus-visible:ring-ring",
            "before:absolute before:inset-2 before:rounded-sm before:content-['']",
            isPressed
              ? "translate-y-1 border-[#493932] bg-[#32231f] shadow-[inset_0_10px_18px_rgba(0,0,0,0.55),inset_0_-2px_0_rgba(255,255,255,0.05)] before:bg-[#1a100f]"
              : "border-[#8f725f] bg-[#9b8572] shadow-[0_10px_0_#4a342c,0_14px_22px_rgba(0,0,0,0.32),inset_0_10px_0_rgba(255,255,255,0.14)] before:bg-[#b1a08e]/55",
            isChanged ? "ring-2 ring-primary" : "",
          ].join(" ")

          return (
            <button
              key={index}
              type="button"
              className={cellClassName}
              onClick={() => onCellClick(index)}
            >
              {isRoute ? (
                <span className="pointer-events-none absolute inset-1.5 z-10 rounded-md border-[3px] border-white/80 shadow-[inset_0_0_0_2px_rgba(0,0,0,0.45)]" />
              ) : null}
              <span
                className={[
                  "absolute inset-x-4 top-1/2 z-20 h-1 -translate-y-1/2 rounded-full",
                  isRoute ? "bg-primary" : "bg-black/20",
                ].join(" ")}
              />
              <span
                className={[
                  "absolute inset-y-4 left-1/2 z-20 w-1 -translate-x-1/2 rounded-full",
                  isRoute ? "bg-primary" : "bg-black/20",
                ].join(" ")}
              />
              <span className="sr-only">
                {editMode === "target" ? "Toggle route cell" : "Toggle start cell"}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function GridSizeStepper({
  label,
  value,
  onDecrease,
  onIncrease,
}: {
  label: string
  value: number
  onDecrease: () => void
  onIncrease: () => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-sm font-medium">{label}</div>
      <div className="grid grid-cols-[2rem_1fr_2rem] overflow-hidden rounded-lg border bg-muted/20">
        <button
          type="button"
          className="flex h-9 items-center justify-center border-r hover:bg-muted disabled:opacity-40"
          disabled={value <= MIN_CIRCUIT_SIZE}
          onClick={onDecrease}
        >
          <ArrowDown className="size-4" aria-hidden="true" />
        </button>
        <div className="flex h-9 items-center justify-center text-sm font-semibold">{value}</div>
        <button
          type="button"
          className="flex h-9 items-center justify-center border-l hover:bg-muted disabled:opacity-40"
          disabled={value >= MAX_CIRCUIT_SIZE}
          onClick={onIncrease}
        >
          <ArrowUp className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

function solvePillars(heights: number[], controllers: PillarMove[]): PillarResult {
  try {
    const solution = solvePillarHeights({
      initial: heights,
      minHeight: MIN_HEIGHT,
      maxHeight: getSearchMaxHeight(heights),
      moves: controllers.flatMap((controller) => [
        {
          id: `${controller.id} CW`,
          label: `${controller.label} clockwise`,
          delta: controller.delta,
        },
        {
          id: `${controller.id} CCW`,
          label: `${controller.label} counterclockwise`,
          delta: controller.delta.map((value) => -value),
        },
      ]),
    })

    return {
      solution,
      error: solution ? null : "No solution was found for the current state.",
    }
  } catch (error) {
    return {
      solution: null,
      error: error instanceof Error ? error.message : "Unable to solve the current state.",
    }
  }
}

function solveCircuit(
  width: number,
  height: number,
  initialPressed: boolean[],
  route: boolean[],
  presses: CircuitPress[]
): CircuitResult {
  try {
    const solution = solveCircuitRoute({
      width,
      height,
      initialPressed,
      route,
      presses,
    })

    return {
      solution,
      error: solution ? null : "No solution was found for the current circuit.",
    }
  } catch (error) {
    return {
      solution: null,
      error: error instanceof Error ? error.message : "Unable to solve the current circuit.",
    }
  }
}

function toggleLinkedPillar(value: number) {
  return value === 0 ? 1 : 0
}

function clampHeight(value: number) {
  return Math.max(value, MIN_HEIGHT)
}

function getSearchMaxHeight(heights: number[]) {
  return Math.max(...heights, 1) + heights.length * 2
}

function parseControllerMove(moveId: string) {
  const [controllerId, direction] = moveId.split(" ")

  if (direction === "CW") {
    return { controllerId, direction: 1 as const }
  }

  if (direction === "CCW") {
    return { controllerId, direction: -1 as const }
  }

  return null
}

function formatPillarMove(moveId: string) {
  const move = parseControllerMove(moveId)
  if (!move) {
    return moveId
  }

  return `Turn ${move.controllerId} ${
    move.direction === 1 ? "clockwise" : "counterclockwise"
  }`
}

function formatCircuitMove(moveId: string) {
  const match = /^R(\d+)C(\d+)$/.exec(moveId)
  if (!match) {
    return `Press ${moveId}`
  }

  return `Press row ${match[1]}, column ${match[2]}`
}

function getSolutionFrame<TValue>(
  solution: SearchSolution<TValue[]> | null,
  requestedStepIndex: number
) {
  if (!solution) {
    return null
  }

  const lastStepIndex = Math.max(0, solution.states.length - 1)
  const stepIndex = Math.min(Math.max(requestedStepIndex, 0), lastStepIndex)
  const state = solution.states[stepIndex] ?? []
  const previousState = solution.states[stepIndex - 1] ?? state

  return {
    stepIndex,
    moveId: stepIndex === 0 ? null : solution.moveIds[stepIndex - 1] ?? null,
    state,
    changedIndexes: state.flatMap((value, index) =>
      value !== previousState[index] ? [index] : []
    ),
    canGoBack: stepIndex > 0,
    canGoForward: stepIndex < lastStepIndex,
  }
}

function createCircuitPresses(width: number, height: number): CircuitPress[] {
  return Array.from({ length: width * height }, (_, index) => {
    const row = Math.floor(index / width)
    const column = index % width
    const toggles = [
      index,
      row > 0 ? index - width : null,
      row < height - 1 ? index + width : null,
      column > 0 ? index - 1 : null,
      column < width - 1 ? index + 1 : null,
    ].filter((value): value is number => typeof value === "number")

    return {
      id: `R${row + 1}C${column + 1}`,
      label: `row ${row + 1}, column ${column + 1}`,
      toggles,
    }
  })
}

function createDefaultCircuitRoute(width: number, height: number) {
  const route = Array.from({ length: width * height }, () => false)
  let row = 0
  let column = 0

  route[0] = true
  while (row < height - 1 || column < width - 1) {
    if (column < width - 1 && (row === height - 1 || column <= row)) {
      column += 1
    } else if (row < height - 1) {
      row += 1
    }
    route[row * width + column] = true
  }

  return route
}

function clampCircuitSize(value: number) {
  return Math.min(Math.max(value, MIN_CIRCUIT_SIZE), MAX_CIRCUIT_SIZE)
}

function toggleBooleanAt(values: boolean[], index: number) {
  return values.map((value, valueIndex) => (valueIndex === index ? !value : value))
}

export default App
