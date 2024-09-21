import { AnyObject } from "@rue/types";
import { asObservedProp, ObservedProp } from "../reactivemodel/ObservedProp";
import { isReactiveModel, ReactiveModel } from "../reactivemodel/ReactiveModel";
import { AtomicIon } from "../Ion";

//TODO: onTrigger works as desired. onTrack needs to be rethunk.

export type WatchDebugOptions = {
    onTrack?: OnTrack;
    onTrigger?: OnTrigger;
}

type OnTrack = (target?: AtomicIon | ObservedProp | ReactiveModel) => void
type OnTrigger = () => void

const onTrackMap: Map<AtomicIon | ObservedProp | ReactiveModel, OnTrack> = new Map();
const onTriggerMap: Map<AtomicIon | ObservedProp | ReactiveModel, OnTrigger> = new Map();

export function registerDebuggers(targets: (AtomicIon | ObservedProp)[] | ReactiveModel, options: WatchDebugOptions | undefined){
    const {onTrack, onTrigger} = options ?? {}
    const _targets = isReactiveModel(targets) ? [targets] : targets
    if (onTrack){
        for (const target of _targets){
            onTrack(target) //TODO: THis works for watch, but derivedIon and reactiveEffects will be tracked per re-eval
        }
    }
    if (onTrigger){
        for (const target of _targets){
            onTriggerMap.set(target, onTrigger);
        }
    }
}

export function runTrackDebugger(target: AtomicIon | ObservedProp | ReactiveModel){
    const onTrack = onTrackMap.get(target);
    if (onTrack) onTrack();
}

export function runTriggerDebugger(target: AtomicIon | ObservedProp | ReactiveModel){
    const onTrigger = onTriggerMap.get(target);
    if (onTrigger) onTrigger();
}

export function collectReactiveProps(target: ReactiveModel, deps?: ObservedProp[]) {
    if (!isReactiveModel(target)) return [];
    const _deps = deps || [];
    // for (const key in target) {
    //     _deps.push(asObservedProp(target, key));
    //     const value = target[key];
    //     collectReactiveProps(value, _deps);
    // }
    return _deps;
}

export function __addDevName<T extends AnyObject>(target: T, name: string){
    // @ts-expect-error
    target.__devName = name;
    return target;
}