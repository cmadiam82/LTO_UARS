# Keycloak integration readiness

UARS continues to use local accounts. `AUTH_PROVIDER=LOCAL` is the safe default; setting it to `KEYCLOAK` currently disables the local login endpoint with a clear service error rather than starting an incomplete authentication flow.

## Prepared foundations

- Users can be identified by the immutable OpenID Connect pair `external_issuer` + `external_subject`.
- Local password hashes are optional only for `KEYCLOAK` identities; database checks enforce valid identity records.
- `uars.identity_role_mappings` maps Keycloak roles to existing UARS workflow roles.
- Runtime readiness validates issuer URL, client ID, client secret, redirect URI, scopes, and role-claim configuration without exposing the client secret.
- System Administrators can see Keycloak readiness under System Settings.

## Future implementation checklist

1. Register a confidential Keycloak client using Authorization Code flow with PKCE.
2. Add login, callback, and logout endpoints with state, nonce, PKCE verifier, and short-lived secure cookies.
3. Discover endpoints from the issuer and validate signatures through the realm JWKS; validate issuer, audience, expiry, nonce, and authorized party.
4. Provision or update users by issuer + subject. Never link accounts by email alone.
5. Resolve Keycloak roles through `uars.identity_role_mappings`; reject users without one unambiguous active UARS role.
6. Preserve local `SYSTEM_ADMIN` break-glass access until Keycloak production sign-in and rollback are tested.
7. Revoke UARS sessions on Keycloak logout and support back-channel logout before final cutover.
8. Switch `AUTH_PROVIDER` only during an approved maintenance window after end-to-end testing.

Required environment keys are documented in `deploy/uars.env.example`. Secrets belong only in `/etc/lto-uars/uars.env`, never in source control.
