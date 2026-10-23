import '@fontsource/playfair-display/latin-400.css'
import '@fontsource/playfair-display/latin-400-italic.css'
import '@fontsource/playfair-display/latin-500.css'
import '@fontsource/playfair-display/latin-600.css'
import '@fontsource/hind/latin-400.css'
import '@fontsource/hind/latin-500.css'
import '@fontsource/hind/latin-600.css'
import './styles/tokens.css'
import './styles/base.css'
import './styles/sections.css'

import { initSpeciesPicker } from './components/species-picker'
import { initZoneCheck } from './components/zone-check'
import { setAnimal, setCommune } from './components/contact'
import { playIntro } from './components/intro'

playIntro()
initSpeciesPicker((panel) => setAnimal(panel.dataset.sms ?? null))
initZoneCheck(setCommune)
