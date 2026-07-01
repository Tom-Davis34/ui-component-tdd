---
name: writing-component-specs
description: Use when defining what a React UI component must do before implementing it, capturing every visual state and every user interaction
---

# Writing Component Specs

## Overview

A component spec is the contract you test and review against. It has two parts:
a **States table** (every visual state the component can be in) and **Gherkin
stories** (every interaction a user can perform). Both carry ids.

**Core principle:** Every state and every interaction is written down with a
stable id, or it will not get a mockup, a test, or a review.

**REQUIRED BACKGROUND:** superpowers:test-driven-development — the spec is what
the failing tests in the RED phase are written from.

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

## The artifact: `<Component>.spec.md`

Copy spec-template.md and fill it in. Two sections, nothing else.

### States table

One row per visual state, each with a short kebab-case `id` and the `when` that
triggers it. The id is load-bearing: the mockup file is named `<id>.html` and at
least one test is named `state:<id>`.

Always ask whether these states apply — most components have several:
`default`, `loading`, `empty`, `error`, `disabled`, `focused`, `selected`,
`hover`. A spec with only `default` is almost always incomplete.

### Stories (Gherkin)

One `### US-N: <title>` per interaction. Exactly one `Given`, one `When`, and a
`Then` that names **one observable outcome** (a callback fired with specific
args, a rendered change, a role/text appearing). Add `And` lines for additional
observable outcomes. If a story needs interpretation to become one test, split
or sharpen it.

Cover the **error and edge** interactions, not just the happy path: empty
submit, invalid input, the action while `disabled`, cancel/escape.

## Quick reference

| Rule | Why |
|------|-----|
| Every state has an `id` | Names the mockup file and a test |
| Every interaction is one story | One story → one test |
| `Then` = one observable outcome | Keeps the test unambiguous |
| List loading/empty/error/disabled | The states agents forget |

## Common mistakes

- **Happy-path only.** No error/empty/loading states or stories. The design
  review (gate #1) will reject this — write them now.
- **Prose instead of Gherkin.** "It should let you rename" is not testable.
  Given/When/Then with one observable Then is.
- **Unstable or missing ids.** Without ids, nothing downstream can reference the
  state or story.
- **Multiple outcomes crammed into one Then.** Split into `And` lines or
  separate stories.

See spec-template.md for the copyable skeleton.
