import { Ion } from "../../../packages/quarky/src"
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

export function MainSite() {
    const $count = Ion(0)
    return (
        <>
            <h1>Hello World</h1>
            <PendingListBlock></PendingListBlock>
            <PendingTextArea></PendingTextArea>
            <p>{$count}</p>
            <button onClick={() => $count.update(count => count + 1)}>click</button>
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
            {/* <ItemBlockA></ItemBlockA> */}
            <ItemBlockB></ItemBlockB>
        </div>
    )
}

function TextArea() {
    const $word = Ion("not ready")

    $await(simFetchC("pomp"))
        .then(word => $word.set(word))

    return (
        <div>
            <h2>text area {$word}</h2>
            <ItemBlockC />
            <ItemBlockD />     {/* ${mO(ItemBlockD)}  ==> Promise<SSRComponent>*/}
        </div>
    )
}


function ItemBlockA() {
    const $word = Ion("not ready")

    $await(simFetch("calico"))
        .then(word => $word.set(word))

    return (
        <div>{$word}</div>
    )
}

function ItemBlockB() {
    const $word = Ion("not ready")

    $await(simLongFetch("basset"))
        .then(word => $word.set(word))

    return (
        <div>{$word}</div>
    )
}

function ItemBlockC() {
    const $word = Ion("not ready")

    $await(simFetchB("cerulean"))
        .then(word => $word.set(word))

    return (
        <div>{$word}</div>
    )
}

function ItemBlockD() {
    const $word = Ion("not ready")

    $await(simLongFetchB("tilted"))              // [promise]
        .then(word => $word.set(word))

    return (
        <div>{$word}</div> // {strings: ['<div>', '<div>'], values: [$word]}   (makeComponent should detect $await call and wrap component in promise) 
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


