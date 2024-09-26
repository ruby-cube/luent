import { Component } from "@rue/lumo";
import { Ion, ionize, watch } from "../../../packages/quarky/src";
import { asIon } from "../../../packages/quarky/src/ionize/PropIon";


export function TestIonProp() {
    const $count = Ion(0, {
        increment() {
            $count.set($count() + 1)
        }
    })

    const $bigBird = ionize({
        sleep: 'blblblbl'
    }, {
        changeSleep() {
            $bigBird.sleep = 'mndfkj'
        }
    })

    const $bigBirdSleep = asIon($bigBird, 'sleep')
    console.log($bigBirdSleep)

    const $doubleCount = Ion(() => $count() * 2)

    const $counter = ionize({
        frog: 'kermit',
        count: $count,
        doubleCount: $doubleCount,
        bigBirdSleep: $bigBirdSleep
    }, {
        incrementCount: $count.increment,
        changeFrog() {
            $counter.frog = 'sirRombin'
        }
    })

    watch($counter, (_, mutations) => {
        console.log('$counter mutated', mutations)
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
            <div>{() => $counter.frog}</div>
            <button onclick={$bigBird.changeSleep}>changeSleep</button>
        </>
    )
}