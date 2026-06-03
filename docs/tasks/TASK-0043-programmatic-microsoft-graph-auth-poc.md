# Task: Programmatic Microsoft Graph auth POC

ID: TASK-0043
Status: Planned
Class: Major
Owner: Pair
Created: 2026-06-03
Updated: 2026-06-03
Branch: task/TASK-0043-programmatic-microsoft-graph-auth-poc
Worktree: ../Sidekick-worktrees/TASK-0043-programmatic-microsoft-graph-auth-poc
Base branch: origin/main
Write scope:
- `docs/tasks/TASK-0043-programmatic-microsoft-graph-auth-poc.md`
- possible throwaway local POC outside committed Sidekick runtime code
Parallel safety: Coordinate

## Summary

Build or run a minimal programmatic proof-of-concept that signs in with Microsoft identity platform, obtains a delegated Microsoft Graph access token, and calls the same basic Graph endpoints that worked in Graph Explorer.

This is still a spike. It should not add a permanent Sidekick product feature yet.

## Background

`TASK-0042` confirmed that Graph Explorer works at a high level: browser login works, Graph Explorer can show an access token, and Microsoft Graph calls for the target data can run through the browser-based tool.

The remaining question is whether Sidekick can do the same programmatically with its own app registration and a Microsoft-supported desktop authentication flow.

Official Microsoft docs identify a direct path for this:

- Electron desktop apps can sign in users and call Microsoft Graph using MSAL Node and authorization code flow with PKCE.
- The Electron tutorial uses an app registration, `http://localhost` redirect URI, MSAL Node, and Microsoft Graph calls.
- Microsoft desktop app configuration also documents redirect URI patterns for system browser, embedded browser, and Node.js Electron apps.

References:

- `https://learn.microsoft.com/en-us/entra/identity-platform/tutorial-v2-nodejs-desktop`
- `https://learn.microsoft.com/en-us/entra/identity-platform/index-desktop`
- `https://learn.microsoft.com/en-us/entra/identity-platform/scenario-desktop-app-configuration`
- `https://learn.microsoft.com/en-us/entra/identity-platform/app-sign-in-flow`
- `https://learn.microsoft.com/en-us/entra/identity-platform/authentication-flows-app-scenarios`

## Goal

Prove or disprove that a Sidekick-like desktop flow can:

- open Microsoft sign-in through a browser or Microsoft-supported desktop auth flow;
- authenticate a work/school user;
- obtain a delegated Microsoft Graph access token programmatically;
- call `GET /me`;
- call one minimal mail query;
- call one minimal calendar query;
- call one minimal Teams metadata query;
- repeat against another organization or tenant if available.

## Non-goals

- Do not add permanent Sidekick UI.
- Do not merge a full Microsoft Graph integration into `src/`.
- Do not store tokens in the repo.
- Do not design final token persistence.
- Do not request write permissions.
- Do not read or persist message bodies, calendar bodies, chat messages, or Teams content.
- Do not solve final multi-tenant UX.

## Recommended Approach

Start with a throwaway POC based on Microsoft's Electron + MSAL Node guidance.

Preferred first path:

1. Create or use a Microsoft Entra app registration.
2. Configure it as a public client/native desktop app.
3. Add a desktop redirect URI, starting with `http://localhost` if suitable for the MSAL Node/Electron sample.
4. Request delegated read scopes only.
5. Use MSAL Node to trigger interactive login and token acquisition.
6. Call Graph with the returned token.

Fallback path:

- If browser redirect or tenant policy blocks interactive auth, test device code flow.

## App Registration Questions

Record these during the spike:

- Who owns the app registration: personal developer tenant, employer tenant, or test tenant?
- Is the app single-tenant or multi-tenant?
- Which account types are allowed?
- Which redirect URI is configured?
- Are public client flows enabled if required?
- Which delegated scopes are requested?
- Which scopes require admin consent in the tested tenants?
- Can the same app registration be used for guest/member access in other organizations?

## Candidate Scopes

Start with least privilege and add only when the endpoint requires it:

- `User.Read`
- `Mail.ReadBasic` or `Mail.Read`
- `Calendars.ReadBasic` or `Calendars.Read`
- `Team.ReadBasic.All`
- `Chat.ReadBasic` only if chat metadata is part of the POC

Do not request write scopes.

## Minimal Graph Calls

Profile:

```http
GET https://graph.microsoft.com/v1.0/me
```

Mail:

```http
GET https://graph.microsoft.com/v1.0/me/messages?$top=1&$select=id,subject,receivedDateTime,from
```

Calendar:

```http
GET https://graph.microsoft.com/v1.0/me/calendarView?startDateTime=2026-06-01T00:00:00Z&endDateTime=2026-06-08T00:00:00Z&$top=5&$select=id,subject,start,end,organizer
```

Teams:

```http
GET https://graph.microsoft.com/v1.0/me/joinedTeams
```

Optional chat metadata:

```http
GET https://graph.microsoft.com/v1.0/me/chats?$top=5
```

## Result Matrix

Do not store tokens or sensitive content.

| Test | Result | Notes |
| --- | --- | --- |
| App registration created or selected | Not tested |  |
| Redirect URI works | Not tested |  |
| Browser opens for login | Not tested |  |
| Login succeeds | Not tested |  |
| Delegated token acquired | Not tested |  |
| `/me` works | Not tested |  |
| Mail query works | Not tested |  |
| Calendar query works | Not tested |  |
| Teams query works | Not tested |  |
| Other org or tenant works | Not tested |  |

Use values:

- `works`
- `blocked`
- `needs admin consent`
- `not available`
- `not tested`

## Acceptance Criteria

- A Microsoft-supported desktop auth flow has been tested programmatically.
- The spike records whether browser-based login opens successfully.
- The spike records whether the redirect/token acquisition succeeds.
- The spike records whether a delegated Graph token is obtained.
- The spike records whether `/me`, mail, calendar, and Teams metadata calls work.
- The spike records whether admin consent or tenant policy blocks any scope.
- The spike records whether another organization or tenant can be tested with the same or adjusted auth setup.
- The spike recommends one of:
  - proceed with Sidekick integration design using MSAL Node/Electron;
  - proceed with device code flow prototype;
  - blocked pending app registration, admin consent, tenant policy, or a different architecture.

## Security Notes

- Treat client IDs, tenant IDs, and redirect URIs as configuration, but treat tokens as secrets.
- Do not commit access tokens, refresh tokens, authorization codes, account identifiers, message content, calendar content, chat content, or screenshots containing sensitive data.
- Keep the POC read-only.
- Keep token handling in a process equivalent to Electron main, not renderer.
- If this becomes a product feature, create a separate decision record for auth architecture, token storage, tenant selection, consent, and data minimization.

## Verification

Passed:
- Task record created from Sidekick workflow rules and official Microsoft identity platform documentation.
- `npm run check`

Not run:
- Programmatic POC.
  Reason: requires Microsoft Entra app registration, browser login, and human account consent.

## Closeout

Pending programmatic spike execution.
