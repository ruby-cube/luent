import { WatchTarget } from "./WatchTarget"

export interface Watchable {
    asWatchTarget?: WatchTarget
    watch: (watchTarget: WatchTarget) => void
    unwatch: () => void
}

export function watch(this: Watchable, watchTarget: WatchTarget) {
    this.asWatchTarget = watchTarget
}

export function unwatch(this: Watchable){
    this.asWatchTarget = undefined
}


// type Watchable = ReactiveSignal | ReactiveFunction | ReactiveModel | ReactiveEffect

// const watchTargetMap: WeakMap<Watchable, WatchTarget> = new WeakMap()



