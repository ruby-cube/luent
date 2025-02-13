import { AsyncState } from "@rue/flask";
import { EffectLink } from "./EffectLink";

export const [getEffect, setEffect, _effectStack] = AsyncState<EffectLink>('current effect');
const activeEffects = new Set()

export const effectStack = {
   has(effect: EffectLink) {
      return activeEffects.has(effect)
   },
   push(effect: EffectLink) {
      activeEffects.add(effect)
      _effectStack.push(effect)
   },
   pop() {
      activeEffects.delete(getEffect())
      _effectStack.pop()
   }
}