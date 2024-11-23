import { Component } from "../component/InternalComponent"
import { appwide, contextual, provideAppwide } from "./provide"
import { DOG } from "./x_context-keys"
import { CAT } from "./x_context-keysB"


const dog = provideAppwide(DOG, undefined)
const cat = provideAppwide(CAT, 0)

function List() {
    return Component(
        <>
            <context-node with={{ [DOG]: 0 }}>
                <p>hello</p>
                <p>{appwide(DOG)}</p>
            </context-node>

            <context-node with={{ [DOG]: 'mom' }}>
                <p>hello</p>
                <p>{contextual(DOG)}</p>
            </context-node>
        </>
    )
}

const appwideDog = appwide(DOG)