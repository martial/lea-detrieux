// The page's one orchestrated moment: Léa's mark draws itself in the seal
// (stems rise, the arc sweeps, the vertebrae appear one by one) while the rose
// blob settles behind her photo. Skipped when the visitor prefers less motion.

export function playIntro() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const seal = document.querySelector<SVGSVGElement>('.seal')
  const mark = seal?.querySelector<SVGUseElement>('.seal-mark')
  const blob = document.querySelector<HTMLElement>('.hero-blob')
  if (!seal || !mark || !blob || typeof mark.animate !== 'function') return

  const ease = 'cubic-bezier(0.22, 1, 0.36, 1)'
  const grow = (sel: string, from: string, origin: string, delay: number, duration: number) =>
    [...seal.querySelectorAll<SVGElement>(sel)].map((el, i) => {
      el.style.transformBox = 'fill-box'
      el.style.transformOrigin = origin
      return el.animate([{ transform: from }, { transform: 'none' }], {
        duration, delay: delay + i * 110, easing: ease, fill: 'backwards',
      })
    })

  mark.setAttribute('mask', 'url(#seal-draw)')
  const parts = [
    ...grow('.d-stems', 'scaleY(0)', 'center bottom', 350, 700),
    ...grow('.d-arc', 'scaleX(0)', 'left center', 750, 500),
    ...grow('.d-top', 'scaleX(0)', 'left center', 1000, 300),
    ...grow('.d-bead', 'scale(0)', 'center', 1150, 420),
  ]
  blob.animate(
    [{ transform: 'rotate(-16deg) scale(0.86)', opacity: 0 }, { transform: 'rotate(-7deg) scale(1)', opacity: 1 }],
    { duration: 1400, easing: ease },
  )
  Promise.all(parts.map((a) => a.finished)).finally(() => mark.removeAttribute('mask'))
}
