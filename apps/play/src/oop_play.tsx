import { Component, expose, fromTag, prep } from "@rue/lumo";
import { ion } from "@rue/quarky";
import { Article } from "./TestCustomCleanupScheduler";


// only want to expose increment


// $selected ... implementation is hidden by abstraction of an invisible aggregate state capsule


// OPTION A:
// - only bundle public methods with ion
// - write private methods as functions
// - pass down

// OPTION B:
// - bundle all methods in ion
// - select methods to expose
// - pass down

// OPTION C:
// - don't bundle methods
// - pass methods separately



function ListA() {

    const $count = ion(0, {
        XPOincrement() { /* public */ 
            $count.as($count() + 1)
        },

        decrement() { /* public */
            $count.as($count() - 1)
        }
    })

    return Component(
        expose({ // expose to parent or grandparents. Explicit
            incrementCount: $count.increment
        }),
        <>
            <h1>Hello World</h1>

            <p>{$count}</p>
            <button on:click={$count.increment}>increment</button>

            <Item count={$count()} />
            <Item $count={$count} />
            <Context provide={w(COUNT, $count)}> {/* non-explicit exposure by type; vulnerable decrement function */}
                <Article />
                <Footer />
            </Context>
        </>
    )
}


function List() {

    const $count = ion(0)

    function incrementCount() {
        $count.as($count() + 1)
    }

    function decrementCount() {
        $count.as($count() - 1)
    }


    return Component(
        expose({ // expose to parent or grandparents. Explicit
            incrementCount
        }),
        <>
            <h1>Hello World</h1>

            <p>{$count}</p>
            <button on:click={incrementCount}>increment</button>

            <Item countKit={{ $count, incrementCount }} /> {/* expose to child; explicit bundling*/}
            {/* // <Item $count={$count} incrementCount={incrementCount} /> {/* expose to child; explicit bundling*/}
            // <Item $count={expose($count, { increment: incrementCount })} /> {/* expose to child; explicit bundling*/}
            // <Context provide={w(COUNT, $count)}> {/* non-explicit exposure by type; vulnerable decrement function */}
            //     <Article />
            //     <Footer />
            // </Context> */}
        </>
    )
}

function Item(
    input = fromTag({
        countKit: v<{ $count: Ion<number>; incrementCount: () => void }>
    })
) {

}