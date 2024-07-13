import { m, mx } from "../packages/lumo/mx";
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
    const $doubleCount = $(() => $count() * $another()) //FIX: double count's value lags behind

    function click() {
        // set($list, (o) => [...o, "hi"+count])
        // count++;
        set($count, (c) => c + 1);
    }

    return {
        render: () => [
            mx('div', {
                text: $doubleCount
            }),
            mx('div', {
                text: $count
                // nodes: [
                //     mx('ul', {
                //         nodes: [
                //             mxsFor((item) => [m('li', { text: item })], $list)
                //         ]
                //     })
                // ]
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