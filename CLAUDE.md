# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

This is the source for the **`ui-component-tdd` Claude Code plugin** — a marketplace-distributed
plugin (see `.claude-plugin/marketplace.json` and `.claude-plugin/plugin.json`) consisting entirely
of skill/command Markdown prompts. There is no application code, no package.json, and no
build/lint/test tooling in this repo itself — everything here is instructions consumed by Claude
Code, not source that compiles or runs. "Testing" this repo means reading the prompts for
correctness/consistency, not running a test suite.

When editing, you are editing the *instructions* another Claude instance will follow in a
*different* (consumer) repo — keep that separation in mind: this repo's own files never contain
React components, tokens stylesheets, or test commands themselves; those are all placeholders
referring to values from the consumer repo's config file.

## Repo structure

```
.claude-plugin/
  plugin.json           # plugin metadata (name, description, keywords)
  marketplace.json       # marketplace entry, points source at "./"
commands/
  ui-tdd.md              # /ui-tdd command: orchestrates the 7-phase workflow end-to-end
skills/
  writing-component-specs/               # Phase 1a — spec-template.md
  writing-component-mockups/             # Phase 1b — mockup-template.html
  reviewing-component-design/            # Gate 1 — design-reviewer.md (subagent prompt)
  writing-component-playwright-harness/  # Phase 6 (renderer: playwright) — harness-route-template.tsx, harness-fixture-template.tsx
  fidelity-storybook/                    # Gate 2 (renderer: storybook) — fidelity-reviewer.md (subagent prompt)
  fidelity-playwright/                   # Gate 2 (renderer: playwright) — fidelity-reviewer.md (subagent prompt)
```

Each skill directory has a `SKILL.md` (the skill definition Claude Code loads) and, where
relevant, a template or reviewer-prompt file that the skill or command fills in with `{PLACEHOLDER}`
values before dispatching a subagent.

## Architecture: how the pieces fit together

The plugin enforces a **design-first TDD workflow** for React UI components in the *consumer*
repo, split into 7 ordered phases with 2 hard human sign-off gates. `commands/ui-tdd.md` is the
top-level orchestrator; it calls out to the six skills in order (branching on `renderer` for two of them) and refuses to skip phases:

1. **AUTHOR** — `writing-component-specs` produces `<Component>.spec.md` (a States table with
   stable kebab-case ids + Gherkin `US-N` stories); `writing-component-mockups` produces one
   self-contained `mockups/<state-id>.html` per state (linking the consumer repo's tokens
   stylesheet, no JS, no component/module-CSS imports).
2. **GATE 1 (design review)** — `reviewing-component-design` dispatches a `general-purpose`
   subagent using `design-reviewer.md` as the prompt template (filled with `{COMPONENT}`,
   `{SPEC_PATH}`, `{MOCKUPS_DIR}`), surfaces its PASS/GAPS verdict, then **stops for human
   sign-off**. No test or production code may exist before this gate passes.
3. **RED → GREEN → REFACTOR** — standard TDD (delegates to `superpowers:test-driven-development`),
   except every state id and story id must map to a named test (`state:<id>`, `US-N:`).
4. **PREVIEW** — depends on the `renderer` config key. `renderer: "storybook"` writes one Storybook story per state id. `renderer: "playwright"` writes one `<Component>.harness.tsx` fixture entry per state id via `writing-component-playwright-harness` (see phase 5 below for the harness route it depends on).
5. **GATE 2 (fidelity review)** — depends on the `renderer` config key. `fidelity-storybook`
   starts the consumer's Storybook, dispatches a subagent using `fidelity-reviewer.md`
   (structural comparison via Storybook MCP `preview-stories` + visual comparison via
   Playwright screenshots). `fidelity-playwright` starts the consumer's dev server instead,
   and its subagent drives Playwright directly against a dev-only harness route
   (`<harnessUrl>/__harness/<Component>/<state-id>`, scaffolded once per project by
   `writing-component-playwright-harness`) for both structural and visual comparison — no
   MCP endpoint needed. Either way, the subagent surfaces a per-state `structure | visual`
   table, then **stops for human sign-off**.

Key invariant threaded through every skill: **the subagent advises, the human decides.** A skill
that treats a subagent's PASS/MATCH verdict as sufficient to proceed is violating the design —
every gate is a hard stop for explicit human sign-off, and this is called out explicitly in each
SKILL.md's "Red flags" section.

## The consumer-repo config contract

Every skill and the `/ui-tdd` command independently read `.claude/ui-component-tdd.json` from the
*consumer* repo root as their first step, and hard-stop if it's missing. `componentsDir`,
`tokensStylesheet`, `testCommand`, `typecheckCommand`, and `renderer` are always required;
`renderer` (`"storybook"` or `"playwright"`) selects which further keys are required —
`<storybookCommand>`, `<storybookUrl>`, `<storybookMcpUrl>` for storybook, or `<harnessCommand>`,
`<harnessUrl>` for playwright
(see README.md section 3 for the full shape). When editing skill files, preserve this
config-read-first pattern — it's duplicated intentionally across every skill rather than factored
out, since each skill can be invoked independently of the `/ui-tdd` orchestrator.

## Editing conventions for this repo

- Skill/command prose is directive and terse (imperative "Iron Law" statements, rationalization
  tables, red-flag lists) — match that style rather than writing softer prose.
- Placeholders in template files use `{UPPER_SNAKE}` (reviewer prompts) or `{{UPPER_SNAKE}}`
  (mockup-template.html) — keep the existing convention within a given file rather than mixing.
- Skill names and the command are invoked with the `plugin-name:skill-name` form, e.g.
  `/ui-component-tdd:writing-component-specs`, `/ui-tdd <ComponentName>` — keep README and SKILL.md
  cross-references consistent with this naming.
