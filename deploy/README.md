# UARS deployment

The development deployment uses versioned releases under
`/opt/lto-uars/releases`, an atomic `/opt/lto-uars/current` symlink, and a
dedicated Node.js runtime under `/opt/lto-uars/node`.

- Application port: `127.0.0.1:3003`
- Nginx proxy port: `3300`
- Service: `lto-uars.service`
- Current release: `v0.1.0`
