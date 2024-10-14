import { ifCase, For, setUpNode, setUpNodesIn, onActivated, beforeMount, beforeUnmount, onDeactivated, onMounted, onUnmounted, onUpdated } from "../../../packages/lumo/src";
import { useReactivity, ion, watch, ReactiveGet } from "../../../packages/quarky/src";

const { $, mu, ionize, set } = useReactivity()

export function App() {
    // const $list = $(['one', 'two', 'three'])
    // const list$ = ionize(['one', 'two', 'three'])
    const $count = $(0);
    // const $another = $(2);
    // const $doubleCount = $(() => {
    //     console.log("recalculating") //TODO: why is this recalculating twice? because it's not memoized?
    //     return $count() * 2
    // })

    // const $active = $(true);
    // let count = 0

    // function click() {
    //     mu(list$, (o) => {
    //         o.splice(1, 0, 'fou ' + count)
    //     })
    //     count++
    //     // set($list, (o) => [...o, "hi" + count])
    //     // count++;
    //     set($count, (c) => c + 1);
    //     // changeFrog()
    //     // set($another, (v) => v - 2)
    //     // set($active, (v) => !v)
    // }

    // function clickItem(e: Event, index: number) {
    //     console.log('index', index)
    //     mu(list$, (o) => {
    //         o.splice(index, 1)
    //     })
    // }

    // const frog$ = ionize({
    //     name: 'kermit',
    //     sound: 'ribbit',
    //     character: 'silly'
    // })

    // function changeFrog() {
    //     mu(frog$, (o) => {
    //         o.name = 'sir robin'
    //         o.character = "brave"
    //     })
    // }

    // watch(frog$, (frog, oldFrog) => {
    //     console.log("frog", frog)
    //     console.log("old frog", oldFrog)
    // })

    // const xLis = setUpNodesIn(list$, 'li', (_, $index) => ({
    //     style: { cursor: 'pointer' },
    //     on: { click: clickItem },
    //     $index
    // }))

    // const xButton = setUpNode('button', {
    //     on: {
    //         click
    //     }
    // })

    // const xToggleButton = setUpNode('button', {
    //     on: {
    //         click() {
    //             set($active, (val) => !val)
    //         }
    //     }
    // })
    const xButton = setUpNode('button', {
        on: {
            click() {
                // set($count, c=>c+1)
                set($ready, (val) => !val)
            }
        }
    })

    const oList = setUpNode(List, {})
    const xDiv = setUpNode('div', {})

    const $active = $(false);
    const $ready = $(false);
    const $done = $(false);


    return {
        render: () => [
            mE('h1', ["A person's a person no matter how small"]),
            $showIf($active,
                mE('div', [
                    mO(ListBlock),
                ], 'div')
            ),

            $show([{
                if: [$active, o =>
                    mE('div', [
                        mO(ListBlock),
                        mE('div', ["hello"])
                    ], xDiv)
                ]
            },
            {
                elseIf: [$ready, o =>
                    mE('p', ['none'])
                ]
            },
            {
                elseIf: [$done, o =>
                    mE('p', ['done'])
                ]
            },
            {
                else: [o =>
                    "nothing"
                ]
            }]),
            $mount(o => {
                if ($active()) return fresh(o =>
                    mE('div', [
                        mO(ListBlock),
                        mE('div', [
                            "hello"
                        ], 'div')
                    ], xDiv))

                else if ($ready()) return o =>
                    mE('p', ['none'])

                else if ($done()) return o =>
                    mE('p', ['done'])

                else return o =>
                    'nothing'
            }),
            mE('button', ['toggle'], xButton),
            mE('div', [$count]),


            // mE('div', [
            // ], 'div'),

            // mE('div', [
            //     mE('ul', [
            //         mE('button', ['toggle'], xToggleButton),
            //         ifCase($active, {
            //             mount: [
            //                 () => mE('div', [$count]),
            //                 // () => mE(List, [], oList)
            //             ],
            //             else: [
            //                 () => mE('div', ['show me']),
            //                 () => mE('button', ['Non functioning'])
            //             ],
            //         }),
            //         mE('div', ['something else']),
            //         // ifCase($active, {
            //         //     mount: () => [
            //         //         mE('div', ['show me']),
            //         //         mE('button', ['Non functioning'])
            //         //     ],
            //         //     else: () => [
            //         //         mE('div', ['or else']),
            //         //         mE(List)
            //         //     ]
            //         // }),
            //     ], 'ul')
            // ], 'div'),
            // mE('button', ['click me'], xButton),
        ]
    }
}


function List() {
    // console.log("SETTING UP LIST")

    // onDeactivated(() => {
    //     console.log("deactivated")
    // })

    // onActivated(() => {
    //     console.log("activated")
    // })

    // onUnmounted(() => {
    //     console.log("unmounted")
    // })

    // beforeUnmount(() => {
    //     console.log("before unmount")
    // })

    // beforeMount(() => {
    //     console.log("before mount")
    // })

    // onMounted(() => {
    //     console.log("Mounted")
    // })

    // const $count = $(0);
    // function increment() {
    //     console.log("increment")
    //     set($count, c => c + 1)
    // }

    const xH2 = setUpNode('h2', {
        style: {
            backgroundColor: 'gold',
            border: '1px solid black'
        }
    })

    // const xDiv = setUpNode('div', {
    //     style: {
    //         backgroundColor: 'gold'
    //     }
    // })

    // const xButton = setUpNode('button', {
    //     style: {
    //         backgroundColor: 'ghostwhite'
    //     },
    //     on: {
    //         click() {
    //             increment()
    //         }
    //     }
    // })

    const list$ = ionize(['oned', 'tdwo', 'thrdee', 'four'])
    // const oItems = setUpNodesIn(list$, ListItem, (item, i)=>({
    //     props: {
    //         text: i
    //     },
    //     $index: i
    // }))

    // oItems.onCreated((item, $index)=>{
    //     console.log('item', item)
    //     console.log(console.log)
    // })

    // onMounted(()=>{
    //     console.log(oItems.value)
    // })


    return {
        render: () => [
            mE('h2', ["I'm a component"], xH2),
            // mE('div', [
            // mE('blockquote', [$count]),
            // mE('button', ['increment'], xButton),
            mE('ul', [
                For(list$, (item) => [
                    mE('li', [item]),
                    // mE('li', [item + ' copy'])
                ])
            ], 'ul'),
            For(list$, () =>
                mE(ListItem)
            )
            // ])
        ]
    }
}

function ListItem() {
    // console.log("SETTING UP ITEM")
    // const $count = $(0)
    // function increment() {
    //     console.log("li increment")
    //     set($count, c => c + 1)
    // }

    // const xButton = setUpNode('button', {
    //     on: {
    //         click() {
    //             increment()
    //         }
    //     }
    // })

    return {
        render: () => mE('div', [
            mE('li', ["hi"]),
            // mE('button', ['increment li'], xButton)
        ]),
        exposes: {
            texts: "bye"
        }
    }
}