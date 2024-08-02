import { asReactiveProp, ReactiveProp } from "./ReactiveProp";
import { isReactiveModel, ReactiveModel } from "./useReactiveModel";
import { Signal } from "./useSignals";

export type WatchDebugOptions = {
    onTrack?: () => void;
    onTrigger?: () => void;
}

type OnTrack = () => void
type OnTrigger = () => void

const onTrackMap: Map<Signal | ReactiveProp, OnTrack> = new Map();
const onTriggerMap: Map<Signal | ReactiveProp, OnTrigger> = new Map();

export function registerDebuggers(targets: (Signal | ReactiveProp)[], options: WatchDebugOptions | undefined){
    const {onTrack, onTrigger} = options ?? {}
    if (onTrack){
        for (const target of targets){
            onTrackMap.set(target, onTrack);
        }
    }
    if (onTrigger){
        for (const target of targets){
            onTriggerMap.set(target, onTrigger);
        }
    }
}

export function runTrackDebugger(target: Signal | ReactiveProp){
    const onTrack = onTrackMap.get(target);
    if (onTrack) onTrack();
}

export function runTriggerDebugger(target: Signal | ReactiveProp){
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