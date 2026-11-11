import { Container, Graphics } from 'pixi.js'
import gsap from 'gsap'
import { endShort, outcomeCopy } from '../copy'
import type { Screen, TableApi } from './api'
import { palette } from './theme'
import { drawBackdrop, fillRound, makeButton, makeText, offeringBar, strokeRound } from './widgets'
import { reducedMotion } from './animate'

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
    title.position.set(72, 32)
    const outcome = makeText(outcomeCopy(score), { size: 20, color: palette.cream, wrap: 760 })
    outcome.position.set(72, 96)
    const meter = offeringBar(score.offering, score.threshold, 300)
    meter.position.set(900, 48)
    layer.addChild(title, outcome, meter)

    const ranked = [...score.breakdown].sort((a, b) => b.points - a.points || a.playerId - b.playerId)
    ranked.forEach((row, index) => {
      const winner = score.winners.includes(row.playerId)
      const card = new Container()
      const g = new Graphics()
      fillRound(g, 0, 0, 1136, 72, 12, winner ? 0x2a1c10 : palette.panel)
      strokeRound(g, 0, 0, 1136, 72, 12, winner ? palette.gold : palette.panelEdge, winner ? 2 : 1)
      const name = makeText(row.name, { size: 22, font: 'serif', color: winner ? palette.goldSoft : palette.cream })
      name.position.set(18, 14)
      const detail = makeText(
        row.stained ? 'Manchado · no puede ganar' : row.eligible ? `${row.bottles} botellas aseguradas` : 'Fuera de la carrera',
        { size: 15, color: row.stained ? 0xf0b4b8 : palette.creamDim },
      )
      detail.position.set(18, 42)
      const points = makeText(`${row.points}`, { size: 28, font: 'serif', color: palette.gold, weight: '700' })
      points.anchor.set(1, 0)
      points.position.set(1100, 16)
      card.addChild(g, name, detail, points)
      card.position.set(72, 190 + index * 84)
      card.alpha = row.stained && !winner ? 0.72 : 1
      layer.addChild(card)
    })

    const history = state.history
      .map((record) => `${record.name}: ${endShort(record.reason)}`)
      .join('   ·   ')
    const foot = makeText(`${history}   ·   semilla ${state.seed}`, {
      size: 15,
      color: palette.creamDim,
      wrap: 760,
    })
    foot.position.set(72, 730)
    const again = makeButton('Otra partida', 240, () => this.api.goSetup(), 'gold')
    again.position.set(968, 714)
    layer.addChild(foot, again)

    if (!reducedMotion && score.winners.length > 0) {
      for (let index = 0; index < 18; index += 1) {
        const mote = new Graphics()
        mote.circle(0, 0, 2 + (index % 3)).fill({ color: index % 2 === 0 ? palette.gold : palette.goldSoft })
        mote.position.set(180 + ((index * 67) % 920), 760)
        mote.alpha = 0.8
        layer.addChild(mote)
        this.animated.push(mote)
        gsap.to(mote, {
          y: 120 + (index % 5) * 30,
          alpha: 0,
          duration: 2.4 + (index % 4) * 0.3,
          delay: index * 0.08,
          repeat: -1,
          ease: 'power1.out',
        })
      }
    }
  }

  destroy(): void {
    for (const target of this.animated) gsap.killTweensOf(target)
    this.layer.destroy({ children: true })
  }
}
