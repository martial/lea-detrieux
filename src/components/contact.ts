// The SMS links pre-fill a message with what the visitor chose on the page:
// « Bonjour Léa, je voudrais un rendez-vous pour mon chien, à Bazas. »

import { site } from '../data/site'

const context: { animal: string | null; commune: string | null } = { animal: null, commune: null }

function body() {
  let text = 'Bonjour Léa, je voudrais un rendez-vous'
  if (context.animal) text += ` pour ${context.animal}`
  if (context.commune) text += `, à ${context.commune}`
  return text + '.'
}

function update() {
  const href = `sms:${site.phoneHref}?&body=${encodeURIComponent(body())}`
  document.querySelectorAll<HTMLAnchorElement>('a[data-sms]').forEach((a) => (a.href = href))
}

export function setAnimal(animal: string | null) {
  context.animal = animal
  update()
}

export function setCommune(commune: string | null) {
  context.commune = commune
  update()
}
