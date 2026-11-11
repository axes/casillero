import { Application, Container } from 'pixi.js'
import type { GameState } from '../engine'
import type { Screen, TableApi } from './api'
import { FinalScreen } from './final'
import { SetupScreen } from './setup'
import { SummaryScreen } from './summary'
import { TableScreen } from './table'
import { DESIGN_H, DESIGN_W } from './theme'

export class GameApp implements TableApi {
  state: GameState | null = null
  busy = false
  names = ['Rosa', 'Mateo', 'Camila', 'Diego', 'Isidora', 'Benjamín']
  count = 3
  seedInput = ''

  private readonly pixi = new Application()
  private readonly root = new Container()
  private screen: Screen | null = null
  private animateNext = false

  constructor(private readonly host: HTMLElement) {}

  async init(): Promise<void> {
    await loadFonts()
    await this.pixi.init({
      resizeTo: window,
      background: '#14080c',
      antialias: true,
      preference: 'webgl',
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
    })
    this.host.appendChild(this.pixi.canvas)
    this.pixi.stage.addChild(this.root)
    this.layout()
    window.addEventListener('resize', this.onResize)
    window.addEventListener('keydown', this.onKey)
    this.show()
  }

  commit(state: GameState, animate = false): void {
    this.state = state
    this.animateNext = animate
    this.busy = animate
    this.show()
  }

  goSetup(): void {
    if (this.state) this.seedInput = String(this.state.seed)
    this.state = null
    this.busy = false
    this.show()
  }

  private readonly onResize = (): void => {
    this.layout()
  }

  private readonly onKey = (event: KeyboardEvent): void => {
    this.screen?.onKey?.(event)
  }

  private show(): void {
    this.screen?.destroy()
    this.screen = null
    this.root.removeChildren()
    const layer = new Container()
    this.root.addChild(layer)
    if (!this.state) {
      this.screen = new SetupScreen(this, layer)
      return
    }
    if (this.state.phase === 'summary') {
      this.screen = new SummaryScreen(this, layer)
      return
    }
    if (this.state.phase === 'final') {
      this.screen = new FinalScreen(this, layer)
      return
    }
    const animate = this.animateNext
    this.animateNext = false
    this.screen = new TableScreen(this, layer, animate)
  }

  private layout(): void {
    const width = this.pixi.screen.width
    const height = this.pixi.screen.height
    if (width <= 0 || height <= 0) return
    const scale = Math.min(width / DESIGN_W, height / DESIGN_H)
    this.root.scale.set(scale)
    this.root.position.set((width - DESIGN_W * scale) / 2, (height - DESIGN_H * scale) / 2)
  }
}

async function loadFonts(): Promise<void> {
  if (!document.fonts?.load) return
  await Promise.all([
    document.fonts.load('400 32px "Libre Baskerville"'),
    document.fonts.load('700 64px "Libre Baskerville"'),
    document.fonts.load('400 18px "Source Sans 3"'),
    document.fonts.load('600 20px "Source Sans 3"'),
    document.fonts.load('700 22px "Source Sans 3"'),
  ])
}
