// import { installIonicArray } from "./ionized/IonizedArray"
import { installIonicMap } from "./ionic/IonizedMap"
import { installIonicSet } from "./ionic/IonizedSet"

// TODO: limit exports to public api
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
export * from "./reactivity/Effect" 
export * from "./ionic/Ionic" 
export * from "./ionic/IonicModel" 
export * from "./ionic/ModelQuark" 
export * from "./ionic/IonizedArray" 
export * from "./ionic/IonizedIterator" 
export * from "./reactivity/IonicTask" 
export * from "./__notes__/areEqual" 
export * from "./reactivity/Update" 
export * from "./reactivity/animation" 
export * from "./debug/dev" 

// installIonicArray()
installIonicSet()
installIonicMap()