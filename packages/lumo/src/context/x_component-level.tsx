import { component } from "../component/InternalComponent"
import { appwide, contextual, provideAppwide } from "./provide"
import { _dog_ } from "./x_context-keys"
import { _cat_ } from "./x_context-keysB"


const dog = provideAppwide(_dog_, undefined)
const cat = provideAppwide(_cat_, 0)

function List() {
    return component(
        <>
            <$--context with={{ [_dog_]: 0 }}>
                <p>hello</p>
                <p>{appwide(_dog_)}</p>
            </$--context>

            <$--context with={{ [_dog_]: 'mom' }}>
                <p>hello</p>
                <p>{contextual(_dog_)}</p>
            </$--context>
        </>
    )
}

const appwideDog = appwide(_dog_)