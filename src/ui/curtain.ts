import { Container, Graphics } from 'pixi.js'
import { enterNight, playerPoints } from '../engine'
import type { Screen, TableApi } from './api'
import { palette } from './theme'
import { drawBackdrop, fillRound, makeButton, makeText, strokeRound } from './widgets'

export class CurtainScreen implements Screen {
  constructor(
    private readonly api: TableApi,
    private readonly layer: Container,
  ) {
    const state = api.state
    if (!state) return
    drawBackdrop(layer)
    const veil = new Graphics()
    veil.rect(0, 0, 1280, 800).fill({ color: 0x070304, alpha: 0.55 })
    layer.addChild(veil)
    const night = state.nightIndex + 1
    const title = makeText(`Noche ${night}`, { size: 72, font: 'serif', color: palette.gold, weight: '700' })
    title.anchor.set(0.5, 0)
    title.position.set(640, 70)
    const sub = makeText(
      night === 1 ? 'Todos parten en cero. El primer robo todavía no tiene tirada.' : 'Así va el vino asegurado.',
      { size: 20, color: palette.cream, align: 'center', wrap: 700 },
    )
    sub.anchor.set(0.5, 0)
    sub.position.set(640, 160)
    layer.addChild(title, sub)
    state.players.forEach((player, index) => {
      const card = new Container()
      const g = new Graphics()
      const width = Math.min(360, (1180 - (state.players.length - 1) * 16) / state.players.length)
      fillRound(g, 0, 0, width, 220, 16, palette.panel)
      strokeRound(g, 0, 0, width, 220, 16, palette.gold, 1.5, 0.7)
      const name = makeText(player.name, { size: 28, font: 'serif', color: palette.cream })
      name.position.set(20, 28)
      const points = makeText(String(playerPoints(player.secured)), { size: 64, font: 'serif', color: palette.gold, weight: '700' })
      points.position.set(20, 80)
      const unit = makeText(playerPoints(player.secured) === 1 ? 'punto seguro' : 'puntos seguros', {
        size: 16,
        color: palette.creamDim,
      })
      unit.position.set(20, 160)
      card.addChild(g, name, points, unit)
      const gap = 16
      const total = state.players.length * width + (state.players.length - 1) * gap
      card.position.set((1280 - total) / 2 + index * (width + gap), 250)
      layer.addChild(card)
    })
    const button = makeButton(night === 1 ? 'Abrir la cava' : `Entrar a la noche ${night}`, 360, () => {
      if (!this.api.state) return
      this.api.commit(enterNight(this.api.state))
    })
    button.position.set(460, 680)
    layer.addChild(button)
  }

  destroy(): void {
    this.layer.destroy({ children: true })
  }
}
