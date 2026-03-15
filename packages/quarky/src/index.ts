// import { installIonicArray } from "./ionized/IonizedArray"
import { installIonicMap } from "./ionic/$$Map"
import { installIonicSet } from "./ionic/$$Set"

// TODO: limit exports to public api
export * from "./debug/debug" 
export * from "./async/AsyncIon" 
export * from "./async/Suspense" 
export * from "./async/ooo" 
export * from "./async/Action" 
export * from "./ion/AtomicIon" 
export * from "./ion/Ion" 
export * from "./ion/DerivationIon" 
export * from "./ion/Get" 
export * from "./ion/type-utils" 
export * from "./reactivity/Watcher" 
export * from "./reactivity/RenderCycle" 
export * from "./reactivity/Compound" 
export * from "./reactivity/Subject" 
export * from "./reactivity/EffectQueue" 
export * from "./ionic/Ionic" 
export * from "./ionic/ModelQuark" 
export * from "./ionic/$$Array" 
export * from "./ionic/$$Iterator" 
export * from "./__notes__/areEqual" 
export * from "./reactivity/IonicTask" 
export * from "./reactivity/Update" 
export * from "./reactivity/animation" 
export * from "./debug/dev" 
export * from "./ionic/utils" 

// installIonicArray()
installIonicSet()
installIonicMap()