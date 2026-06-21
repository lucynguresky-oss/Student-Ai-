import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SafetyModule } from '../safety/safety.module';
import { ChatGateway } from './chat.gateway';
import { MessagingController } from './messaging.controller';
import { MessagingService } from './messaging.service';

@Module({
  imports: [JwtModule.register({}), SafetyModule],
  controllers: [MessagingController],
  providers: [MessagingService, ChatGateway],
  exports: [MessagingService],
})
export class MessagingModule {}
