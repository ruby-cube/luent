//-@ts-nocheck
import { ComputedRef, Ref, ShallowRef, computed, isRef, reactive, shallowReactive, shallowRef, triggerRef } from "vue";
import { ExtensibleRef } from "./ExtensibleRef";

export type ReactiveRef = Ref | ComputedRef | ExtensibleRef;


type Signal<T> = {
    (): T;
    _ref: ShallowRef<T>;
}


// export function trackRefValue(ref: RefBase<any>) {
//     if (shouldTrack && activeEffect) {
//         ref = toRaw(ref)
//         if (__DEV__) {
//             trackEffects(ref.dep || (ref.dep = createDep()), {
//                 target: ref,
//                 type: TrackOpTypes.GET,
//                 key: 'value'
//             })
//         } else {
//             trackEffects(ref.dep || (ref.dep = createDep()))
//         }
//     }
// }





// class RefImpl<T> {
//     private _value: T
//     private _rawValue: T

//     public dep?: Dep = undefined
//     public readonly __v_isRef = true

//     constructor(value: T, public readonly __v_isShallow: boolean) {
//         this._rawValue = __v_isShallow ? value : toRaw(value)
//         this._value = __v_isShallow ? value : toReactive(value)
//     }

//     get value() {
//         trackRefValue(this)
//         return this._value
//     }

//     set value(newVal) {
//         const useDirectValue =
//             this.__v_isShallow || isShallow(newVal) || isReadonly(newVal)
//         newVal = useDirectValue ? newVal : toRaw(newVal)
//         if (hasChanged(newVal, this._rawValue)) {
//             this._rawValue = newVal
//             this._value = useDirectValue ? newVal : toReactive(newVal)
//             triggerRefValue(this, newVal)
//         }
//     }
// }


// function ref<T>(value: T) {
//     return {
//         _value: value,
//         _rawValue: value,
//         dep: undefined,
//         __v_isRef: true
//     }
// }



function $<T>(value: T): Signal<T> {
    const ref$ = shallowRef(value);
    const getter = () => ref$.value;
    getter._ref = ref$;
    return getter;
}

// function toRaw<T>(value: T): T extends Signal<infer V> ? V : T {
//     if (isSignal(value)) return toRaw(value());
//     return value;
// }

// function isSignal<T>(value: Signal<T>): value is Signal<T> {
//     const _ref = value._ref;
//     return _ref && isRef(_ref);
// }

// function $<T>(value: T): Signal<T> {
//     let _value = value;
//     const getter = () => {
//         trackRefValue
//     };
//     getter._ref = ref$;
//     return getter;
// }

function computed$<F extends () => any>(computation: F) {
    const c = computed(computation);
    return () => c.value;
}

function $set<T>(signal: Signal<T>, valueOrManipulator: T) {
    const isManipulator = typeof valueOrManipulator === "function" && typeof signal._ref.value !== "function";
    if (isManipulator) {
        const manipulate = valueOrManipulator;
        manipulate(signal._ref.value) //TODO:
    }
    else {
        const value = valueOrManipulator;
        signal._ref.value = value; //TODO: 
    }
}

function deepSignalize$<T>(obj: T): T extends { [key: string]: any } ? DeepSignalized$<T> : Signal<T> {
    if (!(obj instanceof Object) || obj instanceof Array || obj instanceof Set || obj instanceof Map) throw new Error("Signalize must take in a non-iterable object")
    //@ts-expect-error
    return $(deepSignalize(value));
}


function signalize<T extends { [key: string]: any }>(obj: T) {
    if (!(obj instanceof Object) || obj instanceof Array || obj instanceof Set || obj instanceof Map) throw new Error("Signalize must take in a non-iterable object")
    const signalObj = {} as { [Key in keyof T as Key extends string ? `${Key}$` : never]: Signal<T[Key]> }
    for (const key in obj) {    //TODO: see if proxy implementation would be more performant
        //@ts-expect-error
        signalObj[genSignalKey(key)] = $(obj[key])
    }
    return signalObj;
}




type DeepSignalized$<T> = Signal<{ [Key in keyof T as Key extends string ? `${Key}$` : never]: T[Key] extends { [key: string]: any } ? DeepSignalized$<T[Key]> : Signal<T[Key]> }>

function deepSignalize<T>(obj: T): { [Key in keyof T as Key extends string ? `${Key}$` : never]: T[Key] extends { [key: string]: any } ? DeepSignalized$<T[Key]> : Signal<T[Key]> } {
    if (!(obj instanceof Object) || obj instanceof Array || obj instanceof Set || obj instanceof Map) throw new Error("Signalize must take in a non-iterable object")
    const signalObj = {};
    for (const key in obj) {
        //@ts-expect-error
        signalObj[genSignalKey(key)] = deepSignalize$(obj[key])
    }
    //@ts-expect-error
    return signalObj;
}

function genSignalKey<K extends string>(key: K): `${K}$` {
    return `${key}$`;
}

function signalize$<T extends { [key: string]: any }>(obj: T) {
    return $(signalize(obj));
}



function $mutate<T extends Object>(mutable$: Signal<T>, mutation: (iterable: T) => void) {
    const iterable = mutable$();
    mutation(iterable);
    triggerRef(mutable$._ref);
}


// function $manipulate<T>(signal: Signal<T>, manipulation: (value: T) => T) {
//     $set(signal, manipulation(signal()));
// }




const count$ = $(0);   // shallowRef, signal

const selection$ = $({
    id: "hey",
    start$: $(0)
})



const item = signalize({   // shallowReactive, object of signals, ohs
    bullet: "•",
    blog: 0,
    dog: {
        bellow: "flkjsdfj",
        chree: "sldkfj"
    }
})



const item$ = signalize$({   // shallowReactive, object of signals, ohs
    bullet: "•",
    blog: 0,
    dog: {
        bellow: "flkjsdfj",
        chree: "sldkfj"
    }
})

const user = deepSignalize({  // reactive, deep ohss
    bullet: "•",
    blog: {
        rhogj: 0,
        blue: {
            horse: "ocot"
        }
    }
})

$set(user.blog$, deepSignalize({
    rhogj: 0,
    blue: {
        horse: "ocot"
    }
}))

item.dog$().bellow

user.blog$().blue$()

const user$ = deepSignalize$({     // ref, deep signal
    name: "Basil",
    blog: {
        rhogj: 0,
        blue: {
            horse: "ocot"
        }
    }
})

user$().name$

const { blue$, rhogj$ } = user$().blog$()




const list = {
    bullet$: $("*"),

    setBullet(value: string) {
        $set(this.bullet$, value)
    }
}


const doubleCount$ = computed$(() => count$() * 2);

$set(count$, count$() + 1);


const listItems$ = $([1, 2, 3]);

listItems$()[1];


$mutate(listItems$, (items) => items.push(1))

$set(user$, {
    name$: $(""),
    blog$: $({
        blue$: $({
            horse$: $("")
        }),
        rhogj$: $(0)
    })
})



