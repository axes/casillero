export type VolumeStep = 'alto' | 'bajo' | 'mudo'

const VOLUME: Record<VolumeStep, number> = { alto: 0.8, bajo: 0.32, mudo: 0 }

/**
 * Ambiente procedural con Web Audio. No usa samples.
 * 0 bodega quieta, 1 bichos y crujidos, 2 susurros y latido, 3 clímax.
 */
export class CellarAmbience {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private bed: AudioBufferSourceNode | null = null
  private whisper: AudioBufferSourceNode | null = null
  private whisperGain: GainNode | null = null
  private drone: OscillatorNode[] = []
  private timer: ReturnType<typeof setInterval> | null = null
  private heart: ReturnType<typeof setInterval> | null = null
  private level = 0
  private step: VolumeStep = 'alto'

  unlock(): void {
    const ctx = this.context()
    if (ctx.state === 'suspended') void ctx.resume()
  }

  destroy(): void {
    this.stopLoops()
    void this.ctx?.close()
    this.ctx = null
  }

  setLevel(level: number): void {
    this.level = Math.max(0, Math.min(3, Math.round(level)))
    this.applyLayers()
  }

  cycleVolume(): VolumeStep {
    this.step = this.step === 'alto' ? 'bajo' : this.step === 'bajo' ? 'mudo' : 'alto'
    this.applyMaster()
    return this.step
  }

  label(): string {
    if (this.step === 'mudo') return 'Mudo'
    if (this.step === 'bajo') return 'Bajo'
    return 'Sonido'
  }

  private context(): AudioContext {
    if (this.ctx) return this.ctx
    const ctx = new AudioContext()
    const master = ctx.createGain()
    master.gain.value = VOLUME[this.step]
    master.connect(ctx.destination)
    this.ctx = ctx
    this.master = master
    this.applyLayers()
    return ctx
  }

  private applyMaster(): void {
    if (!this.master || !this.ctx) return
    this.master.gain.setTargetAtTime(VOLUME[this.step], this.ctx.currentTime, 0.05)
  }

  private stopLoops(): void {
    if (this.timer) clearInterval(this.timer)
    if (this.heart) clearInterval(this.heart)
    this.timer = null
    this.heart = null
    this.bed?.stop()
    this.whisper?.stop()
    for (const osc of this.drone) osc.stop()
    this.bed = null
    this.whisper = null
    this.whisperGain = null
    this.drone = []
  }

  private applyLayers(): void {
    if (!this.ctx || !this.master) return
    this.stopLoops()
    const ctx = this.ctx
    const master = this.master

    const bedGain = ctx.createGain()
    bedGain.gain.value = [0.03, 0.045, 0.055, 0.07][this.level] ?? 0.03
    const lowpass = ctx.createBiquadFilter()
    lowpass.type = 'lowpass'
    lowpass.frequency.value = 380
    bedGain.connect(lowpass)
    lowpass.connect(master)
    this.bed = this.loop(noiseBuffer(ctx, 2, 'brown'), bedGain)

    this.whisperGain = ctx.createGain()
    this.whisperGain.gain.value = this.level >= 2 ? (this.level === 3 ? 0.05 : 0.028) : 0
    const band = ctx.createBiquadFilter()
    band.type = 'bandpass'
    band.frequency.value = 1400
    band.Q.value = 0.7
    this.whisperGain.connect(band)
    band.connect(master)
    this.whisper = this.loop(noiseBuffer(ctx, 2, 'white'), this.whisperGain)

    if (this.level >= 3) {
      for (const freq of [73, 110]) {
        const osc = ctx.createOscillator()
        osc.type = 'sine'
        osc.frequency.value = freq
        const gain = ctx.createGain()
        gain.gain.value = 0.03
        osc.connect(gain)
        gain.connect(master)
        osc.start()
        this.drone.push(osc)
      }
    }

    this.timer = setInterval(() => this.tick(), 680)
    if (this.level >= 2) {
      const gap = this.level === 3 ? 620 : 1080
      this.heart = setInterval(() => this.thump(), gap)
    }
  }

  private loop(buffer: AudioBuffer, target: AudioNode): AudioBufferSourceNode {
    const source = this.ctx!.createBufferSource()
    source.buffer = buffer
    source.loop = true
    source.connect(target)
    source.start()
    return source
  }

  private tick(): void {
    if (!this.ctx || this.step === 'mudo') return
    const roll = Math.random()
    if (this.level >= 1 && roll < [0, 0.4, 0.75, 0.9][this.level]!) this.scurry()
    if (roll > 0.72 && roll < 0.72 + [0.04, 0.16, 0.28, 0.4][this.level]!) this.creak()
  }

  private scurry(): void {
    const ctx = this.ctx
    const master = this.master
    if (!ctx || !master) return
    const source = ctx.createBufferSource()
    source.buffer = noiseBuffer(ctx, 0.18, 'white')
    const filter = ctx.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = 1800 + Math.random() * 2000
    const gain = ctx.createGain()
    const now = ctx.currentTime
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16)
    const pan = ctx.createStereoPanner()
    pan.pan.value = Math.random() * 2 - 1
    source.connect(filter)
    filter.connect(gain)
    gain.connect(pan)
    pan.connect(master)
    source.start()
    source.stop(now + 0.2)
  }

  private creak(): void {
    const ctx = this.ctx
    const master = this.master
    if (!ctx || !master) return
    const osc = ctx.createOscillator()
    osc.type = 'triangle'
    const now = ctx.currentTime
    osc.frequency.setValueAtTime(180 + Math.random() * 80, now)
    osc.frequency.exponentialRampToValueAtTime(60 + Math.random() * 30, now + 0.45)
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.04, now + 0.08)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5)
    osc.connect(gain)
    gain.connect(master)
    osc.start()
    osc.stop(now + 0.55)
  }

  private thump(): void {
    const ctx = this.ctx
    const master = this.master
    if (!ctx || !master || this.level < 2) return
    const now = ctx.currentTime
    for (const [delay, freq, peak] of [
      [0, 58, this.level === 3 ? 0.16 : 0.09],
      [0.16, 46, this.level === 3 ? 0.1 : 0.05],
    ] as const) {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now + delay)
      osc.frequency.exponentialRampToValueAtTime(32, now + delay + 0.12)
      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0.0001, now + delay)
      gain.gain.exponentialRampToValueAtTime(peak, now + delay + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.18)
      osc.connect(gain)
      gain.connect(master)
      osc.start(now + delay)
      osc.stop(now + delay + 0.2)
    }
  }
}

function noiseBuffer(ctx: AudioContext, seconds: number, color: 'brown' | 'white'): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * seconds)
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  let last = 0
  for (let index = 0; index < length; index += 1) {
    const white = Math.random() * 2 - 1
    if (color === 'white') data[index] = white * 0.6
    else {
      last = (last + 0.02 * white) / 1.02
      data[index] = last * 3.2
    }
  }
  return buffer
}
