import { ComponentSetup } from "./InternalComponent";
import { $else, $elseif, $if } from "../conditional/If";
import { noop } from "@rue/utils";
import { ion } from "../../../quarky/src";
import { AnyObject } from "@rue/types";

const lazyComponents: Map<() => Promise<ComponentSetup>, ComponentSetup> = new Map()

export function lazyLoadComponent<P extends AnyObject>(config: {
    load: () => Promise<ComponentSetup<P>>,
    onIdle?: boolean
    Placeholder?: ComponentSetup,
    timeout?: number,
    Error?: ComponentSetup<{ error: any }>,
}) { //TODO: Idle load priorities
    const { load, Error, Placeholder, timeout, onIdle } = config;
    const $loading = ion(true);
    const $error = ion("");
    const $loaded = ion(false);
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
        Component = lazyComponents.get(load) || noop as ComponentSetup // if already loaded on idle, get from lazyComponents map
        if (Component === noop) {
            const pendingComponent = load();
            if (timeout) {
                timeoutID = setTimeout(() => {
                    $error.value = "Timed out";
                    $loading.value = false
                }, timeout)
            }
            pendingComponent
                .then((_Component) => {
                    clearTimeout(timeoutID)
                    lazyComponents.set(load, _Component)
                    Component = _Component;
                    $loading.value = false
                    $loaded.value = true
                })
                .catch(err => {
                    $error.value = err; //TODO: Normalize error type
                    $loading.value = false
                })
        }
        else {
            $loaded.value = true
            $loading.value = false
        }
    }

    if (Placeholder && Error) {
        return (props: P) => {
            loadComponent();
            return (
                <>
                    {$if($loading, () =>
                        <Placeholder {...props}></Placeholder>
                    )}
                    {$elseif($error, () =>
                        <Error {...props} error={$error()}></Error>
                    )}
                    {$else(() =>
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
                    {$if($loading, () =>
                        <Placeholder {...props}></Placeholder>
                    )}
                    {$elseif($loaded, () =>
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
                    {$if($error, () =>
                        <Error {...props} error={$error()}></Error>
                    )}
                    {$elseif($loaded, () =>
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
                {$if($loaded, () => {
                    return <Component {...props}></Component>
                }
                )}
            </>
        )
    }
}

