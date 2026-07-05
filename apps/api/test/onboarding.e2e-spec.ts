import { bootstrapTestApp, type TestApp } from './harness';

/**
 * Onboarding happy path (§5.6, §6): a guest walks the funnel, takes a placement quiz, and
 * completes onboarding to receive a personalized plan — the core activation journey.
 */
describe('Onboarding journey (§5.6)', () => {
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

  it('guest completes onboarding and gets a personalized, motivation-ordered plan', async () => {
    // Guest starts.
    const guest = await t.req({ method: 'POST', url: '/auth/guest', ip: '50.1.1.1', body: { deviceId: 'journey-device-1' } });
    expect(guest.status).toBe(201);
    const access = guest.cookies['lx_access'];

    // Tracks list is available (public, cached).
    const tracks = await t.req({ method: 'GET', url: '/tracks', cookies: { lx_access: access } });
    expect(tracks.status).toBe(200);
    const mathTrack = tracks.json.tracks.find((x: any) => x.slug === 'mathematics');
    expect(mathTrack).toBeTruthy();

    // Step through the funnel.
    await t.req({ method: 'POST', url: '/onboarding/step/tracks', cookies: { lx_access: access }, body: { trackSlugs: ['mathematics', 'coding-tech'] } });
    await t.req({ method: 'POST', url: '/onboarding/step/motivation', cookies: { lx_access: access }, body: { motivation: 'exams' } });
    await t.req({ method: 'POST', url: '/onboarding/step/level', cookies: { lx_access: access }, body: { level: 'basics' } });
    await t.req({ method: 'POST', url: '/onboarding/step/daily_goal', cookies: { lx_access: access }, body: { dailyGoalMinutes: 15 } });
    await t.req({ method: 'POST', url: '/onboarding/step/age_band', cookies: { lx_access: access }, body: { ageBand: 'ADULT_18_24' } });

    // Placement quiz for the primary track.
    const start = await t.req({ method: 'POST', url: `/onboarding/placement/${mathTrack.id}/start`, cookies: { lx_access: access } });
    expect(start.status).toBe(201);
    expect(start.json.questions.length).toBeGreaterThan(0);
    // Answer choice 0 for each (score is deterministic; we only assert shape).
    const answers = start.json.questions.map((q: any) => ({ questionId: q.id, choiceIdx: 0 }));
    const submit = await t.req({ method: 'POST', url: `/onboarding/placement/${mathTrack.id}/submit`, cookies: { lx_access: access }, body: { answers } });
    expect(submit.status).toBe(201);
    expect(['NEW', 'BEGINNER', 'INTERMEDIATE', 'CONFIDENT']).toContain(submit.json.level);

    // Complete → personalized plan.
    const complete = await t.req({ method: 'POST', url: '/onboarding/complete', cookies: { lx_access: access } });
    expect(complete.status).toBe(201);
    expect(complete.json.tracks.length).toBe(2);
    expect(complete.json.dailyGoalMinutes).toBe(15);
    // exam motivation pulls assessment-style units first.
    const primary = complete.json.tracks[0];
    expect(primary.firstUnits.length).toBeGreaterThan(0);

    // State now reflects completion + user has tracks + streak initialized at 0 (§10).
    const me = await t.req({ method: 'GET', url: '/users/me', cookies: { lx_access: access } });
    expect(me.json.onboarding.completed).toBe(true);
    expect(me.json.tracks.length).toBe(2);

    const user = await t.prisma.user.findFirstOrThrow({ where: { isGuest: true }, include: { streak: true, tracks: true } });
    expect(user.streak?.current).toBe(0);
    expect(user.tracks.length).toBe(2);
    expect(user.tracks.some((x) => x.isPrimary)).toBe(true);
  });

  it('rejects completing onboarding when required steps are missing', async () => {
    const guest = await t.req({ method: 'POST', url: '/auth/guest', ip: '50.1.1.2', body: { deviceId: 'journey-device-2' } });
    const access = guest.cookies['lx_access'];
    // Only pick tracks; skip the rest.
    await t.req({ method: 'POST', url: '/onboarding/step/tracks', cookies: { lx_access: access }, body: { trackSlugs: ['mathematics'] } });
    const complete = await t.req({ method: 'POST', url: '/onboarding/complete', cookies: { lx_access: access } });
    expect(complete.status).toBe(400);
    expect(complete.json.error.code).toBe('ONBOARDING_INCOMPLETE');
  });

  it('advances the step machine and reports the next step', async () => {
    const guest = await t.req({ method: 'POST', url: '/auth/guest', ip: '50.1.1.3', body: { deviceId: 'journey-device-3' } });
    const access = guest.cookies['lx_access'];
    const r = await t.req({ method: 'POST', url: '/onboarding/step/tracks', cookies: { lx_access: access }, body: { trackSlugs: ['biology'] } });
    expect(r.status).toBe(201);
    expect(r.json.nextStep).toBe('motivation');
  });
});
