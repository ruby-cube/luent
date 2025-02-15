import { ParticleMorph } from "../compound/Particle";
import { Watchable } from "./Watched";

/**
 * @param quark 
 * @param op 
 * @param args 
 * @param output 
 * @param preopData 
 */
export function trigger( //TODO: figure out which abstraction this belongs to ...  atomic ions, atomic pions, memoized derivations, but not terminal compound
   this: ParticleMorph & Watchable ,
) {
   this.asParticle?.triggerCompounds()
   this.asWatched?.triggerEffects()
}