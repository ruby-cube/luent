import { ComponentSetup } from "./Component";
import { Else, ElseIf, If } from "../conditional/If";
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
                    $error.state = "Timed out";
                    $loading.state = false
                }, timeout)
            }
            pendingComponent
                .then((_Component) => {
                    clearTimeout(timeoutID)
                    lazyComponents.set(load, _Component)
                    Component = _Component;
                    $loading.state = false
                    $loaded.state = true
                })
                .catch(err => {
                    $error.state = err; //TODO: Normalize error type
                    $loading.state = false
                })
        }
        else {
            $loaded.state = true
            $loading.state = false
        }
    }

    if (Placeholder && Error) {
        return (props: P) => {
            loadComponent();
            return (
                <>
                    {If($loading, () =>
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
                    {If($loading, () =>
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
                    {If($error, () =>
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
                {If($loaded, () => {
                    return <Component {...props}></Component>
                }
                )}
            </>
        )
    }
}

