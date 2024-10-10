import { Component, suspendRender, Suspense } from "@rue/lumo"
import { Ion } from "@rue/quarky"



const $ListBlock = Suspense({
    Pending: ListBlock,
    Placeholder() {
        return Component(
            <div>I'm not ready...</div>
        )
    },
    timeout: 9001,
    Error({ error }: { error: any }) {
        return Component(
            <div>Oops! {error}</div>
        )
    }
})

const $TextArea = Suspense({
    Pending: TextArea,
    Placeholder() {
        return Component(<div>loading...</div>)
    },
    // Error: ({ error }: { error: any }) => <div>Ohh noes!! {error}</div>
})

export function MainSite() {
    const $count = Ion(0)
    return Component(
        <>
            <h1>Hello World</h1>
            <$ListBlock></$ListBlock>
            <$TextArea></$TextArea>
            <p>{$count}</p>
            <button onclick={() => $count.update(count => count + 1)}>click</button>
        </>
    )
}

function Something() {
    return Component(
        <p>hey</p>
    )
}

function ListBlock() {
    return Component(
        <div>
            <h2>list</h2>
            {/* <ItemBlockA></ItemBlockA> */}
            <ItemBlockB></ItemBlockB>
        </div>
    )
}

function TextArea() {
    const $word = Ion("not ready")


    suspendRender(simFetchC("pomp"))
        .then(word => $word.set(word))

    return Component({
        $word
    },
        <div>
            <h2>text area {$word}</h2>
            <ItemBlockC />
            <ItemBlockD />     {/* ${mO(ItemBlockD)}  ==> Promise<SSRComponent>*/}
        </div>
    )
}


function ItemBlockA() {
    const $word = Ion("not ready")

    suspendRender(simFetch("calico"))
        .then(word => $word.set(word))

    return Component(
        <div>{$word}</div>
    )
}

function run(fn: Function) {
    return new Promise(() => { })
}


function ItemBlockB() {
    const $word = Ion("not ready")

    suspendRender(fetch("basset"))
        .then(word =>
            $word.set(word)
        )
        .catch(err =>
            console.log(err)
        )

    suspendRender([
        fetch('a'),
        fetch('b')
    ]).then(([a, b]) => $word.set(a))

    run(async () => {
        try {
            const word = await suspendRender(
                fetch('basset')
            )
            $word.set(word)
        }
        catch (error) {
            console.log(error)
        }
    })

    return Component(
        <div>{$word}</div>
    )
}

function ItemBlockC() {
    const $word = Ion("not ready")

    suspendRender(simFetchB("cerulean"))
        .then(word => $word.set(word))

    return Component(
        <div>{$word}</div>
    )
}

function ItemBlockD() {
    const $word = Ion("not ready")

    suspendRender(simLongFetchB("tilted"))              // [promise]
        .then(word => $word.set(word))

    return Component(
        <div>{$word}</div> // {strings: ['<div>', '<div>'], values: [$word]}   (makeComponent should detect suspendRender call and wrap component in promise) 
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

function simLongFetch(word: string): Promise<string> {
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




