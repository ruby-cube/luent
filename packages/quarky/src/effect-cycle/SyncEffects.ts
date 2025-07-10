import { Effect, EffectQueue, PhaseAtom } from "./EffectQueue";

// let syncEffects: EffectQueue | undefined

// function $syncEffects() {
//    return syncEffects ?? (syncEffects = new EffectQueue())
// }

// export function scheduleSyncEffects(atom: PhaseAtom) {
//    console.log('scheduleSyncEffects')
//    const effects = atom.effects
//    $syncEffects().scheduleEffects(atom)
// }

// export function scheduleEagerSyncEffect(effect: Effect) {
//    $syncEffects().scheduleEagerEffect(effect)
// }

// export function runSyncEffects() {
//    console.log('run sync effects')
//    syncEffects?.runEffects()
// }

// class SyncEffects {
//    private effects = new EffectQueue()

//    scheduleEagerEffect(effect: Effect){
//       this.effects.scheduleEagerEffect(effect)
//    }

//    scheduleEffects(atom: PhaseAtom) {
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