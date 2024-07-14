import { AnyObject } from "@rue/types";
import { track, trigger } from "./watch";
import { emitSignal } from "./useReactivity";

export type ReactiveObject<T extends AnyObject = AnyObject> = T

const setOfReactives = new WeakSet();

export function useReactivize(config?: { snapshots: boolean }) {
    const localReactives: WeakSet<ReactiveObject> = new WeakSet();

    let mutationPermitted = false;

    return {
        o$<T extends AnyObject>(target: T): ReactiveObject<T> {
            const reactive = new Proxy(target, {
                get(target, key) {
                    //TODO: ignore if it's a method on any of the prototypes
                    emitSignal();
                    const value = target[key];
                    track(value, target, key)
                    return value;
                },
                set(target: T, key: keyof T, newValue) { //TODO: need a different approach to Arrays, Sets, and Map
                    if (!mutationPermitted) throw "Object is readonly. It can only be mutated through corresponding `mu` function"
                    const oldValue = target[key];
                    if (oldValue === newValue) {
                        target[key] = newValue;
                        return true;
                    }
                    //@ts-expect-error
                    trigger(reactive, newValue, oldValue, key)
                    target[key] = newValue;
                    return true;
                }
            })
            localReactives.add(reactive)
            setOfReactives.add(reactive)
            return reactive as ReactiveObject<T>
        },

        mu<T extends ReactiveObject>(target: T, mutation: (o: T) => void) {
            if (!localReactives.has(target)) throw "`mu` can only mutate local reactives created with corresponding `o$` function";
            mutationPermitted = true;
            mutation(target);
            mutationPermitted = false;
        }
    }
}

export function isReactive(obj: AnyObject): obj is ReactiveObject {
    return setOfReactives.has(obj);
}