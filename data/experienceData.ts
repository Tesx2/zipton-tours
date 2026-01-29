
export interface Experience {
  id: string;
  title: string;
  category: string;
  price: number;
  image: string;
  description: string;
  longDescription: string;
  highlights: string[];
  duration: string;
}

export const experiences: Experience[] = [
  {
    id: "mara-cultural",
    title: "Mara Cultural Safari",
    category: "Adventure + Culture",
    price: 1200,
    image: "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&q=80&w=800",
    description: "A 5-day journey through the Maasai Mara, combining classic game drives with immersive village stays.",
    longDescription: "The Maasai Mara is world-renowned for its exceptional populations of lion, leopard, cheetah and elephant, and the annual migration of wildebeest, zebra and gazelle. Zipton Tours takes you further, offering exclusive access to Maasai homesteads where you can learn traditional beadwork, fire-making, and the deep philosophy of 'Enkai'.",
    highlights: ["Sunrise Balloon Safari", "Maasai Warrior Training", "The Big Five Tracking", "Community-led Conservation Talk"],
    duration: "5 Days / 4 Nights"
  },
  {
    id: "mt-kenya-trek",
    title: "Mt. Kenya Soul Trek",
    category: "High Energy",
    price: 1500,
    image: "https://images.unsplash.com/photo-1544256718-3bcf237f3974?auto=format&fit=crop&q=80&w=800",
    description: "Scale the heights of Africa's second highest peak while learning the spiritual significance of the mountain.",
    longDescription: "Mt. Kenya is more than a mountain; it is the sacred home of Ngai. Our trek follows the Sirimon route, known for its beautiful scenery and steady ascent. Experience Afro-alpine flora, jagged volcanic peaks, and crystal-clear mountain tarns while reflecting on your own personal growth and discovery.",
    highlights: ["Summit Pt Lenana (4985m)", "Gorges Valley views", "Unique Afro-alpine wildlife", "Spiritual grounding sessions"],
    duration: "6 Days / 5 Nights"
  },
  {
    id: "lamu-heritage",
    title: "Lamu Heritage Escape",
    category: "Pure Culture",
    price: 900,
    image: "https://images.unsplash.com/photo-1581452140401-443b8110903b?auto=format&fit=crop&q=80&w=800",
    description: "Wander the ancient Swahili streets of Lamu Old Town. Dhow sails, artisan workshops, and coastal bliss.",
    longDescription: "Lamu is a place where time stands still. As a UNESCO World Heritage site, it boasts the oldest and best-preserved Swahili settlement in East Africa. Navigate the narrow streets by donkey, sail into the sunset on a traditional dhow, and experience the 'pole pole' (slowly slowly) rhythm of life.",
    highlights: ["Swahili Cooking Classes", "Sunset Dhow Sailing", "Artisan Woodcarving Tour", "Shela Beach Walk"],
    duration: "4 Days / 3 Nights"
  }
];
