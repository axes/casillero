import { Container } from 'pixi.js'
import { gameConfig } from '../config'
import { createGame } from '../engine'
import type { Screen, TableApi } from './api'
import { DESIGN_W } from './theme'
import { palette } from './theme'
import { drawBackdrop, fillRound, makeButton, makeText, strokeRound, TextField } from './widgets'
import { Graphics } from 'pixi.js'

const DEFAULTS = ['Rosa', 'Mateo', 'Camila', 'Diego', 'Isidora', 'Benjamín']

export class SetupScreen implements Screen {
  private readonly fields: TextField[] = []
  private readonly seedField: TextField
  private focused: TextField | null = null
  private hint: ReturnType<typeof makeText>
  private countLabel: ReturnType<typeof makeText>
  private form = new Container()

  constructor(
    private readonly api: TableApi,
    private readonly layer: Container,
  ) {
    if (api.names.length < gameConfig.playersMax) {
      api.names = [...api.names, ...DEFAULTS].slice(0, gameConfig.playersMax)
    }
    drawBackdrop(layer)
    const title = makeText('CASILLERO', {
      size: 68,
      font: 'serif',
      weight: '700',
      color: palette.gold,
      letterSpacing: 6,
    })
    title.anchor.set(0.5, 0)
    title.position.set(DESIGN_W / 2, 36)
    const subtitle = makeText('Entran juntos, roban vino y salen antes del 666.', {
      size: 20,
      color: palette.cream,
      align: 'center',
    })
    subtitle.anchor.set(0.5, 0)
    subtitle.position.set(DESIGN_W / 2, 118)
    const pitch = makeText(
      'Entran con un dado. Cada 6 deja una marca; a la tercera aparece el Diablo. Las cartas de la bodega prenden o apagan el ruido. Hay que juntar 14 puntos entre todos.',
      { size: 16, color: palette.creamDim, align: 'center', wrap: 760 },
    )
    pitch.anchor.set(0.5, 0)
    pitch.position.set(DESIGN_W / 2, 156)

    this.hint = makeText('', { size: 16, color: palette.goldSoft, align: 'center', wrap: 640 })
    this.hint.anchor.set(0.5, 0)
    this.countLabel = makeText('', { size: 22, font: 'serif', color: palette.cream })
    this.seedField = new TextField({
      width: 636,
      placeholder: 'Semilla vacía: al azar',
      value: api.seedInput,
      max: 10,
      numeric: true,
    })
    this.seedField.onFocus = () => this.focus(this.seedField)
    for (let index = 0; index < gameConfig.playersMax; index += 1) {
      const field = new TextField({
        width: 300,
        placeholder: 'Nombre',
        value: api.names[index] ?? DEFAULTS[index] ?? '',
        max: 16,
      })
      field.onFocus = () => this.focus(field)
      this.fields.push(field)
    }
    this.focus(this.fields[0] ?? null)
    layer.addChild(title, subtitle, pitch, this.form)
    this.layout()
  }

  onKey(event: KeyboardEvent): void {
    if (event.key === 'Tab') {
      event.preventDefault()
      this.cycle(event.shiftKey ? -1 : 1)
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      this.start()
      return
    }
    this.focused?.handleKey(event)
  }

  destroy(): void {
    this.layer.destroy({ children: true })
  }

  private focus(field: TextField | null): void {
    this.focused = field
    for (const candidate of [...this.fields, this.seedField]) {
      candidate.setFocused(candidate === field)
    }
  }

  private cycle(direction: number): void {
    const visible = [...this.fields.slice(0, this.api.count), this.seedField]
    const index = Math.max(0, visible.indexOf(this.focused ?? visible[0]!))
    const next = visible[(index + direction + visible.length) % visible.length]
    this.focus(next ?? null)
  }

  private layout(): void {
    const keep = new Set<Container>([
      ...this.fields.map((field) => field.view),
      this.seedField.view,
      this.hint,
      this.countLabel,
    ])
    for (const child of this.form.removeChildren()) {
      if (!keep.has(child)) child.destroy({ children: true })
    }
    const rows = Math.ceil(this.api.count / 2)
    const cardX = 270
    const cardY = 228
    const cardW = 740
    const left = 322
    const fieldTop = cardY + 92
    const seedY = fieldTop + rows * 58 + 8
    const buttonY = seedY + 108
    const cardH = buttonY + 78 - cardY
    const card = new Graphics()
    fillRound(card, cardX, cardY, cardW, cardH, 18, 0x12080c, 0.92)
    strokeRound(card, cardX, cardY, cardW, cardH, 18, palette.gold, 1.5, 0.7)
    this.form.addChild(card)

    const less = makeButton('−', 54, () => this.setCount(this.api.count - 1), 'ghost')
    const more = makeButton('+', 54, () => this.setCount(this.api.count + 1), 'ghost')
    less.position.set(cardX + 28, cardY + 22)
    more.position.set(cardX + cardW - 82, cardY + 22)
    this.countLabel.text = `${this.api.count} jugadores`
    this.countLabel.anchor.set(0.5, 0)
    this.countLabel.position.set(640, cardY + 34)
    this.form.addChild(less, more, this.countLabel)

    this.fields.forEach((field, index) => {
      const column = index % 2
      const row = Math.floor(index / 2)
      field.view.position.set(left + column * 336, fieldTop + row * 58)
      field.view.visible = index < this.api.count
      this.form.addChild(field.view)
    })

    const seedLabel = makeText('Semilla', { size: 14, color: palette.creamDim, weight: '600' })
    seedLabel.position.set(left, seedY)
    this.seedField.view.position.set(left, seedY + 22)
    this.form.addChild(seedLabel, this.seedField.view)

    this.hint.position.set(640, seedY + 76)
    const start = makeButton('Bajar a la bodega', 320, () => this.start(), 'gold')
    start.position.set(480, buttonY)
    this.form.addChild(this.hint, start)
  }

  private setCount(count: number): void {
    this.api.count = Math.min(gameConfig.playersMax, Math.max(gameConfig.playersMin, count))
    this.layout()
    const visible = this.fields[this.api.count - 1]
    if (this.focused && !this.fields.slice(0, this.api.count).includes(this.focused) && this.focused !== this.seedField) {
      this.focus(visible ?? null)
    }
  }

  private start(): void {
    const names = this.fields.slice(0, this.api.count).map((field) => field.value.trim())
    if (names.some((name) => name.length === 0)) {
      this.hint.text = 'Cada quien necesita un nombre.'
      return
    }
    const typed = this.seedField.value.trim()
    const seed = typed === '' ? Math.floor(Math.random() * 0x7fffffff) : Number(typed)
    if (!Number.isFinite(seed)) {
      this.hint.text = 'La semilla tiene que ser un número.'
      return
    }
    try {
      const state = createGame(names, seed)
      this.api.names = [...names, ...DEFAULTS].slice(0, gameConfig.playersMax)
      this.api.count = names.length
      this.api.seedInput = String(state.seed)
      this.hint.text = ''
      this.api.commit(state)
    } catch (error) {
      this.hint.text = error instanceof Error ? error.message : 'No se pudo armar la mesa.'
    }
  }
}
