import { installIonicMap } from "./ionic/IonizedMap"
import { installIonicSet } from "./ionic/IonizedSet"
installIonicSet()
installIonicMap()


export * from "./ion/Ion"
export * from "./ionic/Ionic"

export { toRaw } from "./ionic/IonicModel"
// export {
// 	ion,
// } from "./ion/Ion"
// export type { MutableIon, Ion } from "./ion/Ion"
// export {
// 	Ionic,
// 	ionic,
// 	as,
// 	EACH,
// } from "./ionic/Ionic"
// export type { Nested } from "./ionic/Ionic"
// export {
// 	toIon,
// 	toValue,
// } from "./ion/utils"
// export {
// 	AsyncIon,
// 	isPending,
// 	getAwaiting,
// 	$suspense,
// } from "./async/AsyncIon"
// export { SuspenseIon } from "./async/Suspense"
// export {
// 	o,
// 	ooo,
// } from "./async/ooo"
// export {
// 	watch,
// } from "./reactivity/Watcher"
// export {
// 	queueTask,
// 	atRender,
// 	PRELUDE,
// 	SYNC,
// } from "./reactivity/RenderCycle"
// export {
// 	getActiveUpdate,
// 	LaxUpdate,
// 	swiftUpdate,
// 	load,
// } from "./reactivity/Update"
// export { ionicTickTask } from "./reactivity/IonicTask"
// export {
// 	Animation,
// 	Interval,
// } from "./reactivity/animation"
// export { Finitron } from "./specialty/Finitron"
export * from "./async/AsyncIon"
export * from "./async/Suspense"
export * from "./async/ooo"
export * from "./async/Action"
export * from "./ion/AtomicIon"
export * from "./ion/DerivationIon"
export * from "./ion/Get"
export * from "./ion/utils"
export * from "./reactivity/Watcher"
export * from "./reactivity/RenderCycle"
export * from "./reactivity/Compound"
export * from "./reactivity/Subject"
export * from "./reactivity/Reaction"
export * from "./ionic/ModelQuark"
export * from "./ionic/IonizedArray"
export * from "./ionic/IonizedIterator"
export * from "./reactivity/IonicTask"
export * from "./reactivity/Update"
export * from "./reactivity/animation"
export * from "./specialty/Stream"
export * from "./specialty/Finitron"
export * from "./debug/dev"

