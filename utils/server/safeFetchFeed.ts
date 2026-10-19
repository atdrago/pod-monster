import 'server-only';

import { captureMessage } from '@sentry/nextjs';
import type { LookupAddress } from 'node:dns';
import { Resolver } from 'node:dns/promises';
import { BlockList, isIP } from 'node:net';
import { Agent, fetch as undiciFetch } from 'undici';

import { raceAgainstDeadline } from 'utils/server/raceAgainstDeadline';

export type SafeFetchFailureReason =
  | 'blocked'
  | 'http_status'
  | 'network'
  | 'timeout'
  | 'too_large';

type SafeFetchEvent =
  | 'safe_fetch_blocked'
  | 'safe_fetch_body_failed'
  | 'safe_fetch_dns_failed'
  | 'safe_fetch_http_status'
  | 'safe_fetch_redirect_failed'
  | 'safe_fetch_request_failed'
  | 'safe_fetch_timeout'
  | 'safe_fetch_too_large';

export interface SafeFetchFailure {
  kind: 'error';
  reason: SafeFetchFailureReason;
  status?: number;
}

type SafeFetchBytesResult =
  | { bytes: Uint8Array; isRangeHonored: boolean; kind: 'ok' }
  | SafeFetchFailure;

type SafeFetchTextResult = { body: string; kind: 'ok' } | SafeFetchFailure;

export type DnsLookup = (
  hostname: string,
  options: { all: true },
) => Promise<Array<LookupAddress>>;

// The guard reads a response only through these structural types. Thus, it
// accepts the undici `Response` of the real path and the global `Response` of
// the tests. TypeScript does not treat the two classes as one type.
interface ResponseHeadersView {
  get(name: string): string | null;
}

type BodyReadResult =
  | { done: false; value: Uint8Array }
  | { done: true; value?: Uint8Array };

interface BodyReaderView {
  cancel(): Promise<void>;
  read(): Promise<BodyReadResult>;
}

interface BodyStreamView {
  cancel(): Promise<void>;
  getReader(): BodyReaderView;
}

interface FetchResponseView {
  readonly body: BodyStreamView | null;
  readonly headers: ResponseHeadersView;
  readonly status: number;
}

interface FetchInit {
  headers: Record<string, string>;
  redirect: 'manual';
  signal: AbortSignal;
}

type FetchFunction = (
  url: string,
  init: FetchInit,
) => Promise<FetchResponseView>;

/**
 * A test gives a fake fetch and a fake resolver, so that no test opens a
 * connection. An injected fetch does not pin the connection to the checked
 * addresses.
 */
interface SafeFetchSeams {
  dnsLookup?: DnsLookup;
  fetchFn?: FetchFunction;
}

interface SafeFetchRequest {
  accept?: string;
  isRanged: boolean;
  maxBytes: number;
  seams?: SafeFetchSeams;
  url: string;
}

type HopResult = SafeFetchBytesResult | { kind: 'redirect'; nextUrl: string };

const DEADLINE_MILLISECONDS = 20_000;
const DNS_DEADLINE_MILLISECONDS = 10_000;
const DNS_TIMEOUT_MILLISECONDS = 3_000;
const DNS_TRIES = 2;
const FEED_MAX_BYTES = 10 * 1024 * 1024;
const FEED_RESOURCE_MAX_BYTES = 5 * 1024 * 1024;
const MAX_REDIRECT_HOPS = 5;
const MAX_URL_LENGTH = 2048;
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const USER_AGENT = 'pod.monster (+https://pod.monster)';
const FEED_ACCEPT =
  'application/rss+xml, application/atom+xml, application/xml;q=0.9, */*;q=0.5';
const TRANSIENT_DNS_CODES = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'EREFUSED',
  'ESERVFAIL',
  'ETIMEDOUT',
  'ETIMEOUT',
]);

const BLOCKED_IPV4_SUBNETS = createSubnetList('ipv4', [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.88.99.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
]);
// IPv6 uses an allow list: only global unicast (2000::/3) passes. `BlockList`
// is only the Node.js type for a set of subnets.
const GLOBAL_UNICAST_IPV6_SUBNETS = createSubnetList('ipv6', [['2000::', 3]]);
const BLOCKED_IPV6_SUBNETS = createSubnetList('ipv6', [
  ['2001::', 23],
  ['2001:db8::', 32],
  ['2002::', 16],
]);

// The guard uses a `Resolver`, not `dns.lookup`. `dns.lookup` accepts no
// timeout and no abort signal, and a hung call stopped the feed crawler of the
// native server for 4 days and 21 hours.
const resolver = new Resolver({
  timeout: DNS_TIMEOUT_MILLISECONDS,
  tries: DNS_TRIES,
});

class DnsDeadlineError extends Error {
  name = 'DnsDeadlineError';

  constructor() {
    super('The DNS lookup did not end before its deadline');
  }
}

class DnsResolutionError extends Error {
  name = 'DnsResolutionError';

  constructor(public readonly isTransient: boolean) {
    super('The DNS lookup found no A or AAAA record');
  }
}

/**
 * Reads a feed that a visitor names, with a cap of 10 MiB. The result never
 * holds the URL, and the logs hold only a reason and a status.
 */
export async function safeFetchFeed(
  feedUrl: string,
  seams?: SafeFetchSeams,
): Promise<SafeFetchTextResult> {
  return toTextResult(
    await safeFetch({
      accept: FEED_ACCEPT,
      isRanged: false,
      maxBytes: FEED_MAX_BYTES,
      seams,
      url: feedUrl,
    }),
  );
}

/**
 * Reads a chapters file or a transcript that a feed links to, with a cap of
 * 5 MiB.
 */
export async function safeFetchFeedResource(
  resourceUrl: string,
  seams?: SafeFetchSeams,
): Promise<SafeFetchTextResult> {
  return toTextResult(
    await safeFetch({
      isRanged: false,
      maxBytes: FEED_RESOURCE_MAX_BYTES,
      seams,
      url: resourceUrl,
    }),
  );
}

/**
 * Reads the first `byteCount` bytes of a file with a `Range` header. A host
 * can ignore the range and send the whole file with status 200. Thus, a
 * `content-length` over the cap does not fail the read, and the read stops at
 * `byteCount`.
 */
export async function safeFetchByteRange(
  resourceUrl: string,
  byteCount: number,
  seams?: SafeFetchSeams,
): Promise<SafeFetchBytesResult> {
  return safeFetch({
    isRanged: true,
    maxBytes: byteCount,
    seams,
    url: resourceUrl,
  });
}

/**
 * Returns a `connect.lookup` for undici that always gives the checked
 * addresses. undici then cannot resolve the host again to another address
 * between the check and the connection (DNS rebinding).
 */
export function pinLookup(addresses: Array<LookupAddress>) {
  return (
    _hostname: string,
    options: { all?: boolean },
    callback: (
      error: NodeJS.ErrnoException | null,
      address: string | Array<LookupAddress>,
      family?: number,
    ) => void,
  ): void => {
    if (options.all === true) {
      callback(
        null,
        addresses.map(({ address, family }) => ({ address, family })),
      );

      return;
    }

    const [firstAddress] = addresses;

    if (firstAddress === undefined) {
      callback(new Error('The pinned lookup has no checked address'), '', 0);

      return;
    }

    callback(null, firstAddress.address, firstAddress.family);
  };
}

function toTextResult(result: SafeFetchBytesResult): SafeFetchTextResult {
  if (result.kind === 'error') {
    return result;
  }

  return { body: new TextDecoder('utf-8').decode(result.bytes), kind: 'ok' };
}

async function safeFetch({
  accept,
  isRanged,
  maxBytes,
  seams,
  url,
}: SafeFetchRequest): Promise<SafeFetchBytesResult> {
  if (url.length > MAX_URL_LENGTH) {
    return createFailure('safe_fetch_blocked', 'blocked');
  }

  const headers: Record<string, string> = { 'user-agent': USER_AGENT };

  if (accept !== undefined) {
    headers.accept = accept;
  }

  if (isRanged) {
    headers.range = `bytes=0-${maxBytes - 1}`;
  }

  const deadlineAt = Date.now() + DEADLINE_MILLISECONDS;
  const deadlineSignal = AbortSignal.timeout(DEADLINE_MILLISECONDS);
  let currentUrl = url;

  for (let hop = 0; hop <= MAX_REDIRECT_HOPS; hop += 1) {
    if (deadlineSignal.aborted) {
      return createFailure('safe_fetch_timeout', 'timeout');
    }

    const validation = await validateUrl(
      currentUrl,
      seams?.dnsLookup ?? defaultDnsLookup,
      deadlineAt - Date.now(),
    );

    if (validation.kind === 'error') {
      return validation;
    }

    const hopResult = await fetchHop({
      addresses: validation.addresses,
      deadlineSignal,
      headers,
      injectedFetch: seams?.fetchFn,
      isRanged,
      maxBytes,
      url: currentUrl,
    });

    if (hopResult.kind !== 'redirect') {
      return hopResult;
    }

    currentUrl = hopResult.nextUrl;
  }

  return createFailure('safe_fetch_blocked', 'blocked');
}

async function fetchHop({
  addresses,
  deadlineSignal,
  headers,
  injectedFetch,
  isRanged,
  maxBytes,
  url,
}: Pick<SafeFetchRequest, 'isRanged' | 'maxBytes' | 'url'> & {
  addresses: Array<LookupAddress>;
  deadlineSignal: AbortSignal;
  headers: Record<string, string>;
  injectedFetch: FetchFunction | undefined;
}): Promise<HopResult> {
  const pinnedAgent = injectedFetch
    ? undefined
    : new Agent({ connect: { lookup: pinLookup(addresses) } });
  const fetchFn: FetchFunction =
    injectedFetch ??
    ((target, init) =>
      undiciFetch(target, { ...init, dispatcher: pinnedAgent }));

  try {
    let response: FetchResponseView;

    try {
      response = await fetchFn(url, {
        headers,
        redirect: 'manual',
        signal: deadlineSignal,
      });
    } catch (error) {
      return createFailure(
        'safe_fetch_request_failed',
        isTimeoutError(error, deadlineSignal) ? 'timeout' : 'network',
      );
    }

    const { status } = response;

    if (REDIRECT_STATUSES.has(status)) {
      await cancelBody(response);

      const location = response.headers.get('location');

      if (!location || !URL.canParse(location, url)) {
        return createFailure('safe_fetch_redirect_failed', 'network', status);
      }

      return { kind: 'redirect', nextUrl: new URL(location, url).href };
    }

    if (status < 200 || status >= 300) {
      await cancelBody(response);

      return createFailure('safe_fetch_http_status', 'http_status', status);
    }

    if (!isRanged) {
      const contentLength = Number.parseInt(
        response.headers.get('content-length') ?? '',
        10,
      );

      if (Number.isFinite(contentLength) && contentLength > maxBytes) {
        await cancelBody(response);

        return createFailure('safe_fetch_too_large', 'too_large', status);
      }
    }

    const body = await readBodyWithCap(
      response,
      maxBytes,
      isRanged,
      deadlineSignal,
    );

    if (body.kind === 'error') {
      return body;
    }

    return {
      bytes: body.bytes,
      isRangeHonored: isRanged && status === 206,
      kind: 'ok',
    };
  } finally {
    // The agent must stay open until the body is read or canceled.
    await pinnedAgent?.destroy();
  }
}

async function validateUrl(
  rawUrl: string,
  dnsLookup: DnsLookup,
  remainingMilliseconds: number,
): Promise<{ addresses: Array<LookupAddress>; kind: 'ok' } | SafeFetchFailure> {
  if (!URL.canParse(rawUrl)) {
    return createFailure('safe_fetch_blocked', 'blocked');
  }

  const { hostname, password, protocol, username } = new URL(rawUrl);

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
  const literalFamily = isIP(bareHostname);

  if (literalFamily !== 0) {
    return isBlockedAddress(bareHostname, literalFamily)
      ? createFailure('safe_fetch_blocked', 'blocked')
      : {
          addresses: [{ address: bareHostname, family: literalFamily }],
          kind: 'ok',
        };
  }

  let addresses: Array<LookupAddress>;

  try {
    addresses = await raceAgainstDeadline(
      dnsLookup(bareHostname, { all: true }),
      Math.min(DNS_DEADLINE_MILLISECONDS, remainingMilliseconds),
      () => new DnsDeadlineError(),
    );
  } catch (error) {
    const isTransient =
      error instanceof DnsDeadlineError ||
      (error instanceof DnsResolutionError && error.isTransient);

    return createFailure(
      'safe_fetch_dns_failed',
      isTransient ? 'timeout' : 'blocked',
    );
  }

  if (
    addresses.length === 0 ||
    addresses.some(({ address, family }) => isBlockedAddress(address, family))
  ) {
    return createFailure('safe_fetch_blocked', 'blocked');
  }

  return { addresses, kind: 'ok' };
}

async function defaultDnsLookup(
  hostname: string,
): Promise<Array<LookupAddress>> {
  // A host with only an A record rejects `resolve6` with ENODATA, and the
  // other way around. Only the absence of all addresses is a failure.
  const [ipv4Result, ipv6Result] = await Promise.allSettled([
    resolver.resolve4(hostname),
    resolver.resolve6(hostname),
  ]);
  const addresses: Array<LookupAddress> = [
    ...(ipv4Result.status === 'fulfilled'
      ? ipv4Result.value.map((address) => ({ address, family: 4 }))
      : []),
    ...(ipv6Result.status === 'fulfilled'
      ? ipv6Result.value.map((address) => ({ address, family: 6 }))
      : []),
  ];

  if (addresses.length === 0) {
    throw new DnsResolutionError(
      isTransientDnsRejection(ipv4Result) ||
        isTransientDnsRejection(ipv6Result),
    );
  }

  return addresses;
}

function isTransientDnsRejection(result: PromiseSettledResult<unknown>) {
  if (result.status !== 'rejected') {
    return false;
  }

  const { reason } = result;

  return (
    reason instanceof Error &&
    'code' in reason &&
    typeof reason.code === 'string' &&
    TRANSIENT_DNS_CODES.has(reason.code)
  );
}

function isBlockedAddress(address: string, family: number): boolean {
  if (family === 4) {
    return isBlockedIpv4(address);
  }

  if (family === 6) {
    return isBlockedIpv6(address);
  }

  return true;
}

function isBlockedIpv4(address: string): boolean {
  return isIP(address) !== 4 || BLOCKED_IPV4_SUBNETS.check(address, 'ipv4');
}

function isBlockedIpv6(address: string): boolean {
  const bytes = expandIpv6ToBytes(address.toLowerCase());

  if (bytes === null) {
    return true;
  }

  const embeddedIpv4 = getEmbeddedIpv4(bytes);

  if (embeddedIpv4 !== null) {
    return isBlockedIpv4(embeddedIpv4);
  }

  return (
    !GLOBAL_UNICAST_IPV6_SUBNETS.check(address, 'ipv6') ||
    BLOCKED_IPV6_SUBNETS.check(address, 'ipv6')
  );
}

/**
 * Returns the IPv4 address in the low 32 bits of an IPv4-mapped address
 * (::ffff:0:0/96) or an IPv4-compatible address (::/96), else `null`.
 */
function getEmbeddedIpv4(bytes: Array<number>): string | null {
  const isZeroUntil = (end: number) =>
    bytes.slice(0, end).every((byte) => byte === 0);
  const isMapped = isZeroUntil(10) && bytes[10] === 0xff && bytes[11] === 0xff;
  const isCompatible = isZeroUntil(12);

  return isMapped || isCompatible ? bytes.slice(12).join('.') : null;
}

/**
 * Expands an IPv6 address, with `::` and an optional dotted IPv4 end, into its
 * 16 bytes. Returns `null` for a value that does not parse, and the caller
 * then blocks it.
 */
function expandIpv6ToBytes(address: string): Array<number> | null {
  const zoneIndex = address.indexOf('%');
  const addressWithoutZone =
    zoneIndex === -1 ? address : address.slice(0, zoneIndex);
  const halves = addressWithoutZone.split('::');

  if (halves.length > 2) {
    return null;
  }

  const headGroups = parseIpv6Groups(halves[0]);

  if (headGroups === null) {
    return null;
  }

  if (halves.length === 1) {
    return headGroups.length === 8 ? groupsToBytes(headGroups) : null;
  }

  const tailGroups = parseIpv6Groups(halves[1]);

  if (tailGroups === null) {
    return null;
  }

  const missingGroupCount = 8 - headGroups.length - tailGroups.length;

  if (missingGroupCount < 1) {
    return null;
  }

  return groupsToBytes([
    ...headGroups,
    ...new Array<number>(missingGroupCount).fill(0),
    ...tailGroups,
  ]);
}

function parseIpv6Groups(part: string): Array<number> | null {
  if (part === '') {
    return [];
  }

  const segments = part.split(':');
  const groups: Array<number> = [];

  for (let i = 0; i < segments.length; i += 1) {
    const segment = segments[i];

    if (segment.includes('.')) {
      if (i !== segments.length - 1 || isIP(segment) !== 4) {
        return null;
      }

      const [first, second, third, fourth] = segment.split('.').map(Number);

      groups.push(first * 256 + second, third * 256 + fourth);

      continue;
    }

    if (!/^[0-9a-f]{1,4}$/.test(segment)) {
      return null;
    }

    groups.push(Number.parseInt(segment, 16));
  }

  return groups;
}

function groupsToBytes(groups: Array<number>): Array<number> {
  return groups.flatMap((group) => [Math.floor(group / 256), group % 256]);
}

function createSubnetList(
  type: 'ipv4' | 'ipv6',
  subnets: Array<[network: string, prefixLength: number]>,
): BlockList {
  const subnetList = new BlockList();

  for (const [network, prefixLength] of subnets) {
    subnetList.addSubnet(network, prefixLength, type);
  }

  return subnetList;
}

function isTimeoutError(error: unknown, deadlineSignal: AbortSignal): boolean {
  return (
    deadlineSignal.aborted ||
    (error instanceof Error &&
      (error.name === 'AbortError' || error.name === 'TimeoutError'))
  );
}

async function cancelBody(response: FetchResponseView): Promise<void> {
  try {
    await response.body?.cancel();
  } catch {
    captureMessage('safe_fetch_body_cancel_failed', { level: 'warning' });
  }
}

async function readBodyWithCap(
  response: FetchResponseView,
  maxBytes: number,
  isRanged: boolean,
  deadlineSignal: AbortSignal,
): Promise<{ bytes: Uint8Array; kind: 'ok' } | SafeFetchFailure> {
  const reader = response.body?.getReader();

  if (reader === undefined) {
    return { bytes: new Uint8Array(0), kind: 'ok' };
  }

  const chunks: Array<Uint8Array> = [];
  let totalByteCount = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      const remainingByteCount = maxBytes - totalByteCount;

      if (value.byteLength > remainingByteCount) {
        await reader.cancel();

        if (!isRanged) {
          return createFailure(
            'safe_fetch_too_large',
            'too_large',
            response.status,
          );
        }

        chunks.push(value.subarray(0, remainingByteCount));
        totalByteCount += remainingByteCount;

        break;
      }

      chunks.push(value);
      totalByteCount += value.byteLength;
    }
  } catch (error) {
    return createFailure(
      'safe_fetch_body_failed',
      isTimeoutError(error, deadlineSignal) ? 'timeout' : 'network',
      response.status,
    );
  }

  const bytes = new Uint8Array(totalByteCount);
  let offset = 0;

  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return { bytes, kind: 'ok' };
}

/**
 * Logs a failure with its reason and status only. A host, a URL, and the text
 * of a native error can hold a private feed token.
 */
function createFailure(
  event: SafeFetchEvent,
  reason: SafeFetchFailureReason,
  status?: number,
): SafeFetchFailure {
  captureMessage(event, { extra: { reason, status }, level: 'warning' });

  return status === undefined
    ? { kind: 'error', reason }
    : { kind: 'error', reason, status };
}
