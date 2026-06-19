import { component, createRoot, fromTag, ion, MICROCLASS_MERGE, template } from "@rue/luent"
import { twMerge } from "tailwind-merge"

const $simpleOn = ion(false)
const $hierarchyRootOn = ion(false)
const $microOn = ion(false)

function SimpleBindings() {
  return component(
    <div
      id="simple-target"
      class={[
        "simple-base",
        () => ($simpleOn() ? "simple-on" : "simple-off"),
        {
          "simple-hot": () => $simpleOn(),
          "simple-cold": () => !$simpleOn(),
        },
      ]}
      style={{
        color: () => ($simpleOn() ? "rgb(255, 0, 0)" : "rgb(0, 0, 255)"),
        fontWeight: () => ($simpleOn() ? 700 : 400),
      }}
    >
      simple
    </div>
  )
}

function HierarchyLeaf(setup: { [key: string]: unknown }) {
  const { ...bindings } = fromTag(setup)
  return component(
    <div
      id="hierarchy-target"
      class={["class-leaf"]}
      style={{ backgroundColor: "rgb(1, 2, 3)" }}
      auto-bind={bindings}
    >
      hierarchy
    </div>
  )
}

function HierarchyMiddle(setup: { [key: string]: unknown }) {
  const { ...bindings } = fromTag(setup)
  return component(
    <HierarchyLeaf
      class={["class-middle"]}
      style={{ backgroundColor: "rgb(20, 20, 220)" }}
      auto-bind={bindings}
    />
  )
}

function HierarchyRoot() {
  return component(
    <HierarchyMiddle
      class={["class-root"]}
      style={{
        backgroundColor: () => ($hierarchyRootOn() ? "rgb(220, 20, 20)" : "rgb(20, 220, 20)"),
      }}
    />
  )
}

function MicroLeaf(setup: { [key: string]: unknown }) {
  const { ...bindings } = fromTag(setup)
  return component(
    <div
      id="micro-target"
      microclass={["px-2 py-2 text-blue-500 rounded-sm"]}
      auto-bind={bindings}
    >
      micro
    </div>
  )
}

function MicroMiddle(setup: { [key: string]: unknown }) {
  const { ...bindings } = fromTag(setup)
  return component(
    <MicroLeaf
      microclass={() => ($microOn() ? "px-6 py-1 text-red-500" : "px-6 py-1 text-green-500")}
      auto-bind={bindings}
    />
  )
}

function MicroRoot() {
  return component(<MicroMiddle microclass="px-8 py-6" />)
}

export function TestStylesBindings() {
  return component(
    <div>
      <button id="toggle-simple" on:click={() => ($simpleOn.value = !$simpleOn())}>
        toggle simple
      </button>
      <button id="toggle-hierarchy-root" on:click={() => ($hierarchyRootOn.value = !$hierarchyRootOn())}>
        toggle hierarchy root
      </button>
      <button id="toggle-micro" on:click={() => ($microOn.value = !$microOn())}>
        toggle micro
      </button>

      <SimpleBindings />
      <HierarchyRoot />
      <MicroRoot />
    </div>
  )
}

if (__TEST__) createRoot(TestStylesBindings, { provide: [[MICROCLASS_MERGE, twMerge]] }).mount("#root")
