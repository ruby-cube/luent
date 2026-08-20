# The Render Cycle

The render cycle coordinates when reactions and scheduled tasks run during an update.

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
If reactions are triggered or tasks scheduled during any update phase, the render cycle continues looping through the update phases until no additional work remains.
:::

In a typical application, most tasks and reactions are post-update work.

## The Sync Phase

The sync phase runs synchronously after a reactive mutation. It is for data synchronization that cannot be expressed as a derivation, such as external data.

```tsx
track(
  $selection,
  () => {
    editor.setSelection($selection());
  },
  { phase: SYNC },
);
```

:::warning Use mindfully
Derivations are preferred over manual synchronization as it is less bug-prone across code edits. Use derivations whenever possible.

Because synchronous reactions run immediately, excessive work in this phase may block rendering and reduce responsiveness. If the data does not need to be updated immediately, prefer the prelude phase or the tick phase.
:::

## The Prelude Phase

The prelude phase runs before rendering begins. It is for synchronizing data needed by the upcoming render.

```tsx
track($documents, () => {
  searchIndex.update($documents());
}, { phase: PRELUDE });
```

<!-- ```nsx
async {
  await prelude...:
    preloadUserProfile(userID)
}
``` -->

```tsx
queuePrelude(() => {
  preloadUserProfile($userId());
});
```

Unlike sync phase tasks, prelude tasks run after all synchronous mutations have completed, meaning tasks run once per mutation batch rather than per mutation. This is preferred for runtime efficiency in cases of non-urgent data synchronization.

Unless an update is marked as instant, the prelude phase is interruptible so that higher-priority updates, such as animations or user interactions, may render first.

## The Render Phase

The render phase performs DOM mutation work. It is used to schedule tasks that directly modify DOM nodes.

Once the render phase begins, the update is considered committed and can no longer be interrupted by newer updates.

```tsx
ionicRender(() => {
  if ($open()) {
    $dialog()?.focus();
  }
});
```

```tsx
queueRender(() => {
  const el = $panel();
  if (el) el.style.opacity = "1";
});
```

## The Layout Phase

The layout phase runs after the render phase. It is for layout-dependent reads such as element measurements, scroll positions, and geometry calculations. Batching layout reads separately from DOM writes helps reduce layout thrashing and allows measurements to reflect the latest rendered state.

```tsx
queueLayout(() => {
  const height = $panel()?.getBoundingClientRect().height;

  if (height != null) {
    $height.value = height;
  }
});
```

## The Tick Phase

The tick phase runs after update-cycle work has completed and the update has been painted. It is for follow-up work that does not affect the current visual update such as persisting data, logging, analytics, and network requests.

Because the tick phase occurs after rendering completes, it does not delay visual updates.

```tsx
awaitTick(() => {
  saveDraft($form());
});
```

## Scheduling Tasks

<div class='section-tags'>
<span class='doc-tag'>Experimental</span>
</div>

<!-- Tasks are scheduled for phases of the current render cycle with the following promises:

- `prelude`
- `render`
- `layout`
- `tick` -->

```tsx
function ChatApp() {
  // subscribe to stuff
  queueLayout(() => {
    // measure layout
  })
  queueRender(() => {
    // manipulate DOM
  })
  atUnmount(() => {
    // unsubscribe from stuff
  });
  
  return <>
    {/* view */}
  </>
}
```

```tsx
function ChatApp() {
  // subscribe to stuff

  beforeMount(() => {
    queueLayout(() => {
      // measure layout
    })
    queueRender(() => {
      // manipulate DOM
    })
  })

  atUnmount(() => {
    // unsubscribe from stuff
  });
  
  return <>
    {/* view */}
  </>
}
```

<!-- If you prefer `async/await` syntax, there are a few limitations:
-  

```tsx
function ChatApp() {
  // subscribe to stuff

  beforeMount(async () => {
    await layout
    // measure layout
    await render
    // manipulate DOM
  })

  atUnmount(() => {
    // unsubscribe from stuff
  });
  
  return <>
    {/* view */}
  </>
}
``` -->

<!-- - `queueTask(task)`

## `queueTask`

`queueTask()` is a thin wrapper over the browser `Scheduler.postTask()` API.

Use it when work should be scheduled independently of the render cycle.

```tsx
queueTask(() => {
  console.log('scheduled task')
})
``` -->

## Scheduling Reactions

`track()` defaults to running reactions in the tick phase. To schedule the reaction for a different phase, pass in the phase option with one of the provided constants: `SYNC`, `PRELUDE`, `RENDER`, `LAYOUT`.

```tsx
track(
  $documents,
  () => {
    searchIndex.update($documents());
  },
  { phase: PRELUDE },
);
```

## Scheduling Ionic Tasks

Ionic tasks run during the specified phase and automatically re-run when their tracked ions change state.

- `ionicSyncTask()` for synchronous tasks
- `ionicPrelude()` for prelude phase tasks
- `ionicRenderTask()` for render phase tasks
- `ionicLayout()` for layout phase tasks
- `ionicTick()` for tick phase tasks
