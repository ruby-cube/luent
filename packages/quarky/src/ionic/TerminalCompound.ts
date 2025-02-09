import { MaybeCompound } from "../compound/Compound";
import { Watched } from "../watch/Watched";
import { IonicCompound } from "./IonicCompound";

type WatchedEntity = MaybeCompound<WatchedCompound> & { asWatched: Watched }

/**
 * A terminal compound is the "end" of a reactive chain, i.e. the compound is not the atom of a larger compound.
 * for multi subject and watched derivations. 
 * An Ionic Effect is also a watched compound, but it needs a this.dirty = true in the trigger for retracking, so it is defined separately
 */
export class WatchedCompound extends IonicCompound<WatchedEntity> {

   constructor(
      compound: WatchedEntity
   ) {
      super(compound)
   }
   override trigger(): void {
      this.dirty = true;
      this.compound.asWatched!.triggerEffects()
   }
}