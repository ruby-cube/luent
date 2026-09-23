
# Lifecycle Hooks

In Luent, lifecycles originate from dynamic view instances rather than components. Dynamic views are the views created by reactive [view control flow](/guide/view-control-flow).

Lifecycle hooks provide a way to run tasks at specific points within a view’s lifecycle.

Lifecycle hooks may take the form of: 
- [function hooks](#function-hooks) (e.g. `atMount(task)`) 
- [inline hooks](#inline-hooks) (e.g. `<div at:mount={task}/>`)

Inline hooks are useful when the lifecycle behavior belongs to a specific element or node. Function hooks should be used when the behavior belongs to the component or dynamic view.

:::details CODE SWITCH
**React:** `useEffect()`, `useLayoutEffect()`, cleanup

**Vue:** `onMounted()`, `onUnmounted()`, `onActivated()`, `onDeactivated()`

**Svelte:** `onMount()`, `onDestroy()`, `tick()`

**Solid:** `onMount()`, `onCleanup()`, `createEffect()`

**Angular:** `ngAfterViewInit`, `ngOnDestroy`, `afterNextRender()`
:::

<p align="right"><a href="#lifecycle-hooks" style="text-decoration: none">[top]</a></p>


## Hook Grammar

Hooks are formed compositionally by combining:
- a lifecycle transition (e.g. `mount`/`unmount`)
- a timing prefix that corresponds to a render-cycle phase (e.g. `before`/`at`/`after`)

```ns
beforeMount(/*...*/)
afterAttach(/*...*/)
atDetach(/*...*/)
```
```ts
beforeMount(/*...*/)
afterAttach(/*...*/)
atDetach(/*...*/)
```

```nsx
<div before:mount={/*...*/}></div>
<div after:attach={/*...*/}></div>
<div at:detach={/*...*/}></div>
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

```ns
atAttach(initial => {
  if (initial) ...
})

atDetach(final => {
  if (final) ...
})

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

:::details CODE SWITCH
**React:** `useLayoutEffect()`; `useEffect()`

**Vue:** `onBeforeUpdate()`, `onUpdated()`, `nextTick()`

**Svelte:** `tick()`

**Angular:** `afterNextRender()`, `afterRenderEffect()`
:::

<p align="right"><a href="#lifecycle-hooks" style="text-decoration: none">[top]</a></p>



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

```ns
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

<p align="right"><a href="#lifecycle-hooks" style="text-decoration: none">[top]</a></p>



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

```nsx
<input
  at:mount={node => node.indeterminate = true}
/>
```

```tsx
<input
  at:mount={node => node.indeterminate = true}
/>
```

```nsx
<div
  after:attach={node => node.scrollIntoView()}
></div>
```
```tsx
<div
  after:attach={node => node.scrollIntoView()}
></div>
```

:::details CODE SWITCH

**Svelte:** `use:` actions

**Solid:** `ref` attribute

:::

<p align="right"><a href="#lifecycle-hooks" style="text-decoration: none">[top]</a></p>
