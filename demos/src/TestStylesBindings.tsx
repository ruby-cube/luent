import { component, mount, FromTag, ion, MICROCLASS_MERGE, template, provideRoot } from "@rue/luent"
import { twMerge } from "tailwind-merge"

const $simpleOn = ion(false)
const $hierarchyRootOn = ion(false)
const $microOn = ion(false)

function SimpleBindings() {
  return (

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

function HierarchyLeaf(setup: FromTag<{ [key: string]: unknown }>) {
  const { ...bindings } = setup
  return (

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

function HierarchyMiddle(setup: FromTag<{ [key: string]: unknown }>) {
  const { ...bindings } = setup
  return (

    <HierarchyLeaf
      class={["class-middle"]}
      style={{ backgroundColor: "rgb(20, 20, 220)" }}
      auto-bind={bindings}
    />
  )
}

function HierarchyRoot() {
  return (

    <HierarchyMiddle
      class={["class-root"]}
      style={{
        backgroundColor: () => ($hierarchyRootOn() ? "rgb(220, 20, 20)" : "rgb(20, 220, 20)"),
      }}
    />
  )
}

function MicroLeaf(setup: FromTag<{ [key: string]: unknown }>) {
  const { ...bindings } = setup
  return (

    <div
      id="micro-target"
      microclass={["px-2 py-2 text-blue-500 rounded-sm"]}
      auto-bind={bindings}
    >
      micro
    </div>
  )
}

function MicroMiddle(setup: FromTag<{ [key: string]: unknown }>) {
  const { ...bindings } = setup
  return (

    <MicroLeaf
      microclass={() => ($microOn() ? "px-6 py-1 text-red-500" : "px-6 py-1 text-green-500")}
      auto-bind={bindings}
    />
  )
}

function MicroRoot() {
  return <MicroMiddle microclass="px-8 py-6" />
}

export function TestStylesBindings() {
  return (

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

if (__TEST__) mount(() => {
  provideRoot(MICROCLASS_MERGE, twMerge)
  return TestStylesBindings()
}, "#root")
