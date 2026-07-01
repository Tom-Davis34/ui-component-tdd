# Playwright renderer for ui-component-tdd — Design

Status: approved (brainstorming), not yet planned/implemented.

## Problem

`ui-component-tdd` today assumes Storybook for two of its seven phases: **PREVIEW**
(phase 6, writing `.stories.tsx`) and **GATE 2 — fidelity review** (phase 7,
comparing rendered stories to mockups via Storybook + the `@storybook/addon-mcp`
structural API, plus Playwright for screenshots). Repos that don't use Storybook
have no way to get the same design-first workflow.

## Goal

Let a consumer repo opt into a **Playwright-only renderer** for phases 6–7 —
same spec/mockup/Gate-1/RED/GREEN/REFACTOR phases, no Storybook dependency —
selected via config, coexisting with the existing Storybook renderer (not
replacing it). A team can pick either renderer per repo; this design does not
support mixing renderers within a single repo/component.

## Why a harness route, not Playwright Component Testing

Two candidate mechanisms were considered for rendering an isolated component
state without Storybook:

- **Playwright Component Testing** (`@playwright/experimental-ct-react` et al.)
  mounts a component inside a single test function's scope. There is no
  persistent, stable URL to point things at afterward — mounting and asserting
  happen in the same test. This breaks the pattern Gate 2 relies on today: an
  independent subagent drives a browser against an *already-rendered, stable*
  target, live, whenever it wants. Reproducing that with CT would require the
  subagent to author a throwaway test file, run it, then parse screenshot
  artifacts from disk — a different and more brittle tool-use shape than
  "navigate and look." The package is also still labeled experimental and is
  framework-specific.
- **A dedicated harness route** (`<harnessUrl>/__harness/<Component>/<state-id>`)
  served by the app's own dev server preserves Storybook's actual architectural
  contribution — a stable URL per state — without Storybook itself. It also
  drops a dependency Storybook needed: `@storybook/addon-mcp` was only required
  to expose structural queries over MCP. A harness route needs no such addon —
  generic Playwright browser automation (accessibility snapshot / role queries)
  already works against any live page, so structural and visual checks both
  come from the one tool the plugin already assumes the fidelity subagent has.

**Decision: harness route.** The cost is that the plugin must ship a reference
scaffold for it, since a repo skipping Storybook won't have an equivalent
already.

## Why extend this repo, not a new one

Three structures were considered:

1. **Extend this repo**: add two Playwright-specific skills, reuse
   `writing-component-specs`, `writing-component-mockups`, and
   `reviewing-component-design` completely unchanged, gate phases 6–7 on a new
   `renderer` config key.
2. **New standalone plugin repo**: duplicate the three shared skills into a
   second repo alongside new Playwright-only STORIES/GATE2 skills.
3. **Same repo, renamed for symmetry**: same as (1), plus renaming
   `comparing-mockups-to-storybook` → `fidelity-storybook` so the Storybook and
   Playwright fidelity skills read as an obvious pair.

**Decision: (1) combined with (3).** Phases 1–5 (AUTHOR, GATE 1, RED, GREEN,
REFACTOR) are 100% renderer-agnostic already — specs and mockups don't
reference Storybook or Playwright at all. Option 2's duplication of those three
skill files would need permanent manual sync (a wording fix to Gate 1's audit
checklist would have to land in two repos), and a team wanting Storybook on
some components and Playwright on others would need two plugins installed with
colliding command names (`/ui-tdd` in both). The rename in (3) costs one-time
mechanical work (folder rename + cross-references) in exchange for the pairing
being structurally obvious, which matters once there are two fidelity skills
side by side.

## Config contract changes

`.claude/ui-component-tdd.json` gains a `renderer` key
(`"storybook" | "playwright"`) that gates which other keys are required.
`componentsDir`, `tokensStylesheet`, `testCommand`, and `typecheckCommand`
remain required unconditionally.

**`renderer: "storybook"`** (unchanged from today):
```json
{
  "componentsDir": "src/components",
  "tokensStylesheet": "src/styles/tokens.css",
  "testCommand": "npm test",
  "typecheckCommand": "npm run typecheck",
  "renderer": "storybook",
  "storybookCommand": "npm run storybook",
  "storybookUrl": "http://localhost:6006",
  "storybookMcpUrl": "http://localhost:6006/mcp"
}
```

**`renderer: "playwright"`** (new):
```json
{
  "componentsDir": "src/components",
  "tokensStylesheet": "src/styles/tokens.css",
  "testCommand": "npm test",
  "typecheckCommand": "npm run typecheck",
  "renderer": "playwright",
  "harnessCommand": "npm run dev",
  "harnessUrl": "http://localhost:5173"
}
```

Notably, the Playwright path needs no MCP endpoint at all — see "Why a harness
route" above. Every skill's existing "Configuration" section (currently an
identical block repeated in all four skills plus the command) must be updated
to read `renderer` first, then validate only the keys that renderer requires,
and STOP with the same "create this file" guidance as today if the config or
any renderer-required key is missing.

## File/folder changes

- Rename `skills/comparing-mockups-to-storybook/` → `skills/fidelity-storybook/`
  — folder, `name:` frontmatter, and every cross-reference in README.md and
  `commands/ui-tdd.md`. Content (SKILL.md, fidelity-reviewer.md) is otherwise
  unchanged.
- New `skills/fidelity-playwright/` — `SKILL.md` + `fidelity-reviewer.md`, same
  shape as `fidelity-storybook`, used for Gate 2 when `renderer: "playwright"`.
- New `skills/writing-component-playwright-harness/` — a full skill (not just
  inline command text, because unlike Storybook there's a real artifact to
  teach). Ships:
  - a reference harness-route template (Vite + React Router, the most common
    modern React setup) that the skill copies in **once per project** if it
    doesn't already exist, with an explicit note that other bundlers/routers
    (webpack `require.context`, Next.js file-based routing) need an equivalent
    substitution — this template is a skeleton to adapt, not drop-in code, the
    same relationship `mockup-template.html` has to real mockups.
  - a per-component fixture template (`<Component>.harness.tsx`, a state-id →
    rendered-JSX map) analogous to `spec-template.md` / `mockup-template.html`.

Per-component folder layout becomes renderer-conditional:
```
Button/
  Button.spec.md
  Button.test.tsx
  Button.tsx
  Button.module.css
  Button.stories.tsx     # renderer: storybook
  Button.harness.tsx     # renderer: playwright
  index.ts
  mockups/
    default.html
    ...
```

## Command changes (`commands/ui-tdd.md`)

Phase 6 is renamed from **STORIES** to **PREVIEW** (renderer-neutral name) and
branches on `renderer`:
- `storybook` → unchanged: write `<Component>.stories.tsx`, one story per
  state id.
- `playwright` → use `/ui-component-tdd:writing-component-playwright-harness`:
  scaffold the project-wide harness route if missing, then write
  `<Component>.harness.tsx`, one entry per state id.

Phase 7 (**GATE 2**) dispatches `/ui-component-tdd:fidelity-storybook` or
`/ui-component-tdd:fidelity-playwright` depending on `renderer`.

Phases 1–5 get no behavioral changes — only their shared "Configuration"
boilerplate is updated to the new conditional-key validation described above.

## Fidelity-playwright mechanics

Harness route convention: `<harnessUrl>/__harness/<Component>/<state-id>` — a
single dev-only route, scaffolded once per project, that looks up
`<Component>.harness.tsx` and renders the JSX for the requested state.

`skills/fidelity-playwright/fidelity-reviewer.md` mirrors
`fidelity-storybook/fidelity-reviewer.md`, per state id:
1. **Structural** — navigate directly to
   `<harnessUrl>/__harness/<Component>/<id>`; use Playwright's accessibility
   snapshot / role queries (no MCP endpoint) against the mockup's DOM.
2. **Visual** — screenshot that same URL and the mockup file (`file://`) at a
   matching viewport; same drift-only bar as today.

Output shape is unchanged: `| state | structure | visual | notes |` table,
ending `VERDICT: MATCH | MISMATCH`.

## Docs to update

- **README.md** §3 (config): document `renderer` and both conditional key
  sets, with a worked example per renderer.
- **README.md** §4 (prerequisites): split by renderer — Storybook +
  `@storybook/addon-mcp` only for `renderer: "storybook"`; for
  `renderer: "playwright"`, add "a harness route in your app (template
  provided, adapt to your bundler)" as a new prerequisite. Vitest + Testing
  Library and Playwright remain required either way; Playwright now also does
  structural checks (not just visual) on the playwright-renderer path.
- **README.md** §5 (phase table): phase 6 renamed **PREVIEW**, both rows
  described conditionally on renderer.
- **README.md** §6 (skills/command table): add `fidelity-playwright` and
  `writing-component-playwright-harness` rows; rename
  `comparing-mockups-to-storybook` → `fidelity-storybook`.
- **README.md** §7 (worked example): left as-is (Storybook-flavored); not
  duplicating the full walkthrough for the Playwright renderer.
- **CHANGELOG.md**: one "Unreleased" bullet for the addition.
- **`.claude-plugin/plugin.json`**: add `"playwright"` to `keywords` (already
  has `"storybook"`, `"testing"`).

## Validation strategy

This repo has no application code or automated test suite — it's prompts —
so "testing" here means a manual dry run, not a test command:

1. Re-read every edited file for internal consistency (config keys referenced
   match the schema; the renamed skill is referenced consistently across
   README, the command, and CHANGELOG).
2. Dry-run the **Storybook** path end-to-end on a trivial component first,
   since editing the shared config-boilerplate across four-plus skill files is
   the highest-risk change here — confirm no regression from the
   rename/refactor.
3. Dry-run the **Playwright** path end-to-end on a trivial component in a
   scratch Vite + React app: confirm config validation correctly requires
   `harnessCommand`/`harnessUrl` (and not the Storybook keys), the harness
   route scaffolds and actually renders a state, and the `fidelity-playwright`
   subagent produces a sensible verdict table against it.

## Explicit non-goals

- Mixing renderers within a single repo or per-component.
- A plugin-wide "renderer registry" abstraction for hypothetical future
  renderers (e.g. Ladle, Chromatic) beyond the two-folder naming convention
  established here.
- Support for non-React frameworks in the harness template (the plugin is
  already React-scoped per its existing README).
