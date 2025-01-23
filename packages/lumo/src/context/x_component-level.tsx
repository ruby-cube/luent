import { component } from "../component/InternalComponent"
import { fromApp, fromCommons, provideAppwide } from "./provide"
import { _dog_ } from "./x_context-keys"
import { _cat_ } from "./x_context-keysB"


const dog = provideAppwide(_dog_, undefined)
const cat = provideAppwide(_cat_, 0)

function List() {
    return component(
        <>
            <$--commons provide={{ [_dog_]: 0 }}>
                <p>hello</p>
                <p>{fromApp(_dog_)}</p>
            </$--commons>

            <$--commons provide={{ [_dog_]: 'mom' }}>
                <p>hello</p>
                <p>{fromCommons(_dog_)}</p>
            </$--commons>
        </>
    )
}

const appwideDog = fromApp(_dog_)