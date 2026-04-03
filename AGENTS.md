# Pensieve Guidelines

## Project Layout

- Pensieve is an Electron + Vite + React desktop app for local-only recording, transcription, and summarization.
- Keep main-process code in `src/main`, renderer UI in `src/renderer`, and shared types or helpers in the root `src/*.ts` files.
- `src/main/domain` contains business logic, `src/main/ipc` exposes typed IPC surfaces, and `src/renderer/api.ts` is the renderer entrypoint for main-process capabilities.
- `docs/` contains documentation sources and `specs/` contains feature or product specs.

## Build And Validation

- Use Yarn from the repository root.
- Common commands:
  - `yarn typecheck`
  - `yarn test`
  - `yarn test:coverage`
  - `yarn lint`
  - `yarn lint:fix`
- Run the narrowest relevant validation after changes, and prefer `yarn test` plus `yarn typecheck` for cross-cutting changes.

## Architecture

- Keep business logic in `src/main/domain/*` and keep IPC files in `src/main/ipc/*-api.ts` thin.
- Define each IPC surface as one exported object literal and mirror new channels in `src/renderer/api.ts` with `createRendererIpc<typeof backendApi>("channel")`.
- Add new cache or invalidation keys to `src/query-keys.ts` instead of introducing inline strings in renderer or main code.
- Keep renderer code behind the typed IPC wrappers rather than importing main-process modules directly.
- When extending recorder state shared across windows, follow the Zustand plus `recorderIpcApi.setState(...)` synchronization pattern in `src/renderer/recorder/state.ts`.

## Conventions

- Follow `.github/instructions/electron-architecture.instructions.md` for deeper main and renderer boundary guidance.
- Follow `.github/instructions/vitest-mocking.instructions.md` for colocated spec files, `vi.hoisted(...)`, and module-reset patterns.
- Keep tests next to the implementation as `*.spec.ts` or `*.spec.tsx`.
- Match existing patterns in neighboring files before introducing new abstractions, directories, or naming schemes.
