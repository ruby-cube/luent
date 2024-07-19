import { ifCase } from "../packages/lumo/ifCase";
import { forEachIn } from "../packages/lumo/forEachIn";
import { useReactivity } from "../packages/muonic/useReactivity";
import { Signal } from "../packages/muonic/useSignalize";
import { watch } from "../packages/muonic/watch";
import { mE } from "../packages/lumo/mE";
import { setUpNode, setUpNodesIn } from "../packages/lumo/setUpNode";
import { ReactiveSignal } from "../packages/muonic/useDerivedSignal";
import { onDeactivated, onUnmounted } from "../packages/lumo/lifecycle";

const { $, mu, o$, set } = useReactivity()

export function App() {
    const $list = $(['one', 'two', 'three'])
    const list$ = o$(['one', 'two', 'three'])
    const $count = $(0);
    const $another = $(2);
    const $doubleCount = $(() => {
        console.log("recalculating")
        return $count() * 2
    })

    const $active = $(true);
    let count = 0

    function click() {
        mu(list$, (o) => {
            o.splice(1, 0, 'fou ' + count)
        })
        count++
        // set($list, (o) => [...o, "hi" + count])
        // count++;
        set($count, (c) => c + 1);
        // changeFrog()
        // set($another, (v) => v - 2)
        // set($active, (v) => !v)
    }

    function clickItem(e: Event, index: number) {
        console.log('index', index)
        mu(list$, (o) => {
            o.splice(index, 1)
        })
    }

    const frog$ = o$({
        name: 'kermit',
        sound: 'ribbit',
        character: 'silly'
    })

    function changeFrog() {
        mu(frog$, (o) => {
            o.name = 'sir robin'
            o.character = "brave"
        })
    }

    watch(frog$, (frog, oldFrog) => {
        console.log("frog", frog)
        console.log("old frog", oldFrog)
    })

    const xLis = setUpNodesIn(list$, 'li', (_, $index) => ({
        style: { cursor: 'pointer' },
        on: { click: clickItem },
        $index
    }))

    const xButton = setUpNode('button', {
        on: {
            click
        }
    })

    const xToggleButton = setUpNode('button', {
        on: {
            click() {
                set($active, (val) => !val)
            }
        }
    })

    return {
        render: () => [
            mE('div', [$doubleCount]),
            mE('div', [
                // mE('ul', [
                //     forEachIn(list$, (item) => [
                //         mE('li', [item], xLis),
                //         // mE('li', [item + ' copy'])
                //     ])
                // ], 'ul')
            ], 'div'),

            mE('div', [
                mE('ul', [
                    mE('button', ['toggle'], xToggleButton),
                    ifCase($active, {
                        mount: () => [
                            // mE('div', [$count]),
                            mE(List, [], {}, { preserve: true })
                        ],
                        else: () => [
                            mE('div', ['show me']),
                            mE('button', ['Non functioning'])
                        ],
                    }, {preserve: true}),
                    mE('div', ['something else']),
                    // ifCase($active, {
                    //     mount: () => [
                    //         mE('div', ['show me']),
                    //         mE('button', ['Non functioning'])
                    //     ],
                    //     else: () => [
                    //         mE('div', ['or else']),
                    //         mE(List)
                    //     ]
                    // }),
                ], 'ul')
            ], 'div'),
            mE('button', ['click me'], xButton),
        ]
    }
}


function List() {

    onDeactivated(()=>{
        console.log("deactivated")
    })
    
    onUnmounted(()=>{
        console.log("unmounted")

    })

    const $count = $(0);
    function increment() {
        set($count, c => c + 1)
    }

    const xH2 = setUpNode('h2', {
        style: {
            backgroundColor: 'gold',
            border: '1px solid black'
        }
    })

    const xDiv = setUpNode('div', {
        style: {
            backgroundColor: 'gold'
        }
    })

    const xButton = setUpNode('button', {
        style: {
            backgroundColor: 'ghostwhite'
        },
        on: {
            click() {
                increment()
            }
        }
    })


    return {
        render: () => [
            mE('h2', ["I'm a component"], xH2),
            mE('div', [
                mE('blockquote', [$count]),
                mE('button', ['increment'], xButton)
            ], xDiv)
        ]
    }
}