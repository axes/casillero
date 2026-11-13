import { Container, Graphics, Rectangle, Text } from 'pixi.js'
import { palette } from './theme'

export function makeText(
  content: string,
  opts: {
    size?: number
    color?: number
    font?: 'serif' | 'sans'
    weight?: '400' | '600' | '700'
    align?: 'left' | 'center' | 'right'
    wrap?: number
    letterSpacing?: number
  } = {},
): Text {
  return new Text({
    text: content,
    style: {
      fontFamily: opts.font === 'serif' ? 'Libre Baskerville' : 'Source Sans 3',
      fontSize: opts.size ?? 18,
      fill: opts.color ?? palette.cream,
      fontWeight: opts.weight ?? '400',
      align: opts.align ?? 'left',
      wordWrap: Boolean(opts.wrap),
      wordWrapWidth: opts.wrap ?? 0,
      letterSpacing: opts.letterSpacing ?? 0,
    },
  })
}

export function fillRound(
  graphics: Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  color: number,
  alpha = 1,
): void {
  graphics.roundRect(x, y, width, height, radius).fill({ color, alpha })
}

export function strokeRound(
  graphics: Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  color: number,
  strokeWidth: number,
  alpha = 1,
): void {
  graphics.roundRect(x, y, width, height, radius).stroke({ color, width: strokeWidth, alpha })
}

export function makeButton(
  label: string,
  width: number,
  onClick: () => void,
  variant: 'gold' | 'wine' | 'ghost' = 'gold',
): Container {
  const height = 54
  const root = new Container()
  root.eventMode = 'static'
  root.cursor = 'pointer'
  root.hitArea = new Rectangle(0, 0, width, height)
  const bg = new Graphics()
  const text = makeText(label, {
    size: 18,
    weight: '600',
    color: variant === 'gold' ? palette.ink : palette.cream,
    font: 'sans',
  })
  text.anchor.set(0.5)
  text.position.set(width / 2, height / 2)
  const draw = (hover: boolean) => {
    bg.clear()
    const fill = variant === 'gold' ? (hover ? palette.goldSoft : palette.gold) : hover ? 0xa3284c : palette.wine
    fillRound(bg, 0, 0, width, height, 12, variant === 'ghost' ? (hover ? 0x2a161c : 0x16090d) : fill)
    if (variant === 'ghost' || variant === 'wine') {
      strokeRound(bg, 0, 0, width, height, 12, variant === 'wine' ? 0xd4a853 : palette.gold, 1.5)
    }
  }
  draw(false)
  root.addChild(bg, text)
  root.on('pointerover', () => draw(true))
  root.on('pointerout', () => draw(false))
  root.on('pointertap', (event) => {
    event.stopPropagation()
    onClick()
  })
  return root
}

export class TextField {
  readonly view = new Container()
  value: string
  focused = false
  onFocus: (() => void) | null = null
  private readonly box = new Graphics()
  private readonly label: Text
  private readonly width: number
  private readonly placeholder: string
  private readonly max: number
  readonly numeric: boolean

  constructor(opts: { width: number; placeholder: string; value?: string; max?: number; numeric?: boolean }) {
    this.width = opts.width
    this.placeholder = opts.placeholder
    this.value = opts.value ?? ''
    this.max = opts.max ?? 18
    this.numeric = opts.numeric ?? false
    this.label = makeText('', { size: 18, color: palette.cream })
    this.label.position.set(14, 12)
    this.view.eventMode = 'static'
    this.view.cursor = 'text'
    this.view.hitArea = new Rectangle(0, 0, opts.width, 46)
    this.view.addChild(this.box, this.label)
    this.view.on('pointertap', (event) => {
      event.stopPropagation()
      this.onFocus?.()
    })
    this.redraw()
  }

  setFocused(focused: boolean): void {
    this.focused = focused
    this.redraw()
  }

  setValue(value: string): void {
    this.value = value
    this.redraw()
  }

  handleKey(event: KeyboardEvent): boolean {
    if (!this.focused) return false
    if (event.key === 'Backspace') {
      this.value = this.value.slice(0, -1)
      this.redraw()
      event.preventDefault()
      return true
    }
    if (event.key.length !== 1 || event.metaKey || event.ctrlKey || event.altKey) return false
    if (this.numeric && !/\d/.test(event.key)) return false
    if (this.value.length >= this.max) return false
    this.value += event.key
    this.redraw()
    event.preventDefault()
    return true
  }

  private redraw(): void {
    this.box.clear()
    fillRound(this.box, 0, 0, this.width, 46, 8, 0x10080b)
    strokeRound(this.box, 0, 0, this.width, 46, 8, this.focused ? palette.gold : palette.panelEdge, this.focused ? 2 : 1)
    const empty = this.value.length === 0
    this.label.text = empty ? this.placeholder : this.value
    this.label.style.fill = empty ? 0x8c756c : palette.cream
  }
}

const PIPS: Record<number, ReadonlyArray<readonly [number, number]>> = {
  1: [[0.5, 0.5]],
  2: [
    [0.28, 0.28],
    [0.72, 0.72],
  ],
  3: [
    [0.28, 0.28],
    [0.5, 0.5],
    [0.72, 0.72],
  ],
  4: [
    [0.28, 0.28],
    [0.72, 0.28],
    [0.28, 0.72],
    [0.72, 0.72],
  ],
  5: [
    [0.28, 0.28],
    [0.72, 0.28],
    [0.5, 0.5],
    [0.28, 0.72],
    [0.72, 0.72],
  ],
  6: [
    [0.28, 0.24],
    [0.72, 0.24],
    [0.28, 0.5],
    [0.72, 0.5],
    [0.28, 0.76],
    [0.72, 0.76],
  ],
}

export class DieFace {
  readonly view = new Container()
  private readonly gfx = new Graphics()
  private readonly caption: Text

  constructor(private readonly size = 104) {
    this.caption = makeText('', { size: 13, color: palette.goldSoft, weight: '600', align: 'center' })
    this.caption.anchor.set(0.5, 0)
    this.caption.position.set(size / 2, size + 6)
    this.view.addChild(this.gfx, this.caption)
  }

  show(value: number, locked: boolean, absorbed: boolean): void {
    const g = this.gfx
    g.clear()
    const face = locked ? 0xf8e4d4 : 0xf3e6c8
    const border = locked ? palette.wine : absorbed ? palette.gold : palette.ink
    fillRound(g, 0, 0, this.size, this.size, 16, face)
    strokeRound(g, 0, 0, this.size, this.size, 16, border, locked || absorbed ? 5 : 2)
    const pip = locked ? palette.wineDeep : absorbed ? 0x8a6230 : palette.ink
    const radius = value === 1 ? 10 : 6.5
    for (const [px, py] of PIPS[value] ?? []) {
      g.circle(px * this.size, py * this.size, radius).fill({ color: pip })
    }
    this.caption.text = locked ? 'bloqueado' : absorbed ? 'vela' : value === 0 ? 'por tirar' : ''
  }
}

export function bottleToken(cepa: string, kind: 'exposed' | 'safe'): Container {
  const root = new Container()
  const g = new Graphics()
  const fill = kind === 'exposed' ? palette.wine : 0x24160c
  const stroke = kind === 'exposed' ? 0xf0c7a2 : palette.gold
  fillRound(g, 0, 0, 26, 36, 5, fill)
  strokeRound(g, 0, 0, 26, 36, 5, stroke, 1.5)
  g.circle(13, 10, 4).fill({ color: kind === 'exposed' ? palette.goldSoft : palette.gold, alpha: 0.9 })
  const letter = makeText(cepa.slice(0, 1), { size: 11, color: palette.cream, weight: '700' })
  letter.anchor.set(0.5, 0)
  letter.position.set(13, 18)
  root.addChild(g, letter)
  return root
}

export function offeringBar(current: number, threshold: number, width: number): Container {
  const root = new Container()
  const g = new Graphics()
  fillRound(g, 0, 18, width, 12, 6, 0x2a1218)
  const ratio = threshold <= 0 ? 1 : Math.max(0, Math.min(1, current / threshold))
  if (ratio > 0) {
    fillRound(g, 0, 18, Math.max(12, width * ratio), 12, 6, current >= threshold ? palette.gold : palette.wine)
  }
  const label = makeText(`Ofrenda ${current} / ${threshold}`, { size: 14, color: palette.creamDim, weight: '600' })
  root.addChild(label, g)
  return root
}

export function drawBackdrop(parent: Container): Graphics {
  const g = new Graphics()
  g.rect(0, 0, 1280, 800).fill({ color: palette.bg })
  g.circle(640, 300, 380).fill({ color: 0x6a2418, alpha: 0.28 })
  g.circle(640, 260, 160).fill({ color: 0xc47a3a, alpha: 0.08 })
  g.rect(0, 0, 1280, 70).fill({ color: palette.black, alpha: 0.35 })
  g.rect(0, 740, 1280, 60).fill({ color: palette.black, alpha: 0.4 })
  g.rect(0, 0, 28, 800).fill({ color: palette.black, alpha: 0.45 })
  g.rect(1252, 0, 28, 800).fill({ color: palette.black, alpha: 0.45 })
  parent.addChild(g)
  return g
}
