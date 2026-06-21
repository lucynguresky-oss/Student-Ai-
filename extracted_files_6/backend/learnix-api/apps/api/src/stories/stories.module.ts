import { Module } from '@nestjs/common';
import { SafetyModule } from '../safety/safety.module';
import { StoriesController } from './stories.controller';
import { StoriesService } from './stories.service';

@Module({
  imports: [SafetyModule],
  controllers: [StoriesController],
  providers: [StoriesService],
})
export class StoriesModule {}
