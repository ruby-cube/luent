import { ion, __addDevName } from "../../../quarky/src";
import { Else, ElseIf, If } from "../conditional/If";
import { NodeEntity, RenderFunction } from "../node/makeNode";
import { Component, ComponentSetup } from "./InternalComponent";
import { AnyObject } from "@rue/types";
import { mO } from "./makeComponent";

// let pendingPromises: Promise<any>[] | undefined;

//TODO: Uncaught suspended render(s). Catch suspended renders by creating suspenseful components with Suspend.

const pendingPromisesStack: Promise<any>[][] = []

export function suspendRender(promiseValue: Promise<any> | Promise<any>[]) {
    if (pendingPromisesStack.length === 0) throw new Error('suspendRender must eventually be handled by a Suspense call in a parent component. If you want to handle the promise with a placeholder and error view in this component, use Suspense instead');
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
    Error?: ComponentSetup<{ error: any }>
}

export function Suspense(promiseValueOrConfig: PendConfig): ComponentSetup //TODO: Setup props must combine pending and placeholder setup
export function Suspense(promiseValueOrConfig: Promise<any> | Promise<any>[], config: PendConfig): ComponentSetup
export function Suspense(promiseValueOrConfig: Promise<any> | Promise<any>[] | PendConfig, config?: PendConfig): ComponentSetup {
    const _config = config || promiseValueOrConfig as PendConfig
    const promise = config ? promiseValueOrConfig as Promise<any> : undefined;
    const { Pending, Error, Placeholder, timeout } = _config;
    const $pending = ion(true);
    const $error = ion("");
    const $ready = ion(false);
    if (__DEV__) __addDevName($pending, "$pending");

    function collectPromises(props: AnyObject) {
        let timeoutID: any;
        if (timeout) {
            timeoutID = setTimeout(() => {
                $error.set("Timed out");
                $pending.set(false)
            }, timeout)
        }

        const pendingPromises = promise ? [promise] : []
        pendingPromisesStack.push(pendingPromises);

        const internalComponent = mO(Pending, props.Slot, props); // any nested suspendRender calls will collect promises into the pendingPromises array
        const allPromises = Promise.all(pendingPromises);
        pendingPromisesStack.pop();
        allPromises
            .then(() => {
                clearTimeout(timeoutID)
                $pending.set(false)
                $ready.set(true)
            })
            .catch(err => {
                $error.set(err); //TODO: Normalize error type
                $pending.set(false)
            })
        return internalComponent;
    }

    if (Placeholder && Error) {
        return function PendingComponent(props: AnyObject) {
            const internalComponent = collectPromises(props)
            //QUESTION: Do I have to set up an entire component? or can I just pass in the props? if a ref is used, you need to set up component
            return Component(() => [
                If($pending, () => mO(Placeholder, props.Slot, props)),
                ElseIf($error, () => mO(Error, undefined, { ...props, error: $error() })),
                Else(() => internalComponent)
            ])
        }
    }
    if (Placeholder) {
        return function PendingComponent(props: AnyObject) {
            const internalComponent = collectPromises(props)
            return Component(() => [
                If($pending, () => mO(Placeholder, props.Slot, props)),
                Else(() => internalComponent)
            ])
        }
    }
    if (Error) {
        return (props: AnyObject) => {
            const internalComponent = collectPromises(props)
            return Component(() => [
                ElseIf($error, () => mO(Error, undefined, { ...props, error: $error() })),
                ElseIf($ready, () => internalComponent)
            ])

        }
    }
    return (props: AnyObject) => {
        const internalComponent = collectPromises(props)
        return Component(() => [
            If($ready, () => internalComponent)
        ])
    }
}