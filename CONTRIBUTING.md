# Contributing to Ambient Atlas

Ambient Atlas is a serious, openly-sourced scientific visualization of ambient
environmental-health exposures. Contributions are welcome, accuracy and
restraint matter more than volume.

## Setup

Requirements: Node 22+ (the data scripts use native TypeScript stripping) and
[pnpm](https://pnpm.io/) 9+.

```bash
pnpm install
pnpm dev          # local dev server
```

## Quality gates (must pass before a PR is merged)

CI runs these on every push and pull request; please run them locally first:

```bash
pnpm check        # svelte-check: type + accessibility + style. MUST be 0 errors / 0 warnings.
pnpm build        # production build. MUST succeed.
```

The `pnpm check` result is the project's style and quality gate. Keep it at
**0 errors and 0 warnings**, do not merge regressions.

## Contributing data (exposure zones)

Zones live in `src/lib/data/zones/zones.ts` and follow the `Zone` schema in
`src/lib/data/zones/types.ts`. When adding a zone:

- Use **accurate coordinates** for the real site.
- Every zone needs at least one **real, verifiable citation** (peer-reviewed
  paper, official agency report, or equivalent) with a working URL. Do not
  invent sources or DOIs; if you cannot verify it, leave it out.
- Set `tier`/`category`, `severity` (1–5) and `certainty` honestly; prefer the
  conservative reading of the evidence.
- Run the citation check before submitting:

```bash
pnpm check:citations
```

## Code style

- Match the conventions of the surrounding file (Svelte 5 runes, TypeScript).
- Reuse shared components and state; avoid duplicating logic or one-off
  components when an existing one fits.
- Write user-facing text plainly. Do **not** use em dashes; use commas,
  colons, or separate sentences.

## Pull requests

1. Branch from `main`.
2. Keep the change focused and describe what it does and why.
3. Make sure `pnpm check` and `pnpm build` are green (CI enforces this).

By contributing you agree your contribution is your own work and may be
distributed under the project's license.
