//@ts-nocheck
import { Flask, getActiveFlask } from "@rue/flask"
import { FromTag, Ion } from "@rue/lumo"

function Parent() {
   const $count = ion(0)
   const $child = NodeRef(Child)

   return component(
      <>
         <div>{$child().$doubleCount()}</div>
         {/* $doubleCount is now initialized in a creation scope higher than the one it was created in */}
         {If($active,
            <Child count={$count} ref={$child} />
         )}
      </>
   )
}

function Child({
   $count
} : FromTag<{
   count: Ion
}>) {
   const $doubleCount = ion(() =>$count() * 2)
   return component({
      $doubleCount
   },
      // If($ready,
      //    <div>{$doubleCount}</div>
      // )
   )
}


// ISSUES TO LOOK OUT FOR:
// - premature untracking.. not a huge deal, it will simply be retracked when it is called again
// - the main worry is if the memoized ion is intialized outside of a flask, but created within a scope that re-runs
//    When this is the case, the atom will continue to gather ionic compounds in its set without releasing the previous compounds because they are never discarded
//    - should we therefore disallow ref-ing from outside a re-created scope? I think that's the only case something like this would happen.
//     - if we use "mount", the problem would go away.
// - TODO: see if we can create a memory leak in Vue this way
// 
// - Is there a memory leak problem if a memoized ion depends on a ion from a deeper flask? (reverse atom and derivation)


// so we need to detect 
// - if a memoized ion is initialized in a flask that is not one of its child flasks 
// - AND the flasks exist across different recreation boundaries 


const creationFlask = getActiveFlask()

function $ion() {
   const initializationFlask = getActiveFlask()
   assertValidInitialization(initializationFlask, creationFlask)
   initializationFlask.onDiscard(() => {
      compound.untrackAtoms()
   })
}

