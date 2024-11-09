import { __addDevName } from "../../quarky/src/index.js";
import { AnyObject } from "@rue/types";
import { html } from "./Literate.js";
import { makeComponent } from "./makeComponent.js";
import { SSRComponent, SSRComponentSetup } from "./SSRComponent.js";
import { TypedKey, constAppState } from "@rue/lumo";
import { getResponseTimer, RESPONSE_TIMER, ResponseTimer } from "./ResponseTimer.js";
import { storeResolvedComponent } from "./PendingComponentMap.js";


const PENDING_PROMISES_STACK = Symbol('pendingPromisesStack') as TypedKey<Promise<any>[][]>

const getPendingPromisesStack = constAppState(PENDING_PROMISES_STACK, () => [])

export function Suspense(promiseValueOrConfig: PendConfig): SSRComponentSetup
export function Suspense(promiseValueOrConfig: Promise<any> | Promise<any>[], config: PendConfig): SSRComponentSetup
export function Suspense(promiseValueOrConfig: Promise<any> | Promise<any>[] | PendConfig, config?: PendConfig) {
    const timer = getResponseTimer();
    const _config = config || promiseValueOrConfig as PendConfig
    const promise = config ? promiseValueOrConfig as Promise<any> : undefined;
    const { Pending, Placeholder } = _config;
    const _Placeholder = Placeholder || (() => html``)
    const pendingPromisesStack = getPendingPromisesStack();

    function collectPromises(props: AnyObject) {
        //TODO: how are refs handled in this nested component situation?
        const pendingPromises = promise ? [promise] : []
        pendingPromisesStack.push(pendingPromises);

        const internalComponent = makeComponent(Pending, props.Slot, props, undefined); // any nested pend calls will collect promises into the pendingPromises array
        if (pendingPromises.length === 0) return internalComponent.output;
        const allPromises = Promise.allSettled(pendingPromises);
        // if (__SSR__) trackPromise(allPromises)
        pendingPromisesStack.pop();

        const pendingComponent: Promise<SSRComponent> = new Promise((resolve) => {
            allPromises
                .then(() => {
                    storeResolvedComponent(pendingComponent, <SSRComponent><unknown>internalComponent)
                    resolve(internalComponent)
                })
                .catch(resolveWithPlaceholder)
            timer.pendingTimeout
                .then(resolveWithPlaceholder)

            let resolved = false;
            function resolveWithPlaceholder() {
                if (resolved) return;
                resolved = true;
                const placeholderComponent = makeComponent(_Placeholder, props.Slot, props, undefined)
                storeResolvedComponent(pendingComponent, <SSRComponent><unknown>placeholderComponent)
                resolve(placeholderComponent)
            }
        })
        //@ts-expect-error
        pendingComponent.pendingLiterateSSRComponent = true;
        return pendingComponent;
    }


    return function PendingComponent(props: AnyObject) {
        return collectPromises(props)
    }
}

export function pend(promiseValue: Promise<any> | Promise<any>[]) {
    const pendingPromisesStack = getPendingPromisesStack();
    if (pendingPromisesStack.length === 0)
        throw new Error('pend must eventually be handled by a Suspense call in a parent component. If you want to handle the promise with a placeholder and error view in this component, use Suspense instead');
    const promise = promiseValue instanceof Array ?
        Promise.allSettled(promiseValue) // on the server we don't need everything to be resolved before sending TODO: I need a way for developer to forward unresolved fetches for client to deal with if they want to try again
        : promiseValue
    const pendingPromises = pendingPromisesStack.at(-1)!;
    pendingPromises.push(promise)
    return promise;
}

// export function pend(promiseValue: Promise<any> | Promise<any>[]) {
//     return getAppState($AWAIT, () => initializeSuspense().pend)(promiseValue)
// }

// export function Suspense(promiseValueOrConfig: PendConfig): SSRComponentSetup
// export function Suspense(promiseValueOrConfig: Promise<any> | Promise<any>[], config: PendConfig): SSRComponentSetup
// export function Suspense(promiseValueOrConfig: Promise<any> | Promise<any>[] | PendConfig, config?: PendConfig) {
//     const _Suspense = getAppState($SUSPENSE, () => initializeSuspense().Suspense)
//     return _Suspense(
//         // @ts-expect-error: The call would have succeeded against this implementation, but implementation signatures of overloads are not externally visible.
//         promiseValueOrConfig,
//         config
//     )
// }


type PendConfig = {
    Pending: SSRComponentSetup,
    Placeholder?: SSRComponentSetup,
    timeout?: number,
    Error?: SSRComponentSetup<{ error: any }>
}

// const IS_RESOLVED = Symbol() as TypedKey<(promise: Promise<SSRComponent>) => boolean>
// const STORE_RESOLVED_VALUE = Symbol() as TypedKey<(promise: Promise<SSRComponent>, value: SSRComponent) => void>
// const GET_RESOLVED_VALUE = Symbol() as TypedKey<(promise: Promise<SSRComponent>) => SSRComponent>




// // const PROMISE_MAP_NOT_INITIALIZED = "Promise map has not been initialized. Make sure initializePromiseMap has been called in makeRootComponent"

// export function isResolved(promise: Promise<SSRComponent>) {
//     return getAppState(IS_RESOLVED, () => initializePromiseMap().isResolved)(promise)
// }

// export function storeResolvedComponent(promise: Promise<SSRComponent>, value: SSRComponent) {
//     getAppState(STORE_RESOLVED_VALUE, () => initializePromiseMap().storeResolvedComponent)(promise, value)
// }

// export function getResolvedComponent(promise: Promise<SSRComponent>) {
//     return getAppState(GET_RESOLVED_VALUE, () => initializePromiseMap().getResolvedComponent)(promise)
// }


