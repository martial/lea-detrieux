// The five animal names work as tabs (WAI-ARIA tabs pattern, automatic activation).
// The URL hash (#chat…) opens an animal directly. One rose stroke travels from word
// to word, and the new animal's panel wipes in from the side we move towards.

import { enterPanel, swipe } from './motion'

export function initSpeciesPicker(onChange: (panel: HTMLElement) => void) {
  const list = document.querySelector<HTMLElement>('.picker-tabs')
  if (!list) return
  list.hidden = false
  const tabs = [...list.querySelectorAll<HTMLButtonElement>('[role="tab"]')]
  const panelOf = (tab: HTMLButtonElement) => document.getElementById(tab.getAttribute('aria-controls')!)!

  const ink = document.createElement('span')
  ink.className = 'picker-ink'
  ink.setAttribute('aria-hidden', 'true')
  list.prepend(ink)
  list.classList.add('has-ink')
  let current = tabs[0]

  function placeInk(tab: HTMLButtonElement, animate: boolean) {
    ink.style.transition = animate ? '' : 'none'
    ink.style.translate = `${tab.offsetLeft - tab.offsetWidth * 0.1}px ${tab.offsetTop + tab.offsetHeight * 0.12}px`
    ink.style.width = `${tab.offsetWidth * 1.2}px`
    ink.style.height = `${tab.offsetHeight * 0.88}px`
    if (!animate) void ink.offsetWidth // apply the jump before transitions come back
  }

  function select(tab: HTMLButtonElement, { focus = false, animate = true, notify = true } = {}) {
    const dir = Math.sign(tabs.indexOf(tab) - tabs.indexOf(current)) || 1
    for (const t of tabs) {
      const on = t === tab
      t.setAttribute('aria-selected', String(on))
      t.tabIndex = on ? 0 : -1
      panelOf(t).classList.toggle('is-active', on)
    }
    placeInk(tab, animate)
    if (animate && tab !== current) {
      swipe(ink, dir)
      enterPanel(panelOf(tab), dir)
    }
    current = tab
    if (focus) tab.focus()
    if (notify) onChange(panelOf(tab))
  }

  list.addEventListener('click', (e) => {
    const tab = (e.target as HTMLElement).closest<HTMLButtonElement>('[role="tab"]')
    if (!tab) return
    select(tab)
    history.replaceState(null, '', `#${tab.getAttribute('aria-controls')}`)
  })

  list.addEventListener('keydown', (e) => {
    const i = tabs.indexOf(document.activeElement as HTMLButtonElement)
    if (i < 0) return
    const next = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: tabs.length - 1 }[e.key]
    if (next === undefined) return
    e.preventDefault()
    const tab = tabs[(next + tabs.length) % tabs.length]
    select(tab, { focus: true })
    history.replaceState(null, '', `#${tab.getAttribute('aria-controls')}`)
  })

  function fromHash() {
    const tab = tabs.find((t) => `#${t.getAttribute('aria-controls')}` === location.hash)
    if (!tab) return
    select(tab, { animate: false })
    document.getElementById('tarifs')?.scrollIntoView()
  }

  // Words reflow when the fonts arrive or the window changes: keep the stroke under its word
  new ResizeObserver(() => placeInk(current, false)).observe(list)
  void document.fonts.ready.then(() => placeInk(current, false))

  window.addEventListener('hashchange', fromHash)
  // The first animal shows by default, but only a visitor's choice fills the SMS
  select(tabs[0], { animate: false, notify: false })
  fromHash()
}
