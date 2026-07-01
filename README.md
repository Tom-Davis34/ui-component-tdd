# ui-component-tdd

A Claude Code plugin that enforces a **design-first TDD workflow** for React UI components. You write a spec and static mockups before any code, a design-review gate keeps you honest before you write tests, and a fidelity gate confirms the rendered component matches its mockups before you call it done.

---

## 1. What it is

`ui-component-tdd` adds six skills and one command to Claude Code — two of
the skills are a renderer-specific pair (Storybook or Playwright) selected
via config for the PREVIEW phase and Gate 2. Together they structure the
full component lifecycle into seven ordered phases with two mandatory human
sign-off gates: **Gate 1** (design review — before any test or production
code) and **Gate 2** (fidelity — before done). Skipping a gate or reordering
the phases is explicitly rejected by the skills.

---

## 2. Install

Run these two commands inside Claude Code (in any repo or globally):

```
/plugin marketplace add Tom-Davis34/ui-component-tdd
/plugin install ui-component-tdd@tomdavis
```

**Scope notes:**
- **User scope** (default): the plugin is available globally across all repos on this machine.
- **Project scope**: to commit the plugin to a repo so every team member gets it, add `ui-component-tdd@tomdavis` to `.claude/settings.json` under `plugins` and commit the file.

---

## 3. Per-repo config

Each repo that uses the plugin must have a config file at
`.claude/ui-component-tdd.json` in the repo root. `componentsDir`,
`tokensStylesheet`, `testCommand`, `typecheckCommand`, and `renderer` are
always required. `renderer` selects which other keys are required.

| Key | Purpose |
|-----|---------|
| `componentsDir` | Root folder for components (relative to repo root) |
| `tokensStylesheet` | CSS file that exports design tokens (`var(--…)`), linked by mockups |
| `testCommand` | Command that runs the component test suite |
| `typecheckCommand` | Command that runs the TypeScript type-check |
| `renderer` | `"storybook"` or `"playwright"` — selects the Gate 2 mechanism |
| `storybookCommand` *(storybook only)* | Command that starts Storybook |
| `storybookUrl` *(storybook only)* | URL where Storybook is served (used to poll readiness) |
| `storybookMcpUrl` *(storybook only)* | URL of the Storybook MCP endpoint (for structural fidelity checks) |
| `harnessCommand` *(playwright only)* | Command that starts the app's dev server (serves the harness route) |
| `harnessUrl` *(playwright only)* | URL where the harness route is served (used to poll readiness and to render states) |

**Worked example — `renderer: "storybook"`** (generic npm-based React project):

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

**Worked example — `renderer: "playwright"`** (no Storybook dependency):

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

If this file is missing, or any key required by your chosen `renderer` is
absent, every skill and the `/ui-tdd` command will stop immediately and ask
you to create it before proceeding.

---

## 4. Prerequisites

The plugin does **not** install these — set them up in your repo before using the plugin:

- **[Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/)** — for the unit/interaction tests written in the RED phase.
- **[Playwright](https://playwright.dev/)** — used by the fidelity reviewer for visual comparison against mockups on both renderers, and for structural checks too when `renderer: "playwright"`.

**If `renderer: "storybook"`:**
- **[Storybook](https://storybook.js.org/) with [`@storybook/addon-mcp`](https://www.npmjs.com/package/@storybook/addon-mcp)** — the addon exposes the MCP endpoint the fidelity gate uses for structural checks.

**If `renderer: "playwright"`:**
- **A harness route in your app** — a small dev-only route that renders one component state per URL, so the fidelity gate has a stable target the same way it would have a Storybook preview URL. `/ui-component-tdd:writing-component-playwright-harness` ships a reference template (Vite + react-router-dom) to copy in and adapt to your bundler/router.

---

## 5. Workflow

The seven phases run in strict order. Skipping is not allowed.

### Phases

| # | Phase | What happens |
|---|-------|-------------|
| 1 | **AUTHOR** | Create the component folder. Write `<Component>.spec.md` (States table + Gherkin stories via `/ui-component-tdd:writing-component-specs`) and one `mockups/<state>.html` per state (via `/ui-component-tdd:writing-component-mockups`). |
| 2 | **GATE 1 — design review** | `/ui-component-tdd:reviewing-component-design` dispatches a review subagent, surfaces the verdict, then **stops for your sign-off**. No test or production code may be written until you sign off. |
| 3 | **RED** | Write `<Component>.test.tsx` with at least one test per state id (`state:<id>`) and one per story id (`US-N:`). Run `testCommand` and confirm the new tests fail. |
| 4 | **GREEN** | Write minimal `<Component>.tsx`, `<Component>.module.css`, and `index.ts` re-export to pass. Run `testCommand` until green, then run `typecheckCommand`. |
| 5 | **REFACTOR** | Clean up; stay green. |
| 6 | **PREVIEW** | `renderer: "storybook"` — write `<Component>.stories.tsx`, one story per state id. `renderer: "playwright"` — write `<Component>.harness.tsx`, one entry per state id (via `/ui-component-tdd:writing-component-playwright-harness`). |
| 7 | **GATE 2 — fidelity review** | `renderer: "storybook"` — `/ui-component-tdd:fidelity-storybook` starts Storybook, dispatches a structural (Storybook MCP) + visual (Playwright) comparison subagent. `renderer: "playwright"` — `/ui-component-tdd:fidelity-playwright` starts the harness route, dispatches a subagent using Playwright for both structural and visual comparison. Either way: surfaces the per-state table, then **stops for your sign-off**. Not done until you sign off. |

### Per-component folder layout

```
src/components/
  Button/
    Button.spec.md          # States table + Gherkin stories
    Button.test.tsx         # Tests (RED/GREEN)
    Button.tsx              # Implementation
    Button.module.css       # Styles
    Button.stories.tsx      # renderer: storybook -- one story per state
    Button.harness.tsx      # renderer: playwright -- one fixture per state
    index.ts                # Re-export
    mockups/
      default.html          # One static HTML file per state id
      disabled.html
      loading.html
```

---

## 6. Skills and command

| Invocation | Description |
|-----------|-------------|
| `/ui-component-tdd:writing-component-specs` | Define every visual state and user interaction with stable ids before implementing anything |
| `/ui-component-tdd:writing-component-mockups` | Produce a self-contained static HTML design target for each state id |
| `/ui-component-tdd:reviewing-component-design` | Gate 1: dispatch a design reviewer, surface the verdict, stop for human sign-off |
| `/ui-component-tdd:writing-component-playwright-harness` | `renderer: "playwright"` only — scaffold the harness route and write a component's fixture file |
| `/ui-component-tdd:fidelity-storybook` | Gate 2 (`renderer: "storybook"`): compare rendered Storybook stories against mockups (structure + visual), stop for human sign-off |
| `/ui-component-tdd:fidelity-playwright` | Gate 2 (`renderer: "playwright"`): compare the rendered harness route against mockups (structure + visual, both via Playwright), stop for human sign-off |
| `/ui-tdd <ComponentName>` | Drive the full seven-phase workflow for one component end-to-end |

---

## 7. Illustrative example

Suppose you are building a `ToggleSwitch` component with two states: `on` and `off`.

**Step 1 — run the command:**

```
/ui-tdd ToggleSwitch
```

**Step 2 — the spec (`ToggleSwitch.spec.md`) that gets written:**

```markdown
## States

| id  | when                        |
|-----|-----------------------------|
| off | value is false (default)    |
| on  | value is true               |

## Stories

### US-1: Toggle on
Given the switch is in the `off` state
When the user clicks the switch
Then `onChange` is called with `true`

### US-2: Toggle off
Given the switch is in the `on` state
When the user clicks the switch
Then `onChange` is called with `false`
```

**Step 3 — the mockup link written into `mockups/off.html`:**

```html
<link rel="stylesheet" href="../../../styles/tokens.css">
<button role="switch" aria-checked="false" class="toggle">
  <span class="thumb"></span>
</button>
```

After Gate 1 sign-off, tests are written from the spec ids (`state:off`, `state:on`, `US-1:`, `US-2:`), the component is implemented until green, stories are written, and Gate 2 compares the rendered `on` and `off` stories to their respective mockup files before the component is considered done.

---

## License

MIT
