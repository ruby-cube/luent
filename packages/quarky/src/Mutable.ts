import { AnyObject } from "@rue/types";
import { isIonizedModel } from "./ionized/ionize";
import { hasQuark, QUARK, quarkOf } from "./Quark";
import { Abort, AbortSignal } from "../../flask/AbortSignal";
import { IterableSet } from "@rue/utils";

export type MutableEntity = {
   [QUARK]: MutableMorph
}

export type MutableMorph = {
   asMutable: Mutable
}

export function isMutableEntity(value: unknown): value is MutableEntity {
   return hasQuark(value) && 'asMutable' in quarkOf(value)
}

export type MutationTask = (mutation: Mutation) => void

export class Mutable {
   mutationTasks: IterableSet<MutationTask> = new IterableSet()

   onMutated(task: MutationTask, options: { until: OnAbort | ((task: () => void) => void) }) {
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
      public op: '[[set]]' | PropertyKey,
      public args: [PropertyKey, unknown] | unknown[],
      public output: unknown,
      public preopData: undefined | unknown // old state for [[set]] ops
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

   stop: Abort
}



// let recording = recordMutations(target)

// watch(target, ({ current, previous }) => {
//    recording.stop()
//    this.applyMutations(recording.mutations)

//    recording = recordMutations(target)
// })

export function recordMutations(entity: MutableEntity) {
   const mutable = asMutable(entity)
   const recording = new MutationRecording()

   mutable.onMutated((mutation: Mutation) => {
      const mutations = recording.mutations;
      if (mutations.at(-1) === mutation) return; // prevents the same mutation from being recorded multiple times
      mutations.push(mutation)
   }, { until: recording.stop })

   return recording;
}


export function asMutable(entity: MutableEntity) {
   return quarkOf(entity).asMutable;
}

export function recordMutation(quark: MutableMorph, mutation: Mutation) {
   quark.asMutable.emitMutation(mutation)
}