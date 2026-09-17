# Medora — frontend

Angular 20 single-page application for the Medical Consultation Manager. It talks to the
Spring Boot API documented in the [root README](../README.md), which covers the architecture,
endpoints, configuration and how to run the full stack.

```bash
npm install
npm start     # http://localhost:4200 — expects the API on http://localhost:8787
npm run build
```

The API base URL lives in `src/app/core/api-url.ts`.
