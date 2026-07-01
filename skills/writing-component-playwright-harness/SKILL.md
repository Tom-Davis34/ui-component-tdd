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
