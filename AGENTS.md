# Agent notes

## Testing

- **One test per file**, and name the file after what it verifies (kebab-case).
- Node tests in `tests/` run with `bun test` (scoped there via `bunfig.toml`
  `[test].root`). Browser tests in `browser-tests/` run with
  `bun run test:playwright` and are kept out of `tests/` so `bun test` never
  runs them.
- A browser test loads a harness page that writes `Success:`/`Fail:` into
  `#output`; the `.test.ts` asserts on that text. Playwright serves these via
  the app's Vite dev server (`bun run dev`) — needed so resvg-wasm's `?url`
  wasm import resolves.

## PDF generation (`lib/pdfgen`)

- Pages are drawn with `pdf-lib`; SVGs are rasterized with **`@resvg/resvg-wasm`**
  (not `@resvg/resvg-js`, which is native and breaks the browser bundle).
- resvg-wasm needs a one-time `initWasm` and has no system fonts:
  browser auto-inits from the `?url` wasm asset; Node/tests call
  `initResvgWasm(bytes)` first. Text requires the bundled font
  (`lib/pdfgen/assets/liberation-sans-font.ts`).
- Regenerate PDF snapshots with
  `FORCE_BUN_UPDATE_SNAPSHOTS=1 bun test tests/pdfgen/example01.test.ts`, then
  eyeball the PNGs — passing only proves determinism, not correctness.
