import { AnyObject } from "@rue/types";
import { isIonizedModel } from "../ionized/ionize";
import { QUARK, quarkOf } from "../Quark";
import { AbortSignal } from "../../../flask/AbortSignal";
import { IterableSet } from "@rue/utils";

export type MutableEntity = {
   [QUARK]: MutableMorph
}

type MutableMorph = {
   asMutable: Mutable
}

type MutationTask = (mutation: Mutation) => void

export class Mutable {
   mutationTasks: IterableSet<MutationTask> = new IterableSet()

   onMutated(task: MutationTask, options: { until: AbortSignal }) {
      this.mutationTasks.add(task)
      const onAbort = options.until
      onAbort(() => {
         this.mutationTasks.delete(task)
      })
   }

   emitMutation(mutation: Mutation) {
      const tasks = this.mutationTasks
      for (const task of tasks) {
         task(mutation)
      }
   }
}



export class Mutation {

   constructor(
      public target: MutableEntity, //QUESTION: make sure these are readonly? Do I want these exposed to app devs? or just for internal use?
      public op: '[[set]]' | string,
      public args: [PropertyKey, unknown] | unknown[],
      public output: unknown,
      public preopData: unknown // old state for [[set]] ops
   ) { }

   undo() {
      if (this.op === '[[set]]') {
         const target = this.target as AnyObject;
         const [key] = this.args as [PropertyKey]
         const oldValue = this.preopData
         target[key] = oldValue; //QUESTION: Should this trigger effects?? or should we set the raw object?
      } else if (isIonizedModel(this.target)) {
         quarkOf(this.target).revertOp(this)
      }
      else {
         if (__DEV__) console.warn('invalid mutation target')
      }
   }
}

class MutationRecording {

   constructor(
   ) {
      this.stop = AbortSignal()
   }

   mutations: Mutation[] = []

   stop: AbortSignal
}



// let recording = recordMutations(target)

// watch(target, ({ state, prevState }) => {
//    this.applyMutations(recording.mutations)
//    recording.stop()

//    recording = recordMutations(target)
// })

export function recordMutations(quark: Mutable) {
   const recording = new MutationRecording()

   quark.onMutated((mutation: Mutation) => {
      const mutations = recording.mutations;
      if (mutations.at(-1) === mutation) return; // prevents the same mutation from being recorded multiple times
      mutations.push(mutation)
   }, { until: recording.stop })

   return recording;
}


