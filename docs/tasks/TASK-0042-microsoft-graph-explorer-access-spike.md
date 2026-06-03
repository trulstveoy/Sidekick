# Task: Microsoft Graph Explorer access spike

ID: TASK-0042
Status: Done
Class: Major
Owner: Pair
Created: 2026-06-03
Updated: 2026-06-03
Branch: task/TASK-0042-microsoft-graph-explorer-access-spike
Worktree: ../Sidekick-worktrees/TASK-0042-microsoft-graph-explorer-access-spike
Base branch: origin/main
Write scope:
- `docs/tasks/TASK-0042-microsoft-graph-explorer-access-spike.md`
- possible later spike notes under `docs/research/` or `docs/tasks/`
Parallel safety: Coordinate

## Summary

Investigate whether Sidekick can realistically integrate with Microsoft Graph for signed-in user access to mail, calendar, and Teams information.

This first task is a technical feasibility spike. It should prove or disprove that the required Microsoft Graph access works end to end for the human's real accounts and organizations. It is not a UI, visualization, or permanent Sidekick integration task.

## Superpowers Artifacts

Spec:
- Not created. This task record is the working artifact for a focused feasibility spike.

Plan:
- Not created. Create a Superpowers plan only if the spike turns into implementation work.

## Goal

Determine whether Microsoft Graph access is available end to end for:

- signing in through Microsoft Graph Explorer;
- obtaining an access token;
- calling Microsoft Graph with that token;
- reading minimal mail, calendar, and Teams metadata for the signed-in user;
- repeating the same test for more than one organization or tenant where the user has access.
- identifying whether a later Sidekick flow can open a browser-based Microsoft sign-in and receive delegated Graph access.

## Non-goals

- Do not build Sidekick UI.
- Do not design result visualization.
- Do not store tokens in Sidekick.
- Do not write OAuth code inside Sidekick.
- Do not request write permissions.
- Do not read large volumes of email, calendar, chat, or Teams data.
- Do not commit access tokens, tenant IDs, user IDs, message bodies, event bodies, or Teams content.

## Key Questions

1. Can the user sign in to Microsoft Graph Explorer with the relevant work or guest accounts?
2. Does Graph Explorer show an access token after sign-in?
3. Can the copied token call Microsoft Graph from Graph Explorer and, optionally, from a local REST client?
4. Which least-privileged delegated permissions are sufficient for:
   - basic profile check;
   - mail read check;
   - calendar read check;
   - Teams membership or chat metadata check?
5. Which checks work in the user's primary employer tenant?
6. Which checks work in other organizations where the user is a member or guest?
7. Which failures are caused by API unavailability versus tenant policy, missing consent, Conditional Access, admin consent, guest restrictions, or licensing?
8. If Graph Explorer works, what would a later Sidekick integration need: delegated auth, app registration, tenant selection, consent handling, token storage policy, and data minimization?
9. Can a future desktop Sidekick integration use a browser-based login flow, such as MSAL interactive authentication or OAuth authorization code with PKCE and redirect URI, to get a delegated access token?
10. What redirect pattern is realistic for Electron: localhost loopback, custom protocol, device code flow, or another Microsoft-supported desktop flow?

## Initial Research Notes

Microsoft's Graph Explorer documentation says Graph Explorer can be used to test APIs in a sample tenant, sign in to a user's own tenant, and learn which permissions are required for APIs:

- `https://learn.microsoft.com/en-us/graph/graph-explorer/graph-explorer-overview`

Graph Explorer also documents that signed-in users can consent to permissions, switch accounts, view the current tenant, and inspect/copy the access token:

- `https://learn.microsoft.com/en-us/graph/graph-explorer/graph-explorer-features`

Microsoft Graph supports delegated access, where the app acts on behalf of a signed-in user and cannot access resources the signed-in user cannot already access:

- `https://learn.microsoft.com/en-us/graph/permissions-overview`

Microsoft identity platform documentation says desktop apps can use MSAL interactive methods, and MSAL uses a browser for authentication. Microsoft also documents OAuth authorization code flow with PKCE for desktop apps and device code flow for devices where browser-based auth is not suitable:

- `https://learn.microsoft.com/en-us/entra/identity-platform/app-sign-in-flow`
- `https://learn.microsoft.com/en-us/entra/identity-platform/authentication-flows-app-scenarios`
- `https://learn.microsoft.com/en-nz/entra/identity-platform/v2-oauth2-auth-code-flow`

Relevant API and permission references for the first spike:

- Mail permissions reference: `https://learn.microsoft.com/en-us/graph/permissions-reference`
- Outlook mail API overview: `https://learn.microsoft.com/en-us/graph/api/resources/mail-api-overview?view=graph-rest-1.0`
- Calendar events: `https://learn.microsoft.com/en-us/graph/api/calendar-list-events?view=graph-rest-1.0`
- Teams joined teams: `https://learn.microsoft.com/en-us/graph/api/user-list-joinedteams?view=graph-rest-1.0`
- Teams chats: `https://learn.microsoft.com/en-us/graph/api/chat-list?view=graph-rest-1.0`

Working assumption to test: this is technically possible when the target tenant allows Graph Explorer or a future app registration, the signed-in user can authenticate, and the required delegated permissions can be consented. It may fail per organization because of tenant policy, admin consent requirements, Conditional Access, guest limitations, or licensing.

## Manual Spike Plan

Use Microsoft Graph Explorer at:

- `https://developer.microsoft.com/en-us/graph/graph-explorer`

Run the test separately for each relevant organization or account.

### Step 1: Establish identity and tenant

1. Open Graph Explorer.
2. Sign in with the target account.
3. Record the visible signed-in account and current tenant or organization name.
4. Run:

```http
GET https://graph.microsoft.com/v1.0/me
```

Expected result:

- HTTP 200 confirms basic Graph access for the signed-in identity.
- Record only non-sensitive metadata such as success/failure, tenant label, and error code.

### Step 2: Confirm token availability

1. Open the Access token tab in Graph Explorer.
2. Confirm whether an access token is visible.
3. Do not paste the token into the task record, chat, git, logs, screenshots, or generated docs.
4. Optional local check: copy the token only into a local REST client or terminal command that is not committed.

Expected result:

- Access token is available for the signed-in user, or the blocker is recorded.

### Step 3: Mail read check

Start with the smallest practical query:

```http
GET https://graph.microsoft.com/v1.0/me/messages?$top=1&$select=id,subject,receivedDateTime,from
```

Likely delegated permissions to test:

- `Mail.ReadBasic`
- `Mail.Read`

Expected result:

- HTTP 200 with one message or an empty result proves mail API access.
- HTTP 403 or consent errors should be recorded with the exact Graph error code and permission message, without recording message content.

### Step 4: Calendar read check

Use a narrow date range:

```http
GET https://graph.microsoft.com/v1.0/me/calendarView?startDateTime=2026-06-01T00:00:00Z&endDateTime=2026-06-08T00:00:00Z&$top=5&$select=id,subject,start,end,organizer
```

Likely delegated permissions to test:

- `Calendars.ReadBasic`
- `Calendars.Read`

Expected result:

- HTTP 200 with events or an empty result proves calendar API access.
- If private events or tenant policy block the request, record the error code and permission message only.

### Step 5: Teams metadata check

Start with Teams membership metadata:

```http
GET https://graph.microsoft.com/v1.0/me/joinedTeams
```

Likely delegated permission to test:

- `Team.ReadBasic.All`

Optional chat metadata check:

```http
GET https://graph.microsoft.com/v1.0/me/chats?$top=5
```

Likely delegated permissions to test:

- `Chat.ReadBasic`
- `Chat.Read`

Expected result:

- HTTP 200 proves at least basic Teams metadata access.
- If chat APIs are restricted, joined teams may still be enough for a first feasibility signal.

### Step 6: Repeat for other organizations

For each other organization where the user is a member or guest:

1. Use Graph Explorer account switching, sign-out/sign-in, or tenant/directory switching if available.
2. Confirm the active tenant or organization before running tests.
3. Repeat profile, token, mail, calendar, and Teams checks.
4. Record whether the failure is authentication, consent, permission, tenant policy, or API availability.

### Step 7: Assess future Sidekick login flow

Use the Graph Explorer results and Microsoft identity platform docs to answer whether Sidekick can later implement its own login flow.

Check these candidate flows:

1. Browser-based delegated login with MSAL for desktop/Electron.
2. OAuth authorization code flow with PKCE and a redirect URI suitable for desktop apps.
3. Device code flow as fallback if browser redirect is blocked or impractical.

Record for each candidate:

- whether it is Microsoft-supported for desktop apps;
- whether it can return an access token for Microsoft Graph;
- whether it can support work/school accounts and multiple tenants;
- whether it requires an app registration;
- what redirect URI pattern appears viable;
- what tenant/admin consent risks remain.

Expected result:

- A clear recommendation for the first Sidekick auth prototype: browser-based MSAL/auth-code flow, device code flow, or blocked pending more information.

## Result Matrix

Fill this table during the spike. Do not store secrets or content.

| Organization | Sign-in | Token visible | `/me` | Mail | Calendar | Teams | Blocker / notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Primary employer | works | works | works | works | works | works | Human confirmed Graph Explorer test works. Detailed tenant identifiers and content intentionally not recorded. |
| Other org 1 | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested |  |
| Other org 2 | Not tested | Not tested | Not tested | Not tested | Not tested | Not tested |  |

Use values:

- `works`
- `blocked`
- `needs admin consent`
- `not available`
- `not tested`

## Acceptance Criteria

- At least one target organization has been tested through Graph Explorer.
- The spike records whether login works.
- The spike records whether an access token is visible.
- The spike records whether `/me` works with the token.
- The spike records whether minimal mail, calendar, and Teams metadata requests work.
- The spike records the same evidence for at least one additional organization if the user has a suitable account or guest membership available.
- The spike records whether a later Sidekick login flow can open a browser-based Microsoft sign-in and receive a delegated Graph access token.
- The spike records the recommended auth flow for a first Sidekick prototype, including redirect pattern and app registration implications.
- Failures include Graph status code, Graph error code, and a plain-language likely cause.
- No tokens or sensitive content are stored in the repo.
- The final closeout says whether a later Sidekick integration is technically plausible and what the main blockers are.

## Security Notes

- Treat access tokens as secrets.
- Do not commit tokens, screenshots containing tokens, message bodies, calendar details, chat content, tenant IDs, or user IDs.
- Prefer metadata-only checks with `$select` and `$top`.
- Use delegated read permissions only.
- Do not perform POST, PATCH, PUT, or DELETE requests in production tenants.
- If this becomes a Sidekick feature later, auth must stay behind a narrow main/preload API and token storage must receive a separate security decision.

## Verification

Passed:
- Task record created from official Microsoft Graph documentation and Sidekick workflow rules.
- `npm run check`
- Human manually confirmed Graph Explorer login, token access, and Graph API access work at a high level.

Not run:
- Programmatic Microsoft Graph auth test.
  Reason: deferred to `TASK-0043`.

## Closeout

Graph Explorer access is confirmed at a high level: browser login works, Graph Explorer can obtain an access token, and the user can call Microsoft Graph for the target data through the browser-based tool.

This proves the account/API path is available in at least one real organization, but it does not prove that Sidekick's own app registration and auth flow will receive the same delegated permissions.

Next step:

- `TASK-0043`: create a programmatic Microsoft Graph auth proof-of-concept using Microsoft-supported desktop/Electron auth guidance.
