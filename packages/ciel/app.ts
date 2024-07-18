import { ListItem } from "./getStateCapsule";




provideTo(ListItem, {
    position: 0
})


function provideTo<T>(component: T, needs: T extends (context?: infer C) => any ? { [K in keyof C]?: C[K] } : never) {

}