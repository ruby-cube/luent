import { $Signal, __addDevName } from "@rue/muonic";
import { AnyObject } from "@rue/types";
import { html, SSRComponent, SSRComponentSetup } from "./lumin.js";
import { makeComponent, trackPromise } from "./makeComponent.js";
import { getPendingTimeout } from "./createSSRApp.js";
import { storeResolvedValue } from "./pendingComponent.js";

const pendingPromisesStack: Promise<any>[][] = []

export function $await(promiseValue: Promise<any> | Promise<any>[]) {
    if (pendingPromisesStack.length === 0) throw new Error('$await must eventually be handled by a $pend call in a parent component. If you want to handle the promise with a placeholder and error view in this component, use $pend instead');
    const promise = promiseValue instanceof Array ?
        Promise.all(promiseValue)
        : promiseValue
    const pendingPromises = pendingPromisesStack.at(-1)!;
    pendingPromises.push(promise)
    return promise;
}

type PendConfig = {
    Pending: SSRComponentSetup,
    Placeholder?: SSRComponentSetup,
    timeout?: number,
    ErrorView?: SSRComponentSetup<{ error: any }>
}

export function $pend(promiseValueOrConfig: PendConfig): SSRComponentSetup
export function $pend(promiseValueOrConfig: Promise<any> | Promise<any>[], config: PendConfig): SSRComponentSetup
export function $pend(promiseValueOrConfig: Promise<any> | Promise<any>[] | PendConfig, config?: PendConfig) {
    const _config = config || promiseValueOrConfig as PendConfig
    const promise = config ? promiseValueOrConfig as Promise<any> : undefined;
    const { Pending, Placeholder } = _config;
    const _Placeholder = Placeholder || (() => html``)
    // const $pending = $Signal(true);
    // const $error = $Signal("");
    // const $ready = $Signal(false);
    // if (__DEV__) __addDevName($pending, "$pending");

    function collectPromises(props: AnyObject) {

        const pendingPromises = promise ? [promise] : []
        pendingPromisesStack.push(pendingPromises);

        const internalComponent = makeComponent(Pending, props.Slotted, props, undefined); // any nested $await calls will collect promises into the pendingPromises array
        const allPromises = Promise.all(pendingPromises);
        // if (__SSR__) trackPromise(allPromises)
        pendingPromisesStack.pop();

        const pendingComponent: Promise<SSRComponent> = new Promise((resolve) => {
            allPromises
                .then(() => {
                    storeResolvedValue(pendingComponent, <SSRComponent><unknown>internalComponent)
                    resolve(internalComponent)
                })
                .catch(resolveWithPlaceholder)
            getPendingTimeout()
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
        return pendingComponent;
    }


    return function PendingComponent(props: AnyObject) {
        return collectPromises(props)
    }

}

