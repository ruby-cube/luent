import { useSignalize } from "@rue/muonic";
import { ComponentSetup } from "./component";
import { $else, $elseIf, $if } from "./$if";
import { noop } from "@rue/utils";

const { $, set } = useSignalize();

const lazyComponents: Map<() => Promise<ComponentSetup>, ComponentSetup> = new Map()

export function loadComponent<P>(config: {
    load: () => Promise<ComponentSetup<P>>,
    Placeholder?: ComponentSetup,
    timeout?: number,
    ErrorView?: ComponentSetup
}, idleID?: number) {
    if (idleID != null) cancelIdleCallback(idleID);
    const { load, ErrorView, Placeholder, timeout } = config;
    const $loading = $(true);
    const $timedOut = $(false);
    const $loaded = $(false);
    let timeoutID: any;
    let Component: ComponentSetup = lazyComponents.get(load) || noop
    if (Component == noop) {
        const pendingComponent = load();
        if (timeout) {
            timeoutID = setTimeout(() => {
                set($timedOut, () => true);
                set($loading, () => false)
            }, timeout)
        }
        pendingComponent.then((_Component) => {
            clearTimeout(timeoutID)
            console.log("this should be a function", _Component)
            lazyComponents.set(load, _Component)
            Component = _Component;
            set($loading, () => false)
            set($loaded, () => true)
        })
    }
    else {
        set($loaded, () => true)
        set($loading, () => false)
    }

    if (Placeholder && ErrorView) {
        return (props: P) => (
            <>
                {$if($loading, 'create', () =>
                    <Placeholder></Placeholder>
                )}
                {$elseIf($timedOut, () =>
                    <ErrorView></ErrorView>
                )}
                {$else(() =>
                    <Component {...props}></Component>
                )}
            </>
        )
    }
    if (Placeholder) {
        return (props: P) => (
            <>
                {$if($loading, 'create', () =>
                    <Placeholder></Placeholder>
                )}
                {$elseIf($loaded, () =>
                    <Component {...props}></Component>
                )}
            </>
        )
    }
    if (ErrorView) {
        return (props: P) => (
            <>
                {$if($timedOut, 'create', () =>
                    <ErrorView></ErrorView>
                )}
                {$elseIf($loaded, () =>
                    <Component {...props}></Component>
                )}
            </>
        )
    }
    return (props: P) => (
        <>
            {$if($loaded, 'create', () => {
                console.log("loaded!")
                return <Component {...props}></Component>
            }
            )}
        </>
    )
}


export function idleLoadComponent<P>(config: {
    load: () => Promise<ComponentSetup<P>>,
    Placeholder?: ComponentSetup,
    timeout?: number,
    ErrorView?: ComponentSetup
}) {
    const idleId = requestIdleCallback(() => loadComponent(config))
    return () => loadComponent(config, idleId);
}