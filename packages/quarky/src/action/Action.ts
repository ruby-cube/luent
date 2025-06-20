import { Mutation, MutableEntity, asMutable } from "../Mutable";

// Actions may span mulitple effect cycles

//TODO: figure out how to distinguish between state that should rollback vs state that shouldn't
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
* __DEV__label(INSERT_TEXT, 'insert text') //TODO:
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

class Action {
   stateEntities: Set<object> = new Set()

   mutations: Mutation[] = []

   // snapshot(target: MutableEntity, deep: boolean) {
   //    if (!hasQuark(target)) return false; //TODO: or, if it is a plain object, we can do the clone method instead of mutations. What about derivations from neutrons?
   //    if (deep) {
   //       storeMutations(this, <MutableEntity>target)
   //       //TODO: What about arrays, or arrays with properties on them, or tuples?
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

   onCompleted(task: Task) {
      this.tasks!.push(task)
   }

   emitCompleted() {
      const tasks = this.tasks!;
      for (const task of tasks) {
         task()
      }
      this.tasks = undefined; //releases reference to quark
   }
}



function storeMutations(action: Action, target: MutableEntity) {
   asMutable(target).onMutated((mutation: Mutation) => {
      const mutations = action.mutations;
      if (mutations.at(-1) === mutation) return; // prevents the same mutation from being recorded multiple times
      mutations.push(mutation)
   }, { until: action.onCompleted });
}



type Name = symbol

type ActionDefinition = {
   do(action: Action): (...args: any[]) => any
   catch(error: unknown, action: Action): any
}

// const actionMap: Map<Name, ActionDefinition> = new Map()

// export function defineAction(action: ActionDefinition) { //TODO: generics
//    const name = Symbol()
//    actionMap.set(name, action)
//    return name;
// }

export function doAction<T>(action: Function, args: any[], options?: { catch?: (err: unknown) => void }) { //TODO: Generics
   if (action.length === 0) throw new Error('Action cannot not be a method that mutates state via this or closure. Any state to be mutated by actions must be explicitly passed in as an argument')
   const thisAction = new Action()
   try {
      prepAction(thisAction, args) // 
      const output = action(...args)
      if (output instanceof Promise) {
         // TODO: not sure if this is correct...
         const awaitPromise = async () => {
            try {
               return await output;
            }
            catch (err) {
               return options?.catch?.(err)
            }
            finally {
               endAction(thisAction)
            }
         }
         return awaitPromise()
      }
      else {
         return output;
      }
   }
   catch (err) {
      return options?.catch?.(err)
   }
   finally {
      endAction(thisAction)
   }
}



function prepAction(action: Action, args: any[]){
   // store stateful entities for state lock

   // check if stateful entities are currently involved in an active action
   // - if so, queue action till after action completed
   // - if not start action
}

function endAction(action: Action){
   action.emitCompleted()
}

//API exploration

// state capsules
// arguments
function INSERT_TEXT(text, position, doc) {

}


const result = await doAction(
   INSERT_TEXT, newText, cursorPosition, doc, { // options obj must be POJO (distinguish from Promises and other objs with catch method)
   catch(err) {

   }
})

const result = await doAction.fromApp(
   INSERT_TEXT, newText, cursorPosition, doc, { // options obj must be POJO (distinguish from Promises)
   catch(err) {

   }
})




function insertText() {
   return doAction(INSERT_TEXT, newText, cursorPosition, doc, { // options obj must be POJO (distinguish from Promises)
      catch(err) {

      }
   })
}



