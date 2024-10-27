//@ts-nocheck
import { Component } from "@rue/lumo";
import { ion, AtomicIon, ionize } from "./src";




function Counter() {

    // const $count = ion(0, {
    //     increment() {
    //         return $count() + 1;
    //     },
    //     decrement() {
    //         return $count() - 1;
    //     },
    //     set(num: number) {
    //         return num;
    //     }
    // }, {
    //     toString() {
    //         return $count().toString()
    //     }
    // })

    const $count = ion(0, {
        increment() {
            $count.as($count() + 1)
        },
        decrement() {
            $count.set(count => count--);
        },
        isEqualToZero() {
            return $count() === 0;
        }
    })

    const $fullName = ion({
        get() {
            return $firstName() + $lastName()
        },
        set(name) {
            const [firstName, lastName] = name.split(" ")
        }
    })

    provide(COUNT, protect($count, { allow: ['increment', 'set'] }))
    provide(COUNT, protect($count, { exclude: 'decrement' }))
    provide(COUNT, protect($count)) // read-only
    provide(COUNT, $count) // all methods

    const incrementBtnSetup = {
        onclick: $count.increment
    }

    return Component(
        <>
            <button onclick={$count.increment}>{$count()}</button>
            <button onclick={$count.decrement}>decrease</button>
        </>
    )
}


function Mouse(
    setup: {
        x: number,
        y: number
    }
) {

    const $position = ionize({ //TODO: How to prevent infinite lopp if mutated in ionic effect? And what if a method both gets and mutates?
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
            <button onclick={$position.moveRight}>move right</button>
        </>
    )
}

class Frog {

}

markIonizable(Frog)

export function IonicFrog() {
    return ionize(new Frog())
}