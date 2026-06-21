import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'super-secret-default-key'),
    });
  }

  async validate(payload: any) {
    // This payload is the decoded JWT.
    // If needed, we can do a DB lookup here, but usually returning the payload is enough
    if (!payload.sub) {
      throw new UnauthorizedException();
    }
    
    return { 
      userId: payload.sub, 
      roles: payload.roles,
      ageBand: payload.ageBand,
      sessionId: payload.sessionId,
    };
  }
}
