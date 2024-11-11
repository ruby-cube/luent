import { Component } from "../component/InternalComponent"
import { Context } from "./Context"
import { provideAppwide } from "./provide"
import { DOG } from "./x_context-keys"
import { CAT } from "./x_context-keysB"


const dog = provideAppwide(DOG, { bark: 'woof', setDog() { return 9 } })
const cat = provideAppwide(CAT, 0)

function List() {
    return Component(
        <>
            <Context with={{ [DOG]: { bark: 'woof', setDog() { return 9 } } }}>
                <p>hello</p>
                {/* <p>{appwide(DOG)}</p> */}
            </Context>

            <Context with={{ [DOG]: { bark: 'woof', setDog() { return 9 } }, [CAT]: 9 }}>
                <p>hello</p>
                {/* <p>{fromContext(DOG)}</p> */}
            </Context>
        </>
    )
}