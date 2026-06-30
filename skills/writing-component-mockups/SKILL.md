---
name: writing-component-mockups
description: Use when producing the static HTML design target for each visual state of a React component before implementing it
---

# Writing Component Mockups

## Overview

A mockup is the **design target** for one visual state — the independent picture
the implemented component is later measured against at the fidelity gate. One
static HTML file per state id.

**Core principle:** One self-contained HTML file per state, expressing design
intent — not a copy of the component's styles.

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

## Rules

- **One file per state id.** The file name **is** the state id from the spec:
  `mockups/selected.html` for the `selected` state. Every state in the spec's
  States table gets a file; no extra files.
- **Link the tokens stylesheet, nothing else.** Link the tokens stylesheet — the
  relative path from `<componentsDir>/<Component>/mockups/<state>.html` up to
  `<tokensStylesheet>`. This gives you the same colours, spacing, and fonts as
  the real app, so the visual comparison is fair.
- **Never import `*.module.css`.** CSS Module class names are hashed at build;
  they do not exist in static HTML, and the whole point is that the component
  (with its module CSS) must match this independent target.
- **No React, no JS, no `<script>`.** A mockup is a still picture of one state.
- **Semantic HTML.** Use the real roles, labels, and text the component must
  render (`<button>`, `<input type="checkbox">`, a `role="alert"` for errors) —
  the structural half of the fidelity gate compares against these.

## Quick reference

| Rule | Value |
|------|-------|
| File name | `<state-id>.html` (matches a States-table id) |
| Tokens | relative href from mockup to `<tokensStylesheet>` |
| Module CSS | never |
| JS | never |
| States per file | exactly one |

## Common mistakes

- **Importing the component or its module CSS.** The mockup is independent.
- **Hard-coding colours/spacing** instead of the `var(--…)` tokens from
  `<tokensStylesheet>` — makes the visual comparison unfair.
- **Several states in one file.** Split — the fidelity gate pairs one file to
  one story by id.
- **Adding interactivity.** No JS; show the end state directly in markup.

See mockup-template.html for the copyable skeleton.
