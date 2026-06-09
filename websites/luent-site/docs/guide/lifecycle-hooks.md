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


beforeInstall(task: () => void)
beforeRemount(task: () => void)
beforeMount(task: (initial: boolean) => void)
beforeUninstall(task: () => void)
beforeDemount(task: () => void)
beforeUnmount(task: (final: boolean) => void)

atInstall(task: () => void)
atRemount(task: () => void)
atMount(task: (initial: boolean) => void)
atUninstall(task: () => void)
atDemount(task: () => void)
atUnmount(task: (final: boolean) => void)

afterInstall(task: () => void)
afterRemount(task: () => void)
afterMount(task: (initial: boolean) => void)
afterUninstall(task: () => void)
afterDemount(task: () => void)
afterUnmount(task: (final: boolean) => void)


<div at:install={node => node.focus()}></div>

pre:install
pre:mount
pre:remount

at:install
at:mount
at:remount

post:install
post:mount
post:remount

pre:uninstall
pre:unmount
pre:demount

at:demount
at:unmount
at:uninstall

post:demount
post:unmount
post:uninstall -->






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
beforeInstall()
atMount()
afterUnmount()
```

Template hooks follow the same pattern:

```tsx
<div pre:install={...}></div>
<div at:mount={...}></div>
<div post:unmount={...}></div>
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

These transitions are primarily useful when working with preserved views through `<remount-view>` or remount-enabled control flow.


## Render-Cycle Phases

Each lifecycle transition may run during one of three render-cycle phases.

**`pre`**
Runs during the synchronous/prelude phase before rendering occurs.

This phase is useful for preparing state or synchronizing data before the DOM updates.

```ts
beforeMount(() => {
  console.log('about to mount')
})
```

```tsx
<div pre:install={node => prepareNode(node)}></div>
```

---

**`at`**
Runs during the render phase after the lifecycle transition has occurred.

At this point, DOM nodes exist and mount/unmount operations have been applied.

This phase is useful for interacting with nodes immediately during rendering.

```ts
atInstall(() => {
  console.log('view installed')
})
```

```tsx
<div at:mount={node => node.focus()}></div>
```

---

**`post`**
Runs during the tick phase after rendering has completed.

This phase is useful for tasks that should occur after the DOM has settled, such as measurements, animations, scrolling, or third-party integrations.

```ts
afterMount(() => {
  console.log('mount completed')
})
```

```tsx
<div post:mount={node => startAnimation(node)}></div>
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
beforeMount()
```

runs for both:
- `install`
- `remount`

while:

```ts
beforeInstall()
```

runs only during the initial mount.

Similarly:

```ts
afterUnmount()
```

runs for both:
- `demount`
- `uninstall`

while:

```ts
afterUninstall()
```

runs only during final disposal.

---

## Function Hooks

Lifecycle hooks may be declared imperatively within component or kit logic.

```ts
beforeInstall(() => {
  console.log('first mount')
})

atRemount(() => {
  console.log('view restored')
})

afterUnmount(() => {
  console.log('view removed')
})
```

---

## Template Hooks

Lifecycle hooks may also be attached directly to elements within templates.

```tsx
<input
  at:install={node => {
    node.indeterminate = true
  }}
/>
```

```tsx
<div
  post:mount={node => {
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
beforeInstall(...)
atMount(...)
afterUnmount(...)
```

```tsx
<div pre:install={...}></div>
<div at:mount={...}></div>
<div post:unmount={...}></div>
```


### Lifecycle Transitions

#### Umbrella transitions

| Transition | Description |
|---|---|
| `mount` | view enters the DOM |
| `unmount` | view leaves the DOM |

#### Primitive transitions

| Transition | Description |
|---|---|
| `install` | initial mount |
| `remount` | restored mount |
| `demount` | temporary unmount |
| `uninstall` | final unmount |


#### Mount and Unmount
- Use mount hooks to run tasks at both the initial install and recurring remounts. Mount tasks receive an `initial` argument that is `true` if it is the intial mount (install) and `false` otherwise.
- Use unmount hooks to run tasks at both recurring demounts and the final uninstall. Unmount tasks receive an `final` argument that is `true` if it is the final unmount (uninstall) and `false` otherwise.

```txt
mount
├─ install
└─ remount

unmount
├─ demount
└─ uninstall
```

```ts
atMount(initial => {
  if (initial) ...
})

atUnmount(final => {
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
| mount | `beforeMount()` | `atMount()` | `afterMount()` |
| unmount | `beforeUnmount()` | `atUnmount()` | `afterUnmount()` |

**Primitive hooks**
| Phase | sync / prelude | render | tick |
|---|---|---|---|
| install | `beforeInstall()` | `atInstall()` | `afterInstall()` |
| remount | `beforeRemount()` | `atRemount()` | `afterRemount()` |
| demount | `beforeDemount()` | `atDemount()` | `afterDemount()` |
| uninstall | `beforeUninstall()` | `atUninstall()` | `afterUninstall()` |


**Examples**

```ts
beforeInstall(() => {
  console.log('the view is created but not yet mounted')
})

atMount(() => {
  console.log('the view is mounted but not painted')
})

afterUnmount(() => {
  console.log('the unmount has been painted')
})
```


## Template Hooks

All available template hooks:

**Umbrella hooks**
| Phase | sync / prelude | render | tick |
|---|---|---|---|
| mount | `pre:mount` | `at:mount` | `post:mount` |
| unmount | `pre:unmount` | `at:unmount` | `post:unmount` |

**Primitive hooks**
| Phase | sync / prelude | render | tick |
|---|---|---|---|
| install | `pre:install` | `at:install` | `post:install` |
| remount | `pre:remount` | `at:remount` | `post:remount` |
| demount | `pre:demount` | `at:demount` | `post:demount` |
| uninstall | `pre:uninstall` | `at:uninstall` | `post:uninstall` |

**Examples**

Template hook tasks receive the associated DOM node.

```tsx
<input
  at:install={node => node.indeterminate = true}
/>
```

```tsx
<div
  post:mount={node => node.scrollIntoView()}
></div>
```