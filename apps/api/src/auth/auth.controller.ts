import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Req,
  Delete,
  Param,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginRequest, SignupRequest } from '@learnix/types';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';
import { ThrottlerGuard } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(ThrottlerGuard)
  @Post('register')
  async register(@Body() signupRequest: SignupRequest) {
    const user = await this.authService.register(signupRequest);
    return {
      data: user,
    };
  }

  @UseGuards(ThrottlerGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginRequest: LoginRequest, @Req() req: any) {
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];
    const tokens = await this.authService.login(loginRequest, ip, userAgent);
    return {
      data: tokens,
    };
  }

  @UseGuards(ThrottlerGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body('refreshToken') refreshToken: string, @Req() req: any) {
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];
    const tokens = await this.authService.refreshToken(refreshToken, ip, userAgent);
    return {
      data: tokens,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@CurrentUser() user: any) {
    const fullUser = await this.authService.getUserMe(user.userId);
    return {
      data: fullUser,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser() user: any) {
    const result = await this.authService.logout(user.sessionId);
    return {
      data: result,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  async logoutAll(@CurrentUser() user: any) {
    const result = await this.authService.logoutAll(user.userId);
    return {
      data: result,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  async getSessions(@CurrentUser() user: any) {
    const sessions = await this.authService.getSessions(user.userId);
    return {
      data: sessions,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('sessions/:id')
  async revokeSession(
    @CurrentUser() user: any,
    @Param('id') sessionId: string,
  ) {
    const result = await this.authService.revokeSession(user.userId, sessionId);
    return {
      data: result,
    };
  }
}
