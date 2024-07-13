import { m, mx } from "../packages/lumo/mx";
import { mxIf } from "../packages/lumo/mxIf";
import { mxsFor } from "../packages/lumo/mxsFor";
import { $ } from "../packages/muonic/useReactivity";
import { useReactivize } from "../packages/muonic/useReactivize";
import { set } from "../packages/muonic/useSignalize";

export function App() {
    // const { mu, o$ } = useReactivize()
    // const { set, $ } = useSignalize()

    const $list = $(['one', 'two', 'three'])
    const $count = $(0);
    const $another = $(2);
    const $doubleCount = $(() => {
        console.log("recalculating")
        return $count() + $another()
    }) //FIX: double count's value lags behind

    const $active = $(true);

    function click() {
        // set($list, (o) => [...o, "hi"+count])
        // count++;
        // set($count, (c) => c + 2);
        // set($another, (v) => v - 2)
        set($active, (v) => !v)
    }

    return {
        render: () => [
            mx('div', {
                text: $doubleCount
            }),
            mx('div', {
                text: $count
            }),
            mx('div', {
                nodes: [
                    mx('ul', {
                        nodes: [
                            mxsFor((item) => m('li', { text: item }), $list)
                        ]
                    })
                ]
            }),
            mx('div', {
                nodes: [
                    mx('ul', {
                        nodes: [
                            mxIf($active, {
                                then: () => [
                                    m('div', { text: 'show me' }),
                                    m('button', {text: 'on'})
                                ],
                                else: () => m('div', { text: 'or else' })
                            })
                        ]
                    })
                ]
            }),
            mx('button', {
                text: 'click me',
                on: {
                    click
                }
            })
        ]
    }
}