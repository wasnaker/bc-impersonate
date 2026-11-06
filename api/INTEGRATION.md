# Backend package integration

Install this module as an immutable Git dependency using the same package workflow as other Brocoders modules.

## Exports

- `@wasnaker/module-impersonate/api`
- `@wasnaker/module-impersonate/api/manifest`
- `@wasnaker/module-impersonate/api/definition`
- `@wasnaker/module-impersonate/api/entities`
- `@wasnaker/module-impersonate/api/migrations`
- `@wasnaker/module-impersonate/api/seeds`

The host registry discovers the module, entities, and migration. The host owns the PostgreSQL DataSource and executes migrations through its explicit migration workflow.

## Register the module

Use the host's registerAsync module definition and inject adapters from the host user, session, and authorization services. The adapter must resolve active users and their current roles through the host user service; search users through the host user service; validate the actor's live session; check impersonate:start and read:impersonate against the central authorization core; and issue a short-lived access JWT using the host JWT secret/configuration, with subject ID and target role IDs plus signed actorId, actorSessionId, and impersonationId claims.

Do not use a separate JWT secret or query host user/role tables directly from the module.

## Mandatory host auth integration before enabling

The existing host JWT strategy must become asynchronous for impersonation claims and call the exported ImpersonateService.assertActiveToken() on every authenticated request. The host must also reject refresh-token exchange for impersonation access tokens. Without these changes, revoking an impersonation could leave a still-valid token usable against unrelated host endpoints.

The host auth provider must preserve the actor's original token pair while using the temporary subject access token. The web package exports an ImpersonationBanner that the host must mount in its authenticated global shell, not only on the module page.

Until both hooks are implemented and covered by integration tests, do not expose the module to production users.
