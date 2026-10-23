// Everything Léa may need to change lives in src/data/.

export const site = {
  name: 'Léa Detrieux',
  job: 'Ostéopathe animalier',
  phone: '06 29 95 84 51', // bio Instagram ; la vidéo de chien écrit « 06.39… » : à confirmer
  phoneHref: '+33629958451',
  rna: 'OA 1193',
  instagram: 'https://www.instagram.com/leadetrieux_oa/',
  url: 'https://martial.github.io/lea-detrieux/', // aperçu ; à changer avec son nom de domaine
}

export const zone = {
  base: 'Langon',
  code: '33227', // code INSEE de Langon
  centre: [-0.2422, 44.5355] as [number, number],
  radiusKm: 40, // à confirmer avec Léa
  // Named in the zone text and in the JSON-LD (areaServed); keep both in step
  towns: ['Langon', 'Bazas', 'La Réole', 'Cadillac', 'Saint-Macaire', 'Villandraut', 'Sauveterre-de-Guyenne'],
}
