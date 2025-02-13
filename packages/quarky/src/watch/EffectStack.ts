import { AsyncState } from "@rue/flask";
import { ExclusiveLink } from "./EffectLink";

export const [getEffect, setEffect, _effectStack] = AsyncState<ExclusiveLink>('current effect');
const activeEffects = new Set()

export const effectStack = {
   has(effect: ExclusiveLink) {
      return activeEffects.has(effect)
   },
   push(effect: ExclusiveLink) {
      activeEffects.add(effect)
      _effectStack.push(effect)
   },
   pop() {
      activeEffects.delete(getEffect())
      _effectStack.pop()
   }
}