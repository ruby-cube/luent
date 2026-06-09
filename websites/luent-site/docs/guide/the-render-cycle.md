<!-- # The Render Cycle

The render cycle coordinates when reactive effects and scheduled tasks run for a single update.

This gives you predictable timing for:

- data synchronization
- DOM writes
- layout reads
- post-render follow-up work

## Render cycle phases

A render cycle progresses through these phases in the following order:

**Update cycle**

1. Sync
2. Prelude
3. Render
4. Layout

**Post-update**

5. Tick

:::info NOTE
If effects are triggered or tasks scheduled during any of the update phases, the render cycle will loop through the update phases until there are no more effects or tasks.
:::


### The Sync phase
The sync phase runs synchronously with the reactive mutation.

Use it sparingly (see note) to run effects that synchronize data.

```tsx
track($count, () => {
   $double.value = $count() * 2
}, { phase: SYNC })
```
:::info NOTE
The above example is for demonstration purposes only. Derivations are strongly preferred over manual syncing. However, some edge cases may require manual syncing.
:::

### The Prelude phase
The prelude phase runs before rendering starts.

Use it to schedule tasks and effects that synchronize data. (TODO: runs after all synchronous mutations have run, prevents running tasks and effects extraneously)

Unless an update is marked as instant, the prelude phase is interruptible to prevent blocking renders of urgent updates such as animations.

```tsx
// TODO: Better example?
track($list, () => {
  // EXAMPLE?
}, { phase: PRELUDE })
```
```tsx
atPrelude(() => {
  // EXAMPLE
})
```

### The Render phase
The render phase is where DOM manipulation takes place.

Use it for DOM mutation tasks and effects. 

Once the render phase begins, the update is committed and the render cycle can no longer be interrupted by other updates.

```tsx
// TODO: Better example?
track(???, () => {
  el.focus()
}, { phase: RENDER })
```
```tsx
  // TODO: Better example?
atRender(() => {
   const el = $panel()
   if (el) el.style.opacity = '1'
})
```

### The Layout phase
The layout phase runs after the render phase.

Use it to batch layout reads to reduce layout thrashing.

```tsx
atLayout(() => {
   const height = $div()?.getBoundingClientRect().height
   if (height != null) $height.value = height
})
```

### The Tick phase
The tick phase runs after render cycle work is complete.

Use it for post-render tasks such as API calls, logging, and other non-UI follow-up work.

```tsx
atTick(() => {
   saveDraft($form())
})
```

## Scheduling Tasks

- `atPrelude(task)`
- `atRender(task)`
- `atLayout(task)`
- `atTick(task)`
- `queueTask(task)`

### `queueTask`
`queueTask` is a thin wrapper over `Scheduler.postTask()`.

Use it when you want to schedule a task without binding it to a specific render-cycle phase.

```tsx
queueTask(() => {
   console.log('scheduled task')
})
```

## Scheduling Effects

`track` supports phase selection, so most timing concerns can be handled directly at the effect level.

```tsx
track($count, () => {
   console.log('count changed:', $count())
}, { phase: PRELUDE })
```

## Reactive Schedulers
- `queueIonicPrelude(task)`
- `queueIonicRender(task)`
- `queueIonicLayout(task)`
- `queueIonicTask(task)`
- Should there be `queueIonicTick`?? Should it replace `queueIonicTask`??

## Effect Cleanup
See [Cleanup]() -->


# The Render Cycle

The render cycle coordinates when reactive effects and scheduled tasks run during an update. 

Render cycle phases give you predictable timing for:

- data synchronization
- DOM writes
- layout reads
- post-render follow-up work

## Render Cycle Phases

A render cycle progresses through these phases in the following order:

**Update Phases**

1. Sync
2. Prelude
3. Render
4. Layout

**Post-Update**

5. Tick

:::info NOTE
If effects are triggered or tasks scheduled during any update phase, the render cycle continues looping through the update phases until no additional work remains.
:::

In a typical application, most tasks and effects are post-update work.


## The Sync Phase

The sync phase runs synchronously after a reactive mutation. It is for data synchronization that cannot be expressed as a derivation, such as external data.

```tsx
track($selection, () => {
  editor.setSelection($selection())
}, { phase: SYNC })
```

:::warning Use mindfully
Derivations are preferred over manual synchronization as it is less bug-prone across code edits. Use derivations whenever possible.

Because sync effects run immediately, excessive work in this phase may block rendering and reduce responsiveness. If the data does not need to be updated immediately, prefer the prelude phase or the tick phase.
:::


## The Prelude Phase

The prelude phase runs before rendering begins. It is for synchronizing data needed by the upcoming render. 

```tsx
track($documents, () => {
  searchIndex.update($documents())
}, { phase: PRELUDE })
```

```tsx
atPrelude(() => {
  preloadUserProfile($userId())
})
```
Unlike sync phase tasks, prelude tasks run after all synchronous mutations have completed, meaning tasks run once per mutation batch rather than per mutation. This is preferred for runtime efficiency in cases of non-urgent data synchronization.

Unless an update is marked as instant, the prelude phase is interruptible so that higher-priority updates, such as animations or user interactions, may render first.

## The Render Phase

The render phase performs DOM mutation work. It is used to schedule tasks that directly modify DOM nodes.

Once the render phase begins, the update is considered committed and can no longer be interrupted by newer updates.

```tsx
trackEffect.atRender(() => {
  if ($open()) {
    $dialog()?.focus()
  }
})
```
```tsx
atRender(() => {
  const el = $panel()
  if (el) el.style.opacity = '1'
})
```

## The Layout Phase

The layout phase runs after the render phase. It is for layout-dependent reads such as element measurements, scroll positions, and geometry calculations. Batching layout reads separately from DOM writes helps reduce layout thrashing and allows measurements to reflect the latest rendered state.

```tsx
atLayout(() => {
  const height = $panel()?.getBoundingClientRect().height

  if (height != null) {
    $height.value = height
  }
})
```


## The Tick Phase

The tick phase runs after update-cycle work has completed and the update has been painted. It is for follow-up work that does not affect the current visual update such as persisting data, logging, analytics, and network requests.

Because the tick phase occurs after rendering completes, it does not delay visual updates.

```tsx
atTick(() => {
  saveDraft($form())
})
```

## Scheduling Tasks

Tasks are scheduled for phases of the current render cycle with the following:

- `atPrelude(task)`
- `atRender(task)`
- `atLayout(task)`
- `atTick(task)`


<!-- - `queueTask(task)`

## `queueTask`

`queueTask()` is a thin wrapper over the browser `Scheduler.postTask()` API.

Use it when work should be scheduled independently of the render cycle.

```tsx
queueTask(() => {
  console.log('scheduled task')
})
``` -->


## Scheduling Effects

`track()` defaults to running effects in the tick phase. To schedule the effect for a different phase, pass in the phase option with one of the provided constants: `SYNC`, `PRELUDE`, `RENDER`, `LAYOUT`.

```tsx
track($documents, () => {
  searchIndex.update($documents())
}, { phase: PRELUDE })
```


## Scheduling Tracked Effects

Tracked effects run during the specified phase and automatically re-run when their dependencies change. `trackEffect()` without a phase modifier defaults to the tick phase.

- `trackEffect.atPrelude(effect)`
- `trackEffect.atRender(effect)`
- `trackEffect.atLayout(effect)`
- `trackEffect(effect)`



## Effect Cleanup

See [Cleanup]().