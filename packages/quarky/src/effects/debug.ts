import { AnyObject } from "@rue/types";
import { isIonicModel, IonicModel } from "../ionize/ionize";
import { Ion } from "../ion/Ion";
import { PropIon } from "../ionize/PropIon";

//TODO: onTrigger works as desired. onTrack needs to be rethunk.

export type WatchDebugOptions = {
    onTrack?: OnTrack;
    onTrigger?: OnTrigger;
}

type OnTrack = (target?: Ion | PropIon | IonicModel) => void
type OnTrigger = () => void

const onTrackMap: Map<Ion | PropIon | IonicModel, OnTrack> = new Map();
const onTriggerMap: Map<Ion | PropIon | IonicModel, OnTrigger> = new Map();

export function registerDebuggers(targets: (Ion | PropIon)[] | IonicModel, options: WatchDebugOptions | undefined){
    const {onTrack, onTrigger} = options ?? {}
    const _targets = isIonicModel(targets) ? [targets] : targets
    if (onTrack){
        for (const target of _targets){
            onTrack(target) //TODO: THis works for watch, but DerivedIon and reactiveEffects will be tracked per re-eval
        }
    }
    if (onTrigger){
        for (const target of _targets){
            onTriggerMap.set(target, onTrigger);
        }
    }
}

export function runTrackDebugger(target: Ion | PropIon | IonicModel){
    const onTrack = onTrackMap.get(target);
    if (onTrack) onTrack();
}

export function runTriggerDebugger(target: Ion | PropIon | IonicModel){
    const onTrigger = onTriggerMap.get(target);
    if (onTrigger) onTrigger();
}

export function collectReactiveProps(target: IonicModel, deps?: PropIon[]) {
    if (!isIonicModel(target)) return [];
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