import { NodeConfig, RenderSlotted, setUpNode } from "@rue/lumo";
import { useReactivity } from "@rue/muonic"
import { watchRenderEffect } from "../../../packages/lumo/src/watchForRender";


const { $, set } = useReactivity();

export function App() {

    const docSlabNode = useNodeRef();

    // const doc_slab = setUpNode(DocSlab, {
    //     ref: docSlabNode,
    //     props: {
    //         dog: 'arf'
    //     },
    //     style: [
    //         "background-color: green",
    //         o => {
    //             o.color = "black"
    //         }
    //     ],
    //     on: {
    //         click(e) {
    //             const node = docSlabNode()
    //         }
    //     }
    // })

    // const doc_slab = setUpNode(DocSlab, {
    //     dog: 'arf',
    //     ref: docSlabNode,
    //     style: [
    //         csss`background-color: green`,
    //         o => {
    //             o.color = "black"
    //         }
    //     ],
    //     onclick(e) {
    //         const node = docSlabNode()
    //     },
    //     onmouseup: [
    //         cancelAction,
    //         resetUI
    //     ]
    // })

    const frog_block = useNodeRef();


    const $list = $(["a", "b", "c"])
    // const item_div = setUpNodesFor($list, 'div', (item, $index) => ({
    // }))
    const $active = $(true);

    const outer_div: NodeConfig<'div'> = {
        class: [
            o => {
                if ($active()) o.add("active");
                else o.remove("active")
            }
        ],
        attributes: [
            o => {
                if ($caseA()) {
                    o.setAttribute('sfdf', "sdfsdf")
                    o.setAttribute('sfdf', "sdfsdf")
                }
                else if ($caseB()) {
                    o.setAttribute('sfdf', "sdfsdf")
                    o.setAttribute('sfdf', "sdfsdf")
                }
                else {
                    o.setAttribute('sfdf', "sdfsdf")
                }
            }
        ]
    }

    beforeMount(() => {
        const outerDiv = outerDivRef();

        watchRenderEffect(() => {
            outerDiv.setAttribute('id', $divId())
        })
    })



    return (
        <>
            <div {...outer_div}>hei</div>
            <div data-some="hi" style="background-color: red">ho</div>

            <DocSlab dog="dlkjf">{o =>
                <div>{o.doggy.toString()}</div>
            }</DocSlab>

            {/* {forEachIn($list, (item, $i) => (
                <div {...item_div(item, $i)}>{item}</div>
            ))} */}
        </>
    )
}

function FrogBlock() {

}

function useNodeRef() {

}

function csss(props: TemplateStringsArray) {

}

const style = document.createElement('style')
style.innerHTML = `
.frog {
background-color: green
}
`

const head = document.getElementsByTagName('head');
head[0].appendChild(style)

function DocSlab(
    props: {
        dog: string,
        slotted: RenderSlotted<{ doggy: number }>
    }
) {
    const { slotted } = props
    const $stuff = $("hi")
    const $other = $("ho")
    console.log(slotted)
    return (
        <div>
            <div>{slotted({ doggy: 3 })}</div>
        </div>
    )
}   