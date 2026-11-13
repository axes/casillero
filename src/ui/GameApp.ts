import { Application, Container } from 'pixi.js'
import { pressureLevel, type GameState } from '../engine'
import { CellarAmbience } from './ambience'
import type { Screen, TableApi } from './api'
import { Atmosphere } from './atmosphere'
import { CurtainScreen } from './curtain'
import { FinalScreen } from './final'
import { NightScreen } from './night'
import { SetupScreen } from './setup'
import { DESIGN_H, DESIGN_W } from './theme'
import { makeButton } from './widgets'

export class GameApp implements TableApi {
  state: GameState | null = null
  busy = false
  names = ['Rosa', 'Mateo', 'Camila', 'Diego', 'Isidora', 'Benjamín']
  count = 3
  seedInput = ''

  volumeLabel = 'Sonido'

  private readonly pixi = new Application()
  private readonly root = new Container()
  private readonly screenLayer = new Container()
  private readonly atmosphere = new Atmosphere()
  private readonly ambience = new CellarAmbience()
  private soundButton = new Container()
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
    this.root.addChild(this.screenLayer, this.atmosphere.view)
    this.layoutSound()
    this.pixi.ticker.add((ticker) => this.atmosphere.update(ticker.deltaMS / 1000))
    this.pixi.canvas.addEventListener('pointerdown', () => this.ambience.unlock())
    this.layout()
    window.addEventListener('resize', this.onResize)
    window.addEventListener('keydown', this.onKey)
    this.show()
    this.setThreat(0)
  }

  commit(state: GameState, animate = false): void {
    this.state = state
    this.animateNext = animate
    this.busy = animate
    this.show()
    this.syncThreat()
  }

  goSetup(): void {
    if (this.state) this.seedInput = String(this.state.seed)
    this.state = null
    this.busy = false
    this.show()
    this.syncThreat()
  }

  private syncThreat(): void {
    const state = this.state
    if (!state) {
      this.setThreat(0)
      return
    }
    const devil = state.phase === 'devil' || state.nightEnd?.reason === 'six'
    this.setThreat(pressureLevel(state.round, state.diceCount, devil))
  }

  setThreat(level: number): void {
    this.atmosphere.setLevel(level)
    this.ambience.setLevel(level)
  }

  cycleVolume(): void {
    this.ambience.unlock()
    this.ambience.cycleVolume()
    this.volumeLabel = this.ambience.label()
    this.layoutSound()
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
    this.screenLayer.removeChildren()
    const layer = new Container()
    this.screenLayer.addChild(layer)
    if (!this.state) {
      this.screen = new SetupScreen(this, layer)
      return
    }
    if (this.state.phase === 'curtain') {
      this.screen = new CurtainScreen(this, layer)
      return
    }
    if (this.state.phase === 'final') {
      this.screen = new FinalScreen(this, layer)
      return
    }
    const animate = this.animateNext
    this.animateNext = false
    this.screen = new NightScreen(this, layer, animate)
  }

  private layoutSound(): void {
    this.soundButton.destroy({ children: true })
    const button = makeButton(this.volumeLabel, 120, () => this.cycleVolume(), 'ghost')
    button.position.set(168, 12)
    this.soundButton = button
    this.root.addChild(button)
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
