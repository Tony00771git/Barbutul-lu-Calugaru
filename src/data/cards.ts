export interface GameCardDef {
  id: string;
  titleRo: string;
  titleEn: string;
  effectRo: string;
  effectEn: string;
  type: 'good' | 'bad';
  kind: 'mystery' | 'risk';
  execute: () => {
    sips?: number;
    chug?: boolean;
    goldDelta?: number;
    pardonLetterDelta?: number;
    jailKeyDelta?: number;
    goToSlot?: boolean;
    goToJail?: boolean;
    everyoneElseSips?: number;
    pickSomeoneSips?: number;
  };
}

export const mysteryCards: GameCardDef[] = [
  {
    id: 'm1',
    titleRo: 'Comoară regală',
    titleEn: 'Royal Treasure',
    effectRo: 'Primești +10 galbeni de la rege!',
    effectEn: 'Receive +10 gold from the king!',
    type: 'good',
    kind: 'mystery',
    execute: () => ({ goldDelta: 10 }),
  },
  {
    id: 'm2',
    titleRo: 'Pungă cu galbeni',
    titleEn: 'Bag of Gold',
    effectRo: 'Găsești o pungă cu +6 galbeni!',
    effectEn: 'Found a bag with +6 gold!',
    type: 'good',
    kind: 'mystery',
    execute: () => ({ goldDelta: 6 }),
  },
  {
    id: 'm3',
    titleRo: 'Tribut',
    titleEn: 'Tribute',
    effectRo: 'Primești +8 galbeni din tributul mănăstirii!',
    effectEn: 'Receive +8 gold from monastery tribute!',
    type: 'good',
    kind: 'mystery',
    execute: () => ({ goldDelta: 8 }),
  },
  {
    id: 'm4',
    titleRo: 'Toast!',
    titleEn: 'Toast!',
    effectRo: 'Toți ceilalți jucători beau 2 guri fiecare!',
    effectEn: 'Everyone else drinks 2 sips each!',
    type: 'good',
    kind: 'mystery',
    execute: () => ({ everyoneElseSips: 2 }),
  },
  {
    id: 'm5',
    titleRo: 'La SLOT!',
    titleEn: 'To the SLOT!',
    effectRo: 'Te duci imediat la SLOT și rotești moaștele!',
    effectEn: 'Move directly to the SLOT and spin!',
    type: 'good',
    kind: 'mystery',
    execute: () => ({ goToSlot: true }),
  },
  {
    id: 'm6',
    titleRo: 'Scrisoare de iertare',
    titleEn: 'Pardon Letter',
    effectRo: 'Primești o Scrisoare de Iertare 🎟️!',
    effectEn: 'Receive a Pardon Letter 🎟️!',
    type: 'good',
    kind: 'mystery',
    execute: () => ({ pardonLetterDelta: 1 }),
  },
  {
    id: 'm7',
    titleRo: 'Două Scrisori de iertare',
    titleEn: 'Pardon Letter (x2)',
    effectRo: 'Primești o altă Scrisoare de Iertare 🎟️!',
    effectEn: 'Receive another Pardon Letter 🎟️!',
    type: 'good',
    kind: 'mystery',
    execute: () => ({ pardonLetterDelta: 1 }),
  },
  {
    id: 'm8',
    titleRo: 'BLESTEM',
    titleEn: 'CURSE',
    effectRo: 'GROAPĂ! Bei tot paharul!',
    effectEn: 'CHUG IT ALL! Drink full glass!',
    type: 'bad',
    kind: 'mystery',
    execute: () => ({ chug: true, sips: 25 }),
  },
  {
    id: 'm9',
    titleRo: 'Damf de bere',
    titleEn: 'Whiff of Beer',
    effectRo: 'Bei 5 guri de bere mănăstirească.',
    effectEn: 'Drink 5 sips of monastery beer.',
    type: 'bad',
    kind: 'mystery',
    execute: () => ({ sips: 5 }),
  },
  {
    id: 'm10',
    titleRo: 'Hoțul',
    titleEn: 'The Thief',
    effectRo: 'Un hoț îți fură -8 galbeni!',
    effectEn: 'A thief steals -8 gold from you!',
    type: 'bad',
    kind: 'mystery',
    execute: () => ({ goldDelta: -8 }),
  },
];

export const riskCards: GameCardDef[] = [
  {
    id: 'r1',
    titleRo: 'OSÂNDĂ',
    titleEn: 'DAMNATION',
    effectRo: 'OSÂNDĂ! CHUG IT ALL - bei tot paharul!',
    effectEn: 'DAMNATION! CHUG IT ALL - drink full glass!',
    type: 'bad',
    kind: 'risk',
    execute: () => ({ chug: true, sips: 25 }),
  },
  {
    id: 'r2',
    titleRo: 'Sete blestemată',
    titleEn: 'Cursed Thirst',
    effectRo: 'Bei 4 guri.',
    effectEn: 'Drink 4 sips.',
    type: 'bad',
    kind: 'risk',
    execute: () => ({ sips: 4 }),
  },
  {
    id: 'r3',
    titleRo: 'Butoiul spart',
    titleEn: 'Broken Barrel',
    effectRo: 'Bei 6 guri.',
    effectEn: 'Drink 6 sips.',
    type: 'bad',
    kind: 'risk',
    execute: () => ({ sips: 6 }),
  },
  {
    id: 'r4',
    titleRo: 'Tâlharul',
    titleEn: 'The Robber',
    effectRo: 'Pierzi -10 galbeni!',
    effectEn: 'Lose -10 gold!',
    type: 'bad',
    kind: 'risk',
    execute: () => ({ goldDelta: -10 }),
  },
  {
    id: 'r5',
    titleRo: 'Bir nedrept',
    titleEn: 'Unfair Toll',
    effectRo: 'Plătești -6 galbeni bir mănăstiresc.',
    effectEn: 'Pay -6 gold monastery toll.',
    type: 'bad',
    kind: 'risk',
    execute: () => ({ goldDelta: -6 }),
  },
  {
    id: 'r6',
    titleRo: 'Aruncat în temniță',
    titleEn: 'Thrown in the Dungeon',
    effectRo: 'Mergi direct la închisoare pentru 3 ture!',
    effectEn: 'Go straight to jail for 3 turns!',
    type: 'bad',
    kind: 'risk',
    execute: () => ({ goToJail: true }),
  },
  {
    id: 'r7',
    titleRo: 'Mahmureală',
    titleEn: 'Hangover',
    effectRo: 'Bei 3 guri ȘI pierzi -4 galbeni!',
    effectEn: 'Drink 3 sips AND lose -4 gold!',
    type: 'bad',
    kind: 'risk',
    execute: () => ({ sips: 3, goldDelta: -4 }),
  },
  {
    id: 'r8',
    titleRo: 'Cheia temniței',
    titleEn: 'Jail Key',
    effectRo: 'Găsești o Cheie de Temniță 🔓!',
    effectEn: 'Found a Jail Key 🔓!',
    type: 'good',
    kind: 'risk',
    execute: () => ({ jailKeyDelta: 1 }),
  },
  {
    id: 'r9',
    titleRo: 'Scrisoare de iertare',
    titleEn: 'Pardon Letter',
    effectRo: 'Primești o Scrisoare de Iertare 🎟️!',
    effectEn: 'Receive a Pardon Letter 🎟️!',
    type: 'good',
    kind: 'risk',
    execute: () => ({ pardonLetterDelta: 1 }),
  },
  {
    id: 'r10',
    titleRo: 'Pedeapsă dată',
    titleEn: 'Sentence Given',
    effectRo: 'Alegi un jucător care bea 5 guri!',
    effectEn: 'Choose a player to drink 5 sips!',
    type: 'good',
    kind: 'risk',
    execute: () => ({ pickSomeoneSips: 5 }),
  },
];
