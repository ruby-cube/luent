import { EffectVine, EffectLink } from "./EffectLink";



export class PhaseMap extends Map<string, EffectVine | null> {
   constructor(
      public __DEV__name: string
   ) {
      super();
   }

   private initializeVine(phase: string) {
      const vine: EffectVine = new EffectVine(this.__DEV__name)
      this.set(phase, vine);
      return vine
   }

   addToVine(value: EffectLink, phase: string) {
      const vine = this.get(phase) ?? this.initializeVine(phase);
      vine.add(value);
   }

   deleteFromVine(value: EffectLink, phase: string) {
      let vine = this.get(phase)
      vine?.delete(value);
   }

   absorb(vine: EffectVine, phase: string) {
      const hostVine = this.get(phase) ?? this.initializeVine(phase);
      hostVine.absorb(vine)
   }
}