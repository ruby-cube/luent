import { AnyObject } from "@luently/types"
import { isObject, noop } from "@luently/utils"
import { EACH } from "../ionic/Ionic"

const cancelledDispatches = new Set()

type Task = () => void

class AsyncMutable {
   pendingFetch?: Promise<any> | null

   constructor(
      public mutable: AnyObject,
      public pod: AsyncMutable | null,
      private _refetch: () => void = noop,
      private _update: (data: AnyObject) => void = updateAsyncMutable,
   ) {
      pod?.onCancel(() => this.cancelFetch())
   }

   private cancelTasks: Task[] = []

   onCancel(task: Task) {
      this.cancelTasks.push(task)
   }

   /**
    * Highest level mutable that was cancelled
    */
   cancelledMutable: AsyncMutable | null = null

   cancelFetch() {
      let cancelled = false;

      // cancel this dispatch
      if (this.pendingFetch) {
         this.cancelledMutable = this
         cancelledDispatches.add(this.pendingFetch)
         this.pendingFetch = null;
         cancelled = true;
      }

      // cancel children dispatches
      for (const task of this.cancelTasks) {
         task()
      }

      return cancelled;
   }

   unfetch() {
      let mutable: AsyncMutable | null = this

      while(mutable) {
         if (mutable.pendingFetch) this.cancelledMutable = mutable
         mutable = mutable.pod
      }
      return !!this.cancelledMutable?.cancelFetch()
   }

   update(data: AnyObject) {
      if (this.cancelledMutable) {
         this.cancelledMutable.refetch()
         this.cancelledMutable = null
      }
      this._update(data)
   }
   
   refetch() {
      if (this.cancelledMutable) {
         this.cancelledMutable.refetch() // TODO: should this be this.cancelledMutable._refetch() instead??
         this.cancelledMutable = null
      }
      else {
         this._refetch()
      }
   }
}

function updateAsyncMutable(this: AsyncMutable, data: AnyObject) {
   const model = this.mutable
   if (Array.isArray(model)) {
      updateArray(model, data)
   }
   else {
      updateProperties(model, data)
   }
}

function updateProperties(model: AnyObject, data: AnyObject) {
   const keys = Object.keys(data)

   for (const key of keys) {
      model[key] = data[key]
   }
   return model
}

function updateArray(model: any[], data: any[]) {
   const length = data.length
   while (model.length > length) {
      delete model[model.length - 1]
   }

   const nestedConfig = getNestedConfig(model)
   const eachAsModel = nestedConfig?.[EACH]

   if (eachAsModel) {
      for (let i = 0; i < length; i++) {
         const value = data[i]
         if (isObject(value)) {
            model[i] = eachAsModel(value)
         }
         else if (value !== model[i]) {
            model[i] = value
         }
      }
   }
   else {
      for (let i = 0; i < length; i++) {
         const value = data[i]
         model[i] = value
      }
   }
}