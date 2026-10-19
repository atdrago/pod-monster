// `next build` runs this handler one time, and the server sends the saved
// result. A change of `APPLE_TEAM_ID` thus needs a new deploy.
export const dynamic = 'force-static';

// eslint-disable-next-line @typescript-eslint/naming-convention -- Next.js routes a request by the name of the HTTP method.
export function GET() {
  const appleTeamId = process.env.APPLE_TEAM_ID?.trim();

  if (appleTeamId === undefined || appleTeamId === '') {
    // eslint-disable-next-line no-console -- Sentry does not start during `next build`, so the build log is the only sink.
    console.warn(
      'apple_app_site_association_missing_team_id: Set APPLE_TEAM_ID to serve /.well-known/apple-app-site-association. The route answers 404.',
    );

    return new Response(null, { status: 404 });
  }

  return Response.json({
    applinks: {
      details: [
        {
          appIDs: [`${appleTeamId}.app.podmonster`],
          components: [{ '/': '/feeds/?*' }],
        },
      ],
    },
  });
}
