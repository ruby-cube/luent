import { ComponentSetup } from "./InternalComponent";
import { Else, ElseIf, If } from "../conditional/If";
import { noop } from "@rue/utils";
import { Ion } from "../../../quarky/src";

const lazyComponents: Map<() => Promise<ComponentSetup>, ComponentSetup> = new Map()

export function lazyLoadComponent<P>(config: {
    load: () => Promise<ComponentSetup<P>>,
    onIdle?: boolean
    Placeholder?: ComponentSetup,
    timeout?: number,
    Error?: ComponentSetup<{ error: any }>,
}) { //TODO: Idle load priorities
    const { load, Error, Placeholder, timeout, onIdle } = config;
    const $loading = Ion(true);
    const $error = Ion("");
    const $loaded = Ion(false);
    let idleID: number | undefined;
    if (onIdle) {
        idleID = requestIdleCallback(() => {
            idleID = undefined;
            loadComponent()
        })
    }
    let Component: ComponentSetup
    function loadComponent() {
        let timeoutID: any;
        if (idleID !== undefined) {
            cancelIdleCallback(idleID);
            idleID = undefined;
        }
        Component = lazyComponents.get(load) || noop // if already loaded on idle, get from lazyComponents map
        if (Component === noop) {
            const pendingComponent = load();
            if (timeout) {
                timeoutID = setTimeout(() => {
                    $error.set("Timed out");
                    $loading.set(false)
                }, timeout)
            }
            pendingComponent
            .then((_Component) => {
                clearTimeout(timeoutID)
                lazyComponents.set(load, _Component)
                Component = _Component;
                $loading.set(false)
                $loaded.set(true)
            })
            .catch(err => {
                $error.set(err); //TODO: Normalize error type
                $loading.set(false)
            })
        }
        else {
            $loaded.set(true)
            $loading.set(false)
        }
    }

    if (Placeholder && Error) {
        return (props: P) => {
            loadComponent();
            return (
                <>
                    {If($loading, 'create', () =>
                        <Placeholder {...props}></Placeholder>
                    )}
                    {ElseIf($error, () =>
                        <Error {...props} error={$error()}></Error>
                    )}
                    {Else(() =>
                        <Component {...props}></Component>
                    )}
                </>
            )
        }
    }
    if (Placeholder) {
        return (props: P) => {
            loadComponent();

            return (
                <>
                    {If($loading, 'create', () =>
                        <Placeholder {...props}></Placeholder>
                    )}
                    {ElseIf($loaded, () =>
                        <Component {...props}></Component>
                    )}
                </>
            )
        }
    }
    if (Error) {
        return (props: P) => {
            loadComponent();

            return (
                <>
                    {If($error, 'create', () =>
                        <Error {...props} error={$error()}></Error>
                    )}
                    {ElseIf($loaded, () =>
                        <Component {...props}></Component>
                    )}
                </>
            )
        }
    }
    return (props: P) => {
        loadComponent();

        return (
            <>
                {If($loaded, 'create', () => {
                    return <Component {...props}></Component>
                }
                )}
            </>
        )
    }
}

