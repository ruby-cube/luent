import { Component } from "@rue/lumo";
import { Ion, ionize } from "../../../packages/quarky/src";
import { AnyObject } from "@rue/types";



export function TestIonProp() {
    const $count = Ion(0, {
        increment() {
            $count.set($count() + 1)
        }
    })
    const $doubleCount = Ion(() => $count() * 2)

    const $counter = ionize({
        count: $count,
        doubleCount: $doubleCount,
        incrementCount: $count.increment
    })

    const $firstName = Ion('Kermit')

    const $lastName = Ion('The Frog')

    const $fullName = Ion({
        get() {
            return $firstName() + " " + $lastName()
        },
        set(name: string) {
            const splitName = name.split(" ");
            $firstName.set(splitName[0])
            $lastName.set(splitName[1])
            return name;
        }
    })

    function setFullName() {
        $fullName.set('SirRobin theBrave')
    }

    return Component(
        <>
            <div>{$firstName}</div>
            <div>{$lastName}</div>
            <div>{$fullName}</div>
            <button onclick={setFullName}>Sir robin</button>
            <div>{$count}</div>
            <div>{$doubleCount}</div>
            <button onclick={$count.increment}>increment</button>
            <hr></hr>
            <div>{() => $counter.count}</div>
            <div>{() => $counter.doubleCount}</div>
            <button onclick={$counter.incrementCount}>increment</button>
        </>
    )
}