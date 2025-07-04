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


NOTE: Actions don't need dependency injection because the state should already be dependency injected.
Still, we may want to try different implementations, hence actions being globally injected
Also, actions are not stateful. They are procedures.

# QUESTIONS:
[ ] can an action object be used for different doAction calls? Should the action object be coupled with the action logic (cb function)?

```ts
// const [lazyRender, cancelLazyRender] = useLazyRender()
// const $pending = ion(false)

// lazyRender(() => $count.state++, { $pending, limit: 1000 }) // wraps in an action

// const [textAction, textInsertion, textDeletion] = useAsyncActions({ exclusive: true })



//TODO: How does textDeletion affect textInsertion if they overlap? Cancel? Queue? How do we know they modify the same state?

type Action = {
   cancel(): void
   onCancel(task: () => void): void
   pending: boolean;
   settled: boolean;
   status: 'in progress' | 'queued' | 'canceled' | 'complete' //TODO: use a finite ion instead?
   error: Error | null
   onDone(task: () => void): void
}


function handleKeypress() {

   const output = doAction(() => {
      $listen('someevent', () => {

      }, { until: textInsertion.onCancel })

      return document.insertText(word, position)
   }, {
      lazy: 1000,
      catch(err) {
         textInsertion.cancel()
      }
   })
   console.log(output)
}


// default shared action can be overriden with
provideAction(deleteText, textDeletion => 
   (document: Doc, position: number) => {
      if (textDeletion.isPending) textDeletion.cancel()
      return document.deleteText(position)
   })

// If injectable action state is needed outside of the function
export const [deleteText, textDeletion] = useAction(textDeletion => 
   (document: Doc, position: number) => { // must be a procedural function, not a closure method!! State must be passed in
      if (textDeletion.isPending) textDeletion.cancel() 
      return document.deleteText(position)
   }
)


//NOTE: If doAction finds only one action/mutation within its call, the action is unnested and becomes the root action
function handleDeletePress() {
   const output = doAction(() =>
      deleteText(doc, pos),
      {
         lazy: 1000,
         catch(err) { 
            textDeletion.cancel() 
         }
      })

   console.log(output)
}


// If action state is needed outside of the function:
const [DeleteText, textDeletion] = useAction(textDeletion =>
   (document: Doc, position: number) => {
      if (textDeletion.isPending) textDeletion.cancel()
      return document.deleteText(position)
   }
)

function handleDeletePress() {
   const output = doAction(DeleteText(doc, pos), {
      lazy: { limit: 1000 },
      catch(err) { textDeletion.cancel() }
   })
   console.log(output)
}

function handleDeletePress() {
   // if action state is not needed outside fn
   const output = doAction(textDeletion => {
      if (textDeletion.pending) textDeletion.cancel()
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
   lazy: true,  
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

# Use Optimistic

```ts

const adding10ToCount = useAction()

function handleClick(){
   
   doAction(() => {
      $count.state = $count() + 10
   }, {
      action: adding10ToCount
   })
}

// With dependency injection: This pattern should be used for any appwide/centralized functions and state (ie. stores, fetch)
provideDispatch(dispatchCountUpdate, () => {

})

export const [dispatchCountUpdate, getCountUpdate] = useDispatch(() => {
   // optional default implementation if defineDispatch is not called
   // if no default implementation is provided, you should type the dispatch useDispatch<(count: number) => void>()
})




function MyComponent() {

   const countUpdate = getCountUpdate()

   watch($count, (count) => {
      dispatchCountUpdate(count)
   }, {
      lazy: 1000
   })

   return component(
      <>
         {$count}
         {If(countUpdate.posting,
            <>sending...</>
         )}
         {ElseIf(countUpdate.failed, 
            <>Failed. <button on:click={e => countUpdate.retry()}>retry</button>
         )}
      </>
   )
}

```