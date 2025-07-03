# TODOS:
[ ] ion.suspense(() => {}, { awaited: true })
   - refetch
[ ] watch( , { phase: 'sync' | 'prerender' | 'render' | 'postrender' })
[ ] responsive rendering
   - console.warn when rendering exceeds 50ms
[ ] doAction()
   - async
   - lazy
[ ] PhaseEffectQueue and new effect cycle system
[ ] internal render phase
[ ] remove particles
--
[ ] lazyBatch()
[ ] lazyTask() (requestIdleCallback with promise)





# types of lazy rendering
- suspense ion for async derivations (can be ionic derivation or not)
   - fetch
   - promises created by lazyBatch or lazyTask
   (internally cancels any pending tasks when an update comes in)

- lazy rendering for actions or mutations with many long effects that may block rendering (it defines an action under the hood... should it simply be a doAction call?
   - (default) responsive rendering within 50ms (instead of postscript rendering, which is rendered with event)
   - lazy rendering (over 50ms, requires placeholder)

# How do we implement lazy rendering???
- similarly to suspense ion, we need to defer rendering until after all effects have completed. Once completed, we render (mount to DOM etc)
This means we must separate derivation access from render


- watch()
   - sync
   - prerender
   - (internal jsx render)
   - render (for stuff like tooltip positioning)
   - postrender (responsive tasks)
- lazyWatch()

# Actions
- nested actions are absorbed into the outermost action (much like Solid.js's batch())
- if doAction is basically batch(), then what does redux do??
   - decoupling logic? (dependency injection)  
   - centralized state
   - encapsulation
   - batching
- all actions are async in the sense that all non-animations are lazily rendered.
- for now, don't implement exclusive actions and manually cancel overlaps.
- see if there is ever a case where instead of cancelling the in-progress action, we cancel the new action.

```ts
// const [lazyRender, cancelLazyRender] = useLazyRender()
// const $pending = ion(false)

// lazyRender(() => $count.state++, { $pending, limit: 1000 }) // wraps in an action

// const [textAction, textInsertion, textDeletion] = useAsyncActions({ exclusive: true })



//TODO: How does textDeletion affect textInsertion if they overlap? Cancel? Queue? How do we know they modify the same state?

type Action = {
   cancel(): void
   onCancel(task: () => void): void
   isPending: boolean;
   isSettled: boolean;
   status: 'in progress' | 'queued' | 'canceled' | 'complete'
   error: Error | null
   onDone(task: () => void): void
}

const textInsertion = useAction() // ionized model

function handleKeypress() {

   const output = doAction(() => {
      $listen('someevent', () => {

      }, { until: textInsertion.onCancel })

      return document.insertText(word, position)
   }, {
      action: textInsertion,
      lazy: 1000,
      catch(err) {
         textInsertion.cancel()
      }
   })
   console.log(output)
}

const textDeletion = useAction() // ionized model

function handleDeletePress() {
   const output = doAction(textDeletion, () => {
      if (textAction.isPending) textAction.cancel()
      return document.deleteText(position)
   }, {
      lazy: { limit: 1000 },
      catch(err) {
         textInsertion.cancel()
      }
   })
   console.log(output)
}

function handleCancel() {
   if (textInsertion.isPending)
}

{If((textInsertion.isPending), (

))}





doAction(async (action) => {

})

doAction(async (action) => {

}, { 
   lazyRender: true,  
})


watch($state, () => {
   if ($currentAction()) {
      await $currentAction().complete
      textNode.text = $state();
   }
}, {
   phase: 'lazy'
})


// lazyWatch($state, ({ current: state, action }) => {
//    if (action.cancelled) return; // should this be baked in? YES

// })

```

# Continue but render new state
When a new update updates state that is already pending an update, the new state will be rendered, though the old update will also continue to render (unless it is part of an action that has been cancelled), it will simply update using the most current state. This allows old update states that aren't part of the new update to also be updated. This works because once the state is newly changed, the old render will use the most current state and then the new update will update again, but since it's the same state, it renders the same thing

[ ] make sure most current state is rendered

