import { Effect, EffectQueue, WatchedAtom } from "./EffectQueue";


// // const _effectStack: EffectLink[] = []
// const activeEffects = new Set()

// export const effectStack = {
//    has(effect: EffectLink) {
//       return activeEffects.has(effect)
//    },

//    push(effect: EffectLink) {
//       activeEffects.add(effect)
//       // _effectStack.push(effect)
//    },

//    pop(effect: EffectLink) {
//       // const effect = _effectStack.pop()
//       activeEffects.delete(effect)
//    }
// }


let syncEffects: EffectQueue | undefined

function $syncEffects() {
   return syncEffects ?? (syncEffects = new EffectQueue())
}

// export function scheduleSyncEffects(atom: WatchedAtom) {
//    console.log('scheduleSyncEffects')
//    const effects = atom.effects
//    $syncEffects().scheduleEffects(atom)
// }

export function scheduleEagerSyncEffect(effect: Effect) {
   $syncEffects().scheduleEagerEffect(effect)
}

export function runSyncEffects() {
   console.log('run sync effects')
   syncEffects?.runEffects()
}

// class SyncEffects {
//    private effects = new EffectQueue()

//    scheduleEagerEffect(effect: Effect){
//       this.effects.scheduleEagerEffect(effect)
//    }

//    scheduleEffects(atom: WatchedAtom) {
//       this.effects.scheduleEffects(atom)
//    }

//    run() { //FIX: 
//       for (const effect of this.effects) {
//          if (effectStack.has(effect)) {
//             console.log('infinite loop prevented')
//             continue; // prevents infinite loops
//          }
//          effectStack.push(effect)
//          try {
//             effect.task()
//          }
//          finally {
//             effectStack.pop()
//             if (!effect.vine) continue; // effect has already been removed during the effect via 'once' or 'scheduler'
//             effect.watchSubject!.effects.addToVine(effect, SYNC) // return to watch subject
//          }
//       }
//    }
// }