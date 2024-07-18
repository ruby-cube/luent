import { m, mE } from "../packages/lumo/mE";
import { ifCase } from "../packages/lumo/ifCase";
import { _mXO } from "../packages/lumo/makeComponent";
import { forEachIn } from "../packages/lumo/forEachIn";
import { useReactivity } from "../packages/muonic/useReactivity";
import { Signal } from "../packages/muonic/useSignalize";
import { watch } from "../packages/muonic/watch";

const { $, mu, o$, set } = useReactivity()

export function App() {
    const $list = $(['one', 'two', 'three'])
    const list$ = o$(['one', 'two', 'three'])
    const $count = $(0);
    const $another = $(2);
    const $doubleCount = $(() => {
        console.log("recalculating")
        return $count() + $another()
    }) //FIX: double count's value lags behind

    const $active = $(true);
    let count = 0

    function click() {
        mu(list$, (o) => {
            o.splice(1, 0, 'fou ' + count)
        })
        count++
        // set($list, (o) => [...o, "hi" + count])
        // count++;
        // set($count, (c) => c + 2);
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

    return {
        render: () => [
            // mE('div', {
            //     text: $doubleCount
            // }),
            // mE('div', {
            //     text: $count
            // }),
            mE('div', [
                mE('ul', [
                    forEachIn(list$, (item, $index) => [
                        m('li', {
                            text: item,
                            style: { cursor: 'pointer' },
                            on: { click: clickItem },
                            $index
                        }),
                        m('li', { text: item + ' copy' })
                    ])
                ]
                )
            ]),
            mE('div', [
                mE('ul', [
                    ifCase($active, {
                        then: () => [
                            m('div', { text: 'show me' }),
                            m('button', { text: 'on' })
                        ],
                        else: () => [
                            m('div', { text: 'or else' }),
                            _mXO(List)
                        ]
                    }),
                ]
                )
            ]
            ),
            mE('button', {
                text: 'click me',
                on: {
                    click
                }
            })
        ]
    }
}


function List() {
    return {
        render: () => [
            mE('h2', {
                text: "I'm a component",
                style: {
                    backgroundColor: 'gold',
                    border: '1px solid black'
                }
            }),
            mE('div', {
                style: {
                    backgroundColor: 'gold'
                },
                children: [
                    mE('blockquote', {
                        text: 'e pluribus unum'
                    }),
                    mE('button', {
                        text: 'off',
                        style: {
                            backgroundColor: 'ghostwhite'
                        }
                    })
                ]
            })
        ]
    }
}