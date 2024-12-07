//@ts-nocheck
import { If, expose, NodeEntity, onMounted, RenderFunction } from "@rue/lumo"
import { $, watch } from "../../../packages/quarky/src"
import { ion } from "@rue/quarky/ion";

function App() {

}

function ListBlock() {

    const $itemBlock = AtomicIon<typeof ItemBlock>()

    const $data = ion();
    const $ready = ion(false)
    const $allReady = $(() => $ready() && $itemBlock().$ready())

    fetch("").then((response) => {
        response.json().then((data) => {
            $data.as(data)
            $ready.as(true)
        })
    })

    return [
        {
            $ready
        },
        <>
            {If($allReady, 'show', () =>
                <div>
                    <ItemBlock ref={$itemBlock} />
                </div>
            )}
        </>
    ]
}

function ItemBlock() {

    const $data = ion({ content: "" });
    const $ready = ion(false)

    fetch("").then((response) => {
        response.json().then((data) => {
            $data.as(data)
            $ready.as(true)
        })
    })

    return [
        expose({
            $ready
        }),

        <>
            {If($ready, 'show', () =>
                <div>{$(() => $data().content)}</div>
            )}
        </>
    ]
}

function ListBlockB() {

    const $data = ion();

    const pendingData = fetch("").then((response) => {
        return response.json()
    }).then((data) => {
        $data.as(data)
    })

    return pend(pendingData, () =>
        <div>
            <ItemBlock />
        </div>
    )
}

function ItemBlockB() {

    const $content = ion('');

    pend(fetch(""))
        .then(async (response) => {
            const data = await response.json()
            $content.as(data.content)
        })

    return (
        <div>{$content}</div>
    )
}

function Something() {



    return (
        <div>
            <h1>Hello</h1>
            {$pending(() =>
                <ItemBlock />
            )}
        </div>
    )
}

function $pending(render) {
    return Suspense({
        pending: render,
        placeholder: () => <div>loading...</div>,
        timeout: 100,
        error: () => <div>Sorry :(</div>
    })
}



