import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { Injectable } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private authService: AuthService) {
    super({
      clientID: process.env.GITHUB_CLIENT_ID || 'mock-github-id',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || 'mock-github-secret',
      callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:4000/api/auth/github/callback',
      scope: ['user:email'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: any): Promise<any> {
    const { id, username, displayName, photos, emails } = profile;
    const email = emails && emails.length > 0 ? emails[0].value : `${username}@github.com`;
    const photo = photos && photos.length > 0 ? photos[0].value : undefined;

    const user = await this.authService.validateOAuthUser({
      provider: 'github',
      providerId: id,
      email: email,
      displayName: displayName || username,
      photoUrl: photo,
      username: username,
    });
    
    done(null, user);
  }
}
