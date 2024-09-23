import { Component } from "@rue/lumo";
import { Ion, ionize } from "@rue/muonic";

export function TestIonProp() {
    const $count = Ion(0)
    const $doubleCount = Ion(() => $count() * 2)

    const $counter = ionize({
        count: $count,
        doubleCount: $doubleCount,
        increment
    })

    const $firstName = Ion('Kermit')
    const $lastName = Ion('The Frog')

    const $fullName = Ion({
        get() {
            return $firstName() + " " + $lastName()
        },
        set(name: string) {
            const splitName = name.split(" ");
            $firstName.setTo(splitName[0])
            $lastName.setTo(splitName[1])
            return name;
        }
    })

    function setFullName() {
        $fullName.setTo('SirRobin theBrave')
    }



    function increment() {
        $count.set(count => count + 1)
    }
    return Component(
        <>
            <div>{$firstName}</div>
            <div>{$lastName}</div>
            <div>{$fullName}</div>
            <button onclick={setFullName}>Sir robin</button>
            <div>{$count}</div>
            <div>{$doubleCount}</div>
            <button onclick={increment}>increment</button>
            <hr></hr>
            <div>{() => $counter.count}</div>
            <div>{() => $counter.doubleCount}</div>
            <button onclick={$counter.increment}>increment</button>
        </>
    )
}