import { createHash, randomBytes } from 'node:crypto';
import http from 'node:http';
import { URL, URLSearchParams } from 'node:url';

const clientId = process.env.MS_GRAPH_CLIENT_ID;
const tenantId = process.env.MS_GRAPH_TENANT_ID || 'organizations';
const requestedScopes = (
  process.env.MS_GRAPH_SCOPES ||
  'User.Read Mail.ReadBasic Calendars.ReadBasic Team.ReadBasic.All'
)
  .split(/\s+/)
  .map((scope) => scope.trim())
  .filter(Boolean);

const graphBaseUrl = 'https://graph.microsoft.com/v1.0';

const usage = () => {
  console.log(`Usage:
  MS_GRAPH_CLIENT_ID=<client-id> [MS_GRAPH_TENANT_ID=<tenant-id|organizations|common>] node scripts/spikes/msgraph-auth-poc.mjs

Required app registration:
  - Public client/native desktop app
  - Redirect URI: http://localhost
  - Delegated Microsoft Graph read scopes only

Optional:
  MS_GRAPH_SCOPES="User.Read Mail.ReadBasic Calendars.ReadBasic Team.ReadBasic.All"

The script prints only sanitized request status. It never prints access tokens or response content.
`);
};

if (!clientId) {
  usage();
  process.exitCode = 1;
  process.exit();
}

const base64Url = (buffer) =>
  buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');

const createPkce = () => {
  const verifier = base64Url(randomBytes(64));
  const challenge = base64Url(createHash('sha256').update(verifier).digest());

  return {
    verifier,
    challenge,
  };
};

const tokenRequest = async ({ code, redirectUri, verifier }) => {
  const response = await fetch(
    `https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/v2.0/token`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        code_verifier: verifier,
        scope: requestedScopes.join(' '),
      }),
    },
  );
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      `Token request failed: HTTP ${response.status} ${body.error ?? ''} ${
        body.error_description ?? ''
      }`.trim(),
    );
  }

  if (!body.access_token) {
    throw new Error('Token response did not include an access token.');
  }

  return body.access_token;
};

const summarizeGraphResponse = async (name, path, accessToken) => {
  const response = await fetch(`${graphBaseUrl}${path}`, {
    headers: {
      authorization: `Bearer ${accessToken}`,
      accept: 'application/json',
    },
  });
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      name,
      status: 'blocked',
      httpStatus: response.status,
      graphCode: body.error?.code ?? 'unknown',
      message: body.error?.message ?? 'No Graph error message returned.',
    };
  }

  return {
    name,
    status: 'works',
    httpStatus: response.status,
    itemCount: Array.isArray(body.value) ? body.value.length : undefined,
  };
};

const main = async () => {
  const authResult = await new Promise((resolve, reject) => {
    const state = base64Url(randomBytes(24));
    const { verifier, challenge } = createPkce();
    const server = http.createServer((request, response) => {
      try {
        const requestUrl = new URL(request.url ?? '/', `http://${request.headers.host}`);

        if (requestUrl.pathname !== '/callback') {
          response.writeHead(404);
          response.end('Not found');
          return;
        }

        const returnedState = requestUrl.searchParams.get('state');
        const code = requestUrl.searchParams.get('code');
        const error = requestUrl.searchParams.get('error');
        const errorDescription = requestUrl.searchParams.get('error_description');
        const redirectUri = `http://localhost:${server.address().port}/callback`;

        response.writeHead(error ? 400 : 200, { 'content-type': 'text/plain; charset=utf-8' });
        response.end(
          error
            ? 'Sidekick Microsoft Graph POC sign-in failed. You can close this tab.'
            : 'Sidekick Microsoft Graph POC sign-in complete. You can close this tab.',
        );
        server.close();

        if (returnedState !== state) {
          reject(new Error('OAuth state mismatch.'));
          return;
        }

        if (error) {
          reject(new Error(`${error}: ${errorDescription ?? 'No error description returned.'}`));
          return;
        }

        if (!code) {
          reject(new Error('Microsoft login returned no authorization code.'));
          return;
        }

        resolve({ code, redirectUri, verifier });
      } catch (error) {
        server.close();
        reject(error);
      }
    });

    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      const redirectUri = `http://localhost:${port}/callback`;
      const authorizeUrl = new URL(
        `https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/v2.0/authorize`,
      );

      authorizeUrl.search = new URLSearchParams({
        client_id: clientId,
        response_type: 'code',
        redirect_uri: redirectUri,
        response_mode: 'query',
        scope: requestedScopes.join(' '),
        state,
        code_challenge: challenge,
        code_challenge_method: 'S256',
      }).toString();

      console.log('Open this URL in your browser to sign in:');
      console.log(authorizeUrl.toString());
      console.log('');
      console.log('Waiting for Microsoft redirect...');
    });
  });

  const accessToken = await tokenRequest(authResult);
  console.log('Token acquired: yes');

  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const calls = [
    ['profile', '/me'],
    ['mail', '/me/messages?$top=1&$select=id,receivedDateTime,from'],
    [
      'calendar',
      `/me/calendarView?startDateTime=${encodeURIComponent(
        now.toISOString(),
      )}&endDateTime=${encodeURIComponent(nextWeek.toISOString())}&$top=5&$select=id,start,end,organizer`,
    ],
    ['teams', '/me/joinedTeams'],
  ];

  const results = [];
  for (const [name, path] of calls) {
    results.push(await summarizeGraphResponse(name, path, accessToken));
  }

  console.log(JSON.stringify({ tenant: 'configured', scopes: requestedScopes, results }, null, 2));
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
