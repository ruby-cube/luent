import { ComponentSetup } from "./InternalComponent";
import { $else, $elseIf, $if } from "../conditional/$if";
import { noop } from "@rue/utils";
import { $Signal } from "@rue/muonic";

const lazyComponents: Map<() => Promise<ComponentSetup>, ComponentSetup> = new Map()

export function lazyLoadComponent<P>(config: {
    load: () => Promise<ComponentSetup<P>>,
    Placeholder?: ComponentSetup, //QUESTION: Does this need to be a component setup or can it be a render function?
    timeout?: number,
    ErrorView?: ComponentSetup<{ error: any }>,
    onIdle?: boolean
}) { //TODO: Idle load priorities
    const { load, ErrorView, Placeholder, timeout, onIdle } = config;
    const $loading = $Signal(true);
    const $error = $Signal("");
    const $loaded = $Signal(false);
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
                    $error.set(() => "Timed out");
                    $loading.set(() => false)
                }, timeout)
            }
            pendingComponent
            .then((_Component) => {
                clearTimeout(timeoutID)
                lazyComponents.set(load, _Component)
                Component = _Component;
                $loading.set(() => false)
                $loaded.set(() => true)
            })
            .catch(err => {
                $error.set(() => err); //TODO: Normalize error type
                $loading.set(() => false)
            })
        }
        else {
            $loaded.set(() => true)
            $loading.set(() => false)
        }
    }

    if (Placeholder && ErrorView) {
        return (props: P) => {
            loadComponent();
            return (
                <>
                    {$if($loading, 'create', () =>
                        <Placeholder {...props}></Placeholder>
                    )}
                    {$elseIf($error, () =>
                        <ErrorView {...props} error={$error()}></ErrorView>
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
                    {$if($loading, 'create', () =>
                        <Placeholder {...props}></Placeholder>
                    )}
                    {$elseIf($loaded, () =>
                        <Component {...props}></Component>
                    )}
                </>
            )
        }
    }
    if (ErrorView) {
        return (props: P) => {
            loadComponent();

            return (
                <>
                    {$if($error, 'create', () =>
                        <ErrorView {...props} error={$error()}></ErrorView>
                    )}
                    {$elseIf($loaded, () =>
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
                {$if($loaded, 'create', () => {
                    return <Component {...props}></Component>
                }
                )}
            </>
        )
    }
}

