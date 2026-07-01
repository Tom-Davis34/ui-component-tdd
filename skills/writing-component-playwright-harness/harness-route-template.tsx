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
