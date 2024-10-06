//@ts-nocheck
import { If, expose, NodeEntity, onMounted, RenderFunction } from "@rue/lumo"
import { $, watch } from "../../../packages/quarky/src"
import { ion } from "@rue/quarky/Ion";

function App() {

}

function ListBlock() {

    const $itemBlock = Ion<typeof ItemBlock>()

    const $data = ion();
    const $ready = ion(false)
    const $allReady = $(() => $ready() && $itemBlock().$ready())

    fetch("").then((response) => {
        response.json().then((data) => {
            $data.set(data)
            $ready.set(true)
        })
    })

    return [
        expose({
            $ready
        }),
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
            $data.set(data)
            $ready.set(true)
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
        $data.set(data)
    })

    return suspendRender(pendingData, () =>
        <div>
            <ItemBlock />
        </div>
    )
}

function ItemBlockB() {

    const $content = ion('');

    suspendRender(fetch(""))
        .then(async (response) => {
            const data = await response.json()
            $content.set(data.content)
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



