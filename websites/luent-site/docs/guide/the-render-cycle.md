# The Render Cycle

The render cycle coordinates when reactions and scheduled tasks run during an update.

Render cycle phases provide predictable timing for:

- data synchronization
- DOM manipulations
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

<p align="right"><a href="#the-render-cycle" style="text-decoration: none">[top]</a></p>


## The Sync Phase

The sync phase runs synchronously after a reactive mutation. It is designed for data synchronization that cannot be expressed as a derivation, such as external data.

```tsx
observe($selection, () => {
  editor.setSelection($selection());
}, { phase: SYNC });
```

:::warning Use mindfully
Derivations are preferred over manual synchronization as it is less bug-prone across code edits. Use derivations whenever possible.

Because synchronous reactions run immediately, excessive work in this phase may block rendering and reduce responsiveness. If the data does not need to be updated immediately, prefer the prelude phase or the tick phase.
:::

## The Prelude Phase

The prelude phase runs before rendering begins. It is for synchronizing data needed by the upcoming render.

```tsx
observe($documents, () => {
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
awaitPrelude(() => {
  preloadUserProfile($userId());
});
```

Unlike sync phase tasks, prelude tasks run after all synchronous mutations have completed, meaning tasks run once per mutation batch rather than per mutation. This is preferred for runtime efficiency in cases of non-urgent data synchronization.

Unless an update is marked as instant, the prelude phase is interruptible so that higher-priority updates, such as animations or user interactions, may render first.

<p align="right"><a href="#the-render-cycle" style="text-decoration: none">[top]</a></p>


## The Render Phase

The render phase runs DOM manipulation tasks. It is used to schedule tasks that directly modify DOM nodes.

Once the render phase begins, the update is considered committed and can no longer be interrupted by newer updates.

```tsx
awaitRender(oo => {
  if (oo($open)) {
    $dialog()?.focus();
  }
});
```

```tsx
awaitRender(() => {
  const el = $panel();
  if (el) el.style.opacity = "1";
});
```

<p align="right"><a href="#the-render-cycle" style="text-decoration: none">[top]</a></p>


## The Layout Phase

The layout phase runs after the render phase. It is for layout-dependent reads such as element measurements, scroll positions, and geometry calculations. Batching layout reads separately from DOM writes helps reduce layout thrashing and allows measurements to reflect the latest rendered state.

```tsx
awaitLayout(() => {
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

<p align="right"><a href="#the-render-cycle" style="text-decoration: none">[top]</a></p>


## Scheduling Tasks

<div class='section-tags'>
<span class='doc-tag'>Experimental</span>
</div>

Tasks are scheduled for phases of the current render cycle with the following promises:

- `prelude`
- `render`
- `layout`
- `tick`

```tsx
function ChatApp() {
  // subscribe to stuff
  awaitLayout(() => {
    // measure layout
  })
  awaitRender(() => {
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
    awaitLayout(() => {
      // measure layout
    })
    awaitRender(() => {
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

<p align="right"><a href="#the-render-cycle" style="text-decoration: none">[top]</a></p>


## Scheduling Reactions

`observe()` defaults to running reactions in the tick phase. To schedule the reaction for a different phase, pass in the phase option with one of the provided constants: `SYNC`, `PRELUDE`, `RENDER`, `LAYOUT`.

```tsx
observe($documents, () => {
  searchIndex.update($documents())
}, { phase: PRELUDE })
```

<p align="right"><a href="#the-render-cycle" style="text-decoration: none">[top]</a></p>


## Observed Tasks

Observed tasks run during the specified phase and automatically re-run when their observed ions change state.

- `observedCall()` for synchronous tasks
- `awaitPrelude()` for prelude phase tasks
- `awaitRender()` for render phase tasks
- `awaitLayout()` for layout phase tasks
- `awaitTick()` for tick phase tasks

<p align="right"><a href="#the-render-cycle" style="text-decoration: none">[top]</a></p>
