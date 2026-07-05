/**
 * Learnix seed (§4). Idempotent — safe to re-run.
 * - Learning tracks catalogue (starter set, ⚠️ DECIDE final list).
 * - 5 placement questions per academic track (§5.6).
 * - 3 demo users: completed onboarding, mid-onboarding, guest.
 */
import { PrismaClient, TrackLevel } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

// Global learning-track catalogue. Learnix is worldwide, so the catalogue spans universal
// academics, in-demand skills, and widely-learned world languages. ⚠️ DECIDE final list.
const TRACKS = [
  // Academics (globally common school subjects)
  { slug: 'mathematics', title: 'Mathematics', category: 'academics', sortOrder: 1 },
  { slug: 'biology', title: 'Biology', category: 'academics', sortOrder: 2 },
  { slug: 'chemistry', title: 'Chemistry', category: 'academics', sortOrder: 3 },
  { slug: 'physics', title: 'Physics', category: 'academics', sortOrder: 4 },
  { slug: 'general-knowledge', title: 'General Knowledge', category: 'academics', sortOrder: 5 },
  // Skills
  { slug: 'coding-tech', title: 'Coding & Tech', category: 'skills', sortOrder: 6 },
  { slug: 'business-finance', title: 'Business & Finance', category: 'skills', sortOrder: 7 },
  // World languages (language learning worldwide, Duolingo-style)
  { slug: 'english', title: 'English', category: 'languages', sortOrder: 8 },
  { slug: 'spanish', title: 'Spanish', category: 'languages', sortOrder: 9 },
  { slug: 'french', title: 'French', category: 'languages', sortOrder: 10 },
  { slug: 'kiswahili', title: 'Kiswahili', category: 'languages', sortOrder: 11 },
  { slug: 'mandarin', title: 'Mandarin Chinese', category: 'languages', sortOrder: 12 },
  { slug: 'arabic', title: 'Arabic', category: 'languages', sortOrder: 13 },
];

// 5 questions per track, spread across difficulty bands so grading maps to levels.
// Content is deliberately simple/representative; real item banks land with the lesson build.
function questionsFor(slug: string) {
  const bank: Record<string, Array<{ p: string; o: string[]; a: number; l: TrackLevel }>> = {
    mathematics: [
      { p: 'What is 7 + 6?', o: ['11', '12', '13', '14'], a: 2, l: 'BEGINNER' },
      { p: 'What is 9 × 8?', o: ['63', '72', '81', '64'], a: 1, l: 'BEGINNER' },
      { p: 'Solve for x: 2x + 3 = 11', o: ['2', '3', '4', '5'], a: 2, l: 'INTERMEDIATE' },
      { p: 'What is 25% of 240?', o: ['48', '60', '55', '65'], a: 1, l: 'INTERMEDIATE' },
      { p: 'The derivative of x² is:', o: ['x', '2x', 'x²', '2'], a: 1, l: 'CONFIDENT' },
    ],
    english: [
      { p: 'Choose the correct plural of "child":', o: ['childs', 'childes', 'children', 'child'], a: 2, l: 'BEGINNER' },
      { p: 'Pick the verb: "The dog runs fast."', o: ['dog', 'runs', 'fast', 'the'], a: 1, l: 'BEGINNER' },
      { p: 'Which is a synonym for "happy"?', o: ['sad', 'joyful', 'angry', 'tired'], a: 1, l: 'INTERMEDIATE' },
      { p: 'Identify the tense: "She had eaten."', o: ['present', 'past perfect', 'future', 'present perfect'], a: 1, l: 'INTERMEDIATE' },
      { p: '"Ubiquitous" most nearly means:', o: ['rare', 'everywhere', 'hidden', 'ancient'], a: 1, l: 'CONFIDENT' },
    ],
    kiswahili: [
      { p: '"Habari" means:', o: ['Goodbye', 'News/Hello', 'Please', 'Sorry'], a: 1, l: 'BEGINNER' },
      { p: 'Neno "kitabu" wingi wake ni:', o: ['makitabu', 'vitabu', 'kitabu', 'vyabu'], a: 1, l: 'BEGINNER' },
      { p: '"Asante sana" means:', o: ['See you', 'Thank you very much', 'Good morning', 'Welcome'], a: 1, l: 'INTERMEDIATE' },
      { p: 'Chagua kivumishi: "Mtoto mzuri anacheza."', o: ['mtoto', 'mzuri', 'anacheza', 'na'], a: 1, l: 'INTERMEDIATE' },
      { p: 'Methali "Haraka haraka..." inaishaje?', o: ['ina baraka', 'haina baraka', 'ni nzuri', 'ni mbaya'], a: 1, l: 'CONFIDENT' },
    ],
    biology: [
      { p: 'The powerhouse of the cell is the:', o: ['nucleus', 'ribosome', 'mitochondrion', 'membrane'], a: 2, l: 'BEGINNER' },
      { p: 'Plants make food through:', o: ['respiration', 'photosynthesis', 'digestion', 'osmosis'], a: 1, l: 'BEGINNER' },
      { p: 'DNA is found mainly in the:', o: ['cytoplasm', 'nucleus', 'cell wall', 'vacuole'], a: 1, l: 'INTERMEDIATE' },
      { p: 'Which blood cells fight infection?', o: ['red', 'white', 'platelets', 'plasma'], a: 1, l: 'INTERMEDIATE' },
      { p: 'The enzyme that unwinds DNA is:', o: ['ligase', 'helicase', 'polymerase', 'primase'], a: 1, l: 'CONFIDENT' },
    ],
    chemistry: [
      { p: 'The chemical symbol for water is:', o: ['CO2', 'H2O', 'O2', 'NaCl'], a: 1, l: 'BEGINNER' },
      { p: 'How many protons does hydrogen have?', o: ['0', '1', '2', '3'], a: 1, l: 'BEGINNER' },
      { p: 'A pH of 7 is:', o: ['acidic', 'neutral', 'basic', 'salty'], a: 1, l: 'INTERMEDIATE' },
      { p: 'Table salt is:', o: ['KCl', 'NaCl', 'CaCO3', 'HCl'], a: 1, l: 'INTERMEDIATE' },
      { p: "Avogadro's number is approximately:", o: ['6.02×10²³', '3.14', '9.8', '1.6×10⁻¹⁹'], a: 0, l: 'CONFIDENT' },
    ],
    physics: [
      { p: 'The unit of force is the:', o: ['joule', 'newton', 'watt', 'pascal'], a: 1, l: 'BEGINNER' },
      { p: 'Speed = distance ÷ ?', o: ['mass', 'time', 'force', 'energy'], a: 1, l: 'BEGINNER' },
      { p: "Earth's gravity is about:", o: ['5.5 m/s²', '9.8 m/s²', '12 m/s²', '3 m/s²'], a: 1, l: 'INTERMEDIATE' },
      { p: 'Power is measured in:', o: ['newtons', 'watts', 'joules', 'amps'], a: 1, l: 'INTERMEDIATE' },
      { p: "Ohm's law states V =", o: ['I/R', 'IR', 'I+R', 'R/I'], a: 1, l: 'CONFIDENT' },
    ],
    'coding-tech': [
      { p: 'HTML is used to:', o: ['style pages', 'structure pages', 'query databases', 'run servers'], a: 1, l: 'BEGINNER' },
      { p: 'Which is a programming language?', o: ['HTTP', 'Python', 'JSON', 'HTML'], a: 1, l: 'BEGINNER' },
      { p: 'A variable stores:', o: ['nothing', 'a value', 'only numbers', 'only text'], a: 1, l: 'INTERMEDIATE' },
      { p: 'What does "if" do in code?', o: ['loops', 'branches on a condition', 'imports', 'prints'], a: 1, l: 'INTERMEDIATE' },
      { p: 'Big-O of binary search is:', o: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'], a: 1, l: 'CONFIDENT' },
    ],
    'business-finance': [
      { p: 'Revenue minus costs equals:', o: ['assets', 'profit', 'equity', 'tax'], a: 1, l: 'BEGINNER' },
      { p: 'Money you owe is a:', o: ['asset', 'liability', 'profit', 'dividend'], a: 1, l: 'BEGINNER' },
      { p: 'Interest earned on interest is:', o: ['simple', 'compound', 'flat', 'nominal'], a: 1, l: 'INTERMEDIATE' },
      { p: 'A balance sheet shows:', o: ['cash flow', 'assets & liabilities', 'sales only', 'taxes'], a: 1, l: 'INTERMEDIATE' },
      { p: 'ROI stands for:', o: ['Rate of Inflation', 'Return on Investment', 'Risk of Insolvency', 'Ratio of Income'], a: 1, l: 'CONFIDENT' },
    ],
    'general-knowledge': [
      { p: 'How many continents are there?', o: ['5', '6', '7', '8'], a: 2, l: 'BEGINNER' },
      { p: 'Which is the largest planet in our solar system?', o: ['Earth', 'Jupiter', 'Mars', 'Saturn'], a: 1, l: 'BEGINNER' },
      { p: 'The Great Wall is located in:', o: ['India', 'China', 'Japan', 'Korea'], a: 1, l: 'INTERMEDIATE' },
      { p: 'The largest ocean is the:', o: ['Atlantic', 'Indian', 'Pacific', 'Arctic'], a: 2, l: 'INTERMEDIATE' },
      { p: 'The United Nations was founded in:', o: ['1919', '1945', '1963', '1950'], a: 1, l: 'CONFIDENT' },
    ],
    spanish: [
      { p: '"Hola" means:', o: ['Goodbye', 'Hello', 'Please', 'Thanks'], a: 1, l: 'BEGINNER' },
      { p: 'How do you say "thank you"?', o: ['Por favor', 'Gracias', 'De nada', 'Adiós'], a: 1, l: 'BEGINNER' },
      { p: 'Choose the plural: "el libro" →', o: ['los libros', 'las libro', 'el libros', 'la libros'], a: 0, l: 'INTERMEDIATE' },
      { p: '"Estoy cansado" means:', o: ['I am happy', 'I am tired', 'I am hungry', 'I am cold'], a: 1, l: 'INTERMEDIATE' },
      { p: 'The subjunctive of "hablar" (that I speak) is:', o: ['hablo', 'hable', 'hablé', 'hablaré'], a: 1, l: 'CONFIDENT' },
    ],
    french: [
      { p: '"Bonjour" means:', o: ['Goodbye', 'Hello', 'Sorry', 'Yes'], a: 1, l: 'BEGINNER' },
      { p: 'How do you say "thank you"?', o: ['Merci', "S'il vous plaît", 'Pardon', 'Au revoir'], a: 0, l: 'BEGINNER' },
      { p: 'Choose the correct article: "___ pomme" (apple, fem.)', o: ['le', 'la', 'les', 'un'], a: 1, l: 'INTERMEDIATE' },
      { p: '"Je suis fatigué" means:', o: ['I am hungry', 'I am tired', 'I am happy', 'I am late'], a: 1, l: 'INTERMEDIATE' },
      { p: 'The passé composé of "aller" (I went) is:', o: ['je vais', 'je suis allé', "j'allais", "j'irai"], a: 1, l: 'CONFIDENT' },
    ],
    mandarin: [
      { p: '"你好" (nǐ hǎo) means:', o: ['Goodbye', 'Hello', 'Thanks', 'Sorry'], a: 1, l: 'BEGINNER' },
      { p: 'How do you say "thank you"?', o: ['再见 (zàijiàn)', '谢谢 (xièxie)', '对不起 (duìbuqǐ)', '请 (qǐng)'], a: 1, l: 'BEGINNER' },
      { p: 'The number "three" is:', o: ['一 (yī)', '二 (èr)', '三 (sān)', '四 (sì)'], a: 2, l: 'INTERMEDIATE' },
      { p: '"我不知道" means:', o: ["I don't know", 'I know', 'I want', "I can't"], a: 0, l: 'INTERMEDIATE' },
      { p: 'The measure word for books (书) is:', o: ['个 (gè)', '本 (běn)', '只 (zhī)', '张 (zhāng)'], a: 1, l: 'CONFIDENT' },
    ],
    arabic: [
      { p: '"مرحبا" (marhaban) means:', o: ['Goodbye', 'Hello', 'Please', 'Sorry'], a: 1, l: 'BEGINNER' },
      { p: 'How do you say "thank you"?', o: ['شكرا (shukran)', 'من فضلك (min fadlik)', 'عفوا (afwan)', 'وداعا (wadaan)'], a: 0, l: 'BEGINNER' },
      { p: 'Arabic is written from:', o: ['left to right', 'right to left', 'top to bottom', 'either way'], a: 1, l: 'INTERMEDIATE' },
      { p: '"كتاب" (kitāb) means:', o: ['pen', 'book', 'house', 'water'], a: 1, l: 'INTERMEDIATE' },
      { p: 'The definite article in Arabic is:', o: ['al- (ال)', 'wa- (و)', 'bi- (ب)', 'li- (ل)'], a: 0, l: 'CONFIDENT' },
    ],
  };
  return bank[slug] ?? [];
}

const DEFAULT_NOTIFICATIONS = {
  push: { streak: true, social: true, product: true },
  email: { streak: true, social: false, product: true },
  sms: { streak: false, social: false, product: false },
};

async function main() {
  console.log('→ Seeding learning tracks...');
  for (const t of TRACKS) {
    const track = await prisma.learningTrack.upsert({
      where: { slug: t.slug },
      update: { title: t.title, category: t.category, sortOrder: t.sortOrder, isActive: true },
      create: { ...t, isActive: true },
    });

    const qs = questionsFor(t.slug);
    // Replace placement questions idempotently.
    await prisma.placementQuestion.deleteMany({ where: { trackId: track.id } });
    for (let i = 0; i < qs.length; i++) {
      const q = qs[i]!;
      await prisma.placementQuestion.create({
        data: {
          trackId: track.id,
          level: q.l,
          prompt: q.p,
          options: q.o,
          answerIdx: q.a,
          sortOrder: i,
        },
      });
    }
  }
  console.log(`  ✓ ${TRACKS.length} tracks + placement banks`);

  const pw = await argon2.hash('Passw0rd!demo', { type: argon2.argon2id });
  const coding = await prisma.learningTrack.findUniqueOrThrow({ where: { slug: 'coding-tech' } });
  const spanish = await prisma.learningTrack.findUniqueOrThrow({ where: { slug: 'spanish' } });

  // Demo user 1 — completed onboarding (US-based learner).
  console.log('→ Seeding demo users...');
  const u1 = await prisma.user.upsert({
    where: { username: 'demo_amina' },
    update: {},
    create: {
      username: 'demo_amina',
      email: 'amina@demo.learnix.test',
      emailVerifiedAt: new Date(),
      phone: '+14155550001',
      phoneVerifiedAt: new Date(),
      passwordHash: pw,
      ageBand: 'ADULT_18_24',
      profile: { create: { displayName: 'Amina', displayHandle: 'demo_amina', country: 'US', language: 'en', bio: 'Learning to code 🚀' } },
      preferences: { create: { dailyGoalMinutes: 15, reminderTime: '18:30', timezone: 'America/New_York', notifications: DEFAULT_NOTIFICATIONS } },
      onboarding: { create: { currentStep: 'plan_reveal', completedAt: new Date(), responses: { tracks: ['coding-tech', 'spanish'], motivation: 'career', level: 'confident', daily_goal: 15, age_band: 'ADULT_18_24' } } },
      streak: { create: { current: 4, longest: 9, lastActivityDate: new Date() } },
      tracks: {
        create: [
          { trackId: coding.id, level: 'CONFIDENT', placementScore: 80, isPrimary: true },
          { trackId: spanish.id, level: 'BEGINNER', placementScore: 30 },
        ],
      },
    },
  });

  // Demo user 2 — mid-onboarding minor (Kenya-based).
  const u2 = await prisma.user.upsert({
    where: { username: 'demo_brian' },
    update: {},
    create: {
      username: 'demo_brian',
      email: 'brian@demo.learnix.test',
      passwordHash: pw,
      ageBand: 'TEEN_13_17',
      isMinor: true,
      profile: { create: { displayName: 'Brian', displayHandle: 'demo_brian', country: 'KE', language: 'en', visibility: 'PRIVATE' } },
      preferences: { create: { timezone: 'Africa/Nairobi', notifications: DEFAULT_NOTIFICATIONS } },
      onboarding: { create: { currentStep: 'daily_goal', responses: { tracks: ['biology', 'chemistry'], motivation: 'exams', level: 'basics' } } },
    },
  });

  // Demo user 3 — guest.
  const u3 = await prisma.user.upsert({
    where: { username: 'learner_demo3' },
    update: {},
    create: {
      username: 'learner_demo3',
      isGuest: true,
      guestDeviceId: 'seed-device-hash-0003',
      onboarding: { create: { currentStep: 'tracks', responses: {} } },
    },
  });

  console.log(`  ✓ demo users: ${u1.username} (done), ${u2.username} (mid), ${u3.username} (guest)`);
  console.log('✅ Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
