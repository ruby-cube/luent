import { $Signal } from "@rue/muonic"
import { $await, $pend } from "../../../packages/lumo/src/component/$await"



const PendingListBlock = $pend({
    Pending: ListBlock,
    Placeholder() {
        console.log("[ setting up placeholder ]")
        return (<div>I'm not ready...</div>)
    },
    timeout: 9001,
    ErrorView: ({ error }: { error: any }) => <div>Oops! {error}</div>
})

const PendingTextArea = $pend({
    Pending: TextArea,
    Placeholder() {
        console.log("[ setting up placeholder ]")
        return (<div>loading...</div>)
    },
    // ErrorView: ({ error }: { error: any }) => <div>Ohh noes!! {error}</div>
})

export function MainSite() {
    const $count = $Signal(0)
    console.log("[ setting up main site ]")
    return (
        <>
            <h1>Hello World</h1>
            <PendingListBlock></PendingListBlock>
            <PendingTextArea></PendingTextArea>
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
    console.log("[ setting up list block ]")
    return (
        <div>
            <h2>list</h2>
            {/* <ItemBlockA></ItemBlockA> */}
            <ItemBlockB></ItemBlockB>
        </div>
    )
}

function TextArea() {
    console.log("[ setting up text area ]")
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
    console.log("[ setting up item block a ]")
    const $word = $Signal("not ready")

    $await(simFetch("calico"))
        .then(word => $word.set(o => word))

    return (
        <div>{$word}</div>
    )
}

function ItemBlockB() {
    console.log("[ setting up item block b ]")
    const $word = $Signal("not ready")

    $await(simLongFetch("basset"))
        .then(word => $word.set(o => word))

    return (
        <div>{$word}</div>
    )
}

function ItemBlockC() {
    console.log("[ setting up item block c ]")
    const $word = $Signal("not ready")

    $await(simFetchB("cerulean"))
        .then(word => $word.set(o => word))

    return (
        <div>{$word}</div>
    )
}

function ItemBlockD() {
    console.log("[ setting up item block d ]")
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
        }, 9000)
    })
}


