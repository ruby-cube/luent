import { SYNC } from "./EffectCycle";
import { EffectVine } from "./EffectLink";
import { EffectLink } from "./EffectLink";


// export const [getEffect, _effectStack] = AsyncState<EffectLink>('current effect');

let previousEffect: EffectLink | null = null
let currentEffect: EffectLink | null = null

const _effectStack: EffectLink[] = []
const activeEffects = new Set()

export const effectStack = {
   has(effect: EffectLink) {
      return activeEffects.has(effect)
   },

   push(effect: EffectLink) {
      activeEffects.add(effect)
      _effectStack.push(effect)
      console.log("(push size", activeEffects.size)
   },

   pop() {
      // if (!currentEffect) console.log("pop currentEffect", currentEffect)
         const effect= _effectStack.pop()
      activeEffects.delete(effect)
      console.log("(pop size", activeEffects.size)
   }
}


let syncEffects: SyncEffects | undefined

function $syncEffects() {
   return syncEffects ?? (syncEffects = new SyncEffects())
}

export function runSyncEffects() {
   syncEffects?.run()
}

export function scheduleSyncEffects(effects: EffectVine) {
   $syncEffects().absorb(effects)
}

export function scheduleSyncEffect(effect: EffectLink) {
   $syncEffects().add(effect)
}

class SyncEffects {
   private effects = new EffectVine('sync effects')

   absorb(effects: EffectVine) {
      this.effects.absorb(effects)
   }

   add(effect: EffectLink) {
      this.effects.add(effect)
   }

   run() {
      for (const effect of this.effects) {
         if (effectStack.has(effect)) {
            console.log('infinite loop prevented')
            continue; // prevents infinite loops
         }
         effectStack.push(effect)
         try {
            effect.task()
         }
         finally {
            effectStack.pop()
            if (!effect.vine) continue; // effect has already been removed during the effect via 'once' or 'scheduler'
            effect.watchSubject!.effects.addToVine(effect, SYNC) // return to watch subject
         }
      }
   }
}