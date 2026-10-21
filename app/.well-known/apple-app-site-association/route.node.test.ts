import { GET } from './route';

describe('apple-app-site-association route', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('should return the app links of the /feeds/ paths for the Team ID', async () => {
    vi.stubEnv('APPLE_TEAM_ID', 'ABCDE12345');

    const response = GET();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('application/json');
    expect(response.headers.get('location')).toBeNull();
    await expect(response.json()).resolves.toEqual({
      applinks: {
        details: [
          {
            appIDs: ['ABCDE12345.app.podmonster'],
            components: [{ '/': '/feeds/?*' }],
          },
        ],
      },
    });
  });

  it('should return 404 and log a warning when APPLE_TEAM_ID is not set', () => {
    vi.stubEnv('APPLE_TEAM_ID', undefined);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const response = GET();

    expect(response.status).toBe(404);
    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0][0]).toContain(
      'apple_app_site_association_missing_team_id',
    );
  });

  it('should return 404 when APPLE_TEAM_ID holds only whitespace', () => {
    vi.stubEnv('APPLE_TEAM_ID', ' \n');
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(GET().status).toBe(404);
  });

  it('should remove the whitespace around the Team ID', async () => {
    vi.stubEnv('APPLE_TEAM_ID', 'ABCDE12345\n');

    const body = await GET().json();

    expect(body.applinks.details[0].appIDs).toEqual([
      'ABCDE12345.app.podmonster',
    ]);
  });
});
