import { component } from "../component/InternalComponent"
import { fromApp, fromContext, provideAppwide } from "./provide"
import { _dog_ } from "./x_context-keys"
import { _cat_ } from "./x_context-keysB"


const dog = provideAppwide(_dog_, undefined)
const cat = provideAppwide(_cat_, 0)

function List() {
    return component(
        <>
            <$--context with={{ [_dog_]: 0 }}>
                <p>hello</p>
                <p>{fromApp(_dog_)}</p>
            </$--context>

            <$--context with={{ [_dog_]: 'mom' }}>
                <p>hello</p>
                <p>{fromContext(_dog_)}</p>
            </$--context>
        </>
    )
}

const appwideDog = fromApp(_dog_)