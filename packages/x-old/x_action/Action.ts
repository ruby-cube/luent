//@ts-nocheck
import { toError } from "@rue/utils";
import { Mutation, MutableEntity, asMutable } from "../Mutable";
import { AsyncState } from "@rue/flask";
import { E } from "vitest/dist/chunks/reporters.6vxQttCV";
import { UpdateCycle } from "../x_IdleUpdate";

interface ActionStack<T> {
   action: T;
   prev: ActionStack<T> | undefined;
}

let actionStack = undefined

type ActionOptions = {
   '@race'?: (competingAction: Action) => void
   // catch(err) { },
   tags?: string[],
   lazy?: { limit: number } | true,
   await?: true
}

function Action<F>(fn: F, options?: ActionOptions) {

   // TODO: add pending state to function

   return fn
}


// import { getEffectCycleManager } from "../reactivity/ReactiveSystem";

// responsive 

requestIdleCallback(()=>{

}, {timeout: 17}) // allows animations to schedule their queueTask first

// Actions may span mulitple effect cycles

// TODO: figure out how to distinguish between state that should rollback vs state that shouldn't
// - is this something defined when an atomic ion or ionized model is created?
// - OR is this something defined when creating an action?
// - OR is this defined DURING mutation?

/**  
* Example:
*
* const INSERT_TEXT = defineAction({
*    do(action) {
*       return (document, word, index) => {
*          action.snapshot(document, DEEP); 
*          return document.insertText(word, index)
*       }
*    },
*    catch(err, action) {
*       action.rollback()
*    }
* })
* 
* __DEV__label(INSERT_TEXT, 'insert text') // TODO:
*
* const output = doAction(INSERT_TEXT, [document, word, index]) 
* 
**/

/**
* Example of selective deep snapshotting:
*
* action.snapshot(document, { // can snapshot derivations as well!
*    lines: true, // shallow snapshot
*    panels: DEEP // deep snapshot
* })
* 
**/


export const DEEP = true;

type Task = () => void;

class InternalAction {
   stateEntities: Set<object> = new Set()

   mutations: Mutation[] = []

   // snapshot(target: MutableEntity, deep: boolean) {
   //    if (!hasQuark(target)) return false; // TODO: or, if it is a plain object, we can do the clone method instead of mutations. What about derivations from neutrons?
   //    if (deep) {
   //       storeMutations(this, <MutableEntity>target)
   //       // TODO: What about arrays, or arrays with properties on them, or tuples?
   //       for (const key in target) {
   //          const value = (<AnyObject>target)[key]
   //          if (isMutableEntity(value)) {
   //             this.snapshot(value, true)
   //          }
   //       }
   //    }
   //    else {
   //       storeMutations(this, <MutableEntity>target)
   //    }
   //    return true;
   // }

   rollback() {
      const mutations = this.mutations
      for (const mutation of mutations) {
         mutation.undo()
      }
   }

   tasks: Task[] | undefined = []

   done: boolean = false;

   emitDone() {
      this.done = true;
      const tasks = this.tasks!;
      for (const task of tasks) {
         task()
      }
      this.tasks = undefined; //releases reference to quark
   }

   cancelTasks: Task[] | undefined = []

   emitCancel() {
      const tasks = this.cancelTasks!;
      for (const task of tasks) {
         task()
      }
      this.cancelTasks = undefined; //releases reference to quark
   }

   _effectCycle = UpdateCycle

   get effectCycle() {
      if (!this.done) throw new Error("Cannot access effect cycle until action is done")
      if (this._effectCycle) return this._effectCycle;
      const effectCycle = getEffectCycleManager()
      const currentCycle = effectCycle.current
      const currentPhase = currentCycle.currentPhase
      if (currentPhase === effectCycle.phases[0].name && currentCycle.subphase === 'effects') { // accepting new actions
         return this._effectCycle = currentCycle;
      }
      else {
         return this._effectCycle = effectCycle.next
      }
   }
}



function storeMutations(action: Action, target: MutableEntity) {
   asMutable(target).onMutated((mutation: Mutation) => {
      const mutations = action.mutations;
      if (mutations.at(-1) === mutation) return; // prevents the same mutation from being recorded multiple times
      mutations.push(mutation)
   }, { until: action.onDone });
}




// const [deleteText, textDeletion] = useAction(textDeletion =>
//    (document: Doc, position: number) => {
//       if (textDeletion.isPending) textDeletion.cancel()
//       return document.deleteText(position)
//    }
// )

class Action {
   pending: boolean = true
   settled: boolean = false
   status: 'in progress' | 'queued' | 'canceled' | 'complete' | null
   error: Error | null = null
   cancel() {
      if (this.status !== 'in progress') return;
      metaaction(() => {
         action.settled = true;
         action.pending = false;
         action?.status = 'canceled'
         this[INTERNAL].rollback()
      })
      this[INTERNAL].emitCancel()
   }

   onCancel(task: Task) {
      this[INTERNAL].cancelTasks!.push(task)
   }

   /**
    * Action logic is done, but effects have not yet run.
    * @param task 
    */
   onDone(task: Task) {
      this[INTERNAL].tasks!.push(task)
   }
   
   [INTERNAL]: InternalAction
}

type BoundActionFn = (...args: [unknown, ...any[]]) => any

type MakeBoundActionFn = (...args: [unknown, ...any[]]) => (action: Action) => any

function useAction<T extends (action: Action) => BoundActionFn>(createActionFn: T) {
   const action = ionize(new Action())
   const boundActionFn = createActionFn(action)
   function makeActionFn(...args: any[]) {
      function actionFn(action: Action) {
         return boundActionFn(...args)
      }
      actionFn.action = action;
      return actionFn
   }

   // TODO: provide from global if createActionFn not provided
   return [makeActionFn, action]
}

type ActionFn = (action: Action) => T

// outer actions cancel inner action

const [getCurrentAction, rootActionStack] = AsyncState<Action | null>('root action')

/**
 * prevents action object's state mutations from being delayed by outer action's delayed rendering
 * @param mutation 
 */
function metaaction(mutations: () => void) {
   rootActionStack.push(null)
   mutations()
   rootActionStack.pop()
}

type ActionOptions = {
   deadline: 'urgent' | 'responsive' | number | 'lazy'
   catch?: (err: unknown) => void,
   onOverlap(currentAction: Action): 'override' | 'yield' | 'queue'
   onRenderedOverlap(renderedAction: Action): 'yield' | 'queue'
}

export function doAction<T>(actionFn: (action: Action) => T, options?: ActionOptions): T {
   // TODO: onOverlap
   if (action.length === 0) throw new Error('Action cannot not be a method that mutates state via this or closure. Any state to be mutated by actions must be explicitly passed in as an argument')
   const action = 'actionFn' in actionFn ? actionFn.action as Action : ionize(new Action())
   const outerAction = getCurrentAction()

   outerAction?.onCancel(() => action.cancel())
   outerAction?.onDone(() => action[INTERNAL].emitDone()) // TODO: maybe I need to distinguish onDone() and onAllDone()? and onRender() and afterRender()?

   let resolve: (value: unknown) => void;
   const actionComplete = new Promise((_resolve) => {
      resolve = _resolve
   })
   try {
      metaaction(() => {
         action.settled = false;
         action.pending = true
         action.status = 'in progress'
      })
      if (!outerAction) rootActionStack.push(action) // only push if is root action
      const output = fn()
      if (output instanceof Promise) {
         output
            // action function complete, but state not rendered yet
            .then(() => {
               if (action.status === 'canceled') return;
               action[INTERNAL].emitDone() // will run effects
               await action[INTERNAL].rendered // TODO: I dunno how this should work
               metaaction(() => {
                  action.settled = true;
                  action.pending = false;
                  action?.status = 'complete'
               })
               resolve(output)
            })
            .catch(err => {
               action.cancel()
               options.catch(toError(err))
            })
      }
      else {
         action[INTERNAL].emitDone()
         // await action.rendered
         resolve!(output)
      }
   }
   catch (err) {
      action.cancel()
      options.catch(toError(err))
   }
   finally {
      if (!outerAction) rootActionStack.pop()
      return actionComplete
   }
}

// function insert() {

//    return new Promise((resolve, reject) => {
//       setTimeout(() => { resolve('wahh wanh') }, 2000)
//    })
// }




// const output = await doAction(insert, {
//    catch(err) {
//       console.log('ACTION CATCH', err)
//    }
// })

// console.log('output', output)



function prepAction(action: Action, args: any[]) {
   // store stateful entities for state lock

   // check if stateful entities are currently involved in an active action
   // - if so, queue action till after action completed
   // - if not start action
}

function endAction(action: Action) {
   action.emitCompleted()
}



const [DeleteText, textDeletion] = useAction((textDeletion) =>
   (document, position) => {
      $_registerMutation(document, 'deleteText')
      $_registerMutation(document.cursor, 'updatePosition')

      const { pos: newPosition } = document.deleteText(position)
      document.cursor.updatePosition(newPosition)
   }, {
   onOverlap(currentAction) {
      if (currentAction === textDeletion) return 'override';
      if (currentAction === textDeletion) return 'yield';
      if (currentAction === textDeletion) return 'queue'; // default
   },
   onRenderedOverlap(renderedAction) {
      return 'yield';
   }
})


class Doc {

   text: string

   tags: { name: string }[]

   cursorPosition: number

   deleteText(position) {
      target.text = ''
      target.cursorPosition = position;
      this.tags.splice(0, 2)
      this.nestedObject.modify()
   }
}

$_registerMutations(Doc, {
   deleteText: {
      getMutableState(target) {
         return [
            target.$text,
            target.$cursorPosition,
            target.tags,
            target.tags.forEach(tag => tag.$name),
            getMutableState(target.nestedObj, 'modify')
         ]
      }
   }
})


function handleKeypress() {
   const position = getPosition()
   doAction(DeleteText(position))
}

onSomeEvent(e => {
   cursor.updatePosition(e.cursorPosition) //what happens when this happens while textDeletion is in progress?
})

// cursor.updatePosition is an implicit action ... how do we register it as exclusive to textDeletion?
