// import { installIonicArray } from "./ionized/IonizedArray"
import { installIonicMap } from "./ionic/$$Map"
import { installIonicSet } from "./ionic/$$Set"

// TODO: limit exports to public api
export * from "./debug/debug" 
// export * from "./ionic/x_ionize" 
export * from "./ion/AtomicIon" 
export * from "./ion/Ion" 
export * from "./ion/DerivationIon" 
export * from "./ion/Get" 
export * from "./ion/type-utils" 
export * from "./reactivity/Watcher" 
export * from "./reactivity/RenderCycle" 
export * from "./reactivity/Update" 
export * from "./reactivity/Compound" 
export * from "./reactivity/Substance" 
export * from "../../lumo/src/animation" 
export * from "./reactivity/EffectQueue" 
export * from "./ionic/x_TimeTraveler" 
export * from "./ionic/Ionic" 
export * from "./ionic/ModelQuark" 
export * from "./ionic/$$Array" 
export * from "./__notes__/areEqual" 
export * from "./reactivity/ionicTask" 
export * from "../../lumo/src/specialty/FiniteState" 

// installIonicArray()
installIonicSet()
installIonicMap()