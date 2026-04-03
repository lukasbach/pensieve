---
description: "Use when adding or changing Electron domain modules, IPC APIs, or query invalidation in Pensieve. Covers main and renderer boundaries, typed IPC wrappers, and QueryKeys usage."
---

# Pensieve Electron Architecture

- Prefer keeping business logic in `src/main/domain/*` as named exports, and re-export domain modules from `src/main/domain/index.ts` when they become part of the shared main-process surface.
- Prefer defining each IPC surface as one exported object literal such as `const historyApi = { ... }` in `src/main/ipc/*-api.ts` instead of exporting unrelated standalone handlers.
- When a new main-process IPC method is exposed, mirror it in `src/renderer/api.ts` with `createRendererIpc<typeof backendApi>("channel")` so renderer callers stay type-safe.
- Add new cache or invalidation keys to `src/query-keys.ts` instead of introducing inline string keys in renderer or main code.
- Keep renderer code talking to main-process capabilities through the typed IPC wrappers instead of importing main-process modules directly.

```ts
export const historyApi = {
  openRecording: history.openRecording,
};

import type { historyApi as historyApiBackend } from "../main/ipc/history-api";

export const historyApi =
  createRendererIpc<typeof historyApiBackend>("history");
```
