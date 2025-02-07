

function collectAbsorbedIons(ionicModel: Ionized<AnyObject>, tracker: AsIonicCompound) {
   const target = toRaw(ionicModel);
   for (const key in target) {
      const value = target[key]
      if (isMuon(value)) {
         tracker.track(value)
      }
   }
   return tracker.deps
}