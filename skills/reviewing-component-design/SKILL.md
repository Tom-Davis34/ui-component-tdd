---
name: reviewing-component-design
description: Use when component mockups and spec are drafted and you are tempted to start writing tests or implementation code
---

# Reviewing Component Design (Gate #1)

## Overview

The design gate. Before any test or production code exists, a review subagent
audits the spec and mockups for completeness, testability, and consistency, and
**the human signs off**.

**Core principle:** You do not know what to build until the states and stories
are reviewed.

**Violating the letter of the rules is violating the spirit of the rules** — "I
already know what it looks like" is exactly the assumption this gate exists to
catch.

**REQUIRED BACKGROUND:** superpowers:test-driven-development.
**Pattern:** superpowers:requesting-code-review — dispatch a reviewer with
crafted context, never your session history.

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

## The Iron Law

```
NO TEST OR PRODUCTION CODE UNTIL THIS GATE IS SIGNED OFF.
```

Wrote a test or component before sign-off? Delete it. Start from the spec.

## Process

1. Confirm the artifacts exist: `<componentsDir>/<Component>/<Component>.spec.md`
   and one `<componentsDir>/<Component>/mockups/<state>.html` per States-table id.
2. Dispatch a `general-purpose` review subagent, filling design-reviewer.md
   with `{COMPONENT}`, `{SPEC_PATH}`, `{MOCKUPS_DIR}`.
3. Surface the subagent's verdict and any gaps to the human **verbatim**.
4. **STOP. Ask the human to sign off.** Do not proceed on the subagent's PASS
   alone — the subagent advises; the human decides.
5. Gaps → revise the spec/mockups → re-dispatch the reviewer. Repeat until the
   human signs off.

## Rationalization table

| Excuse | Reality |
|--------|---------|
| "The component is simple" | Simple components still have empty/error/loading states. The review takes minutes. |
| "I already know what it looks like" | Then writing the states down and having them reviewed costs you nothing — and catches the ones you forgot. |
| "I'll review as I go" | Review-as-you-go is no review. The gate is before code so rework is cheap. |
| "The deadline is tight" | Building the wrong states is what blows deadlines. The gate is the fast path. |
| "Tests will catch gaps" | Tests written from an incomplete spec test incomplete behaviour. |

## Red flags — STOP

- About to write `<Component>.tsx` or `<Component>.test.tsx` with no signed-off
  review.
- "I'll add the loading/empty/error state later."
- Treating the subagent's PASS as the gate (the human signs off).
- Editing the spec to match code you already wrote.

All of these mean: stop, run the gate, get sign-off.
