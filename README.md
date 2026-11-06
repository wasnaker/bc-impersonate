# BC Impersonate

Modular impersonation capability for the Brocoders platform. An authorized administrator can temporarily inspect the application as another user without learning, changing, or resetting that user's password.

This repository is the single source of truth for both backend and web capabilities. The host installs the package; module implementation is never copied into host repositories.

## Status

The package is being developed in incremental stages. See [Architecture](docs/architecture.md) and [Host integration](docs/integration.md) before enabling it in an environment.

## Security principles

- The administrator's authenticated session remains the actor session.
- The effective application identity is the selected target user.
- The original actor identity is preserved in a signed impersonation context and an immutable audit record.
- Authorization is evaluated using the target user's current roles and permissions.
- Impersonation is visibly indicated in the UI and can be ended explicitly.
- Impersonation tokens cannot be refreshed into ordinary user sessions.
- Passwords, password hashes, and user credentials are never read or modified by this module.

## Package layout

- `api/`: NestJS module, PostgreSQL entities/migrations, permission manifest and host adapter contract.
- `web/`: Next.js module manifest, administrator UI, session indicator and localization.
- `docs/`: security model and integration requirements.
