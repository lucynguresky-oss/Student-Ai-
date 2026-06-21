import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { OnboardingAnswerRequest } from '@learnix/types';

@Controller('onboarding')
@UseGuards(JwtAuthGuard)
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get('steps')
  async getNextStep(
    @CurrentUser() user: any,
    @Query('currentStepId') currentStepId?: string,
  ) {
    const result = await this.onboardingService.getNextStep(user.userId, currentStepId);
    return { data: result };
  }

  @Post('answer')
  async submitAnswer(
    @CurrentUser() user: any,
    @Body() body: OnboardingAnswerRequest,
  ) {
    const result = await this.onboardingService.submitAnswer(
      user.userId,
      body.stepId,
      body.value,
    );
    return { data: result };
  }

  @Post('complete')
  async completeOnboarding(@CurrentUser() user: any) {
    const result = await this.onboardingService.completeOnboarding(user.userId);
    return { data: result };
  }
}
