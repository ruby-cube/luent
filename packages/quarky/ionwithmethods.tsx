import { Component } from "@rue/lumo";
import { AtomicIon, Ion, ionize } from "./src";




function Counter() {

    // const $count = Ion(0, {
    //     increment() {
    //         return $count() + 1;
    //     },
    //     decrement() {
    //         return $count() - 1;
    //     },
    //     setTo(num: number) {
    //         return num;
    //     }
    // }, {
    //     toString() {
    //         return $count().toString()
    //     }
    // })

    const $count = Ion(0, {
        set: {
            increment() {
                return $count() + 1;
            },
            decrement() {
                return $count() - 1;
            },
            set(count: number) {
                return count;
            }
        }
    })

    const $fullName = Ion({
        get() {
            return $firstName() + $lastName()
        },
        set(name) {
            const [firstName, lastName] = name.split(" ")
        }
    })

    provide(COUNT, protect($count, { allow: ['increment', 'setTo'] }))
    provide(COUNT, protect($count, { exclude: 'decrement' }))
    provide(COUNT, protect($count)) // read-only
    provide(COUNT, $count) // all methods

    const incrementBtnSetup = {
        onClick: $count.increment
    }

    return Component(
        <>
            <button onClick={$count.increment}>{$count()}</button>
            <button onClick={$count.decrement}>decrease</button>
        </>
    )
}


function Mouse(
    setup: {
        x: number,
        y: number
    }
) {

    const $position = ionize({
        x: 0,
        y: 0,

        moveRight() {
            $position.x++;
        },

        moveLeft() {
            $position.x--;
        },

        moveUp() {
            $position.y++;
        },

        moveDown() {
            $position.y--;
        }
    })

    return Component(
        <>
            <div>mouse position: {$position.x}, {$position.y}</div>
            <button onClick={$position.moveRight}>move right</button>
        </>
    )
}

class Frog {

}

markIonizable(Frog)

export function IonicFrog(){
    return ionize(new Frog())
}