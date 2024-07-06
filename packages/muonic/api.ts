
import { Consolidate } from "@rue/types"
import { watch as vWatch } from "vue"

const NO_ARG = Symbol("no arg")
type NoArg = typeof NO_ARG;

type Signal<T = any> = (value?: T | NoArg) => T

/*

useSignalKit()

signalize // shallow, for object literals only

set

useReactivityKit() // returns reactivize and mutation function

reactivize // returns a readonly object

mu function  // two functions .. (1) because $ is automatically readonly, you need this function to mutate, it helps protect state (2) it also implements snapshots for rolling back state


--

observable capsule

--

memoize
isSignal
isReactive
toSignals

--
(use flask to manage auto-cleanup)

watch

initializeEffect


// Things to consider
// batch handler

--

_internal_

track   // indicates which task queue to subscribe to

trigger // "castHook"

*/

function readonly<T extends { [key: string]: Signal<any> }>(target: T /* | Observable */): T {
    const readonly = {};
    // if isSignal
    for (const key in target) {
        const signal = target[key];
        if (signal.length === 0) readonly[key] = target[key]; // signal already readonly
        else readonly[key] = (arg?: never) => {
            if (readonly) throw "Cannot set value of readonly signal"
            return target[key]
        }
    }
    return readonly;
}

export function $<T>(value: T): Signal<T> {
    let _value = value;
    const $signal = (value: T | NoArg = NO_ARG) => {
        if (value === NO_ARG) return _value;
        _value = value;
        return _value;
    }
    // patchMap.set($signal, {});
    return $signal;
}


// Question: Does it make sense (outside of performance concerns) to have Observable Capsules (instead of making the whole instance observable or having selective)

// State management options:

// Option A: Factory function (good for services)
function useCounter() {
    const $count = $(0);
    const $doubleCount = () => $count() * 2;

    return {
        ...readonly({
            $count,
            $doubleCount
        }),
        decrement() {   // [CON] new instance of methods for each instance

        },
        increment() {

        }
    }
}


// Option B: Observable Capsule Class
class CounterCapsule {
    $: { count: number; readonly doubleCount: number; };

    constructor() {
        this.$ = {
            count: 0,

            get doubleCount() {
                return this.count * 2
            }
        }
    }

    increment() {
        this.$.count++
    }

    decrement() {

    }

    initObservable() {
        return this;
    }
}

const counter = new CounterCapsule().initObservable()


// Option C: Class with signals and observables properties
// [CON]: making things readonly is a PAIN, and registering types
// either you set up getters, or you mark read only and 
class Counter {
    private _$count: Signal<number>;
    $doubleCount: () => number;
    $count: () => Signal<number>;

    constructor() {
        this._$count = $(0);
        this.$doubleCount = () => this._$count() * 2;
        this.$count = () => this._$count;

    }

    increment() {

    }

    decrement() {

    }
}

// Option D: Normal Class, make entire instance observable (including methods)
// [CON] Can't manage mutations with mu function


// Is there any reason to watch your own state or create hooks in your own methods? ... not really, so it's weird to create signals within a class
const { signalize, muonize, mu } = useReactivityKit({ snapshots: true });

const $complex = signalize({
    name: "harry",
    points: { x: 0, y: 0 }
}, DEEP)

mu($complex(), (o) => {
    o.name = "joe";
    o.points = { x: 9, y: 10 }
})






// app global state: object literal (not a class instance)
// - contains all state that needs to be saved to history
// - 


const appState = {
    docs: [{
        color: "red"
    }, {
        color: "blue"
    }, {
        color: "white"
    }]
}



// app state should be one giant lookup table of arrays

//behind the scenes ... how do you do this programmatically given the object
const prevApp = {
    ...appState,
    docs: [...appState.docs]
};
prevApp.docs[0] = { ...appState.docs[0] };

function recordPrevState(target: object) {
    const prevApp = { ...appState };
    for (const key in prevApp) {
        //@ts-ignore
        const val = appState[key]
        if (val === target) {

        }
    }
}

// user
appState.docs[0].color = "orange";

// user
const newDoc = { ...appState.docs[0], color: "orange" }

// behind the scenes
const newApp = {
    ...appState,
    docs: [...appState.docs]
}
newApp.docs[0] = newDoc


// type Signal<T = any> = (value?: T | NoArg) => T
type Observable<T extends { [key: string | symbol]: any } = { [key: string | symbol]: any }> = T
type Clone<T extends { [key: string | symbol]: any } = { [key: string | symbol]: any }> = T
type ObservableProps<T extends { [key: string | symbol]: any }> = [Observable<T>, ...string[]]
type BeginTick = boolean

const changedPropsMap: Map<Observable<{ [key: string | symbol]: any }>, Set<string> | undefined> = new Map();

const cloneMap: Map<Observable, Clone> = new Map();
// in mu, check if copy of object exists BEFORE setting property
// -- if not, make a copy of the target object (not the proxy)
// at end of event, clear clone map

class MutationBatcher {
    tick() {
        runTickTasks();
    }
}

type TickCb = () => void;

const tickTasks: TickCb[] = [];

function runTickTasks() {
    for (const cb of tickTasks) {
        cb();
    }
}

function onTick(cb: TickCb) {
    tickTasks.push(cb);
}

onTick(() => {
    changedPropsMap.clear();
    cloneMap.clear();
})

function mu(target: any, fn: (target: any) => void) {
    const clone = cloneMap.get(target)
    if (!clone) {
        cloneMap.set(target, target instanceof Array ? [...target] : { ...target })
    }
    fn(target);
    return target;
}



export function watch<T extends { [key: string | symbol]: any }>(target: (o?: any) => any, cb: (val: T, oldVal: T, changedProps: Set<string> | undefined) => void) {

    if (/* Observable */0) {
        collectChangedProps(target);
        vWatch(target, (val, oldVal) => {
            cb(target, cloneMap.get(target), changedPropsMap.get(target))
        })
    }
}


function collectChangedProps(target: { [key: string | symbol]: any }) {
    for (const key in target) {
        vWatch(() => target[key], (val, oldVal) => {
            if (val === oldVal) return;
            const changedProps = changedPropsMap.get(target) ?? new Set();
            changedProps.add(key)
        })
    }
}



// watch is called:
// sync watchers called --> parent renders --> watchers called --> component renders --> post-watchers called --> nextTick?

const myArray$ = o$([]); // observable state

watch(myArray$, (val, old, changedProps) => {

})

function count(fn: (c) => any) { }


count(c => c + 1);

const frog = {
    $: {
        color: "blue",
        size: "small",
        points: {
            x: 0,
            y: 0
        },
        child: {
            $: {
                color: "green"
            }
        }
    }
}

const dims$ = o$({

})

mu(frog.$, o => {   // must be an observable
    o.color = "green"
})

mu(frog.$.child.$, o => {  // must pass in the object whose property you want to set
    o.color = "green"
})

// mu(frog.$, o => o.$.child.$.color = "green") // X DO NOT DO THIS

mu(frog.$, o => {    // setting multiple properties at the same level of depth is OK
    o.color = "green"
    o.size = "small"
    o.points.x = 2 // X BUT DON'T DO THIS
})

mu(frog.$.points, o => { // do this separately instead
    o.x = 2
})

const $count = () => 0

set($count, c => c++)


function set(ar: any, ars: (arg: any) => any) {

}



watch($count, (val, oldVal) => { }) // watch signal

watch(() => frog.$.child, (val, oldVal) => { }) // watch single property

watch(frog.$, (val, oldVal, changedProps) => {  // watch all properties, deeply?
    val === frog.$
    oldVal === copyOfOriginal(frog.$)
})


watch(() => [$count(), frog.$.child, frog.$.color], (val, oldVal) => { // watch multiple properties
    val === frog.$
    oldVal === copyOfOriginal(frog.$)
})

watch(() => frog.$.points.x, (val, oldVal) => { // watch chained properties
    val === frog.$
    oldVal === copyOfOriginal(frog.$)
})


function copyOfOriginal(obj) { }

const fruits = $([]);

$fruits.push("bananas") // proxy

fruits().push("bananas")

fruits(f => f.push("bananas"))


// if there are no watchers, does it matter how to batch changes? no

// so batching logic should reside with watchers... ... what determines when to batch changes (ie when to take a snapshot)? who determines it?
// - events? // <- think this is what vue uses as a tick   ... what about async handlers?
// - event flows?
// - after a certain threshold is reached?
// 
// batching logic for undo typing histories are different than time travel histories
