import { m, mx } from "../packages/lumo/mx";
import { mxsFor } from "../packages/lumo/mxsFor";
import { $ } from "../packages/muonic/useDerivedSignal";
import { useReactivize } from "../packages/muonic/useReactivize";
import { useSignalize } from "../packages/muonic/useSignalize";

export function App() {
    const { mu, reactivize } = useReactivize()
    const { set, toSignal } = useSignalize()

    const $list = toSignal(['one', 'two', 'three'])
    const $count = toSignal(0); //TODO: I don't like how toSignal is so long, making the value so far away from the variable
    const $doubleCount = $(() => $count() * 2) //FIX: double count's value lags behind

    function click() {
        // set($list, (o) => [...o, "hi"+count])
        // count++;
        set($count, (c) => c + 1);
    }

    return {
        render: () => [
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
            mx('div', {
                text: $doubleCount
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