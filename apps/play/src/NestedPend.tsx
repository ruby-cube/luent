import { $Signal } from "@rue/muonic"
import { $await, $Suspense } from "../../../packages/lumo/src/component/$await"



const PendingListBlock = $Suspense({
    Pending: ListBlock,
    Placeholder() {
        return (<div>I'm not ready...</div>)
    },
    timeout: 9001,
    ErrorView: ({ error }: { error: any }) => <div>Oops! {error}</div>
})

const PendingTextArea = $Suspense({
    Pending: TextArea,
    Placeholder() {
        return (<div>loading...</div>)
    },
    // ErrorView: ({ error }: { error: any }) => <div>Ohh noes!! {error}</div>
})

export function NestedPend() {
    const $count = $Signal(0)
    return (
        <>
            <h1>Hello World</h1>
            <PendingListBlock></PendingListBlock>
            <p>{$count}</p>
            <button onclick={() => $count.set(c => c + 1)}>click</button>
        </>
    )
}

function Something() {
    return (
        <p>hey</p>
    )
}

function ListBlock() {
    return (
        <div>
            <h2>list</h2>
            <PendingTextArea></PendingTextArea>
            <ItemBlockB></ItemBlockB>
        </div>
    )
}

function TextArea() {
    const $word = $Signal("not ready")

    $await(simFetchC("pomp"))
        .then(word => $word.set(o => word))

    return (
        <div>
            <h2>text area {$word}</h2>
            <ItemBlockC />
            <ItemBlockD />
        </div>
    )
}


function ItemBlockA() {
    const $word = $Signal("not ready")

    $await(simFetch("calico"))
        .then(word => $word.set(o => word))

    return (
        <div>{$word}</div>
    )
}

function ItemBlockB() {
    const $word = $Signal("not ready")

    $await(simLongFetch("basset"))
        .then(word => $word.set(o => word))

    return (
        <div>{$word}</div>
    )
}

function ItemBlockC() {
    const $word = $Signal("not ready")

    $await(simFetchB("cerulean"))
        .then(word => $word.set(o => word))

    return (
        <div>{$word}</div>
    )
}

function ItemBlockD() {
    const $word = $Signal("not ready")

    $await(simLongFetchB("tilted"))
        .then(word => $word.set(o => word))

    return (
        <div>{$word}</div>
    )
}


function simFetch(word: string) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(word);
        }, 10)
    })
}

function simFetchC(word: string) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(word);
        }, 1000)
    })
}

function simLongFetch(word: string) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(word);
        }, 5000)
    })
}
function simFetchB(word: string) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(word);
        }, 1)
    })
}

function simLongFetchB(word: string) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(word);
        }, 4000)
    })
}


