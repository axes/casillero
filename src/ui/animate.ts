import gsap from 'gsap'

export const reducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function tween(target: gsap.TweenTarget, vars: gsap.TweenVars): Promise<void> {
  const duration = reducedMotion ? 0 : vars.duration
  return new Promise((resolve) => {
    gsap.to(target, {
      ...vars,
      duration,
      onComplete: () => resolve(),
      onInterrupt: () => resolve(),
    })
  })
}

export function wait(seconds: number): Promise<void> {
  if (reducedMotion || seconds <= 0) return Promise.resolve()
  return new Promise((resolve) => {
    gsap.delayedCall(seconds, () => resolve())
  })
}
