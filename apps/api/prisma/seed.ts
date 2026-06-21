import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('ðŸŒ± Seeding Learnix...');

  const passwordHash = await bcrypt.hash('Password123', 12);

  const subjects = await Promise.all(
    ['Biology', 'Mathematics', 'Chemistry', 'History'].map((name) =>
      prisma.subject.upsert({
        where: { name },
        create: { name, level: 'KCSE' },
        update: {},
      }),
    ),
  );

  const usersData = [
    { username: 'amina', displayName: 'Amina W.', role: 'CREATOR' as const },
    { username: 'brian', displayName: 'Brian K.', role: 'TEACHER' as const },
    { username: 'cynthia', displayName: 'Cynthia A.', role: 'LEARNER' as const },
  ];

  const users = [];
  for (const u of usersData) {
    users.push(
      await prisma.user.upsert({
        where: { username: u.username },
        create: {
          email: `${u.username}@learnix.test`,
          username: u.username,
          displayName: u.displayName,
          role: u.role,
          passwordHash,
          bio: `Hi, I'm ${u.displayName} ðŸ‘‹`,
        },
        update: {},
      }),
    );
  }

  // everyone follows amina
  for (const u of users) {
    if (u.username !== 'amina') {
      await prisma.follow.upsert({
        where: {
          followerId_followingId: {
            followerId: u.id,
            followingId: users[0].id,
          },
        },
        create: { followerId: u.id, followingId: users[0].id },
        update: {},
      });
    }
  }

  // a couple of posts from amina
  const post = await prisma.post.create({
    data: {
      authorId: users[0].id,
      type: 'IMAGE',
      caption: 'Mitochondria â€” the powerhouse of the cell âš¡ #biology #revision',
      subjectId: subjects[0].id,
      media: {
        create: [
          {
            type: 'IMAGE',
            url: 'https://picsum.photos/seed/cell/1080/1080',
            width: 1080,
            height: 1080,
            position: 0,
          },
        ],
      },
      hashtags: {
        create: [
          { hashtag: { connectOrCreate: { where: { tag: 'biology' }, create: { tag: 'biology' } } } },
          { hashtag: { connectOrCreate: { where: { tag: 'revision' }, create: { tag: 'revision' } } } },
        ],
      },
    },
  });

  // a like + a comment from cynthia
  await prisma.like.create({ data: { postId: post.id, userId: users[2].id } });
  await prisma.post.update({
    where: { id: post.id },
    data: { likeCount: 1 },
  });
  await prisma.comment.create({
    data: {
      postId: post.id,
      authorId: users[2].id,
      body: 'This finally makes sense, thank you! ðŸ™',
    },
  });
  await prisma.post.update({
    where: { id: post.id },
    data: { commentCount: 1 },
  });

  console.log('âœ… Seed complete. Login with any user + password "Password123".');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
