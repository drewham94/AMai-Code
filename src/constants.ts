import { Accent, Language, SkillLevel, PracticeFlavor } from './types';

export const LANGUAGES: Language[] = ['French', 'Spanish'];

export const SKILL_LEVELS: SkillLevel[] = ['Novice', 'Beginner', 'Intermediate', 'Advanced', 'Expert'];

export const PRACTICE_FLAVORS: PracticeFlavor[] = ['Casual', 'Academic', 'Conversational', 'Professional', 'Creative'];

export const QUICK_CONTEXTS = [
  "Ordering at a cafe with a friend",
  "Checking into a hotel at night",
  "Asking for directions in a busy city",
  "Shopping for groceries at a local market",
  "Discussing weekend plans with a colleague"
];

export const ACCENTS: Record<Language, Accent[]> = {
  French: [
    { id: 'fr-paris', name: 'Parisian Style French', region: 'France' },
    { id: 'fr-quebec', name: 'Québécois', region: 'Canada' },
    { id: 'fr-marseille', name: 'Southern French (Marseille)', region: 'France' },
    { id: 'fr-senegal', name: 'West African French', region: 'Senegal' },
    { id: 'fr-belgium', name: 'Belgian French', region: 'Belgium' },
    { id: 'fr-switzerland', name: 'Swiss French', region: 'Switzerland' },
    { id: 'fr-ivory-coast', name: 'Ivorian French', region: 'Ivory Coast' },
    { id: 'fr-cameroon', name: 'Cameroonian French', region: 'Cameroon' },
    { id: 'fr-haiti', name: 'Haitian French', region: 'Haiti' },
    { id: 'fr-lyon', name: 'Lyonnais French', region: 'France' },
    { id: 'fr-normandy', name: 'Norman French', region: 'France' },
    { id: 'fr-brittany', name: 'Breton French', region: 'France' },
    { id: 'fr-congo', name: 'Congolese French', region: 'DRC' },
    { id: 'fr-morocco', name: 'Maghreb French', region: 'Morocco' },
    { id: 'fr-vietnam', name: 'Vietnamese French', region: 'Vietnam' },
  ],
  Spanish: [
    { id: 'es-mexico', name: 'Mexican Spanish', region: 'Mexico' },
    { id: 'es-spain', name: 'Castilian Spanish', region: 'Spain' },
    { id: 'es-argentina', name: 'Rioplatense Spanish', region: 'Argentina' },
    { id: 'es-colombia', name: 'Colombian Spanish', region: 'Colombia' },
    { id: 'es-caribbean', name: 'Caribbean Spanish', region: 'Caribbean' },
    { id: 'es-chile', name: 'Chilean Spanish', region: 'Chile' },
    { id: 'es-peru', name: 'Peruvian Spanish', region: 'Peru' },
    { id: 'es-venezuela', name: 'Venezuelan Spanish', region: 'Venezuela' },
    { id: 'es-cuba', name: 'Cuban Spanish', region: 'Cuba' },
    { id: 'es-puerto-rico', name: 'Puerto Rican Spanish', region: 'Puerto Rico' },
    { id: 'es-dominican', name: 'Dominican Spanish', region: 'Dominican Republic' },
    { id: 'es-bolivia', name: 'Bolivian Spanish', region: 'Bolivia' },
    { id: 'es-ecuador', name: 'Ecuadorian Spanish', region: 'Ecuador' },
    { id: 'es-paraguay', name: 'Paraguayan Spanish', region: 'Paraguay' },
    { id: 'es-uruguay', name: 'Uruguayan Spanish', region: 'Uruguay' },
  ],
};

export const TTS_VOICES = [
  { id: 'Puck', name: 'Voice 1' },
  { id: 'Charon', name: 'Voice 2' },
  { id: 'Kore', name: 'Voice 3' },
  { id: 'Fenrir', name: 'Voice 4' },
  { id: 'Zephyr', name: 'Voice 5' },
];

export const REGIONAL_NAMES: Record<string, string[]> = {
  'fr-paris': ['Gabriel', 'Thomas', 'Emma', 'Lucas', 'Léa'],
  'fr-quebec': ['Félix', 'Antoine', 'Rosalie', 'Émile', 'Florence'],
  'fr-marseille': ['Marius', 'Sacha', 'Louna', 'Enzo', 'Manon'],
  'fr-senegal': ['Moussa', 'Abdou', 'Fatou', 'Ousmane', 'Awa'],
  'fr-belgium': ['Arthur', 'Louis', 'Alice', 'Victor', 'Juliette'],
  'fr-switzerland': ['Noah', 'Léon', 'Mia', 'Liam', 'Chloé'],
  'fr-ivory-coast': ['Koffi', 'Yao', 'Aya', 'Bakary', 'Bintou'],
  'fr-cameroon': ['Samuel', 'Jean', 'Marie', 'Paul', 'Anne'],
  'fr-haiti': ['Jean-Claude', 'Pierre', 'Marie-Thérèse', 'Dieudonné', 'Fabienne'],
  'fr-lyon': ['Paul', 'Jules', 'Louise', 'Hugo', 'Camille'],
  'fr-normandy': ['Guillaume', 'Robert', 'Mathilde', 'Richard', 'Adèle'],
  'fr-brittany': ['Yann', 'Loïc', 'Nolwenn', 'Gwen', 'Maël'],
  'fr-congo': ['Dieumerci', 'Gloire', 'Espérance', 'Trésor', 'Béni'],
  'fr-morocco': ['Yassine', 'Mehdi', 'Yasmine', 'Anas', 'Inès'],
  'fr-vietnam': ['Minh', 'Anh', 'Lan', 'Hùng', 'Trang'],
  'es-mexico': ['Mateo', 'Santiago', 'Sofía', 'Sebastián', 'Ximena'],
  'es-spain': ['Hugo', 'Lucas', 'Lucía', 'Martín', 'Paula'],
  'es-argentina': ['Bautista', 'Benjamín', 'Martina', 'Felipe', 'Catalina'],
  'es-colombia': ['Juan', 'José', 'María', 'Luis', 'Carlos'],
  'es-caribbean': ['Yadiel', 'Javier', 'Alondra', 'Luis', 'Kamila'],
  'es-chile': ['Agustín', 'Benjamín', 'Isabella', 'Vicente', 'Emilia'],
  'es-peru': ['Liam', 'Thiago', 'Valentina', 'Gael', 'Emma'],
  'es-venezuela': ['Diego', 'Samuel', 'Victoria', 'Matías', 'Antonella'],
  'es-cuba': ['Yoel', 'Yusniel', 'Yaima', 'Yosvani', 'Yuleisy'],
  'es-puerto-rico': ['Sebastián', 'Dylan', 'Valentina', 'Ian', 'Victoria'],
  'es-dominican': ['Emmanuel', 'Ángel', 'Abigail', 'Christopher', 'Isabella'],
  'es-bolivia': ['Alejandro', 'Gabriel', 'Luciana', 'Daniel', 'Mariana'],
  'es-ecuador': ['Mateo', 'Joaquín', 'Danna', 'Isaac', 'Rafaela'],
  'es-paraguay': ['Santino', 'Thiago', 'Mía', 'Bastian', 'Aitana'],
  'es-uruguay': ['Juan', 'Felipe', 'Julieta', 'Joaquín', 'Delfina'],
};

export const ENGLISH_ACCENTS = [
  'American',
  'British',
  'Canadian',
  'Australian',
  'Irish'
];

export const TONGUE_TWISTERS: Record<Language, string[]> = {
  French: [
    "Un chasseur sachant chasser doit savoir chasser sans son chien.",
    "Les chaussettes de l'archiduchesse sont-elles sèches, archi-sèches ?",
    "Cinq chiens chassent six chats.",
    "Didon dîna, dit-on, du dos d'un dodu dindon.",
    "Si six scies scient six cyprès, six cent six scies scient six cent six cyprès."
  ],
  Spanish: [
    "Tres tristes tigres tragaban trigo en un trigal.",
    "Pablito clavó un clavito en la calva de un calvito.",
    "Como poco coco como, poco coco compro.",
    "El perro de San Roque no tiene rabo porque Ramón Rodríguez se lo ha robado.",
    "Erre con erre guitarra, erre con erre carril."
  ]
};
