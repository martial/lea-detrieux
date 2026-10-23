// Phones: the fixed call bar steps aside while the page's own call buttons are on
// screen (in the hero, and from the contact footer to the end of the page), so the
// first screen shows one call button, not three, and the bar never covers the footer.
// The bar is hidden until this says otherwise (.js .callbar:not(.is-up), mobile.css);
// without JavaScript it simply stays, and the footer keeps room for it.

export function initCallbar() {
  const bar = document.querySelector<HTMLElement>('.callbar')
  if (!bar) return
  const hero = document.querySelector('.hero .actions')
  const footer = document.querySelector('.contact .actions')
  if (!hero || !footer) {
    bar.classList.add('is-up')
    return
  }

  let heroSeen = false
  let footerReached = false
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.target === hero) heroSeen = e.isIntersecting
      // once its buttons are on screen, the footer keeps the bar away down to the end
      else footerReached = e.isIntersecting || e.boundingClientRect.top < 0
    }
    bar.classList.toggle('is-up', !heroSeen && !footerReached)
  })
  io.observe(hero)
  io.observe(footer)
}
