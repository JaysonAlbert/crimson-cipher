import { useEffect, useRef } from "react"
import Phaser from "phaser"

type PillarFrame = {
  heights: number[]
  changedIndexes: number[]
  moveId: string | null
  targetHeight: number
  maxHeight: number
  activeControllerId?: string
  controllerDelta?: number[]
  isReplayMove?: boolean
  controllers: Array<{ id: string; delta: number[] }>
}

type PillarPhaserStageProps = {
  frame: PillarFrame
  onPillarClick?: (pillarIndex: number) => void
  onControllerClick?: (controllerIndex: number) => void
  onControllerRotate?: (controllerIndex: number, direction: 1 | -1) => void
}

const STAGE_WIDTH = 1200
const STAGE_HEIGHT = 420
const FLOOR_Y = 326
const MAX_PILLAR_HEIGHT = 206
const MIN_PILLAR_HEIGHT = 26
const PILLAR_WIDTH = 112
const CONTROLLER_Y = 382

class PillarScene extends Phaser.Scene {
  private frame: PillarFrame | null = null
  private graphics?: Phaser.GameObjects.Graphics
  private labels: Phaser.GameObjects.Text[] = []
  private zones: Phaser.GameObjects.Zone[] = []
  private controllerLabels: Phaser.GameObjects.Text[] = []
  private controllerZones: Phaser.GameObjects.Zone[] = []
  private clockwiseZones: Phaser.GameObjects.Zone[] = []
  private counterClockwiseZones: Phaser.GameObjects.Zone[] = []
  private title?: Phaser.GameObjects.Text
  private readonly handlePillarClick: (pillarIndex: number) => void
  private readonly handleControllerClick: (controllerIndex: number) => void
  private readonly handleControllerRotate: (controllerIndex: number, direction: 1 | -1) => void

  constructor({
    handlePillarClick,
    handleControllerClick,
    handleControllerRotate,
  }: {
    handlePillarClick: (pillarIndex: number) => void
    handleControllerClick: (controllerIndex: number) => void
    handleControllerRotate: (controllerIndex: number, direction: 1 | -1) => void
  }) {
    super("PillarScene")
    this.handlePillarClick = handlePillarClick
    this.handleControllerClick = handleControllerClick
    this.handleControllerRotate = handleControllerRotate
  }

  create() {
    this.graphics = this.add.graphics()
    this.title = this.add.text(32, 32, "Initial state", {
      color: "#f7efe2",
      fontFamily: "Geist Variable, Arial, sans-serif",
      fontSize: "24px",
      fontStyle: "700",
      stroke: "#4b332d",
      strokeThickness: 3,
    })
    this.redraw()
  }

  setFrame(frame: PillarFrame) {
    this.frame = frame
    this.redraw()
  }

  private redraw() {
    if (!this.graphics || !this.frame) {
      return
    }

    const frame = this.frame
    const heights = frame.heights.length > 0 ? frame.heights : [0]
    const maxHeight = Math.max(frame.maxHeight, frame.targetHeight, ...heights, 1)
    const positions = getPillarPositions(heights.length)
    const targetY = getTopY(frame.targetHeight, maxHeight)

    this.graphics.clear()
    this.drawBackground()
    this.drawPlatform()
    this.drawTargetLine(positions[0] ?? 0, targetY)
    this.syncLabels(heights.length)
    this.syncZones(heights.length)
    this.syncControllerLabels(frame.controllers.length)
    this.syncControllerZones(frame.controllers.length)
    this.syncRotationZones(frame.controllers.length)

    heights.forEach((height, index) => {
      const x = positions[index] ?? 0
      const topY = getTopY(height, maxHeight)
      const visualHeight = FLOOR_Y - topY
      const isReference = index === 0
      const isChanged = frame.changedIndexes.includes(index)
      const controllerDelta = frame.controllerDelta?.[index] ?? 0
      const isLinked = !frame.isReplayMove && controllerDelta !== 0
      const isEditable = !frame.isReplayMove && index !== 0

      this.drawPillar({
        x,
        topY,
        visualHeight,
        isReference,
        isChanged,
        controllerDelta,
        isEditable,
        isLinked,
      })
      this.drawControllerMarker(x, topY, controllerDelta, Boolean(frame.isReplayMove))

      const label = this.labels[index]
      label.setText(String(height))
      label.setPosition(x, topY - 30)
      label.setOrigin(0.5, 0.5)
      label.setVisible(true)

      const zone = this.zones[index]
      zone.setPosition(x, STAGE_HEIGHT / 2)
      zone.setSize(PILLAR_WIDTH + 64, FLOOR_Y)
    })

    this.drawControllers(frame.controllers)

    this.title?.setText(
      frame.moveId
        ? `Move ${frame.moveId}`
        : frame.activeControllerId
          ? `Set controller ${frame.activeControllerId}`
          : "Initial state"
    )
  }

  private drawBackground() {
    this.graphics?.fillStyle(0x160809, 1)
    this.graphics?.fillRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT)
  }

  private drawPlatform() {
    const platformX = 110
    const platformY = FLOOR_Y - 18
    const platformWidth = STAGE_WIDTH - platformX * 2
    const platformHeight = 42

    this.graphics?.fillStyle(0x2a1d19, 0.9)
    this.graphics?.fillRect(platformX, platformY, platformWidth, platformHeight)
    this.graphics?.lineStyle(3, 0x6f463b, 0.85)
    this.graphics?.strokeRect(platformX, platformY, platformWidth, platformHeight)
  }

  private drawControllers(controllers: Array<{ id: string; delta: number[] }>) {
    const positions = getControllerPositions(controllers.length)

    controllers.forEach((controller, index) => {
      const x = positions[index] ?? STAGE_WIDTH / 2
      const isActive = controller.id === this.frame?.activeControllerId
      const affectedCount = controller.delta.filter(
        (delta, pillarIndex) => pillarIndex !== 0 && delta !== 0
      ).length

      this.drawControllerPad(x, isActive)

      const label = this.controllerLabels[index]
      label.setText(`${controller.id}\n${affectedCount}`)
      label.setPosition(x, CONTROLLER_Y - 2)
      label.setOrigin(0.5, 0.5)
      label.setVisible(true)

      const zone = this.controllerZones[index]
      zone.setPosition(x, CONTROLLER_Y)
      zone.setSize(62, 62)

      const counterClockwiseZone = this.counterClockwiseZones[index]
      counterClockwiseZone.setPosition(x - 34, CONTROLLER_Y)
      counterClockwiseZone.setSize(34, 58)

      const clockwiseZone = this.clockwiseZones[index]
      clockwiseZone.setPosition(x + 34, CONTROLLER_Y)
      clockwiseZone.setSize(34, 58)
    })
  }

  private drawControllerPad(x: number, isActive: boolean) {
    const radius = 30
    const fill = isActive ? 0xe0ac46 : 0x3a2924
    const stroke = isActive ? 0xf8c24b : 0x7a5145
    const glyph = isActive ? 0x160809 : 0xc59b78

    this.graphics?.fillStyle(fill, 1)
    this.graphics?.fillCircle(x, CONTROLLER_Y, radius)
    this.graphics?.lineStyle(4, stroke, 1)
    this.graphics?.strokeCircle(x, CONTROLLER_Y, radius)
    this.graphics?.lineStyle(2, glyph, 0.75)
    this.graphics?.strokeCircle(x, CONTROLLER_Y, 18)

    this.graphics?.lineStyle(4, glyph, 1)
    this.graphics?.beginPath()
    this.graphics?.arc(x, CONTROLLER_Y, 14, Phaser.Math.DegToRad(210), Phaser.Math.DegToRad(330), false)
    this.graphics?.strokePath()
    this.graphics?.fillStyle(glyph, 1)
    this.graphics?.fillTriangle(x + 14, CONTROLLER_Y - 2, x + 24, CONTROLLER_Y + 1, x + 16, CONTROLLER_Y + 8)
  }

  private drawTargetLine(referenceX: number, y: number) {
    const lineStartX = 32
    const lineEndX = Math.min(referenceX + 430, STAGE_WIDTH - 32)

    this.graphics?.lineStyle(3, 0xe6ad3c, 1)
    this.graphics?.lineBetween(lineStartX, y, lineEndX, y)
  }

  private drawPillar({
    x,
    topY,
    visualHeight,
    isReference,
    isChanged,
    controllerDelta,
    isEditable,
    isLinked,
  }: {
    x: number
    topY: number
    visualHeight: number
    isReference: boolean
    isChanged: boolean
    controllerDelta: number
    isEditable: boolean
    isLinked: boolean
  }) {
    const left = x - PILLAR_WIDTH / 2
    const fill = isReference ? 0xe0ac46 : 0x8f7d6e
    const stroke = controllerDelta !== 0 ? 0xe6ad3c : isReference ? 0xf8c24b : 0x5d5149
    const highlight = isReference ? 0xffca4f : 0xa49180

    this.graphics?.fillStyle(fill, 1)
    this.graphics?.fillRect(left, topY, PILLAR_WIDTH, visualHeight)
    if (isEditable) {
      this.graphics?.fillStyle(isLinked ? 0xf8c24b : 0xffffff, isLinked ? 0.16 : 0.06)
      this.graphics?.fillRect(left - 8, topY - 8, PILLAR_WIDTH + 16, visualHeight + 16)
    }
    this.graphics?.lineStyle(isChanged || controllerDelta !== 0 ? 5 : 3, stroke, 1)
    this.graphics?.strokeRect(left, topY, PILLAR_WIDTH, visualHeight)

    if (isEditable && !isLinked) {
      this.graphics?.lineStyle(2, 0xf8c24b, 0.38)
      this.graphics?.strokeRect(left - 8, topY - 8, PILLAR_WIDTH + 16, visualHeight + 16)
    }

    const inset = 10
    const insetHeight = Math.min(visualHeight * 0.45, 74)
    if (insetHeight > 16) {
      this.graphics?.fillStyle(highlight, 0.28)
      this.graphics?.fillRect(left + inset, topY + 14, PILLAR_WIDTH - inset * 2, insetHeight)
    }
  }

  private drawControllerMarker(x: number, topY: number, delta: number, isReplayMove: boolean) {
    if (delta === 0) {
      return
    }

    const markerY = Math.max(76, topY - 62)
    const color = isReplayMove && delta < 0 ? 0xdf806d : 0xf7c24a

    this.graphics?.fillStyle(color, 1)
    if (!isReplayMove) {
      this.graphics?.fillCircle(x, markerY, 13)
      this.graphics?.lineStyle(3, 0x160809, 0.75)
      this.graphics?.strokeCircle(x, markerY, 13)
    } else if (delta > 0) {
      this.graphics?.fillTriangle(x, markerY - 16, x - 16, markerY + 12, x + 16, markerY + 12)
    } else {
      this.graphics?.fillTriangle(x, markerY + 16, x - 16, markerY - 12, x + 16, markerY - 12)
    }
  }

  private syncLabels(count: number) {
    while (this.labels.length < count) {
      this.labels.push(
        this.add.text(0, 0, "", {
          color: "#fff8ec",
          fontFamily: "Geist Variable, Arial, sans-serif",
          fontSize: "24px",
          fontStyle: "700",
          stroke: "#4b332d",
          strokeThickness: 4,
        })
      )
    }

    this.labels.forEach((label, index) => {
      label.setVisible(index < count)
    })
  }

  private syncControllerLabels(count: number) {
    while (this.controllerLabels.length < count) {
      this.controllerLabels.push(
        this.add.text(0, 0, "", {
          align: "center",
          color: "#fff8ec",
          fontFamily: "Geist Variable, Arial, sans-serif",
          fontSize: "16px",
          fontStyle: "800",
          lineSpacing: -2,
          stroke: "#4b332d",
          strokeThickness: 3,
        })
      )
    }

    this.controllerLabels.forEach((label, index) => {
      label.setVisible(index < count)
    })
  }

  private syncZones(count: number) {
    while (this.zones.length < count) {
      const index = this.zones.length
      const zone = this.add.zone(0, 0, PILLAR_WIDTH + 64, STAGE_HEIGHT)
      zone.setOrigin(0.5, 0.5)
      zone.setInteractive({ useHandCursor: true })
      zone.on("pointerdown", () => this.handlePillarClick(index))
      this.zones.push(zone)
    }

    this.zones.forEach((zone, index) => {
      zone.setVisible(index < count)
    })
  }

  private syncControllerZones(count: number) {
    while (this.controllerZones.length < count) {
      const index = this.controllerZones.length
      const zone = this.add.zone(0, 0, 96, 62)
      zone.setOrigin(0.5, 0.5)
      zone.setInteractive({ useHandCursor: true })
      zone.on("pointerdown", () => this.handleControllerClick(index))
      this.controllerZones.push(zone)
    }

    this.controllerZones.forEach((zone, index) => {
      zone.setVisible(index < count)
    })
  }

  private syncRotationZones(count: number) {
    while (this.clockwiseZones.length < count) {
      const index = this.clockwiseZones.length
      const clockwiseZone = this.add.zone(0, 0, 50, 58)
      clockwiseZone.setOrigin(0.5, 0.5)
      clockwiseZone.setInteractive({ useHandCursor: true })
      clockwiseZone.on("pointerdown", () => this.handleControllerRotate(index, 1))
      this.clockwiseZones.push(clockwiseZone)

      const counterClockwiseZone = this.add.zone(0, 0, 50, 58)
      counterClockwiseZone.setOrigin(0.5, 0.5)
      counterClockwiseZone.setInteractive({ useHandCursor: true })
      counterClockwiseZone.on("pointerdown", () => this.handleControllerRotate(index, -1))
      this.counterClockwiseZones.push(counterClockwiseZone)
    }

    this.clockwiseZones.forEach((zone, index) => {
      zone.setVisible(index < count)
    })
    this.counterClockwiseZones.forEach((zone, index) => {
      zone.setVisible(index < count)
    })
  }
}

function getPillarPositions(count: number) {
  if (count <= 1) {
    return [STAGE_WIDTH / 2]
  }

  const left = 220
  const right = STAGE_WIDTH - 220
  const gap = (right - left) / (count - 1)

  return Array.from({ length: count }, (_, index) => left + index * gap)
}

function getTopY(height: number, maxHeight: number) {
  const normalized = Math.max(0, Math.min(height / Math.max(maxHeight, 1), 1))
  const visualHeight = MIN_PILLAR_HEIGHT + normalized * MAX_PILLAR_HEIGHT

  return FLOOR_Y - visualHeight
}

function getControllerPositions(count: number) {
  if (count <= 1) {
    return [STAGE_WIDTH / 2]
  }

  const center = STAGE_WIDTH / 2
  const spacing = 128
  const first = center - ((count - 1) * spacing) / 2

  return Array.from({ length: count }, (_, index) => first + index * spacing)
}

export function PillarPhaserStage({
  frame,
  onPillarClick,
  onControllerClick,
  onControllerRotate,
}: PillarPhaserStageProps) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const sceneRef = useRef<PillarScene | null>(null)
  const onPillarClickRef = useRef(onPillarClick)
  const onControllerClickRef = useRef(onControllerClick)
  const onControllerRotateRef = useRef(onControllerRotate)

  useEffect(() => {
    onPillarClickRef.current = onPillarClick
  }, [onPillarClick])

  useEffect(() => {
    onControllerClickRef.current = onControllerClick
  }, [onControllerClick])

  useEffect(() => {
    onControllerRotateRef.current = onControllerRotate
  }, [onControllerRotate])

  useEffect(() => {
    if (!hostRef.current) {
      return
    }

    const scene = new PillarScene({
      handlePillarClick: (pillarIndex) => {
        onPillarClickRef.current?.(pillarIndex)
      },
      handleControllerClick: (controllerIndex) => {
        onControllerClickRef.current?.(controllerIndex)
      },
      handleControllerRotate: (controllerIndex, direction) => {
        onControllerRotateRef.current?.(controllerIndex, direction)
      },
    })
    sceneRef.current = scene

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: hostRef.current,
      width: STAGE_WIDTH,
      height: STAGE_HEIGHT,
      backgroundColor: "#160809",
      scene,
      scale: {
        mode: Phaser.Scale.NONE,
      },
    })

    return () => {
      sceneRef.current = null
      game.destroy(true)
    }
  }, [])

  useEffect(() => {
    sceneRef.current?.setFrame(frame)
  }, [frame])

  return (
    <div className="pillar-stage overflow-hidden rounded-none bg-[#160809]">
      <div ref={hostRef} className="h-full w-full" />
    </div>
  )
}
