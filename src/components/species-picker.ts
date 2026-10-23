// The five animal names work as tabs (WAI-ARIA tabs pattern, automatic activation).
// The URL hash (#chat…) opens an animal directly.

export function initSpeciesPicker(onChange: (panel: HTMLElement) => void) {
  const list = document.querySelector<HTMLElement>('.picker-tabs')
  if (!list) return
  list.hidden = false
  const tabs = [...list.querySelectorAll<HTMLButtonElement>('[role="tab"]')]
  const panelOf = (tab: HTMLButtonElement) => document.getElementById(tab.getAttribute('aria-controls')!)!

  function select(tab: HTMLButtonElement, { focus = false, animate = true, notify = true } = {}) {
    for (const t of tabs) {
      const on = t === tab
      t.setAttribute('aria-selected', String(on))
      t.tabIndex = on ? 0 : -1
      const panel = panelOf(t)
      panel.classList.toggle('is-active', on)
      if (on && animate) {
        panel.classList.remove('is-entering')
        void panel.offsetWidth // restart the fade
        panel.classList.add('is-entering')
      }
    }
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
    panelOf(tab).blur() // the browser focuses the #fragment target; no frame around it
    document.getElementById('tarifs')?.scrollIntoView()
  }

  window.addEventListener('hashchange', fromHash)
  // The first animal shows by default, but only a visitor's choice fills the SMS
  select(tabs[0], { animate: false, notify: false })
  fromHash()
}
