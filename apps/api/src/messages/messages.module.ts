import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { MessagesGateway } from './messages.gateway';

@Module({
  providers: [MessagesService, MessagesGateway],
  controllers: [MessagesController],
  exports: [MessagesService, MessagesGateway]
})
export class MessagesModule {}
