import { Body, Controller, Get, Param, Post, UseGuards, Module } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OnboardingService } from './onboarding.service';
import { DeterministicPlanResolver, PLAN_RESOLVER } from './plan-resolver';
import { AuthGuard } from '../../core/tokens/auth.guard';
import { CurrentUser, zodBody, type AuthedUser } from '../../core/http/request-context';
import { AccountService } from '../users/account.service';
import { placementSubmitSchema } from '@learnix/validation';

@ApiTags('onboarding')
@Controller('onboarding')
@UseGuards(AuthGuard)
export class OnboardingController {
  constructor(private readonly onboarding: OnboardingService) {}

  @Get()
  async state(@CurrentUser() user: AuthedUser): Promise<any> {
    const s = await this.onboarding.getState(user.userId);
    return { currentStep: s.currentStep, responses: s.responses, completed: !!s.completedAt };
  }

  @Post('step/:stepKey')
  async submitStep(@CurrentUser() user: AuthedUser, @Param('stepKey') stepKey: string, @Body() body: unknown) {
    return this.onboarding.submitStep(user.userId, stepKey, body);
  }

  @Post('skip/:stepKey')
  async skip(@CurrentUser() user: AuthedUser, @Param('stepKey') stepKey: string) {
    return this.onboarding.skipStep(user.userId, stepKey);
  }

  @Post('placement/:trackId/start')
  async placementStart(@CurrentUser() user: AuthedUser, @Param('trackId') trackId: string): Promise<any> {
    return this.onboarding.startPlacement(user.userId, trackId);
  }

  @Post('placement/:trackId/submit')
  async placementSubmit(@CurrentUser() user: AuthedUser, @Param('trackId') trackId: string, @Body(zodBody(placementSubmitSchema)) body: any) {
    return this.onboarding.submitPlacement(user.userId, trackId, body.answers);
  }

  @Post('complete')
  async complete(@CurrentUser() user: AuthedUser) {
    return this.onboarding.complete(user.userId);
  }
}

@Module({
  controllers: [OnboardingController],
  providers: [
    OnboardingService,
    AccountService,
    { provide: PLAN_RESOLVER, useClass: DeterministicPlanResolver },
  ],
  exports: [OnboardingService],
})
export class OnboardingModule {}
