// import { installIonicArray } from "./ionized/IonizedArray"
import { installIonicMap } from "./ionic/IonicMap"
import { installIonicSet } from "./ionic/IonicSet"

// TODO: limit exports to public api
export * from "./debug/debug" 
export * from "./ionic/ionize" 
export * from "./ion/AtomicIon" 
export * from "./ion/Ion" 
export * from "./ion/DerivationIon" 
export * from "./ion/Get" 
export * from "./ion/type-utils" 
export * from "./reactivity/watch" 
export * from "./reactivity/UpdateCycle" 
export * from "./reactivity/WatchSubject" 
export * from "../../lumo/src/animation" 
export * from "./reactivity/EffectQueue" 
export * from "./ionic/TimeTraveler" 
export * from "./ionic/Ionic" 
export * from "./__notes__/areEqual" 
export * from "./abstract/IonicCompound" 
export * from "./reactivity/IonicTask" 
export * from "../../lumo/src/specialty/FiniteState" 

// installIonicArray()
installIonicSet()
installIonicMap()