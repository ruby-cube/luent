import { AnyObject } from "@rue/types";
import { hasQuark, quarkOf } from "../Quark";
import { Mutable, Mutation, MutableEntity } from "../mutation/Mutable";

// Actions may span mulitple effect cycles

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

   mutations: Mutation[] = []

   snapshot(target: AnyObject, deep: boolean) {
      if (!hasQuark(target)) return false; //TODO: or, if it is a plain object, we can do the clone method instead of mutations. What about derivations from neutrons?
      if (deep) {
         storeMutations(this, <MutableEntity>target)
         //TODO: What about arrays, or arrays with properties on them, or tuples?
         for (const key in target) {
            const value = (<AnyObject>target)[key]
            if (hasQuark(value)) {
               this.snapshot(value, true)
            }
         }
      }
      else {
         storeMutations(this, <MutableEntity>target)
      }
      return true;
   }

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
   const quark = quarkOf(target)
   quark.recordOp = (mutation: Mutation) => {
      const mutations = action.mutations;
      if (mutations.at(-1) === mutation) return; // prevents the same mutation from being recorded multiple times
      mutations.push(mutation)
   };
   action.onCompleted(() => {
      quark.recordOp = undefined;
   })
}

type Name = symbol

type ActionDefinition = {
   do(action: Action): (...args: any[]) => any
   catch(error: unknown, action: Action): any
}

const actionMap: Map<Name, ActionDefinition> = new Map()

export function defineAction(action: ActionDefinition) { //TODO: generics
   const name = Symbol()
   actionMap.set(name, action)
   return name;
}

export function doAction<T>(name: Name, args: any[]) { //TODO: Generics
   const action = actionMap.get(name);
   if (!action) throw new Error(`No action `)
   const thisAction = new Action()
   try {
      const output = action.do(thisAction)(...args)
      if (output instanceof Promise) {
         const awaitPromise = async () => {
            try {
               return await output;
            }
            catch (err) {
               return action.catch(err, thisAction)
            }
         }
         return awaitPromise()
      }
      else {
         return output;
      }
   }
   catch (err) {
      return action.catch(err, thisAction)
   }
   finally {
      thisAction.emitCompleted()
   }
}