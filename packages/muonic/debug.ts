import { AnyObject } from "@rue/types";
import { asReactiveProp, ReactiveProp } from "./ReactiveProp";
import { isReactiveModel, ReactiveModel } from "./Reactive$";
import { Signal } from "./$Signal";

//TODO: onTrigger works as desired. onTrack needs to be rethunk.

export type WatchDebugOptions = {
    onTrack?: OnTrack;
    onTrigger?: OnTrigger;
}

type OnTrack = (target?: Signal | ReactiveProp | ReactiveModel) => void
type OnTrigger = () => void

const onTrackMap: Map<Signal | ReactiveProp | ReactiveModel, OnTrack> = new Map();
const onTriggerMap: Map<Signal | ReactiveProp | ReactiveModel, OnTrigger> = new Map();

export function registerDebuggers(targets: (Signal | ReactiveProp)[] | ReactiveModel, options: WatchDebugOptions | undefined){
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

export function runTrackDebugger(target: Signal | ReactiveProp | ReactiveModel){
    const onTrack = onTrackMap.get(target);
    if (onTrack) onTrack();
}

export function runTriggerDebugger(target: Signal | ReactiveProp | ReactiveModel){
    const onTrigger = onTriggerMap.get(target);
    if (onTrigger) onTrigger();
}

export function collectReactiveProps(target: ReactiveModel, deps?: ReactiveProp[]) {
    if (!isReactiveModel(target)) return [];
    const _deps = deps || [];
    for (const key in target) {
        _deps.push(asReactiveProp(target, key));
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