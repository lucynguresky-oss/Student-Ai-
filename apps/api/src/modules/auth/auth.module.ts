import { Module } from '@nestjs/common';
import { AuthController, VerifyController } from './auth.controller';
import { AuthService } from './auth.service';
import { RecoveryService } from './recovery.service';
import { OAuthService } from './oauth.service';
import { AccountService } from '../users/account.service';
import { ProvidersModule } from '../../providers/providers.module';

@Module({
  imports: [ProvidersModule],
  controllers: [AuthController, VerifyController],
  providers: [AuthService, RecoveryService, OAuthService, AccountService],
  exports: [AuthService, AccountService],
})
export class AuthModule {}
