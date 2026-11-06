# Host integration plan

The module follows the package contract used by `bc-region` and `bc-customer`: one Git repository contains both `api` and `web`, with independently exported package entry points.

## Backend

The backend package exposes:
- `@wasnaker/module-impersonate/api`
- `@wasnaker/module-impersonate/api/manifest`
- `@wasnaker/module-impersonate/api/definition`
- `@wasnaker/module-impersonate/api/entities`
- `@wasnaker/module-impersonate/api/migrations`
- `@wasnaker/module-impersonate/api/seeds`

The host's generated backend module registry discovers the package and owns the PostgreSQL DataSource and migration lifecycle. The module must not create a second database connection or maintain its own users, roles, or permissions tables.

The module declares permissions in its manifest and delegates permission decisions to the central authorization core. Proposed permissions:
- `read:impersonate`: view the impersonation interface and current status.
- `impersonate:start`: start impersonation.
- `impersonate:stop`: stop an active impersonation (actor-owned records only).

## Required host authentication adapter

The host must expose a typed adapter to the module with operations equivalent to:
- validate the actor's active session;
- resolve an active target user and current role IDs;
- check the actor's `impersonate:start` permission;
- issue a short-lived access token with subject ID, target role IDs, actor ID, impersonation record ID, and actor session ID;
- reject refresh for impersonation access tokens;
- validate the active impersonation record during JWT strategy validation on every request.

The precise interface will be finalized against the host's current auth/session implementation before the API package is enabled. Do not duplicate host auth logic inside this module.

## Web

The web package exports:
- `@wasnaker/module-impersonate`
- `@wasnaker/module-impersonate/manifest`
- `@wasnaker/module-impersonate/locales/<language>`

The manifest contributes the admin page/menu through the existing module registry. The UI uses the host API client and auth context; it does not access PostgreSQL or maintain a separate authentication system.

## Installation

After backend and frontend integration are complete and verified, install the package from an immutable commit SHA using the existing module installation scripts. Do not install from a moving branch in production.
