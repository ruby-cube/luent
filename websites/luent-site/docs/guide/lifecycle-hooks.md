
# Lifecycle Hooks

In Luent, lifecycles originate from dynamic view instances rather than components. Dynamic views are the views created by reactive [view control flow](/guide/view-control-flow).

Lifecycle hooks provide a way to run tasks at specific points within a view’s lifecycle.

Lifecycle hooks may take the form of: 
- [function hooks](#function-hooks) (e.g. `atMount(task)`) 
- [inline hooks](#inline-hooks) (e.g. `<div at:mount={task}/>`)

Inline hooks are useful when the lifecycle behavior belongs to a specific element or node. Function hooks should be used when the behavior belongs to the component or dynamic view.

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
<div before:mount={/*...*/}></div>
<div after:attach={/*...*/}></div>
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
| `remount` | restored attach† |
| `demount` | temporary detach† |
| `unmount` | final detach |

<small>† for [preserved views](/guide/preserving-views)</small>

#### Attach and Detach
- Use attach hooks to run tasks at both the initial mount and recurring remounts of preserved views. Attach-hook tasks receive an `initial` argument that is `true` if it is the intial mount and `false` otherwise.
- Use detach hooks to run tasks at both recurring demounts of preserved views and the final unmount. Detach-hook tasks receive an `final` argument that is `true` if it is the final unmount and `false` otherwise.

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
| `before` | prelude/sync | ... created, not yet rendered |
| `at` | render | ... rendered, not yet painted |
| `after` | tick | ... painted |

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


## Inline Hooks

All available inline hooks:

**Umbrella hooks**
| Phase | sync / prelude | render | tick |
|---|---|---|---|
| attach | `before:attach` | `at:attach` | `after:attach` |
| detach | `before:detach` | `at:detach` | `after:detach` |

**Primitive hooks**
| Phase | sync / prelude | render | tick |
|---|---|---|---|
| mount | `before:mount` | `at:mount` | `after:mount` |
| remount | `before:remount` | `at:remount` | `after:remount` |
| demount | `before:demount` | `at:demount` | `after:demount` |
| unmount | `before:unmount` | `at:unmount` | `after:unmount` |

### Examples

Inline hook callbacks receive the associated DOM node.

```tsx
<input
  at:mount={node => node.indeterminate = true}
/>
```

```tsx
<div
  after:attach={node => node.scrollIntoView()}
></div>
```