function App() {
    return (
        <div>
            {$Suspense(<ListBlock />, {
                fallback: () =>
                    <div>loading...</div>
            })}
        </div>
    )
}


async function ListBlock() {

    return $await(
        <div>
            <ItemBlock />
        </div>
    )
}

async function ItemBlock() {
    const promise = new Promise((resolve) => {
        resolve("Hello worlds")
    })
    const message = await promise
    return <div>{message}</div>
}

function $await<T>(Element: T): Promise<T> {
    return new Promise((resolve) => {
        resolve(Element)
    })
}

function $Suspense<T>(Element: T, config: {
    fallback: () => any
}) {
    return Element
}