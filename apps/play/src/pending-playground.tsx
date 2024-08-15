import { $if, expose, onMounted } from "@rue/lumo"
import { $, watch } from "@rue/muonic"
import { $Signal } from "@rue/muonic/$Signal";

function App() {

}

function ListBlock() {

    const $itemBlock = $Signal<typeof ItemBlock>()

    const $data = $Signal();
    const $ready = $Signal(false)
    const $allReady = $(() => $ready() && $itemBlock().$ready())

    fetch("").then((response) => {
        response.json().then((data) => {
            $data.set(() => data)
            $ready.set(() => true)
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

    const $data = $Signal({ content: "" });
    const $ready = $Signal(false)

    fetch("").then((response) => {
        response.json().then((data) => {
            $data.set(() => data)
            $ready.set(() => true)
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

    const $data = $Signal();

    const pendingData = fetch("").then((response) => {
        return response.json()
    }).then((data) => {
        $data.set(() => data)
    })

    return $await(pendingData, () =>
        <div>
            <ItemBlock />
        </div>
    )
}

function ItemBlockB() {

    const $content = $Signal('');

    const pendingData = fetch("").then((response) => {
        response.json().then((data) => {
            $content.set(() => data.content)
        })
    })

    return $await(pendingData, () =>
        <div>{$content}</div>
    )
}


function $await(a: any, b: any) {

}

function $Ready<T>(promise: Promise<T>) {
    const $signal = $Signal(false);
    promise.then(() => {
        $signal.set(() => true)
    })
    return $signal
}

