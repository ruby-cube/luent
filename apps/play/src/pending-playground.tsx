//@ts-nocheck
import { $if, expose, NodeEntity, onMounted, RenderFunction } from "@rue/lumo"
import { $, watch } from "@rue/muonic"
import { $State } from "@rue/muonic/$State";

function App() {

}

function ListBlock() {

    const $itemBlock = $State<typeof ItemBlock>()

    const $data = $State();
    const $ready = $State(false)
    const $allReady = $(() => $ready() && $itemBlock().$ready())

    fetch("").then((response) => {
        response.json().then((data) => {
            $data.setTo(data)
            $ready.setTo(true)
        })
    })

    return [
        expose({
            $ready
        }),
        <>
            {$if($allReady, 'show', () =>
                <div>
                    <ItemBlock ref={$itemBlock} />
                </div>
            )}
        </>
    ]
}

function ItemBlock() {

    const $data = $State({ content: "" });
    const $ready = $State(false)

    fetch("").then((response) => {
        response.json().then((data) => {
            $data.setTo(data)
            $ready.setTo(true)
        })
    })

    return [
        expose({
            $ready
        }),

        <>
            {$if($ready, 'show', () =>
                <div>{$(() => $data().content)}</div>
            )}
        </>
    ]
}

function ListBlockB() {

    const $data = $State();

    const pendingData = fetch("").then((response) => {
        return response.json()
    }).then((data) => {
        $data.setTo(data)
    })

    return $await(pendingData, () =>
        <div>
            <ItemBlock />
        </div>
    )
}

function ItemBlockB() {

    const $content = $State('');

    $await(fetch(""))
        .then(async (response) => {
            const data = await response.json()
            $content.setTo(data.content)
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
    return $Suspense({
        pending: render,
        placeholder: () => <div>loading...</div>,
        timeout: 100,
        error: () => <div>Sorry :(</div>
    })
}



