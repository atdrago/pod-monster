import { isPrivateFeedUrl } from './isPrivateFeedUrl';

describe('isPrivateFeedUrl', () => {
  it.each([
    ['an ATP query with no =', 'https://cdn.atp.fm/rss/public?abc123'],
    ['an ATP member feed', 'https://atp.fm/rss/a1b2c3d4e5f6'],
    ['an ATP member feed with www', 'https://www.atp.fm/rss/a1b2c3d4e5f6'],
    [
      'a Patreon RSS URL with auth',
      'https://www.patreon.com/rss/foghornhour?auth=abc123',
    ],
    [
      'a Patreon RSS path with no query',
      'https://www.patreon.com/rss/foghornhour',
    ],
    [
      'a Substack private URL',
      'https://api.substack.com/feed/podcast/123456/private/0f8e7d6c-5b4a-4392-8170-6f5e4d3c2b1a.rss',
    ],
    [
      'a Supercast member URL with a short token',
      'https://foghornhour.supercast.com/feeds/Ab3dEf7Gh9',
    ],
    [
      'a Supporting Cast member URL with a short token',
      'https://foghornhour.supportingcast.fm/content/Ab3dEf7Gh9.rss',
    ],
    [
      'a Supercast member URL on supercast.tech',
      'https://foghornhour.supercast.tech/feeds/Ab3dEf7Gh9',
    ],
    [
      'a Supporting Cast member URL on supportingcast.co',
      'https://foghornhour.supportingcast.co/content/Ab3dEf7Gh9.rss',
    ],
    [
      'a Supporting Cast member URL on supportingcast.cc',
      'https://foghornhour.supportingcast.cc/content/Ab3dEf7Gh9.rss',
    ],
    [
      'a Transistor subscriber URL with a short token',
      'https://subscribers.transistor.fm/0123abcd4567ef',
    ],
    [
      'a Captivate private URL with short segments',
      'https://private.captivate.fm/abc123/def456',
    ],
    [
      'a Pinecast subscriber URL',
      'https://pinecast.com/feed/foghornhour/sub/abc123',
    ],
    [
      'an Acast Access member URL with a slug show id',
      'https://access.acast.com/rss/foghornhour/ab12cd34',
    ],
    [
      'a Slate Plus subscription URL',
      'https://my.slate.com/subscriptions/abc123/feed',
    ],
    [
      'an Anchor private auth URL',
      'https://anchor.fm/s/1234abcd/podcast/auth/abc123/rss',
    ],
    [
      'a Memberful member URL',
      'https://foghornhour.memberfulcontent.com/rss/1234?auth=abc123',
    ],
    [
      'an Acast Access member URL',
      'https://access.acast.com/rss/5d28ef74d3cc3f013778b13b/ab12cd34',
    ],
    [
      'an Omny Studio member RSS URL',
      'https://omny.fm/shows/restricted-content-access-demo/playlists/members-only-feed.rss?member=36c97f50-19ab-483d-bebe-41ba74bc3f64',
    ],
    [
      'a RedCircle private feed',
      'https://feeds.redcircle.com/f4b1d8b8-db4f-497b-9fb9-027130d51967/pf/ab12cd34',
    ],
    [
      'a path with a 32-character hex segment',
      'https://feeds.example.com/podcast/0123456789abcdef0123456789abcdef',
    ],
    [
      'a path with a long run of digits',
      'https://feeds.example.com/podcast/12345678901234567890',
    ],
    [
      'a <token>.rss segment',
      'https://feeds.example.com/members/Ab3dEf7Gh9Jk2LmN4pQr6.rss',
    ],
    [
      'a <token>.xml segment',
      'https://feeds.example.com/members/Ab3dEf7Gh9Jk2LmN4pQr6.xml',
    ],
    [
      'a UUID inside a segment',
      'https://feeds.example.com/feed-0f8e7d6c-5b4a-4392-8170-6f5e4d3c2b1a',
    ],
    ['a private segment', 'https://feeds.example.com/show/private/feed.xml'],
    [
      'a private segment in capitals',
      'https://feeds.example.com/show/Private/feed.xml',
    ],
    ['a token query key', 'https://feeds.example.com/rss?token=abc'],
    [
      'a camelCase token query key',
      'https://feeds.example.com/rss?accessToken=abc',
    ],
    ['an api_key query key', 'https://feeds.example.com/rss?api_key=abc'],
    ['a secret query key', 'https://feeds.example.com/rss?secret=abc'],
    ['a sig query key', 'https://feeds.example.com/rss?sig=abc'],
    [
      'a signed storage URL',
      'https://bucket.example.com/rss/member?X-Amz-Credential=abc&X-Amz-Signature=def',
    ],
    [
      'a query value that looks like a secret',
      'https://feeds.example.com/rss?id=0123456789abcdef0123456789abcdef',
    ],
    [
      'a bare token among other query values',
      'https://feeds.example.com/rss?format=rss&Ab3dEf7Gh9Jk2LmN4pQr6',
    ],
    [
      'a URL with a user name and password',
      'https://listener:hunter2@feeds.example.com/rss',
    ],
    ['a URL with a user name', 'https://listener@feeds.example.com/rss'],
    [
      'a member host with a trailing dot',
      'https://foghornhour.supercast.com./feeds/Ab3dEf7Gh9',
    ],
    ['a URL that does not parse', 'not a url'],
    ['a URL with no host', 'https://'],
  ])('should flag %s', (_, feedUrl) => {
    expect(isPrivateFeedUrl(feedUrl)).toBe(true);
  });

  it.each([
    [
      'a Podhome feed',
      'https://serve.podhome.fm/rss/7a1c2b3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d',
    ],
    [
      'a Flightcast feed',
      'https://rss2.flightcast.com/bdfzqlrrkeicpm091wsbuk9y',
    ],
    [
      'a Flightcast feed with .xml',
      'https://rss2.flightcast.com/bdfzqlrrkeicpm091wsbuk9y.xml',
    ],
    ['a Megaphone feed', 'https://feeds.megaphone.fm/ADL9840290619'],
    ['a Megaphone slug feed', 'https://feeds.megaphone.fm/ted-ed'],
    ['a Simplecast feed', 'https://feeds.simplecast.com/54nAGcIl'],
    [
      'a Transistor slug feed',
      'https://feeds.transistor.fm/the-daily-show-with-a-long-slug',
    ],
    ['a Libsyn feed', 'https://feeds.libsyn.com/12345/rss'],
    ['an Anchor feed', 'https://anchor.fm/s/1234abcd/podcast/rss'],
    ['a Fountain feed', 'https://feeds.fountain.fm/ZwwaDULvAj0yZvJ5kdB9'],
    [
      'a Wavlake music feed',
      'https://wavlake.com/feed/music/585f2ce8-cfbc-4581-ad71-aef893022d76',
    ],
    [
      'a Wavlake show feed',
      'https://wavlake.com/feed/show/50da4a35-d4dc-482e-8849-ea94484a2f2e',
    ],
    [
      'a Wavlake feed with no kind',
      'https://www.wavlake.com/feed/585f2ce8-cfbc-4581-ad71-aef893022d76',
    ],
    [
      'an Omny Studio feed',
      'https://www.omnycontent.com/d/playlist/b879ead7-5fbb-4c64-bede-b13801013ca4/d6947d21-dd7e-4696-b376-b16f00b50341/0ce11372-5b13-43e3-bf4b-b16f00b50370/podcast.rss',
    ],
    [
      'an Omny Studio feed with its documented query',
      'https://www.omnycontent.com/d/playlist/b879ead7-5fbb-4c64-bede-b13801013ca4/d6947d21-dd7e-4696-b376-b16f00b50341/0ce11372-5b13-43e3-bf4b-b16f00b50370/podcast.rss?altEnclosureUrls=true',
    ],
    [
      'a RedCircle feed',
      'https://feeds.redcircle.com/f4b1d8b8-db4f-497b-9fb9-027130d51967',
    ],
    [
      'an Acast feed with a hex id',
      'https://feeds.acast.com/public/shows/5d28ef74d3cc3f013778b13b',
    ],
    [
      'an Acast feed with a UUID',
      'https://feeds.acast.com/public/shows/30ae66f3-cf9b-4b0b-8f96-9f360b545ece',
    ],
    ['a Squarespace feed', 'https://www.example.com/podcast?format=rss'],
    ['the public ATP feed', 'https://atp.fm/rss'],
    ['the public ATP feed with no cache key', 'https://cdn.atp.fm/rss/public'],
    [
      'a feed with a query key that only contains sig',
      'https://radio.example.com/dx/get_podcasts.cfm?stationCallSign=WSKV',
    ],
    ['a Spreaker feed', 'https://www.spreaker.com/show/3269717/episodes/feed'],
    [
      'a feed with a hyphenated slug',
      'https://feeds.example.com/the-very-long-show-name-about-history-2024',
    ],
  ])('should not flag %s', (_, feedUrl) => {
    expect(isPrivateFeedUrl(feedUrl)).toBe(false);
  });

  it.each([
    [
      'a Podhome feed with a private segment',
      'https://serve.podhome.fm/rss/7a1c2b3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d/private',
    ],
    [
      'a Wavlake feed with a segment beyond its public shape',
      'https://wavlake.com/feed/music/585f2ce8-cfbc-4581-ad71-aef893022d76/member',
    ],
    [
      'a Flightcast feed with a segment beyond its public shape',
      'https://rss2.flightcast.com/bdfzqlrrkeicpm091wsbuk9y/feed.xml',
    ],
    [
      'an Acast feed with a token beyond its public shape',
      'https://feeds.acast.com/public/shows/5d28ef74d3cc3f013778b13b/ab12cd34',
    ],
    [
      'a Fountain feed with a token query',
      'https://feeds.fountain.fm/ZwwaDULvAj0yZvJ5kdB9?token=abc',
    ],
    [
      'an Omny Studio feed with a query value that looks like a secret',
      'https://www.omnycontent.com/d/playlist/b879ead7-5fbb-4c64-bede-b13801013ca4/d6947d21-dd7e-4696-b376-b16f00b50341/0ce11372-5b13-43e3-bf4b-b16f00b50370/podcast.rss?member=36c97f50-19ab-483d-bebe-41ba74bc3f64',
    ],
  ])('should flag %s on a public host', (_, feedUrl) => {
    expect(isPrivateFeedUrl(feedUrl)).toBe(true);
  });
});
