import { makeComponent } from "packages/luent/src/component/Component";

export function RenderComponent(Component: (setup?: object) => any, setup: any, children: Record<any, any>) {
  // TODO: check this logic
  return () => {
    delete setup.children
    setup.Slot = children ?? setup.Slot;
    return makeComponent(Component, setup)
  }
}