import { EffectVine, EffectLink } from "./EffectLink";



export class PhaseMap extends Map<number, EffectVine | null> {
   constructor(
      public __DEV__name: string
   ) {
      super();
   }

   private initializeVine(phase: number) {
      const vine: EffectVine = new EffectVine(this.__DEV__name)
      this.set(phase, vine);
      return vine
   }

   addToVine(value: EffectLink, phase: number) {
      let vine = this.get(phase)
      if (!vine) vine = this.initializeVine(phase);
      vine.add(value);
   }

   deleteFromVine(value: EffectLink, phase: number) {
      let vine = this.get(phase)
      vine?.delete(value);
   }

   absorb(vine: EffectVine, phase: number){
      const effects = this.get(phase) ?? this.initializeVine(phase);
      effects.absorb(vine)
   }
}