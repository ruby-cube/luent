import { Reactive$, ReactiveModel } from "./Reactive$"

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