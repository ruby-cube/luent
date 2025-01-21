import { ThisEffect } from "./ThisEffect"
import { MutationRecord } from "./watch"
import { AnyObject } from "@rue/types"
import { AnyIon } from "../ion/Ion"

class StateChangeEvent {
   trace?: string;
   constructor(
      public subject: AnyIon | AnyObject,
      public effect: ThisEffect,
      public watcher: ThisWatcher
   ) { }
   atoms?: Atom[]
   triggeredAtoms?: Atom[]
   newState?: any
   oldState?: any
   mutations?: MutationRecord[]
}

class ContextualizedNode {
   getFromContext() {

   }
   getFromApp() {

   }

   getFromGlobal() {

   }
}

class ThisWatcher extends {
   onDismantle() {

   }

   onDeactivate() {

   }

   onReactivate() {

   }
}