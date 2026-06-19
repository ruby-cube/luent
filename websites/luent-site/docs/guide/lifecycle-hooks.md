<!-- # Lifecycle Hooks
In Luent, lifecycle hooks are associated with dynamic views produced by template control flow rather than components. They provide a way to run tasks at certain points of a dynamic view's lifecycle. 

Luent exposes lifecycle hooks compositionally. Hooks are formed by combining a lifecycle transition with a render-cycle phase.

**General lifecycle transitions**
- mount: the view is appended to the DOM
- unmount: the view is removed from the DOM

**Fine-grained lifecycle transitions**
- install: initial mount
- remount: restored mount
- demount: temporary unmount
- uninstall: final unmount

**Render-cycle phases**
- sync/prelude: before render
- render
- tick: after render


beforeMount(task: () => void)
beforeRemount(task: () => void)
beforeAttach(task: (initial: boolean) => void)
beforeUnmount(task: () => void)
beforeDemount(task: () => void)
beforeDetach(task: (final: boolean) => void)

atMount(task: () => void)
atRemount(task: () => void)
atAttach(task: (initial: boolean) => void)
atUnmount(task: () => void)
atDemount(task: () => void)
atDetach(task: (final: boolean) => void)

afterMount(task: () => void)
afterRemount(task: () => void)
afterAttach(task: (initial: boolean) => void)
afterUnmount(task: () => void)
afterDemount(task: () => void)
afterDetach(task: (final: boolean) => void)


<div at:mount={node => node.focus()}></div>

pre:mount
pre:attach
pre:remount

at:mount
at:attach
at:remount

post:mount
post:attach
post:remount

pre:unmount
pre:detach
pre:demount

at:demount
at:detach
at:unmount

post:demount
post:detach
post:unmount -->






<!-- 
# Lifecycle Hooks

In Luent, lifecycles are tied to dynamic view instances rather than component instances. Dynamic views are created through the render functions of reactive [template control flow](/guide/template-control-flow).

Lifecycle hooks provide a way to run tasks at specific points within a view’s lifecycle.


## Lifecycle Grammar

Luent exposes lifecycle hooks compositionally. Hooks are formed by combining:

- a lifecycle transition
- a render-cycle phase

For example:

```ts
beforeMount()
atAttach()
afterDetach()
```

Template hooks follow the same pattern:

```tsx
<div pre:mount={...}></div>
<div at:attach={...}></div>
<div post:detach={...}></div>
```


## Lifecycle Transitions

#### General lifecycle transitions

General lifecycle transitions describe whether a view is currently mounted to the DOM.

**`mount`**
The view is appended to the DOM.

**`unmount`**
The view is removed from the DOM.

General transitions are useful when logic should run regardless of whether the view is newly installed or restored from preservation.


#### Fine-grained lifecycle transitions

Fine-grained transitions distinguish between initial mounts, preserved remounts, temporary removals, and final removals.

**`install`**
The view mounts for the first time.

**`remount`**
A previously preserved view is mounted again.

**`demount`**
The view is temporarily removed from the DOM while preserving its state and DOM nodes.

**`uninstall`**
The view is permanently removed and discarded.

These transitions are primarily useful when working with preserved views through `<v-preserve>` or remount-enabled control flow.


## Render-Cycle Phases

Each lifecycle transition may run during one of three render-cycle phases.

**`pre`**
Runs during the synchronous/prelude phase before rendering occurs.

This phase is useful for preparing state or synchronizing data before the DOM updates.

```ts
beforeAttach(() => {
  console.log('about to mount')
})
```

```tsx
<div pre:mount={node => prepareNode(node)}></div>
```

---

**`at`**
Runs during the render phase after the lifecycle transition has occurred.

At this point, DOM nodes exist and mount/unmount operations have been applied.

This phase is useful for interacting with nodes immediately during rendering.

```ts
atMount(() => {
  console.log('view installed')
})
```

```tsx
<div at:attach={node => node.focus()}></div>
```

---

**`post`**
Runs during the tick phase after rendering has completed.

This phase is useful for tasks that should occur after the DOM has settled, such as measurements, animations, scrolling, or third-party integrations.

```ts
afterAttach(() => {
  console.log('mount completed')
})
```

```tsx
<div post:attach={node => startAnimation(node)}></div>
```

---

## Lifecycle Hierarchy

General transitions are unions of fine-grained transitions.

```txt
mount
├─ install
└─ remount

unmount
├─ demount
└─ uninstall
```

This means:

```ts
beforeAttach()
```

runs for both:
- `install`
- `remount`

while:

```ts
beforeMount()
```

runs only during the initial mount.

Similarly:

```ts
afterDetach()
```

runs for both:
- `demount`
- `uninstall`

while:

```ts
afterUnmount()
```

runs only during final disposal.

---

## Function Hooks

Lifecycle hooks may be declared imperatively within component or kit logic.

```ts
beforeMount(() => {
  console.log('first mount')
})

atRemount(() => {
  console.log('view restored')
})

afterDetach(() => {
  console.log('view removed')
})
```

---

## Template Hooks

Lifecycle hooks may also be attached directly to elements within templates.

```tsx
<input
  at:mount={node => {
    node.indeterminate = true
  }}
/>
```

```tsx
<div
  post:attach={node => {
    node.scrollIntoView()
  }}
></div>
```

Template hooks receive the associated DOM node as their first argument. -->


# Lifecycle Hooks

In Luent, lifecycles are tied to dynamic view instances rather than components. Dynamic views are the views created by reactive [template control flow](/guide/template-control-flow).

Lifecycle hooks provide a way to run tasks at specific points within a view’s lifecycle.

Lifecycle hooks may take the form of: 
- [function hooks](#function-hooks) (e.g. `atMount(task)`) 
- [template hooks](#template-hooks) (e.g. `<div at:mount={task}/>`)

## Hook Grammar

Hooks are formed compositionally by combining:
- a lifecycle transition (e.g. `mount`/`unmount`)
- a timing prefix that corresponds to a render-cycle phase (e.g. `before`/`at`/`after`)

```ts
beforeMount(/*...*/)
afterAttach(/*...*/)
atDetach(/*...*/)
```

```tsx
<div pre:mount={/*...*/}></div>
<div post:attach={/*...*/}></div>
<div at:detach={/*...*/}></div>
```


### Lifecycle Transitions

#### Umbrella transitions

| Transition | Description |
|---|---|
| `attach` | view enters the DOM |
| `detach` | view leaves the DOM |

#### Primitive transitions

| Transition | Description |
|---|---|
| `mount` | initial attach |
| `remount` | restored attach |
| `demount` | temporary detach |
| `unmount` | final detach |


#### Attach and Detach
- Use attach hooks to run tasks at both the initial mount and recurring remounts. Attach-hook tasks receive an `initial` argument that is `true` if it is the intial mount and `false` otherwise.
- Use detach hooks to run tasks at both recurring demounts and the final unmount. Detach-hook tasks receive an `final` argument that is `true` if it is the final unmount and `false` otherwise.

```txt
attach
├─ mount
└─ remount

detach
├─ demount
└─ unmount
```

```ts
atAttach(initial => {
  if (initial) ...
})

atDetach(final => {
  if (final) ...
})

```

### Hook timing

| Syntax | Render-cycle phase | View has been ... |
|---|---|---|
| `before`/`pre` | prelude/sync | ... created, not yet rendered |
| `at` | render | ... rendered, not yet painted |
| `after`/`post` | tick | ... painted |

See [The Render Cycle](/guide/the-render-cycle) to understand phase timing and usage.


## Function Hooks

All available function hooks:

**Umbrella hooks**
| Phase | sync / prelude | render | tick |
|---|---|---|---|
| attach | `beforeAttach()` | `atAttach()` | `afterAttach()` |
| detach | `beforeDetach()` | `atDetach()` | `afterDetach()` |

**Primitive hooks**
| Phase | sync / prelude | render | tick |
|---|---|---|---|
| mount | `beforeMount()` | `atMount()` | `afterMount()` |
| remount | `beforeRemount()` | `atRemount()` | `afterRemount()` |
| demount | `beforeDemount()` | `atDemount()` | `afterDemount()` |
| unmount | `beforeUnmount()` | `atUnmount()` | `afterUnmount()` |


**Examples**

```ts
beforeMount(() => {
  console.log('the view is created but not yet mounted')
})

atAttach(() => {
  console.log('the view is attach but not painted')
})

afterDetach(() => {
  console.log('the detach has been painted')
})
```


## Template Hooks

All available template hooks:

**Umbrella hooks**
| Phase | sync / prelude | render | tick |
|---|---|---|---|
| attach | `pre:attach` | `at:attach` | `post:attach` |
| detach | `pre:detach` | `at:detach` | `post:detach` |

**Primitive hooks**
| Phase | sync / prelude | render | tick |
|---|---|---|---|
| mount | `pre:mount` | `at:mount` | `post:mount` |
| remount | `pre:remount` | `at:remount` | `post:remount` |
| demount | `pre:demount` | `at:demount` | `post:demount` |
| unmount | `pre:unmount` | `at:unmount` | `post:unmount` |

### Examples

Template hook tasks receive the associated DOM node.

```tsx
<input
  at:mount={node => node.indeterminate = true}
/>
```

```tsx
<div
  post:attach={node => node.scrollIntoView()}
></div>
```