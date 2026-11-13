import { Container, Graphics } from 'pixi.js'
import gsap from 'gsap'
import { outcomeCopy } from '../copy'
import type { Screen, TableApi } from './api'
import { reducedMotion } from './animate'
import { palette } from './theme'
import { drawBackdrop, fillRound, makeButton, makeText, strokeRound } from './widgets'

export class FinalScreen implements Screen {
  private readonly animated: object[] = []

  constructor(
    private readonly api: TableApi,
    private readonly layer: Container,
  ) {
    const state = api.state
    const score = state?.finalScore
    if (!state || !score) return
    drawBackdrop(layer)
    const title = makeText('Recuento', { size: 48, font: 'serif', color: palette.gold, weight: '700' })
    title.position.set(72, 36)
    const outcome = makeText(outcomeCopy(score), { size: 22, color: palette.cream, wrap: 760 })
    outcome.position.set(72, 100)
    layer.addChild(title, outcome)
    const ranked = [...score.rows].sort((a, b) => b.points - a.points || a.playerId - b.playerId)
    ranked.forEach((row, index) => {
      const winner = score.winners.includes(row.playerId)
      const card = new Container()
      const g = new Graphics()
      fillRound(g, 0, 0, 1136, 78, 12, winner ? 0x2a1c10 : palette.panel)
      strokeRound(g, 0, 0, 1136, 78, 12, winner ? palette.gold : palette.panelEdge, winner ? 2 : 1)
      const name = makeText(row.name, { size: 24, font: 'serif', color: winner ? palette.goldSoft : palette.cream })
      name.position.set(18, 12)
      const detail = makeText(`${row.bottles} botellas seguras · ${row.leftover} cartas en la pila`, {
        size: 16,
        color: palette.creamDim,
      })
      detail.position.set(18, 44)
      const points = makeText(String(row.points), { size: 32, font: 'serif', color: palette.gold, weight: '700' })
      points.anchor.set(1, 0)
      points.position.set(1100, 18)
      card.addChild(g, name, detail, points)
      card.position.set(72, 180 + index * 92)
      layer.addChild(card)
    })
    const again = makeButton('Otra partida', 240, () => this.api.goSetup())
    again.position.set(968, 720)
    const seed = makeText(`Semilla ${state.seed}`, { size: 16, color: palette.creamDim })
    seed.position.set(72, 736)
    layer.addChild(again, seed)
    if (!reducedMotion && score.winners.length > 0) {
      for (let index = 0; index < 14; index += 1) {
        const mote = new Graphics()
        mote.circle(0, 0, 2 + (index % 3)).fill({ color: palette.gold })
        mote.position.set(160 + ((index * 80) % 900), 760)
        layer.addChild(mote)
        this.animated.push(mote)
        gsap.to(mote, { y: 200, alpha: 0, duration: 2.6, delay: index * 0.08, repeat: -1, ease: 'power1.out' })
      }
    }
  }

  destroy(): void {
    for (const target of this.animated) gsap.killTweensOf(target)
    this.layer.destroy({ children: true })
  }
}
