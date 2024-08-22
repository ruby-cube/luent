
export type AnyObject = { [key: string | symbol]: any }
export type Observable<T> = { [ObservableMarker]: true } & T
const ObservableMarker = Symbol("observable")

export interface ObservableCapsule {
    $: AnyObject
    initObservable: () => void;
}

export function initObservable(this: ObservableCapsule) {
    if (this.$[ObservableMarker]) return;
    this.$ = o$(this.$);
}

export function o$<T extends AnyObject>(target: T): Observable<T> {
    const observable = reactive(target);
    observable[ObservableMarker] = true;
    return observable as unknown as Observable<T>;
}