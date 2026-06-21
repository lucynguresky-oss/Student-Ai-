import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed conversations and messages between existing users.
 * Safe to re-run — cleans up existing conversations first, then uses
 * deterministic IDs so the data is predictable for development/testing.
 */
async function main() {
  console.log('💬 Seeding conversations and messages...\n');

  // Known user IDs from initial seed
  const AMINA = 'caf96cc8-5176-42b1-af57-666fde63f443';
  const BRIAN = '42ccaae8-fb80-4757-a6ad-abf80c30e98e';
  const GRACE = 'c47a7242-8c14-44ba-8bf6-04a629d6a3e3';
  const KEVIN = '4dd656cc-3be1-476c-a0f6-834747c54f12';

  // Deterministic conversation IDs (safe to re-run)
  const CONV1_ID = '11111111-1111-1111-1111-111111111111';
  const CONV2_ID = '22222222-2222-2222-2222-222222222222';
  const CONV3_ID = '33333333-3333-3333-3333-333333333333';

  // Clean up existing seeded conversations (cascade deletes participants + messages)
  for (const id of [CONV1_ID, CONV2_ID, CONV3_ID]) {
    await prisma.conversation.deleteMany({ where: { id } });
  }
  console.log('  🧹 Cleaned up any previous seeded conversations\n');

  // ─── Conversation 1: Amina ↔ Dr. Muthoni (Biology teacher) ───────
  const conv1 = await prisma.conversation.create({
    data: {
      id: CONV1_ID,
      kind: 'dm',
      participants: {
        create: [{ userId: AMINA }, { userId: GRACE }],
      },
    },
  });
  console.log(`  ✅ Conv 1 created: Amina ↔ Dr. Muthoni (${conv1.id})`);

  await prisma.message.createMany({
    data: [
      { conversationId: conv1.id, senderId: GRACE, body: 'Hi Amina! How is your Biology revision going? 📚' },
      { conversationId: conv1.id, senderId: AMINA, body: 'Hi Dr. Muthoni! Going well, but I am stuck on photosynthesis light reactions 😅' },
      { conversationId: conv1.id, senderId: GRACE, body: 'No worries! The key thing to remember is: light-dependent reactions happen in the thylakoid membrane, and light-independent (Calvin cycle) in the stroma.' },
      { conversationId: conv1.id, senderId: AMINA, body: 'That makes so much more sense now! Thank you 🙏' },
      { conversationId: conv1.id, senderId: GRACE, body: 'Check out this biology clip I posted on Learnix Clips! It covers exactly this topic.' },
    ],
  });
  console.log(`  📨 5 messages seeded in Conv 1`);

  // ─── Conversation 2: Amina ↔ Brian (study buddy) ─────────────
  const conv2 = await prisma.conversation.create({
    data: {
      id: CONV2_ID,
      kind: 'dm',
      participants: {
        create: [{ userId: AMINA }, { userId: BRIAN }],
      },
    },
  });
  console.log(`  ✅ Conv 2 created: Amina ↔ Brian (${conv2.id})`);

  await prisma.message.createMany({
    data: [
      { conversationId: conv2.id, senderId: BRIAN, body: 'Yo Amina! Ready for the study group tomorrow?' },
      { conversationId: conv2.id, senderId: AMINA, body: 'Yes! Should we focus on Physics or Maths?' },
      { conversationId: conv2.id, senderId: BRIAN, body: 'Let us do Maths first — quadratic equations are killing me 😭' },
      { conversationId: conv2.id, senderId: AMINA, body: 'Same! I found a great quiz on Learnix, try it!' },
      { conversationId: conv2.id, senderId: BRIAN, body: 'Just took it and scored 80%! 🔥 The short answer questions were tricky' },
      { conversationId: conv2.id, senderId: AMINA, body: 'Nice! Study group tomorrow at 3pm? 📚' },
    ],
  });
  console.log(`  📨 6 messages seeded in Conv 2`);

  // ─── Conversation 3: Amina ↔ Kevin (content creator) ─────────
  const conv3 = await prisma.conversation.create({
    data: {
      id: CONV3_ID,
      kind: 'dm',
      participants: {
        create: [{ userId: AMINA }, { userId: KEVIN }],
      },
    },
  });
  console.log(`  ✅ Conv 3 created: Amina ↔ Kevin (${conv3.id})`);

  await prisma.message.createMany({
    data: [
      { conversationId: conv3.id, senderId: KEVIN, body: 'Hey! Thanks for saving my Physics clip 🙏' },
      { conversationId: conv3.id, senderId: AMINA, body: 'It was amazing! The matatu example for Newton\'s 3rd Law was genius 😂' },
      { conversationId: conv3.id, senderId: KEVIN, body: 'Haha glad you liked it! I am planning a series on Mechanics. Any topics you want covered?' },
      { conversationId: conv3.id, senderId: AMINA, body: 'Projectile motion would be great! I always mess up the angle calculations 😅' },
    ],
  });
  console.log(`  📨 4 messages seeded in Conv 3`);

  // ─── Create some Follow relationships ──────────────────────────
  const follows = [
    { followerId: AMINA, followeeId: GRACE },
    { followerId: AMINA, followeeId: KEVIN },
    { followerId: AMINA, followeeId: BRIAN },
    { followerId: BRIAN, followeeId: AMINA },
    { followerId: GRACE, followeeId: AMINA },
    { followerId: KEVIN, followeeId: AMINA },
  ];

  for (const f of follows) {
    await prisma.follow.upsert({
      where: { followerId_followeeId: { followerId: f.followerId, followeeId: f.followeeId } },
      update: {},
      create: f,
    });
  }
  console.log(`\n  ✅ ${follows.length} follow relationships created`);

  console.log('\n🎉 Conversation seeding complete!\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
