# Architecture and security model

## User story

An administrator with the dedicated `impersonate:start` permission selects an existing user and starts a temporary session as that user. Requests made during this period must be authorized as the target user. The administrator can end the session and resume the original session.

This is a support and development/testing capability. It is not a password-reset mechanism and must not expose credentials.

## Identity model

Every impersonation has two distinct identities:

- **Actor**: the administrator who initiated the action.
- **Subject**: the user whose application identity is being assumed.

The request's effective `user.id` and role claims must identify the subject so existing application endpoints and menu permission checks behave exactly as they do for that user. The signed access token must additionally carry an unforgeable impersonation reference and actor ID. Never trust actor/subject IDs supplied by the browser without validating the signed token and active database record.

The actor's original access and refresh credentials remain in the browser's protected auth state. The impersonation access token is temporary and must not replace or overwrite the actor's refresh token.

## Authorization

- Starting impersonation requires the actor to be authenticated, active, and authorized by the host authorization core.
- A user cannot impersonate themselves.
- A target must exist and be eligible for impersonation; deleted, blocked, or otherwise inactive accounts are rejected.
- The effective role and permission set is the target's current set, not the actor's.
- The module does not grant extra roles or bypass module/tenant/scope authorization.
- Stop requires a valid actor session; the subject cannot stop or extend the actor's impersonation on the actor's behalf.
- Only the actor who started a record, or a separately authorized security administrator, may terminate it.

## Session lifecycle

1. Actor submits target user ID and optional reason.
2. API validates actor authorization and actor session, resolves the target and its current roles, creates an audit record, then issues a short-lived access token.
3. Every request using that token must be rejected if its impersonation record is inactive, expired, or revoked. This requires a host JWT validation hook; a standalone module route guard alone cannot protect unrelated host endpoints.
4. Ordinary refresh-token exchange while impersonating is rejected. The two lifecycle endpoints (renew and stop) accept the preserved actor refresh token only after validating its session hash and ownership; they do not rotate that token. The browser retains the actor's original credentials and uses them to resume the original session after stop.
5. Stop marks the record ended/revoked and returns the actor's original session context. The browser restores the original actor credentials.

## Audit trail

The PostgreSQL audit record should include actor user ID, target user ID, actor session ID, start/end timestamps, status, optional reason, and termination metadata. Audit rows are append-only from the application's perspective. Do not store access tokens, refresh tokens, passwords, or other secrets in the audit table.

Record start and stop events. Failed attempts may be recorded separately if the host audit policy supports it. Log target identity and actor identity without logging bearer tokens.

## UI requirements

- Provide a searchable target-user picker that uses the host user API.
- Show a persistent, high-visibility impersonation banner containing the target identity and an explicit "Stop impersonating" action.
- Never hide the banner on navigation or refresh while the impersonation token is active.
- Do not offer the impersonation UI to users lacking the start permission.
- Avoid presenting destructive account/security actions as if they belonged to the actor; the API must enforce restrictions regardless of UI.

## Host boundary

The host owns authentication, JWT verification, user/role persistence, authorization, and the PostgreSQL DataSource. The module owns its audit entity, migration, API endpoints, UI, and manifest.

A module cannot safely impersonate a user merely by signing a token with an arbitrary secret or changing frontend user state. Host integration must explicitly provide:
- actor/session validation;
- current target-user and role resolution;
- a token-issuance hook that uses the host JWT configuration and preserves the signed actor/subject claims;
- a JWT strategy validation hook that checks the active impersonation record on every request;
- refresh-token rejection for impersonation tokens;
- permission checks backed by the central authorization core.

Until those hooks are integrated and tested in the host, the feature must remain disabled.
