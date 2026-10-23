// The five animals of the picker, with their prices (Instagram post of June 2024).
// `reasons` are drafts written for the site: Léa checks them (see LEA-A-VALIDER.md).

export type Price = { label: string; price: number; note?: string }

export type Species = {
  slug: string
  word: string // the big word in the picker
  title: string
  forSms: string // « … un rendez-vous pour {forSms} »
  photo: { name: string; alt: string; credit?: string }
  reasons: string[]
  prices: Price[]
}

export const species: Species[] = [
  {
    slug: 'cheval',
    word: 'Cheval',
    title: 'Chevaux, poneys et poulains',
    forSms: 'mon cheval',
    photo: {
      name: 'cheval',
      alt: "Tête d'un cheval alezan à liste blanche, dans la lumière du soir.",
      credit: 'Pieter van Noorden',
    },
    reasons: [
      'Il manque de souplesse, se défend ou refuse sous la selle.',
      "Il travaille moins bien, ou son attitude a changé, sans que le vétérinaire trouve de cause.",
      'Après une chute, un coup, un poulinage ou un long transport.',
      'Pour le suivi d’un cheval de sport, d’un cheval âgé ou d’un poulain qui grandit.',
    ],
    prices: [
      { label: 'Cheval', price: 90 },
      { label: 'Cheval, à partir de 4 sur le même lieu', price: 85, note: 'par cheval' },
      { label: 'Poulain', price: 70 },
    ],
  },
  {
    slug: 'chien',
    word: 'Chien',
    title: 'Chiens et chiots',
    forSms: 'mon chien',
    photo: {
      name: 'chien',
      alt: 'Un épagneul breton blanc et orange, de la neige sur le museau.',
      credit: 'Anna Kimbell',
    },
    reasons: [
      'Il a du mal à se lever, à sauter dans la voiture ou à monter les escaliers.',
      'Après un accident, une chute ou une opération, avec l’accord de votre vétérinaire.',
      'Chien de chasse, de troupeau ou d’agility, ou chien qui vieillit.',
      'Il n’aime plus qu’on le touche à un endroit précis.',
    ],
    prices: [
      { label: 'Chien', price: 60 },
      { label: 'Chien, à partir de 4 sur le même lieu', price: 55, note: 'par chien' },
      { label: 'Chiot', price: 50 },
    ],
  },
  {
    slug: 'vache',
    word: 'Vache',
    title: 'Bovins et veaux',
    forSms: 'mes bovins',
    photo: {
      name: 'vache',
      alt: 'Une jeune vache fauve, une boucle à l’oreille, regarde l’objectif.',
      credit: 'Luke Stackpoole',
    },
    reasons: [
      'Après un vêlage difficile, pour la vache comme pour le veau.',
      'Elle se déplace mal après une glissade, un coup ou une contention.',
      'En complément du suivi de votre vétérinaire, sur tout le troupeau ou un seul animal.',
    ],
    prices: [
      { label: 'Bovin', price: 70 },
      { label: 'Bovin, à partir de 4 sur le même lieu', price: 65, note: 'par animal' },
      { label: 'Veau', price: 60 },
    ],
  },
  {
    slug: 'chat',
    word: 'Chat',
    title: 'Chats',
    forSms: 'mon chat',
    photo: {
      name: 'chat',
      alt: 'Un chat roux et blanc aux yeux verts, assis, regarde l’objectif.',
      credit: 'Zoë Gayah Jonker',
    },
    reasons: [
      'Après une chute, même de faible hauteur.',
      'Il saute moins haut, hésite avant de sauter ou se toilette moins.',
      'Chat âgé, ou après une opération, avec l’accord de votre vétérinaire.',
    ],
    prices: [{ label: 'Chat', price: 45 }],
  },
  {
    slug: 'poule',
    word: 'Poule',
    title: 'Poules',
    forSms: 'ma poule',
    photo: {
      name: 'poule',
      alt: 'Une poule rousse au premier plan, d’autres poules derrière elle dans la cour.',
      credit: 'Ben Moreland',
    },
    reasons: [
      'Elle boite, se tient de travers ou a reçu un choc.',
      'Oui, les poules aussi : une séance courte et tout en douceur.',
    ],
    prices: [{ label: 'Poule', price: 30 }],
  },
]
