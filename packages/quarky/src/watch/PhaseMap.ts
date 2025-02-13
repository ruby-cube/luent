import { EffectVine, EffectLink } from "./EffectLink";



export class PhaseMap extends Map<number, EffectVine> {
   constructor() {
      super();
   }

   private initializeVine(phase: number) {
      const vine: EffectVine = new EffectVine()
      this.set(phase, vine);
      return vine
   }

   addToSet(value: EffectLink, phase: number) {
      let vine = this.get(phase)
      if (!vine) vine = this.initializeVine(phase);
      vine.add(value);
   }

   deleteFromSet(value: EffectLink, phase: number) {
      let vine = this.get(phase)
      vine?.delete(value);
   }
}