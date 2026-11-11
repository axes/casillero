import { Container, Graphics } from 'pixi.js'
import { endCopy, pointsLabel, wineKind } from '../copy'
import { continueAfterSummary, offeringPoints, pilePoints } from '../engine'
import type { GameState } from '../engine'
import type { Screen, TableApi } from './api'
import { palette } from './theme'
import { drawBackdrop, fillRound, makeButton, makeText, offeringBar, strokeRound } from './widgets'

export class SummaryScreen implements Screen {
  constructor(
    private readonly api: TableApi,
    private readonly layer: Container,
  ) {
    const state = api.state
    if (!state?.currentRecord) return
    drawBackdrop(layer)
    const record = state.currentRecord
    const title = makeText(`Cierre · ${record.name}`, { size: 40, font: 'serif', color: palette.gold, weight: '700' })
    title.position.set(72, 36)
    const reason = makeText(endCopy(record.reason), { size: 18, color: palette.cream, wrap: 760 })
    reason.position.set(72, 96)
    const meter = offeringBar(offeringPoints(state), state.config.offeringThreshold, 280)
    meter.position.set(900, 48)
    layer.addChild(title, reason, meter)

    state.players.forEach((player, index) => {
      const column = index % 3
      const row = Math.floor(index / 3)
      const card = this.playerCard(state, player.id)
      card.position.set(72 + column * 390, 200 + row * 210)
      layer.addChild(card)
    })

    const mystery =
      record.mystery.length === 0
        ? 'Botellas misteriosas: ninguna en este prototipo.'
        : `Botellas misteriosas: ${record.mystery.map((bottle) => bottle.cepa).join(', ')}.`
    const mysteryText = makeText(mystery, { size: 16, color: palette.creamDim, wrap: 780 })
    mysteryText.position.set(72, 640)

    const nextIndex = state.incursionIndex + 1
    const nextName = state.config.incursionNames[nextIndex]
    const label = nextName ? `Bajar a ${nextName}` : 'Ver el recuento'
    const button = makeButton(label, 320, () => {
      if (!this.api.state) return
      this.api.commit(continueAfterSummary(this.api.state))
    })
    button.position.set(880, 700)
    const kind = makeText(
      `${wineKind(record.index)} · ${record.raids} ${record.raids === 1 ? 'saqueo' : 'saqueos'}`,
      { size: 16, color: palette.goldSoft },
    )
    kind.position.set(72, 678)
    layer.addChild(mysteryText, kind, button)
  }

  destroy(): void {
    this.layer.destroy({ children: true })
  }

  private playerCard(state: GameState, playerId: number): Container {
    const player = state.players[playerId]
    const record = state.currentRecord
    const root = new Container()
    const g = new Graphics()
    fillRound(g, 0, 0, 370, 190, 14, palette.panel)
    strokeRound(g, 0, 0, 370, 190, 14, palette.panelEdge, 1.5)
    root.addChild(g)
    if (!player || !record) return root
    const gained = record.gained[playerId] ?? []
    const lost = record.lost[playerId] ?? []
    const stained = record.stainedIds.includes(playerId)
    const name = makeText(player.name, { size: 22, font: 'serif', color: palette.cream })
    name.position.set(16, 14)
    const status = makeText(stained ? 'Manchado por el Diablo' : player.inside ? 'Seguía dentro' : 'Ya estaba fuera', {
      size: 14,
      color: stained ? palette.danger : palette.creamDim,
      weight: '600',
    })
    status.position.set(16, 46)
    const safe = makeText(`Aseguró ${gained.length} · ${pointsLabel(gained, state.config)}`, {
      size: 16,
      color: palette.goldSoft,
    })
    safe.position.set(16, 78)
    const gone = makeText(`Perdió ${lost.length} · ${pointsLabel(lost, state.config)}`, {
      size: 16,
      color: lost.length > 0 ? 0xf0b4b8 : palette.creamDim,
    })
    gone.position.set(16, 104)
    const total = makeText(`Colección segura: ${pointsLabel(player.secured, state.config)}`, {
      size: 16,
      color: palette.cream,
      weight: '600',
    })
    total.position.set(16, 140)
    const detail = [...gained.map((bottle) => bottle.cepa), ...lost.map((bottle) => `−${bottle.cepa}`)].join('  ')
    const cepas = makeText(detail || 'Sin movimiento', { size: 13, color: palette.creamDim, wrap: 338 })
    cepas.position.set(16, 164)
    if (detail) {
      const worth = pilePoints(gained, state.config)
      total.text = `Colección segura: ${pointsLabel(player.secured, state.config)} · esta incursión +${worth}`
    }
    root.addChild(name, status, safe, gone, total, cepas)
    return root
  }
}
