import { template, pend, Suspense } from "@rue/lumo"
import { ion } from "@rue/quarky"




const $ListBlock = Suspense({
    Pending: ListBlock,
    Placeholder() {
        return template(
            <div>I'm not ready...</div>
        )
    },
    timeout: 9001,
    Error({ error }: { error: any }) {
        return template(
            <div>Oops! {error}</div>
        )
    }
})

const $TextArea = Suspense({
    Pending: TextArea,
    Placeholder() {
        return template(<div>loading...</div>)
    },
    // Error: ({ error }: { error: any }) => <div>Ohh noes!! {error}</div>
})

export function MainSite() {
    const $count = Ion(0)
    return template(
        <>
            <h1>Hello World</h1>
            <$ListBlock></$ListBlock>
            <$TextArea></$TextArea>
            <p>{$count}</p>
            <button on:click={() => $count.value = $count() + 1}>click</button>
        </>
    )
}

function Something() {
    return template(
        <p>hey</p>
    )
}

function ListBlock() {
    return template(
        <div>
            <h2>list</h2>
            {/* <ItemBlockA></ItemBlockA> */}
            <ItemBlockB></ItemBlockB>
        </div>
    )
}

function TextArea() {
    const $word = Ion("not ready")


    pend(simFetchC("pomp"))
        .then(word => $word.value = word)

    return template({
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

    pend(simFetch("calico"))
        .then(word => $word.value = word)

    return template(
        <div>{$word}</div>
    )
}

function run(fn: Function) {
    return new Promise(() => { })
}


function ItemBlockB() {
    const $word = Ion("not ready")

    pend(fetch("basset"))
        .then(word =>
            $word.value = word
        )
        .catch(err =>
            console.log(err)
        )

    pend([
        fetch('a'),
        fetch('b')
    ]).then(([a, b]) => $word.value = a))

    run(async () => {
        try {
            const word = await pend(
                fetch('basset')
            )
            $word.value = word
        }
        catch (error) {
            console.log(error)
        }
    })

    return template(
        <div>{$word}</div>
    )
}

function ItemBlockC() {
    const $word = Ion("not ready")

    pend(simFetchB("cerulean"))
        .then(word => $word.value = word)

    return template(
        <div>{$word}</div>
    )
}

function ItemBlockD() {
    const $word = Ion("not ready")

    pend(simLongFetchB("tilted"))              // [promise]
        .then(word => $word.value = word)

    return template(
        <div>{$word}</div> // {strings: ['<div>', '<div>'], values: [$word]}   (makeComponent should detect pend call and wrap component in promise) 
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




