# LTOCM deployment

The development deployment uses versioned releases under
`/opt/lto-uars/releases`, an atomic `/opt/lto-uars/current` symlink, and a
dedicated Node.js runtime under `/opt/lto-uars/node`.

- Application port: `127.0.0.1:3003`
- Nginx proxy port: `3300`
- Service: `lto-uars.service`
- Authentication: local LTOCM accounts (`AUTH_PROVIDER=LOCAL`)
- Keycloak readiness: see `docs/keycloak-integration.md` and `deploy/uars.env.example`

After every versioned deployment, run `deploy/scripts/cleanup-storage.sh` as
root. It keeps the active release, one rollback release, and the five newest
database backups. Shared uploads are never touched.
