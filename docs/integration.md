# Host integration plan

The module follows the package contract used by bc-region and bc-customer: one Git repository contains both api and web, with independently exported package entry points.

## Backend

The backend package exposes:
- @wasnaker/module-impersonate/api
- @wasnaker/module-impersonate/api/manifest
- @wasnaker/module-impersonate/api/definition
- @wasnaker/module-impersonate/api/entities
- @wasnaker/module-impersonate/api/migrations
- @wasnaker/module-impersonate/api/seeds

The host registry discovers the package, entity, and migration. The host owns the PostgreSQL DataSource and executes migrations through its explicit migration workflow.

The host adapter must resolve active users and their current roles through UsersService, search through the host user service, validate the actor's live SessionService record, resolve a signed refresh token only when its hash matches the live session, check impersonate:start and read:impersonate against the central authorization core, and issue a short-lived access JWT using the host JWT secret/configuration. The signed token identifies the target as id and carries target roles plus actorId, actorSessionId, and impersonationId claims.

## Mandatory host auth integration

The host JWT strategy must call ImpersonateService.assertActiveToken() for every request carrying an impersonation claim. AuthService must call assertActorSessionCanRefresh() before the ordinary refresh flow so the preserved refresh token cannot silently switch the browser back to the admin identity while an impersonation record is active. The module's stop/renew routes use the refresh token only after validating its session hash and actor ownership.

The host auth provider must preserve the actor's original token pair while using the temporary subject access token. The web package exports ImpersonationBanner; the host must mount it in the authenticated global shell, not only on the module page.

## Web

The web package exports:
- @wasnaker/module-impersonate
- @wasnaker/module-impersonate/manifest
- @wasnaker/module-impersonate/locales/en
- @wasnaker/module-impersonate/locales/id

The manifest contributes the admin page/menu through the existing module registry. The UI uses the host API client and auth context; it does not access PostgreSQL or maintain a separate authentication system.

## Installation and rollout

Install from an immutable commit SHA with the host's existing module installation script. Regenerate module registries, run the explicit PostgreSQL migration, then verify permissions and the JWT hooks in an integration environment before exposing the menu. Do not install from a moving branch in production.
