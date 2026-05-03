import { useMemo, useState } from "react"
import {
  ArrowDown,
  ArrowUp,
  Blocks,
  ChevronLeft,
  ChevronRight,
  CircuitBoard,
  Columns3,
  Play,
  RotateCw,
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
import { solvePillarHeights } from "@/lib/solvers"
import type { PillarMove, SearchSolution } from "@/lib/solvers"

type SolverMode = "pillars" | "circuit" | "puzzle"

type PillarResult = {
  solution: SearchSolution<number[]> | null
  error: string | null
}

const MIN_HEIGHT = 0

const defaultHeights = [2, 1, 3, 1, 1]
const defaultControllers: PillarMove[] = [
  { id: "A", label: "A", delta: [0, 1, 0, 1, 1] },
  { id: "B", label: "B", delta: [0, 1, 1, 0, 0] },
  { id: "C", label: "C", delta: [0, 0, 0, 1, 1] },
]

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
                          <span className="text-sm font-medium">Press {moveId}</span>
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
        ) : (
          <Card className="flex flex-1 items-center justify-center">
            <CardContent className="py-20 text-center text-muted-foreground">
              {mode === "circuit" ? "Circuit Grid simulator comes next." : "Sliding Puzzle simulator comes next."}
            </CardContent>
          </Card>
        )}
      </div>
    </main>
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

export default App
