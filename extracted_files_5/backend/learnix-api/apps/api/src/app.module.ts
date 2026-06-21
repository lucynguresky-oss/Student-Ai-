import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PostsModule } from './posts/posts.module';
import { FeedModule } from './feed/feed.module';
import { CommentsModule } from './comments/comments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ModerationModule } from './moderation/moderation.module';
import { MessagingModule } from './messaging/messaging.module';
import { StoriesModule } from './stories/stories.module';
import { SafetyModule } from './safety/safety.module';
import { SavedModule } from './saved/saved.module';
import { SearchModule } from './search/search.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    PostsModule,
    FeedModule,
    CommentsModule,
    NotificationsModule,
    ModerationModule,
    MessagingModule,
    StoriesModule,
    SafetyModule,
    SavedModule,
    SearchModule,
  ],
})
export class AppModule {}
