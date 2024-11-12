import { Component } from "../component/InternalComponent"
import { Context } from "./Context"
import { appwide, contextual, provideAppwide } from "./provide"
import { DOG } from "./x_context-keys"
import { CAT } from "./x_context-keysB"


const dog = provideAppwide(DOG, undefined)
const cat = provideAppwide(CAT, 0)

function List() {
    return Component(
        <>
            <Context with={{ [DOG]: 'bingo' }}>
                <p>hello</p>
                <p>{appwide(DOG)}</p>
            </Context>

            <Context with={{ [DOG]: 'mom' }}>
                <p>hello</p>
                <p>{contextual(DOG)}</p>
            </Context>
        </>
    )
}

const appwideDog = appwide(DOG)