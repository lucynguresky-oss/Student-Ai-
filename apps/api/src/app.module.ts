import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import configuration from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { XpModule } from './common/xp.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PostsModule } from './posts/posts.module';
import { FeedModule } from './feed/feed.module';
import { CommentsModule } from './comments/comments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ModerationModule } from './moderation/moderation.module';
import { MessagingModule } from './messaging/messaging.module';
import { SearchModule } from './search/search.module';
import { SubjectsModule } from './subjects/subjects.module';
import { StoriesModule } from './stories/stories.module';
import { SafetyModule } from './safety/safety.module';
import { SavedModule } from './saved/saved.module';
import { AiTutorModule } from './ai-tutor/ai-tutor.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),

    // Rate limiting — configured from env via configuration.ts
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('throttle.ttl') ?? 60_000,
          limit: config.get<number>('throttle.limit') ?? 120,
        },
      ],
    }),

    // Core infrastructure
    PrismaModule,

    // XP / gamification — global so any module can inject XpService
    XpModule,

    // Feature modules
    AuthModule,
    UsersModule,
    PostsModule,
    FeedModule,
    CommentsModule,
    NotificationsModule,
    ModerationModule,
    MessagingModule,

    // Discovery & curriculum
    SearchModule,
    SubjectsModule,

    // AI Tutor
    AiTutorModule,

    // Social parity
    StoriesModule,
    SafetyModule,
    SavedModule,
  ],
})
export class AppModule {}
