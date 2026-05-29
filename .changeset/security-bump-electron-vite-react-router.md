---
"ecoindex-app": patch
---

Security bumps: electron, vite, react-router-dom

- Bump `electron` from 39.2.5 to 39.8.10 — fixes Use-after-free, Context Isolation bypass, command-line injection (CVE multiples)
- Bump `vite` from 7.2.6 to 7.3.3 — fixes `server.fs.deny` bypass, arbitrary file read via WebSocket, path traversal in optimized deps
- Bump `react-router-dom` from 7.11.0 to 7.16.0 — fixes XSS via ScrollRestoration, XSS via open redirect, CSRF in action/server action
