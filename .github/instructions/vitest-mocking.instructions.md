---
description: "Use when writing or updating Vitest tests in Pensieve. Covers vi.hoisted mock setup, module reset patterns, and colocated spec files."
applyTo: "**/*.spec.ts,**/*.spec.tsx,**/*.test.ts,**/*.test.tsx"
---

# Pensieve Vitest Mocking

- Prefer keeping tests next to the implementation as `file.spec.ts` or `file.spec.tsx`.
- When a `vi.mock(...)` factory needs shared mock functions, prefer declaring them in a single `vi.hoisted(() => ({ ... }))` block before the mocks.
- If the test imports the module under test after mock setup, prefer calling `vi.resetModules()` in `beforeEach()` and importing the module inside the test or setup step.
- Reset or clear every hoisted mock in `beforeEach()` before assigning return values for the current case.
- Match the existing patterns in `src/main/domain/*.spec.ts` and `src/renderer/*.spec.ts` before introducing a different mocking style.

```ts
const { getSettingsMock } = vi.hoisted(() => ({
  getSettingsMock: vi.fn(),
}));

vi.mock("./settings", () => ({
  getSettings: getSettingsMock,
}));

beforeEach(() => {
  vi.resetModules();
  getSettingsMock.mockReset();
});
```
