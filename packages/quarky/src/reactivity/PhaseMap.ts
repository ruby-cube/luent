import { EffectVine, EffectLink } from "./EffectLink";



export class PhaseMap extends Map<number, EffectVine | null> {
   constructor() {
      super();
   }

   private initializeVine(phase: number) {
      const vine: EffectVine = new EffectVine()
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