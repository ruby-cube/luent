import { watch as vWatch } from "vue"
import { re } from "../archer/Archer"

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


type Signal<T> = () => T
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



export function watch<T extends { [key: string | symbol]: any }>(target: Observable<T>, cb: (val: T, oldVal: T, changedProps: Set<string> | undefined) => void) {

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

mu(frog.$, o => {    // setting multiple properties is OK
    o.color = "green"
    o.size = "small"
    o.points.x = 2 // X BUT DON'T DO THIS
})

mu(frog.$.points, o => { // do this separately instead
    o.x = 2
})



watch(count, (val, oldVal) => { }) // watch signal

watch([frog.$, "color"], (val, oldVal) => { }) // watch single property

watch(frog.$, (val, oldVal, changedProps) => {  // watch all properties
    val === frog.$
    oldVal === copyOfOriginal(frog.$)
})


watch([frog.$, "color", "name"], (val, oldVal) => { // watch multiple properties
    val === frog.$
    oldVal === copyOfOriginal(frog.$)
})


function copyOfOriginal(obj) { }

const fruits = $([]);

$fruits.push("bananas") // proxy

fruits().push("bananas")

fruits((f) => f.push("bananas"))


// if there are no watchers, does it matter how to batch changes? no

// so batching logic should reside with watchers... ... what determines when to batch changes (ie when to take a snapshot)? who determines it?
// - events? // <- think this is what vue uses as a tick   ... what about async handlers?
// - event flows?
// - after a certain threshold is reached?
// 
// batching logic for undo typing histories are different than time travel histories
