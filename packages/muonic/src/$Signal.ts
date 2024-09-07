import { emitSignal } from "./hasReactivity_DEV";
import { isDeepReactive, isReactiveModel, DeepReactive$, Reactive$, ReactiveModelDepth } from "./reactivemodel/Reactive$";
import { track } from "./derivations/DependencyTracker";
import { useUpdateCycle } from "./effects/UpdateCycle";
import { trigger, triggerReactiveAtom, triggerReactivePrimitive } from "./trigger";
import { asReactiveAtom, isReactiveAtom } from "./derivations/ReactiveAtom";
import { isWatched } from "./effects/watch";

export type Signal<T = any> = {
    (): T;
    [SIGNAL_MARKER]: boolean;
    x__depth: undefined | ReactiveModelDepth;
    setFrom: (toNewValue: (value: T) => T) => T
    setTo: (newValue: T) => T
}

export const SIGNAL_MARKER = 'x__isSignal';


export function $Signal<T>(value: T): Signal<T> {
    let prevValue = value;
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
        return setValueAndTrigger(newValue);
    }

    function setFrom(toNewValue: (value: T) => T) {
        const newValue = toNewValue(_value)
        if (_value === newValue) return _value;
        return setValueAndTrigger(newValue);
    }

    function setValueAndTrigger(newValue: T) {
        const _newValue = maybeReactivizeValue(newValue, $signal)
        _value = _newValue;
        trigger($signal);
        return _newValue;
    }

    return $signal as Signal<T>;
}

function maybeReactivizeValue(newValue: any, $signal: Signal) {
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


export function isSignal(maybeSignal: any): maybeSignal is Signal {
    if (maybeSignal instanceof Function) return SIGNAL_MARKER in maybeSignal;
    return false;
}



