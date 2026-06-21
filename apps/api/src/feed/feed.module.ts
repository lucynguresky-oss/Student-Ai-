import { Module } from '@nestjs/common';
import { PostsModule } from '../posts/posts.module';
import { SafetyModule } from '../safety/safety.module';
import { FeedController } from './feed.controller';
import { FeedService } from './feed.service';

@Module({
  imports: [PostsModule, SafetyModule],
  controllers: [FeedController],
  providers: [FeedService],
})
export class FeedModule {}
