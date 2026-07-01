# Playwright Renderer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a consumer repo select `renderer: "playwright"` in `.claude/ui-component-tdd.json` to run phases 6 (PREVIEW) and 7 (Gate 2 fidelity) without Storybook, using a dev-only harness route + generic Playwright automation instead of Storybook + `@storybook/addon-mcp`.

**Architecture:** Add a `renderer` config key that gates which other config keys are required. Rename the existing `comparing-mockups-to-storybook` skill to `fidelity-storybook` for symmetry with a new `fidelity-playwright` skill; add a new `writing-component-playwright-harness` skill for phase 6 under the Playwright renderer. `commands/ui-tdd.md` branches phases 6–7 on `renderer`. Phases 1–5 (spec, mockups, Gate 1, RED, GREEN, REFACTOR) get no behavioral changes.

**Tech Stack:** Markdown skill/command files (Claude Code plugin format), no application code. Reference harness template targets Vite + react-router-dom.

**Full design:** `docs/superpowers/specs/2026-07-01-playwright-renderer-design.md`

## Global Constraints

- Every skill's "Configuration" section must independently read `.claude/ui-component-tdd.json` and STOP with a copy-pasteable example if it (or a renderer-required key) is missing — this pattern is intentionally duplicated per skill, not factored out (each skill can be invoked standalone).
- `renderer` values are exactly `"storybook"` or `"playwright"` (string literals, case-sensitive).
- No MCP endpoint exists or is needed for `renderer: "playwright"` — do not add one.
- Match existing prose style: terse, imperative, "Iron Law" / rationalization-table / red-flags structure in gate skills.
- This repo has no build/lint/test command of its own — verification steps are `grep`, JSON-parse checks, and (for the final two tasks) a real dry run in a scratch consumer repo.

---

### Task 1: Rename `comparing-mockups-to-storybook` → `fidelity-storybook`

Pure rename, no functional change. Sets up the naming symmetry the later tasks build on.

**Files:**
- Rename: `skills/comparing-mockups-to-storybook/` → `skills/fidelity-storybook/`
- Modify: `skills/fidelity-storybook/SKILL.md:2`
- Modify: `README.md:84`, `README.md:112`
- Modify: `commands/ui-tdd.md:54`

**Interfaces:**
- Produces: the skill invocation string `/ui-component-tdd:fidelity-storybook`, which Task 5 and Task 6 reference.

- [ ] **Step 1: Rename the folder**

```bash
git mv skills/comparing-mockups-to-storybook skills/fidelity-storybook
```

- [ ] **Step 2: Update the skill's own frontmatter name**

In `skills/fidelity-storybook/SKILL.md`, line 2, replace:
```
name: comparing-mockups-to-storybook
```
with:
```
name: fidelity-storybook
```

- [ ] **Step 3: Update the two README references**

In `README.md`, line 84, replace:
```
| 7 | **GATE 2 — fidelity review** | `/ui-component-tdd:comparing-mockups-to-storybook` starts Storybook, dispatches a structural + visual comparison subagent, surfaces the per-state table, then **stops for your sign-off**. Not done until you sign off. |
```
with:
```
| 7 | **GATE 2 — fidelity review** | `/ui-component-tdd:fidelity-storybook` starts Storybook, dispatches a structural + visual comparison subagent, surfaces the per-state table, then **stops for your sign-off**. Not done until you sign off. |
```

In `README.md`, line 112, replace:
```
| `/ui-component-tdd:comparing-mockups-to-storybook` | Gate 2: compare rendered Storybook stories against mockups (structure + visual), stop for human sign-off |
```
with:
```
| `/ui-component-tdd:fidelity-storybook` | Gate 2: compare rendered Storybook stories against mockups (structure + visual), stop for human sign-off |
```

(Both lines get further edits in Task 6 once the Playwright renderer rows exist — this step only fixes the rename.)

- [ ] **Step 4: Update the command reference**

In `commands/ui-tdd.md`, line 54, replace:
```
7. **GATE #2 — fidelity review.** Use the `/ui-component-tdd:comparing-mockups-to-storybook`
```
with:
```
7. **GATE #2 — fidelity review.** Use the `/ui-component-tdd:fidelity-storybook`
```

(This paragraph gets fully rewritten in Task 5 — this step only fixes the rename so Task 5 starts from a consistent name.)

- [ ] **Step 5: Verify no stale references remain**

```bash
grep -rn "comparing-mockups-to-storybook" --include="*.md" .
```
Expected: no output from `README.md`, `commands/ui-tdd.md`, or any `skills/` file. (The design doc at `docs/superpowers/specs/2026-07-01-playwright-renderer-design.md` legitimately still names the old skill when describing the rename decision — that's expected and correct; don't edit it.)

- [ ] **Step 6: Commit**

```bash
git add skills/fidelity-storybook README.md commands/ui-tdd.md
git commit -m "refactor: rename comparing-mockups-to-storybook skill to fidelity-storybook"
```

---

### Task 2: Add the `renderer` config key

Introduces the config contract change everything else depends on. Touches the four skills/command that currently show the flat 7-key config shape, plus README §3 (the source of truth for both renderer shapes).

**Files:**
- Modify: `skills/writing-component-specs/SKILL.md:20-38`
- Modify: `skills/writing-component-mockups/SKILL.md:17-35`
- Modify: `skills/reviewing-component-design/SKILL.md:25-43`
- Modify: `skills/fidelity-storybook/SKILL.md:17-35`
- Modify: `commands/ui-tdd.md:3-21`
- Modify: `README.md:30-56`

**Interfaces:**
- Produces: the `renderer` config key (`"storybook" | "playwright"`) and the convention that `storybookCommand`/`storybookUrl`/`storybookMcpUrl` are only required when `renderer: "storybook"`, and `harnessCommand`/`harnessUrl` only when `renderer: "playwright"`. Tasks 3, 4, 5 consume this convention.

- [ ] **Step 1: Update the shared Configuration block in 4 files**

In each of `skills/writing-component-specs/SKILL.md`, `skills/writing-component-mockups/SKILL.md`, `skills/reviewing-component-design/SKILL.md`, and `commands/ui-tdd.md`, find this exact block (byte-for-byte identical in all four files):

```
## Configuration

Read `.claude/ui-component-tdd.json` from the repo root before doing anything
else. If it is missing, STOP and ask the user to create it with this shape:

```json
{
  "componentsDir": "src/components",
  "tokensStylesheet": "src/styles/tokens.css",
  "testCommand": "your-test-command",
  "typecheckCommand": "your-typecheck-command",
  "storybookCommand": "your-storybook-command",
  "storybookUrl": "http://localhost:PORT",
  "storybookMcpUrl": "http://localhost:PORT/mcp"
}
```

Below, `<componentsDir>`, `<testCommand>`, etc. mean the corresponding values
from that file.
```

Replace it with:

```
## Configuration

Read `.claude/ui-component-tdd.json` from the repo root before doing anything
else. If it is missing, STOP and ask the user to create it with this shape:

```json
{
  "componentsDir": "src/components",
  "tokensStylesheet": "src/styles/tokens.css",
  "testCommand": "your-test-command",
  "typecheckCommand": "your-typecheck-command",
  "renderer": "storybook",
  "storybookCommand": "your-storybook-command",
  "storybookUrl": "http://localhost:PORT",
  "storybookMcpUrl": "http://localhost:PORT/mcp"
}
```

If your repo uses `"renderer": "playwright"` instead, see README.md §3 for
the equivalent shape (no Storybook keys, no MCP URL).

Below, `<componentsDir>`, `<testCommand>`, etc. mean the corresponding values
from that file.
```

- [ ] **Step 2: Update the Configuration block in `fidelity-storybook/SKILL.md`**

This one has a different trailer sentence (it names the storybook keys explicitly). Find:

```
## Configuration

Read `.claude/ui-component-tdd.json` from the repo root before doing anything
else. If it is missing, STOP and ask the user to create it with this shape:

```json
{
  "componentsDir": "src/components",
  "tokensStylesheet": "src/styles/tokens.css",
  "testCommand": "your-test-command",
  "typecheckCommand": "your-typecheck-command",
  "storybookCommand": "your-storybook-command",
  "storybookUrl": "http://localhost:PORT",
  "storybookMcpUrl": "http://localhost:PORT/mcp"
}
```

Below, `<componentsDir>`, `<storybookCommand>`, `<storybookUrl>`, `<storybookMcpUrl>`,
etc. mean the corresponding values from that file.
```

Replace it with:

```
## Configuration

Read `.claude/ui-component-tdd.json` from the repo root before doing anything
else. If it is missing, STOP and ask the user to create it with this shape:

```json
{
  "componentsDir": "src/components",
  "tokensStylesheet": "src/styles/tokens.css",
  "testCommand": "your-test-command",
  "typecheckCommand": "your-typecheck-command",
  "renderer": "storybook",
  "storybookCommand": "your-storybook-command",
  "storybookUrl": "http://localhost:PORT",
  "storybookMcpUrl": "http://localhost:PORT/mcp"
}
```

If your repo uses `"renderer": "playwright"` instead, see README.md §3 for
the equivalent shape.

Below, `<componentsDir>`, `<storybookCommand>`, `<storybookUrl>`, `<storybookMcpUrl>`,
etc. mean the corresponding values from that file.
```

- [ ] **Step 3: Rewrite README.md §3 (config contract)**

In `README.md`, replace the entire section from `## 3. Per-repo config` up to (but not including) `## 4. Prerequisites` — currently:

```
## 3. Per-repo config

Each repo that uses the plugin must have a config file at `.claude/ui-component-tdd.json` in the repo root. All seven keys are required:

| Key | Purpose |
|-----|---------|
| `componentsDir` | Root folder for components (relative to repo root) |
| `tokensStylesheet` | CSS file that exports design tokens (`var(--…)`), linked by mockups |
| `testCommand` | Command that runs the component test suite |
| `typecheckCommand` | Command that runs the TypeScript type-check |
| `storybookCommand` | Command that starts Storybook |
| `storybookUrl` | URL where Storybook is served (used to poll readiness) |
| `storybookMcpUrl` | URL of the Storybook MCP endpoint (for structural fidelity checks) |

**Worked example** (generic npm-based React project):

```json
{
  "componentsDir": "src/components",
  "tokensStylesheet": "src/styles/tokens.css",
  "testCommand": "npm test",
  "typecheckCommand": "npm run typecheck",
  "storybookCommand": "npm run storybook",
  "storybookUrl": "http://localhost:6006",
  "storybookMcpUrl": "http://localhost:6006/mcp"
}
```

If this file is missing or any key is absent, every skill and the `/ui-tdd` command will stop immediately and ask you to create it before proceeding.

---
```

with:

```
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
```

- [ ] **Step 4: Verify the JSON blocks are valid**

```bash
node -e "JSON.parse('{\"componentsDir\":\"src/components\",\"tokensStylesheet\":\"src/styles/tokens.css\",\"testCommand\":\"npm test\",\"typecheckCommand\":\"npm run typecheck\",\"renderer\":\"storybook\",\"storybookCommand\":\"npm run storybook\",\"storybookUrl\":\"http://localhost:6006\",\"storybookMcpUrl\":\"http://localhost:6006/mcp\"}'); console.log('storybook example OK')"
node -e "JSON.parse('{\"componentsDir\":\"src/components\",\"tokensStylesheet\":\"src/styles/tokens.css\",\"testCommand\":\"npm test\",\"typecheckCommand\":\"npm run typecheck\",\"renderer\":\"playwright\",\"harnessCommand\":\"npm run dev\",\"harnessUrl\":\"http://localhost:5173\"}'); console.log('playwright example OK')"
```
Expected: both print their `OK` message with no `SyntaxError`.

- [ ] **Step 5: Verify every occurrence picked up the renderer key**

```bash
grep -rLn '"renderer"' skills/writing-component-specs/SKILL.md skills/writing-component-mockups/SKILL.md skills/reviewing-component-design/SKILL.md skills/fidelity-storybook/SKILL.md commands/ui-tdd.md README.md
```
Expected: no output (`-L` lists files that do *not* match; an empty result means all six files now contain `"renderer"`).

- [ ] **Step 6: Commit**

```bash
git add skills/writing-component-specs/SKILL.md skills/writing-component-mockups/SKILL.md skills/reviewing-component-design/SKILL.md skills/fidelity-storybook/SKILL.md commands/ui-tdd.md README.md
git commit -m "feat: add renderer config key (storybook | playwright) to config contract"
```

---

### Task 3: Add the `fidelity-playwright` skill

Gate 2 for `renderer: "playwright"`. Mirrors `fidelity-storybook` structurally; the reviewer prompt navigates directly to the harness route instead of going through Storybook + MCP.

**Files:**
- Create: `skills/fidelity-playwright/SKILL.md`
- Create: `skills/fidelity-playwright/fidelity-reviewer.md`

**Interfaces:**
- Consumes: the `renderer`/`harnessCommand`/`harnessUrl` config keys from Task 2; the harness route convention `<harnessUrl>/__harness/<Component>/<state-id>` (defined here, consumed by Task 4).
- Produces: the skill invocation string `/ui-component-tdd:fidelity-playwright`, consumed by Task 5 and Task 6.

- [ ] **Step 1: Write `skills/fidelity-playwright/SKILL.md`**

```markdown
---
name: fidelity-playwright
description: Use when a component implementation passes its tests and you are about to call it done (renderer: playwright)
---

# Comparing Mockups to the Playwright Harness (Gate #2)

## Overview

The fidelity gate for `renderer: "playwright"`. Passing tests prove
behaviour, not appearance. Before "done", a subagent compares every state
rendered by the harness route to its mockup — structure and visuals — and
**the human signs off**.

**Core principle:** Passing tests is not done. The rendered component
matching its mockups is done.

**REQUIRED BACKGROUND:** superpowers:test-driven-development.

## Configuration

Read `.claude/ui-component-tdd.json` from the repo root before doing anything
else. If it is missing, STOP and ask the user to create it with this shape:

```json
{
  "componentsDir": "src/components",
  "tokensStylesheet": "src/styles/tokens.css",
  "testCommand": "your-test-command",
  "typecheckCommand": "your-typecheck-command",
  "renderer": "playwright",
  "harnessCommand": "your-dev-server-command",
  "harnessUrl": "http://localhost:PORT"
}
```

If your repo uses `"renderer": "storybook"` instead, see README.md §3 for the
equivalent shape.

Below, `<componentsDir>`, `<harnessCommand>`, `<harnessUrl>`, etc. mean the
corresponding values from that file.

## The Iron Law

```
NOT DONE UNTIL THIS GATE IS SIGNED OFF.
```

## Process

1. Confirm `<componentsDir>/<Component>/<Component>.harness.tsx` has one
   entry per state id, and a `<componentsDir>/<Component>/mockups/<id>.html`
   exists for each.
2. Start the dev server: `<harnessCommand>` (serves the harness route at
   `<harnessUrl>/__harness/<Component>/<state-id>`). Wait until
   `curl --fail <harnessUrl>/__harness/<Component>/<any-state-id>` succeeds.
3. Dispatch a `general-purpose` subagent, filling fidelity-reviewer.md with
   `{COMPONENT}`, `{MOCKUPS_DIR}`, `{HARNESS_URL}`.
4. Surface the per-state table verbatim.
5. **STOP. Ask the human to sign off.** The subagent advises; the human
   decides.
6. `mismatch` → fix the **component** (not the mockup, unless the human rules
   the mockup wrong) → re-run the comparison. Repeat until the human signs
   off.

## Rationalization table

| Excuse | Reality |
|--------|---------|
| "The tests pass, so it's fine" | Tests assert behaviour, not spacing, colour, or layout. |
| "Close enough" | The mockup is the agreed target. "Close enough" is the human's call, not yours. |
| "I'll fix the spacing later" | Later never comes. Drift is cheapest to fix now, against the mockup. |
| "The harness route isn't running" | Start it: `<harnessCommand>`. The gate is not optional because setup is mild effort. |
| "Just compare the screenshots" | Structure matters too — wrong roles/labels pass a visual glance and fail users. |

## Red flags — STOP

- Marking done with no signed-off fidelity report.
- Comparing visuals only, skipping the structural (accessibility tree / role
  query) check.
- Editing a mockup to match the component to force a pass (without human
  ruling).
- Treating the subagent's MATCH as the gate (the human signs off).
```

- [ ] **Step 2: Write `skills/fidelity-playwright/fidelity-reviewer.md`**

```markdown
You are the FIDELITY GATE for a React component that already passes its tests.
Compare each state rendered by the Playwright harness route against its static
HTML mockup. The bar is design-intent match, not pixel-identity — report
meaningful drift only.

## Inputs
- Component: {COMPONENT}
- Mockups directory: {MOCKUPS_DIR}
- Harness base URL: {HARNESS_URL}

## Method (per state id)
Pair `mockups/<id>.html` with `{HARNESS_URL}/__harness/{COMPONENT}/<id>`.
1. Structural — navigate to the harness URL for this state. Use Playwright's
   accessibility snapshot / role and text locators (no MCP endpoint needed
   here). Compare roles, accessible names, visible text, and key elements
   against the mockup's DOM.
2. Visual — with Playwright, screenshot the harness URL and the mockup file
   (`file://` path) at the same viewport (390x844). Compare layout, spacing,
   colour, typography.

## Output (exactly this shape)
A table: `| state | structure | visual | notes |` where structure/visual ∈
{match, mismatch} and notes give the specific drift + an evidence path
(screenshot file or DOM delta). End with `VERDICT: MATCH | MISMATCH`.
```

- [ ] **Step 3: Verify the new files are self-consistent**

```bash
grep -n "^name:" skills/fidelity-playwright/SKILL.md
grep -c '{COMPONENT}\|{MOCKUPS_DIR}\|{HARNESS_URL}' skills/fidelity-playwright/fidelity-reviewer.md
```
Expected: first command prints `name: fidelity-playwright`; second prints a
count ≥ 3 (all three placeholders appear at least once).

- [ ] **Step 4: Commit**

```bash
git add skills/fidelity-playwright
git commit -m "feat: add fidelity-playwright skill (Gate 2 without Storybook)"
```

---

### Task 4: Add the `writing-component-playwright-harness` skill

Phase 6 (PREVIEW) for `renderer: "playwright"`. Ships the one-time project-wide harness route template and the per-component fixture template.

**Files:**
- Create: `skills/writing-component-playwright-harness/SKILL.md`
- Create: `skills/writing-component-playwright-harness/harness-route-template.tsx`
- Create: `skills/writing-component-playwright-harness/harness-fixture-template.tsx`

**Interfaces:**
- Consumes: the harness route convention `<harnessUrl>/__harness/<Component>/<state-id>` from Task 3.
- Produces: the skill invocation string `/ui-component-tdd:writing-component-playwright-harness`, consumed by Task 5 and Task 6. Produces the `<Component>.harness.tsx` file convention (a named export `states: Record<string, JSX.Element>`), consumed by Task 3's fidelity-reviewer (reads what this fixture renders, indirectly, via the harness route) and by Task 8's dry run.

- [ ] **Step 1: Write `skills/writing-component-playwright-harness/SKILL.md`**

```markdown
---
name: writing-component-playwright-harness
description: Use when producing the Playwright harness route and per-component fixture file that let Gate 2 render each visual state without Storybook
---

# Writing Component Playwright Harness

## Overview

The harness fixture is the Playwright-renderer's replacement for
`.stories.tsx`: one file per component mapping each state id to the JSX that
renders it. A single, project-wide harness route serves these fixtures at a
stable URL per state (`<harnessUrl>/__harness/<Component>/<state-id>`), which
is what lets the fidelity gate navigate to a live target the same way it
would navigate to a Storybook preview URL.

**Core principle:** the harness route is scaffolded once per project; every
component after that only needs its own fixture file.

## Configuration

Read `.claude/ui-component-tdd.json` from the repo root before doing anything
else. If it is missing, STOP and ask the user to create it with this shape:

```json
{
  "componentsDir": "src/components",
  "tokensStylesheet": "src/styles/tokens.css",
  "testCommand": "your-test-command",
  "typecheckCommand": "your-typecheck-command",
  "renderer": "playwright",
  "harnessCommand": "your-dev-server-command",
  "harnessUrl": "http://localhost:PORT"
}
```

If your repo uses `"renderer": "storybook"` instead, see README.md §3 for the
equivalent shape.

Below, `<componentsDir>`, `<harnessCommand>`, `<harnessUrl>`, etc. mean the
corresponding values from that file.

## Rules

- **Scaffold the harness route once.** If
  `<componentsDir>/../harness/HarnessRoute.tsx` doesn't exist yet, copy
  harness-route-template.tsx there and register the
  `/__harness/:component/:state` route in the app's router per the comment at
  the top of that file. Do this at most once per project — later components
  never repeat it.
- **One fixture file per component.** Copy harness-fixture-template.tsx to
  `<componentsDir>/<Component>/<Component>.harness.tsx`. Every state id in
  `<Component>.spec.md`'s States table gets one entry in the exported
  `states` map; no extra entries.
- **Same content bar as a mockup.** Each entry renders the real component in
  exactly that state — same props/children a consumer would pass, not a
  simplified stand-in.
- **The template is a reference, not drop-in code.** It assumes Vite +
  react-router-dom. A different bundler or router needs an equivalent
  mechanism; the only hard requirement is that
  `<harnessUrl>/__harness/<Component>/<state-id>` renders that state.

## Quick reference

| Rule | Value |
|------|-------|
| Harness route | scaffolded once, at `<componentsDir>/../harness/HarnessRoute.tsx` |
| Fixture file | `<componentsDir>/<Component>/<Component>.harness.tsx` |
| States per fixture | one entry per States-table id, exactly |
| Route convention | `<harnessUrl>/__harness/<Component>/<state-id>` |

## Common mistakes

- **Re-scaffolding the harness route per component.** It's project-wide;
  check whether it already exists first.
- **A fixture entry that doesn't match its mockup's props/content.** The
  fidelity gate compares them directly — keep them describing the same
  state.
- **Forgetting to register the router route** after copying the template —
  the file existing isn't enough, the route must be wired in.

See harness-route-template.tsx and harness-fixture-template.tsx for the
copyable skeletons.
```

- [ ] **Step 2: Write `skills/writing-component-playwright-harness/harness-route-template.tsx`**

```tsx
// One-time scaffold for the Playwright renderer. Copy this file to
// <componentsDir>/../harness/HarnessRoute.tsx (a `harness/` folder as a
// sibling of your components directory), then register it in your app's
// router:
//
//   import { HarnessRoute } from "./harness/HarnessRoute";
//   <Route path="/__harness/:component/:state" element={<HarnessRoute />} />
//
// This file is a Vite + react-router-dom reference implementation. Other
// bundlers/routers need an equivalent: the only requirement is that
// <harnessUrl>/__harness/<Component>/<state-id> renders that state.
//
// Adjust the glob path below if your componentsDir differs from
// "src/components".
import { useParams } from "react-router-dom";

const modules = import.meta.glob<Record<string, unknown>>(
  "../components/*/*.harness.tsx",
  { eager: true }
);

function lookup(component: string, state: string) {
  for (const path in modules) {
    if (path.endsWith(`/${component}.harness.tsx`)) {
      const mod = modules[path] as { states: Record<string, JSX.Element> };
      return mod.states[state];
    }
  }
  return undefined;
}

export function HarnessRoute() {
  const { component, state } = useParams<{ component: string; state: string }>();
  if (!component || !state) {
    return <p>Missing component/state in URL.</p>;
  }
  const rendered = lookup(component, state);
  if (!rendered) {
    return <p>No state "{state}" found for "{component}".</p>;
  }
  return rendered;
}
```

- [ ] **Step 3: Write `skills/writing-component-playwright-harness/harness-fixture-template.tsx`**

```tsx
// Copy to <componentsDir>/<Component>/<Component>.harness.tsx and rename
// `YourComponent` to the real component. One entry per States-table id from
// <Component>.spec.md -- the same ids used by the mockups and by state:<id>
// tests.
import { YourComponent } from "./YourComponent";

export const states: Record<string, JSX.Element> = {
  default: <YourComponent>Label</YourComponent>,
  // <id>: <YourComponent ...props for that state />,
};
```

- [ ] **Step 4: Verify the new files are self-consistent**

```bash
grep -n "^name:" skills/writing-component-playwright-harness/SKILL.md
grep -c "states" skills/writing-component-playwright-harness/harness-route-template.tsx skills/writing-component-playwright-harness/harness-fixture-template.tsx
```
Expected: first command prints `name: writing-component-playwright-harness`;
second prints a nonzero count for both files (confirms the `states` export
name used by the fixture template matches the name read by the route
template).

- [ ] **Step 5: Commit**

```bash
git add skills/writing-component-playwright-harness
git commit -m "feat: add writing-component-playwright-harness skill and templates"
```

---

### Task 5: Branch phases 6–7 on `renderer` in `commands/ui-tdd.md`

**Files:**
- Modify: `commands/ui-tdd.md` (phase 6 and phase 7 paragraphs)

**Interfaces:**
- Consumes: `/ui-component-tdd:writing-component-playwright-harness` (Task 4), `/ui-component-tdd:fidelity-playwright` (Task 3), `/ui-component-tdd:fidelity-storybook` (Task 1).

- [ ] **Step 1: Rename and branch phase 6**

In `commands/ui-tdd.md`, replace:
```
6. **STORIES.** Write `<Component>.stories.tsx` with one story per state id.
   `<testCommand>` runs story play-tests in the Storybook browser project —
   keep it green.
```
with:
```
6. **PREVIEW.** Depends on `<renderer>`:
   - `storybook` — write `<Component>.stories.tsx` with one story per state
     id. `<testCommand>` runs story play-tests in the Storybook browser
     project — keep it green.
   - `playwright` — using the
     `/ui-component-tdd:writing-component-playwright-harness` skill,
     scaffold the project-wide harness route if it doesn't exist yet, then
     write `<Component>.harness.tsx` with one entry per state id.
```

- [ ] **Step 2: Branch phase 7**

Replace:
```
7. **GATE #2 — fidelity review.** Use the `/ui-component-tdd:fidelity-storybook`
   skill. Start `<storybookCommand>`, dispatch the fidelity reviewer (structural via
   Storybook MCP + visual via Playwright), surface the per-state table, and STOP
   for the human's sign-off. Fix the component on mismatch. **Not done until
   signed off.**
```
with:
```
7. **GATE #2 — fidelity review.** Depends on `<renderer>`:
   - `storybook` — use the `/ui-component-tdd:fidelity-storybook` skill.
     Start `<storybookCommand>`, dispatch the fidelity reviewer (structural
     via Storybook MCP + visual via Playwright).
   - `playwright` — use the `/ui-component-tdd:fidelity-playwright` skill.
     Start `<harnessCommand>`, dispatch the fidelity reviewer (structural +
     visual, both via Playwright against the harness route).

   Either way: surface the per-state table, and STOP for the human's
   sign-off. Fix the component on mismatch. **Not done until signed off.**
```

- [ ] **Step 3: Verify**

```bash
grep -n "PREVIEW\|GATE #2" commands/ui-tdd.md
```
Expected: shows the phase 6 line now reading `6. **PREVIEW.** Depends on...`
and the phase 7 line reading `7. **GATE #2 — fidelity review.** Depends on...`.

- [ ] **Step 4: Commit**

```bash
git add commands/ui-tdd.md
git commit -m "feat: branch PREVIEW and Gate 2 phases on renderer in /ui-tdd command"
```

---

### Task 6: Update remaining docs (README, CHANGELOG, plugin.json, CLAUDE.md)

Everything here depends on the new skill names and command branching from Tasks 1, 3, 4, 5 already existing.

**Files:**
- Modify: `README.md` (§1 intro, §4 prerequisites, §5 phase table + folder layout, §6 skills table)
- Modify: `CHANGELOG.md`
- Modify: `.claude-plugin/plugin.json`
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update README §1 intro**

Replace:
```
`ui-component-tdd` adds four skills and one command to Claude Code. Together they structure the full component lifecycle into seven ordered phases with two mandatory human sign-off gates: **Gate 1** (design review — before any test or production code) and **Gate 2** (fidelity — before done). Skipping a gate or reordering the phases is explicitly rejected by the skills.
```
with:
```
`ui-component-tdd` adds six skills and one command to Claude Code — two of
the skills are a renderer-specific pair (Storybook or Playwright) selected
via config for the PREVIEW phase and Gate 2. Together they structure the
full component lifecycle into seven ordered phases with two mandatory human
sign-off gates: **Gate 1** (design review — before any test or production
code) and **Gate 2** (fidelity — before done). Skipping a gate or reordering
the phases is explicitly rejected by the skills.
```

- [ ] **Step 2: Update README §4 prerequisites**

Replace:
```
## 4. Prerequisites

The plugin does **not** install these — set them up in your repo before using the plugin:

- **[Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/)** — for the unit/interaction tests written in the RED phase.
- **[Storybook](https://storybook.js.org/) with [`@storybook/addon-mcp`](https://www.npmjs.com/package/@storybook/addon-mcp)** — the addon exposes the MCP endpoint that the fidelity gate uses for structural checks.
- **[Playwright](https://playwright.dev/)** — used by the fidelity reviewer for visual comparison of rendered stories against mockups.
```
with:
```
## 4. Prerequisites

The plugin does **not** install these — set them up in your repo before using the plugin:

- **[Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/)** — for the unit/interaction tests written in the RED phase.
- **[Playwright](https://playwright.dev/)** — used by the fidelity reviewer for visual comparison against mockups on both renderers, and for structural checks too when `renderer: "playwright"`.

**If `renderer: "storybook"`:**
- **[Storybook](https://storybook.js.org/) with [`@storybook/addon-mcp`](https://www.npmjs.com/package/@storybook/addon-mcp)** — the addon exposes the MCP endpoint the fidelity gate uses for structural checks.

**If `renderer: "playwright"`:**
- **A harness route in your app** — a small dev-only route that renders one component state per URL, so the fidelity gate has a stable target the same way it would have a Storybook preview URL. `/ui-component-tdd:writing-component-playwright-harness` ships a reference template (Vite + react-router-dom) to copy in and adapt to your bundler/router.
```

- [ ] **Step 3: Update README §5 phase table rows 6 and 7**

Replace:
```
| 6 | **STORIES** | Write `<Component>.stories.tsx` with one story per state id. |
```
with:
```
| 6 | **PREVIEW** | `renderer: "storybook"` — write `<Component>.stories.tsx`, one story per state id. `renderer: "playwright"` — write `<Component>.harness.tsx`, one entry per state id (via `/ui-component-tdd:writing-component-playwright-harness`). |
```

Replace:
```
| 7 | **GATE 2 — fidelity review** | `/ui-component-tdd:fidelity-storybook` starts Storybook, dispatches a structural + visual comparison subagent, surfaces the per-state table, then **stops for your sign-off**. Not done until you sign off. |
```
with:
```
| 7 | **GATE 2 — fidelity review** | `renderer: "storybook"` — `/ui-component-tdd:fidelity-storybook` starts Storybook, dispatches a structural (Storybook MCP) + visual (Playwright) comparison subagent. `renderer: "playwright"` — `/ui-component-tdd:fidelity-playwright` starts the harness route, dispatches a subagent using Playwright for both structural and visual comparison. Either way: surfaces the per-state table, then **stops for your sign-off**. Not done until you sign off. |
```

- [ ] **Step 4: Update README's per-component folder layout example**

Replace:
```
src/components/
  Button/
    Button.spec.md          # States table + Gherkin stories
    Button.test.tsx         # Tests (RED/GREEN)
    Button.tsx              # Implementation
    Button.module.css       # Styles
    Button.stories.tsx      # Storybook stories (one per state)
    index.ts                # Re-export
    mockups/
      default.html          # One static HTML file per state id
      disabled.html
      loading.html
```
with:
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

- [ ] **Step 5: Update README §6 skills table**

Replace:
```
| Invocation | Description |
|-----------|-------------|
| `/ui-component-tdd:writing-component-specs` | Define every visual state and user interaction with stable ids before implementing anything |
| `/ui-component-tdd:writing-component-mockups` | Produce a self-contained static HTML design target for each state id |
| `/ui-component-tdd:reviewing-component-design` | Gate 1: dispatch a design reviewer, surface the verdict, stop for human sign-off |
| `/ui-component-tdd:fidelity-storybook` | Gate 2: compare rendered Storybook stories against mockups (structure + visual), stop for human sign-off |
| `/ui-tdd <ComponentName>` | Drive the full seven-phase workflow for one component end-to-end |
```
with:
```
| Invocation | Description |
|-----------|-------------|
| `/ui-component-tdd:writing-component-specs` | Define every visual state and user interaction with stable ids before implementing anything |
| `/ui-component-tdd:writing-component-mockups` | Produce a self-contained static HTML design target for each state id |
| `/ui-component-tdd:reviewing-component-design` | Gate 1: dispatch a design reviewer, surface the verdict, stop for human sign-off |
| `/ui-component-tdd:writing-component-playwright-harness` | `renderer: "playwright"` only — scaffold the harness route and write a component's fixture file |
| `/ui-component-tdd:fidelity-storybook` | Gate 2 (`renderer: "storybook"`): compare rendered Storybook stories against mockups (structure + visual), stop for human sign-off |
| `/ui-component-tdd:fidelity-playwright` | Gate 2 (`renderer: "playwright"`): compare the rendered harness route against mockups (structure + visual, both via Playwright), stop for human sign-off |
| `/ui-tdd <ComponentName>` | Drive the full seven-phase workflow for one component end-to-end |
```

- [ ] **Step 6: Update CHANGELOG.md**

Replace:
```
# Changelog

## Unreleased
- Initial extraction of the UI Component TDD skill suite from the home-organization repo.
```
with:
```
# Changelog

## Unreleased
- Initial extraction of the UI Component TDD skill suite from the home-organization repo.
- Add a `renderer` config option (`"storybook"` | `"playwright"`) so Gate 2 and
  the PREVIEW phase can run without Storybook. Renamed
  `comparing-mockups-to-storybook` to `fidelity-storybook` and added
  `fidelity-playwright` and `writing-component-playwright-harness`.
```

- [ ] **Step 7: Update plugin.json keywords**

In `.claude-plugin/plugin.json`, replace:
```
  "keywords": ["skills", "tdd", "ui", "react", "storybook", "testing", "mockups"]
```
with:
```
  "keywords": ["skills", "tdd", "ui", "react", "storybook", "playwright", "testing", "mockups"]
```

- [ ] **Step 8: Rewrite CLAUDE.md's architecture description**

In `CLAUDE.md`, replace the "Repo structure" code block:
```
skills/
  writing-component-specs/          # Phase 1a — spec-template.md
  writing-component-mockups/        # Phase 1b — mockup-template.html
  reviewing-component-design/       # Gate 1 — design-reviewer.md (subagent prompt)
  comparing-mockups-to-storybook/   # Gate 2 — fidelity-reviewer.md (subagent prompt)
```
with:
```
skills/
  writing-component-specs/               # Phase 1a — spec-template.md
  writing-component-mockups/             # Phase 1b — mockup-template.html
  reviewing-component-design/            # Gate 1 — design-reviewer.md (subagent prompt)
  writing-component-playwright-harness/  # Phase 6 (renderer: playwright) — harness-route-template.tsx, harness-fixture-template.tsx
  fidelity-storybook/                    # Gate 2 (renderer: storybook) — fidelity-reviewer.md (subagent prompt)
  fidelity-playwright/                   # Gate 2 (renderer: playwright) — fidelity-reviewer.md (subagent prompt)
```

And replace the architecture walkthrough's Gate 2 bullet:
```
5. **GATE 2 (fidelity review)** — `comparing-mockups-to-storybook` starts the consumer's Storybook,
   dispatches a subagent using `fidelity-reviewer.md` (structural comparison via Storybook MCP
   `preview-stories` + visual comparison via Playwright screenshots), surfaces a per-state
   `structure | visual` table, then **stops for human sign-off**.
```
with:
```
5. **GATE 2 (fidelity review)** — depends on the `renderer` config key. `fidelity-storybook`
   starts the consumer's Storybook, dispatches a subagent using `fidelity-reviewer.md`
   (structural comparison via Storybook MCP `preview-stories` + visual comparison via
   Playwright screenshots). `fidelity-playwright` starts the consumer's dev server instead,
   and its subagent drives Playwright directly against a dev-only harness route
   (`<harnessUrl>/__harness/<Component>/<state-id>`, scaffolded once per project by
   `writing-component-playwright-harness`) for both structural and visual comparison — no
   MCP endpoint needed. Either way, the subagent surfaces a per-state `structure | visual`
   table, then **stops for human sign-off**.
```

- [ ] **Step 9: Verify**

```bash
grep -rn "adds four skills\|comparing-mockups-to-storybook" README.md CLAUDE.md CHANGELOG.md .claude-plugin/plugin.json
```
Expected: no output.

- [ ] **Step 10: Commit**

```bash
git add README.md CHANGELOG.md .claude-plugin/plugin.json CLAUDE.md
git commit -m "docs: document renderer option across README, CHANGELOG, plugin.json, CLAUDE.md"
```

---

### Task 7: Manual dry run — Storybook renderer (regression check)

No file changes in this repo — this task validates that the Storybook path still works after Tasks 1–6 touched every file it depends on. Requires an interactive Claude Code session (the gates are human sign-off points, not scriptable). No commit at the end.

**Files:** none (validates in a scratch repo outside this plugin)

- [ ] **Step 1: Scaffold a scratch React + Storybook app**

```bash
npm create vite@latest ui-tdd-storybook-scratch -- --template react-ts
cd ui-tdd-storybook-scratch
npm install
npx storybook@latest init --yes
npm install -D @storybook/addon-mcp vitest @testing-library/react @testing-library/jest-dom jsdom @playwright/test
npx playwright install --with-deps chromium
```

- [ ] **Step 2: Add the config file**

Create `.claude/ui-component-tdd.json`:
```json
{
  "componentsDir": "src/components",
  "tokensStylesheet": "src/index.css",
  "testCommand": "npx vitest run",
  "typecheckCommand": "npx tsc --noEmit",
  "renderer": "storybook",
  "storybookCommand": "npm run storybook",
  "storybookUrl": "http://localhost:6006",
  "storybookMcpUrl": "http://localhost:6006/mcp"
}
```

- [ ] **Step 3: Install the plugin from this local repo**

Inside a Claude Code session in the scratch repo:
```
/plugin marketplace add C:\Users\cecil\repo\ui-component-tdd
/plugin install ui-component-tdd@tomdavis
```

- [ ] **Step 4: Run the workflow on a trivial component**

```
/ui-tdd Badge
```
Walk through all seven phases, signing off at both gates. Confirm specifically:
- Phase 6 produces `Badge.stories.tsx` (not `Badge.harness.tsx`).
- Phase 7 dispatches via `/ui-component-tdd:fidelity-storybook` (check the surfaced skill name), starts Storybook, and the verdict table's structural column is populated via Storybook MCP (not a harness-route URL).
- No step ever mentions `renderer: "playwright"`, `harnessCommand`, or `harnessUrl`.

- [ ] **Step 5: Record the outcome**

If any of the above deviates from expectation, that's a regression from Tasks 1–6 — file it against the relevant task's edit before proceeding to Task 8. No commit either way; this task only validates.

---

### Task 8: Manual dry run — Playwright renderer (new path)

Validates the actual new behavior end-to-end: config validation, harness scaffolding, and the fidelity-playwright gate. Requires an interactive Claude Code session. No commit at the end.

**Files:** none (validates in a scratch repo outside this plugin)

- [ ] **Step 1: Scaffold a scratch React + Playwright app (no Storybook)**

```bash
npm create vite@latest ui-tdd-playwright-scratch -- --template react-ts
cd ui-tdd-playwright-scratch
npm install
npm install react-router-dom
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @playwright/test
npx playwright install --with-deps chromium
```

- [ ] **Step 2: Add the config file**

Create `.claude/ui-component-tdd.json`:
```json
{
  "componentsDir": "src/components",
  "tokensStylesheet": "src/index.css",
  "testCommand": "npx vitest run",
  "typecheckCommand": "npx tsc --noEmit",
  "renderer": "playwright",
  "harnessCommand": "npm run dev",
  "harnessUrl": "http://localhost:5173"
}
```

- [ ] **Step 3: Install the plugin from this local repo**

Inside a Claude Code session in the scratch repo:
```
/plugin marketplace add C:\Users\cecil\repo\ui-component-tdd
/plugin install ui-component-tdd@tomdavis
```

- [ ] **Step 4: Run the workflow on a trivial component**

```
/ui-tdd Badge
```
Walk through all seven phases, signing off at both gates. Confirm specifically:
- Config validation does **not** ask for `storybookCommand`/`storybookUrl`/`storybookMcpUrl`.
- Phase 6 invokes `/ui-component-tdd:writing-component-playwright-harness`, scaffolds
  `src/harness/HarnessRoute.tsx` from the template (you'll need to manually add the
  `<Route path="/__harness/:component/:state" .../>` entry to `src/main.tsx` per the
  template's own instructions — confirm the workflow correctly asks you to do this rather
  than silently skipping it), and writes `Badge.harness.tsx`.
- Phase 7 dispatches via `/ui-component-tdd:fidelity-playwright`, starts `npm run dev`,
  and the verdict table's structural column is populated via a direct navigation to
  `http://localhost:5173/__harness/Badge/<state-id>` (not any MCP call).

- [ ] **Step 5: Record the outcome**

If config validation still requires Storybook keys, or phase 6/7 don't branch
correctly, that's a defect in Task 2 or Task 5 — go back and fix it, then
re-run this task. No commit either way; this task only validates.
