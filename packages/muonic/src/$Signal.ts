import { emitSignal } from "./debug";
import { isDeepReactive, isReactiveModel, DeepReactive$, Reactive$, ReactiveModelDepth } from "./reactivemodel/Reactive$";
import { track } from "./derivations/DependencyTracker";
import { trigger } from "./trigger";
import { ReactiveAtom } from "./derivations/ReactiveAtom";
import { destroyAsAtom, initializeAsAtom, ReactivePrimitive } from "./ReactivePrimitive";
import { unwatch, watch, Watchable } from "./effects/Watchable";
import { WatchTarget } from "./effects/WatchTarget";

export type AtomicSignal<T = any> = {
    (): T;
    [SIGNAL_MARKER]: SignalState<T>;
    setFrom: (toNewValue: (value: T) => T) => T
    setTo: (newValue: T) => T
}

export const SIGNAL_MARKER = Symbol('signal');

export class SignalState<T = unknown> implements ReactivePrimitive, Watchable {

    constructor(
        public $signal: AtomicSignal<T>,
        public value: T,
        public depth?: ReactiveModelDepth
    ) { }

    asWatchTarget?: WatchTarget<Watchable> | undefined;
    watch = watch
    unwatch = unwatch

    asAtom?: ReactiveAtom | undefined;
    initializeAsAtom = initializeAsAtom
    destroyAsAtom = destroyAsAtom
}


export function $Signal<T>(value: T) {
    let signalState: SignalState

    function $signal() {
        if (__DEV__) emitSignal();
        track(signalState)
        return signalState.value;
    }

    // mark reactive depth of value if value is ReactiveModel
    const depth =
        value instanceof Object ?
            isDeepReactive(value) ? ReactiveModelDepth.DEEP
                : isReactiveModel(value) ? ReactiveModelDepth.SHALLOW
                    : undefined
            : undefined

    signalState = new SignalState($signal, value, depth)

    $signal[SIGNAL_MARKER] = signalState;
    $signal.setTo = setTo.bind(signalState);
    $signal.setFrom = setFrom.bind(signalState);

    return $signal as AtomicSignal<T>;
}


function setTo(this: SignalState, newValue: unknown) {
    const value = this.value;
    if (value === newValue) return value;
    return setValue(this, newValue);
}

function setFrom(this: SignalState, toNewValue: (value: unknown) => unknown) {
    const value = this.value;
    const newValue = toNewValue(value)
    if (value === newValue) return value;
    return setValue(this, newValue);
}

// ORDER:
// - set value
// - trigger effects (run sync effects, schedule effects)
// - trigger derivations effects (run sync effects, schedule effects)

function setValue(signal: SignalState, newValue: unknown) {
    const $signal = signal.$signal;
    const _newValue = maybeReactivizeValue(newValue, signal)
    signal.value = _newValue;
    trigger($signal[SIGNAL_MARKER]);
    return _newValue;
}

function maybeReactivizeValue(newValue: unknown, signal: SignalState) {
    return newValue instanceof Object ?
        signal.depth === ReactiveModelDepth.DEEP ? DeepReactive$(newValue) :
            signal.depth === ReactiveModelDepth.SHALLOW ? Reactive$(newValue) :
                newValue : newValue
}


export function isAtomicSignal(maybeSignal: any): maybeSignal is AtomicSignal {
    if (maybeSignal instanceof Function) return SIGNAL_MARKER in maybeSignal;
    return false;
}