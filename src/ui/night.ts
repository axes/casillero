import { Container, Graphics } from 'pixi.js'
import {
  acknowledgeDevil,
  acknowledgePeek,
  castVote,
  continueAfterNight,
  discardDown,
  drawRound,
  passAction,
  performRoll,
  playAction,
  playerPoints,
  resolveVotes,
  respondTranca,
  type ActionCard,
  type GameState,
  type LeaveChoice,
  type LootCard,
  type PlayerState,
} from '../engine'
import { actionName, actionRule, eventName, eventRule, nightEndCopy } from '../copy'
import type { Screen, TableApi } from './api'
import { reducedMotion, tween, wait } from './animate'
import { DESIGN_W, palette } from './theme'
import { DieFace, drawBackdrop, fillRound, makeButton, makeText, strokeRound } from './widgets'

type VoteStep = 'pass' | 'choose' | 'conceal' | 'reveal'
type ActionStep = 'pass' | 'hand' | 'target' | 'bottle' | 'give' | 'take'

export class NightScreen implements Screen {
  private readonly world = new Container()
  private readonly chrome = new Container()
  private readonly dice: DieFace[] = []
  private voteStep: VoteStep = 'pass'
  private voterCursor = 0
  private readonly localVotes = new Map<number, LeaveChoice>()
  private actionStep: ActionStep = 'pass'
  private chosenCard: ActionCard | null = null
  private targetId: number | null = null
  private giveId: string | null = null
  private readonly trimPicked = new Set<string>()
  private resolving = false
  private dead = false

  constructor(
    private readonly api: TableApi,
    private readonly layer: Container,
    private readonly animate: boolean,
  ) {
    drawBackdrop(layer)
    layer.addChild(this.world, this.chrome)
    void this.run()
  }

  destroy(): void {
    this.dead = true
    this.layer.destroy({ children: true })
  }

  private async run(): Promise<void> {
    const state = this.api.state
    if (!state) return
    this.drawWorld(state)
    if (this.animate && state.lastRoll && !reducedMotion) {
      await this.tumble(state.lastRoll.rolls)
      if (this.dead) return
    }
    this.drawChrome()
    this.api.busy = false
  }

  private drawWorld(state: GameState): void {
    this.world.removeChildren().forEach((child) => child.destroy({ children: true }))
    this.dice.length = 0
    const night = makeText(`Noche ${state.nightIndex + 1} de ${state.config.nights}`, {
      size: 28,
      font: 'serif',
      color: palette.gold,
      weight: '700',
    })
    night.position.set(320, 18)
    const round = makeText(`Ronda ${Math.max(state.round, 1)} de ${state.config.maxRoundsPerNight}`, {
      size: 16,
      color: palette.creamDim,
    })
    round.position.set(300, 54)
    const diceLabel = makeText(state.diceCount === 1 ? '1 dado compartido' : `${state.diceCount} dados compartidos`, {
      size: 16,
      color: palette.cream,
      weight: '600',
    })
    diceLabel.anchor.set(0.5, 0)
    diceLabel.position.set(640, 130)
    this.world.addChild(night, round, diceLabel)
    const size = 92
    const gap = 16
    const total = state.diceCount * size + (state.diceCount - 1) * gap
    const start = 640 - total / 2
    const rolling = Boolean(this.animate && state.lastRoll)
    for (let index = 0; index < state.diceCount; index += 1) {
      const face = new DieFace(size)
      face.show(rolling ? 0 : (state.faces[index] ?? 0), false, false)
      face.view.position.set(start + index * (size + gap), 164)
      this.world.addChild(face.view)
      this.dice.push(face)
    }
    const count = state.players.length
    const cardGap = 10
    const width = (DESIGN_W - 48 - cardGap * (count - 1)) / count
    state.players.forEach((player, index) => {
      const panel = this.playerPanel(state, player, width)
      panel.position.set(24 + index * (width + cardGap), 470)
      this.world.addChild(panel)
    })
  }

  private playerPanel(state: GameState, player: PlayerState, width: number): Container {
    const root = new Container()
    const g = new Graphics()
    fillRound(g, 0, 0, width, 300, 14, player.inside ? palette.panel : 0x12080c, player.inside ? 1 : 0.65)
    strokeRound(g, 0, 0, width, 300, 14, player.inside ? palette.gold : palette.panelEdge, player.inside ? 1.5 : 1)
    g.rect(14, 92, 4, 70).fill({ color: palette.wine })
    g.rect(14, 196, 4, 70).fill({ color: palette.gold })
    const name = makeText(player.name, { size: width < 210 ? 16 : 20, font: 'serif', color: palette.cream, wrap: width - 24 })
    name.position.set(14, 12)
    const status = makeText(player.inside ? 'Sigue en la noche' : 'Ya salió', {
      size: 13,
      color: player.inside ? palette.goldSoft : palette.creamDim,
      weight: '600',
    })
    status.position.set(14, 40)
    const meta = makeText(`Pila ${state.piles[player.id]?.length ?? 0} · ${player.hand.length} en la mano`, {
      size: 13,
      color: palette.creamDim,
      wrap: width - 24,
    })
    meta.position.set(14, 60)
    const exposed = makeText('Esta noche', { size: 12, color: 0xf0b0c0, weight: '700' })
    exposed.position.set(24, 86)
    const exposedPts = makeText(`${playerPoints(player.exposed)} en juego`, { size: 13, color: palette.cream })
    exposedPts.position.set(24, 104)
    const safe = makeText('A salvo', { size: 12, color: palette.goldSoft, weight: '700' })
    safe.position.set(24, 186)
    const safePts = makeText(`${playerPoints(player.secured)} puntos`, { size: 13, color: palette.cream, weight: '600' })
    safePts.position.set(24, 204)
    root.addChild(g, name, status, meta, exposed, exposedPts, safe, safePts, this.tokens(player.exposed, width, 128), this.tokens(player.secured, width, 230))
    const marks = [player.escondite ? 'Escondite' : '', player.sombra ? 'Sombra' : ''].filter(Boolean).join(' · ')
    if (marks) {
      const badge = makeText(marks, { size: 12, color: palette.gold, weight: '700' })
      badge.position.set(14, 270)
      root.addChild(badge)
    }
    return root
  }

  private tokens(cards: readonly LootCard[], width: number, y: number): Container {
    const row = new Container()
    row.position.set(24, y)
    const per = Math.max(3, Math.floor((width - 36) / 36))
    cards.slice(-per).forEach((card, index) => {
      const token = new Container()
      const g = new Graphics()
      fillRound(g, 0, 0, 32, 40, 6, card.points === 3 ? 0x6e3b16 : palette.wineDeep)
      strokeRound(g, 0, 0, 32, 40, 6, palette.gold, 1.5)
      const points = makeText(String(card.points), { size: 16, font: 'serif', color: palette.cream, weight: '700' })
      points.anchor.set(0.5)
      points.position.set(16, 20)
      token.addChild(g, points)
      token.position.set(index * 36, 0)
      row.addChild(token)
    })
    return row
  }

  private async tumble(rolls: readonly number[]): Promise<void> {
    const ticks = reducedMotion ? 1 : 8
    for (let tick = 0; tick < ticks; tick += 1) {
      rolls.forEach((face, index) => this.dice[index]?.show(((tick + index + face) % 6) + 1, false, false))
      await wait(0.05)
      if (this.dead) return
    }
    rolls.forEach((face, index) => this.dice[index]?.show(face, face === 6, false))
    await tween(this.dice[0]?.view ?? this.world, { alpha: 1, duration: 0.05 })
  }

  private drawChrome(): void {
    this.chrome.removeChildren().forEach((child) => child.destroy({ children: true }))
    const state = this.api.state
    if (!state || this.dead) return
    if (state.phase === 'ready') this.drawReady(state)
    else if (state.phase === 'vote') this.drawVote(state)
    else if (state.phase === 'actions') this.drawActions(state)
    else if (state.phase === 'tranca') this.drawTranca(state)
    else if (state.phase === 'peek') this.drawPeek(state)
    else if (state.phase === 'devil') this.drawDevil(state)
    else if (state.phase === 'night-end') this.drawNightEnd(state)
    else if (state.phase === 'trim') this.drawTrim(state)
    else if (state.phase === 'roll') {
      const button = makeButton('Tirar el dado', 280, () => {
        if (!this.api.state) return
        this.api.commit(performRoll(this.api.state), true)
      })
      button.position.set(500, 390)
      this.chrome.addChild(button)
    }
  }

  private drawReady(state: GameState): void {
    const drawn = state.lastDrawn
      .map((item) => {
        const who = state.players[item.playerId]?.name ?? ''
        return item.card.kind === 'loot'
          ? `${who}: ${item.card.name} (${item.card.points})`
          : `${who}: ${eventName(item.card.event)}. ${eventRule(item.card.event)}`
      })
      .join('   ')
    const line = drawn
      ? drawn
      : state.lastRoll
        ? `Dados: ${state.lastRoll.rolls.join(', ')}. No salió 6. Sigue la noche.`
        : 'Cada quien que sigue dentro roba la carta de arriba de su pila.'
    const copy = makeText(line, { size: 16, color: palette.cream, align: 'center', wrap: 640 })
    copy.anchor.set(0.5, 0)
    copy.position.set(640, 340)
    const button = makeButton('Robar la ronda', 320, () => {
      if (!this.api.state || this.api.busy) return
      this.api.commit(drawRound(this.api.state), true)
    })
    button.position.set(480, 390)
    this.chrome.addChild(copy, button)
  }

  private voters(state: GameState): PlayerState[] {
    const list: PlayerState[] = []
    const count = state.players.length
    for (let step = 0; step < count; step += 1) {
      const player = state.players[(state.firstPlayerId + step) % count]
      if (player?.inside) list.push(player)
    }
    return list
  }

  private drawVote(state: GameState): void {
    const voters = this.voters(state)
    const current = voters[this.voterCursor]
    if (this.voteStep === 'reveal' || !current) {
      this.drawVoteReveal(voters)
      return
    }
    if (voters.length === 1 && this.voteStep === 'pass') this.voteStep = 'choose'
    if (this.voteStep === 'pass') this.passScreen(current.name, 'Nadie ve si te vas o sigues, hasta que decidan todos.')
    else if (this.voteStep === 'choose') this.drawLeaveChoice(state, current)
    else this.concealScreen()
  }

  private passScreen(name: string, detail: string, next: () => void = () => {
    this.voteStep = 'choose'
    this.actionStep = 'hand'
    this.drawChrome()
  }): void {
    const card = this.modal(680, 320)
    const title = makeText(`Pásale el celular a ${name}`, { size: 30, font: 'serif', color: palette.gold, wrap: 600 })
    title.position.set(36, 40)
    const body = makeText(detail, { size: 18, color: palette.cream, wrap: 600 })
    body.position.set(36, 120)
    const button = makeButton('Ya lo tengo', 240, next)
    button.position.set(220, 220)
    card.addChild(title, body, button)
  }

  private drawLeaveChoice(state: GameState, player: PlayerState): void {
    const card = this.modal(740, 460)
    const title = makeText(`${player.name}, ¿seguimos?`, { size: 32, font: 'serif', color: palette.gold })
    title.position.set(36, 28)
    const body = makeText(
      'Salir guarda lo de esta noche. Seguir te deja dentro para el dado: un 6 y pierdes ese botín. Lo de otras noches no se toca.',
      { size: 18, color: palette.cream, wrap: 660 },
    )
    body.position.set(36, 90)
    const stake = makeText(`Llevas ${playerPoints(player.exposed)} puntos en juego. Dados en la mesa: ${state.diceCount}.`, {
      size: 16,
      color: palette.goldSoft,
      wrap: 660,
    })
    stake.position.set(36, 190)
    const leave = makeButton('Me voy con lo de esta noche', 660, () => this.keepVote(player.id, 'leave'))
    const stay = makeButton('Sigo en la cava', 660, () => this.keepVote(player.id, 'stay'), 'wine')
    leave.position.set(40, 270)
    stay.position.set(40, 340)
    card.addChild(title, body, stake, leave, stay)
  }

  private keepVote(playerId: number, choice: LeaveChoice): void {
    this.localVotes.set(playerId, choice)
    const voters = this.api.state ? this.voters(this.api.state) : []
    this.voteStep = voters.length === 1 ? 'reveal' : 'conceal'
    this.drawChrome()
  }

  private concealScreen(): void {
    const card = this.modal(640, 280)
    const title = makeText('Decisión guardada', { size: 30, font: 'serif', color: palette.gold })
    title.position.set(36, 40)
    const body = makeText('Tapa el celular antes de pasarlo.', { size: 18, color: palette.cream })
    body.position.set(36, 100)
    const button = makeButton('Listo', 240, () => {
      this.voterCursor += 1
      const voters = this.api.state ? this.voters(this.api.state) : []
      this.voteStep = this.voterCursor >= voters.length ? 'reveal' : 'pass'
      this.drawChrome()
    })
    button.position.set(200, 180)
    card.addChild(title, body, button)
  }

  private drawVoteReveal(voters: readonly PlayerState[]): void {
    const card = this.modal(720, 480)
    const title = makeText('¿Seguimos?', { size: 32, font: 'serif', color: palette.gold })
    title.position.set(36, 28)
    const lines = voters.map((player) => {
      const choice = this.localVotes.get(player.id)
      return `${player.name}: ${choice === 'leave' ? 'se va' : choice === 'stay' ? 'sigue' : 'sin decidir'}`
    })
    const list = makeText(lines.join('\n'), { size: 22, color: palette.cream })
    list.position.set(36, 90)
    const button = makeButton('Resolver', 280, () => this.resolveLeave(voters))
    button.position.set(220, 380)
    card.addChild(title, list, button)
  }

  private resolveLeave(voters: readonly PlayerState[]): void {
    if (this.resolving || !this.api.state) return
    this.resolving = true
    let next = this.api.state
    for (const player of voters) {
      const choice = this.localVotes.get(player.id)
      if (!choice) {
        this.resolving = false
        return
      }
      next = castVote(next, player.id, choice)
    }
    next = resolveVotes(next)
    if (next.phase === 'roll') next = performRoll(next)
    this.api.commit(next, true)
  }

  private drawActions(state: GameState): void {
    const player = state.actionTurn === null ? undefined : state.players[state.actionTurn]
    if (!player) return
    if (this.actionStep === 'pass') {
      this.passScreen(player.name, 'Te toca una acción, o pasar. La mano no se muestra a los demás.', () => {
        this.actionStep = 'hand'
        this.drawChrome()
      })
      return
    }
    if (this.actionStep === 'hand') this.drawHand(player)
    else if (this.actionStep === 'target') this.drawTargets(state, player)
    else if (this.actionStep === 'give') this.drawBottlePick(player.secured, '¿Cuál botella tuya ofreces?', (id) => {
      this.giveId = id
      this.actionStep = 'target'
      this.drawChrome()
    })
    else if (this.actionStep === 'bottle' || this.actionStep === 'take') {
      const target = state.players[this.targetId ?? -1]
      this.drawBottlePick(target?.secured ?? [], '¿Cuál botella?', (id) => this.finishAction(id))
    }
  }

  private drawHand(player: PlayerState): void {
    const card = this.modal(760, 560)
    const title = makeText(`${player.name}, tu mano`, { size: 30, font: 'serif', color: palette.gold })
    title.position.set(28, 20)
    card.addChild(title)
    player.hand.forEach((held, index) => {
      const label = held.action === 'tranca' ? 'Tranca · solo si te apuntan' : `${actionName(held.action)} · ${actionRule(held.action)}`
      const button = makeButton(label, 700, () => this.pickCard(player, held), held.action === 'tranca' ? 'ghost' : 'wine')
      button.position.set(28, 80 + index * 62)
      button.alpha = held.action === 'tranca' ? 0.45 : 1
      card.addChild(button)
    })
    const pass = makeButton('Pasar', 220, () => {
      if (!this.api.state || this.api.state.actionTurn === null) return
      this.api.commit(passAction(this.api.state, this.api.state.actionTurn))
    })
    pass.position.set(270, 480)
    card.addChild(pass)
  }

  private pickCard(player: PlayerState, held: ActionCard): void {
    if (held.action === 'tranca') return
    this.chosenCard = held
    if (held.action === 'delacion' || held.action === 'alarma' || held.action === 'escondite' || held.action === 'sombra') {
      this.commitAction({})
      return
    }
    if (held.action === 'trasiego') {
      if (player.secured.length === 0) return
      this.actionStep = 'give'
      this.drawChrome()
      return
    }
    this.actionStep = 'target'
    this.drawChrome()
  }

  private drawTargets(state: GameState, actor: PlayerState): void {
    const theft = this.chosenCard?.action === 'saqueo' || this.chosenCard?.action === 'quebranto' || this.chosenCard?.action === 'trasiego'
    const options = state.players.filter((player) => player.id !== actor.id && !(theft && player.escondite))
    const card = this.modal(680, 80 + options.length * 70)
    const title = makeText('¿A quién?', { size: 30, font: 'serif', color: palette.gold })
    title.position.set(28, 20)
    card.addChild(title)
    options.forEach((player, index) => {
      const blocked = theft && player.secured.length === 0
      const button = makeButton(blocked ? `${player.name} · sin botín seguro` : player.name, 620, () => {
        if (blocked) return
        this.targetId = player.id
        if (this.chosenCard?.action === 'vistazo') this.commitAction({ targetId: player.id })
        else if (this.chosenCard?.action === 'trasiego') this.actionStep = 'take'
        else this.actionStep = 'bottle'
        if (this.chosenCard?.action !== 'vistazo') this.drawChrome()
      }, 'wine')
      button.position.set(28, 80 + index * 68)
      button.alpha = blocked ? 0.45 : 1
      card.addChild(button)
    })
  }

  private drawBottlePick(cards: readonly LootCard[], prompt: string, onPick: (id: string) => void): void {
    const card = this.modal(680, 120 + cards.length * 64)
    const title = makeText(prompt, { size: 26, font: 'serif', color: palette.gold, wrap: 620 })
    title.position.set(28, 20)
    card.addChild(title)
    cards.forEach((loot, index) => {
      const button = makeButton(`${loot.name} · ${loot.points}`, 620, () => onPick(loot.id), 'gold')
      button.position.set(28, 80 + index * 62)
      card.addChild(button)
    })
  }

  private finishAction(bottleId: string): void {
    if (this.chosenCard?.action === 'trasiego') {
      this.commitAction({ targetId: this.targetId ?? undefined, giveId: this.giveId ?? undefined, takeId: bottleId })
      return
    }
    this.commitAction({ targetId: this.targetId ?? undefined, bottleId })
  }

  private commitAction(payload: { targetId?: number; bottleId?: string; giveId?: string; takeId?: string }): void {
    if (!this.api.state || this.api.state.actionTurn === null || !this.chosenCard) return
    this.api.commit(playAction(this.api.state, this.api.state.actionTurn, this.chosenCard.id, payload))
  }

  private drawTranca(state: GameState): void {
    const pending = state.pending
    const targetId = pending?.payload.targetId
    const target = targetId === undefined ? undefined : state.players[targetId]
    const actor = pending ? state.players[pending.actorId] : undefined
    if (!pending || !target || !actor) return
    const card = this.modal(720, 380)
    const title = makeText(`${target.name}, te apuntaron`, { size: 30, font: 'serif', color: palette.gold, wrap: 640 })
    title.position.set(32, 28)
    const body = makeText(
      `${actor.name} juega ${actionName(pending.card.action)}. Si tienes Tranca, puedes cancelarla ahora.`,
      { size: 18, color: palette.cream, wrap: 640 },
    )
    body.position.set(32, 110)
    const use = makeButton('Jugar Tranca', 640, () => {
      if (!this.api.state) return
      this.api.commit(respondTranca(this.api.state, true))
    }, 'wine')
    const skip = makeButton('Dejar que pase', 640, () => {
      if (!this.api.state) return
      this.api.commit(respondTranca(this.api.state, false))
    })
    use.position.set(40, 210)
    skip.position.set(40, 280)
    card.addChild(title, body, use, skip)
  }

  private drawPeek(state: GameState): void {
    const peek = state.peek
    if (!peek) return
    const viewer = state.players[peek.viewerId]
    const target = state.players[peek.targetId]
    const card = this.modal(720, 420)
    const title = makeText(`${viewer?.name ?? ''}, la mano de ${target?.name ?? ''}`, {
      size: 28,
      font: 'serif',
      color: palette.gold,
      wrap: 640,
    })
    title.position.set(32, 24)
    const hand = makeText(
      target && target.hand.length > 0 ? target.hand.map((held) => `${actionName(held.action)} — ${actionRule(held.action)}`).join('\n') : 'No tiene cartas.',
      { size: 18, color: palette.cream, wrap: 640 },
    )
    hand.position.set(32, 100)
    const button = makeButton('Listo, tapa el celular', 360, () => {
      if (!this.api.state) return
      this.api.commit(acknowledgePeek(this.api.state))
    })
    button.position.set(180, 330)
    card.addChild(title, hand, button)
  }

  private drawDevil(state: GameState): void {
    const veil = new Graphics()
    veil.rect(0, 0, DESIGN_W, 800).fill({ color: 0x070203, alpha: 0.94 })
    veil.eventMode = 'static'
    const panel = new Graphics()
    fillRound(panel, 80, 40, 1120, 720, 20, 0x14060a)
    strokeRound(panel, 80, 40, 1120, 720, 20, palette.wine, 2)
    const title = makeText('6', { size: 92, font: 'serif', color: 0xf2d2a2, weight: '700' })
    title.anchor.set(0.5, 0)
    title.position.set(640, 70)
    const line = makeText('El Diablo los descubrió.', { size: 32, font: 'serif', color: palette.cream })
    line.anchor.set(0.5, 0)
    line.position.set(640, 180)
    const losses = state.players
      .filter((player) => state.nightEnd?.lost[player.id]?.length)
      .map((player) => `${player.name} pierde ${state.nightEnd?.lost[player.id]?.map((card) => `${card.name} (${card.points})`).join(', ')}.`)
    const saved = state.nightEnd?.sombraSaved.map((id) => state.players[id]?.name).filter(Boolean) ?? []
    if (saved.length) losses.push(`${saved.join(' y ')} tenía Sombra y asegura lo suyo.`)
    if (losses.length === 0) losses.push('Quienes seguían dentro no tenían botín de esta noche.')
    const body = makeText(losses.join('\n'), { size: 18, color: palette.cream, align: 'center', wrap: 860 })
    body.anchor.set(0.5, 0)
    body.position.set(640, 260)
    const button = makeButton('Cerrar la noche', 300, () => {
      if (!this.api.state) return
      this.api.commit(acknowledgeDevil(this.api.state))
    })
    button.position.set(490, 640)
    this.chrome.addChild(veil, panel, title, line, body, button)
  }

  private drawNightEnd(state: GameState): void {
    const card = this.modal(860, 360)
    const title = makeText(`Fin de la noche ${state.nightIndex + 1}`, { size: 32, font: 'serif', color: palette.gold })
    title.position.set(36, 28)
    const body = makeText(nightEndCopy(state), { size: 20, color: palette.cream, wrap: 780 })
    body.position.set(36, 90)
    const scores = makeText(
      state.players.map((player) => `${player.name} ${playerPoints(player.secured)}`).join('   ·   '),
      { size: 18, color: palette.goldSoft, wrap: 780 },
    )
    scores.position.set(36, 180)
    const last = state.nightIndex + 1 >= state.config.nights
    const button = makeButton(last ? 'Ver el recuento' : 'Siguiente cortina', 320, () => {
      if (!this.api.state) return
      this.api.commit(continueAfterNight(this.api.state))
    })
    button.position.set(270, 260)
    card.addChild(title, body, scores, button)
  }

  private drawTrim(state: GameState): void {
    const playerId = state.trimQueue[0]
    const player = playerId === undefined ? undefined : state.players[playerId]
    if (!player) return
    const extra = player.hand.length - state.config.actions.handLimit
    const card = this.modal(760, 520)
    const title = makeText(`${player.name}, te sobran ${extra}`, { size: 28, font: 'serif', color: palette.gold, wrap: 680 })
    title.position.set(28, 20)
    const hint = makeText('Elige qué acciones descartar. La mano queda en tres.', { size: 16, color: palette.creamDim })
    hint.position.set(28, 70)
    card.addChild(title, hint)
    player.hand.forEach((held, index) => {
      const picked = this.trimPicked.has(held.id)
      const button = makeButton(`${picked ? '✓ ' : ''}${actionName(held.action)}`, 700, () => {
        if (this.trimPicked.has(held.id)) this.trimPicked.delete(held.id)
        else this.trimPicked.add(held.id)
        this.drawChrome()
      }, picked ? 'gold' : 'ghost')
      button.position.set(28, 110 + index * 62)
      card.addChild(button)
    })
    const ready = this.trimPicked.size === extra
    const confirm = makeButton('Descartar', 240, () => {
      if (!ready || !this.api.state || playerId === undefined) return
      this.api.commit(discardDown(this.api.state, playerId, [...this.trimPicked]))
    })
    confirm.alpha = ready ? 1 : 0.45
    confirm.position.set(260, 450)
    card.addChild(confirm)
  }

  private modal(width: number, height: number): Container {
    const veil = new Graphics()
    veil.rect(0, 0, DESIGN_W, 800).fill({ color: 0x070304, alpha: 0.82 })
    veil.eventMode = 'static'
    const card = new Container()
    const g = new Graphics()
    fillRound(g, 0, 0, width, height, 18, 0x14090c, 0.98)
    strokeRound(g, 0, 0, width, height, 18, palette.gold, 1.5, 0.85)
    card.addChild(g)
    card.position.set((DESIGN_W - width) / 2, Math.max(24, (800 - height) / 2))
    this.chrome.addChild(veil, card)
    return card
  }
}
