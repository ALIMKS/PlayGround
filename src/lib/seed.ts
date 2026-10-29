import { addDays, todayISO } from './availability'
import { hashPassword, randomId } from './crypto'
import { calculateQuote } from './pricing'
import type {
  AppData,
  Booking,
  Listing,
  PaymentMethod,
  Review,
  User,
} from './types'

const DEMO_PASSWORD = 'Wanderra!2026'
const img = (name: string) => `/images/${name}.jpg`

type UserSeed = Omit<User, 'passwordHash' | 'passwordSalt'>

async function makeUser(seed: UserSeed): Promise<User> {
  const { hash, salt } = await hashPassword(DEMO_PASSWORD)
  return { ...seed, passwordHash: hash, passwordSalt: salt }
}

function baseUser(
  id: string,
  name: string,
  email: string,
  role: User['role'],
  country: string,
  hue: number,
  overrides: Partial<UserSeed> = {},
): UserSeed {
  return {
    id,
    name,
    email,
    role,
    createdAt: '2024-04-12T10:00:00.000Z',
    country,
    bio: '',
    languages: ['fr', 'en'],
    avatarHue: hue,
    emailVerified: true,
    phone: '',
    phoneVerified: true,
    idStatus: 'verified',
    idDocName: '',
    twoFactor: false,
    trustScore: 80,
    wishlist: [],
    loginHistory: [],
    payoutMethod: '',
    cards: [],
    ...overrides,
  }
}

const hosts: UserSeed[] = [
  baseUser('u_host1', 'Lucas Moreau', 'host@wanderra.app', 'host', 'FR', 18, {
    bio: 'Architecte d’intérieur, je restaure des lieux de caractère entre Paris, Marrakech et Mexico.',
    languages: ['fr', 'en', 'es'],
    trustScore: 97,
    hostSince: '2021-03-01T00:00:00.000Z',
    superhost: true,
    payoutMethod: 'SEPA •••• 4412',
    phone: '+33 6 12 34 56 78',
  }),
  baseUser('u_host2', 'Inês Carvalho', 'ines@wanderra.app', 'host', 'PT', 152, {
    bio: 'Photographe de voyage. J’ouvre les portes de mes maisons à Lisbonne, Tokyo et New York.',
    languages: ['pt', 'en', 'fr', 'ja'],
    trustScore: 96,
    hostSince: '2020-09-01T00:00:00.000Z',
    superhost: true,
    payoutMethod: 'SEPA •••• 9021',
    phone: '+351 912 345 678',
  }),
  baseUser('u_host3', 'Made Wirawan', 'made@wanderra.app', 'host', 'ID', 88, {
    bio: 'Je gère des villas familiales à Bali, au Cap, à Santorini et à Rio avec une équipe locale.',
    languages: ['id', 'en', 'fr'],
    trustScore: 95,
    hostSince: '2019-06-01T00:00:00.000Z',
    superhost: true,
    payoutMethod: 'Wise •••• 7710',
    phone: '+62 812 3456 7890',
  }),
]

const extraUsers: UserSeed[] = [
  baseUser('u_guest', 'Amina Diallo', 'guest@wanderra.app', 'guest', 'SN', 12, {
    bio: 'Curieuse du monde, je voyage léger et j’aime les maisons avec une âme.',
    languages: ['fr', 'en', 'wo'],
    trustScore: 84,
    wishlist: ['l_bali', 'l_santorini'],
    cards: [
      {
        id: 'card_1',
        brand: 'Visa',
        last4: '4242',
        expiry: '09/28',
        holder: 'Amina Diallo',
      },
    ],
    phone: '+221 77 123 45 67',
    loginHistory: [
      { at: '2026-10-20T09:14:00.000Z', device: 'Safari · iOS', city: 'Dakar', ok: true },
    ],
  }),
  baseUser('u_admin', 'Sofia Almeida', 'admin@wanderra.app', 'admin', 'PT', 205, {
    bio: 'Responsable Trust & Safety chez Wanderra.',
    languages: ['pt', 'fr', 'en'],
    trustScore: 100,
    twoFactor: true,
  }),
  baseUser('u_nadia', 'Nadia Benali', 'nadia@wanderra.app', 'guest', 'MA', 320, {
    bio: 'Nouvelle sur Wanderra, en attente de vérification.',
    languages: ['fr', 'ar'],
    trustScore: 42,
    idStatus: 'pending',
    idDocName: 'passeport-nadia.jpg',
    phone: '+212 6 61 23 45 67',
    phoneVerified: false,
  }),
  baseUser('u_maya', 'Maya Okafor', 'maya@wanderra.app', 'guest', 'NG', 270, {
    bio: 'Product designer, toujours entre deux villes.',
    languages: ['en', 'fr'],
    trustScore: 76,
    wishlist: ['l_paris'],
    phone: '+234 803 123 4567',
  }),
  baseUser('u_kenji', 'Kenji Sato', 'kenji@wanderra.app', 'host', 'JP', 195, {
    bio: 'Hôte à Tokyo, passionné d’architecture minimaliste.',
    languages: ['ja', 'en'],
    trustScore: 92,
    hostSince: '2022-01-01T00:00:00.000Z',
    payoutMethod: 'Banque •••• 3301',
    phone: '+81 90 1234 5678',
  }),
]

interface ListingSeed {
  id: string
  hostId: string
  title: string
  subtitle: string
  description: string
  type: Listing['type']
  category: Listing['category']
  city: string
  country: string
  countryCode: string
  lat: number
  lng: number
  images: string[]
  price: number
  cleaningFee: number
  taxRate: number
  maxGuests: number
  bedrooms: number
  beds: number
  baths: number
  amenities: string[]
  rating: number
  reviewCount: number
  instantBook: boolean
  superhost: boolean
  featured: boolean
  cancellationPolicy: Listing['cancellationPolicy']
  minNights: number
  currencyHint: Listing['currencyHint']
  blockedOffsets?: number[]
  status?: Listing['status']
}

const listingSeeds: ListingSeed[] = [
  {
    id: 'l_paris',
    hostId: 'u_host1',
    title: 'Loft lumineux au cœur du Marais',
    subtitle: 'Un atelier d’architecte à deux pas du musée Picasso',
    description:
      'Un loft traversant de 68 m², entièrement rénové, avec poutres apparentes et grande verrière. Le quartier est piéton, les cafés et galeries sont au coin de la rue. Idéal pour un couple ou un voyageur solo qui aime les lieux singuliers.',
    type: 'loft',
    category: 'design',
    city: 'Paris',
    country: 'France',
    countryCode: 'FR',
    lat: 48.859,
    lng: 2.362,
    images: [img('stay-1'), img('stay-4'), img('paris'), img('stay-14'), img('stay-2')],
    price: 210,
    cleaningFee: 55,
    taxRate: 0.1,
    maxGuests: 3,
    bedrooms: 1,
    beds: 2,
    baths: 1,
    amenities: ['wifi', 'kitchen', 'washer', 'workspace', 'heating', 'tv', 'terrace'],
    rating: 4.92,
    reviewCount: 128,
    instantBook: true,
    superhost: true,
    featured: true,
    cancellationPolicy: 'flexible',
    minNights: 2,
    currencyHint: 'EUR',
    blockedOffsets: [6, 7, 21],
  },
  {
    id: 'l_lisbon',
    hostId: 'u_host2',
    title: 'Maison de azulejos à Alfama',
    subtitle: 'Terrasse sur les toits et lumière de l’Atlantique',
    description:
      'Une maison de ville du XVIIIe siècle, restaurée avec soin, sur trois niveaux. La terrasse offre une vue dégagée sur les toits d’Alfama et le Tage. Le fado, les marchés et le tram 28 sont à quelques minutes à pied.',
    type: 'house',
    category: 'city',
    city: 'Lisbonne',
    country: 'Portugal',
    countryCode: 'PT',
    lat: 38.711,
    lng: -9.13,
    images: [img('stay-2'), img('stay-15'), img('lisbon'), img('stay-11'), img('stay-1')],
    price: 145,
    cleaningFee: 40,
    taxRate: 0.06,
    maxGuests: 4,
    bedrooms: 2,
    beds: 2,
    baths: 1,
    amenities: ['wifi', 'kitchen', 'ac', 'washer', 'terrace', 'seaView', 'tv'],
    rating: 4.88,
    reviewCount: 94,
    instantBook: true,
    superhost: true,
    featured: true,
    cancellationPolicy: 'moderate',
    minNights: 2,
    currencyHint: 'EUR',
    blockedOffsets: [3, 4, 17],
  },
  {
    id: 'l_bali',
    hostId: 'u_host3',
    title: 'Villa jungle avec piscine à Ubud',
    subtitle: 'Réveil au-dessus de la vallée, petit-déjeuner tropical',
    description:
      'Une villa privée de 180 m² ouverte sur la jungle, avec piscine à débordement et cuisine d’été. Le petit-déjeuner est préparé sur place chaque matin. Un chauffeur est disponible à la demande pour explorer Ubud et ses rizières.',
    type: 'villa',
    category: 'tropical',
    city: 'Ubud',
    country: 'Indonésie',
    countryCode: 'ID',
    lat: -8.506,
    lng: 115.262,
    images: [img('stay-3'), img('stay-13'), img('bali'), img('stay-12'), img('stay-1')],
    price: 320,
    cleaningFee: 70,
    taxRate: 0.11,
    maxGuests: 6,
    bedrooms: 3,
    beds: 3,
    baths: 3,
    amenities: ['wifi', 'pool', 'ac', 'kitchen', 'breakfast', 'garden', 'parking', 'hottub'],
    rating: 4.97,
    reviewCount: 203,
    instantBook: true,
    superhost: true,
    featured: true,
    cancellationPolicy: 'flexible',
    minNights: 3,
    currencyHint: 'USD',
    blockedOffsets: [2, 3, 4, 31],
  },
  {
    id: 'l_tokyo',
    hostId: 'u_host2',
    title: 'Appartement minimaliste à Shibuya',
    subtitle: 'Calme absolu au-dessus de l’effervescence',
    description:
      'Un appartement épuré au 9e étage, pensé par un architecte japonais. Grandes fenêtres, bois clair, salle de bain avec baignoire profonde. La station Shibuya est à six minutes à pied, les meilleurs cafés du quartier à deux minutes.',
    type: 'apartment',
    category: 'city',
    city: 'Tokyo',
    country: 'Japon',
    countryCode: 'JP',
    lat: 35.661,
    lng: 139.704,
    images: [img('stay-4'), img('stay-16'), img('tokyo'), img('stay-2'), img('stay-1')],
    price: 190,
    cleaningFee: 45,
    taxRate: 0.1,
    maxGuests: 2,
    bedrooms: 1,
    beds: 1,
    baths: 1,
    amenities: ['wifi', 'ac', 'kitchen', 'washer', 'workspace', 'heating'],
    rating: 4.9,
    reviewCount: 167,
    instantBook: true,
    superhost: true,
    featured: true,
    cancellationPolicy: 'moderate',
    minNights: 2,
    currencyHint: 'JPY',
    blockedOffsets: [8, 9, 10],
  },
  {
    id: 'l_marrakech',
    hostId: 'u_host1',
    title: 'Riad secret avec patio et hammam',
    subtitle: 'Une parenthèse fraîche dans la médina',
    description:
      'Un riad du XIXe siècle restauré à la main, organisé autour d’un patio planté d’orangers. Trois chambres, un hammam traditionnel et une terrasse pour les dîners. Le souk et la place Jemaa el-Fna sont à dix minutes à pied.',
    type: 'riad',
    category: 'desert',
    city: 'Marrakech',
    country: 'Maroc',
    countryCode: 'MA',
    lat: 31.629,
    lng: -7.986,
    images: [img('stay-5'), img('stay-6'), img('marrakech'), img('stay-10'), img('stay-1')],
    price: 130,
    cleaningFee: 35,
    taxRate: 0.1,
    maxGuests: 6,
    bedrooms: 3,
    beds: 3,
    baths: 2,
    amenities: ['wifi', 'pool', 'ac', 'breakfast', 'hottub', 'terrace', 'kitchen'],
    rating: 4.86,
    reviewCount: 76,
    instantBook: true,
    superhost: true,
    featured: true,
    cancellationPolicy: 'flexible',
    minNights: 2,
    currencyHint: 'MAD',
    blockedOffsets: [12, 13, 26],
  },
  {
    id: 'l_capetown',
    hostId: 'u_host3',
    title: 'Villa océan à Camps Bay',
    subtitle: 'Piscine, montagne et coucher de soleil sur l’Atlantique',
    description:
      'Une villa contemporaine de 300 m² face à l’océan, avec piscine chauffée, cuisine ouverte et grande terrasse. La plage de Camps Bay est à cinq minutes à pied, les sentiers de Table Mountain à quinze minutes en voiture.',
    type: 'villa',
    category: 'beach',
    city: 'Le Cap',
    country: 'Afrique du Sud',
    countryCode: 'ZA',
    lat: -33.95,
    lng: 18.377,
    images: [img('stay-6'), img('stay-7'), img('capetown'), img('stay-9'), img('stay-1')],
    price: 280,
    cleaningFee: 60,
    taxRate: 0.15,
    maxGuests: 8,
    bedrooms: 4,
    beds: 5,
    baths: 3,
    amenities: ['wifi', 'pool', 'beach', 'parking', 'bbq', 'kitchen', 'security', 'seaView'],
    rating: 4.95,
    reviewCount: 141,
    instantBook: true,
    superhost: true,
    featured: true,
    cancellationPolicy: 'strict',
    minNights: 3,
    currencyHint: 'ZAR',
    blockedOffsets: [5, 6, 19],
  },
  {
    id: 'l_newyork',
    hostId: 'u_host2',
    title: 'Loft industriel à SoHo',
    subtitle: 'Briques, fonte et lumière new-yorkaise',
    description:
      'Un loft de 90 m² dans un immeuble en fonte classé, au cœur de SoHo. Plafonds de 4 mètres, cuisine professionnelle, coin bureau. Les galeries, restaurants et boutiques sont au pied de l’immeuble.',
    type: 'loft',
    category: 'city',
    city: 'New York',
    country: 'États-Unis',
    countryCode: 'US',
    lat: 40.723,
    lng: -74.0,
    images: [img('stay-7'), img('stay-8'), img('newyork'), img('stay-14'), img('stay-1')],
    price: 350,
    cleaningFee: 80,
    taxRate: 0.08875,
    maxGuests: 3,
    bedrooms: 1,
    beds: 2,
    baths: 1,
    amenities: ['wifi', 'ac', 'kitchen', 'workspace', 'washer', 'tv', 'gym'],
    rating: 4.84,
    reviewCount: 212,
    instantBook: true,
    superhost: true,
    featured: true,
    cancellationPolicy: 'moderate',
    minNights: 2,
    currencyHint: 'USD',
    blockedOffsets: [9, 10, 23],
  },
  {
    id: 'l_mexico',
    hostId: 'u_host1',
    title: 'Casa Roma avec terrasse plantée',
    subtitle: 'Le meilleur de Mexico City à pied',
    description:
      'Une casa de 120 m² dans le quartier Roma Norte, avec terrasse couverte de plantes et cuisine ouverte. Les marchés, mezcalerías et parcs sont à quelques rues. Parfait pour découvrir la ville comme un local.',
    type: 'house',
    category: 'city',
    city: 'Mexico',
    country: 'Mexique',
    countryCode: 'MX',
    lat: 19.419,
    lng: -99.161,
    images: [img('stay-8'), img('stay-9'), img('mexico'), img('stay-3'), img('stay-1')],
    price: 110,
    cleaningFee: 30,
    taxRate: 0.16,
    maxGuests: 4,
    bedrooms: 2,
    beds: 2,
    baths: 2,
    amenities: ['wifi', 'kitchen', 'workspace', 'terrace', 'washer', 'pets'],
    rating: 4.79,
    reviewCount: 58,
    instantBook: true,
    superhost: false,
    featured: false,
    cancellationPolicy: 'flexible',
    minNights: 2,
    currencyHint: 'USD',
    blockedOffsets: [4, 15, 16],
  },
  {
    id: 'l_santorini',
    hostId: 'u_host3',
    title: 'Cave house avec vue mer à Oia',
    subtitle: 'Blanc, bleu et silence au-dessus de la caldeira',
    description:
      'Une maison troglodyte traditionnelle, creusée dans la falaise, avec terrasse privée face à la caldeira. Deux chambres voûtées, une kitchenette et un bain à remous extérieur. Le coucher de soleil est votre seul voisin.',
    type: 'house',
    category: 'beach',
    city: 'Santorin',
    country: 'Grèce',
    countryCode: 'GR',
    lat: 36.461,
    lng: 25.376,
    images: [img('stay-9'), img('stay-10'), img('santorini'), img('stay-6'), img('stay-1')],
    price: 290,
    cleaningFee: 65,
    taxRate: 0.13,
    maxGuests: 4,
    bedrooms: 2,
    beds: 2,
    baths: 2,
    amenities: ['wifi', 'ac', 'hottub', 'seaView', 'terrace', 'kitchen', 'breakfast'],
    rating: 4.96,
    reviewCount: 189,
    instantBook: true,
    superhost: true,
    featured: true,
    cancellationPolicy: 'strict',
    minNights: 3,
    currencyHint: 'EUR',
    blockedOffsets: [11, 12, 27],
  },
  {
    id: 'l_reykjavik',
    hostId: 'u_host2',
    title: 'Cabane nordique avec sauna privé',
    subtitle: 'Aurores boréales et feu de bois',
    description:
      'Une cabane en bois sombre à trente minutes de Reykjavik, entourée de mousse et de silence. Sauna privé, bain nordique et grandes baies vitrées pour observer les aurores. Le parc national de Þingvellir est à quarante minutes.',
    type: 'cabin',
    category: 'mountain',
    city: 'Reykjavik',
    country: 'Islande',
    countryCode: 'IS',
    lat: 64.146,
    lng: -21.942,
    images: [img('stay-10'), img('stay-11'), img('reykjavik'), img('stay-5'), img('stay-1')],
    price: 240,
    cleaningFee: 50,
    taxRate: 0.11,
    maxGuests: 5,
    bedrooms: 2,
    beds: 3,
    baths: 1,
    amenities: ['wifi', 'heating', 'sauna', 'hottub', 'fireplace', 'kitchen', 'parking'],
    rating: 4.91,
    reviewCount: 67,
    instantBook: false,
    superhost: true,
    featured: true,
    cancellationPolicy: 'moderate',
    minNights: 2,
    currencyHint: 'EUR',
    blockedOffsets: [7, 8, 22],
  },
  {
    id: 'l_dubai',
    hostId: 'u_host1',
    title: 'Penthouse marina avec skyline',
    subtitle: 'Vue à 180° sur les tours et la marina',
    description:
      'Un penthouse de 140 m² au 42e étage, avec deux terrasses et une vue panoramique sur la marina et Burj Khalifa. Piscine sur le toit, salle de sport et conciergerie 24/7 dans l’immeuble.',
    type: 'apartment',
    category: 'city',
    city: 'Dubaï',
    country: 'Émirats arabes unis',
    countryCode: 'AE',
    lat: 25.08,
    lng: 55.14,
    images: [img('stay-11'), img('stay-12'), img('dubai'), img('stay-1'), img('stay-2')],
    price: 420,
    cleaningFee: 90,
    taxRate: 0.05,
    maxGuests: 4,
    bedrooms: 2,
    beds: 2,
    baths: 2,
    amenities: ['wifi', 'ac', 'pool', 'gym', 'parking', 'security', 'workspace', 'tv'],
    rating: 4.87,
    reviewCount: 102,
    instantBook: true,
    superhost: true,
    featured: true,
    cancellationPolicy: 'flexible',
    minNights: 2,
    currencyHint: 'AED',
    blockedOffsets: [3, 4, 18],
  },
  {
    id: 'l_rio',
    hostId: 'u_host3',
    title: 'Maison tropicale à Santa Teresa',
    subtitle: 'Jardin, hamac et vue sur la baie',
    description:
      'Une maison colorée perchée dans les collines de Santa Teresa, avec jardin tropical et vue sur la baie de Guanabara. Trois chambres, une véranda et un hamac pour les après-midi lents. Les escaliers de Selarón sont à dix minutes.',
    type: 'house',
    category: 'tropical',
    city: 'Rio de Janeiro',
    country: 'Brésil',
    countryCode: 'BR',
    lat: -22.915,
    lng: -43.188,
    images: [img('stay-12'), img('stay-13'), img('rio'), img('stay-4'), img('stay-1')],
    price: 160,
    cleaningFee: 40,
    taxRate: 0.1,
    maxGuests: 6,
    bedrooms: 3,
    beds: 4,
    baths: 2,
    amenities: ['wifi', 'garden', 'kitchen', 'bbq', 'pets', 'workspace', 'terrace'],
    rating: 4.83,
    reviewCount: 88,
    instantBook: true,
    superhost: false,
    featured: false,
    cancellationPolicy: 'moderate',
    minNights: 2,
    currencyHint: 'BRL',
    blockedOffsets: [6, 7, 20],
  },
  {
    id: 'l_chefchaouen',
    hostId: 'u_host1',
    title: 'Maison d’hôtes à Chefchaouen',
    subtitle: 'La ville bleue depuis la terrasse',
    description:
      'Une maison d’hôtes de cinq chambres dans la médina bleue, avec un patio frais et une terrasse qui domine les montagnes du Rif. Petits-déjeuners maison et accueil personnalisé.',
    type: 'house',
    category: 'mountain',
    city: 'Chefchaouen',
    country: 'Maroc',
    countryCode: 'MA',
    lat: 35.169,
    lng: -5.269,
    images: [img('stay-14'), img('stay-15'), img('marrakech'), img('stay-16'), img('stay-1')],
    price: 95,
    cleaningFee: 25,
    taxRate: 0.1,
    maxGuests: 10,
    bedrooms: 5,
    beds: 7,
    baths: 4,
    amenities: ['wifi', 'breakfast', 'terrace', 'kitchen', 'heating'],
    rating: 4.7,
    reviewCount: 12,
    instantBook: false,
    superhost: false,
    featured: false,
    cancellationPolicy: 'moderate',
    minNights: 2,
    currencyHint: 'MAD',
    status: 'pending',
  },
]

function buildListing(seed: ListingSeed): Listing {
  const today = todayISO()
  return {
    id: seed.id,
    hostId: seed.hostId,
    title: seed.title,
    subtitle: seed.subtitle,
    description: seed.description,
    type: seed.type,
    category: seed.category,
    city: seed.city,
    country: seed.country,
    countryCode: seed.countryCode,
    lat: seed.lat,
    lng: seed.lng,
    images: seed.images,
    price: seed.price,
    cleaningFee: seed.cleaningFee,
    taxRate: seed.taxRate,
    maxGuests: seed.maxGuests,
    bedrooms: seed.bedrooms,
    beds: seed.beds,
    baths: seed.baths,
    amenities: seed.amenities,
    rating: seed.rating,
    reviewCount: seed.reviewCount,
    instantBook: seed.instantBook,
    superhost: seed.superhost,
    featured: seed.featured,
    cancellationPolicy: seed.cancellationPolicy,
    minNights: seed.minNights,
    blockedDates: (seed.blockedOffsets ?? []).map((offset) => addDays(today, offset)),
    status: seed.status ?? 'published',
    createdAt: '2025-05-01T10:00:00.000Z',
    license: seed.countryCode === 'FR' ? 'Numéro d’enregistrement 7510102345678' : 'Registre local vérifié',
    currencyHint: seed.currencyHint,
  }
}

function buildBooking(
  listing: Listing,
  guestId: string,
  checkIn: string,
  checkOut: string,
  guests: number,
  paymentMethod: PaymentMethod,
  status: Booking['status'],
  currency: Listing['currencyHint'],
): Booking {
  const quote = calculateQuote(listing, checkIn, checkOut, currency)
  return {
    id: randomId('bk'),
    code: `WR-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    listingId: listing.id,
    guestId,
    hostId: listing.hostId,
    checkIn,
    checkOut,
    guests,
    quote,
    paymentMethod,
    status,
    createdAt: new Date(Date.now() - 5 * 86_400_000).toISOString(),
    reviewLeft: status === 'completed',
  }
}

const reviewTexts: { authorId: string; authorName: string; text: string; lang: 'fr' | 'en'; rating: number }[] = [
  { authorId: 'u_maya', authorName: 'Maya', text: 'Un lieu encore plus beau que sur les photos. L’accueil était parfait et le quartier vivant sans être bruyant.', lang: 'fr', rating: 5 },
  { authorId: 'u_kenji', authorName: 'Kenji', text: 'Beautiful space, thoughtful details, and a host who answers within minutes. Would stay again.', lang: 'en', rating: 5 },
  { authorId: 'u_nadia', authorName: 'Nadia', text: 'Très propre, très calme, exactement ce qu’il fallait pour quelques jours de travail.', lang: 'fr', rating: 4 },
  { authorId: 'u_guest', authorName: 'Amina', text: 'Le petit-déjeuner sur la terrasse restera un souvenir. Merci pour tout !', lang: 'fr', rating: 5 },
  { authorId: 'u_maya', authorName: 'Maya', text: 'The location is unbeatable. The apartment is small but perfectly designed.', lang: 'en', rating: 5 },
  { authorId: 'u_kenji', authorName: 'Kenji', text: '静かで清潔、そして立地が素晴らしい。また泊まりたいです。', lang: 'en', rating: 5 },
  { authorId: 'u_guest', authorName: 'Amina', text: 'Une parenthèse hors du temps. Le patio est encore plus agréable le soir.', lang: 'fr', rating: 5 },
  { authorId: 'u_maya', authorName: 'Maya', text: 'The pool and the view made the trip. Staff were discreet and kind.', lang: 'en', rating: 5 },
  { authorId: 'u_nadia', authorName: 'Nadia', text: 'Emplacement idéal, hôte réactif. Petit bémol sur le bruit le samedi soir.', lang: 'fr', rating: 4 },
  { authorId: 'u_kenji', authorName: 'Kenji', text: 'Great value for the area. The kitchen is better equipped than most rentals.', lang: 'en', rating: 5 },
  { authorId: 'u_guest', authorName: 'Amina', text: 'La vue depuis la terrasse est irréelle. On reviendra.', lang: 'fr', rating: 5 },
  { authorId: 'u_maya', authorName: 'Maya', text: 'A calm, beautiful base after long days in the city. Highly recommend.', lang: 'en', rating: 5 },
]

const seedReviewListingIds = [
  'l_paris', 'l_lisbon', 'l_bali', 'l_tokyo', 'l_marrakech', 'l_capetown',
  'l_newyork', 'l_mexico', 'l_santorini', 'l_reykjavik', 'l_dubai', 'l_rio',
]

export interface SeedResult {
  users: User[]
  listings: Listing[]
  bookings: Booking[]
  reviews: Review[]
  verifications: AppData['verifications']
  audit: AppData['audit']
  messages: AppData['messages']
}

export async function buildSeed(): Promise<SeedResult> {
  const users = await Promise.all([...hosts, ...extraUsers].map(makeUser))
  const listings = listingSeeds.map(buildListing)
  const byId = new Map(listings.map((listing) => [listing.id, listing]))
  const today = todayISO()

  const bookings: Booking[] = [
    buildBooking(byId.get('l_paris')!, 'u_guest', addDays(today, -40), addDays(today, -36), 2, 'card', 'completed', 'EUR'),
    buildBooking(byId.get('l_marrakech')!, 'u_guest', addDays(today, 12), addDays(today, 16), 4, 'paypal', 'confirmed', 'MAD'),
    buildBooking(byId.get('l_bali')!, 'u_guest', addDays(today, 45), addDays(today, 52), 4, 'card', 'confirmed', 'USD'),
    buildBooking(byId.get('l_lisbon')!, 'u_maya', addDays(today, 8), addDays(today, 11), 2, 'card', 'confirmed', 'EUR'),
    buildBooking(byId.get('l_tokyo')!, 'u_maya', addDays(today, -25), addDays(today, -21), 1, 'applepay', 'completed', 'JPY'),
    buildBooking(byId.get('l_capetown')!, 'u_guest', addDays(today, 70), addDays(today, 75), 6, 'card', 'confirmed', 'ZAR'),
  ]

  const reviews: Review[] = []
  seedReviewListingIds.forEach((listingId, listingIndex) => {
    for (let i = 0; i < 2; i += 1) {
      const source = reviewTexts[(listingIndex * 2 + i) % reviewTexts.length]
      reviews.push({
        id: randomId('rv'),
        listingId,
        authorId: source.authorId,
        authorName: source.authorName,
        rating: source.rating,
        text: source.text,
        createdAt: new Date(Date.now() - (listingIndex * 7 + i * 3 + 4) * 86_400_000).toISOString(),
        lang: source.lang,
      })
    }
  })

  const parisBooking = bookings[0]
  reviews.push({
    id: randomId('rv'),
    listingId: 'l_paris',
    bookingId: parisBooking.id,
    authorId: 'u_guest',
    authorName: 'Amina',
    rating: 5,
    text: 'Le loft est magnifique, très bien situé et l’hôte a été adorable. Je recommande sans hésiter.',
    createdAt: new Date(Date.now() - 30 * 86_400_000).toISOString(),
    lang: 'fr',
  })

  const verifications: AppData['verifications'] = [
    {
      id: 'vr_nadia',
      userId: 'u_nadia',
      userName: 'Nadia Benali',
      kind: 'identity',
      docName: 'passeport-nadia.jpg',
      status: 'pending',
      submittedAt: new Date(Date.now() - 6 * 3_600_000).toISOString(),
      riskScore: 18,
      note: '',
    },
    {
      id: 'vr_kenji',
      userId: 'u_kenji',
      userName: 'Kenji Sato',
      kind: 'payout',
      docName: 'releve-bancaire-kenji.pdf',
      status: 'pending',
      submittedAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
      riskScore: 7,
      note: '',
    },
    {
      id: 'vr_listing',
      userId: 'u_host1',
      userName: 'Lucas Moreau',
      kind: 'listing',
      docName: 'titre-propriete-chefchaouen.pdf',
      status: 'pending',
      submittedAt: new Date(Date.now() - 26 * 3_600_000).toISOString(),
      riskScore: 12,
      note: '',
    },
  ]

  const audit: AppData['audit'] = [
    {
      id: randomId('au'),
      at: new Date(Date.now() - 3 * 3_600_000).toISOString(),
      userId: 'u_nadia',
      action: 'identity.submitted',
      detail: 'Document d’identité soumis pour vérification.',
    },
    {
      id: randomId('au'),
      at: new Date(Date.now() - 8 * 3_600_000).toISOString(),
      userId: 'u_guest',
      action: 'booking.created',
      detail: 'Réservation confirmée à Marrakech.',
    },
    {
      id: randomId('au'),
      at: new Date(Date.now() - 26 * 3_600_000).toISOString(),
      userId: 'u_host1',
      action: 'listing.submitted',
      detail: 'Nouvelle annonce soumise à la modération.',
    },
  ]

  const messages: AppData['messages'] = [
    {
      id: randomId('ms'),
      bookingId: parisBooking.id,
      fromId: 'u_guest',
      toId: 'u_host1',
      text: 'Bonjour Lucas, arrivée prévue vers 18 h, est-ce possible ?',
      at: new Date(Date.now() - 32 * 86_400_000).toISOString(),
    },
    {
      id: randomId('ms'),
      bookingId: parisBooking.id,
      fromId: 'u_host1',
      toId: 'u_guest',
      text: 'Bien sûr ! Le code de la boîte à clés vous sera envoyé la veille.',
      at: new Date(Date.now() - 31.8 * 86_400_000).toISOString(),
    },
  ]

  return { users, listings, bookings, reviews, verifications, audit, messages }
}

export const DEMO_ACCOUNTS = {
  guest: 'guest@wanderra.app',
  host: 'host@wanderra.app',
  admin: 'admin@wanderra.app',
  password: DEMO_PASSWORD,
}
