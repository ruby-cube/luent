// import { installIonicArray } from "./ionized/IonizedArray"
import { installIonicMap } from "./ionized/IonizedMap"
import { installIonicSet } from "./ionized/IonizedSet"

export * from "./debug/debug" //TODO: limit exports to public api
export * from "./ionized/ionize" //TODO: limit exports to public api
export * from "./ion/AtomicIon" //TODO: limit exports to public api
export * from "./ion/Ion" //TODO: limit exports to public api
export * from "./ion/Neutron" //TODO: limit exports to public api
export * from "./ion/type-utils" //TODO: limit exports to public api
export * from "./watch/watch" //TODO: limit exports to public api
export * from "./effect-cycle/EffectCycle" //TODO: limit exports to public api
export * from "./effect-cycle/animation" //TODO: limit exports to public api
export * from "./effect-cycle/EffectQueue" //TODO: limit exports to public api
export * from "./ionized/TimeTraveler" //TODO: limit exports to public api
export * from "./ionized/ionize" //TODO: limit exports to public api
export * from "./ionized/inert" //TODO: limit exports to public api
export * from "./__notes__/areEqual" //TODO: limit exports to public api
// export * from "./capsule/Readonly" //TODO: limit exports to public api
export * from "./ionic/IonicCompound" //TODO: limit exports to public api
export * from "./ionic/DerivationIon" //TODO: limit exports to public api
export * from "./watch/ionicTask" //TODO: limit exports to public api
export * from "./ion/FiniteStates" //TODO: limit exports to public api
export * from "./effect-cycle/ReactivitySystem" //TODO: limit exports to public api

// installIonicArray()
installIonicSet()
installIonicMap()