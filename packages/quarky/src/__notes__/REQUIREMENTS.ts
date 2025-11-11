import { ion } from "../ion/Ion";
import { watch } from "../reactivity/Watcher";

/* 
What are the expected behaviors
- setting value of ion that is being watched --> we don't want to retrigger any 
- setting value of a different ion ---> we want that ion to trigger its effects
- preventing infinite loops in nested watchers: use untrackedCall for ions, ionic effects naturally do not propagate reactivity
- effects that are scheduled for a previous phase:
   My intuition is that as the developer, the primary expectation is that when x changes, effect will run, regardless of phase.
   So if a phase has passed, we schedule it for the next cycle.
   - Do we want to allow non-blocking infinite loops?
*/

const $message = ion('hi')
const $count = ion(0)

/**
 * Should prefer dervations over this method, 
 * but let's say we want to "auto correct" changes to a message.
 */
watch($message, ({ current: msg }) => {
   if (msg.endsWith("!")) {
      $message.value = msg.slice(-1) // we do not expect this to cause effect to rerun. 
      $count.value++ // we expect this to cause effects elsewhere to run. But what if the effects have already run? 
      // Should we schedule a new effect? Yes I think so... or place the burden on the developer to schedule effects carefully
   }
})
/* 
But should it set off other effects of $message? 
- yes, for cases like we want to update the database with the edited message
 */

/* 
It seems like what we need is to have phases where state is writable, and phases where state should not be mutated.
This way effects will be run more efficiently instead of having to run the same effect twice (in different cycles)
*/

/**
 * The rules:
 * - An effect cannot be run twice within a cycle
 * - (??) If an effect is triggered again within the same cycle, it will be scheduled for the next cycle.
 * - (??) if an effect is triggered by the watcher it belongs to, it will not ever rerun.
 */
// CURRENT DECISION: It's too complicated to distinguish the last two cases from each other. 
// We will simply implement the first rule and leave it up to the app developer to schedule effects mindfully
// I need to understand actual use cases better to decide whether to implement the last two rules.
// or instead of phases, maybe watched subjects can have an "unscheduled" vs "scheduled" effects? I think that's the answer.
// also give developers a next cycle option

/** 
 * Nested Watchers
 */

const $active = ion(false)

watch($message, ({ current: msg }) => {
   watch($active, () => {
      if (msg.endsWith("!")) {
         $message.value = msg.slice(-1) // This should cause an animation, like nesting request animation frame
      }
   }, { cycle: "next" })
})

// [ ] How should we define synchronous? perfectly synchronous or queued synchronous?
// [ ] Should ionic effects be initialized with perfect synchronicity or queued synchronicity?
// [ ] If we implement queued synchronicity, 
//     should it be allowed to run infinitely (like queueMicrotask) if a synchronous task is queued while running the queue?
//     Yes. Because queuing to the next cycle breaks the definition of synchronicity and therefore breaks expectation.
// [ ] How do we define queued synchronicity? Queuing within the same phase? or queuing within the same cycle?

// Scheduling is a hard topic.
// Reasons for scheduling: 
//    - To prevent layout thrashing
//    - You need a certain effect to already have run before another effect runs.. 
//        - honestly, this feels like a nightmare like z-index, where you kinda just guess that you won't need to fit in other stuff
//    - for rollback
//    
// What are the relevant phase names for these purposes? Should they have names? Or just numbers?
// If we're running code on the backend, does a render cycle still make sense? Or is it more of a Response cycle?
// What are the event loops in different backend frameworks like?
//  



/**
 * The rules:
 * [x] An effect cannot be run twice within a cycle ( if ($currentCycle() === currentCycle) return; )
 * [ ] If an effect is triggered again within the same cycle, it will be scheduled for the next cycle.
 * [ ] if an effect is triggered by the watcher it belongs to, it will not ever rerun.
 * 
 * - how to distinguish between 
 */


