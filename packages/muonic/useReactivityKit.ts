import { AnyObject } from "@rue/types";

export type Reactive<T extends AnyObject = AnyObject> = T

const setOfReactives = new WeakSet();

export function useReactivityKit(config: { snapshots: boolean }) {
    const localReactives: WeakSet<Reactive> = new WeakSet();

    let mutationPermitted = false;

    return {
        reactivize<T extends AnyObject>(target: T): Reactive<T> {
            const reactive = new Proxy(target, {
                get(target, key) {
                    // maybeWatch = [target, key];
                    // if (settingUpComputed) collectForWatch(target, key);
                    // runGetters(target, key)
                    return target[key];
                },
                set(target: T, key: keyof T, value) {
                    // try {
                    //     runSetters(target, key, value);
                    // }
                    // catch (e) {
                    //     console.error(e);
                    //     return false;
                    // }
                    if (!mutationPermitted) throw "Object is readonly. It can only be mutated through corresponding `mu` function"
                    target[key] = value;
                    return true;
                }
            })

            return reactive as Reactive<T>
        },

        mu<T extends Reactive>(target: T, mutation: (o: T) => void) {
            if (!localReactives.has(target)) throw "`mu` can only mutate local reactives created with corresponding `reactivize` function";
            mutationPermitted = true;
            mutation(target);
            mutationPermitted = false;
        }
    }
}

export function isReactive(obj: AnyObject): obj is Reactive {
    return setOfReactives.has(obj);
}