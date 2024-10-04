import { Component } from "@rue/lumo";
import { ion, ionize, watch } from "../../../packages/quarky/src";
import { asPropIon } from "../../../packages/quarky/src/ionize/PropIon";


export function TestIonProp() {
    const $count = ion(0, {
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

    

    const $bigBirdSleep = asPropIon($bigBird, 'sleep')
    console.log($bigBirdSleep)

    const $doubleCount = ion(() => $count() * 2)

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

    const $firstName = ion('Kermit', {
        set(name: string){
            this.set(name)
        }
    })
    const $lastName = ion('The Frog')

    const $fullName = ion({
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
            <button onClick={setFullName}>Sir robin</button>
            <div>{$count}</div>
            <div>{$doubleCount}</div>
            <button onClick={$count.increment}>increment</button>
            <hr></hr>
            <div>{() => $counter.count}</div>
            <div>{() => $counter.doubleCount}</div>
            <button onClick={$counter.incrementCount}>increment</button>
            <div>{() => $counter.frog}</div>
            <button onClick={$bigBird.changeSleep}>changeSleep</button>
        </>
    )
}