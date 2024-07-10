let maybeWatch: [AnyObject, string | symbol] | null = null;
let toWatch: [AnyObject, string | symbol][] | null = null;
let settingUpComputed = false;
type Getter = (target: AnyObject, key: string | symbol) => void
const getterMap: Map<AnyObject, Map<string | symbol, Getter[]>> = new Map();
type Setter = (value, oldValue, target, key) => void
const setterMap: Map<AnyObject, Map<string | symbol, Setter[]>> = new Map();

class Observable {
    $: AnyObject
    
    makeObservable() {

    }
}


class Amphibian {
    $: {
        environment: string
        point: {
            x: number,
            y: number
        },
        child: Frog
    }

    constructor(env: string) {
        this.$ = o$({
            environment: env,
            point: {
                x: 0,
                y: 0
            },
            child: new Frog("sir robin", "green")
        })
    }

    changeEnvironment(environs: string) {
        this.$.environment = environs;
    }
}





export class Frog implements Amphibian {
    $: {
        name: string
        color: string
        character: string[] | null
        croakSound: string
        environment: string
        point: {
            x: number,
            y: number
        },
        child: Frog
    };

    $children: string[]

    constructor(name: string, color: string) {
        const amphibian = new Amphibian("water");

        this.$ = o$({
            name,
            color,
            character: [],
            croakSound: "meep",
            environment: amphibian.$.environment,
            point: {
                x: 0,
                y: 0
            },
            child: new Frog("sir robin", "green")
        })
    }

    changeEnvironment = Amphibian.prototype.changeEnvironment

    changeColor(color: string) {
        this.$.color = color;
    }

}

const frog = new Frog("Sir Robin", "green");

frog.changeEnvironment("grass")

frog.$children.push("gallant"); // mutate arrays .. but what if $children might be null or a string?
frog.$.character = [...frog.$.character, "gallant"]; // treat arrays as immutable values



type AnyObject = { [key: string | number | symbol]: any }

function o$<T extends AnyObject>(target: T) { // only create a proxy if object literal or Array literal (constructor === Object) (Array literal)
    return new Proxy(target, {
        get(target, key) {
            maybeWatch = [target, key];
            if (settingUpComputed) collectForWatch(target, key);
            runGetters(target, key)
            return target[key];
        },
        set(target: AnyObject, key, value) {
            try {
                runSetters(target, key, value);
            }
            catch (e) {
                console.error(e);
                return false;
            }
            target[key] = value;
            return true;
        }
    })
}

function collectForWatch(target: AnyObject, key: string | symbol) {
    const collection = toWatch || [];
    collection.push([target, key])
}



function runGetters(target: AnyObject, key: string | symbol) {
    const getterQueueMap = getterMap.get(target);
    const getterQueue = getterQueueMap?.get(key);
    if (getterQueue) {
        let i = 0
        while (i < getterQueue.length) {
            getterQueue[i](target, key)
            i++;
        }
    }
}

function runSetters(target: AnyObject, key: string | symbol, value: any) {
    const prevValue = target[key];
    const setterQueueMap = setterMap.get(target);
    const setterQueue = setterQueueMap?.get(key);
    if (setterQueue) {
        let i = 0
        while (i < setterQueue.length) {
            setterQueue[i](value, prevValue, target, key)
            i++;
        }
    }
}



function watch(target, cb)
function watch(target, key, cb)
function watch(target, keyOrCb, cb?) {
    const key = cb === undefined ? null : keyOrCb;
    const _cb = cb ?? keyOrCb;
    if (key) {
        const setterQueueMap = setterMap.get(target) || new Map()
        const setterQueue = setterQueueMap.get(key) || [];
        setterQueue.push(_cb);
        setterQueueMap.set(key, setterQueue);
        setterMap.set(target, setterQueueMap)
    }
    else {

    }
}



function computed$<T>(cb: (prevValue?: T) => T) {
    settingUpComputed = true;
    const $signal = $(cb());
    settingUpComputed = false;
    return $signal;
}


// =======
// HISTORY

// type Observable = AnyObject;



function setupWatchers(target) {
    const targetMap = new Map();


    watch(target, (object, oldValues) => {

    })

}

const changedObservables = new Set();
// const queuedSettersMap

function queueSetter(target: Observable) {
    changedObservables.add(target);
}

function runQueuedSetters() {

}

function watchAll(target: Observable, cb: (target: AnyObject, key: string | symbol, value: any, oldValue: any) => void) {

}

// watchAll(frog.$, () => {

// })




watch([frog.$, "color"], (value, oldValue) => {
    console.log(`I changed from ${oldValue} to ${value}`)
})

frog.changeColor("purple")