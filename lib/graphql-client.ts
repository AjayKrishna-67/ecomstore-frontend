import { DocumentNode, FieldNode, print, visit } from 'graphql';
import { API_URL, CHANNEL_TOKEN } from './constants';
import { getSdk } from '@/generated/graphql';
import { getAuthToken } from './session';

// This SDK sends documents over plain `fetch`, which — unlike Apollo/urql —
// does NOT auto-inject `__typename`. Many call sites discriminate union
// results at runtime (`result.x.__typename === 'Order'`), so without this the
// discriminator is always `undefined` and success is misread as failure.
// We replicate Apollo's behaviour: add `__typename` to every non-root
// selection set before printing, and strip it from outgoing variables so a
// fetched object can be safely round-tripped back into a mutation input.
const TYPENAME_FIELD: FieldNode = {
  kind: 'Field' as any,
  name: { kind: 'Name' as any, value: '__typename' },
};

const printCache = new WeakMap<DocumentNode, string>();

function printWithTypename(doc: DocumentNode): string {
  const cached = printCache.get(doc);
  if (cached) return cached;
  const withTypename = visit(doc, {
    SelectionSet: {
      enter(node, _key, parent) {
        // Skip the root operation selection set (matches Apollo).
        if (
          parent &&
          !Array.isArray(parent) &&
          (parent as { kind?: string }).kind === 'OperationDefinition'
        ) {
          return undefined;
        }
        const hasTypename = node.selections.some(
          (sel) => sel.kind === 'Field' && sel.name.value === '__typename',
        );
        if (hasTypename) return undefined;
        return { ...node, selections: [...node.selections, TYPENAME_FIELD] };
      },
    },
  });
  const printed = print(withTypename);
  printCache.set(doc, printed);
  return printed;
}

function stripTypename<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(stripTypename) as unknown as T;
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (k === '__typename') continue;
      out[k] = stripTypename(v);
    }
    return out as T;
  }
  return value;
}

export interface QueryOptions {
  authToken?: string;
  customHeaders?: Record<string, string>;
}

export interface GraphqlResponse<Response> {
  errors: any[];
  data: Response;
}

export type WithHeaders<T> = T & { _headers: Headers };

async function sendQuery<Response, Variables = {}>(options: {
  query: string;
  variables?: Variables;
  authToken?: string;
  customHeaders?: Record<string, string>;
}): Promise<GraphqlResponse<Response> & { headers: Headers }> {
  const headers = new Headers();
  headers.set('Content-Type', 'application/json');
  headers.set('vendure-token', CHANNEL_TOKEN);

  // Get auth token from session if not provided
  const authToken = options.authToken ?? (await getAuthToken());
  if (authToken) {
    headers.set('Authorization', `Bearer ${authToken}`);
  }

  if (options.customHeaders) {
    for (const key in options.customHeaders) {
      headers.set(key, options.customHeaders[key]);
    }
  }

  const res = await fetch(API_URL, {
    method: 'POST',
    body: JSON.stringify({
      query: options.query,
      variables: stripTypename(options.variables),
    }),
    headers,
    cache: 'no-store',
  });

  // Guard against a misconfigured / unreachable endpoint returning an HTML
  // error page (proxy 404/502, login redirect, etc.). Without this, the raw
  // res.json() throws a cryptic "Unexpected token '<'" far from the cause.
  const contentType = res.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    const body = await res.text().catch(() => '');
    throw new Error(
      `Vendure API at ${API_URL} returned non-JSON ` +
        `(HTTP ${res.status} ${contentType || 'no content-type'}): ` +
        `${body.slice(0, 200).replace(/\s+/g, ' ').trim()}`,
    );
  }

  return {
    ...(await res.json()),
    headers: res.headers,
  };
}

function requester<R, V>(
  doc: DocumentNode,
  vars?: V,
  options?: QueryOptions,
): Promise<R & { _headers: Headers }> {
  return sendQuery<R, V>({
    query: printWithTypename(doc),
    variables: vars,
    ...options,
  }).then(async (response) => {
    const headers: Record<string, string> = {};
    headers['x-vendure-api-url'] = API_URL;

    const vendureAuthToken = response.headers.get('vendure-auth-token');
    if (vendureAuthToken) {
      headers['vendure-auth-token'] = vendureAuthToken;
    }

    if (response.errors) {
      console.error(
        response.errors[0].extensions?.exception?.stacktrace.join('\n') ??
          response.errors,
      );
      throw new Error(JSON.stringify(response.errors[0]));
    }

    return { ...response.data, _headers: new Headers(headers) };
  });
}

const baseSdk = getSdk<QueryOptions, unknown>(requester);

type Sdk = typeof baseSdk;
type SdkWithHeaders = {
  [k in keyof Sdk]: (
    ...args: Parameters<Sdk[k]>
  ) => Promise<Awaited<ReturnType<Sdk[k]>> & { _headers: Headers }>;
};

export const sdk: SdkWithHeaders = baseSdk as any;

/**
 * For use in API route handlers where we need to pass auth token explicitly
 */
export async function createAuthenticatedSdk(authToken: string) {
  function authRequester<R, V>(
    doc: DocumentNode,
    vars?: V,
    options?: QueryOptions,
  ): Promise<R & { _headers: Headers }> {
    return sendQuery<R, V>({
      query: printWithTypename(doc),
      variables: vars,
      authToken,
      ...options,
    }).then(async (response) => {
      const headers: Record<string, string> = {};
      headers['x-vendure-api-url'] = API_URL;

      const vendureAuthToken = response.headers.get('vendure-auth-token');
      if (vendureAuthToken) {
        headers['vendure-auth-token'] = vendureAuthToken;
      }

      if (response.errors) {
        console.error(response.errors);
        throw new Error(JSON.stringify(response.errors[0]));
      }

      return { ...response.data, _headers: new Headers(headers) };
    });
  }

  return getSdk<QueryOptions, unknown>(authRequester) as SdkWithHeaders;
}
