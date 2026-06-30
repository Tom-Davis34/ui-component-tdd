Drive the design-first UI TDD workflow for a single React component: $ARGUMENTS

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

This command extends superpowers:test-driven-development with two gates. Follow
the phases in order. The gates are hard stops — the human signs off at each.

## Phases

1. **AUTHOR.** Create the component folder
   `<componentsDir>/<Component>/`. Using the `/ui-component-tdd:writing-component-specs`
   skill, write `<Component>.spec.md` (States table + Gherkin stories). Using the
   `/ui-component-tdd:writing-component-mockups` skill, write one `mockups/<state>.html` per state
   id.

2. **GATE #1 — design review.** Use the `/ui-component-tdd:reviewing-component-design` skill.
   Dispatch the design reviewer, surface its verdict, and STOP for the human's
   sign-off. **Write no test or production code until signed off.**

3. **RED.** Using superpowers:test-driven-development, write
   `<Component>.test.tsx` with **≥1 test per state id and ≥1 test per story id**,
   the id embedded in each test name (`state:<id>` / `US-N:`). Before moving on,
   verify the count: every States-table id and every `US-N` has a matching test.
   Run `<testCommand>` and watch the new tests FAIL.

4. **GREEN.** Write the minimal `<Component>.tsx` (+ `<Component>.module.css`,
   `index.ts` re-export) to pass. Run `<testCommand>` until green. Run
   `<typecheckCommand>`.

5. **REFACTOR.** Clean up; stay green.

6. **STORIES.** Write `<Component>.stories.tsx` with one story per state id.
   `<testCommand>` runs story play-tests in the Storybook browser project —
   keep it green.

7. **GATE #2 — fidelity review.** Use the `/ui-component-tdd:comparing-mockups-to-storybook`
   skill. Start `<storybookCommand>`, dispatch the fidelity reviewer (structural via
   Storybook MCP + visual via Playwright), surface the per-state table, and STOP
   for the human's sign-off. Fix the component on mismatch. **Not done until
   signed off.**

## Rules
- Existing flat components: migrate into the folder only when running this on
  them; add `index.ts` re-export so imports stay `components/<Component>`.
- Run everything through the project's configured commands, never raw npm/npx.
- Both gates: the subagent advises, the human signs off. Never auto-proceed.
