import gsap from 'gsap'
import { Container, Graphics, Text } from 'pixi.js'
import {
  describeDepartures,
  describeRaid,
  fleeHint,
  joinNames,
  pointsLabel,
  threatCopy,
  wineKind,
} from '../copy'
import {
  acknowledgeDevil,
  castVote,
  chooseFlight,
  confirmIntro,
  lockedCount,
  offeringPoints,
  performRaid,
  resolveVotes,
  threatBand,
  type Bottle,
  type GameState,
  type PlayerState,
  type Vote,
} from '../engine'
import type { Screen, TableApi } from './api'
import { reducedMotion, tween, wait } from './animate'
import { DESIGN_H, DESIGN_W, palette } from './theme'
import {
  DieFace,
  bottleToken,
  drawBackdrop,
  fillRound,
  makeButton,
  makeText,
  offeringBar,
  strokeRound,
} from './widgets'

type Wizard = 'pass' | 'choose' | 'conceal' | 'reveal'
type FlightStep = 'pass' | 'choose'

export class TableScreen implements Screen {
  private readonly world = new Container()
  private readonly fx = new Container()
  private readonly chrome = new Container()
  private readonly dice: DieFace[] = []
  private readonly tokens = new Map<string, Container>()
  private readonly playerAnchors = new Map<number, { x: number; y: number }>()
  private readonly animated: object[] = []
  private flame: Graphics | null = null
  private candleNote: Text | null = null
  private hiddenToken: Container | null = null
  private wizard: Wizard = 'pass'
  private voterCursor = 0
  private readonly localVotes = new Map<number, Vote>()
  private flightStep: FlightStep = 'pass'
  private resolving = false
  private dead = false

  constructor(
    private readonly api: TableApi,
    private readonly layer: Container,
    private readonly animateRaid: boolean,
  ) {
    this.fx.eventMode = 'none'
    drawBackdrop(layer)
    layer.addChild(this.world, this.fx, this.chrome)
    const state = api.state
    if (state?.phase === 'vote' && this.voters(state).length === 1) this.wizard = 'choose'
    void this.run()
  }

  destroy(): void {
    this.dead = true
    for (const target of this.animated) gsap.killTweensOf(target)
    this.layer.destroy({ children: true })
  }

  private async run(): Promise<void> {
    const state = this.api.state
    if (!state) return
    this.drawWorld(state)
    if (this.animateRaid && state.lastRaid) {
      await this.playRaid(state)
    }
    if (this.dead) return
    this.drawChrome()
    this.api.busy = false
  }

  private drawWorld(state: GameState): void {
    this.world.removeChildren().forEach((child) => child.destroy({ children: true }))
    this.dice.length = 0
    this.tokens.clear()
    this.playerAnchors.clear()
    this.flame = null
    this.candleNote = null
    this.hiddenToken = null
    this.drawHeader(state)
    this.drawDeck(state)
    this.drawCandle(state)
    this.drawDice(state)
    this.drawPlayers(state)
    if (this.animateRaid && state.lastRaid) {
      const token = this.tokens.get(state.lastRaid.drawn.id)
      if (token) {
        token.alpha = 0
        this.hiddenToken = token
      }
    }
  }

  private drawHeader(state: GameState): void {
    const mark = makeText('CASILLERO', { size: 14, color: palette.gold, weight: '700', letterSpacing: 3 })
    mark.position.set(48, 22)
    const name = state.config.incursionNames[state.incursionIndex] ?? 'Incursión'
    const title = makeText(name, { size: 32, font: 'serif', color: palette.cream, weight: '700' })
    title.anchor.set(0.5, 0)
    title.position.set(640, 16)
    const mult = state.config.valueMultiplier[state.incursionIndex] ?? 1
    const subtitle = makeText(
      `Incursión ${state.incursionIndex + 1} de ${state.config.incursions}  ·  ${wineKind(state.incursionIndex)}  ·  ×${mult}`,
      { size: 16, color: palette.creamDim },
    )
    subtitle.anchor.set(0.5, 0)
    subtitle.position.set(640, 54)
    const meter = offeringBar(offeringPoints(state), state.config.offeringThreshold, 230)
    meter.position.set(980, 18)
    const seed = makeText(`Semilla ${state.seed}`, { size: 13, color: palette.creamDim })
    seed.position.set(980, 62)
    const pips = new Graphics()
    const count = state.config.incursions
    for (let index = 0; index < count; index += 1) {
      const cx = 640 - ((count - 1) * 16) / 2 + index * 16
      pips.circle(cx, 86, index === state.incursionIndex ? 5 : 3.5).fill({
        color: index === state.incursionIndex ? palette.gold : index < state.incursionIndex ? palette.creamDim : 0x3a2428,
      })
    }
    this.world.addChild(mark, title, subtitle, meter, seed, pips)
  }

  private drawDeck(state: GameState): void {
    const stack = new Graphics()
    for (let index = 2; index >= 0; index -= 1) {
      fillRound(stack, 48 + index * 4, 168 + index * 3, 118, 164, 10, index === 0 ? palette.wineDeep : 0x2a1018)
      strokeRound(stack, 48 + index * 4, 118 * 0 + 168 + index * 3, 118, 164, 10, palette.gold, 1.5, 0.8)
    }
    stack.circle(107, 236, 16).fill({ color: palette.gold })
    stack.circle(107, 236, 8).fill({ color: palette.wine })
    const title = makeText('La bodega', { size: 16, color: palette.goldSoft, weight: '700' })
    title.position.set(48, 348)
    const count = makeText(`${state.deck.length} por robar`, { size: 14, color: palette.creamDim })
    count.position.set(48, 370)
    const discard = makeText(`Descarte ${state.discard.length}`, { size: 14, color: palette.creamDim })
    discard.position.set(48, 390)
    this.world.addChild(stack, title, count, discard)
  }

  private drawCandle(state: GameState): void {
    if (!state.config.candleAbsorbsFirstSix[state.incursionIndex]) return
    const previewLit = Boolean(this.animateRaid && state.lastRaid?.absorbedIndex !== null)
    const lit = previewLit || state.candleLit
    const root = new Container()
    root.position.set(250, 250)
    const g = new Graphics()
    fillRound(g, -10, 18, 20, 78, 4, palette.cream)
    fillRound(g, -16, 92, 32, 10, 3, palette.gold)
    root.addChild(g)
    if (lit) {
      this.flame = new Graphics()
      this.flame.ellipse(0, -6, 11, 18).fill({ color: 0xffb347 })
      this.flame.ellipse(0, -10, 5, 10).fill({ color: 0xfff4d2 })
      root.addChild(this.flame)
      this.animated.push(this.flame)
      if (!reducedMotion) {
        gsap.to(this.flame, { y: -4, duration: 0.55, yoyo: true, repeat: -1, ease: 'sine.inOut' })
      }
    } else {
      g.circle(0, 8, 4).fill({ color: palette.smoke })
    }
    this.candleNote = makeText(lit ? 'La vela está encendida' : 'La vela se apagó', {
      size: 14,
      color: lit ? palette.goldSoft : palette.creamDim,
      align: 'center',
      wrap: 160,
    })
    this.candleNote.anchor.set(0.5, 0)
    this.candleNote.position.set(0, 112)
    root.addChild(this.candleNote)
    this.world.addChild(root)
  }

  private drawDice(state: GameState): void {
    const raid = state.lastRaid
    const size = 104
    const gap = 18
    const total = state.dice.length * size + (state.dice.length - 1) * gap
    const start = 760 - total / 2
    state.dice.forEach((die, index) => {
      const face = new DieFace(size)
      const rolling = Boolean(this.animateRaid && raid?.rolledIndices.includes(index))
      face.show(rolling ? 0 : die.value, rolling ? false : die.locked, !rolling && raid?.absorbedIndex === index)
      face.view.position.set(start + index * (size + gap), 168)
      this.world.addChild(face.view)
      this.dice.push(face)
    })
    const locked = lockedCount(state.dice)
    const shownBand = threatBand(locked, state.config.devilAtLockedSixes)
    const copy = threatCopy(shownBand)
    const threat = makeText(this.animateRaid ? 'Tirando…' : `${copy.title}. ${copy.line}`, {
      size: 20,
      font: 'serif',
      color: !this.animateRaid && shownBand >= 2 ? 0xf0b4b8 : palette.cream,
      align: 'center',
    })
    threat.anchor.set(0.5, 0)
    threat.position.set(760, 300)
    this.world.addChild(threat)
  }

  private drawPlayers(state: GameState): void {
    const count = state.players.length
    const gap = 10
    const width = (DESIGN_W - 64 - gap * (count - 1)) / count
    state.players.forEach((player, index) => {
      const panel = this.playerPanel(state, player, width)
      panel.position.set(32 + index * (width + gap), 508)
      this.playerAnchors.set(player.id, { x: panel.x + width / 2, y: panel.y + 92 })
      this.world.addChild(panel)
    })
  }

  private playerPanel(state: GameState, player: PlayerState, width: number): Container {
    const root = new Container()
    const active = state.phase === 'ready' && player.id === state.activePlayerId && player.inside
    const g = new Graphics()
    fillRound(g, 0, 0, width, 268, 14, player.inside ? palette.panel : 0x12080c, player.inside ? 1 : 0.7)
    strokeRound(g, 0, 0, width, 268, 14, active ? palette.gold : palette.panelEdge, active ? 2.5 : 1)
    g.rect(14, 78, 4, 78).fill({ color: palette.wine })
    g.rect(14, 176, 4, 70).fill({ color: palette.gold })
    root.addChild(g)
    const name = makeText(player.name, { size: width < 220 ? 16 : 20, font: 'serif', color: palette.cream, wrap: width - 24 })
    name.position.set(14, 12)
    const status = makeText(this.statusLine(state, player), {
      size: 13,
      color: player.stained ? 0xf0b4b8 : active ? palette.goldSoft : palette.creamDim,
      weight: '600',
      wrap: width - 24,
    })
    status.position.set(14, 40)
    const exposedLabel = makeText('Botín expuesto', { size: 12, color: 0xf0b0c0, weight: '700' })
    exposedLabel.position.set(24, 70)
    const exposedPoints = makeText(`en juego ${pointsLabel(player.exposed, state.config)}`, {
      size: 13,
      color: palette.cream,
    })
    exposedPoints.position.set(24, 88)
    const safeLabel = makeText('Colección segura', { size: 12, color: palette.goldSoft, weight: '700' })
    safeLabel.position.set(24, 168)
    const safePoints = makeText(`a salvo ${pointsLabel(player.secured, state.config)}`, {
      size: 13,
      color: palette.cream,
      weight: '600',
    })
    safePoints.position.set(24, 186)
    root.addChild(name, status, exposedLabel, exposedPoints, safeLabel, safePoints)
    root.addChild(this.tokenRow(player.exposed, 'exposed', width))
    const safeRow = this.tokenRow(player.secured, 'safe', width)
    safeRow.y = 210
    root.addChild(safeRow)
    return root
  }

  private tokenRow(bottles: readonly Bottle[], kind: 'exposed' | 'safe', width: number): Container {
    const row = new Container()
    row.position.set(24, 112)
    const per = Math.max(3, Math.floor((width - 36) / 30))
    bottles.slice(-per).forEach((bottle, index) => {
      const token = bottleToken(bottle.cepa, kind)
      token.position.set(index * 30, 0)
      row.addChild(token)
      this.tokens.set(bottle.id, token)
    })
    return row
  }

  private statusLine(state: GameState, player: PlayerState): string {
    if (player.stained) return 'Manchado'
    if (!player.inside) return 'Fuera de esta incursión'
    if (state.phase === 'ready' && player.id === state.activePlayerId) return 'Roba ahora'
    return 'En la incursión'
  }

  private async playRaid(state: GameState): Promise<void> {
    const raid = state.lastRaid
    if (!raid) return
    const holder = this.buildCard(raid.drawn, state, false, true)
    holder.position.set(120, 250)
    holder.scale.set(0.7)
    this.fx.addChild(holder)
    this.animated.push(holder, holder.scale)
    await Promise.all([
      tween(holder, { x: 760, y: 250, duration: 0.38, ease: 'power2.out' }),
      tween(holder.scale, { x: 1, y: 1, duration: 0.38, ease: 'power2.out' }),
    ])
    if (this.dead) return
    await tween(holder.scale, { x: 0, duration: 0.12 })
    if (this.dead) return
    holder.removeChildren().forEach((child) => child.destroy({ children: true }))
    holder.addChild(this.buildCard(raid.drawn, state, true, false))
    await tween(holder.scale, { x: 1, duration: 0.16 })
    if (this.dead) return
    const ticks = reducedMotion ? 1 : 8
    for (let tick = 0; tick < ticks; tick += 1) {
      for (const index of raid.rolledIndices) {
        this.dice[index]?.show(((tick + index) % 6) + 1, false, false)
      }
      await wait(0.05)
      if (this.dead) return
    }
    for (const index of raid.rolledIndices) {
      const die = state.dice[index]
      if (!die) continue
      this.dice[index]?.show(die.value, die.locked, raid.absorbedIndex === index)
    }
    const locked = lockedCount(state.dice)
    const note = this.world.children.find((child) => child instanceof Text && child.text.startsWith('Tirando'))
    if (note instanceof Text) {
      const copy = threatCopy(threatBand(locked, state.config.devilAtLockedSixes))
      note.text = `${copy.title}. ${copy.line}`
    }
    if (raid.absorbedIndex !== null && this.flame) {
      await tween(this.flame, { alpha: 0, duration: 0.28 })
      this.flame.visible = false
      if (this.candleNote) this.candleNote.text = 'La vela se apagó'
    }
    await wait(0.12)
    if (this.dead) return
    const anchor = this.playerAnchors.get(raid.playerId) ?? { x: 640, y: 600 }
    await tween(holder, { x: anchor.x, y: anchor.y, duration: 0.36, ease: 'power2.inOut' })
    await tween(holder, { alpha: 0, duration: 0.12 })
    if (this.hiddenToken) this.hiddenToken.alpha = 1
    holder.visible = false
  }

  private buildCard(bottle: Bottle, state: GameState, faceUp: boolean, centered: boolean): Container {
    const root = new Container()
    const g = new Graphics()
    const mult = state.config.valueMultiplier[bottle.drawnInIncursion] ?? 1
    if (!faceUp) {
      fillRound(g, 0, 0, 168, 236, 12, palette.wineDeep)
      strokeRound(g, 0, 0, 168, 236, 12, palette.gold, 2)
      g.circle(84, 100, 28).fill({ color: palette.gold })
      g.circle(84, 100, 16).fill({ color: palette.wine })
      const seal = makeText('C', { size: 20, font: 'serif', color: palette.goldSoft, weight: '700' })
      seal.anchor.set(0.5)
      seal.position.set(84, 168)
      root.addChild(g, seal)
    } else {
      fillRound(g, 0, 0, 168, 236, 12, palette.cream)
      strokeRound(g, 0, 0, 168, 236, 12, palette.gold, 2)
      const kicker = makeText(wineKind(bottle.drawnInIncursion), { size: 13, color: palette.wine, weight: '700' })
      kicker.position.set(14, 18)
      const cepa = makeText(bottle.cepa, { size: 22, font: 'serif', color: palette.ink, weight: '700', wrap: 140 })
      cepa.position.set(14, 48)
      const worth = makeText(`Vale ${mult} si la aseguras`, { size: 14, color: 0x6a3a2a, wrap: 140 })
      worth.position.set(14, 150)
      root.addChild(g, kicker, cepa, worth)
    }
    if (centered) root.pivot.set(84, 118)
    return root
  }

  private drawChrome(): void {
    this.chrome.removeChildren().forEach((child) => child.destroy({ children: true }))
    const state = this.api.state
    if (!state || this.dead) return
    if (state.phase === 'intro') this.drawIntro(state)
    else if (state.phase === 'ready') this.drawReady(state)
    else if (state.phase === 'vote') this.drawVote(state)
    else if (state.phase === 'flight') this.drawFlight(state)
    else if (state.phase === 'devil') this.drawDevil(state)
  }

  private drawIntro(state: GameState): void {
    const name = state.config.incursionNames[state.incursionIndex] ?? 'la incursión'
    const mult = state.config.valueMultiplier[state.incursionIndex] ?? 1
    const candle = state.config.candleAbsorbsFirstSix[state.incursionIndex] === true
    const locked = state.config.startLocked[state.incursionIndex] ?? 0
    let line = `${wineKind(state.incursionIndex)}. Cada botella de esta incursión vale ${mult}.`
    if (candle) line += ' La vela se come el primer 6: ese dado no se bloquea y, mientras siga encendida, no puede salir el 666.'
    else if (locked > 0) line += ' Ya hay un 6 bloqueado. Se juega con dos dados. El Diablo ya escuchó.'
    else line += ' Tres dados libres. Todo 6 natural se bloquea.'
    const copy = makeText(line, { size: 16, color: palette.cream, align: 'center', wrap: 620 })
    copy.anchor.set(0.5, 0)
    copy.position.set(760, 348)
    const button = makeButton(`Entrar a ${name}`, 320, () => {
      if (!this.api.state) return
      this.api.commit(confirmIntro(this.api.state))
    })
    button.position.set(600, 430)
    this.chrome.addChild(copy, button)
  }

  private drawReady(state: GameState): void {
    const banner = describeDepartures(state) ?? describeRaid(state) ?? 'El saqueo es de una botella. Después votan quienes siguen dentro.'
    const copy = makeText(banner, { size: 16, color: palette.cream, align: 'center', wrap: 640 })
    copy.anchor.set(0.5, 0)
    copy.position.set(760, 348)
    const actor = state.players[state.activePlayerId]?.name ?? 'Alguien'
    const button = makeButton(`${actor} roba y tira`, 340, () => this.raid())
    button.position.set(590, 424)
    this.chrome.addChild(copy, button)
  }

  private raid(): void {
    if (this.api.busy || !this.api.state || this.api.state.phase !== 'ready') return
    const current = this.api.state
    const next = performRaid(current)
    this.api.commit(next, next.raidSerial !== current.raidSerial)
  }

  private drawVote(state: GameState): void {
    const voters = this.voters(state)
    const current = voters[this.voterCursor]
    if (this.wizard === 'reveal' || !current) {
      this.drawReveal(voters)
      return
    }
    if (this.wizard === 'pass') this.drawPass(current.name, 'Tu voto queda oculto hasta que hablen todos.')
    else if (this.wizard === 'choose') this.drawChoice(state, current, voters)
    else this.drawConceal()
  }

  private drawPass(name: string, detail: string): void {
    const card = this.modal(680, 360)
    const title = makeText(`Pásale el celular a ${name}`, {
      size: 30,
      font: 'serif',
      color: palette.gold,
      wrap: 600,
    })
    title.position.set(40, 48)
    const body = makeText(detail, { size: 18, color: palette.cream, wrap: 600 })
    body.position.set(40, 140)
    const button = makeButton('Ya lo tengo', 240, () => {
      this.wizard = 'choose'
      this.flightStep = 'choose'
      this.drawChrome()
    })
    button.position.set(220, 250)
    card.addChild(title, body, button)
  }

  private drawChoice(state: GameState, player: PlayerState, voters: readonly PlayerState[]): void {
    const card = this.modal(760, 520)
    const title = makeText(`${player.name}, te toca`, { size: 32, font: 'serif', color: palette.gold })
    title.position.set(36, 28)
    const alone = voters.length === 1
    const rule = alone
      ? 'Estás solo en la bodega. Si votas salir, te llevas todo lo expuesto. Si sigues, robas otra vez.'
      : 'Salir solo funciona si todos los que siguen dentro están de acuerdo. Si alguien quiere seguir, este voto no te saca: ahí eliges si huyes o te quedas.'
    const body = makeText(rule, { size: 17, color: palette.cream, wrap: 680 })
    body.position.set(36, 84)
    const stake = voters
      .map((candidate) => `${candidate.name} arriesga ${pointsLabel(candidate.exposed, state.config)}`)
      .join('   ·   ')
    const stakes = makeText(stake, { size: 15, color: palette.goldSoft, wrap: 680 })
    stakes.position.set(36, 176)
    const threat = threatCopy(threatBand(lockedCount(state.dice), state.config.devilAtLockedSixes))
    const context = makeText(
      `Ofrenda ${offeringPoints(state)} / ${state.config.offeringThreshold}. ${threat.line} Tú tienes en juego: ${pointsLabel(player.exposed, state.config)}.`,
      { size: 16, color: palette.creamDim, wrap: 680 },
    )
    context.position.set(36, 230)
    const stay = makeButton('Seguir en la incursión', 680, () => this.keepVote(player.id, 'continue'), 'wine')
    const exit = makeButton('Salir si hay unanimidad', 680, () => this.keepVote(player.id, 'exit'), 'gold')
    stay.position.set(40, 320)
    exit.position.set(40, 390)
    card.addChild(title, body, stakes, context, stay, exit)
  }

  private keepVote(playerId: number, vote: Vote): void {
    this.localVotes.set(playerId, vote)
    const state = this.api.state
    if (!state) return
    const voters = this.voters(state)
    if (voters.length === 1) {
      this.wizard = 'reveal'
    } else {
      this.wizard = 'conceal'
    }
    this.drawChrome()
  }

  private drawConceal(): void {
    const card = this.modal(640, 300)
    const title = makeText('Voto guardado', { size: 32, font: 'serif', color: palette.gold })
    title.position.set(40, 48)
    const body = makeText('Tapa el celular antes de pasarlo.', { size: 18, color: palette.cream })
    body.position.set(40, 110)
    const button = makeButton('Listo, que siga el otro', 320, () => {
      this.voterCursor += 1
      const state = this.api.state
      const voters = state ? this.voters(state) : []
      this.wizard = this.voterCursor >= voters.length ? 'reveal' : 'pass'
      this.drawChrome()
    })
    button.position.set(160, 190)
    card.addChild(title, body, button)
  }

  private drawReveal(voters: readonly PlayerState[]): void {
    const card = this.modal(720, 520)
    const title = makeText('Así votaron', { size: 32, font: 'serif', color: palette.gold })
    title.position.set(36, 28)
    const lines = voters.map((player) => {
      const vote = this.localVotes.get(player.id)
      const label = vote === 'exit' ? 'salir' : vote === 'continue' ? 'seguir' : 'sin voto'
      return `${player.name}: ${label}`
    })
    const list = makeText(lines.join('\n'), { size: 20, color: palette.cream, wrap: 640 })
    list.position.set(36, 90)
    const allExit = voters.every((player) => this.localVotes.get(player.id) === 'exit')
    const anyExit = voters.some((player) => this.localVotes.get(player.id) === 'exit')
    const prediction = allExit
      ? 'Hay unanimidad. El botín expuesto pasa a la colección segura.'
      : anyExit
        ? 'No hay unanimidad. Quienes votaron salir eligen si huyen o se quedan.'
        : 'Nadie pidió salir. Sigue el siguiente saqueo.'
    const note = makeText(prediction, { size: 17, color: palette.goldSoft, wrap: 640 })
    note.position.set(36, 300)
    const button = makeButton(allExit ? 'Asegurar el botín' : 'Resolver la decisión', 360, () => this.resolveBallot(voters))
    button.position.set(180, 420)
    card.addChild(title, list, note, button)
  }

  private resolveBallot(voters: readonly PlayerState[]): void {
    if (this.resolving || !this.api.state) return
    this.resolving = true
    let next = this.api.state
    for (const player of voters) {
      const vote = this.localVotes.get(player.id)
      if (!vote) {
        this.resolving = false
        return
      }
      next = castVote(next, player.id, vote)
    }
    this.api.commit(resolveVotes(next))
  }

  private drawFlight(state: GameState): void {
    const playerId = state.pendingFlight[0]
    const player = playerId === undefined ? undefined : state.players[playerId]
    if (!player) return
    if (this.flightStep === 'pass') {
      const tally = this.tally(state)
      this.drawPass(player.name, `${tally} Ahora decide si huye o se queda.`)
      return
    }
    const card = this.modal(760, 480)
    const title = makeText(`${player.name}, no hubo unanimidad`, { size: 30, font: 'serif', color: palette.gold, wrap: 680 })
    title.position.set(36, 28)
    const hint = makeText(fleeHint(player.exposed.length, state.config.fleePenalty), {
      size: 17,
      color: palette.cream,
      wrap: 680,
    })
    hint.position.set(36, 110)
    const exposed =
      player.exposed.length === 0
        ? 'No tienes botín expuesto.'
        : `En juego: ${player.exposed.map((bottle) => bottle.cepa).join(', ')}.`
    const loot = makeText(exposed, { size: 16, color: palette.goldSoft, wrap: 680 })
    loot.position.set(36, 200)
    const flee = makeButton('Huir', 680, () => this.flight('flee'), 'wine')
    const stay = makeButton('Quedarme y arriesgar', 680, () => this.flight('stay'), 'gold')
    flee.position.set(40, 280)
    stay.position.set(40, 350)
    card.addChild(title, hint, loot, flee, stay)
  }

  private flight(choice: 'flee' | 'stay'): void {
    if (this.resolving || !this.api.state) return
    const playerId = this.api.state.pendingFlight[0]
    if (playerId === undefined) return
    this.resolving = true
    this.api.commit(chooseFlight(this.api.state, playerId, choice))
  }

  private tally(state: GameState): string {
    const exiters = state.revealedVotes.filter((vote) => vote.vote === 'exit').map((vote) => state.players[vote.playerId]?.name ?? '')
    const stayers = state.revealedVotes.filter((vote) => vote.vote === 'continue').map((vote) => state.players[vote.playerId]?.name ?? '')
    return `Salir: ${joinNames(exiters) || 'nadie'}. Seguir: ${joinNames(stayers) || 'nadie'}.`
  }

  private drawDevil(state: GameState): void {
    const veil = new Graphics()
    veil.rect(0, 0, DESIGN_W, DESIGN_H).fill({ color: 0x070203, alpha: 0.94 })
    veil.eventMode = 'static'
    const panel = new Graphics()
    fillRound(panel, 36, 20, 1208, 760, 22, 0x14060a, 0.98)
    strokeRound(panel, 36, 20, 1208, 760, 22, palette.wine, 2)
    const title = makeText('666', { size: 92, font: 'serif', color: 0xf2d2a2, weight: '700', letterSpacing: 8 })
    title.anchor.set(0.5, 0)
    title.position.set(DESIGN_W / 2, 52)
    const line = makeText('El Diablo despierta.', { size: 32, font: 'serif', color: palette.cream })
    line.anchor.set(0.5, 0)
    line.position.set(DESIGN_W / 2, 156)
    const diceRow = new Container()
    state.dice.forEach((die, index) => {
      const face = new DieFace(86)
      face.show(die.value, true, false)
      face.view.position.set(index * 108, 0)
      diceRow.addChild(face.view)
    })
    const rowWidth = Math.max(state.dice.length - 1, 0) * 108 + 86
    diceRow.position.set((DESIGN_W - rowWidth) / 2, 214)
    const losses = state.players
      .filter((player) => player.inside)
      .map((player) => {
        const lost = state.lostThisIncursion[player.id] ?? []
        if (lost.length === 0) return `${player.name} estaba dentro y no tenía botín expuesto.`
        return `${player.name} pierde ${lost.map((bottle) => bottle.cepa).join(', ')}.`
      })
    const outside = state.players.filter((player) => !player.inside).map((player) => player.name)
    if (outside.length > 0) losses.push(`Ya estaban fuera y conservan lo suyo: ${joinNames(outside)}.`)
    if (state.stainedThisIncursion.length > 0) {
      losses.push('Es la última incursión: quienes seguían dentro quedan manchados y no pueden ganar.')
    }
    const body = makeText(losses.join('\n'), { size: 18, color: palette.cream, align: 'center', wrap: 760 })
    body.anchor.set(0.5, 0)
    body.position.set(DESIGN_W / 2, 390)
    const button = makeButton('Ver el cierre', 280, () => {
      if (!this.api.state) return
      this.api.commit(acknowledgeDevil(this.api.state))
    })
    button.position.set((DESIGN_W - 280) / 2, 680)
    veil.alpha = 0
    title.scale.set(0.7)
    this.animated.push(veil, title.scale)
    if (!reducedMotion) {
      gsap.to(veil, { alpha: 1, duration: 0.35 })
      gsap.to(title.scale, { x: 1, y: 1, duration: 0.5, ease: 'back.out(1.7)' })
    } else {
      veil.alpha = 1
      title.scale.set(1)
    }
    this.chrome.addChild(veil, panel, title, line, diceRow, body, button)
  }

  private modal(width: number, height: number): Container {
    const veil = new Graphics()
    veil.rect(0, 0, DESIGN_W, DESIGN_H).fill({ color: palette.black, alpha: 0.84 })
    veil.eventMode = 'static'
    const card = new Container()
    const g = new Graphics()
    fillRound(g, 0, 0, width, height, 18, 0x14090c, 0.98)
    strokeRound(g, 0, 0, width, height, 18, palette.gold, 1.5, 0.85)
    card.addChild(g)
    card.position.set((DESIGN_W - width) / 2, (DESIGN_H - height) / 2)
    this.chrome.addChild(veil, card)
    return card
  }

  private voters(state: GameState): PlayerState[] {
    const list: PlayerState[] = []
    const count = state.players.length
    for (let step = 0; step < count; step += 1) {
      const player = state.players[(state.activePlayerId + step) % count]
      if (player?.inside) list.push(player)
    }
    return list
  }
}
