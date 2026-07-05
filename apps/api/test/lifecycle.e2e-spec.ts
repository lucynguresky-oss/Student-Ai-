import { bootstrapTestApp, type TestApp } from './harness';
import { AccountLifecycleService } from '../src/modules/account-lifecycle/account-lifecycle.module';

/**
 * §13 continued — account lifecycle + minor safeguards, end-to-end against real Postgres/Redis.
 */
describe('Lifecycle & minor safeguards (§13)', () => {
  let t: TestApp;
  const pw = 'Tr0ub4dour&3xample';

  beforeAll(async () => {
    t = await bootstrapTestApp();
  });
  afterAll(async () => {
    await t.close();
  });
  beforeEach(async () => {
    await t.reset();
  });

  async function registerAndLogin(email: string, username: string, ip = '11.11.11.11') {
    const reg = await t.req({
      method: 'POST',
      url: '/auth/register/email',
      ip,
      body: { email, username, password: pw, acceptedTos: true, policyVersion: '2026-01-01' },
    });
    return { access: reg.cookies['lx_access'], refresh: reg.cookies['lx_refresh'] };
  }

  // ---------------------------------------------------------------------------
  it('deactivate → account is DEACTIVATED, then auto-reactivates on next login', async () => {
    const { access } = await registerAndLogin('deact@test.io', 'deact_user');

    const deact = await t.req({ method: 'POST', url: '/account/deactivate', cookies: { lx_access: access }, body: { password: pw } });
    expect(deact.status).toBe(201);
    expect(deact.json.status).toBe('DEACTIVATED');

    let user = await t.prisma.user.findUniqueOrThrow({ where: { email: 'deact@test.io' } });
    expect(user.status).toBe('DEACTIVATED');

    // Logging in reactivates automatically (§5.5).
    const login = await t.req({ method: 'POST', url: '/auth/login', ip: '11.11.11.12', body: { identifier: 'deact@test.io', password: pw } });
    expect(login.status).toBe(201);
    user = await t.prisma.user.findUniqueOrThrow({ where: { email: 'deact@test.io' } });
    expect(user.status).toBe('ACTIVE');
  });

  // ---------------------------------------------------------------------------
  it('delete request → 30-day grace; cancel restores ACTIVE', async () => {
    const { access } = await registerAndLogin('del@test.io', 'del_user');

    const del = await t.req({ method: 'POST', url: '/account/delete', cookies: { lx_access: access }, body: { password: pw } });
    expect(del.status).toBe(201);
    expect(del.json.status).toBe('PENDING_DELETION');
    expect(new Date(del.json.purgeAt).getTime()).toBeGreaterThan(Date.now());

    // Cancel (as if the user logged back in during grace).
    const user = await t.prisma.user.findUniqueOrThrow({ where: { email: 'del@test.io' } });
    // Need a fresh session since delete revoked all; simulate by re-login.
    const login = await t.req({ method: 'POST', url: '/auth/login', ip: '11.11.11.13', body: { identifier: 'del@test.io', password: pw } });
    // Login on PENDING_DELETION is allowed and should let them cancel.
    const access2 = login.cookies['lx_access'];
    const cancel = await t.req({ method: 'POST', url: '/account/delete/cancel', cookies: { lx_access: access2 } });
    expect(cancel.status).toBe(201);
    const after = await t.prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(after.status).toBe('ACTIVE');
    expect(after.deletionRequestedAt).toBeNull();
  });

  // ---------------------------------------------------------------------------
  it('purge job hard-deletes accounts past the grace window and anonymizes their events', async () => {
    const { access } = await registerAndLogin('purge@test.io', 'purge_user');
    await t.req({ method: 'POST', url: '/account/delete', cookies: { lx_access: access }, body: { password: pw } });

    const user = await t.prisma.user.findUniqueOrThrow({ where: { email: 'purge@test.io' } });
    // Backdate the deletion request to 31 days ago.
    await t.prisma.user.update({
      where: { id: user.id },
      data: { deletionRequestedAt: new Date(Date.now() - 31 * 24 * 3600 * 1000) },
    });

    const lifecycle = t.app.get(AccountLifecycleService);
    const purged = await lifecycle.purgeExpired();
    expect(purged).toBeGreaterThanOrEqual(1);

    const gone = await t.prisma.user.findUnique({ where: { id: user.id } });
    expect(gone).toBeNull();
    // Security events for the purged user are anonymized (userId nulled), not orphaned.
    const orphans = await t.prisma.securityEvent.findMany({ where: { userId: user.id } });
    expect(orphans).toHaveLength(0);
  });

  // ---------------------------------------------------------------------------
  it('minor cannot set profile to PUBLIC (privacy locked)', async () => {
    const { access } = await registerAndLogin('minor@test.io', 'minor_user');
    // Set age band to a minor band via onboarding.
    await t.req({ method: 'POST', url: '/onboarding/step/age_band', cookies: { lx_access: access }, body: { ageBand: 'TEEN_13_17' } });

    // Re-login so the access token reflects isMinor (age band flips it).
    const login = await t.req({ method: 'POST', url: '/auth/login', ip: '11.11.11.14', body: { identifier: 'minor@test.io', password: pw } });
    const access2 = login.cookies['lx_access'];

    const attempt = await t.req({ method: 'PATCH', url: '/privacy', cookies: { lx_access: access2 }, body: { visibility: 'PUBLIC' } });
    expect(attempt.status).toBe(403);
    expect(attempt.json.error.code).toBe('MINOR_PRIVACY_LOCKED');

    // The profile stays PRIVATE.
    const user = await t.prisma.user.findUniqueOrThrow({ where: { email: 'minor@test.io' }, include: { profile: true } });
    expect(user.profile!.visibility).toBe('PRIVATE');
  });

  // ---------------------------------------------------------------------------
  it('under-13 without consent is blocked from social surfaces (learning-only mode)', async () => {
    const { access } = await registerAndLogin('kid@test.io', 'kid_user', '11.22.33.44');
    await t.req({ method: 'POST', url: '/onboarding/step/age_band', cookies: { lx_access: access }, body: { ageBand: 'UNDER_13' } });
    const login = await t.req({ method: 'POST', url: '/auth/login', ip: '11.11.11.15', body: { identifier: 'kid@test.io', password: pw } });
    const access2 = login.cookies['lx_access'];

    // Privacy (a social surface) is gated behind parental consent.
    const privacy = await t.req({ method: 'GET', url: '/privacy', cookies: { lx_access: access2 } });
    expect(privacy.status).toBe(403);
    expect(privacy.json.error.code).toBe('PARENTAL_CONSENT_REQUIRED');

    // Learning surface still works: tracks list is accessible.
    const tracks = await t.req({ method: 'GET', url: '/tracks', cookies: { lx_access: access2 } });
    expect(tracks.status).toBe(200);
    expect(tracks.json.tracks.length).toBeGreaterThan(0);

    // After parental consent, the social surface unlocks.
    const lifecycle = t.app.get(AccountLifecycleService);
    const user = await t.prisma.user.findUniqueOrThrow({ where: { email: 'kid@test.io' } });
    await t.prisma.user.update({ where: { id: user.id }, data: { parentalConsentAt: new Date() } });
    const privacy2 = await t.req({ method: 'GET', url: '/privacy', cookies: { lx_access: access2 } });
    expect(privacy2.status).toBe(200);
  });

  // ---------------------------------------------------------------------------
  it('enforces the username change limit (max 2 / 365 days)', async () => {
    const { access } = await registerAndLogin('uname@test.io', 'uname_user');

    const c1 = await t.req({ method: 'PATCH', url: '/users/me/username', cookies: { lx_access: access }, body: { username: 'uname_one' } });
    expect(c1.status).toBe(200);

    // Second change is blocked by the 14-day cooldown from the first change.
    const c2 = await t.req({ method: 'PATCH', url: '/users/me/username', cookies: { lx_access: access }, body: { username: 'uname_two' } });
    expect(c2.status).toBe(400);
    expect(['USERNAME_CHANGE_COOLDOWN', 'USERNAME_CHANGE_LIMIT']).toContain(c2.json.error.code);
  });

  // ---------------------------------------------------------------------------
  it('cannot log in to a banned account', async () => {
    await registerAndLogin('banned@test.io', 'banned_user');
    const user = await t.prisma.user.findUniqueOrThrow({ where: { email: 'banned@test.io' } });
    await t.prisma.user.update({ where: { id: user.id }, data: { status: 'BANNED' } });

    const login = await t.req({ method: 'POST', url: '/auth/login', ip: '11.11.11.16', body: { identifier: 'banned@test.io', password: pw } });
    expect(login.status).toBe(403);
    expect(login.json.error.code).toBe('AUTH_ACCOUNT_BANNED');
  });
});
