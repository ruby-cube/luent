import { $Signal, __addDevName } from "@rue/muonic";
import { $else, $elseIf, $if } from "../conditional/$if";
import { NodeEntity, RenderFunction } from "../node/makeNode";
import { ComponentSetup } from "./InternalComponent";
import { AnyObject } from "@rue/types";
import { mO } from "./makeComponent";

// let pendingPromises: Promise<any>[] | undefined;

const pendingPromisesStack: Promise<any>[][] = []

export function $await(promiseValue: Promise<any> | Promise<any>[]) {
    if (pendingPromisesStack.length === 0) throw new Error('$await must eventually be handled by a $Suspense call in a parent component. If you want to handle the promise with a placeholder and error view in this component, use $Suspense instead');
    const promise = promiseValue instanceof Array ?
        Promise.all(promiseValue)
        : promiseValue
    const pendingPromises = pendingPromisesStack.at(-1)!;
    pendingPromises.push(promise)
    return promise;
}

type PendConfig = {
    Pending: ComponentSetup,
    Placeholder?: ComponentSetup,
    timeout?: number,
    ErrorView?: ComponentSetup<{ error: any }>
}

export function $Suspense(promiseValueOrConfig: PendConfig): ComponentSetup
export function $Suspense(promiseValueOrConfig: Promise<any> | Promise<any>[], config: PendConfig): ComponentSetup
export function $Suspense(promiseValueOrConfig: Promise<any> | Promise<any>[] | PendConfig, config?: PendConfig) {
    const _config = config || promiseValueOrConfig as PendConfig
    const promise = config ? promiseValueOrConfig as Promise<any> : undefined;
    const { Pending, ErrorView, Placeholder, timeout } = _config;
    const $pending = $Signal(true);
    const $error = $Signal("");
    const $ready = $Signal(false);
    if (__DEV__) __addDevName($pending, "$pending");

    function collectPromises(props: AnyObject) {
        let timeoutID: any;
        if (timeout) {
            timeoutID = setTimeout(() => {
                $error.set(() => "Timed out");
                $pending.set(() => false)
            }, timeout)
        }

        const pendingPromises = promise ? [promise] : []
        pendingPromisesStack.push(pendingPromises);

        const internalComponent = mO(Pending, props.Slotted, props); // any nested $await calls will collect promises into the pendingPromises array
        const allPromises = Promise.all(pendingPromises);
        pendingPromisesStack.pop();
        allPromises
            .then(() => {
                clearTimeout(timeoutID)
                $pending.set(() => false)
                $ready.set(() => true)
            })
            .catch(err => {
                $error.set(() => err); //TODO: Normalize error type
                $pending.set(() => false)
            })
        return internalComponent;
    }

    if (Placeholder && ErrorView) {
        return function PendingComponent(props: AnyObject) {
            const internalComponent = collectPromises(props)
            //QUESTION: Do I have to set up an entire component? or can I just pass in the props? if a ref is used, you need to set up component
            return [
                $if($pending, 'create', () => mO(Placeholder, props.Slotted, props)),
                $elseIf($error, () => mO(ErrorView, undefined, { ...props, error: $error() })),
                $else(() => internalComponent)
            ]
        }
    }
    if (Placeholder) {
        return function PendingComponent(props: AnyObject) {
            const internalComponent = collectPromises(props)
            return [
                $if($pending, 'create', () => mO(Placeholder, props.Slotted, props)),
                $else(() => internalComponent)
            ]
        }
    }
    if (ErrorView) {
        return (props: AnyObject) => {
            const internalComponent = collectPromises(props)
            return [
                $elseIf($error, () => mO(ErrorView, undefined, { ...props, error: $error() })),
                $elseIf($ready, () => internalComponent)
            ]

        }
    }
    return (props: AnyObject) => {
        const internalComponent = collectPromises(props)
        return [
            $if($ready, 'create', () => internalComponent)
        ]

    }
}