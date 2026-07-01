// Copy to <componentsDir>/<Component>/<Component>.harness.tsx and rename
// `YourComponent` to the real component. One entry per States-table id from
// <Component>.spec.md -- the same ids used by the mockups and by state:<id>
// tests.
import { YourComponent } from "./YourComponent";

export const states: Record<string, JSX.Element> = {
  default: <YourComponent>Label</YourComponent>,
  // <id>: <YourComponent ...props for that state />,
};
