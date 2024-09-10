import { AnyObject } from "@rue/types";
import { asObservedProp, ObservedProp } from "../reactivemodel/ObservedProp";
import { isReactiveModel, ReactiveModel } from "../reactivemodel/Reactive$";
import { AtomicSignal } from "../$Signal";

//TODO: onTrigger works as desired. onTrack needs to be rethunk.

export type WatchDebugOptions = {
    onTrack?: OnTrack;
    onTrigger?: OnTrigger;
}

type OnTrack = (target?: AtomicSignal | ObservedProp | ReactiveModel) => void
type OnTrigger = () => void

const onTrackMap: Map<AtomicSignal | ObservedProp | ReactiveModel, OnTrack> = new Map();
const onTriggerMap: Map<AtomicSignal | ObservedProp | ReactiveModel, OnTrigger> = new Map();

export function registerDebuggers(targets: (AtomicSignal | ObservedProp)[] | ReactiveModel, options: WatchDebugOptions | undefined){
    const {onTrack, onTrigger} = options ?? {}
    const _targets = isReactiveModel(targets) ? [targets] : targets
    if (onTrack){
        for (const target of _targets){
            onTrack(target) //TODO: THis works for watch, but derivedSignal and reactiveEffects will be tracked per re-eval
        }
    }
    if (onTrigger){
        for (const target of _targets){
            onTriggerMap.set(target, onTrigger);
        }
    }
}

export function runTrackDebugger(target: AtomicSignal | ObservedProp | ReactiveModel){
    const onTrack = onTrackMap.get(target);
    if (onTrack) onTrack();
}

export function runTriggerDebugger(target: AtomicSignal | ObservedProp | ReactiveModel){
    const onTrigger = onTriggerMap.get(target);
    if (onTrigger) onTrigger();
}

export function collectReactiveProps(target: ReactiveModel, deps?: ObservedProp[]) {
    if (!isReactiveModel(target)) return [];
    const _deps = deps || [];
    for (const key in target) {
        _deps.push(asObservedProp(target, key));
        const value = target[key];
        collectReactiveProps(value, _deps);
    }
    return _deps;
}

export function __addDevName<T extends AnyObject>(target: T, name: string){
    // @ts-expect-error
    target.__devName = name;
    return target;
}