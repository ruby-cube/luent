I want to understand the relationships between parts of a reactive system
When would you expect immediate DOM updates vs when would an update spread over time be ok


# Types of updates
- animation < 16.7 ms
- immediate < 100 ms
- exaggerated delay > 100 ms   (we display a pending state longer than needed to prevent an ugly flash)
- delayed > 100 ms; (we display a pending state for however long is needed)


# Types of delays
- awaiting task (non-render-blocking)
- long task (render-blocking)
   - long loop
   - many tasks
   - nested long tasks
- long effect
- many effects


# State
- atomic ion
- derivation ion

# Effects
- stale marking (must be synchronous)
- effects (batched)
- render (QUESTION: should this be a separate batch from effects? It needs to wait for all effects to complete to update)

# Blind state updates
When you update state, you may have no idea what effects are attached to updating that state--even whether it will be rendered to the DOM.
So how would you know to put a 'transition' (in React's terminology) on the effects?
You have no idea whether there is a long task downstream or whether it has many effects attached to it.

- The responsibility of breaking up a long task or managing an awaited task should be handled in the effect or event handler.
[] The responsibility of spreading out many effects should be handled by the framework.
   - but then what if the effects are spread out for so long beyond 100ms? 
      - We need to provide an $isPending ion then...
      - or prioritize render effects?
      - we need pre-render and post-render effects. Post render effects can be spread out
      It's the responsibility of the dev to schedule effects wisely

# The Effect Cycle
- event handler (synchronous effects)
Scheduled with microtasks
- pre-render: for manual derivations (using watch to sync two ions) and updating state, like $index()
- render === atMounted/atUnmount (use measureLayout to batch reads)
Scheduled on idle
- post-render (useEffect)

## QUESTIONS
[] do we event need an effect cycle? or just a render queue?
[] if we queue a render task and it is already in the queue, should it be rendered later? no need, since ions access the most current data


# Actions (batched state updates)
When you batch mutations that need to be updated together, this forms an action.
- We need to hold off on rendering the UI until the action is fully complete
- provide an $isPending ion

The question is WHO should manage the holding off of rendering? The action or the framework?
- ACTION? If it is the action, the assumption is that mutating state may cause downstream effects
  so we hold off on updating reactive state until all calculations are done
  PRO: 
  - Feels like the safe way to update state. 
  - No need to implement state locks since updates are synchronous at the end of an action
  CON: 
   - Defeats the advantage of putting your business logic in a domain model and forces you
  to write your logic outside of reactive state and then finally update the state.
   - Requires thoughtful coordination.
- REACTIVITY SYSTEM?
   The framework passes a promise to the mutations and then holds off on effects*
   then runs the effects once the promise resolves upon the completion of the action
   PRO: we can keep OOP bundling of business logic with state and just perform the action 
   without any concern about rendering. This is the ideal DX
   CON: 
   - framework needs to implement special state locks to prevent other actions from mutating state that is part of the action
   - need a way to abort an action and roll back state
   - Not so much a con yet, but a research question... Would this sort of asynchronous mutating updates collide with each other 
     and cause unexpected results?

   *should the framwework hold off on all effects or just render effects?

Outstanding questions
- Can actions be nested??
- Can actions overlap?
- how would a derivation know that an update is being delayed by an action? It seems that