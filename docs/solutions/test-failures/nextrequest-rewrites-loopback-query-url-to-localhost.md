---
title: NextRequest rewrites a loopback URL in a query to localhost, so a DNS-based SSRF guard fails only in CI
date: 2026-10-20
category: test-failures
module: SSRF feed guard and the proxy routes (utils/server/safeFetchFeed.ts, app/api/podcasts/chapters/route.ts, app/api/podcasts/transcript/route.tsx)
problem_type: test_failure
component: api_layer
symptoms:
  - 'Two Vitest route tests fail only in GitHub Actions CI with "AssertionError: expected 504 to be 400"'
  - 'The same tests pass locally every time, with the same commit and the same Node.js version'
  - 'request.nextUrl.searchParams.get("url") gives http://localhost/chapters.json for a url query value of http://127.0.0.1/chapters.json'
  - 'A guard test that sends the same URL to safeFetchFeedResource without a NextRequest passes in CI'
root_cause: missing_validation
resolution_type: code_fix
severity: medium
framework_version: 'next 16.0.7, node 22.18.0'
related_components: [testing_framework, infrastructure]
retire_when: 'A Next.js release removes or narrows REGEX_LOCALHOST_HOSTNAME, so a loopback substring in a query value reaches the route as sent; after a Next.js upgrade, read REGEX_LOCALHOST_HOSTNAME and parseURL in node_modules/next/dist/server/web/next-url.js'
tags: [nextjs, nexturl, ssrf, localhost, loopback, dns, ci-only-failure, vitest]
---

# NextRequest rewrites a loopback URL in a query to localhost, so a DNS-based SSRF guard fails only in CI

## Problem

Two route tests of the `node` Vitest project failed only in GitHub Actions CI with `expected 504 to be 400`. `NextRequest` changed the loopback literal in the query to `localhost`, and the feed guard then sent that name to DNS.

## Symptoms

- These tests failed in CI and passed locally every time:
  - `app/api/podcasts/chapters/route.node.test.ts`: "should answer a loopback URL with the fixed blocked code and no stack"
  - `app/api/podcasts/transcript/route.node.test.ts`: "should answer an HTML request for a loopback URL with the fixed blocked code and no body from the target"
- The error was `AssertionError: expected 504 to be 400`.
- The CI log shows that each of the two test files ended in 22 to 33 ms. Thus, the guard answered at once, not after a deadline.
- Both tests failed in CI run 39257732917 (2026-10-19) and CI run 39420790257 (2026-10-20), before and after unrelated commits.
- CI runs `npx playwright install && npx vitest` on `macos-26` with Node 22.18.0 from `.nvmrc` (`.github/workflows/main.yml:16`, `.github/workflows/main.yml:22`, `.github/workflows/main.yml:34`).
- In the same CI runs, the guard test "should give blocked for a loopback URL" passed (`utils/server/safeFetchFeed.node.test.ts:937-947`). It sends the same URL to `safeFetchFeedResource` with the default DNS lookup, but with no `NextRequest`.

## What Did Not Work

1. A read of the guard path. For an IP literal, `validateUrl` blocks before any DNS lookup or fetch (`utils/server/safeFetchFeed.ts:550-563`). Thus, a 504 for `http://127.0.0.1/...` looked impossible. The fast `timeout` paths before an answer from the target are:
   - an aborted deadline signal at the top of the hop loop (`utils/server/safeFetchFeed.ts:394-397`)
   - a transient DNS failure (`utils/server/safeFetchFeed.ts:573-582`)
   - a fetch that throws `AbortError` or `TimeoutError` (`utils/server/safeFetchFeed.ts:779-785`)
2. A search for a global stub that leaks between test files in one worker. `utils/server/probeImage.node.test.ts`, `utils/server/safeFetchFeed.node.test.ts`, and `packages/podcast-index/utils/request.node.test.ts` spy on `AbortSignal.timeout`. Per this session's investigation, all three restore the spy in `afterEach`. `npx vitest run --project node --maxWorkers=1` and `npx vitest run --maxWorkers=2` passed locally.
3. A local run with `CI=true`, `GITHUB_ACTIONS=true`, and `RUNNER_OS=macOS`. The route tests passed.
4. A check of the CI checkout. CI tested the merge commit of the branch head into the same `main` base, with the same Node 22.18.0. Thus, the code was the same, and the machine made the difference.

## Solution

The guard test that passed in CI gave the clue. The difference was in the route test path, which builds a `NextRequest`. A print of the value that the route reads showed the cause:

```ts
const request = new NextRequest(
  new URL(
    'https://pod.monster/api/podcasts/chapters?url=' +
      encodeURIComponent('http://127.0.0.1/chapters.json'),
  ),
);

request.nextUrl.searchParams.get('url'); // 'http://localhost/chapters.json'
new URL(request.url).searchParams.get('url'); // 'http://localhost/chapters.json'
```

The routes read the target URL from `request.nextUrl.searchParams` (`app/api/podcasts/chapters/route.ts:31`, `app/api/podcasts/transcript/route.tsx:38`). Thus, the guard received the host name `localhost`, not the literal `127.0.0.1`.

The fix is in PR #532 ("feat: Support native app urls"), in the commit "fix: Block loopback host names in the feed guard". It blocks the loopback names of RFC 6761 by name in `validateUrl`. The check comes after the protocol and credential checks and before the IP-literal check.

Before, in `validateUrl` of `utils/server/safeFetchFeed.ts`:

```ts
if (
  (protocol !== 'http:' && protocol !== 'https:') ||
  username !== '' ||
  password !== '' ||
  hostname === ''
) {
  return createFailure('safe_fetch_blocked', 'blocked');
}

const bareHostname =
  hostname.startsWith('[') && hostname.endsWith(']')
    ? hostname.slice(1, -1)
    : hostname;
```

After (`utils/server/safeFetchFeed.ts:123`, `utils/server/safeFetchFeed.ts:534-553`):

```ts
const LOOPBACK_NAME_PATTERN = /(^|\.)localhost\.?$/;

// ...

if (
  (protocol !== 'http:' && protocol !== 'https:') ||
  username !== '' ||
  password !== '' ||
  hostname === ''
) {
  return createFailure('safe_fetch_blocked', 'blocked');
}

// RFC 6761 reserves `localhost` and every name under it for loopback. The
// DNS answer for such a name depends on the host, so the guard blocks the
// name itself.
if (LOOPBACK_NAME_PATTERN.test(hostname)) {
  return createFailure('safe_fetch_blocked', 'blocked');
}

const bareHostname =
  hostname.startsWith('[') && hostname.endsWith(']')
    ? hostname.slice(1, -1)
    : hostname;
```

URL parse lowercases the host and keeps a root dot at the end (`localhost.`). Thus, the pattern needs no `i` flag, and it accepts the root dot.

New tests in `utils/server/safeFetchFeed.node.test.ts:321-359`:

- These URLs give `blocked` with no DNS lookup and no fetch:
  - `http://localhost/feed.xml`
  - `http://LocalHost:3000/feed.xml`
  - `http://localhost./feed.xml`
  - `http://feeds.localhost/feed.xml`
- These URLs still get one DNS lookup:
  - `https://notlocalhost/feed.xml`
  - `https://localhost.example.com/feed.xml`

A comment above each of the two route tests says that `NextRequest` rewrites `127.0.0.1` to `localhost`, the query too (`app/api/podcasts/chapters/route.node.test.ts:50-51`, `app/api/podcasts/transcript/route.node.test.ts:53-54`). CI passed after the fix (run 39537803032).

To confirm the cause, this session changed `defaultDnsLookup` for one local run to throw `new DnsResolutionError(true)`, a transient failure. Without the name block, the two route tests failed with `expected 504 to be 400`. With the name block, they passed.

## Why This Works

Next.js 16.0.7 rewrites the first loopback-like substring in the URL of every `NextRequest`:

- The `NextRequest` constructor builds a `NextURL` from the input URL (`node_modules/next/dist/server/web/spec-extension/request.js:43`). `request.url` returns `nextUrl.toString()`, unless `__NEXT_NO_MIDDLEWARE_URL_NORMALIZE` is set (`node_modules/next/dist/server/web/spec-extension/request.js:50`, `node_modules/next/dist/server/web/spec-extension/request.js:94-95`).
- `parseURL` calls `new URL(String(url).replace(REGEX_LOCALHOST_HOSTNAME, 'localhost'), ...)` (`node_modules/next/dist/server/web/next-url.js:16-17`).
- `REGEX_LOCALHOST_HOSTNAME` is `/(?!^https?:\/\/)(127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}|\[::1\]|localhost)/` (`node_modules/next/dist/server/web/next-url.js:15`).
- The regex has no `g` flag. Thus, `replace` changes only the first match, at any position in the string.
- The regex has no `m` flag, so `^` matches only at position 0. The lookahead thus stops only a match that starts at position 0. It does not limit the match to the host.
- Percent-encoding of a query value keeps the dots. Thus, `url=http%3A%2F%2F127.0.0.1%2F...` holds a match. An encoded `[::1]` (`%5B%3A%3A1%5D`) holds no match.

The request host decides where the first match is. This session confirmed both cases in Node:

- For a request to `https://pod.monster/...`, the first match is in the query. The route receives `http://localhost/chapters.json`.
- For a request to `http://localhost:3000/...` or `http://127.0.0.1:3000/...`, the first match is the request host. The query keeps `127.0.0.1`. Thus, a manual check against `npm run dev` does not show the query rewrite.

The guard then sent `localhost` to `defaultDnsLookup`. That function uses a c-ares `Resolver` with `resolve4` and `resolve6`, not `dns.lookup` (`utils/server/safeFetchFeed.ts:162-168`, `utils/server/safeFetchFeed.ts:594-618`). The comment at `utils/server/safeFetchFeed.ts:162-164` gives the reason.

- Locally, `resolve4('localhost')` gave `['127.0.0.1']`, and `resolve6('localhost')` gave `ENODATA`. The guard blocked the loopback address, and the route answered 400.
- On the CI runner, the lookup gave no address, and the guard classed the failure as transient (`TRANSIENT_DNS_CODES` at `utils/server/safeFetchFeed.ts:127-134`, `isTransientDnsRejection` at `utils/server/safeFetchFeed.ts:622-635`). The guard gave the reason `timeout` (`utils/server/safeFetchFeed.ts:573-582`). `GUARD_FAILURE_STATUSES` maps `timeout` to 504 (`app/api/podcasts/proxyResponse.ts:7`).
- The CI logs do not show the DNS error code. The reproduction confirms the transient path, but no CI log line confirms it.

The fix blocks the name before any DNS lookup. The result thus does not depend on the DNS of the machine, and the routes answer 400 everywhere.

The rewrite also applies in production. The app-route template calls `NextRequestAdapter.fromNodeNextRequest` (`node_modules/next/dist/build/templates/app-route.js:230`). That adapter calls `new NextRequest(url, ...)` (`node_modules/next/dist/server/web/spec-extension/adapters/next-request.js:104`). Thus, the first `127.x.x.x` substring in a production query reaches the route as `localhost`. For this site, the guard blocks the literal and the name, so the result is the same. A legitimate URL in a query value can also change, for example a transcript URL with `127.0.0.1` in its own path or query. Per this session, that case is rare, and PR #532 does not change it.

## Prevention

- A guard that receives a URL from a `NextRequest` query must block a loopback name the same as a loopback literal. It must not depend on DNS for that name.
- A route test that sends a loopback literal through `NextRequest` tests the name path, not the literal path. Put a comment above such a test, as at `app/api/podcasts/chapters/route.node.test.ts:50-51`.
- Keep a test at each level:
  - a guard test that calls `safeFetchFeed` with a loopback name and a `vi.fn` DNS lookup, and asserts `expect(dnsLookup).not.toHaveBeenCalled()` (`utils/server/safeFetchFeed.node.test.ts:321-338`)
  - a route test that builds a `NextRequest` with the loopback URL in the query, and asserts `expect(response.status).toBe(400)`
- A CI-only `expected 504 to be 400`, or any fast `timeout` from the guard, points at a DNS lookup of a name that the test did not mean to look up.
- To debug, print `request.nextUrl.searchParams.get('url')` in the test. Compare it with the value that the test put in the query.
- To reproduce a CI-only DNS failure locally, make `defaultDnsLookup` throw `new DnsResolutionError(true)` for one run. Then do `npx vitest run --project node`.

## Related Issues

- PR #532 holds the fix, the new guard tests, and the route test comments.
- `docs/plans/2026-10-18-2030-feat-support-native-urls-plan.md`: KTD3 defines the guard, KTD20 and U14 send the proxy routes through it, and the Deferred to Follow-Up Work list asks to port the loopback name rule to the native app server.
- The native app server has its own `safeFetch` (sibling repo `pod-monster-native`, `packages/server/src/lib/safeFetch.ts`). As of 2026-10-20, its `main` branch has no name rule for `localhost`, so it resolves loopback names in DNS.
- `docs/solutions/best-practices/keep-secret-url-path-segment-out-of-sentry.md` documents another Next.js 16 internal that changes request data before app code sees it.
