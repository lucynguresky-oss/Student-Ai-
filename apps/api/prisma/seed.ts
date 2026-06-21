import { PrismaClient, Stage } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

// ─── Helpers ─────────────────────────────────────────────────
type SubjectDef = {
  key: string;
  canonicalName: string;
  nameEn: string;
  domain: string;
  nameSw?: string;
};

async function upsertSubject(s: SubjectDef) {
  return prisma.subject.upsert({
    where: { key: s.key },
    update: {},
    create: {
      key: s.key,
      canonicalName: s.canonicalName,
      nameEn: s.nameEn,
      domain: s.domain,
      nameSw: s.nameSw,
    },
  });
}

async function main() {
  console.log('🌱 Seeding Learnix database v3.0 (Global Expansion — Addendum G)...\n');

  // ─── Clean Database ─────────────────────────────────────────
  console.log('🧹 Cleaning existing database...');
  await prisma.curriculumSubjectAlias.deleteMany();
  await prisma.userBadge.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.xpEvent.deleteMany();
  await prisma.streak.deleteMany();
  await prisma.attempt.deleteMany();
  await prisma.question.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.learningPath.deleteMany();
  await prisma.topicMastery.deleteMany();
  await prisma.topic.deleteMany();
  await prisma.curriculumSubject.deleteMany();
  await prisma.educationLevel.deleteMany();
  await prisma.curriculum.deleteMany();
  await prisma.country.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.locale.deleteMany();
  await prisma.learnerProfile.deleteMany();
  await prisma.session.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.role.deleteMany();
  await prisma.user.deleteMany();
  console.log('🧹 Database clean completed.\n');

  // ─── Locales ──────────────────────────────────────────────
  console.log('🌐 Seeding locales...');
  const LOCALES = [
    // Tier 1 — complete at launch
    { code: 'en',      englishName: 'English',                      nativeName: 'English',              rtl: false, status: 'complete' },
    { code: 'en-GB',   englishName: 'English (UK)',                  nativeName: 'English (UK)',          rtl: false, status: 'complete' },
    { code: 'en-KE',   englishName: 'English (Kenya)',               nativeName: 'English (Kenya)',       rtl: false, status: 'complete' },
    { code: 'sw',      englishName: 'Swahili',                       nativeName: 'Kiswahili',             rtl: false, status: 'complete' },
    { code: 'fr',      englishName: 'French',                        nativeName: 'Français',              rtl: false, status: 'complete' },
    { code: 'ar',      englishName: 'Arabic (Modern Standard)',       nativeName: 'العربية',              rtl: true,  status: 'complete' },
    { code: 'hi',      englishName: 'Hindi',                         nativeName: 'हिन्दी',                rtl: false, status: 'complete' },
    { code: 'es',      englishName: 'Spanish',                       nativeName: 'Español',              rtl: false, status: 'complete' },
    { code: 'zh-Hans', englishName: 'Chinese (Simplified)',           nativeName: '中文（简体）',           rtl: false, status: 'complete' },
    { code: 'pt-BR',   englishName: 'Portuguese (Brazil)',            nativeName: 'Português (Brasil)',   rtl: false, status: 'complete' },
    { code: 'pt-PT',   englishName: 'Portuguese (Portugal)',          nativeName: 'Português (Portugal)', rtl: false, status: 'complete' },
    { code: 'ru',      englishName: 'Russian',                        nativeName: 'Русский',              rtl: false, status: 'complete' },
    { code: 'ur',      englishName: 'Urdu',                           nativeName: 'اردو',                 rtl: true,  status: 'complete' },
    { code: 'id',      englishName: 'Indonesian',                     nativeName: 'Bahasa Indonesia',     rtl: false, status: 'complete' },
    { code: 'de',      englishName: 'German',                         nativeName: 'Deutsch',              rtl: false, status: 'complete' },
    { code: 'ja',      englishName: 'Japanese',                       nativeName: '日本語',                rtl: false, status: 'complete' },
    { code: 'bn',      englishName: 'Bengali',                        nativeName: 'বাংলা',                rtl: false, status: 'complete' },

    // Tier 2 — fast follow
    { code: 'tr',      englishName: 'Turkish',                        nativeName: 'Türkçe',              rtl: false, status: 'draft' },
    { code: 'ko',      englishName: 'Korean',                         nativeName: '한국어',               rtl: false, status: 'draft' },
    { code: 'vi',      englishName: 'Vietnamese',                     nativeName: 'Tiếng Việt',          rtl: false, status: 'draft' },
    { code: 'it',      englishName: 'Italian',                        nativeName: 'Italiano',            rtl: false, status: 'draft' },
    { code: 'th',      englishName: 'Thai',                           nativeName: 'ภาษาไทย',             rtl: false, status: 'draft' },
    { code: 'fa',      englishName: 'Persian / Farsi',                nativeName: 'فارسی',               rtl: true,  status: 'draft' },
    { code: 'ta',      englishName: 'Tamil',                          nativeName: 'தமிழ்',               rtl: false, status: 'draft' },
    { code: 'te',      englishName: 'Telugu',                         nativeName: 'తెలుగు',              rtl: false, status: 'draft' },
    { code: 'mr',      englishName: 'Marathi',                        nativeName: 'मराठी',               rtl: false, status: 'draft' },
    { code: 'pl',      englishName: 'Polish',                         nativeName: 'Polski',              rtl: false, status: 'draft' },
    { code: 'uk',      englishName: 'Ukrainian',                      nativeName: 'Українська',          rtl: false, status: 'draft' },
    { code: 'nl',      englishName: 'Dutch',                          nativeName: 'Nederlands',          rtl: false, status: 'draft' },
    { code: 'fil',     englishName: 'Filipino / Tagalog',             nativeName: 'Filipino',            rtl: false, status: 'draft' },
    { code: 'ha',      englishName: 'Hausa',                          nativeName: 'Hausa',               rtl: false, status: 'draft' },
    { code: 'he',      englishName: 'Hebrew',                         nativeName: 'עברית',               rtl: true,  status: 'draft' },

    // Tier 3 — Africa & regional expansion
    { code: 'am',      englishName: 'Amharic',                        nativeName: 'አማርኛ',               rtl: false, status: 'draft' },
    { code: 'yo',      englishName: 'Yoruba',                         nativeName: 'Yorùbá',              rtl: false, status: 'draft' },
    { code: 'ig',      englishName: 'Igbo',                           nativeName: 'Igbo',                rtl: false, status: 'draft' },
    { code: 'zu',      englishName: 'Zulu',                           nativeName: 'isiZulu',             rtl: false, status: 'draft' },
    { code: 'xh',      englishName: 'Xhosa',                          nativeName: 'isiXhosa',            rtl: false, status: 'draft' },
    { code: 'af',      englishName: 'Afrikaans',                      nativeName: 'Afrikaans',           rtl: false, status: 'draft' },
    { code: 'so',      englishName: 'Somali',                         nativeName: 'Soomaali',            rtl: false, status: 'draft' },
    { code: 'rw',      englishName: 'Kinyarwanda',                    nativeName: 'Ikinyarwanda',        rtl: false, status: 'draft' },
    { code: 'lg',      englishName: 'Luganda',                        nativeName: 'Luganda',             rtl: false, status: 'draft' },
    { code: 'om',      englishName: 'Oromo',                          nativeName: 'Afaan Oromoo',        rtl: false, status: 'draft' },
    { code: 'sn',      englishName: 'Shona',                          nativeName: 'chiShona',            rtl: false, status: 'draft' },
    { code: 'ms',      englishName: 'Malay',                          nativeName: 'Bahasa Melayu',       rtl: false, status: 'draft' },
    { code: 'km',      englishName: 'Khmer',                          nativeName: 'ភាសាខ្មែរ',           rtl: false, status: 'draft' },
    { code: 'ne',      englishName: 'Nepali',                         nativeName: 'नेपाली',              rtl: false, status: 'draft' },
    { code: 'si',      englishName: 'Sinhala',                        nativeName: 'සිංහල',               rtl: false, status: 'draft' },
    { code: 'ps',      englishName: 'Pashto',                         nativeName: 'پښتو',                rtl: true,  status: 'draft' },
    { code: 'ku',      englishName: 'Kurdish',                        nativeName: 'Kurdî',               rtl: false, status: 'draft' },
    { code: 'zh-Hant', englishName: 'Chinese (Traditional)',          nativeName: '中文（繁體）',         rtl: false, status: 'draft' },
    { code: 'el',      englishName: 'Greek',                          nativeName: 'Ελληνικά',            rtl: false, status: 'draft' },
    { code: 'cs',      englishName: 'Czech',                          nativeName: 'Čeština',             rtl: false, status: 'draft' },
    { code: 'ro',      englishName: 'Romanian',                       nativeName: 'Română',              rtl: false, status: 'draft' },
    { code: 'hu',      englishName: 'Hungarian',                      nativeName: 'Magyar',              rtl: false, status: 'draft' },
    { code: 'sv',      englishName: 'Swedish',                        nativeName: 'Svenska',             rtl: false, status: 'draft' },
  ];

  for (const loc of LOCALES) {
    await prisma.locale.upsert({
      where: { code: loc.code },
      update: {},
      create: loc,
    });
  }
  console.log(`  ✅ ${LOCALES.length} locales seeded (${LOCALES.filter(l => l.status === 'complete').length} complete, rest draft).\n`);

  // ─── Roles ─────────────────────────────────────────────────
  console.log('🎭 Creating roles...');
  const roleKeys = [
    'STUDENT', 'TEACHER', 'CREATOR', 'PARENT', 'INSTITUTION_ADMIN', 'MODERATOR', 'SUPER_ADMIN',
  ];
  const createdRoles: Record<string, string> = {};
  for (const key of roleKeys) {
    const role = await prisma.role.upsert({ where: { key }, update: {}, create: { key } });
    createdRoles[key] = role.id;
  }
  console.log('✅ Roles created.\n');

  // ─── Canonical Subject Catalogue (§G3) ───────────────────
  console.log('📚 Seeding canonical subject catalogue...');
  const SUBJECTS: SubjectDef[] = [
    // Natural Sciences
    { key: 'BIO',           canonicalName: 'Biology',                   nameEn: 'Biology',                   domain: 'Natural Sciences',   nameSw: 'Biolojia' },
    { key: 'CHE',           canonicalName: 'Chemistry',                 nameEn: 'Chemistry',                 domain: 'Natural Sciences',   nameSw: 'Kemia' },
    { key: 'PHY',           canonicalName: 'Physics',                   nameEn: 'Physics',                   domain: 'Natural Sciences',   nameSw: 'Fizikia' },
    { key: 'SCI_COMBINED',  canonicalName: 'Combined/Integrated Science',nameEn: 'Combined Science',          domain: 'Natural Sciences' },
    { key: 'EARTH_SCI',     canonicalName: 'Earth Science',             nameEn: 'Earth Science',             domain: 'Natural Sciences' },
    { key: 'ENV_SCI',       canonicalName: 'Environmental Science',     nameEn: 'Environmental Science',     domain: 'Natural Sciences',   nameSw: 'Sayansi ya Mazingira' },
    { key: 'ASTRONOMY',     canonicalName: 'Astronomy',                 nameEn: 'Astronomy',                 domain: 'Natural Sciences' },
    { key: 'GEOLOGY',       canonicalName: 'Geology',                   nameEn: 'Geology',                   domain: 'Natural Sciences' },
    { key: 'MARINE_SCI',    canonicalName: 'Marine Science',            nameEn: 'Marine Science',            domain: 'Natural Sciences' },
    { key: 'AGRI_SCI',      canonicalName: 'Agricultural Science',      nameEn: 'Agricultural Science',      domain: 'Natural Sciences',   nameSw: 'Kilimo' },
    // Mathematics
    { key: 'MAT',           canonicalName: 'Mathematics',               nameEn: 'Mathematics',               domain: 'Mathematics',        nameSw: 'Hisabati' },
    { key: 'MATH_FURTHER',  canonicalName: 'Additional/Further Mathematics', nameEn: 'Further Mathematics',  domain: 'Mathematics' },
    { key: 'MATH_PURE',     canonicalName: 'Pure Mathematics',          nameEn: 'Pure Mathematics',          domain: 'Mathematics' },
    { key: 'MATH_APPLIED',  canonicalName: 'Applied Mathematics',       nameEn: 'Applied Mathematics',       domain: 'Mathematics' },
    { key: 'STATS',         canonicalName: 'Statistics',                nameEn: 'Statistics',                domain: 'Mathematics' },
    { key: 'CALCULUS',      canonicalName: 'Calculus',                  nameEn: 'Calculus',                  domain: 'Mathematics' },
    { key: 'DISCRETE_MAT',  canonicalName: 'Discrete Mathematics',      nameEn: 'Discrete Mathematics',      domain: 'Mathematics' },
    { key: 'FIN_MAT',       canonicalName: 'Financial Mathematics',     nameEn: 'Financial Mathematics',     domain: 'Mathematics' },
    // Computing & Technology
    { key: 'CS',            canonicalName: 'Computer Science',          nameEn: 'Computer Science',          domain: 'Computing & Technology' },
    { key: 'ICT',           canonicalName: 'ICT / Computing',           nameEn: 'ICT / Computing',           domain: 'Computing & Technology',  nameSw: 'Teknolojia ya Habari' },
    { key: 'CODING',        canonicalName: 'Programming/Coding',        nameEn: 'Programming & Coding',      domain: 'Computing & Technology' },
    { key: 'DATA_SCI',      canonicalName: 'Data Science',              nameEn: 'Data Science',              domain: 'Computing & Technology' },
    { key: 'AI_SUBJECT',    canonicalName: 'Artificial Intelligence',   nameEn: 'Artificial Intelligence',   domain: 'Computing & Technology' },
    { key: 'CYBERSEC',      canonicalName: 'Cybersecurity',             nameEn: 'Cybersecurity',             domain: 'Computing & Technology' },
    { key: 'ROBOTICS',      canonicalName: 'Robotics',                  nameEn: 'Robotics',                  domain: 'Computing & Technology' },
    { key: 'WEB_DEV',       canonicalName: 'Web/Software Development',  nameEn: 'Web & Software Development',domain: 'Computing & Technology' },
    { key: 'INFO_SYS',      canonicalName: 'Information Systems',       nameEn: 'Information Systems',       domain: 'Computing & Technology' },
    // Languages & Literature
    { key: 'ENG',           canonicalName: 'English Language',          nameEn: 'English Language',          domain: 'Languages & Literature', nameSw: 'Kiingereza' },
    { key: 'ENG_LIT',       canonicalName: 'English Literature',        nameEn: 'English Literature',        domain: 'Languages & Literature' },
    { key: 'KISWAHILI',     canonicalName: 'Swahili',                   nameEn: 'Kiswahili',                 domain: 'Languages & Literature', nameSw: 'Kiswahili' },
    { key: 'FRENCH_LANG',   canonicalName: 'French',                    nameEn: 'French',                    domain: 'Languages & Literature' },
    { key: 'SPANISH_LANG',  canonicalName: 'Spanish',                   nameEn: 'Spanish',                   domain: 'Languages & Literature' },
    { key: 'MANDARIN_LANG', canonicalName: 'Mandarin',                  nameEn: 'Mandarin Chinese',          domain: 'Languages & Literature' },
    { key: 'ARABIC_LANG',   canonicalName: 'Arabic',                    nameEn: 'Arabic',                    domain: 'Languages & Literature' },
    { key: 'HINDI_LANG',    canonicalName: 'Hindi',                     nameEn: 'Hindi',                     domain: 'Languages & Literature' },
    { key: 'GERMAN_LANG',   canonicalName: 'German',                    nameEn: 'German',                    domain: 'Languages & Literature' },
    { key: 'PORTUGUESE_LANG',canonicalName: 'Portuguese',               nameEn: 'Portuguese',                domain: 'Languages & Literature' },
    { key: 'RUSSIAN_LANG',  canonicalName: 'Russian',                   nameEn: 'Russian',                   domain: 'Languages & Literature' },
    { key: 'LATIN',         canonicalName: 'Latin',                     nameEn: 'Latin',                     domain: 'Languages & Literature' },
    { key: 'WORLD_LANG',    canonicalName: 'World Languages',           nameEn: 'World Languages',           domain: 'Languages & Literature' },
    { key: 'LITERATURE',    canonicalName: 'Literature (general)',       nameEn: 'Literature',                domain: 'Languages & Literature' },
    { key: 'LINGUISTICS',   canonicalName: 'Linguistics',               nameEn: 'Linguistics',               domain: 'Languages & Literature' },
    { key: 'CREATIVE_WR',   canonicalName: 'Creative Writing',          nameEn: 'Creative Writing',          domain: 'Languages & Literature' },
    // Humanities & Social Sciences
    { key: 'HIST',          canonicalName: 'History',                   nameEn: 'History',                   domain: 'Humanities & Social Sciences', nameSw: 'Historia' },
    { key: 'GEO',           canonicalName: 'Geography',                 nameEn: 'Geography',                 domain: 'Humanities & Social Sciences', nameSw: 'Jiografia' },
    { key: 'ECON',          canonicalName: 'Economics',                 nameEn: 'Economics',                 domain: 'Humanities & Social Sciences', nameSw: 'Uchumi' },
    { key: 'CIVICS',        canonicalName: 'Civics / Government / Citizenship', nameEn: 'Civics & Government', domain: 'Humanities & Social Sciences' },
    { key: 'SOCIOLOGY',     canonicalName: 'Sociology',                 nameEn: 'Sociology',                 domain: 'Humanities & Social Sciences' },
    { key: 'PSYCHOLOGY',    canonicalName: 'Psychology',                nameEn: 'Psychology',                domain: 'Humanities & Social Sciences' },
    { key: 'PHILOSOPHY',    canonicalName: 'Philosophy',                nameEn: 'Philosophy',                domain: 'Humanities & Social Sciences' },
    { key: 'ANTHROPOLOGY',  canonicalName: 'Anthropology',              nameEn: 'Anthropology',              domain: 'Humanities & Social Sciences' },
    { key: 'POLITICAL_SCI', canonicalName: 'Political Science',         nameEn: 'Political Science',         domain: 'Humanities & Social Sciences' },
    { key: 'RELIGIOUS_ED',  canonicalName: 'Religious Studies / Religious Education', nameEn: 'Religious Studies', domain: 'Humanities & Social Sciences', nameSw: 'CRE/IRE' },
    { key: 'ETHICS',        canonicalName: 'Ethics',                    nameEn: 'Ethics',                    domain: 'Humanities & Social Sciences' },
    { key: 'LAW_SUBJ',      canonicalName: 'Law (subject)',             nameEn: 'Law',                       domain: 'Humanities & Social Sciences' },
    { key: 'GLOBAL_PERSP',  canonicalName: 'Global Perspectives',       nameEn: 'Global Perspectives',       domain: 'Humanities & Social Sciences' },
    // Business & Commerce
    { key: 'BUSINESS',      canonicalName: 'Business Studies',          nameEn: 'Business Studies',          domain: 'Business & Commerce',   nameSw: 'Biashara' },
    { key: 'ACCOUNTING',    canonicalName: 'Accounting',                nameEn: 'Accounting',                domain: 'Business & Commerce' },
    { key: 'FINANCE',       canonicalName: 'Finance',                   nameEn: 'Finance',                   domain: 'Business & Commerce' },
    { key: 'ENTREPRENEUR',  canonicalName: 'Entrepreneurship',          nameEn: 'Entrepreneurship',          domain: 'Business & Commerce' },
    { key: 'MARKETING',     canonicalName: 'Marketing',                 nameEn: 'Marketing',                 domain: 'Business & Commerce' },
    { key: 'MANAGEMENT',    canonicalName: 'Management',                nameEn: 'Management',                domain: 'Business & Commerce' },
    { key: 'COMMERCE',      canonicalName: 'Commerce',                  nameEn: 'Commerce',                  domain: 'Business & Commerce' },
    // Arts & Design
    { key: 'VISUAL_ARTS',   canonicalName: 'Visual Arts',               nameEn: 'Visual Arts',               domain: 'Arts & Design' },
    { key: 'FINE_ART',      canonicalName: 'Fine Art',                  nameEn: 'Fine Art',                  domain: 'Arts & Design' },
    { key: 'MUSIC',         canonicalName: 'Music',                     nameEn: 'Music',                     domain: 'Arts & Design',          nameSw: 'Muziki' },
    { key: 'DRAMA',         canonicalName: 'Drama / Theatre',           nameEn: 'Drama & Theatre',           domain: 'Arts & Design' },
    { key: 'DANCE',         canonicalName: 'Dance',                     nameEn: 'Dance',                     domain: 'Arts & Design' },
    { key: 'DESIGN_TECH',   canonicalName: 'Design & Technology',       nameEn: 'Design & Technology',       domain: 'Arts & Design' },
    { key: 'GRAPHIC_DESIGN',canonicalName: 'Graphic Design',            nameEn: 'Graphic Design',            domain: 'Arts & Design' },
    { key: 'MEDIA_STUDIES', canonicalName: 'Media Studies',             nameEn: 'Media Studies',             domain: 'Arts & Design' },
    { key: 'FILM_MEDIA',    canonicalName: 'Film/Media Production',     nameEn: 'Film & Media Production',   domain: 'Arts & Design' },
    { key: 'PHOTOGRAPHY',   canonicalName: 'Photography',               nameEn: 'Photography',               domain: 'Arts & Design' },
    { key: 'ARCHITECTURE_INTRO', canonicalName: 'Architecture (intro)', nameEn: 'Architecture (intro)',      domain: 'Arts & Design' },
    // Health, PE & Life Skills
    { key: 'PE',            canonicalName: 'Physical Education',        nameEn: 'Physical Education',        domain: 'Health, PE & Life Skills',  nameSw: 'Michezo' },
    { key: 'HEALTH_SCI',    canonicalName: 'Health Science',            nameEn: 'Health Science',            domain: 'Health, PE & Life Skills' },
    { key: 'NUTRITION',     canonicalName: 'Nutrition & Food Science',  nameEn: 'Nutrition & Food Science',  domain: 'Health, PE & Life Skills',  nameSw: 'Sayansi ya Chakula' },
    { key: 'SPORTS_SCI',    canonicalName: 'Sports Science',            nameEn: 'Sports Science',            domain: 'Health, PE & Life Skills' },
    { key: 'HOME_SCI',      canonicalName: 'Home Science / Home Economics', nameEn: 'Home Science',         domain: 'Health, PE & Life Skills',  nameSw: 'Sayansi ya Nyumba' },
    { key: 'LIFE_SKILLS',   canonicalName: 'Life Skills',               nameEn: 'Life Skills',               domain: 'Health, PE & Life Skills',  nameSw: 'Stadi za Maisha' },
    { key: 'WELLBEING',     canonicalName: 'Psychology of Wellbeing',   nameEn: 'Psychology of Wellbeing',   domain: 'Health, PE & Life Skills' },
    // Applied & Vocational
    { key: 'AGRI',          canonicalName: 'Agriculture',               nameEn: 'Agriculture',               domain: 'Applied & Vocational',  nameSw: 'Kilimo' },
    { key: 'ENGINEERING_INTRO', canonicalName: 'Engineering (intro)',   nameEn: 'Engineering (intro)',       domain: 'Applied & Vocational' },
    { key: 'ELECTRICAL',    canonicalName: 'Electrical/Electronics',    nameEn: 'Electrical & Electronics',  domain: 'Applied & Vocational' },
    { key: 'AUTOMOTIVE',    canonicalName: 'Automotive',                nameEn: 'Automotive',                domain: 'Applied & Vocational' },
    { key: 'CONSTRUCTION',  canonicalName: 'Construction/Building',     nameEn: 'Construction & Building',   domain: 'Applied & Vocational' },
    { key: 'HOSPITALITY',   canonicalName: 'Hospitality & Tourism',     nameEn: 'Hospitality & Tourism',     domain: 'Applied & Vocational' },
    { key: 'CATERING',      canonicalName: 'Catering',                  nameEn: 'Catering',                  domain: 'Applied & Vocational' },
    { key: 'FASHION',       canonicalName: 'Fashion & Textiles',        nameEn: 'Fashion & Textiles',        domain: 'Applied & Vocational' },
    { key: 'WOODWORK',      canonicalName: 'Woodwork/Metalwork',        nameEn: 'Woodwork & Metalwork',      domain: 'Applied & Vocational' },
    { key: 'CARPENTRY',     canonicalName: 'Carpentry',                 nameEn: 'Carpentry',                 domain: 'Applied & Vocational' },
    // Tertiary / Professional
    { key: 'MEDICINE',      canonicalName: 'Medicine',                  nameEn: 'Medicine',                  domain: 'Tertiary / Professional' },
    { key: 'NURSING',       canonicalName: 'Nursing',                   nameEn: 'Nursing',                   domain: 'Tertiary / Professional' },
    { key: 'PHARMACY',      canonicalName: 'Pharmacy',                  nameEn: 'Pharmacy',                  domain: 'Tertiary / Professional' },
    { key: 'DENTISTRY',     canonicalName: 'Dentistry',                 nameEn: 'Dentistry',                 domain: 'Tertiary / Professional' },
    { key: 'PUBLIC_HEALTH', canonicalName: 'Public Health',             nameEn: 'Public Health',             domain: 'Tertiary / Professional' },
    { key: 'MECH_ENG',      canonicalName: 'Mechanical Engineering',    nameEn: 'Mechanical Engineering',    domain: 'Tertiary / Professional' },
    { key: 'CIVIL_ENG',     canonicalName: 'Civil Engineering',         nameEn: 'Civil Engineering',         domain: 'Tertiary / Professional' },
    { key: 'ELEC_ENG',      canonicalName: 'Electrical Engineering',    nameEn: 'Electrical Engineering',    domain: 'Tertiary / Professional' },
    { key: 'CHEM_ENG',      canonicalName: 'Chemical Engineering',      nameEn: 'Chemical Engineering',      domain: 'Tertiary / Professional' },
    { key: 'SW_ENG',        canonicalName: 'Software Engineering',      nameEn: 'Software Engineering',      domain: 'Tertiary / Professional' },
    { key: 'ARCHITECTURE',  canonicalName: 'Architecture',              nameEn: 'Architecture',              domain: 'Tertiary / Professional' },
    { key: 'LAW_DEGREE',    canonicalName: 'Law (LLB)',                 nameEn: 'Law (LLB)',                 domain: 'Tertiary / Professional' },
    { key: 'ACCA_CPA',      canonicalName: 'Accounting/ACCA/CPA',       nameEn: 'Accounting / ACCA / CPA',   domain: 'Tertiary / Professional' },
    { key: 'CS_DEGREE',     canonicalName: 'Computer Science (degree)', nameEn: 'Computer Science (degree)', domain: 'Tertiary / Professional' },
    { key: 'DATA_SCI_DEG',  canonicalName: 'Data Science (degree)',     nameEn: 'Data Science (degree)',     domain: 'Tertiary / Professional' },
    { key: 'ECON_DEGREE',   canonicalName: 'Economics (degree)',        nameEn: 'Economics (degree)',         domain: 'Tertiary / Professional' },
    { key: 'EDUCATION',     canonicalName: 'Education/Pedagogy',        nameEn: 'Education & Pedagogy',      domain: 'Tertiary / Professional' },
    { key: 'VETERINARY',    canonicalName: 'Veterinary Science',        nameEn: 'Veterinary Science',        domain: 'Tertiary / Professional' },
    { key: 'AGRI_DEGREE',   canonicalName: 'Agriculture (degree)',      nameEn: 'Agriculture (degree)',      domain: 'Tertiary / Professional' },
    { key: 'MBA',           canonicalName: 'Business/MBA foundations',  nameEn: 'Business / MBA Foundations',domain: 'Tertiary / Professional' },
    { key: 'VETSCI',        canonicalName: 'Veterinary Science',        nameEn: 'Veterinary Science',        domain: 'Tertiary / Professional' },
  ];

  const subjectMap: Record<string, string> = {};
  for (const s of SUBJECTS) {
    const sub = await upsertSubject(s);
    subjectMap[s.key] = sub.id;
  }
  console.log(`  ✅ ${SUBJECTS.length} canonical subjects seeded.\n`);

  // ─── Countries ─────────────────────────────────────────────
  console.log('🌍 Seeding countries...');

  const COUNTRIES = [
    // International (for IB, Cambridge, Edexcel)
    { name: 'International', iso2: 'XX', flag: '🌐' },
    // Africa
    { name: 'Kenya',         iso2: 'KE', flag: '🇰🇪' },
    { name: 'Nigeria',       iso2: 'NG', flag: '🇳🇬' },
    { name: 'Ghana',         iso2: 'GH', flag: '🇬🇭' },
    { name: 'South Africa',  iso2: 'ZA', flag: '🇿🇦' },
    { name: 'Ethiopia',      iso2: 'ET', flag: '🇪🇹' },
    { name: 'Tanzania',      iso2: 'TZ', flag: '🇹🇿' },
    { name: 'Uganda',        iso2: 'UG', flag: '🇺🇬' },
    { name: 'Egypt',         iso2: 'EG', flag: '🇪🇬' },
    // Asia
    { name: 'India',         iso2: 'IN', flag: '🇮🇳' },
    { name: 'Pakistan',      iso2: 'PK', flag: '🇵🇰' },
    { name: 'Bangladesh',    iso2: 'BD', flag: '🇧🇩' },
    { name: 'China',         iso2: 'CN', flag: '🇨🇳' },
    { name: 'Japan',         iso2: 'JP', flag: '🇯🇵' },
    { name: 'Indonesia',     iso2: 'ID', flag: '🇮🇩' },
    { name: 'Philippines',   iso2: 'PH', flag: '🇵🇭' },
    // Middle East
    { name: 'Saudi Arabia',  iso2: 'SA', flag: '🇸🇦' },
    { name: 'United Arab Emirates', iso2: 'AE', flag: '🇦🇪' },
    // Europe
    { name: 'United Kingdom',iso2: 'GB', flag: '🇬🇧' },
    { name: 'Germany',       iso2: 'DE', flag: '🇩🇪' },
    { name: 'France',        iso2: 'FR', flag: '🇫🇷' },
    // Americas
    { name: 'United States', iso2: 'US', flag: '🇺🇸' },
    { name: 'Brazil',        iso2: 'BR', flag: '🇧🇷' },
    { name: 'Canada',        iso2: 'CA', flag: '🇨🇦' },
    // Oceania
    { name: 'Australia',     iso2: 'AU', flag: '🇦🇺' },
  ];

  const countryMap: Record<string, string> = {};
  for (const c of COUNTRIES) {
    const country = await prisma.country.upsert({
      where: { iso2: c.iso2 },
      update: {},
      create: c,
    });
    countryMap[c.iso2] = country.id;
  }
  console.log(`  ✅ ${COUNTRIES.length} countries seeded.\n`);

  // ─── Curricula + Levels + Subject Mappings ──────────────────
  console.log('📋 Seeding curricula, levels, and subject mappings...');

  // Helper: creates a curriculum, its levels, and maps subjects
  async function seedCurriculum(opts: {
    countryIso2: string;
    code: string;
    name: string;
    levels: { stage: Stage; name: string; order: number }[];
    coreSubjectKeys: string[];
    electiveSubjectKeys?: string[];
    aliases?: { subjectKey: string; localName: string; levelName?: string }[];
  }) {
    const countryId = countryMap[opts.countryIso2];
    if (!countryId) throw new Error(`Country not found: ${opts.countryIso2}`);

    const curriculum = await prisma.curriculum.upsert({
      where: { countryId_code: { countryId, code: opts.code } },
      update: {},
      create: { countryId, code: opts.code, name: opts.name },
    });

    const levelMap: Record<string, string> = {};
    for (const lvl of opts.levels) {
      const level = await prisma.educationLevel.upsert({
        where: { curriculumId_name: { curriculumId: curriculum.id, name: lvl.name } },
        update: {},
        create: { curriculumId: curriculum.id, stage: lvl.stage, name: lvl.name, orderIndex: lvl.order },
      });
      levelMap[lvl.name] = level.id;
    }

    // Map core subjects to all levels
    const allSubjectKeys = [...opts.coreSubjectKeys, ...(opts.electiveSubjectKeys ?? [])];
    for (const levelName of Object.keys(levelMap)) {
      for (const key of allSubjectKeys) {
        const subjectId = subjectMap[key];
        if (!subjectId) continue;
        const levelId = levelMap[levelName];
        const isCore = opts.coreSubjectKeys.includes(key);
        await prisma.curriculumSubject.upsert({
          where: { curriculumId_levelId_subjectId: { curriculumId: curriculum.id, levelId: levelId!, subjectId } },
          update: {},
          create: { curriculumId: curriculum.id, levelId: levelId!, subjectId, isCore },
        });
      }
    }

    // Seed local name aliases
    for (const alias of opts.aliases ?? []) {
      const subjectId = subjectMap[alias.subjectKey];
      if (!subjectId) continue;
      const levelId = alias.levelName ? levelMap[alias.levelName] : undefined;
      const existing = await prisma.curriculumSubjectAlias.findFirst({
        where: { curriculumId: curriculum.id, subjectId, levelId: levelId ?? null },
      });
      if (!existing) {
        await prisma.curriculumSubjectAlias.create({
          data: { curriculumId: curriculum.id, subjectId, levelId: levelId ?? null, localName: alias.localName, isCore: true },
        });
      } else {
        await prisma.curriculumSubjectAlias.update({
          where: { id: existing.id },
          data: { localName: alias.localName },
        });
      }
    }

    return { curriculum, levelMap };
  }

  // Kenya — KCSE (8-4-4)
  const { levelMap: kcseLevels, curriculum: kcse } = await seedCurriculum({
    countryIso2: 'KE', code: 'KCSE', name: '8-4-4 / KCSE Curriculum',
    levels: [
      { stage: Stage.SECONDARY, name: 'Form 1', order: 1 },
      { stage: Stage.SECONDARY, name: 'Form 2', order: 2 },
      { stage: Stage.SECONDARY, name: 'Form 3', order: 3 },
      { stage: Stage.SECONDARY, name: 'Form 4', order: 4 },
    ],
    coreSubjectKeys:    ['ENG', 'KISWAHILI', 'MAT'],
    electiveSubjectKeys: ['BIO', 'CHE', 'PHY', 'HIST', 'GEO', 'ECON', 'BUSINESS', 'AGRI', 'HOME_SCI', 'RELIGIOUS_ED', 'ICT', 'MUSIC', 'PE'],
    aliases: [
      { subjectKey: 'RELIGIOUS_ED', localName: 'CRE / IRE' },
      { subjectKey: 'ICT', localName: 'Computer Studies' },
    ],
  });

  // Kenya — CBC (Competency Based Curriculum)
  const { curriculum: cbc } = await seedCurriculum({
    countryIso2: 'KE', code: 'CBC', name: 'Competency Based Curriculum (CBC)',
    levels: [
      { stage: Stage.LOWER_PRIMARY, name: 'Grade 1', order: 1 },
      { stage: Stage.LOWER_PRIMARY, name: 'Grade 2', order: 2 },
      { stage: Stage.LOWER_PRIMARY, name: 'Grade 3', order: 3 },
      { stage: Stage.UPPER_PRIMARY, name: 'Grade 4', order: 4 },
      { stage: Stage.UPPER_PRIMARY, name: 'Grade 5', order: 5 },
      { stage: Stage.UPPER_PRIMARY, name: 'Grade 6', order: 6 },
      { stage: Stage.SECONDARY, name: 'Grade 7', order: 7 },
      { stage: Stage.SECONDARY, name: 'Grade 8', order: 8 },
      { stage: Stage.SECONDARY, name: 'Grade 9', order: 9 },
    ],
    coreSubjectKeys:    ['ENG', 'KISWAHILI', 'MAT', 'SCI_COMBINED', 'LIFE_SKILLS'],
    electiveSubjectKeys: ['ICT', 'AGRI', 'HOME_SCI', 'VISUAL_ARTS', 'MUSIC', 'PE'],
  });

  // International — IB (Primary Years, Middle Years, Diploma)
  const { curriculum: ib } = await seedCurriculum({
    countryIso2: 'XX', code: 'IB', name: 'International Baccalaureate (IB)',
    levels: [
      { stage: Stage.LOWER_PRIMARY, name: 'PYP Year 1', order: 1 },
      { stage: Stage.LOWER_PRIMARY, name: 'PYP Year 2', order: 2 },
      { stage: Stage.LOWER_PRIMARY, name: 'PYP Year 3', order: 3 },
      { stage: Stage.LOWER_PRIMARY, name: 'PYP Year 4', order: 4 },
      { stage: Stage.LOWER_PRIMARY, name: 'PYP Year 5', order: 5 },
      { stage: Stage.UPPER_PRIMARY, name: 'MYP Year 1', order: 6 },
      { stage: Stage.UPPER_PRIMARY, name: 'MYP Year 2', order: 7 },
      { stage: Stage.SECONDARY,     name: 'MYP Year 3', order: 8 },
      { stage: Stage.SECONDARY,     name: 'MYP Year 4', order: 9 },
      { stage: Stage.SECONDARY,     name: 'MYP Year 5', order: 10 },
      { stage: Stage.SECONDARY,     name: 'DP Year 1',  order: 11 },
      { stage: Stage.SECONDARY,     name: 'DP Year 2',  order: 12 },
    ],
    coreSubjectKeys:    ['ENG', 'MAT', 'SCI_COMBINED', 'HIST', 'GEO', 'GLOBAL_PERSP'],
    electiveSubjectKeys: ['BIO', 'CHE', 'PHY', 'ECON', 'PSYCHOLOGY', 'PHILOSOPHY', 'FRENCH_LANG', 'SPANISH_LANG', 'MANDARIN_LANG', 'MUSIC', 'VISUAL_ARTS', 'COMPUTER_SCI', 'CS'],
    aliases: [
      { subjectKey: 'SCI_COMBINED', localName: 'Sciences' },
      { subjectKey: 'HIST',         localName: 'History' },
      { subjectKey: 'GEO',          localName: 'Geography' },
    ],
  });

  // International — Cambridge IGCSE
  const { curriculum: igcse } = await seedCurriculum({
    countryIso2: 'XX', code: 'IGCSE', name: 'Cambridge IGCSE',
    levels: [
      { stage: Stage.SECONDARY, name: 'Year 10', order: 1 },
      { stage: Stage.SECONDARY, name: 'Year 11', order: 2 },
    ],
    coreSubjectKeys:    ['ENG', 'MAT'],
    electiveSubjectKeys: ['BIO', 'CHE', 'PHY', 'SCI_COMBINED', 'HIST', 'GEO', 'ECON', 'BUSINESS', 'ACCOUNTING', 'ICT', 'CS', 'FRENCH_LANG', 'SPANISH_LANG', 'SOCIOLOGY', 'PSYCHOLOGY', 'DESIGN_TECH', 'MUSIC', 'DRAMA', 'MEDIA_STUDIES', 'PE', 'AGRI', 'RELIGIOUS_ED'],
    aliases: [
      { subjectKey: 'SCI_COMBINED', localName: 'Co-ordinated Sciences' },
    ],
  });

  // International — Cambridge A-Level
  const { curriculum: aLevel } = await seedCurriculum({
    countryIso2: 'XX', code: 'A_LEVEL', name: 'Cambridge AS & A-Levels',
    levels: [
      { stage: Stage.SECONDARY, name: 'AS Level', order: 1 },
      { stage: Stage.SECONDARY, name: 'A Level',  order: 2 },
    ],
    coreSubjectKeys:    [],
    electiveSubjectKeys: ['MAT', 'MATH_FURTHER', 'MATH_PURE', 'STATS', 'BIO', 'CHE', 'PHY', 'ECON', 'HIST', 'GEO', 'PSYCHOLOGY', 'SOCIOLOGY', 'PHILOSOPHY', 'BUSINESS', 'ACCOUNTING', 'CS', 'ICT', 'FRENCH_LANG', 'SPANISH_LANG', 'MANDARIN_LANG', 'ARABIC_LANG', 'ENG', 'ENG_LIT', 'VISUAL_ARTS', 'MUSIC', 'DRAMA', 'DESIGN_TECH', 'MEDIA_STUDIES', 'PE', 'RELIGIOUS_ED'],
  });

  // International — Edexcel International GCSE
  await seedCurriculum({
    countryIso2: 'XX', code: 'EDEXCEL_IGCSE', name: 'Edexcel International GCSE',
    levels: [
      { stage: Stage.SECONDARY, name: 'Year 10', order: 1 },
      { stage: Stage.SECONDARY, name: 'Year 11', order: 2 },
    ],
    coreSubjectKeys:    ['ENG', 'MAT'],
    electiveSubjectKeys: ['BIO', 'CHE', 'PHY', 'SCI_COMBINED', 'HIST', 'GEO', 'ECON', 'BUSINESS', 'ACCOUNTING', 'ICT', 'CS'],
  });

  // UK — GCSEs
  await seedCurriculum({
    countryIso2: 'GB', code: 'GCSE', name: 'GCSE (England/Wales/NI)',
    levels: [
      { stage: Stage.SECONDARY, name: 'Year 10', order: 1 },
      { stage: Stage.SECONDARY, name: 'Year 11', order: 2 },
    ],
    coreSubjectKeys:    ['ENG', 'ENG_LIT', 'MAT', 'SCI_COMBINED'],
    electiveSubjectKeys: ['BIO', 'CHE', 'PHY', 'HIST', 'GEO', 'ECON', 'BUSINESS', 'PSYCHOLOGY', 'SOCIOLOGY', 'CS', 'ICT', 'FRENCH_LANG', 'SPANISH_LANG', 'GERMAN_LANG', 'MUSIC', 'DRAMA', 'VISUAL_ARTS', 'DESIGN_TECH', 'PE', 'RELIGIOUS_ED', 'MEDIA_STUDIES'],
    aliases: [
      { subjectKey: 'SCI_COMBINED', localName: 'Combined Science (Trilogy)' },
    ],
  });

  // UK — A-Levels
  await seedCurriculum({
    countryIso2: 'GB', code: 'A_LEVELS', name: 'A-Levels (England/Wales/NI)',
    levels: [
      { stage: Stage.SECONDARY, name: 'Year 12 (AS)', order: 1 },
      { stage: Stage.SECONDARY, name: 'Year 13 (A2)', order: 2 },
    ],
    coreSubjectKeys:    [],
    electiveSubjectKeys: ['MAT', 'MATH_FURTHER', 'STATS', 'BIO', 'CHE', 'PHY', 'ECON', 'HIST', 'GEO', 'PSYCHOLOGY', 'SOCIOLOGY', 'PHILOSOPHY', 'BUSINESS', 'ACCOUNTING', 'CS', 'ICT', 'FRENCH_LANG', 'SPANISH_LANG', 'ENG', 'ENG_LIT', 'VISUAL_ARTS', 'MUSIC', 'DRAMA', 'DESIGN_TECH', 'PE', 'MEDIA_STUDIES'],
  });

  // USA — AP (Advanced Placement)
  await seedCurriculum({
    countryIso2: 'US', code: 'AP', name: 'Advanced Placement (AP)',
    levels: [
      { stage: Stage.SECONDARY, name: 'AP', order: 1 },
    ],
    coreSubjectKeys:    [],
    electiveSubjectKeys: ['BIO', 'CHE', 'PHY', 'ENV_SCI', 'MAT', 'CALCULUS', 'STATS', 'CS', 'ECON', 'HIST', 'GEO', 'PSYCHOLOGY', 'SOCIOLOGY', 'POLITICAL_SCI', 'ENG', 'ENG_LIT', 'FRENCH_LANG', 'SPANISH_LANG', 'MANDARIN_LANG', 'GERMAN_LANG', 'JAPANESE_LANG', 'MUSIC', 'VISUAL_ARTS', 'HUMAN_GEO'],
  });

  // Nigeria — WAEC (WASSCE)
  await seedCurriculum({
    countryIso2: 'NG', code: 'WAEC', name: 'WAEC (WASSCE)',
    levels: [
      { stage: Stage.SECONDARY, name: 'SS1', order: 1 },
      { stage: Stage.SECONDARY, name: 'SS2', order: 2 },
      { stage: Stage.SECONDARY, name: 'SS3', order: 3 },
    ],
    coreSubjectKeys:    ['ENG', 'MAT'],
    electiveSubjectKeys: ['BIO', 'CHE', 'PHY', 'SCI_COMBINED', 'AGRI', 'ECON', 'ACCOUNTING', 'COMMERCE', 'GEO', 'HIST', 'GOVT', 'CIVICS', 'RELIGIOUS_ED', 'ICT', 'HOME_SCI', 'MUSIC'],
    aliases: [
      { subjectKey: 'CIVICS', localName: 'Government' },
      { subjectKey: 'RELIGIOUS_ED', localName: 'CRS / IRS' },
    ],
  });

  // South Africa — NSC / Matric (CAPS)
  await seedCurriculum({
    countryIso2: 'ZA', code: 'NSC', name: 'NSC / Matric (CAPS)',
    levels: [
      { stage: Stage.SECONDARY, name: 'Grade 10', order: 1 },
      { stage: Stage.SECONDARY, name: 'Grade 11', order: 2 },
      { stage: Stage.SECONDARY, name: 'Grade 12', order: 3 },
    ],
    coreSubjectKeys:    ['ENG', 'MAT'],
    electiveSubjectKeys: ['BIO', 'CHE', 'PHY', 'AGRI', 'ECON', 'ACCOUNTING', 'BUSINESS', 'GEO', 'HIST', 'LIFE_SKILLS', 'ICT', 'CS', 'MUSIC', 'VISUAL_ARTS', 'DRAMA'],
    aliases: [
      { subjectKey: 'LIFE_SKILLS', localName: 'Life Orientation' },
    ],
  });

  // India — CBSE
  await seedCurriculum({
    countryIso2: 'IN', code: 'CBSE', name: 'Central Board of Secondary Education (CBSE)',
    levels: [
      { stage: Stage.UPPER_PRIMARY, name: 'Class 6',  order: 1 },
      { stage: Stage.UPPER_PRIMARY, name: 'Class 7',  order: 2 },
      { stage: Stage.UPPER_PRIMARY, name: 'Class 8',  order: 3 },
      { stage: Stage.SECONDARY,     name: 'Class 9',  order: 4 },
      { stage: Stage.SECONDARY,     name: 'Class 10', order: 5 },
      { stage: Stage.SECONDARY,     name: 'Class 11', order: 6 },
      { stage: Stage.SECONDARY,     name: 'Class 12', order: 7 },
    ],
    coreSubjectKeys:    ['ENG', 'MAT', 'SCI_COMBINED'],
    electiveSubjectKeys: ['BIO', 'CHE', 'PHY', 'ECON', 'HIST', 'GEO', 'POLITICAL_SCI', 'PSYCHOLOGY', 'SOCIOLOGY', 'ACCOUNTING', 'BUSINESS', 'CS', 'ICT', 'HINDI_LANG', 'FRENCH_LANG', 'MUSIC', 'VISUAL_ARTS', 'PE'],
    aliases: [
      { subjectKey: 'SCI_COMBINED', localName: 'Science' },
      { subjectKey: 'HIST',         localName: 'History' },
      { subjectKey: 'GEO',          localName: 'Geography' },
    ],
  });

  // France — Baccalauréat
  await seedCurriculum({
    countryIso2: 'FR', code: 'BAC', name: 'Baccalauréat',
    levels: [
      { stage: Stage.SECONDARY, name: 'Seconde',  order: 1 },
      { stage: Stage.SECONDARY, name: 'Première', order: 2 },
      { stage: Stage.SECONDARY, name: 'Terminale',order: 3 },
    ],
    coreSubjectKeys:    ['FRENCH_LANG', 'MAT'],
    electiveSubjectKeys: ['BIO', 'CHE', 'PHY', 'HIST', 'GEO', 'ECON', 'PHILOSOPHY', 'ENG', 'SPANISH_LANG', 'GERMAN_LANG', 'VISUAL_ARTS', 'MUSIC', 'CS'],
    aliases: [
      { subjectKey: 'FRENCH_LANG', localName: 'Français' },
    ],
  });

  // Germany — Abitur
  await seedCurriculum({
    countryIso2: 'DE', code: 'ABITUR', name: 'Abitur',
    levels: [
      { stage: Stage.SECONDARY, name: 'Klasse 11', order: 1 },
      { stage: Stage.SECONDARY, name: 'Klasse 12', order: 2 },
      { stage: Stage.SECONDARY, name: 'Klasse 13', order: 3 },
    ],
    coreSubjectKeys:    ['GERMAN_LANG', 'MAT'],
    electiveSubjectKeys: ['BIO', 'CHE', 'PHY', 'HIST', 'GEO', 'ECON', 'PHILOSOPHY', 'ENG', 'FRENCH_LANG', 'LATIN', 'CS', 'MUSIC', 'VISUAL_ARTS', 'PE', 'POLITICS_SOC'],
  });

  // Brazil — ENEM / BNCC
  await seedCurriculum({
    countryIso2: 'BR', code: 'ENEM', name: 'ENEM / Base Nacional (BNCC)',
    levels: [
      { stage: Stage.SECONDARY, name: '1ª Série',  order: 1 },
      { stage: Stage.SECONDARY, name: '2ª Série',  order: 2 },
      { stage: Stage.SECONDARY, name: '3ª Série',  order: 3 },
    ],
    coreSubjectKeys:    ['PORTUGUESE_LANG', 'MAT'],
    electiveSubjectKeys: ['BIO', 'CHE', 'PHY', 'HIST', 'GEO', 'ECON', 'SOCIOLOGY', 'PHILOSOPHY', 'ENG', 'SPANISH_LANG', 'VISUAL_ARTS', 'MUSIC', 'PHYSICAL_ED', 'CS'],
    aliases: [
      { subjectKey: 'PORTUGUESE_LANG', localName: 'Língua Portuguesa' },
      { subjectKey: 'PE',              localName: 'Educação Física' },
    ],
  });

  // Lifelong — curriculum-free path (any canonical subject)
  const { curriculum: lifelong } = await seedCurriculum({
    countryIso2: 'XX', code: 'LIFELONG', name: 'Self-Directed Lifelong Learning',
    levels: [
      { stage: Stage.LIFELONG, name: 'All Levels', order: 1 },
    ],
    coreSubjectKeys:    [],
    electiveSubjectKeys: Object.keys(subjectMap), // all canonical subjects available
  });

  console.log('  ✅ Curricula + levels + subject mappings seeded.\n');

  // ─── Roles ─────────────────────────────────────────────────
  // (already created above)

  // ─── Spec Users (v2 preserved) ─────────────────────────────
  console.log('👤 Seeding the 5 spec accounts...');

  const passwordHash = await argon2.hash('Learnix@2026!', {
    timeCost: 2,
    memoryCost: 19456,
    parallelism: 1,
  });

  // Get Kenya/KCSE references for seeded users
  const kenyaId = countryMap['KE']!;
  const form4Id = kcseLevels['Form 4']!;
  const form3Id = kcseLevels['Form 3']!;

  const specUsers = [
    {
      email: 'amara.otieno@learnix.dev',
      username: 'amara.otieno',
      displayName: 'Amara Otieno',
      role: 'STUDENT',
      ageBand: 'TEEN_13_17' as const,
      locale: 'en-KE',
      curriculum: 'KCSE',
      level: 'Form 4',
      subjects: ['BIO', 'CHE', 'MAT', 'ENG'],
    },
    {
      email: 'brian.codes@learnix.dev',
      username: 'brian.codes',
      displayName: 'Brian Codes',
      role: 'STUDENT',
      ageBand: 'TEEN_13_17' as const,
      locale: 'en-KE',
      curriculum: 'KCSE',
      level: 'Form 3',
      subjects: ['PHY', 'MAT', 'ENG'],
    },
    {
      email: 'sci.with.sam@learnix.dev',
      username: 'sci.with.sam',
      displayName: 'Sam Teacher',
      role: 'TEACHER',
      ageBand: 'ADULT_18_PLUS' as const,
      locale: 'en',
      curriculum: 'KCSE',
      level: 'ALL',
      subjects: ['BIO', 'CHE'],
    },
    {
      email: 'kevin.creates@learnix.dev',
      username: 'kevin.creates',
      displayName: 'Kevin Kimani',
      role: 'CREATOR',
      ageBand: 'ADULT_18_PLUS' as const,
      locale: 'sw',
      curriculum: 'KCSE',
      level: 'ALL',
      subjects: ['PHY', 'MAT'],
    },
    {
      email: 'admin@learnix.dev',
      username: 'admin',
      displayName: 'Learnix Admin',
      role: 'SUPER_ADMIN',
      ageBand: 'ADULT_18_PLUS' as const,
      locale: 'en',
      curriculum: 'ALL',
      level: 'ALL',
      subjects: [],
    },
  ];

  const createdUsers: Record<string, string> = {};

  for (const u of specUsers) {
    const user = await prisma.user.create({
      data: {
        email: u.email,
        passwordHash,
        status: 'ACTIVE',
        ageBand: u.ageBand,
        locale: u.locale,
        emailVerifiedAt: new Date(),
        profile: {
          create: {
            displayName: u.displayName,
            username: u.username,
            country: 'KE',
            curriculum: u.curriculum,
            level: u.level,
            subjects: u.subjects,
            languages: [u.locale],
          },
        },
        roles: {
          create: { roleId: createdRoles[u.role]! },
        },
        streak: {
          create: {
            currentDays: u.username === 'amara.otieno' ? 3 : 0,
            longestDays: u.username === 'amara.otieno' ? 12 : 0,
            lastQualifiedAt: u.username === 'amara.otieno' ? new Date() : null,
            pauseTokens: 1,
          },
        },
        accountSettings: {
          create: { theme: 'dark', language: u.locale },
        },
      },
    });
    createdUsers[u.username] = user.id;
    console.log(`  👤 Created ${u.displayName} (@${u.username}) as ${u.role} [${u.locale}]`);
  }

  // Learner profile for Amara
  const amaraId = createdUsers['amara.otieno']!;
  await prisma.learnerProfile.create({
    data: {
      userId: amaraId,
      stage: Stage.SECONDARY,
      countryId: kenyaId,
      curriculumId: kcse.id,
      levelId: form4Id,
      subjectIds: [subjectMap['BIO']!, subjectMap['CHE']!, subjectMap['MAT']!, subjectMap['ENG']!],
      dailyGoalMinutes: 10,
      completedOnboarding: true,
    },
  });
  console.log('✅ Spec users + LearnerProfile created.\n');

  // ─── Content Seeding ───────────────────────────────────────
  console.log('🎬 Seeding biology topic + video...');
  const cellBio = await prisma.topic.create({
    data: {
      subjectId: subjectMap['BIO']!,
      nameEn: 'Cell Biology',
      nameSw: 'Biolojia ya Seli',
      orderIndex: 1,
    },
  });

  const path1 = await prisma.learningPath.create({
    data: {
      subjectId: subjectMap['BIO']!,
      level: 'Form 4',
      curriculum: 'KCSE',
      nameEn: 'KCSE Biology — Cell & Molecular',
      orderIndex: 1,
    },
  });

  const lesson1 = await prisma.lesson.create({
    data: {
      pathId: path1.id,
      topicId: cellBio.id,
      title: 'Introduction to Cell Biology',
      durationMin: 20,
      contentBlocks: [
        { type: 'text', content: 'Cells are the basic units of life. All living organisms are made of cells.' },
        { type: 'image', url: 'https://example.com/cell-diagram.png', caption: 'Typical animal cell' },
        { type: 'text', content: 'There are two major types: prokaryotic (no nucleus) and eukaryotic (with nucleus).' },
      ],
      status: 'published',
    },
  });
  console.log('  ✅ Biology topic + lesson created.\n');

  // Badge
  console.log('🏅 Seeding badges...');
  await prisma.badge.upsert({
    where: { key: 'FIRST_LESSON' },
    update: {},
    create: {
      key: 'FIRST_LESSON',
      nameEn: 'First Steps',
      nameSw: 'Hatua za Kwanza',
      description: 'Completed your first lesson on Learnix!',
      criteria: { type: 'lesson_count', threshold: 1 },
    },
  });
  await prisma.badge.upsert({
    where: { key: 'STREAK_7' },
    update: {},
    create: {
      key: 'STREAK_7',
      nameEn: '7-Day Streak',
      nameSw: 'Mstari wa Siku 7',
      description: 'Studied 7 days in a row!',
      criteria: { type: 'streak', threshold: 7 },
    },
  });
  console.log('  ✅ Badges seeded.\n');

  console.log('🎉 Database seed v3.0 (Global Expansion) completed successfully!');
  console.log(`   Locales: ${LOCALES.length} | Subjects: ${SUBJECTS.length} | Countries: ${COUNTRIES.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
