import { emitSignal } from "./hasReactivity_DEV";
import { isDeepReactive, isReactiveModel, DeepReactive$, Reactive$, ReactiveModelDepth } from "./reactivemodel/Reactive$";
import { track } from "./derivations/DependencyTracker";
import { useUpdateCycle } from "./effects/UpdateCycle";
import { trigger } from "./trigger";
import { asReactiveAtom, isReactiveAtom } from "./derivations/ReactiveAtom";
import { isWatched } from "./effects/watch";

export type AtomicSignal<T = any> = {
    (): T;
    [SIGNAL_MARKER]: boolean;
    x__depth: undefined | ReactiveModelDepth;
    setFrom: (toNewValue: (value: T) => T) => T
    setTo: (newValue: T) => T
}

export const SIGNAL_MARKER = 'x__isAtomicSignal';


export function $Signal<T>(value: T): AtomicSignal<T> {
    let _value: T = value;
    function $signal() {
        if (__DEV__) emitSignal();
        track($signal)
        return _value;
    }

    // mark reactive depth of value if value is ReactiveModel
    if (value instanceof Object) {
        if (isDeepReactive(value)) {
            $signal.x__depth = ReactiveModelDepth.DEEP;
        }
        else if (isReactiveModel(value)) {
            $signal.x__depth = ReactiveModelDepth.SHALLOW;
        }
    }

    $signal[SIGNAL_MARKER] = true;
    $signal.setTo = setTo;
    $signal.setFrom = setFrom;

    function setTo(newValue: T) {
        if (_value === newValue) return _value;
        return setValue(newValue);
    }

    function setFrom(toNewValue: (value: T) => T) {
        const newValue = toNewValue(_value)
        if (_value === newValue) return _value;
        return setValue(newValue);
    }

    function setValue(newValue: T) {
        const _newValue = maybeReactivizeValue(newValue, $signal)
        _value = _newValue;
        trigger($signal);
        return _newValue;
    }

    return $signal as AtomicSignal<T>;
}

function maybeReactivizeValue(newValue: any, $signal: AtomicSignal) {
    return newValue instanceof Object ?
        $signal.x__depth === ReactiveModelDepth.DEEP ? DeepReactive$(newValue) :
            $signal.x__depth === ReactiveModelDepth.SHALLOW ? Reactive$(newValue) :
                newValue : newValue
}




// ORDER:
// - store initial value
// - set value
// - trigger effects (run sync effects, schedule effects)
// - trigger derivations effects (run sync effects, schedule effects)


export function isAtomicSignal(maybeSignal: any): maybeSignal is AtomicSignal {
    if (maybeSignal instanceof Function) return SIGNAL_MARKER in maybeSignal;
    return false;
}



