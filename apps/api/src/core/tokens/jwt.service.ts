import { Injectable, OnModuleInit } from '@nestjs/common';
import { SignJWT, jwtVerify, importPKCS8, importSPKI, type KeyLike, type JWTPayload } from 'jose';
import { ConfigService } from '../config/config.service';

export interface AccessClaims extends JWTPayload {
  sub: string; // userId
  sid: string; // sessionId
  isGuest: boolean;
  isMinor: boolean;
}

/**
 * JwtService — RS256 access tokens with a `kid` header so keys can rotate without
 * invalidating in-flight tokens (§9.1). Refresh tokens are opaque (not JWTs) and handled
 * by the token/session layer.
 */
@Injectable()
export class JwtService implements OnModuleInit {
  private privateKey!: KeyLike;
  private publicKey!: KeyLike;
  private readonly kid: string;
  private readonly issuer = 'learnix';
  private readonly audience = 'learnix-app';

  constructor(private readonly config: ConfigService) {
    this.kid = config.env.JWT_KID;
  }

  async onModuleInit(): Promise<void> {
    this.privateKey = await importPKCS8(this.config.jwtPrivateKeyPem, 'RS256');
    this.publicKey = await importSPKI(this.config.jwtPublicKeyPem, 'RS256');
  }

  async signAccess(claims: { sub: string; sid: string; isGuest: boolean; isMinor: boolean }): Promise<string> {
    return new SignJWT({ sid: claims.sid, isGuest: claims.isGuest, isMinor: claims.isMinor })
      .setProtectedHeader({ alg: 'RS256', kid: this.kid })
      .setSubject(claims.sub)
      .setIssuedAt()
      .setIssuer(this.issuer)
      .setAudience(this.audience)
      .setExpirationTime(this.config.env.ACCESS_TOKEN_TTL)
      .sign(this.privateKey);
  }

  async verifyAccess(token: string): Promise<AccessClaims> {
    const { payload } = await jwtVerify(token, this.publicKey, {
      issuer: this.issuer,
      audience: this.audience,
      algorithms: ['RS256'],
    });
    return payload as AccessClaims;
  }
}
