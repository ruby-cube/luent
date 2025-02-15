import { AnyObject } from "@rue/types";
import { isIonizedModel, Ionized } from "../ionized/ionize";
import { AtomicIon } from "../ion/AtomicIon";
import { PropIon } from "../ion/AtomicPion";

//TODO: onTrigger works as desired. onTrack needs to be rethunk.

export type WatchDebugOptions = {
    onTrack?: OnTrack;
    onTrigger?: OnTrigger;
}

type OnTrack = (target?: AtomicIon | PropIon | IonizedModel) => void
type OnTrigger = () => void

const onTrackMap: Map<AtomicIon | PropIon | IonizedModel, OnTrack> = new Map();
const onTriggerMap: Map<AtomicIon | PropIon | IonizedModel, OnTrigger> = new Map();

export function registerDebuggers(targets: (AtomicIon | PropIon)[] | IonizedModel, options: WatchDebugOptions | undefined){
    const {onTrack, onTrigger} = options ?? {}
    const _targets = isIonizedModel(targets) ? [targets] : targets
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

export function runTrackDebugger(target: AtomicIon | PropIon | IonizedModel){
    const onTrack = onTrackMap.get(target);
    if (onTrack) onTrack();
}

export function runTriggerDebugger(target: AtomicIon | PropIon | IonizedModel){
    const onTrigger = onTriggerMap.get(target);
    if (onTrigger) onTrigger();
}

export function collectReactiveProps(target: IonizedModel, deps?: PropIon[]) {
    if (!isIonizedModel(target)) return [];
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