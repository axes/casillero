import { Container, Graphics } from 'pixi.js'
import { reducedMotion } from './animate'
import { DESIGN_H, DESIGN_W } from './theme'

interface Tendril {
  view: Container
  speed: number
  phase: number
  amplitude: number
}

const COUNTS = [0, 5, 10, 16] as const

/** Vigneta, vela y ramas que se cierran con las marcas del Diablo. No conoce las reglas. */
export class Atmosphere {
  readonly view = new Container()
  private level = 0
  private readonly darkness = new Graphics()
  private readonly glow = new Graphics()
  private readonly vignette = new Graphics()
  private readonly tendrils: Tendril[] = []
  private time = 0

  constructor() {
    this.view.eventMode = 'none'
    this.view.addChild(this.darkness, this.glow, this.vignette)
    this.paintStatic()
  }

  setLevel(level: number): void {
    const next = Math.max(0, Math.min(3, Math.round(level)))
    if (next === this.level && this.tendrils.length === this.targetCount(next)) return
    this.level = next
    this.paintStatic()
    this.rebuildTendrils()
  }

  update(seconds: number): void {
    this.time += seconds
    const motion = reducedMotion ? 0.22 : 1
    const speed = [0.7, 1.5, 2.8, 4.6][this.level] ?? 1
    const flicker = [0.015, 0.05, 0.11, 0.2][this.level] ?? 0.02
    const base = [0.2, 0.14, 0.08, 0.035][this.level] ?? 0.1
    this.glow.alpha = base + Math.sin(this.time * speed * motion * Math.PI * 2) * flicker * motion
    for (const tendril of this.tendrils) {
      tendril.view.rotation =
        Math.sin(this.time * tendril.speed * motion + tendril.phase) * tendril.amplitude * motion
    }
  }

  destroy(): void {
    this.view.destroy({ children: true })
  }

  private targetCount(level: number): number {
    const full = COUNTS[level] ?? 0
    return reducedMotion ? Math.ceil(full / 2) : full
  }

  private paintStatic(): void {
    const darkness = [0.05, 0.2, 0.4, 0.62][this.level] ?? 0.05
    this.darkness.clear()
    this.darkness.rect(0, 0, DESIGN_W, DESIGN_H).fill({ color: 0x050102, alpha: darkness })

    this.glow.clear()
    const glowColor = this.level >= 2 ? 0x6a2418 : 0xc47a3a
    this.glow.circle(DESIGN_W / 2, 280, this.level >= 2 ? 220 : 340).fill({ color: glowColor, alpha: 1 })
    this.glow.circle(DESIGN_W / 2, 250, 120).fill({ color: 0xffe1a8, alpha: this.level === 0 ? 0.18 : 0.05 })

    this.vignette.clear()
    const bands = 7 + this.level * 2
    for (let index = 0; index < bands; index += 1) {
      const t = index / bands
      const inset = t * (40 + this.level * 28)
      this.vignette
        .rect(inset, inset, DESIGN_W - inset * 2, DESIGN_H - inset * 2)
        .stroke({ color: 0x000000, width: 18 + this.level * 6, alpha: 0.08 + t * (0.12 + this.level * 0.08) })
    }
  }

  private rebuildTendrils(): void {
    for (const tendril of this.tendrils) tendril.view.destroy({ children: true })
    this.tendrils.length = 0
    const count = this.targetCount(this.level)
    for (let index = 0; index < count; index += 1) {
      const gfx = new Graphics()
      const reach = 120 + (index % 5) * 22 + this.level * 16
      drawBranch(gfx, index + 1, reach)
      const view = new Container()
      view.addChild(gfx)
      const edge = index % 4
      const along = ((index * 97) % 100) / 100
      if (edge === 0) {
        view.position.set(0, 80 + along * (DESIGN_H - 160))
        view.rotation = 0.15
      } else if (edge === 1) {
        view.position.set(DESIGN_W, 80 + along * (DESIGN_H - 160))
        view.rotation = Math.PI - 0.15
      } else if (edge === 2) {
        view.position.set(80 + along * (DESIGN_W - 160), 0)
        view.rotation = Math.PI / 2
      } else {
        view.position.set(80 + along * (DESIGN_W - 160), DESIGN_H)
        view.rotation = -Math.PI / 2
      }
      gfx.rotation = -view.rotation
      this.view.addChild(view)
      this.tendrils.push({
        view,
        speed: (0.35 + (index % 4) * 0.18) * (1 + this.level * 0.55),
        phase: index * 1.3,
        amplitude: 0.05 + this.level * 0.035,
      })
    }
  }
}

function drawBranch(gfx: Graphics, seed: number, reach: number): void {
  const sway = (step: number) => ((seed * (step + 2) * 19) % 50) - 25
  gfx.moveTo(0, 0)
  gfx.quadraticCurveTo(sway(1), reach * 0.45, sway(2) * 0.35, reach)
  gfx.stroke({ width: 4 + (seed % 2), color: 0x140308, alpha: 0.9, cap: 'round' })
  gfx.moveTo(sway(2) * 0.15, reach * 0.5)
  gfx.quadraticCurveTo(sway(3) + 20, reach * 0.72, sway(4) + 16, reach * 0.92)
  gfx.stroke({ width: 2, color: 0x1a060c, alpha: 0.75, cap: 'round' })
}
