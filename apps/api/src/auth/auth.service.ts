import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<{ user: PublicUser } & Tokens> {
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { username: dto.username }] },
      select: { email: true, username: true },
    });
    if (existing) {
      const field = existing.email === dto.email ? 'email' : 'username';
      throw new ConflictException(`That ${field} is already taken`);
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        displayName: dto.displayName,
        passwordHash,
      },
    });

    const tokens = await this.issueTokens(user.id, user.username, user.role);
    return { user: toPublicUser(user), ...tokens };
  }

  async login(dto: LoginDto): Promise<{ user: PublicUser } & Tokens> {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.identifier }, { username: dto.identifier }],
      },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.issueTokens(user.id, user.username, user.role);
    return { user: toPublicUser(user), ...tokens };
  }

  async validateOAuthUser(profile: { provider: string, providerId: string, email: string, displayName: string, photoUrl?: string, username?: string }): Promise<{ user: PublicUser } & Tokens> {
    // Check if user exists by email
    let user = await this.prisma.user.findUnique({
      where: { email: profile.email },
    });

    if (!user) {
      // Create new user
      const baseUsername = profile.username || profile.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
      let username = baseUsername;
      let counter = 1;
      
      // Ensure unique username
      while (await this.prisma.user.findUnique({ where: { username } })) {
        username = `${baseUsername}${counter}`;
        counter++;
      }

      // Generate random password for OAuth users (they shouldn't login via password anyway unless they reset it)
      const passwordHash = await bcrypt.hash(randomBytes(16).toString('hex'), 12);
      
      user = await this.prisma.user.create({
        data: {
          email: profile.email,
          username,
          displayName: profile.displayName,
          passwordHash,
        },
      });
    }

    const tokens = await this.issueTokens(user.id, user.username, user.role);
    return { user: toPublicUser(user), ...tokens };
  }

  async refresh(rawToken: string): Promise<Tokens> {
    // Verify signature/expiry first
    let payload: { sub: string; jti: string };
    try {
      payload = await this.jwt.verifyAsync(rawToken, {
        secret: this.config.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Then check it hasn't been revoked / rotated
    const stored = await this.prisma.refreshToken.findUnique({
      where: { id: payload.jti },
    });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired or revoked');
    }
    const matches = await bcrypt.compare(rawToken, stored.tokenHash);
    if (!matches) throw new UnauthorizedException('Invalid refresh token');

    // Rotate: revoke the old, issue a fresh pair
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: payload.sub },
      select: { id: true, username: true, role: true },
    });
    return this.issueTokens(user.id, user.username, user.role);
  }

  async logout(rawToken: string): Promise<void> {
    try {
      const payload = await this.jwt.verifyAsync<{ jti: string }>(rawToken, {
        secret: this.config.get<string>('jwt.refreshSecret'),
      });
      await this.prisma.refreshToken.updateMany({
        where: { id: payload.jti, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } catch {
      // swallow â€” logout should be idempotent
    }
  }

  // ---- helpers ----

  private async issueTokens(
    userId: string,
    username: string,
    role: string,
  ): Promise<Tokens> {
    const jti = randomBytes(16).toString('hex');

    const accessToken = await this.jwt.signAsync(
      { sub: userId, username, role },
      {
        secret: this.config.get<string>('jwt.accessSecret'),
        expiresIn: this.config.get<string>('jwt.accessTtl'),
      },
    );

    const refreshTtl = this.config.get<string>('jwt.refreshTtl') ?? '7d';
    const refreshToken = await this.jwt.signAsync(
      { sub: userId, jti },
      {
        secret: this.config.get<string>('jwt.refreshSecret'),
        expiresIn: refreshTtl,
      },
    );

    await this.prisma.refreshToken.create({
      data: {
        id: jti,
        userId,
        tokenHash: await bcrypt.hash(refreshToken, 10),
        expiresAt: new Date(Date.now() + ttlToMs(refreshTtl)),
      },
    });

    return { accessToken, refreshToken };
  }
}

// ---------------------------------------------------------------------------
// View-model helpers
// ---------------------------------------------------------------------------

export interface PublicUser {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: string;
  xp: number;
  streakCount: number;
}

function toPublicUser(u: {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: string;
  xp: number;
  streakCount: number;
}): PublicUser {
  return {
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    avatarUrl: u.avatarUrl,
    role: u.role,
    xp: u.xp,
    streakCount: u.streakCount,
  };
}

/** very small TTL parser: 15m, 7d, 24h, 30s */
function ttlToMs(ttl: string): number {
  const match = /^(\d+)([smhd])$/.exec(ttl.trim());
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const mult = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit]!;
  return value * mult;
}
