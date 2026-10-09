import { AnyObject } from "@luently/types"
import { Update, $activeUpdate, getActiveUpdate } from "./Update"


// TODO: history
export interface PendableState {
   current: unknown
   pending: unknown
   get(): unknown

   pendingUpdate: Update | null
   cancelUpdate(): void
   commitUpdate(): void
   // lock(): Update | undefined
}

function getState(state: PendableState) {
   if (state.pendingUpdate && state.pendingUpdate === getActiveUpdate()) {
      // console.log('getting pending state', state.pending)
      return state.pending;
   }
  //  console.log('getting current state', state.current)
   return state.current
}

function lockState(state: PendableState) {
   const update = $activeUpdate()
   if (!update) {
      if (__INTERNAL__) console.error('nothing to lock to')
      return;
   }
   // if (update.committed) return;
   // if (update.cancelled) console.warn('DEV RESEARCH: state is being accessed after update cancelled...')
   // if (update.committed) {
   //    console.warn('update already committed')
   //    update.race(state.pendingUpdate)
   //    if (state.pendingUpdate === null) {
   //       state.pendingUpdate = update
   //       update.atComplete(() => {
   //          state.pendingUpdate = null
   //       })
   //    }
   //    state.commitUpdate()
   //    return;
   // }
   const ok = update.race(state.pendingUpdate)
   if (!ok && __INTERNAL__) console.warn("*&^ RACE updates aren't the same", update, state.pendingUpdate, state.get())
   if (state.pendingUpdate === null) {
      state.pendingUpdate = update

      update.atComplete(() => {
         // console.warn('update atComplete: current', state.current instanceof Array ? [...state.current] : state.current)
         // console.warn('update atComplete: pending', state.pending instanceof Array ? [...state.pending] : state.pending)
         state.pendingUpdate = null
      })
   }
   if (update.committed) {
      if (__INTERNAL__) console.warn('ALREADY COMMITTED', state.pending instanceof Array ? [...state.pending] : state.pending)
      update.atComplete(() => {
         state.commitUpdate()
      })
   }
   else
      queueCommit(update, state)
}


export function queueCommit(update: Update, state: PendableState) {
   update.atCommit(() => {
      state.commitUpdate()
   })
   // update.atCancel?.(() => {
   //    state.cancelUpdate()
   // })
}



export class SimpleState implements PendableState {
   current: unknown
   pending: unknown

   constructor(
      current: unknown,
   ) {
      this.current = current;
      this.pending = current;
   }

   get() {
      return getState(this)
   }

   protected lock() {
      return lockState(this)
   }

   _pendingUpdate: Update | null = null

   get pendingUpdate() {
      return this._pendingUpdate
   }

   set pendingUpdate(value) {
      this._pendingUpdate = value
   }

   cancelUpdate(): void {
      this.pending = this.current
   }

   commitUpdate() {
      // console.log('commit update', this.current, this.pending)
      return this.current = this.pending
   }

   set(value: unknown) {
      this.lock()
      this.pending = value
      return value
   }
}

// export class PionState extends SimpleState {
//    constructor(
//       current: unknown,
//       private onCommit: (value: unknown) => void
//    ) {
//       super(current)
//    }
//    override commitUpdate() {
//       // this.onCommit(
//          this.current = this.pending
//       // )
//    }
// }

// TODO:
// for ionic model
// value => target[key] = value

// for ionic collective 
// value => state.current[key] = state.pending[key] = value


// export class CollectiveState implements PendableState {

//    current: AnyObject
//    pending: AnyObject

//    constructor(
//       current: AnyObject,
//       protected clone: <T>(current: AnyObject) => AnyObject = (model: AnyObject) => model
//    ) {
//       this.current = current;
//       this.pending = clone(current);
//    }

//    get() {
//       return getState(this) as AnyObject
//    }

//    protected lock() {
//       return lockState(this)
//    }

//    pendingUpdate: Update | null = null

//    private mutated = false

//    cancelUpdate() {
//       if (this.mutated) {
//          this.pending = this.clone(this.current)
//          this.mutated = false
//       }
//    }

//    commitUpdate(): void {
//       if (this.mutated) {
//          this.current = this.pending
//          this.pending = this.clone(this.pending)
//          this.mutated = false
//       }
//    }


//    mutate(fn: (model: AnyObject) => unknown) {
//       this.lock()
//       this.mutated = true;
//       return fn(this.pending)
//    }

//    mutateSync(fn: (model: AnyObject) => unknown) {
//       this.mutated = true;
//       return fn(this.pending)
//    }

// }

export class CollectiveState implements PendableState {

   current: AnyObject
   pending: AnyObject

   constructor(
      current: AnyObject,
      protected clone: <T>(current: AnyObject) => AnyObject = (model: AnyObject) => model
   ) {
      this.current = current;
      this.pending = clone(current);
   }

   get() {
      return getState(this) as AnyObject
   }

   protected lock() {
      return lockState(this)
   }

   pendingUpdate: Update | null = null

   // private mutated = false

   cancelUpdate() {
      if (this.mutations.length) {
         this.pending = this.clone(this.current)
         this.mutations = []
      }
   }

   // commitUpdate(): void {
   //    if (this.mutated) {
   //       this.current = this.pending
   //       this.pending = this.clone(this.pending)
   //       this.mutated = false
   //    }
   // }
   commitUpdate(): void {
      if (this.mutations.length) {
         this.applyMutations()
      }
   }

   private mutations: ((model: AnyObject) => unknown)[] = []

   mutate(fn: (model: AnyObject) => unknown) {
      this.lock()
      this.mutations.push(fn)
      return fn(this.pending)
   }

   mutateSync(fn: (model: AnyObject) => unknown) {
      this.mutations.push(fn)
      return fn(this.pending)
   }

   private applyMutations() {
      for (const mutate of this.mutations) {
         mutate(this.current)
      }
      this.mutations = []
   }


   // mutate(fn: (model: AnyObject) => unknown) {
   //    this.lock()
   //    this.mutated = true;
   //    return fn(this.pending)
   // }

   // mutateSync(fn: (model: AnyObject) => unknown) {
   //    this.mutated = true;
   //    return fn(this.pending)
   // }

}




// export class PrivateState extends CollectiveState {

//    constructor(
//       current: AnyObject,
//       clone: <T>(current: AnyObject) => AnyObject = (model: AnyObject) => model
//    ) {
//       super(current, clone)
//    }

//    override commitUpdate(): void {
//       if (this.mutations.length)
//          this.applyMutations()
//    }

//    private mutations: ((model: AnyObject) => unknown)[] = []

//    override mutate(fn: (model: AnyObject) => unknown) {
//       this.lock()
//       this.mutations.push(fn)
//       return fn(this.pending)
//    }

//    override mutateSync(fn: (model: AnyObject) => unknown) {
//       this.mutations.push(fn)
//       return fn(this.pending)
//    }

//    private applyMutations() {
//       for (const mutate of this.mutations) {
//          mutate(this.current)
//       }
//       this.mutations = []
//    }
// }





