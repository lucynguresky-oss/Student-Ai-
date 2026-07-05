import { bootstrapTestApp, type TestApp } from './harness';
import { OtpService } from '../src/core/tokens/otp.service';

/**
 * §13 attack-case e2e suite. These are the security-critical behaviours that must hold before
 * any of this is handed to Antigravity for breadth. Everything runs against a real Postgres +
 * Redis (see test/setup-env.ts), with SMS/email/storage mocked.
 */
describe('Auth security (§13 attack cases)', () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await bootstrapTestApp();
  });
  afterAll(async () => {
    await t.close();
  });
  beforeEach(async () => {
    await t.reset();
  });

  const strongPw = 'Tr0ub4dour&3xample';

  async function registerEmail(email: string, username: string) {
    return t.req({
      method: 'POST',
      url: '/auth/register/email',
      body: { email, username, password: strongPw, acceptedTos: true, policyVersion: '2026-01-01' },
    });
  }

  // ---------------------------------------------------------------------------
  it('rotates refresh tokens and revokes the whole family on reuse of a rotated token', async () => {
    const reg = await registerEmail('reuse@test.io', 'reuse_user');
    expect(reg.status).toBe(201);
    const firstRefresh = reg.cookies['lx_refresh'];
    expect(firstRefresh).toBeTruthy();

    // Legitimate rotation — get a new refresh; the first one is now spent.
    const rot1 = await t.req({ method: 'POST', url: '/auth/refresh', cookies: { lx_refresh: firstRefresh } });
    expect(rot1.status).toBe(201);
    const secondRefresh = rot1.cookies['lx_refresh'];
    expect(secondRefresh).toBeTruthy();
    expect(secondRefresh).not.toBe(firstRefresh);

    // Attacker replays the STOLEN, just-rotated-away token (the real threat model).
    // Reuse of the immediately-previous token is detected → family revoked, 401 REUSE.
    const reuse = await t.req({ method: 'POST', url: '/auth/refresh', cookies: { lx_refresh: firstRefresh } });
    expect(reuse.status).toBe(401);
    expect(reuse.json.error.code).toBe('AUTH_REFRESH_REUSE');

    // After family revocation, the legitimate current token is dead too.
    const afterRevoke = await t.req({ method: 'POST', url: '/auth/refresh', cookies: { lx_refresh: secondRefresh } });
    expect(afterRevoke.status).toBe(401);

    // A SECURITY event was logged for the revocation.
    const user = await t.prisma.user.findUniqueOrThrow({ where: { email: 'reuse@test.io' } });
    const events = await t.prisma.securityEvent.findMany({ where: { userId: user.id, type: 'SESSION_REVOKED' } });
    expect(events.length).toBeGreaterThanOrEqual(1);
    expect((events[0].metadata as any).reason).toContain('reuse');
  });

  // ---------------------------------------------------------------------------
  it('locks OTP after 5 wrong attempts and rejects even the correct code during lock', async () => {
    const phone = '+254712345678';
    // Seed an OTP directly via the service so we know the correct code.
    const otp = t.app.get(OtpService);
    const correct = await otp.issue('REGISTER_PHONE', phone);

    const verifyWrong = (n: number) =>
      t.req({
        method: 'POST',
        url: '/auth/register/phone/verify',
        ip: `172.16.0.${n}`, // distinct IP per attempt; the OTP lock is keyed by phone, not IP
        body: { phone, otp: '000000', username: 'otp_user', policyVersion: '2026-01-01', acceptedTos: true },
      });

    // First 4 wrong attempts report OTP_INVALID; the 5th trips the lock.
    for (let i = 0; i < 4; i++) {
      const r = await verifyWrong(i);
      expect(r.status).toBe(400);
      expect(r.json.error.code).toBe('OTP_INVALID');
    }
    const fifth = await verifyWrong(4);
    expect(fifth.status).toBe(400);
    expect(fifth.json.error.code).toBe('OTP_LOCKED');

    // Now the CORRECT code must still be rejected because we're locked.
    const withCorrect = await t.req({
      method: 'POST',
      url: '/auth/register/phone/verify',
      ip: '172.16.0.99',
      body: { phone, otp: correct, username: 'otp_user', policyVersion: '2026-01-01', acceptedTos: true },
    });
    expect(withCorrect.status).toBe(400);
    expect(withCorrect.json.error.code).toBe('OTP_LOCKED');
  });

  // ---------------------------------------------------------------------------
  it('is enumeration-safe: registering an existing email returns the same shape, no leak', async () => {
    await registerEmail('dup@test.io', 'dup_original');

    // Register again with the SAME email but different username.
    const second = await registerEmail('dup@test.io', 'dup_attacker');

    // Same success-shaped response (201 + accessToken), NOT a 409 that would confirm existence.
    expect(second.status).toBe(201);
    expect(second.json.accessToken).toBeTruthy();

    // Crucially, the original account is untouched: still exactly one user with that email,
    // and it still owns the ORIGINAL username.
    const withEmail = await t.prisma.user.findMany({ where: { email: 'dup@test.io' } });
    expect(withEmail).toHaveLength(1);
    expect(withEmail[0].username).toBe('dup_original');
  });

  // ---------------------------------------------------------------------------
  it('forgot-password always returns 200 whether or not the account exists', async () => {
    await registerEmail('real@test.io', 'real_user');

    const existing = await t.req({ method: 'POST', url: '/auth/password/forgot', body: { identifier: 'real@test.io' } });
    const missing = await t.req({ method: 'POST', url: '/auth/password/forgot', body: { identifier: 'ghost@test.io' } });

    expect(existing.status).toBe(200);
    expect(missing.status).toBe(200);
    expect(existing.json).toEqual(missing.json); // indistinguishable
  });

  // ---------------------------------------------------------------------------
  it('treats 0712… and +254712… as the same number (phone normalization)', async () => {
    // Register with international format.
    const otp = t.app.get(OtpService);
    const phoneIntl = '+254712345678';
    const code1 = await otp.issue('REGISTER_PHONE', phoneIntl);
    const reg = await t.req({
      method: 'POST',
      url: '/auth/register/phone/verify',
      ip: '192.168.10.10',
      body: { phone: '0712345678', otp: code1, username: 'phone_user', policyVersion: '2026-01-01', acceptedTos: true },
    });
    // The schema normalizes 0712345678 → +254712345678, which matches the OTP identifier.
    expect(reg.status).toBe(201);

    const user = await t.prisma.user.findFirst({ where: { username: 'phone_user' } });
    expect(user?.phone).toBe('+254712345678');
  });

  // ---------------------------------------------------------------------------
  it('converts a guest in place: same userId, isGuest flips, progress kept', async () => {
    const guest = await t.req({ method: 'POST', url: '/auth/guest', body: { deviceId: 'device-abc-123' } });
    expect(guest.status).toBe(201);
    const access = guest.cookies['lx_access'];
    const guestUser = await t.prisma.user.findFirstOrThrow({ where: { isGuest: true } });
    const guestId = guestUser.id;

    // Record some onboarding progress as the guest.
    await t.req({
      method: 'POST',
      url: '/onboarding/step/tracks',
      cookies: { lx_access: access },
      body: { trackSlugs: ['mathematics'] },
    });

    // Convert to a real email account.
    const convert = await t.req({
      method: 'POST',
      url: '/auth/guest/convert',
      cookies: { lx_access: access },
      body: { method: 'email', email: 'converted@test.io', password: strongPw, acceptedTos: true, policyVersion: '2026-01-01' },
    });
    expect(convert.status).toBe(201);
    expect(convert.json.isGuest).toBe(false);

    // SAME user row, now registered, progress intact.
    const after = await t.prisma.user.findUniqueOrThrow({ where: { id: guestId }, include: { onboarding: true } });
    expect(after.isGuest).toBe(false);
    expect(after.email).toBe('converted@test.io');
    expect((after.onboarding!.responses as any).tracks).toBeTruthy();
  });

  // ---------------------------------------------------------------------------
  it('rejects weak passwords at registration', async () => {
    const weak = await t.req({
      method: 'POST',
      url: '/auth/register/email',
      body: { email: 'weak@test.io', username: 'weak_user', password: 'password', acceptedTos: true, policyVersion: '2026-01-01' },
    });
    expect(weak.status).toBe(400);
    expect(weak.json.error.code).toBe('VALIDATION_ERROR');
  });

  // ---------------------------------------------------------------------------
  it('login is rate-limited per IP after repeated attempts', async () => {
    await registerEmail('rl@test.io', 'rl_user');
    let limited = false;
    for (let i = 0; i < 8; i++) {
      const r = await t.req({ method: 'POST', url: '/auth/login', ip: '203.0.113.7', body: { identifier: 'rl@test.io', password: 'wrongpass123' } });
      if (r.status === 429) {
        limited = true;
        expect(r.json.error.code).toBe('RATE_LIMITED');
        break;
      }
    }
    expect(limited).toBe(true);
  });
});
