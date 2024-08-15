import { ComponentSetup } from "./InternalComponent";
import { $else, $elseIf, $if } from "../conditional/$if";
import { noop } from "@rue/utils";
import { $Signal } from "@rue/muonic";

const lazyComponents: Map<() => Promise<ComponentSetup>, ComponentSetup> = new Map()

export function loadComponent<P>(config: {
    load: () => Promise<ComponentSetup<P>>,
    Placeholder?: ComponentSetup, //QUESTION: Does this need to be a component setup or can it be a render function?
    timeout?: number,
    ErrorView?: ComponentSetup
}, idleID?: number) {
    if (idleID != null) cancelIdleCallback(idleID);
    const { load, ErrorView, Placeholder, timeout } = config;
    const $loading = $Signal(true);
    const $timedOut = $Signal(false);
    const $loaded = $Signal(false);
    let timeoutID: any;
    let Component: ComponentSetup = lazyComponents.get(load) || noop //TODO: I don't get how this works. Something to do with idleCallback
    if (Component === noop) {
        const pendingComponent = load();
        if (timeout) {
            timeoutID = setTimeout(() => {
                $timedOut.set(() => true);
                $loading.set(() => false)
            }, timeout)
        }
        pendingComponent.then((_Component) => {
            clearTimeout(timeoutID)
            lazyComponents.set(load, _Component)
            Component = _Component;
            $loading.set(() => false)
            $loaded.set(() => true)
        })
    }
    else {
        $loaded.set(() => true)
        $loading.set(() => false)
    }

    if (Placeholder && ErrorView) {
        return (props: P) => (
            <>
                {$if($loading, 'create', () =>
                    <Placeholder {...props}></Placeholder>
                )}
                {$elseIf($timedOut, () =>
                    <ErrorView {...props}></ErrorView>
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
                    <Placeholder {...props}></Placeholder>
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
                    <ErrorView {...props}></ErrorView>
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