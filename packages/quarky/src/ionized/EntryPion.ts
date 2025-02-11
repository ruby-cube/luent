
const entryKeyValidators: ((model: AnyObject, key: PropertyKey) => boolean)[] = [];

export function registerEntryKeyValidator(isEntryKey: (model: AnyObject, key: PropertyKey) => boolean) {
   entryKeyValidators.push(isEntryKey);
}


function isEntryKey(rawModel: AnyObject, key: PropertyKey) {
   for (const validator of entryKeyValidators) {
      const is = validator(rawModel, key)
      if (is) return true;
   }
   return false;
}

class PionQuarks implements AtomicPion {

   asReadonly?: PropIon
   // asObservedProp!: ObservedProp

   //to fulfill MetaWritableIon interface
   asReined = undefined
   isEntryKey = false;

   constructor(
      public model: IonizedModel,
      public key: PropertyKey,
      public inert: boolean = false
   ) {
      quarksOf(model).registerPion(key, this)
      this.isEntryKey = isEntryKey(toRaw(model), key)
   }
   private _entity: undefined | $AtomicPionState
   get entity() {

   }
   type: string | symbol = ATOMIC_PION

   asWatched?: Watched
   asParticle?: Particle
   private isIndex: boolean = false

   watch() {
      if (this.asWatched) return;
      const quarks = quarksOf(this.model)
      if (this.isEntryKey)
         quarks.addObservedEntryKey(this.key);

      const watchSubject = this.asWatched = asWatched(this.o)

      watchSubject.onUnwatched(() => {
         if (watchSubject.watchCount === 0 && this.asParticle?.compounds.size === 0) {
            this.discard()
         }
      })
   }

   unwatch: () => void;

   track() {
      if (this.asParticle) return;

      const particle = this.asParticle = asParticle(this.o)

      if (this.isEntryKey)
         quarksOf(this.model).addObservedEntryKey(this.key)

      particle.onDissociated(() => {
         if (this.asWatched?.watchCount === 0 && particle.compounds.size === 0) {
            this.discard()
         }
      })
   }

   discard() {
      const metaModel = quarksOf(this.model)
      const key = this.key
      if (this.isEntryKey) metaModel.deleteObservedEntryKey(key)
      metaModel.unregisterPropIon(key)
   }
}