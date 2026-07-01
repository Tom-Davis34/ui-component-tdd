---
name: fidelity-storybook
description: Use when a component implementation passes its tests and you are about to call it done
---

# Comparing Mockups to Storybook (Gate #2)

## Overview

The fidelity gate. Passing tests prove behaviour, not appearance. Before "done",
a subagent compares every rendered story to its mockup — structure and visuals —
and **the human signs off**.

**Core principle:** Passing tests is not done. The rendered component matching
its mockups is done.

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

## The Iron Law

```
NOT DONE UNTIL THIS GATE IS SIGNED OFF.
```

## Process

1. Confirm `<componentsDir>/<Component>/<Component>.stories.tsx` has one story
   per state id, and a `<componentsDir>/<Component>/mockups/<id>.html` exists
   for each.
2. Start Storybook: `<storybookCommand>` (serves stories and the MCP endpoint at
   `POST <storybookMcpUrl>`). Wait until
   `curl --fail <storybookUrl>/index.json` succeeds.
3. Dispatch a `general-purpose` subagent, filling fidelity-reviewer.md with the
   component, story title, mockups dir, Storybook URL, and MCP URL.
4. Surface the per-state table verbatim.
5. **STOP. Ask the human to sign off.** The subagent advises; the human decides.
6. `mismatch` → fix the **component** (not the mockup, unless the human rules the
   mockup wrong) → re-run the comparison. Repeat until the human signs off.

## Rationalization table

| Excuse | Reality |
|--------|---------|
| "The tests pass, so it's fine" | Tests assert behaviour, not spacing, colour, or layout. |
| "Close enough" | The mockup is the agreed target. "Close enough" is the human's call, not yours. |
| "I'll fix the spacing later" | Later never comes. Drift is cheapest to fix now, against the mockup. |
| "Storybook isn't running" | Start it: `<storybookCommand>`. The gate is not optional because setup is mild effort. |
| "Just compare the screenshots" | Structure matters too — wrong roles/labels pass a visual glance and fail users. |

## Red flags — STOP

- Marking done with no signed-off fidelity report.
- Comparing visuals only, skipping the structural (Storybook MCP) check.
- Editing a mockup to match the component to force a pass (without human ruling).
- Treating the subagent's MATCH as the gate (the human signs off).
