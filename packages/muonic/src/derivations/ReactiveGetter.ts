import { ReactiveDerivation } from "./ReactiveDerivation";

export type ReactiveGetter = () => any

export function trackReactiveGetter(getter: () => any) {
    const _getter = new ReactiveDerivation(getter)
    _getter.trackDependencies(getter);
    _getter.forwardDependencies(_getter.dependencies) //QUESTION: Not sure if reactive effects need to forward dependencies as well
}