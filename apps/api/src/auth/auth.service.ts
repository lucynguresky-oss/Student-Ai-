import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LoginRequest, SignupRequest } from '@learnix/types';
import * as argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /** Register a new student */
  async register(data: SignupRequest) {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          data.email ? { email: data.email } : null,
          data.phone ? { phone: data.phone } : null,
        ].filter(Boolean) as any,
      },
    });

    if (existingUser) {
      throw new ConflictException('User with this email or phone already exists');
    }

    const passwordHash = await argon2.hash(data.password, {
      timeCost: 2,
      memoryCost: 19456, // 19 MiB
      parallelism: 1,
    });

    // Dynamically retrieve the STUDENT role UUID
    let studentRole = await this.prisma.role.findUnique({
      where: { key: 'STUDENT' },
    });
    if (!studentRole) {
      studentRole = await this.prisma.role.create({
        data: { key: 'STUDENT' },
      });
    }

    // Create user and profile in a transaction
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        phone: data.phone,
        passwordHash,
        ageBand: data.ageBand,
        status: 'ACTIVE',
        profile: {
          create: {
            displayName: data.displayName,
            username: `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`, // Unique temporary username
            country: 'KE', // Default for MVP
            curriculum: 'KCSE',
            level: 'FORM_1',
            subjects: [],
            languages: ['en'],
          },
        },
        roles: {
          create: {
            roleId: studentRole.id,
          },
        },
        streak: {
          create: {
            currentDays: 0,
            longestDays: 0,
            pauseTokens: 1,
          },
        },
      },
      include: {
        profile: true,
        roles: true,
      },
    });

    return {
      id: user.id,
      email: user.email,
      displayName: user.profile?.displayName,
      username: user.profile?.username,
    };
  }

  /** Login a user and create a session */
  async login(data: LoginRequest, ip?: string, userAgent?: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: data.identifier },
          { phone: data.identifier },
          { profile: { username: data.identifier } },
        ],
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, data.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user, undefined, ip, userAgent);
  }

  /** Refresh access & refresh tokens with RTR and reuse detection */
  async refreshToken(refreshTokenStr: string, ip?: string, userAgent?: string) {
    try {
      const decoded = this.jwtService.verify(refreshTokenStr, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET', 'super-secret-refresh-key'),
      });

      const session = await this.prisma.session.findUnique({
        where: { id: decoded.sessionId },
      });

      if (!session || session.revokedAt || session.expiresAt < new Date()) {
        throw new UnauthorizedException('Session is expired or revoked');
      }

      const incomingHash = hashToken(refreshTokenStr);

      // Check for token reuse (RTR mismatch)
      if (incomingHash !== session.refreshHash) {
        // Token has been reused! Revoke the entire session family for security
        await this.prisma.session.updateMany({
          where: { family: session.family },
          data: { revokedAt: new Date() },
        });
        throw new UnauthorizedException('Refresh token reuse detected. All sessions in this family revoked.');
      }

      // Valid token! Find the user
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Rotate: Update the existing session with new token and expiration
      const roleKeys = user.roles.map((ur) => ur.role.key);
      const payload = {
        sub: user.id,
        sessionId: session.id,
        roles: roleKeys,
        ageBand: user.ageBand,
      };

      const accessToken = this.jwtService.sign(payload);
      
      const newRefreshToken = this.jwtService.sign(
        { sub: user.id, sessionId: session.id, family: session.family },
        {
          expiresIn: '30d',
          secret: this.configService.get<string>('JWT_REFRESH_SECRET', 'super-secret-refresh-key'),
        },
      );

      const newHash = hashToken(newRefreshToken);

      await this.prisma.session.update({
        where: { id: session.id },
        data: {
          refreshHash: newHash,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // extends by 30 days
          ip,
          userAgent,
        },
      });

      return {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: 15 * 60, // 15 minutes
      };
    } catch (e) {
      if (e instanceof UnauthorizedException) {
        throw e;
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /** Logout current session */
  async logout(sessionId: string) {
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
    return { success: true };
  }

  /** Logout all sessions for a user */
  async logoutAll(userId: string) {
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { success: true };
  }

  /** Get all active sessions for a user */
  async getSessions(userId: string) {
    const sessions = await this.prisma.session.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        device: true,
        ip: true,
        userAgent: true,
        createdAt: true,
      },
    });

    return sessions.map((s) => ({
      id: s.id,
      device: s.device,
      ip: s.ip,
      userAgent: s.userAgent,
      lastActiveAt: s.createdAt.toISOString(), // simplified for MVP
      createdAt: s.createdAt.toISOString(),
    }));
  }

  /** Revoke a specific session of a user */
  async revokeSession(userId: string, sessionId: string) {
    await this.prisma.session.updateMany({
      where: { id: sessionId, userId },
      data: { revokedAt: new Date() },
    });
    return { success: true };
  }

  /** Get full user details including profile and learner profile */
  async getUserMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        learnerProfile: true,
        streak: true,
        xpEvents: {
          select: { amount: true },
        },
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const totalXp = user.xpEvents.reduce((sum, event) => sum + event.amount, 0);

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      ageBand: user.ageBand,
      status: user.status,
      profile: user.profile,
      learnerProfile: user.learnerProfile,
      roles: user.roles.map((ur) => ur.role.key),
      xp: totalXp,
      streak: user.streak?.currentDays || 0,
    };
  }

  /** Generate token pair helper */
  private async generateTokens(user: any, family?: string, ip?: string, userAgent?: string) {
    const roleKeys = user.roles.map((ur: any) => ur.role.key);
    const sessionFamily = family ?? uuidv4();

    // Create session record in DB first
    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        family: sessionFamily,
        refreshHash: '', // temp
        ip,
        userAgent,
        device: userAgent ? userAgent.substring(0, 100) : null,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    const payload = {
      sub: user.id,
      sessionId: session.id,
      roles: roleKeys,
      ageBand: user.ageBand,
    };

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = this.jwtService.sign(
      { sub: user.id, sessionId: session.id, family: sessionFamily },
      {
        expiresIn: '30d',
        secret: this.configService.get<string>('JWT_REFRESH_SECRET', 'super-secret-refresh-key'),
      },
    );

    const refreshHash = hashToken(refreshToken);

    await this.prisma.session.update({
      where: { id: session.id },
      data: { refreshHash },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 15 minutes
    };
  }
}
