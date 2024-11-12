import { installIonicArray } from "./ionize/IonicArray"
import { installIonicMap } from "./ionize/IonicMap"
import { installIonicSet } from "./ionize/IonicSet"

export * from "./derivations/DerivedIon" //TODO: limit exports to public api
export * from "./debug" //TODO: limit exports to public api
export * from "./ionize/ionize" //TODO: limit exports to public api
export * from "./ion/AtomicIon" //TODO: limit exports to public api
export * from "./ion/Ion" //TODO: limit exports to public api
export * from "./ion/toIons" //TODO: limit exports to public api
export * from "./ion/Ref" //TODO: limit exports to public api
export * from "./derivations/DependencyTracker" //TODO: limit exports to public api
export * from "./effects/watch" //TODO: limit exports to public api
export * from "./protect" //TODO: limit exports to public api
export * from "./effects/debug" //TODO: limit exports to public api
export * from "./effects/RenderCycle" //TODO: limit exports to public api
export * from "./ionize/TimeTraveler" //TODO: limit exports to public api
export * from "./ionize/ionize" //TODO: limit exports to public api
export * from "./effects/areEqual" //TODO: limit exports to public api
export * from "./protect" //TODO: limit exports to public api

installIonicArray()
installIonicSet()
installIonicMap()