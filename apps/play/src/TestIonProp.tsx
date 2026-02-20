import { template } from "@rue/lumo";
import { ion, ionic, ionize, watch } from "@rue/quarky";


export function TestIonProp() {
    const $count = Ion(0, {
        increment() {
            $count.value = $count() + 1
        }
    })

    const $bigBird = ionize({
        sleep: 'blblblbl'
    }, {
        changeSleep() {
            $bigBird.sleep = 'mndfkj'
        }
    })



    const $bigBirdSleep = asPion($bigBird, 'sleep')
    console.log($bigBirdSleep)

    const $doubleCount = Ion(
        () => $count() * 2
    )

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

    watch($counter, ({mutations}) => {
        console.log('$counter mutated', mutations)
    })

    const $firstName = Ion('Kermit', {
        set(name: string) {
            $firstName.value = name
        }
    })
    const $lastName = Ion('The Frog')

    const $fullName = Ion(() =>$firstName() + " " + $lastName(), {
        set(name: string) {
            const splitName = name.split(" ");
            $firstName.value = splitName[0]
            $lastName.value = splitName[1]
            return name;
        }
    })

    function setFullName() {
        $fullName.set('SirRobin theBrave')
    }

    return template(
        <>
            <div>{$firstName}</div>
            <div>{$lastName}</div>
            <div>{$fullName}</div>
            <button on:click={setFullName}>Sir robin</button>
            <div>{$count}</div>
            <div>{$doubleCount}</div>
            <button on:click={$count.increment}>increment</button>
            <hr></hr>
            <div>{() => $counter.count}</div>
            <div>{() => $counter.doubleCount}</div>
            <button on:click={$counter.incrementCount}>increment</button>
            <div>{() => $counter.frog}</div>
            <button on:click={$bigBird.changeSleep}>changeSleep</button>
        </>
    )
}