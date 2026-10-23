// Motion that needs JavaScript: things revealed when they come into view (the map,
// the session line), the trip drawn to the visitor's town, and pausing the hero's
// slow blob morph. The hero arrival itself is pure CSS (styles/motion.css).

export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches

const ease = 'cubic-bezier(0.22, 1, 0.36, 1)'
const SVG = 'http://www.w3.org/2000/svg'

function whenSeen(el: Element, play: () => void, threshold = 0.3) {
  const io = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return
    io.disconnect()
    play()
  }, { threshold, rootMargin: '0px 0px -8% 0px' })
  io.observe(el)
}

function homeOf(map: SVGSVGElement) {
  const home = map.querySelector<SVGCircleElement>('.home')!
  return { home, x: Number(home.getAttribute('cx')), y: Number(home.getAttribute('cy')) }
}

function ripple(map: SVGSVGElement, x: number, y: number, delay = 0) {
  const ring = document.createElementNS(SVG, 'circle')
  ring.setAttribute('class', 'ripple')
  ring.setAttribute('cx', String(x))
  ring.setAttribute('cy', String(y))
  ring.setAttribute('r', '7')
  map.querySelector('.labels')?.before(ring)
  ring.animate(
    [{ transform: 'scale(1)', opacity: 0.6 }, { transform: 'scale(8)', opacity: 0 }],
    { duration: 1600, delay, easing: 'cubic-bezier(0.2, 0.6, 0.3, 1)', fill: 'backwards' },
  ).finished.then(() => ring.remove(), () => ring.remove())
}

// The map spreads out from Langon: the home dot lands, the zone grows from it,
// the communes appear in a ripple by distance, and the Garonne flows down to Bordeaux.
function revealMap(map: SVGSVGElement) {
  const { home, x, y } = homeOf(map)
  const area = map.querySelector<SVGPathElement>('.area')!
  const river = map.querySelector<SVGPathElement>('.river')!
  const dots = [...map.querySelectorAll<SVGCircleElement>('.dots circle')]
  const labels = [...map.querySelectorAll<SVGTextElement>('.labels text')]
  map.classList.add('is-waiting')

  whenSeen(map, () => {
    map.classList.remove('is-waiting')
    home.style.transformBox = 'fill-box'
    home.style.transformOrigin = 'center'
    home.animate([{ transform: 'scale(0)' }, { transform: 'scale(1)' }], { duration: 900, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)', fill: 'backwards' })
    ripple(map, x, y, 150)
    ripple(map, x, y, 650)

    area.style.transformBox = 'view-box'
    area.style.transformOrigin = `${x}px ${y}px`
    area.animate([{ transform: 'scale(0.12)', opacity: 0 }, { transform: 'scale(1)' }], { duration: 1700, delay: 100, easing: ease, fill: 'backwards' })

    const far = Math.max(...dots.map((d) => Math.hypot(+d.getAttribute('cx')! - x, +d.getAttribute('cy')! - y)))
    for (const d of dots) {
      const dist = Math.hypot(+d.getAttribute('cx')! - x, +d.getAttribute('cy')! - y) / far
      d.style.transformBox = 'fill-box'
      d.style.transformOrigin = 'center'
      d.animate([{ transform: 'scale(0)', opacity: 0 }, { transform: 'scale(1)' }], {
        duration: 500, delay: 250 + dist * 1300, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)', fill: 'backwards',
      })
    }

    river.style.strokeDasharray = '1'
    river.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], {
      duration: 2600, delay: 350, easing: 'cubic-bezier(0.45, 0, 0.25, 1)', fill: 'backwards',
    }).finished.then(() => river.style.removeProperty('stroke-dasharray'), () => {})

    labels.forEach((l, i) => l.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 700, delay: 1300 + i * 70, easing: ease, fill: 'backwards' }))
  })
}

// A trip from Langon to the visitor's town, drawn as a gentle curve, then a ripple there.
export function drawTrip(map: SVGSVGElement | null, code: string | null) {
  if (!map) return
  map.querySelectorAll('.trip').forEach((el) => el.remove())
  if (!code) return
  const dot = map.querySelector<SVGCircleElement>(`circle[data-c="${code}"]`)
  if (!dot) return
  const { x, y } = homeOf(map)
  const tx = Number(dot.getAttribute('cx')), ty = Number(dot.getAttribute('cy'))
  const len = Math.hypot(tx - x, ty - y)
  if (len < 4) {
    ripple(map, tx, ty)
    return
  }
  // control point to the side of the straight line: a road, not a ruler
  const cx = (x + tx) / 2 - (ty - y) * 0.22, cy = (y + ty) / 2 + (tx - x) * 0.22
  const trip = document.createElementNS(SVG, 'path')
  trip.setAttribute('class', 'trip')
  trip.setAttribute('d', `M${x} ${y}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${tx} ${ty}`)
  map.querySelector('.labels')?.before(trip)
  if (reducedMotion()) return
  trip.setAttribute('pathLength', '1')
  trip.style.strokeDasharray = '1'
  const duration = Math.min(1100, 350 + len * 3)
  trip.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration, easing: 'cubic-bezier(0.45, 0, 0.25, 1)', fill: 'backwards' })
    .finished.then(() => {
      trip.removeAttribute('pathLength')
      trip.style.removeProperty('stroke-dasharray')
      ripple(map, tx, ty)
    }, () => {})
}

// The rose stroke under the picker words squashes as it travels, like a brush.
export function swipe(ink: HTMLElement, dir: number) {
  if (reducedMotion()) return
  ink.animate(
    [{ scale: '1 1' }, { scale: `${1.12} 0.72`, rotate: `${-4 - 5 * dir}deg`, offset: 0.35 }, { scale: '1 1' }],
    { duration: 700, easing: 'ease-in-out' },
  )
}

// A new animal: its photo wipes in from the side we travel to, the lines follow.
export function enterPanel(panel: HTMLElement, dir: number) {
  if (reducedMotion()) return
  const frame = panel.querySelector<HTMLElement>('.panel-photo picture, .panel-photo [data-missing-photo]')
  const img = panel.querySelector<HTMLElement>('.panel-photo img')
  const r = 'round 20px'
  frame?.animate(
    [{ clipPath: dir > 0 ? `inset(0 0 0 100% ${r})` : `inset(0 100% 0 0 ${r})` }, { clipPath: `inset(0 0 0 0 ${r})` }],
    { duration: 750, easing: ease },
  )
  img?.animate([{ scale: 1.14 }, { scale: 1 }], { duration: 1100, easing: ease })
  panel.querySelectorAll<HTMLElement>('h3, .panel-when, .reasons li, .prices li, figcaption').forEach((el, i) =>
    el.animate([{ opacity: 0, translate: `${18 * dir}px 0` }, { opacity: 1, translate: '0 0' }], {
      duration: 550, delay: 80 + i * 45, easing: ease, fill: 'backwards',
    }),
  )
}

export function initMotion() {
  if (reducedMotion()) {
    // SMIL ignores the media query: stop the blob morph by hand
    document.querySelectorAll<SVGSVGElement>('svg.hero-blob').forEach((svg) => svg.pauseAnimations())
    return
  }
  const map = document.querySelector<SVGSVGElement>('.zone-map')
  if (map) revealMap(map)
  const steps = document.querySelector<HTMLElement>('.steps')
  if (steps && matchMedia('(max-width: 719px)').matches) {
    // Phones stack the steps (styles/mobile.css): each number lands with its own step
    for (const step of steps.children) {
      step.classList.add('is-waiting')
      whenSeen(step, () => step.classList.remove('is-waiting'), 0.5)
    }
  } else if (steps) {
    steps.classList.add('is-waiting')
    whenSeen(steps, () => steps.classList.remove('is-waiting'), 0.4)
  }
}
