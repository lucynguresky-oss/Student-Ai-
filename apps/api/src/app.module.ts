import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProfilesModule } from './profiles/profiles.module';
import { PostsModule } from './posts/posts.module';
import { LearnModule } from './learn/learn.module';
import { AiModule } from './ai/ai.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { MessagesModule } from './messages/messages.module';
import { SearchModule } from './search/search.module';
import { TaxonomyModule } from './taxonomy/taxonomy.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { QuizzesModule } from './quizzes/quizzes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRoot([
      {
        name: 'auth',
        ttl: 900, // 15 minutes in seconds
        limit: 5,  // 5 requests
      },
    ]),
    PrismaModule,
    HealthModule,
    AuthModule,
    ProfilesModule,
    PostsModule,
    LearnModule,
    AiModule,
    SubscriptionsModule,
    MessagesModule,
    SearchModule,
    TaxonomyModule,
    OnboardingModule,
    QuizzesModule,
  ],
})
export class AppModule {}
