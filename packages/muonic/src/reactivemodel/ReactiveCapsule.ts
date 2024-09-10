import { Reactive$ } from "./Reactive$"
import { ReactiveModel } from "./ReactiveModel"

class Frog {
    $: ReactiveModel<{
        name: string
    }>

    constructor(name: string){
        this.$ = Reactive$({
            name
        })
    }
}