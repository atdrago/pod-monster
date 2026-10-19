---
title: Share Link Paths on pod.monster - Plan
type: feat
date: 2026-10-18
topic: support-native-urls
artifact_contract: ce-unified-plan/v1
product_contract_source: ce-brainstorm
execution: code
deepened: 2026-10-18
---

# Share Link Paths on pod.monster - Plan

## Goal Capsule

- **Objective:** A person who opens a Pod Monster share link without the app sees the show or the episode on `pod.monster`, and can play it from the shared time. A person with the app on iOS lands in the app.
- **Means:** The site moves its show and episode pages to the route paths of the app under `/feeds/`. One server loader gets the data from Podcast Index or from the RSS feed (KTD1, KTD2, KTD3). An `apple-app-site-association` file lets iOS open these paths in the app (KTD12).
- **Product authority:** This Product Contract. The user owns every product decision. The user made the decisions marked `session-settled` in the brainstorm. The app side of share links is in the native share plan (see Dependencies / Assumptions), not here. The Planning Contract owns the how-level choices. An R wins on product behavior, and a KTD wins on mechanism, with one exception. The document review proposed three clarifications of the Product Contract that wait for the user: R1 names the episode identity of KTD5, R2 drops the OpenGraph URL on a private page per KTD10, and R4 sends a transient failure to the error page of KTD16. Until the user decides, follow KTD5, KTD10, and KTD16 at those three points.
- **Execution profile:** Deep. 14 units in three phases on the branch `support-native-urls`. `ce-work` implements, and the `lfg` pipeline reviews the change and opens the pull request.
- **Stop conditions:** Stop and report when one of these is true:
  - A session-settled decision proves unworkable.
  - The IndexedDB upgrade of U5 fails for a database at version 5 with data.
  - Hydration does not end within its time limit when another tab holds the database open at version 5 (KTD13).
  - The `apple-app-site-association` route and its rewrite fallback (KTD12) both fail to serve JSON with status 200.
  - A test shows that a feed URL reaches a Sentry event, a Vercel Analytics event, or a log line that the site writes.
- **Open blockers:** None for implementation. The Vercel project needs the `APPLE_TEAM_ID` variable before the file of U9 serves anything (see Documentation / Operational Notes). The native share plan says that testers must not receive a build with Share before this work ships.

---

## Product Contract

### Summary

Show and episode pages move to the app paths `/feeds/<feed>` and `/feeds/<feed>/episodes/<episode>`, and old `/podcasts/` links redirect to them. A page uses Podcast Index data, and reads the RSS feed when Podcast Index does not know the show or the episode. An `apple-app-site-association` file lets iOS open these paths in the app, and the site keeps member-feed tokens out of its logs.

### Problem Frame

The native app will share `https://pod.monster` links. The path of each link is the route path of the show or the episode in the app, and an episode link can carry a `t` time. Today the site serves shows and episodes only at `/podcasts/<Podcast Index id>`, so each share link goes to a page that does not exist.

The site also finds each show only through Podcast Index. A show that Podcast Index does not know, for example a private member feed, has no page. The site has no `apple-app-site-association` file, so iOS cannot open a `pod.monster` link in the app.

A private member feed adds a cost. Its token is part of the feed URL, so the token is part of the path of each share link. The app warns the sharer about this. But the site must not spread the token further.

### Actors

- A1. A recipient without Pod Monster. This person opens a share link on any device, and the site serves the page.
- A2. A Pod Monster user on iOS. iOS opens a share link in the app. When the universal link does not open the app, for example after a paste into Safari, this person lands on the web page.
- A3. A repeat web visitor. This person uses the site as a podcast app, with a library and saved positions in the browser.

### Key Decisions

- **Serve the share paths only.** (session-settled: user-directed, chosen over every app path and over the share paths plus their web equivalents: only these links leave a device today.) Governs R1, R11.
- **`/feeds/` is the one format for show and episode pages.** (session-settled: user-directed, chosen over two formats side by side and over a redirect from `/feeds/` to `/podcasts/`: a link that a web visitor copies also opens the app.) Governs R2, R3.
- **Podcast Index first, then the RSS feed.** (session-settled: user-directed, chosen over a short "open in the app" page and over the Pod Monster API server as the only source: every share link gets a full page, and the pages keep Podcast Index data where it exists.) Governs R5, R6.
- **The `t` prompt matches the app.** (session-settled: user-directed, chosen over a play button that starts at `t` and over no support for `t`: one link behaves the same on web and in the app.) Governs R7, R8, R9.
- **No app promotion for now.** (session-settled: user-directed, chosen over a Smart App Banner now and over an "Open in Pod Monster" button: the app is in TestFlight only.) Governs R10.
- **Protect private feeds now.** (session-settled: user-approved, chosen over acceptance of the risk because the sharer accepted it: the site does what it can now.) Governs R12, R13, R14, R15.
- **Layered protections.** (session-settled: user-directed, chosen over one private-feed rule for all three protections: if the rule misses a private feed, its token still stays out of logs and analytics.) Governs R12, R13, R14.
  - Conflict call-out: the decision holds, but R12 is not reachable while Sentry Session Replay is on. Replay events skip every Sentry scrub hook, and `maskAllText` does not mask link `href` values. KTD8 removes Replay for the whole site.
- **Feed URL and episode guid are the keys of saved data.** (session-settled: user-approved, chosen over Podcast Index ids as keys: a feed URL can be looked up directly, a show from the RSS feed has no Podcast Index id, and the site will move to feed URLs as its main key.) Governs R16, R17.
- **Clean break for old saved data.** (session-settled: user-directed, chosen over a conversion of the library only and over a conversion of all saved data: one key scheme, and no conversion code.) Governs R18.

### Requirements

**Paths and redirects**

- R1. The site serves a show page at `/feeds/<feed>` and an episode page at `/feeds/<feed>/episodes/<episode>`. `<feed>` is the feed URL and `<episode>` is the episode guid, each in the base64url form that the app uses.
- R2. Every link that the site makes to a show or an episode uses the R1 paths, and so does the OpenGraph URL of each page.
- R3. An old `/podcasts/<feedId>` or `/podcasts/<feedId>/episodes/<episodeId>` link redirects permanently to the R1 path of the same show or episode.
- R4. A `/feeds/` path that does not decode, or a show or episode that the site cannot find in Podcast Index or in the RSS feed, shows the not-found page.

**Data source**

- R5. A page gets the show from Podcast Index by its feed URL, and the episode by its guid.
- R6. When Podcast Index does not know the show, or knows the show but not the episode, the page reads the RSS feed and shows the full page from it.

**Episode time**

- R7. When an episode link carries a valid `t` time, the page shows a prompt that offers "Play from <time>" and "Not Now".
- R8. "Play from <time>" starts playback of that episode at that time, and replaces any episode that plays. "Not Now" closes the prompt, and the episode keeps the saved position of the visitor.
- R9. A link with no `t`, or with a `t` that is not valid for the episode, opens the page with no prompt.

**Open in the app**

- R10. The pages show no app banner and no "Open in Pod Monster" button.
- R11. The site serves an `apple-app-site-association` file that lets the app `app.podmonster` open the R1 paths and no other path.

**Private feeds**

- R12. On every `/feeds/` page, the site keeps the feed and episode parts of the path out of its own server logs, Sentry events, Vercel Analytics, and Speed Insights.
- R13. When a feed URL is private, the site does not send it to Podcast Index, and reads the RSS feed directly.
- R14. When a feed URL is private, the page tells search engines not to index it.
- R15. The site and the app use one rule to decide that a feed URL is private.

**Library and saved data**

- R16. The web library, the saved play positions, and the player state use the feed URL and the episode guid as keys, for every show.
- R17. A visitor can add a show from the RSS feed to the library, and the site saves play positions for its episodes.
- R18. Data that the site saved under Podcast Index ids does not carry over, and the site shows no notice about it.

```mermaid
flowchart TB
  A[Visitor opens a /feeds/ path] --> B{Path decodes to a feed URL?}
  B -->|no| X[Not-found page]
  B -->|yes| C{Feed URL is private?}
  C -->|yes| R[Read the RSS feed]
  C -->|no| D{Podcast Index knows the show, and the episode on an episode page?}
  D -->|yes| P[Page from Podcast Index data]
  D -->|no| R
  R --> E{Feed readable, and episode found?}
  E -->|yes| F[Page from RSS feed data]
  E -->|no| X
```

The diagram shows R4, R5, R6, and R13. The requirements above are the full rule.

### Key Flows

- F1. Open a share link without the app
  - **Trigger:** A1 taps a share link for an episode, with a `t` time.
  - **Actors:** A1
  - **Steps:** The site decodes the path. The site gets the show and the episode from Podcast Index or from the RSS feed. The page shows the "Play from <time>" prompt. A1 picks "Play from <time>" or "Not Now".
  - **Outcome:** Playback starts at the shared time, or the page stays open with no playback.
  - **Covered by:** R1, R4, R5, R6, R7, R8, R9
- F2. Open a share link with the app
  - **Trigger:** A2 taps a share link on iOS.
  - **Actors:** A2
  - **Steps:** iOS reads the `apple-app-site-association` file of the site and opens the app on the same path.
  - **Outcome:** The app shows the show or the episode. When iOS does not open the app, A2 follows F1 on the web.
  - **Covered by:** R1, R11
- F3. Open an old link
  - **Trigger:** A3 opens a bookmark to a `/podcasts/` page.
  - **Actors:** A3
  - **Steps:** The site redirects to the `/feeds/` path of the same show or episode.
  - **Outcome:** The page shows, with an empty library and no saved position from before the change.
  - **Covered by:** R3, R18

### Acceptance Examples

- AE1. **Covers R5, R6.** Given a show that Podcast Index does not know, when A1 opens its show link, then the page shows the show and its episodes from the RSS feed.
- AE2. **Covers R6.** Given Podcast Index knows a show but not an episode from an hour ago, when A1 opens a link to that episode, then the page shows the episode from the RSS feed.
- AE3. **Covers R7, R8.** Given an episode link to 12:34, when A1 taps "Play from 12:34", then playback of the episode starts at 12:34.
- AE4. **Covers R8.** Given A3 has a saved position of 40:12 and opens a link to 12:34, when A3 taps "Not Now", then the play button resumes from 40:12.
- AE5. **Covers R9.** Given an episode of 30:00, when A1 opens a link to 45:00, then the page shows with no prompt.
- AE6. **Covers R3.** Given a bookmark to `/podcasts/<feedId>/episodes/<episodeId>`, when A3 opens it, then the site redirects to the `/feeds/` path of the same episode.
- AE7. **Covers R12.** Given a public show, when A1 opens its page, then the Sentry events and the analytics page views for that visit contain no part of the feed URL.
- AE8. **Covers R13, R14.** Given a feed URL with a member token, when A1 opens its link, then the site sends no request about it to Podcast Index, the page shows from the RSS feed, and the page has `noindex`.
- AE9. **Covers R17.** Given a show from the RSS feed only, when A3 adds it to the library, then the show is in the library on the next visit.
- AE10. **Covers R18.** Given A3 had shows in the library before the change, when A3 opens the site after the change, then the library is empty and no notice shows.

### Scope Boundaries

- The site serves no other app path, for example the episode list, Settings, the live item, the transcript, or the chat (per R1).
- A Smart App Banner and an "Open in Pod Monster" button wait until the app is in the App Store (per R10).
- Handoff is not part of this work.
- OPML import keeps its rule of today: it adds only the feeds that Podcast Index knows. A later change can widen it.
- The app side of share links is in the native share plan: the Share button, the private-feed warning, the associated domain, and the time prompt in the app.

#### Deferred to Follow-Up Work

- Keep `utils/isPrivateFeedUrl.ts` the same as the native `mayContainPrivateFeedToken` (R15, KTD6). A later change to either copy goes into both repos. Send the feed key rule of KTD13 to the native repo, so that the links of the app and the keys of the site agree.
- Collect a real member-feed URL from Supercast, Memberful, Supporting Cast, Substack, and the private feeds of Transistor, Libsyn, and Acast, and add each one to the shared test cases in both repos. The research confirmed only the Patreon form.
- Confirm in the native share plan that the app writes `t` in one of the forms of KTD15, and that it encodes the feed URL string that it stores.
- Ask the user whether every page that comes from the RSS feed, public or not, gets `noindex`. A visitor can make an indexable page from any feed. The "Layered protections" Key Decision ties `noindex` to the private rule only, so this plan does not change it.
- Escape XML values in the OPML export (`hooks/useOpmlFileUrl.ts`). A title or a URL with `&` makes a file that is not valid. This bug exists today.
- Move the Podcast Index secret out of the `NEXT_PUBLIC_` variables. A `NEXT_PUBLIC_` value goes into client bundles. This issue exists today.
- Add logs to the `catch` blocks of the other API routes in `app/api/`, which drop errors today.
- Keep the `subscribedAt` of a library record that an OPML merge import writes again. This bug exists today.
- Check that client Sentry starts at all. `instrumentation-client.ts` calls `Sentry.init` inside `onClientInit`, which is not a documented Next.js hook.
- Cache public RSS reads across requests, if load needs it (KTD17).
- Count page views for each show without the feed URL, if a safe key appears.

### Dependencies / Assumptions

- The native share plan defines the link format. It is `docs/plans/2026-10-18-1809-feat-share-podcast-and-episode-plan.md` in the `pod-monster-native` repo, on its share branch, and not merged yet. Its R7 sets the paths and the `t` query value, and its R8 sets the private-feed warning.
- The share branch of the app adds `applinks:pod.monster` to `app.json`. The `apple-app-site-association` file also needs the Apple Team ID of the app.
- Vercel keeps its own request logs with the full path, and the site cannot change that. A member token in a path stays in those logs. The "Outgoing Requests" field of the runtime logs can also show the URL of the RSS read. The sharer accepted that anyone with the link can listen.
- A show from the RSS feed lacks some data that only Podcast Index gives. The page shows what the feed contains.

### Outstanding Questions

All questions that the brainstorm deferred are now resolved in the Planning Contract:

- The rule that decides that a feed URL is private (R15): KTD6. The site ports the rule of the native share branch.
- The form of the `t` value (R7): KTD15.
- How the server reads an RSS feed and guards the fetch (R6): KTD3, KTD4, KTD17, KTD20.
- Which page parts need data that only Podcast Index gives (R6): KTD1. A part with no data does not show.
- How the site keeps the path out of Sentry and analytics (R12): KTD7, KTD8, KTD9, KTD21. No substitute key keeps counts for each show.
- How R1 finds an episode with no guid, or with a guid that is not unique: KTD5.
- Whether the site deletes the old browser data (R18): KTD13. It deletes it.

### Sources / Research

- `app/podcasts/[feedId]/page.tsx` and `app/podcasts/[feedId]/episodes/[episodeId]/page.tsx`: the pages of today. They call `podcastsByFeedId`, `episodesByFeedId`, and `episodeById` with Podcast Index ids.
- `packages/podcast-index/index.ts`: exports `podcastsByFeedUrl`. No call for `episodes/byguid` exists.
- `utils/paths.ts`: builds the `/podcasts/` paths. Its callers are `app/HomePage.tsx`, `components/molecules/EpisodeList.tsx`, `components/molecules/SubscriptionItem/SubscriptionItem.tsx`, `components/molecules/Header/Header.tsx`, `components/organisms/MediaPlayer/MediaPlayer.tsx`, and the OpenGraph URL of both pages.
- `contexts/SettingsContext/SettingsContext.tsx`: the IndexedDB stores `episodeSettings` and `feedSettings`, keyed by Podcast Index ids, and the player state with Podcast Index ids. `contexts/SettingsContext/migrations/` holds the migration pattern of the site.
- `components/atoms/SubscribeButton/SubscribeButton.tsx` and `app/api/settings/opml/import/route.ts`: the library writes, keyed by Podcast Index feed id.
- `instrumentation-client.ts`, `instrumentation.ts`, `next.config.mjs` (`withSentryConfig`), and `app/layout.tsx` (`Analytics`, `SpeedInsights`): where a path reaches Sentry and Vercel.
- `next.config.mjs` has no `redirects`, `rewrites`, or `headers`. The repo has no `public/.well-known/`, no `middleware.ts`, and no `proxy.ts`. No dependency parses RSS.
- `app/sitemap.ts`: lists only `about` and `settings`.
- The `pod-monster-native` repo:
  - `src/utils/base64.ts`: the base64url form of a path segment. Its decoder also accepts standard base64.
  - `src/utils/parseTimecodeHref.ts`: the time forms that the app accepts.
  - `src/app/(tabs)/(library,search)/feeds/[feedUrlBase64].tsx` and `.../feeds/[feedUrlBase64]/episodes/[guidBase64].tsx`: the app routes.
  - `packages/server/src/feed/resolveFeed.ts` and `packages/server/src/lib/feedUrlValidation.ts`: how the native server fetches a feed, with its guards. The server parses feeds with `feedsmith`.

---

## Planning Contract

Product Contract preservation: restructured, no scope change. The Outstanding Questions now cite the KTDs that answer them. The "Layered protections" Key Decision has a conflict call-out (KTD8). Scope Boundaries has a "Deferred to Follow-Up Work" subsection, and Dependencies / Assumptions names the "Outgoing Requests" log field.

### Key Technical Decisions

- KTD1. **One loader for each request returns source-neutral types.** `utils/server/loadFeed.ts` exports a show loader and an episode loader, each wrapped in `React.cache`, so `generateMetadata` and the page share one result. They return `PodcastFeed` and `PodcastEpisode` from `types/PodcastFeed.ts`, plus the source and the private flag.
  - The types are plain serializable data, because they cross the server-to-client boundary. They import nothing from `feedsmith` or `podcastdx-client`. The mappers live in `utils/server/`.
  - A field that the source does not give is absent, and its part of the page does not show.
  - The RSS parser keeps every episode, so the episode loader can find an older episode. Only the list on an RSS show page keeps the 100 newest, the same as `episodesByFeedId`.
  - Rejected: put RSS data into the Podcast Index shapes. RSS has no numeric `id`, `feedId`, or `dateCrawled`, so that option puts made-up values into keys and gates.

  Governs R5, R6, R13.

- KTD2. **Any Podcast Index answer other than a clear hit falls back to the RSS feed.** A miss is a non-2xx status, a network error, a timeout, `status` other than `"true"`, a `feed` that is empty or an array, an empty episode list for a known show, or no `episode` with a guid. A 400 or 401 status also logs a configuration error. Each Podcast Index call has a 5-second deadline, because `request()` has none today and a hung call blocks the fallback. The page then works when Podcast Index is down or late. Governs R5, R6.
- KTD3. **The server reads a feed through a port of the native SSRF guard, on `undici`.** The visitor controls the URL, and global `fetch` cannot pin DNS. `undici` is the Node.js HTTP client under global `fetch`, and the native guard uses it. With the same transport, the native tests port with little change. The port keeps these parts:
  1. A DNS check of each address with a `node:dns` `Resolver` that has its own deadline, not `dns.lookup`. The native code records a crawler hang of 4 days 21 hours with `dns.lookup`.
  2. A new `undici` `Agent` for each hop, with its `connect.lookup` pinned to the checked addresses.
  3. A block list with the native IPv4 ranges, plus 192.0.0.0/24, 192.0.2.0/24, 192.88.99.0/24, 198.18.0.0/15, 198.51.100.0/24, 203.0.113.0/24, and 240.0.0.0/4.
  4. An allow list for IPv6: only 2000::/3 passes, minus 2001::/23, 2001:db8::/32, and 2002::/16. Mapped and compatible forms get a check of the embedded IPv4 address.
  5. Manual redirects, at most 5 hops, each hop checked again.
  6. Only `http:` and `https:`. A URL with credentials is rejected. Any port is allowed, the same as native, because the address check is what keeps internal services out of reach.
  7. A 10 MiB cap: a `content-length` over the cap fails before the read, and the stream stops at the cap.
  8. A 20-second deadline for the whole read, DNS included.
  9. A fixed `User-Agent`. No visitor header goes to the feed host.
  10. A body with `<!DOCTYPE`, in any case, is rejected before the parse.
  11. A failure logs only a reason and a status (KTD9), not the host or the native error text.

  Rejected: a new transport on `node:https`, because it rewrites the tested code and the native tests do not reach a new transport. Rejected: the native API server as the source of the fallback, because the site then needs a server-to-server path and a rate-limit exception in another repo, and the user accepted a feed reader in the site. Governs R6, R13.

- KTD4. **`feedsmith` 3.0.0 parses the feed, server-only, through a thin mapper.** It is the same exact version as the native server, so one feed parses the same way in both. It has typed Podcasting 2.0 namespaces, and the repo has no XML parser now. The dependency is necessary for R6. Do not port the native `parseFeedDisplay.ts`; take only the guards that the page needs. Governs R6.
- KTD5. **The identity of an episode is its trimmed guid, else its enclosure URL. The first match in feed order wins.** The native server does the same (`packages/server/src/feed/parseFeedDisplay.ts`). Both mappers trim the guid the same way, with no change of case, so one episode gets one key from either source. An enclosure URL identity can change when the host changes its URL, and the saved position is then lost. The `<episode>` segment encodes this identity. Governs R1.
- KTD6. **The private-feed rule is the rule of the app, ported with no change.** R15 needs one rule, and the native share branch already has it: `mayContainPrivateFeedToken` in `src/utils/shareLink.ts` of the `pod-monster-native` repo (native plan KTD7). Its layers are:
  1. A host that serves only member feeds always flags.
  2. A listed public host exempts only its documented public path shape.
  3. A query flags when it has no `=`, or when a key or a value looks like a credential.
  4. A path flags on a `private` segment, or on a segment that looks like a secret after one `.rss` or `.xml` extension is removed. A hyphenated slug of words does not flag.
  5. A URL that does not parse flags.

  `utils/isPrivateFeedUrl.ts` ports the function and its test cases. A gap in the rule goes into both repos as one change. Rejected: a stricter rule for the site only, because R15 then fails. A URL with a user name or a password never reaches Podcast Index for a separate reason: the loader rejects it (KTD3). Governs R13, R14, R15.

- KTD7. **One redaction module feeds every observability sink.** Paths appear in many event fields, so a walk over every string is safer than a list of fields. `utils/redactFeedPaths.ts` does three things:
  1. It replaces each `/feeds/<segment>` and `/episodes/<segment>` with the route parameter names. A segment runs to the next `/`, `?`, `#`, quote, or whitespace, so a standard base64 form with `+`, `=`, `%2B`, or `%3D` goes too.
  2. It replaces each `url=` or `feedurl=` query value.
  3. In the Sentry walk only, it cuts every absolute URL that is not on the site origin down to its origin. Enclosure, image, chapter, and transcript URLs can hold a token.

  The sinks are:
  1. Sentry on the client and the server: `beforeSend`, `beforeSendTransaction`, `beforeSendSpan`, and `beforeBreadcrumb` apply the walk.
  2. Sentry on the server: `httpIntegration` and `nativeNodeFetchIntegration` ignore all outgoing requests. `requestDataIntegration` sends no URL, query string, headers, cookies, or data. `tracePropagationTargets` is empty, so no `baggage` header leaves the server.
  3. Vercel Analytics and Speed Insights: a `'use client'` wrapper passes a `beforeSend` that applies the redaction and drops the query. It uses the `/next` entry of each package, so the route name stays. If the preview check of U11 finds a segment in any payload field, `beforeSend` returns `null` for every `/feeds/` URL instead.

  Governs R12.

- KTD8. **Remove Sentry Session Replay.** Replay events skip every scrub hook, and `maskAllText` does not mask `href` values, so R12 cannot hold with Replay on. The cost is no session replays on any page. Governs R12.
- KTD9. **Errors and logs carry no feed URL and no guid.**
  - `NetworkError` in `packages/podcast-index/utils/request.ts` keeps only the endpoint path and the status. It drops the `response` property, the body text, and any `cause`. Next.js prints uncaught server errors with their own properties, so each of these puts the URL in a log line.
  - A transient feed failure throws one fixed error class with a reason code only (KTD16).
  - A server `catch` logs a snake_case event tag through `Sentry.captureException` or `Sentry.captureMessage`, with safe fields only: source, reason, and status. A Sentry `extra` never holds a feed id, feed URL, guid, or image URL. The repo has no logger, and this adds none.

  Governs R12.

- KTD10. **A private page drops the metadata that echoes the feed.** `utils/createMetadata.ts` takes an option that sets `robots` to no index and no follow. The same option removes `og:url`, `og:image`, `og:audio`, `og:video`, and the Twitter image. Link-preview services cache these tags, and an enclosure or image URL can hold its own token. Governs R14.
- KTD11. **Old paths redirect from route handlers with status 308, and keep the query string.** `next.config` redirects cannot look up an id. A route handler puts the status in the response head, and the Node test project can test it. Rejected: `permanentRedirect()` in a page, which sends a meta refresh with status 200 if a later change adds streaming above the page. An unknown or invalid id gets a plain 404. A Podcast Index outage gets a 503, so crawlers keep the old pages. Governs R3.
- KTD12. **The `apple-app-site-association` file is a static route handler that reads `APPLE_TEAM_ID`.** The Team ID is in neither repo. The native release scripts read the same variable name. The file has one component, `{ "/": "/feeds/?*" }`, and `appIDs` of `<APPLE_TEAM_ID>.app.podmonster`.
  - The route reads the variable at build time, so a change of the value needs a new deploy.
  - With no variable, the route answers 404, and the build logs a warning.
  - If the App Router does not route the `app/.well-known/` folder, a `rewrites()` entry maps the well-known path to a plain route.
  - Rejected: a file in `public/.well-known/` with a `headers()` rule, because the Team ID must then be in the repo.

  Governs R11.

- KTD13. **Browser storage starts schema version 6 with a clean break.**
  1. The `upgrade` callback creates the three stores for a new database. For any older version, it deletes each store that exists and creates it again. With version 6, the guard `upgradeNewVersion <= 5` of today skips store creation, so new visitors get no stores. The callback calls only synchronous IndexedDB methods, so its transaction does not commit early.
  2. `migrateFrom0To5`, its file, and the `LocalStorageSettings` export go away. The upgrade also removes the old `pod2.settings` localStorage key.
  3. `SettingsContext` owns the key build. Its API takes `{ feedUrl }` and `{ feedUrl, episodeIdentity }`, not key strings, so no reader builds a key a second way.
  4. The feed key is the decoded feed URL after `URL` parsing, with the fragment removed. Parsing lowercases the scheme and the host and removes a default port. The path and the query stay as they are, because a token is case sensitive.
  5. The episode key is the JSON array string of the feed key and the episode identity (KTD5). Rejected: IndexedDB array keys, because the in-memory mirror is a `Record` with string keys, so one string form must exist anyway.
  6. A library record keeps the Podcast Index feed id as a value when Podcast Index knows the show. The new-episode refresh sends only these ids, so no feed URL goes into a query string. A stale id gives no dot, not an error.
  7. Open handling: the page closes the database on `versionchange` and stops later writes. A `blocked` open, a `VersionError`, or any open failure ends hydration with empty state within 5 seconds, and logs an event. An old tab that runs the version 5 code cannot close itself, so it blocks the upgrade until the visitor closes it.
  8. Each write is in a `try`/`catch`. The mirror changes only after the write succeeds, and a failure logs an event.
  9. The provider effect closes its database handle on cleanup, so React Strict Mode does not leave a second handle open.
  10. Hydration of `mediaPlayerSettings` checks the shape at runtime and drops a record without a string feed URL and a string identity.
  11. The debounced position write carries the identity that its time belongs to, so a switch of episode inside the debounce window does not copy a time to the new episode. With string keys that hold the feed URL, a stale write makes a record under the valid key of another episode.
  12. `FeedArtwork` updates the image only of a record that already exists. A visit to a show, private or not, writes nothing.

  Governs R16, R17, R18.

- KTD14. **Chapters and transcripts turn on when their URL exists, not when Podcast Index gives `dateCrawled`.** An RSS-only episode has no `dateCrawled`. The chapters query key is the chapters URL, in `EpisodePage` and in `MediaContext` alike, because the two share one cache. The transcript query key is the URL of the selected transcript, so two episodes with the same transcript count and duration do not share an entry. Governs R6.
- KTD15. **`t` follows the app parser, and the prompt uses the same start path as the play button.**
  1. `utils/parseTimecode.ts` accepts the forms of the native `parseTimecodeHref.ts`: seconds, decimal seconds, `MM:SS`, `HH:MM:SS`, the unit form such as `1m30s`, and an `npt:` prefix.
  2. A valid `t` follows the native `checkShareTime` in `src/utils/shareLink.ts`: one value whose floor is more than 0, before a known end, and less than 24 hours. A known length of 0 or less counts as unknown.
  3. "Play from <time>" calls one start function, shared with the play button. With an explicit time and an episode that is already loaded, the function seeks and plays, the same as `handleTimedListItemClick` in `EpisodePage`. Today the play button seeks only when it loads a new source.
  4. The prompt state is keyed by the episode identity and the raw `t`, so a client navigation to a new link resets it.
  5. After "Play from <time>" or "Not Now", the page removes `t` from the URL with a history replace, so a reload does not ask again. The app clears `t` in the same way (native plan KTD9).
  6. With no explicit time, the start function reads the saved position from `SettingsContext` at call time, so a late IndexedDB hydration still resumes from the saved position.

  Governs R7, R8, R9.

- KTD16. **A transient failure is an error, not a not-found, and the layout stays.** A timeout, a network error, a body over the cap, or a 5xx status from the feed host throws the fixed error class of KTD9. A new `app/feeds/error.tsx` shows it with a retry button. The only error boundary now is `app/global-error.tsx`, which replaces the root layout and so stops the player. A 429 status counts as transient too. A path that does not decode, a blocked URL, a 401, 403, 404, or 410 status from the feed host, a document that is not a feed, and an unknown episode call `notFound()`. A temporary outage then does not give a 404. Governs R4.
- KTD17. **No cache across requests, and the `/feeds/` pages stay dynamic.** `React.cache` removes duplicate work in one request. Both `/feeds/` pages call `await connection()`, so a later `revalidate` or `generateStaticParams` cannot put a private page into the Vercel cache. Rejected: `use cache`, which needs the app-wide `cacheComponents` mode. Rejected: a `fetch` cache for Podcast Index, which does not hit because the auth headers change each second. A private feed must not go into a shared cache.
- KTD18. **Server tests run in a second Vitest project in Node.** Browser mode cannot load `node:dns`, `node:net`, or `undici`. The Node project matches `**/*.node.test.ts`, sets `environment: 'node'`, turns browser mode off, uses no setup file, and does not inherit the root `define` of `process.env`. There, `server-only` resolves to an empty module. The browser project excludes `**/*.node.test.ts`.
- KTD19. **A segment that is not in canonical form redirects to the canonical form.** The decoder accepts standard base64 and padding, so one episode can have many URLs. Then the `MediaPlayer` path check and `og:url` disagree. A `/feeds/` page whose segment is not `encode(decode(segment))` redirects with status 308 to the canonical path, with the query string. Governs R1, R2.
- KTD20. **Every server fetch of a URL from a feed goes through the KTD3 guard.**
  - The episode image probe sends `Range: bytes=0-1048575` through the ranged mode of the guard, and gives those bytes to `probe-image-size`. In ranged mode, as in the native `safeFetch`, a `content-length` over the cap does not fail the read, and the body stops at the cap.
  - The chapters and transcript proxy routes fetch through the guard with a cap of 5 MiB, and return fixed error codes with no message and no stack.
  - A proxy answer for a private target URL (KTD6) sends `Cache-Control: private, no-store`.

  Today these three fetches have no guard, and the RSS fallback lets any visitor name a feed whose URLs point at internal hosts. Governs R6, R12.

- KTD21. **The site sends `Referrer-Policy: no-referrer` on every path.** A `/feeds/` page sends its full URL as the `Referer` of each same-origin request: `/monitoring`, `/_vercel/insights/*`, `/api/podcasts/*`, and the next page. Log drains record that header. A client navigation keeps the policy of the first document, so the rule covers every path, not only `/feeds/`. `headers()` in `next.config.mjs` sets it. Rejected: the metadata `referrer` field, because Next.js can stream metadata after requests start. Governs R12.
- KTD22. **Feed HTML renders through one safe pipeline.** A private feed URL now sits in IndexedDB, so an XSS bug can read every stored token. The transcript pipeline in `EpisodePage.tsx` runs `rehypeSanitize` before `rehypeRaw`, so raw HTML passes after the sanitize step. Both the description and the transcript pipelines must run `rehypeRaw` and then `rehypeSanitize`. Links from feed HTML get `rel="nofollow ugc"`. Governs R6.

### High-Level Technical Design

The loader decides the data source and the outcome. The private flag also controls the metadata of KTD10.

```mermaid
flowchart TB
  P["/feeds/ page or generateMetadata"] --> C{segment canonical? KTD19}
  C -->|no| R308[308 to canonical path]
  C -->|yes| L["loadFeed (React.cache)"]
  L --> D{decode base64url}
  D -->|fails| NF[notFound]
  D -->|ok| PR{isPrivateFeedUrl}
  PR -->|private| RSS[safeFetchFeed then feedsmith mapper]
  PR -->|public| PI[Podcast Index by feed URL, then by guid, 5 s each]
  PI -->|clear hit| VM[PodcastFeed and PodcastEpisode]
  PI -->|miss, error, or timeout: KTD2| RSS
  RSS -->|feed, episode found| VM
  RSS -->|blocked, not a feed, no episode| NF
  RSS -->|timeout, network, too large, 5xx| ERR["throw: app/feeds/error.tsx, KTD16"]
  VM --> OUT[page and metadata: noindex and no echo when private]
```

The `t` prompt has four states (KTD15).

```mermaid
stateDiagram-v2
  [*] --> Hidden: no t, or t not valid
  [*] --> Shown: valid t
  Shown --> Dismissed: Not Now
  Shown --> Playing: Play from time
  Dismissed --> Shown: navigation to a new link with a valid t
  Playing --> Shown: navigation to a new link with a valid t
```

One redaction module feeds every sink that leaves the browser or the server (KTD7, KTD8, KTD9, KTD21).

```mermaid
flowchart LR
  M[utils/redactFeedPaths.ts] --> SC[Sentry client hooks]
  M --> SS[Sentry server hooks]
  M --> VA[Vercel Analytics beforeSend]
  M --> VS[Speed Insights beforeSend]
  SS -.-> OUT[outgoing request spans and request data: off]
  SC -.-> RP[Session Replay: removed]
  NE[NetworkError: path and status only] --> SS
  RH[Referrer-Policy: no-referrer] -.-> REF[Referer header: not sent]
```

The browser database opens at version 6 with a bounded result (KTD13).

```mermaid
stateDiagram-v2
  [*] --> Opening
  Opening --> Upgrading: older version
  Opening --> Ready: version 6
  Upgrading --> Ready: stores deleted and created
  Opening --> Empty: blocked, VersionError, or time limit
  Upgrading --> Empty: upgrade fails, database stays at version 5
  Ready --> Closed: versionchange from a newer tab
  Closed --> [*]: writes stop
  Empty --> [*]: hydration ends with empty state, event logged
```

### System-Wide Impact

- **Entry points:**
  - The two `/feeds/` pages and `app/feeds/error.tsx`.
  - The two `/podcasts/` route handlers.
  - `/.well-known/apple-app-site-association`.
  - `/api/podcasts/chapters` and `/api/podcasts/transcript`, which now get URLs from RSS feeds and fetch through the guard (KTD20).
  - `/api/settings/opml/import`, whose response keys change.
  - `/api/podcasts/episodes`, which keeps Podcast Index ids only.
- **Contracts:**
  - The share-link format and the `t` forms, shared with R7 of the native share plan.
  - The `PodcastFeed` and `PodcastEpisode` types at the server-to-client boundary.
  - The `SettingsContext` and `MediaContext` APIs, and the stored `MediaPlayerSettings` shape.
  - The `NetworkError` shape. `utils/createApiErrorResponse.ts` sends an error message and stack to the browser, so a proxy route uses fixed codes instead (KTD20).
- **Failure propagation:**
  - A Podcast Index miss, error, or timeout goes to the RSS feed.
  - A transient RSS failure goes to `app/feeds/error.tsx`, and the layout and the player stay.
  - A not-found goes to the root `app/not-found.tsx`.
  - A failed image probe logs an event, and the page renders with no image size.
  - A Podcast Index error on an old route gives 503.
  - A blocked or failed database open ends hydration with empty state. The library shows nothing, and the subscribe button and position writes do nothing until a reload.
- **State lifecycle:**
  - IndexedDB moves from version 5 to version 6. The three stores are deleted and created again, and `mediaPlayerSettings` goes with them.
  - Old tabs block the upgrade until the visitor closes them.
  - The `pod2.settings` localStorage key goes away.
  - TanStack Query has no persister, so old query keys end with the session. The chapters and transcript keys change per KTD14. The home page refresh key and its match-back change from the record key to the stored Podcast Index id.
- **Caching:** No cache across requests. Each link-preview bot reads the full RSS feed. Dynamic pages stay `no-store`, so a private page never goes into the CDN. Browsers cache a 308 permanently, and Apple caches the association file.
- **Cost exposure:** Any random `/feeds/` path costs up to two Podcast Index calls on the one API key of the site, plus an RSS read of up to 10 MiB. See Documentation / Operational Notes for the rate limit.

### Assumptions

These are planning guesses that the user did not confirm. Review them in the pull request.

- An episode with an unknown duration shows the prompt for any valid `t` under 24 hours (KTD15).
- "Not Now" writes nothing. After either choice, the page removes `t` from the URL (KTD15).
- No loading view shows while a `/feeds/` page loads. A slow feed can hold a page for about 30 seconds: two 5-second Podcast Index calls and the 20-second RSS deadline. A `loading.tsx` file is left out on purpose, because it starts the stream before `notFound()` can send a 404 (KTD16).
- "Play from <time>" seeks and plays when the episode is already in the player.
- A transient failure shows a short error message with a "Try again" button inside the normal layout (KTD16). The message is new end-user copy.
- A feed URL with credentials, such as `user:pass@host`, gets no Podcast Index call, and its page shows not-found, because the fetch rejects it (KTD3).
- The library key is the feed URL after the parse of KTD13, item 4. The same show can appear twice in the library when it arrives through two URL forms, for example the stored URL of the app and the `feed.url` of Podcast Index.
- RSS-only shows and private shows get no new-episode dot in the library (KTD13).
- OPML import keys each entry by the `xmlurl` of the OPML file, and keeps the Podcast Index feed id as a value. It reports a private feed URL as not imported, with no Podcast Index call.
- The site serves only the `pod.monster` host. No file for `www.pod.monster` is needed.
- The Podcast Index miss shapes in KTD2 come from the API spec and other clients. The implementer checks them with live calls when API keys are available.
- Session Replay goes away for the whole site (KTD8).
- A public show that falls back to the RSS feed stays indexable, per the "Layered protections" Key Decision. The follow-up list holds the open question.
- An unknown old `/podcasts/` id gets a plain 404, not the not-found page of the site (KTD11).

### Risks & Dependencies

| Risk                                                                                                           | Mitigation                                                                                                                                             |
| -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A bug in the SSRF port lets a request reach a private address.                                                 | Port the native tests with the code, and add a table test for each new range (U3).                                                                     |
| The private-feed rule misses a vendor that hides a token in an unusual form.                                   | Both repos fix the rule together (KTD6), and R12 still keeps the path out of logs and analytics. Real vendor URLs join the fixtures as follow-up work. |
| The rule drifts between this repo and the native repo.                                                         | The site ports the native file and its test cases with no change, and a later change goes into both repos (Deferred to Follow-Up Work).                |
| The Vercel scripts send the raw path in a field that `beforeSend` does not cover.                              | The preview check of U11. If it finds a segment, `beforeSend` drops every `/feeds/` event (KTD7).                                                      |
| A visitor uses up the Podcast Index quota, or makes the server read large bodies, with random `/feeds/` paths. | A Vercel Firewall rate limit (Documentation / Operational Notes), the 10 MiB cap, and the 20-second deadline.                                          |
| An XSS bug reads private feed URLs from IndexedDB.                                                             | One safe HTML pipeline (KTD22), with tests for script, event handler, and `javascript:` input.                                                         |
| An old tab blocks the database upgrade.                                                                        | Bounded hydration with empty state (KTD13, item 7).                                                                                                    |
| Apple caches the `apple-app-site-association` file. Devices take up to a week to see a change.                 | Deploy the file before the TestFlight build that adds Share.                                                                                           |
| `feedsmith` types mark spec-required fields as possibly absent.                                                | The mapper checks each field at runtime, with no `as` and no `!`.                                                                                      |
| The clean break deletes the library of every web visitor.                                                      | This is R18. AE10 is the test. A visitor can export OPML before the deploy, and the user chose to give no notice.                                      |

### Documentation / Operational Notes

- Set `APPLE_TEAM_ID` in the Vercel project (Production and Preview) before release. The value is the 10-character Team ID that the native release scripts use. A change of the value needs a new deploy (KTD12).
- Set `NEXT_OTEL_FETCH_DISABLED=1` in the Vercel project. The scrub of KTD7 covers Next.js fetch spans too, but this removes them at the source.
- Add a Vercel Firewall rate limit for `/feeds/*` and `/api/podcasts/*`.
- Set `maxDuration` on the two `/feeds/` pages above the 20-second RSS deadline plus two 5-second Podcast Index calls. 60 seconds is enough.
- After the deploy, check `https://pod.monster/.well-known/apple-app-site-association` for status 200, `application/json`, and no `Location` header.
- After the deploy, check the "Outgoing Requests" field of the Vercel runtime logs for a `/feeds/` request, and record what it shows in the pull request.
- No user documentation changes. The site has no help page for share links.

---

## Implementation Units

| U-ID | Title                                             | Key files                                                                                                                | Depends on            |
| ---- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | --------------------- |
| U1   | Pure helpers for paths, time, and privacy         | `utils/base64Url.ts`, `utils/parseTimecode.ts`, `utils/isPrivateFeedUrl.ts`, `utils/redactFeedPaths.ts`, `utils/date.ts` | none                  |
| U2   | Podcast Index episode by guid, and safe errors    | `packages/podcast-index/episodeByGuid.ts`, `packages/podcast-index/utils/request.ts`, `vitest.config.mts`                | none                  |
| U3   | Safe feed fetch and RSS parse                     | `utils/server/safeFetchFeed.ts`, `utils/server/parseRssFeed.ts`, `package.json`                                          | U2                    |
| U14  | Guard the proxies and the image probe             | `app/api/podcasts/chapters/route.ts`, `app/api/podcasts/transcript/route.tsx`, `utils/server/probeImage.ts`              | U1, U3                |
| U4   | Source-neutral types and the feed loader          | `types/PodcastFeed.ts`, `utils/server/loadFeed.ts`                                                                       | U1, U2, U3            |
| U5   | Browser storage clean break and new keys          | `contexts/SettingsContext/SettingsContext.tsx`, `contexts/MediaContext.tsx`                                              | U1                    |
| U6   | Paths and presentational components               | `utils/paths.ts`, `components/molecules/**`, `components/atoms/SubscribeButton`                                          | U4, U5                |
| U13  | Player and episode flow                           | `components/organisms/**`, `contexts/MediaContext.tsx`, `rest/fetchPodcastEpisodeChapters.ts`, `EpisodePage.tsx`         | U5, U6                |
| U12  | Library flow                                      | `app/HomePage.tsx`, `app/api/settings/opml/import/route.ts`, `hooks/useOpmlFileUrl.ts`                                   | U5, U6                |
| U7   | The `/feeds/` pages, errors, and private metadata | `app/feeds/**`, `utils/createMetadata.ts`, `next.config.mjs`                                                             | U4, U6, U12, U13, U14 |
| U8   | Redirects from the old paths                      | `app/podcasts/[feedId]/route.ts`, `app/podcasts/[feedId]/episodes/[episodeId]/route.ts`                                  | U1, U2, U7            |
| U9   | The `apple-app-site-association` file             | `app/.well-known/apple-app-site-association/route.ts`, `eslint.config.mjs`                                               | U2                    |
| U10  | The `t` prompt                                    | `components/molecules/StartTimePrompt/StartTimePrompt.tsx`, `hooks/usePlayEpisodeAt.ts`                                  | U1, U7, U13           |
| U11  | Path redaction in Sentry and Vercel               | `instrumentation-client.ts`, `instrumentation.ts`, `app/VercelInsights.tsx`                                              | U1                    |

Units run in the order of this table. U5, U6, U13, U12, and U7 form one type-check checkpoint: the tree type-checks again after U7 deletes the old pages. The Vitest gate of each unit still applies.

### Phase A: server foundations

### U1. Pure helpers for paths, time, and privacy

**Goal:** Add the pure functions that the server and the browser share.

**Requirements:** R1, R7, R9, R12, R13, R15. KTD5, KTD6, KTD7, KTD15, KTD19.

**Dependencies:** None.

**Files:**

- Create `utils/base64Url.ts` and `utils/base64Url.test.ts`.
- Create `utils/parseTimecode.ts` and `utils/parseTimecode.test.ts`.
- Create `utils/isPrivateFeedUrl.ts` and `utils/isPrivateFeedUrl.test.ts`.
- Create `utils/redactFeedPaths.ts` and `utils/redactFeedPaths.test.ts`.
- Modify `utils/date.ts` and create `utils/date.test.ts`.

**Approach:**

1. `base64Url` encodes UTF-8 with `TextEncoder` and `btoa`, then swaps `+` and `/` and strips `=`, like the native `src/utils/base64.ts`. Its decoder accepts standard base64 and padding, uses a fatal `TextDecoder`, and returns `null` on any failure. Add a `// TODO` to move to `Uint8Array.fromBase64` when Node and Safari support it.
2. A segment decode helper rejects a raw segment over 4096 characters before the decode. A feed decode helper also rejects an empty value, a decoded value over 2048 characters, and a value that `URL.canParse` rejects or that is not `http:` or `https:`.
3. A canonical check returns true only when `encode(decode(segment))` equals the segment (KTD19).
4. `parseTimecode` follows KTD15, item 1, and returns seconds or `null`.
5. `isPrivateFeedUrl` ports the native `mayContainPrivateFeedToken` and its test cases (KTD6).
6. `redactFeedPaths` follows KTD7. Also export a walk that applies it to every string in a nested object, for the Sentry hooks.
7. `utils/date.ts` gets a short clock format: `M:SS` under one hour, `H:MM:SS` at one hour or more, for the prompt label.

**Patterns to follow:** `utils/toTitleCase.test.ts` for a pure test in the browser project. The native `src/utils/base64.ts` and `src/utils/parseTimecodeHref.ts` for behavior.

**Test scenarios:**

- A feed URL with ASCII only encodes and decodes to the same string.
- A guid with non-ASCII characters and a space encodes and decodes to the same string.
- `https://cdn.atp.fm/rss/public?<token>`, whose standard base64 holds a `/`, encodes with no `/`, `+`, or `=`.
- The decoder accepts the standard base64 form and the padded form of the same value, and the canonical check is false for both.
- The decoder returns `null` for `%%%`, for an empty string, and for bytes that are not valid UTF-8.
- The segment helper returns `null` for 5000 characters with no decode.
- The feed decode helper returns `null` for `ftp://example.com/feed`.
- `parseTimecode` returns 90 for `90`, 90.5 for `90.5`, 754 for `12:34`, 3723 for `1:02:03`, 90 for `1m30s`, 3723 for `1h2m3s`, and 90 for `npt:90`.
- `parseTimecode` returns `null` for `-5`, `abc`, `1e3`, `0x10`, an empty string, and `1::2`.
- The native test cases of `mayContainPrivateFeedToken` pass here with no change. Examples: true for `https://cdn.atp.fm/rss/public?abc123`, a Patreon URL with `?auth=`, and a Substack `/private/<uuid>.rss` URL. False for `https://feeds.megaphone.fm/ADL9840290619`, `https://feeds.simplecast.com/54nAGcIl`, and a Squarespace URL with `?format=rss`.
- `redactFeedPaths` changes `/feeds/abc/episodes/def?t=10` to the route names, in a bare path and inside a full URL.
- `redactFeedPaths` removes the whole segment for `/feeds/ab+c=`, `/feeds/ab%2Bc%3D`, and a segment that ends at a quote.
- `redactFeedPaths` replaces the value of `?url=https%3A%2F%2Fexample.com%2Ffeed` and of `feedurl=`.
- The Sentry walk cuts `https://cdn.example.com/ep.mp3?token=abc` to `https://cdn.example.com`, and keeps a URL on the site origin after the path redaction.
- The walk changes strings in nested arrays and objects, and leaves numbers and booleans as they are.
- The short clock format gives `0:05`, `12:34`, and `1:02:03`.

**Verification:** The new tests pass in the browser project, and the native fixture shapes from `parseTimecodeHref.ts` give the same seconds here.

### U2. Podcast Index episode by guid, and safe errors

**Goal:** Add the episode-by-guid call, keep feed URLs out of errors, bound each call, and add the Node test project.

**Requirements:** R5, R12. KTD2, KTD9, KTD18.

**Dependencies:** None.

**Files:**

- Create `packages/podcast-index/episodeByGuid.ts`.
- Modify `packages/podcast-index/constants.ts` (add `PATH_EPISODES_BY_GUID`) and `packages/podcast-index/index.ts`.
- Modify `packages/podcast-index/utils/request.ts` and the `NetworkError` class it uses.
- Create `packages/podcast-index/episodeByGuid.node.test.ts` and `packages/podcast-index/utils/request.node.test.ts`.
- Modify `vitest.config.mts`.
- Modify `packages/podcast-index/tsconfig.ref.json`: add `"types": ["node", "vitest/globals"]`, because `tsc -b` builds the package tests with that config, and the package does not inherit the Vitest globals of the root config.

**Approach:**

1. `episodeByGuid` mirrors `episodeById.ts`. It sets `guid`, `feedurl`, and `fulltext`, and returns the `ApiResponse.EpisodeById` shape.
2. `request()` sends each call with a 5-second abort signal (KTD2).
3. `NetworkError` keeps only the endpoint path and the status (KTD9).
4. `vitest.config.mts` gets the two `projects` of KTD18. Confirm the Vitest 4 `projects` syntax.

**Patterns to follow:** `packages/podcast-index/episodeById.ts` and `packages/podcast-index/podcastsByFeedUrl.ts`.

**Test scenarios:**

- `episodeByGuid` calls `episodes/byguid` with `guid`, `feedurl`, and `fulltext` set, and encodes a guid that holds `&` and a space.
- A 500 response throws a `NetworkError` whose message holds `episodes/byguid` and `500`.
- `util.inspect` of that error holds no part of the feed URL, no body text, and no `response` property.
- A call that does not answer in 5 seconds rejects with a timeout, with fake timers.
- The Node project runs a `.node.test.ts` file. The browser project still runs the current tests, and skips the `.node.test.ts` files.

**Verification:** `npx vitest run` runs both projects, and the screenshot tests still pass.

### U3. Safe feed fetch and RSS parse

**Goal:** Read a feed that a visitor names, safely, and map it to plain data.

**Requirements:** R6, R13. KTD3, KTD4, KTD5.

**Dependencies:** U2 (the Node test project).

**Files:**

- Modify `package.json` (add `feedsmith` at exactly `3.0.0`, and `undici` at the version that the native server uses).
- Create `utils/server/safeFetchFeed.ts` and `utils/server/safeFetchFeed.node.test.ts`.
- Create `utils/server/raceAgainstDeadline.ts` and `utils/server/raceAgainstDeadline.node.test.ts`.
- Create `utils/server/parseRssFeed.ts` and `utils/server/parseRssFeed.node.test.ts`.

**Approach:**

1. Port the guard of KTD3 from the native `packages/server/src/lib/safeFetch.ts`, `packages/server/src/lib/raceAgainstDeadline.ts`, `packages/server/src/worker/fetchFeed.ts`, and `packages/server/src/lib/feedUrlValidation.ts`. Keep the native fetch-shaped seam and the DNS seam for tests. Take the KTD3 changes to the ranges, the caps, and the logs.
2. The fetch returns a typed result: a body, or a failure reason (`blocked`, `too_large`, `timeout`, `network`, `http_status`). It never puts the URL in an error message or a log.
3. Export a variant with a smaller cap, and port the native ranged mode, for U14.
4. `parseRssFeed` runs `feedsmith` on the body, then maps the show and its episodes to the KTD1 types. It applies KTD5 for identity, keeps every item in feed order, and returns "not a feed" when no channel results.
5. Every file imports `server-only`.

**Execution note:** Port the native `safeFetch.test.ts` cases first, then change the code until they pass.

**Patterns to follow:** The native files above and their tests. `packages/podcast-index` for the one-function-per-file style.

**Test scenarios:**

- An injected resolver that returns 10.0.0.1, 127.0.0.1, 169.254.169.254, 192.88.99.1, ::1, ::ffff:127.0.0.1, 64:ff9b::7f00:1, 2001::1, 2002:7f00:1::, fec0::1, 240.0.0.1, 198.18.0.1, or fc00::1 gives `blocked`, and no connection opens.
- A public address that redirects to 127.0.0.1 gives `blocked`.
- A chain of six redirects gives `blocked`.
- `https://user:pass@example.com/feed` and `file:///etc/passwd` give `blocked`.
- A `content-length` of 11 MiB gives `too_large` with no body read. A body over 10 MiB with no `content-length` gives `too_large`, and the stream stops at the cap.
- A resolver that does not answer gives `timeout` within the deadline.
- A server that does not answer gives `timeout` within the deadline.
- A 503 answer gives `http_status` with 503.
- An RSS 2.0 feed with `itunes` and `podcast` tags maps to a show with title, author, image, description, link, and funding, and episodes with guid, enclosure, duration, chapters URL, and transcript URLs.
- An item with no guid gets its enclosure URL as the identity. A guid with spaces at its ends gets the trimmed identity.
- Two items with the same guid give the first item for that identity.
- A feed with 150 items maps to 150 episodes in feed order.
- A body with `<!DOCTYPE`, a body with `<!doctype`, and an HTML page all give "not a feed".

**Verification:** The Node tests pass, and no code path puts a feed URL in an error message or a log call.

### U14. Guard the proxies and the image probe

**Goal:** Every server fetch of a URL from a feed goes through the guard.

**Requirements:** R6, R12. KTD9, KTD20.

**Dependencies:** U1, U3.

**Files:**

- Modify `app/api/podcasts/chapters/route.ts` and `app/api/podcasts/transcript/route.tsx`.
- Create `app/api/podcasts/chapters/route.node.test.ts` and `app/api/podcasts/transcript/route.node.test.ts`.
- Create `utils/server/probeImage.ts` and `utils/server/probeImage.node.test.ts`.

**Approach:**

1. Both proxy routes fetch with the small-cap variant of U3.
2. A failure answers with a fixed error code, no message, and no stack. The routes stop using `createApiErrorResponse`.
3. A target URL that is private by KTD6 gets `Cache-Control: private, no-store`. Others keep their cache headers of today.
4. `probeImage` reads at most 1 MiB through the guard and gives the bytes to `probe-image-size`. It returns no size on any failure.
5. Each `catch` logs an event per KTD9.

**Patterns to follow:** `app/api/podcasts/episodes/route.ts` for the route shape.

**Test scenarios:**

- A chapters request for `http://127.0.0.1/chapters.json` answers with the fixed `blocked` code and no stack.
- A transcript request with `type=text/html` for a loopback URL answers with the fixed code and no body from the target.
- A chapters request for a private target URL answers with `Cache-Control: private, no-store`.
- `probeImage` for `http://169.254.169.254/latest` returns no size and opens no connection.
- `probeImage` for a public PNG returns its width and height.
- `probeImage` for a PNG of 3 MiB with a `content-length` header returns its width and height.

**Verification:** The route tests pass, and no route in `app/api/podcasts/` fetches with plain `fetch`.

### U4. Source-neutral types and the feed loader

**Goal:** One loader gives each page its show and episode from Podcast Index or the RSS feed.

**Requirements:** R4, R5, R6, R13. KTD1, KTD2, KTD9, KTD16, KTD17. Covers AE1, AE2, AE8.

**Dependencies:** U1, U2, U3.

**Files:**

- Create `types/PodcastFeed.ts`.
- Create `utils/server/loadFeed.ts` and `utils/server/loadFeed.node.test.ts`.
- Create `utils/server/mapPodcastIndexFeed.ts` and `utils/server/mapPodcastIndexFeed.node.test.ts`.
- Create `utils/server/FeedUnavailableError.ts`.

**Approach:**

1. `PodcastFeed` and `PodcastEpisode` hold what the pages render today, with the feed URL and the episode identity as the ids. The Podcast Index feed id is an optional value.
2. The loader decodes the path segments with U1, rejects a feed URL with a user name or a password as not-found, checks the private rule, then follows the loader flowchart of the High-Level Technical Design.
3. On a public show page, the loader gets the episodes with `episodesByFeedId` from the Podcast Index feed id that `podcastsByFeedUrl` returns. For an RSS show page, the show loader sorts the parsed episodes newest first and keeps 100 (KTD1). The episode loader searches the full parsed list.
4. `FeedUnavailableError` is the fixed error class of KTD9, with a reason code only.
5. Each failure logs per KTD9, then maps to a result per KTD16.
6. Both loaders are wrapped in `React.cache` (KTD17).

**Patterns to follow:** The data calls in `app/podcasts/[feedId]/page.tsx`, and `getAuthValues` with `getPodcastIndexConfig`.

**Test scenarios:**

- Covers AE1. A Podcast Index answer with an empty `feed` makes the loader read the RSS feed, and the result has the RSS source.
- Covers AE2. Podcast Index knows the show, `episodes/byguid` has no `episode`, and the loader takes the episode from the RSS feed.
- Covers AE8. For `https://www.patreon.com/rss/x?auth=abc`, the stubbed `fetch` gets no call to `api.podcastindex.org`, and the result is private.
- A 503 from Podcast Index makes the loader read the RSS feed and log `podcast_index_unavailable` with no feed URL in the fields.
- A Podcast Index timeout makes the loader read the RSS feed.
- A 401 from Podcast Index makes the loader log `podcast_index_auth_failed` and still read the RSS feed.
- A path segment that does not decode gives not-found, with no network call.
- An RSS `timeout` throws `FeedUnavailableError` with the reason `timeout`. An RSS `blocked` result and a "not a feed" result give not-found.
- A guid that is in neither source gives not-found.
- The same episode from Podcast Index and from the RSS feed, with a guid that has a space at its end in one source, gives the same identity.
- With `cache` from `react` replaced by a memoizing stub, both loaders go through it. React only memoizes inside a server render, so a direct call in the Node project cannot show the dedupe.
- The 150th item of an RSS-only feed with 150 items loads on its episode page.

**Verification:** The loader tests pass, and the Podcast Index mapper gives the same fields that the current pages render.

### Phase B: storage and pages

### U5. Browser storage clean break and new keys

**Goal:** Move the library, the positions, and the player state to feed URL and episode keys.

**Requirements:** R16, R17, R18. KTD5, KTD13. Covers AE10.

**Dependencies:** U1.

**Files:**

- Modify `contexts/SettingsContext/SettingsContext.tsx`.
- Delete `contexts/SettingsContext/migrations/migrateFrom0To5.ts`.
- Modify `contexts/MediaContext.tsx` (state, persistence, and the debounced write only; U13 changes its chapters query).
- Create `contexts/SettingsContext/SettingsContext.test.tsx` and `contexts/MediaContext.test.tsx`.

**Approach:**

1. Set `SETTINGS_VERSION` to 6, and make the open and the `upgrade` follow KTD13, items 1, 2, 7, and 9.
2. Change the store types and the context API per KTD13, items 3 to 6. The key functions are private to the context module.
3. Wrap each write per KTD13, item 8.
4. Change `MediaPlayerSettings` and `MediaContext` state from numeric `episodeId` and `feedId` to the feed URL and the episode identity. Replace the falsy checks on ids with explicit `=== null` checks.
5. Add the hydration guard and the debounced identity of KTD13, items 10 and 11.

**Execution note:** The tree does not type-check between U5 and U7 (see the note under the unit table).

**Patterns to follow:** The current `openDB` call and store access in `SettingsContext.tsx`.

**Test scenarios:**

- Covers AE10. A real IndexedDB at version 5 with library and position records opens at version 6 with three empty stores, and a write then works.
- A new browser with no database opens at version 6 with three stores.
- A version 5 database with one store missing opens at version 6 with all three stores.
- A second connection at version 5 that closes on `versionchange` lets the upgrade finish.
- A second connection at version 5 that ignores `versionchange` blocks the upgrade, and hydration ends with empty state within the time limit.
- A write after `versionchange` does nothing, and the mirror does not change.
- The `pod2.settings` localStorage key is gone after the upgrade.
- The same feed URL with an uppercase host and with a fragment gives one feed key. Two URLs that differ only in the query case give two keys.
- A guid that holds `"` and `,` gives an episode key that matches only itself.
- A version 5 `mediaPlayerSettings` record with numeric `episodeId` and `feedId` hydrates to no episode, and no write uses a key with `undefined` or `null`.
- A switch from episode A to episode B inside the debounce window does not save the time of A under B.

**Verification:** The context tests pass in the browser project, and no code reads or keeps the old localStorage key.

### U6. Paths and presentational components

**Goal:** Links use the R1 paths, and the presentational components read the new types and keys.

**Requirements:** R2, R16, R17. KTD1, KTD13. Covers AE9.

**Dependencies:** U4, U5.

**Files:**

- Modify `utils/paths.ts` and create `utils/paths.test.ts`.
- Modify `components/molecules/EpisodeList.tsx`, `components/molecules/Header/Header.tsx`, `components/molecules/FeedArtwork.tsx`, `components/molecules/Funding/Funding.tsx`, `components/molecules/EpisodeProgress/EpisodeProgress.tsx`, `components/molecules/EpisodeUnlistenedDot/EpisodeUnlistenedDot.tsx`, and `components/atoms/SubscribeButton/SubscribeButton.tsx`.
- Create `components/atoms/SubscribeButton/SubscribeButton.test.tsx` and `components/molecules/FeedArtwork.test.tsx`.

**Approach:**

1. `getPodcastPath` and `getEpisodePath` take a feed URL and an episode identity, and encode them in canonical form with U1.
2. Each component takes the U4 types, or a `Pick` of them, not Podcast Index shapes.
3. `SubscribeButton` stores the record through the context API with the feed URL of the page and the Podcast Index feed id when the page has one.
4. `FeedArtwork` follows KTD13, item 12.
5. `EpisodeList` keys its rows by the episode identity.

**Patterns to follow:** `components/atoms/IconButton/IconButton.test.tsx` for the test style.

**Test scenarios:**

- `getEpisodePath` gives `/feeds/<base64url(feed URL)>/episodes/<base64url(guid)>`, with no `=`.
- `getPodcastPath` for `https://cdn.atp.fm/rss/public?<token>` gives one path segment after `/feeds/`.
- Covers AE9. A click on the subscribe button of a show with no Podcast Index feed id stores a record under its feed URL, and the record is there after a new render of the provider.
- A second click removes the record from the library.
- A render of `FeedArtwork` for a show that is not in the library writes no record. This includes a private feed URL.
- A position that the context writes for a feed URL and a guid is read back by `EpisodeProgress` and `EpisodeUnlistenedDot` for the same feed URL and guid.

**Verification:** No presentational component imports a Podcast Index type, and the existing screenshot tests pass with no change.

### U13. Player and episode flow

**Goal:** The player, the episode page component, and their queries use the new types and keys.

**Requirements:** R6, R16. KTD14, KTD15, KTD22.

**Dependencies:** U5, U6.

**Files:**

- Move `app/podcasts/[feedId]/episodes/[episodeId]/EpisodePage.tsx` to `app/feeds/[feedUrlBase64]/episodes/[guidBase64]/EpisodePage.tsx`, and change it.
- Modify `components/organisms/EpisodePlayButton/EpisodePlayButton.tsx` and `components/organisms/MediaPlayer/MediaPlayer.tsx`.
- Modify `contexts/MediaContext.tsx` (the chapters query).
- Modify `rest/fetchPodcastEpisodeChapters.ts` and `rest/fetchPodcastEpisodeTranscript.ts`, which take `PIApiEpisodeDetail` today.
- Create `app/feeds/[feedUrlBase64]/episodes/[guidBase64]/EpisodePage.test.tsx`.

**Approach:**

1. `EpisodePage` and `EpisodePlayButton` take `PodcastEpisode`. The player context stores the feed URL and the identity.
2. `MediaPlayer` marks the episode of the page with the canonical `getEpisodePath`.
3. The chapters and transcript queries follow KTD14 in `EpisodePage` and in `MediaContext`.
4. The description and transcript pipelines follow KTD22.

**Patterns to follow:** The current `EpisodePage` queries and `handleTimedListItemClick`.

**Test scenarios:**

- An episode with a chapters URL and no `dateCrawled` turns on its chapters query.
- Two episodes with the same transcript count and duration, but different transcript URLs, each get their own transcript.
- A description with `<script>`, an `onclick` handler, and a `javascript:` link renders none of them, and a transcript with the same input renders none of them.
- A link in a feed description renders with `rel="nofollow ugc"`.
- The `getEpisodePath` of an episode, after the route decode, gives the same identity, and `MediaPlayer` marks that episode as the episode of the page.

**Verification:** The tests pass, and no file in this unit imports a Podcast Index type.

### U12. Library flow

**Goal:** The home page, the settings page, and OPML import and export work with the new keys.

**Requirements:** R13, R16, R17. KTD13.

**Dependencies:** U5, U6.

**Files:**

- Modify `app/HomePage.tsx`, `components/molecules/SubscriptionItem/SubscriptionItem.tsx`, `rest/fetchPodcastEpisodes.ts`, and `app/settings/SettingsPage.tsx`.
- Modify `app/api/settings/opml/import/route.ts` and create `app/api/settings/opml/import/route.node.test.ts`.
- Modify `hooks/useOpmlFileUrl.ts`.

**Approach:**

1. Search results link with the Podcast Index `feed.url`.
2. The home page sends only stored Podcast Index feed ids to `/api/podcasts/episodes` per KTD13, item 6, and matches the answer back by that id.
3. `SubscriptionItem` takes a feed URL and checks unlistened episodes by identity.
4. OPML import keys entries by the OPML `xmlurl` (see Assumptions). It skips a private URL with no Podcast Index call, and reports it as not imported.
5. The OPML export reads the feed URL from the record key.

**Patterns to follow:** The current `HomePage` library list and the import route.

**Test scenarios:**

- OPML import with a Patreon-shaped `xmlurl` makes no Podcast Index call, and reports that feed as not imported.
- OPML import of a feed that Podcast Index knows gives a record under the OPML `xmlurl`, with the Podcast Index feed id as a value.
- The home page refresh sends no feed URL, and a library record with no Podcast Index feed id is left out of the request.

**Verification:** The tests pass. On a Vercel preview with the Podcast Index keys, a subscribe, export, and import round trip keeps the library. Without such a preview, the pull request records the round trip as not done.

### U7. The `/feeds/` pages, errors, and private metadata

**Goal:** Serve the show and episode pages at the R1 paths.

**Requirements:** R1, R2, R4, R12, R14. KTD1, KTD10, KTD16, KTD17, KTD19, KTD20, KTD21. Covers AE8.

**Dependencies:** U4, U6, U12, U13, U14.

**Files:**

- Create `app/feeds/[feedUrlBase64]/page.tsx` and `app/feeds/[feedUrlBase64]/episodes/[guidBase64]/page.tsx`.
- Create `app/feeds/error.tsx` and `app/feeds/error.test.tsx`.
- Delete `app/podcasts/[feedId]/page.tsx` and `app/podcasts/[feedId]/episodes/[episodeId]/page.tsx` (U8 adds route handlers in their place).
- Modify `utils/createMetadata.ts` and create `utils/createMetadata.node.test.ts`.
- Modify `next.config.mjs` (the `headers()` rule of KTD21).
- Modify `eslint.config.mjs` (`ignoreExports` for `app/feeds/error.tsx`).

**Approach:**

1. Each page checks KTD19 first, then calls `await connection()` and the U4 loader with the decoded segments. `generateMetadata` uses the same loader.
2. The page calls `notFound()` before any stream starts. Do not add `loading.tsx` or a `Suspense` boundary above these pages.
3. Each page sets `maxDuration` per Documentation / Operational Notes.
4. `createMetadata` gets the private option of KTD10.
5. The episode page reads `searchParams.t` with a `typeof` guard and passes it to U10.
6. The episode page gets its image size from `probeImage` of U14. Its `captureException` `extra` keeps no feed id, feed URL, guid, or image URL (KTD9).
7. `app/feeds/error.tsx` is a client component with a short message and a "Try again" button. The button calls `router.refresh()` and `reset()` inside `startTransition`, so the server loader runs again, and the button is disabled while the transition is pending. Its copy follows the end-user copy rules of the user.

**Patterns to follow:** The current two pages, and `app/not-found.tsx`.

**Test scenarios:**

- Covers AE8. `createMetadata` with the private option gives `robots` with no index and no follow, and no `openGraph.url`, `images`, `audio`, or `videos`.
- `createMetadata` with no private option gives the same result as today.
- `app/feeds/error.tsx` renders its message and a "Try again" button. A click calls `router.refresh()` and `reset()`.
- While the retry transition is pending, the button is disabled, and a second click does not call the handler again.
- Integration, manual on `npm run build && npm start`:
  - A public show page and a Patreon-shaped show page both render, and only the second has `<meta name="robots" content="noindex, nofollow">`.
  - `curl -I` on a `/feeds/` page shows `Referrer-Policy: no-referrer` and a `Cache-Control` with `no-store` and no `s-maxage`.
  - A segment in padded standard base64 redirects with status 308 to the canonical segment.

**Verification:** `npm run build` succeeds, and locally the page renders for an RSS-only show. On a Vercel preview with the Podcast Index keys, the page renders a known Podcast Index show from Podcast Index data. Without such a preview, the pull request records that check as not done.

### U8. Redirects from the old paths

**Goal:** Old `/podcasts/` links reach the new pages with status 308.

**Requirements:** R3. KTD11. Covers AE6.

**Dependencies:** U1, U2, U7.

**Files:**

- Create `app/podcasts/[feedId]/route.ts` and `app/podcasts/[feedId]/episodes/[episodeId]/route.ts`.
- Create `app/podcasts/[feedId]/route.node.test.ts` and `app/podcasts/[feedId]/episodes/[episodeId]/route.node.test.ts`.
- Modify `eslint.config.mjs` (`import/no-unused-modules` ignore list for `route.ts` files outside `app/api`).

**Approach:**

1. The show handler checks that the id is numeric, calls `podcastsByFeedId`, and redirects to `getPodcastPath` of `feed.url`.
2. The episode handler calls `episodeById`, then `podcastsByFeedId` for the feed URL, and redirects to `getEpisodePath` with the guid.
3. Both handlers copy the query string, send status 308, send a 404 for an unknown or invalid id, and send a 503 for a Podcast Index error or timeout.

**Patterns to follow:** The route sketch in the framework-docs research, and `app/api/podcasts/episodes/route.ts` for the handler style.

**Test scenarios:**

- Covers AE6. A known episode id gives status 308 and a `Location` of the R1 path of the same episode.
- A show link with `?t=90` keeps `?t=90` in `Location`.
- `/podcasts/abc` gives 404 with no Podcast Index call.
- An id that Podcast Index does not know gives 404.
- A Podcast Index 500 gives 503.

**Verification:** The route tests pass. On a Vercel preview with the Podcast Index keys, `curl -i` on an old episode link shows the 308 and the `Location` header. Locally, with no keys, the same request gives the 503 of KTD11. Without such a preview, the pull request records the `curl` check as not done.

### U9. The `apple-app-site-association` file

**Goal:** iOS can open the `/feeds/` paths in the app.

**Requirements:** R11. KTD12.

**Dependencies:** U2 (the Node test project).

**Files:**

- Create `app/.well-known/apple-app-site-association/route.ts` and `app/.well-known/apple-app-site-association/route.node.test.ts`.
- Modify `eslint.config.mjs` if U8 did not already cover this path.
- Modify `tsconfig.json`: add `"app/.well-known/**/*.ts"` to `include`. A `**/*.ts` pattern skips a folder whose name starts with a dot, so neither `tsc` nor the typed ESLint rules see the route without it.
- Modify `next.config.mjs` only for the fallback of Approach item 3.

**Approach:**

1. The handler is static and returns the JSON of KTD12 with `Response.json`.
2. With no `APPLE_TEAM_ID`, it returns 404 and logs a warning.
3. If `npm run build` does not route the dot folder, move the handler to a plain folder and add a `rewrites()` entry in `next.config.mjs`. A rewrite is not a redirect, so the Apple rule holds.

**Patterns to follow:** The Apple format in the framework-docs research, section 5.

**Test scenarios:**

- With `APPLE_TEAM_ID=ABCDE12345`, the handler returns status 200, `application/json`, and `appIDs` of `ABCDE12345.app.podmonster` with the one component `/feeds/?*`.
- With no `APPLE_TEAM_ID`, the handler returns 404.

**Verification:** `curl -i http://localhost:3000/.well-known/apple-app-site-association` after `npm run build && npm start` shows status 200, `application/json`, and no `Location` header.

### Phase C: the prompt and the observability

### U10. The `t` prompt

**Goal:** An episode link with a valid `t` asks to play from that time.

**Requirements:** R7, R8, R9. KTD15. Covers AE3, AE4, AE5.

**Dependencies:** U1, U7, U13.

**Files:**

- Create `components/molecules/StartTimePrompt/StartTimePrompt.tsx`, `components/molecules/StartTimePrompt/index.ts`, and `components/molecules/StartTimePrompt/StartTimePrompt.test.tsx`.
- Create `hooks/usePlayEpisodeAt.ts` and `hooks/usePlayEpisodeAt.test.tsx`.
- Modify `components/organisms/EpisodePlayButton/EpisodePlayButton.tsx`.
- Modify `app/feeds/[feedUrlBase64]/episodes/[guidBase64]/EpisodePage.tsx`.

**Approach:**

1. `usePlayEpisodeAt` holds the start logic that `EpisodePlayButton` has now: set the source, the episode, and the time, then play. With an explicit time and an episode that is already loaded, it seeks and plays. With no explicit time, it reads the saved position at call time (KTD15, items 3 and 6). The play button calls the same hook.
2. `StartTimePrompt` is an inline section above the play button, with the copy of the app: the line "Start Listening at <time>?" and the buttons "Play from <time>" and "Not Now". The time is the floor of `t` in the short clock format of U1. It takes `className` and has no focus trap.
3. The section has `role="region"` and an accessible name, and screen readers hear its line politely when a client navigation inserts it. At phone width the two buttons stack, with "Play from <time>" first, in a `Stack`.
4. `EpisodePage` parses `t`, checks validity against the duration, and shows the prompt per the prompt state diagram of the High-Level Technical Design.
5. "Not Now" hides the prompt and writes nothing. The play button keeps the saved position (KTD15, item 6).
6. After either choice, the page removes `t` from the URL (KTD15, item 5). The prompt also hides when the play button starts this episode.

**Patterns to follow:** `components/atoms/Button`, `components/layouts/Stack`, `handleTimedListItemClick` in `EpisodePage`, and the test style of `components/atoms/IconButton/IconButton.test.tsx`.

**Test scenarios:**

- The prompt renders "Start Listening at 12:34?", "Play from 12:34", and "Not Now" for 754 seconds (screenshot `startTimePrompt-default.png`).
- A custom `className` reaches the root element.
- Covers AE3. A click on "Play from 12:34" calls the start function with 754 seconds.
- Covers AE4. A click on "Not Now" hides the prompt and does not call the start function.
- Covers AE4. With IndexedDB hydration that ends after mount and a saved position of 40:12, a click on "Not Now" and then on the play button resumes from 40:12. This holds for an episode in the player and for an episode that is not in the player.
- After "Play from 12:34" or "Not Now", the URL has no `t`, and a reload shows no prompt.
- A `t` of `90.9` shows "Play from 1:30".
- The prompt is a region with an accessible name.
- A click on the play button with the prompt shown starts the saved position and hides the prompt.
- Covers AE5. A `t` of 2700 for an episode of 1800 seconds shows no prompt.
- A `t` of 0, a `t` of `abc`, and a `t` over 24 hours for an unknown duration show no prompt.
- A `t` of 90 for an episode with no known duration shows the prompt.
- With the episode already loaded and paused at 300 seconds, "Play from 1:30" seeks to 90 and plays.
- A second "Play from 1:30", after playback moves on to 120 seconds, seeks to 90 again.
- A change of the raw `t` from `10` to `20` after "Not Now" shows the prompt again with the new time.

**Verification:** The prompt tests pass, the screenshot is reviewed, and the play button still works with no `t`.

### U11. Path redaction in Sentry and Vercel

**Goal:** No feed or episode segment leaves the site through Sentry, Vercel Analytics, or Speed Insights.

**Requirements:** R12. KTD7, KTD8, KTD9. Covers AE7.

**Dependencies:** U1.

**Files:**

- Modify `instrumentation-client.ts` and `instrumentation.ts`.
- Create `utils/sentryRedaction.ts` and `utils/sentryRedaction.test.ts`.
- Create `utils/sentryRedaction.node.test.ts`.
- Create `app/VercelInsights.tsx` and `app/VercelInsights.test.tsx`.
- Modify `app/layout.tsx`.

**Approach:**

1. `utils/sentryRedaction.ts` builds the four hooks of KTD7 from the U1 walk, and the server integration options. Both init files import it.
2. Remove `replayIntegration` and the two replay sample rates from `instrumentation-client.ts` (KTD8). Do not change how `Sentry.init` is called (see Deferred to Follow-Up Work).
3. `app/VercelInsights.tsx` is a client component. It renders `Analytics` and `SpeedInsights` from the `/next` entries with module-level `beforeSend` functions. `app/layout.tsx` renders it in their place.

**Patterns to follow:** `app/Providers.tsx` for a client component in `app/`.

**Test scenarios:**

- Covers AE7. An error event with `/feeds/<segment>` in `request.url`, `transaction`, an exception message, a breadcrumb `data.url`, and a span `data["url.full"]` comes out of `beforeSend` and `beforeSendSpan` with only the route names.
- A breadcrumb for `/api/podcasts/chapters?url=<encoded URL>` comes out with the value replaced.
- A transaction with no feed path comes out unchanged.
- Integration, in the Node project: an error captured by a real Sentry server client with a test transport sends an envelope with no feed segment in the event, the envelope headers, or the trace context.
- The Analytics `beforeSend` turns `https://pod.monster/feeds/abc/episodes/def?t=10` into a URL with the route names and no query.
- The Speed Insights `beforeSend` does the same, and keeps a URL with no feed path as it is.
- The server integration options ignore an outgoing request to `https://api.podcastindex.org/api/1.0/podcasts/byfeedurl?url=x`.

**Verification:** The tests pass. On a preview, the Network tab shows no feed segment in the payloads of `/_vercel/insights/view` and `/_vercel/speed-insights/vitals`, or KTD7 switches `beforeSend` to drop `/feeds/` events.

---

## Verification Contract

| Gate                              | Command or check                                                                                                                                                                                                                                    | Applies to                                        |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Install                           | `npm install`, because this worktree has no `node_modules`. Then `npx playwright install chromium` before the first browser run.                                                                                                                    | Before U1                                         |
| Format and lint                   | `npm run format && npm run lint:fix && npm run lint`                                                                                                                                                                                                | Every unit                                        |
| Types                             | `npm run typecheck`. CI does not run it, so run it locally. The tree can fail it between U5 and U7.                                                                                                                                                 | Every unit outside U5 to U7, and at the end of U7 |
| Tests                             | `npx vitest run`, both projects                                                                                                                                                                                                                     | Every unit                                        |
| Screenshots                       | `npx vitest run -u` after the U10 screenshot, then look at each changed image                                                                                                                                                                       | U10                                               |
| Build                             | `npm run build`                                                                                                                                                                                                                                     | U7, U8, U9                                        |
| Redirect, headers, and Apple file | `npm start`, then `curl -i` for an old episode link, `curl -I` for a `/feeds/` page, and `curl -i` for `/.well-known/apple-app-site-association` with `APPLE_TEAM_ID` set                                                                           | U7, U8, U9                                        |
| Live Podcast Index                | One call for each case: unknown feed URL, known feed with unknown guid, known guid, and a guid with `&`. Needs the Podcast Index keys, which this worktree does not have. If the keys are absent, record the check as not done in the pull request. | U2, U4                                            |
| Vercel payloads                   | On a preview, the Network-tab check of U11                                                                                                                                                                                                          | U11, before release                               |
| Preview with Podcast Index keys   | On a Vercel preview with the keys: the Podcast Index render of U7, the 308 `curl` check of U8, and the OPML round trip of U12. Without such a preview, record each as not done in the pull request.                                                 | U7, U8, U12                                       |

## Definition of Done

- Every requirement R1 to R18 holds, and each acceptance example AE1 to AE10 has a passing test or a recorded manual check. R15 holds when `utils/isPrivateFeedUrl.ts` passes the native test cases of `mayContainPrivateFeedToken` with no change.
- Every gate in the Verification Contract passes, or the pull request records why a gate did not run.
- No production code has `as`, `!`, `==`, or the `void` operator. Every server `catch` in the diff that does not throw again logs an event per KTD9.
- No feed URL and no guid appears in a log call, a Sentry `extra`, or an error message in the diff.
- No server code in the diff fetches a URL from a feed with plain `fetch`.
- The pull request body lists the Assumptions, the Deferred to Follow-Up Work items, and the Vercel settings of Documentation / Operational Notes.
- The diff holds no code from an abandoned try, and no unused export.
- Each unit is done when its Verification line holds.
