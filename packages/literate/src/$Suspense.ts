import { __addDevName } from "@rue/muonic";
import { AnyObject } from "@rue/types";
import { html } from "./Literate.js";
import { makeComponent } from "./makeComponent.js";
import { SSRComponent, SSRComponentSetup } from "./SSRComponent.js";
import { fromAppRoot, getAppWideResource, provide, SymbolKey } from "@rue/lumo";
import { ResponseTimer } from "./ResponseTimer.js";

const $AWAIT = Symbol() as SymbolKey<(promiseValue: Promise<any> | Promise<any>[]) => Promise<any>>
const $SUSPENSE = Symbol() as SymbolKey<(promiseValueOrConfig: Promise<any> | Promise<any>[] | PendConfig, config?: PendConfig) => SSRComponentSetup>

export function initializeSuspense(timer: ResponseTimer) {
    const pendingPromisesStack: Promise<any>[][] = []

    function $await(promiseValue: Promise<any> | Promise<any>[]) {
        if (pendingPromisesStack.length === 0) throw new Error('$await must eventually be handled by a $Suspense call in a parent component. If you want to handle the promise with a placeholder and error view in this component, use $Suspense instead');
        const promise = promiseValue instanceof Array ?
            Promise.allSettled(promiseValue) // on the server we don't need everything to be resolved before sending TODO: I need a way for developer to forward unresolved fetches for client to deal with if they want to try again
            : promiseValue
        const pendingPromises = pendingPromisesStack.at(-1)!;
        pendingPromises.push(promise)
        return promise;
    }


    function $Suspense(promiseValueOrConfig: PendConfig): SSRComponentSetup
    function $Suspense(promiseValueOrConfig: Promise<any> | Promise<any>[], config: PendConfig): SSRComponentSetup
    function $Suspense(promiseValueOrConfig: Promise<any> | Promise<any>[] | PendConfig, config?: PendConfig) {
        const _config = config || promiseValueOrConfig as PendConfig
        const promise = config ? promiseValueOrConfig as Promise<any> : undefined;
        const { Pending, Placeholder } = _config;
        const _Placeholder = Placeholder || (() => html``)
        // const $pending = $Signal(true);
        // const $error = $Signal("");
        // const $ready = $Signal(false);
        // if (__DEV__) __addDevName($pending, "$pending");

        function collectPromises(props: AnyObject) {
            //TODO: how are refs handled in this nested component situation?
            const pendingPromises = promise ? [promise] : []
            pendingPromisesStack.push(pendingPromises);

            const internalComponent = makeComponent(Pending, props.Slotted, props, undefined); // any nested $await calls will collect promises into the pendingPromises array
            if (pendingPromises.length === 0) return internalComponent.output;
            const allPromises = Promise.allSettled(pendingPromises);
            // if (__SSR__) trackPromise(allPromises)
            pendingPromisesStack.pop();

            const pendingComponent: Promise<SSRComponent> = new Promise((resolve) => {
                allPromises
                    .then(() => {
                        storeResolvedValue(pendingComponent, <SSRComponent><unknown>internalComponent)
                        resolve(internalComponent)
                    })
                    .catch(resolveWithPlaceholder)
                timer.pendingTimeout
                    .then(resolveWithPlaceholder)

                let resolved = false;
                function resolveWithPlaceholder() {
                    if (resolved) return;
                    resolved = true;
                    const placeholderComponent = makeComponent(_Placeholder, props.Slotted, props, undefined)
                    storeResolvedValue(pendingComponent, <SSRComponent><unknown>placeholderComponent)
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

    provide($AWAIT, $await)
    provide($SUSPENSE, $Suspense)
}

const SUSPENSE_NOT_INITIALIZED = "$await and $Suspense have not been initialized. Make sure initializeSuspense has been called in makeRootComponent"

export function $await(promiseValue: Promise<any> | Promise<any>[]) {
    return getAppWideResource($AWAIT, SUSPENSE_NOT_INITIALIZED)(promiseValue)
}

export function $Suspense(promiseValueOrConfig: PendConfig): SSRComponentSetup
export function $Suspense(promiseValueOrConfig: Promise<any> | Promise<any>[], config: PendConfig): SSRComponentSetup
export function $Suspense(promiseValueOrConfig: Promise<any> | Promise<any>[] | PendConfig, config?: PendConfig) {
    return getAppWideResource($SUSPENSE, SUSPENSE_NOT_INITIALIZED)(promiseValueOrConfig, config)
}


type PendConfig = {
    Pending: SSRComponentSetup,
    Placeholder?: SSRComponentSetup,
    timeout?: number,
    ErrorView?: SSRComponentSetup<{ error: any }>
}

const IS_RESOLVED = Symbol() as SymbolKey<(promise: Promise<SSRComponent>) => boolean>
const STORE_RESOLVED_VALUE = Symbol() as SymbolKey<(promise: Promise<SSRComponent>, value: SSRComponent) => void>
const GET_RESOLVED_VALUE = Symbol() as SymbolKey<(promise: Promise<SSRComponent>) => SSRComponent>

export function initializePromiseMap() {
    const promiseMap: WeakMap<Promise<SSRComponent>, SSRComponent> = new WeakMap()

    function isResolved(promise: Promise<SSRComponent>) {
        return promiseMap.has(promise)
    }

    function storeResolvedValue(promise: Promise<SSRComponent>, value: SSRComponent) {
        promiseMap.set(promise, value);
    }

    function getResolvedValue(promise: Promise<SSRComponent>) {
        const component = promiseMap.get(promise)
        if (!component) throw new Error("No component :(  This should never happen")
        return component;
    }

    provide(IS_RESOLVED, isResolved)
    provide(STORE_RESOLVED_VALUE, storeResolvedValue)
    provide(GET_RESOLVED_VALUE, getResolvedValue)
}


const PROMISE_MAP_NOT_INITIALIZED = "Promise map has not been initialized. Make sure initializePromiseMap has been called in makeRootComponent"

export function isResolved(promise: Promise<SSRComponent>) {
    return getAppWideResource(IS_RESOLVED, PROMISE_MAP_NOT_INITIALIZED)(promise)
}

export function storeResolvedValue(promise: Promise<SSRComponent>, value: SSRComponent) {
    getAppWideResource(STORE_RESOLVED_VALUE, PROMISE_MAP_NOT_INITIALIZED)(promise, value)
}

export function getResolvedValue(promise: Promise<SSRComponent>) {
    return getAppWideResource(GET_RESOLVED_VALUE, PROMISE_MAP_NOT_INITIALIZED)(promise)
}


