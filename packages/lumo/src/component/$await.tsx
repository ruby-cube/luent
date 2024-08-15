import { $Signal } from "@rue/muonic";
import { $elseIf, $if } from "../conditional/$if";
import { NodeEntity, RenderFunction } from "../node/makeNode";

let pendingPromises: Promise<any>[] | undefined;

export function $await(promiseValue: Promise<any> | Promise<any>[]) {
    if (!pendingPromises) throw new Error('$await must eventually be handled by a $pend call in a parent component. If you want to handle the promise with a placeholder and error view in this component, use $pend instead');
    const promise = promiseValue instanceof Array ?
        Promise.all(promiseValue)
        : promiseValue
    pendingPromises.push(promise)
    return promise;
}

type PendConfig = {
    pending: RenderFunction,
    placeholder?: RenderFunction,
    timeout?: number,
    error?: (error: any) => NodeEntity[] | NodeEntity
}

export function $pend(promiseValueOrConfig: Promise<any> | Promise<any>[] | PendConfig, config?: PendConfig): JSX.Element
export function $pend(promiseValueOrConfig: Promise<any> | Promise<any>[] | PendConfig, config?: PendConfig): JSX.Element
export function $pend(promiseValueOrConfig: Promise<any> | Promise<any>[] | PendConfig, config?: PendConfig) {
    const _config = config || promiseValueOrConfig as PendConfig
    const promise = config ? promiseValueOrConfig as Promise<any> : undefined;
    const { pending, error, placeholder, timeout } = _config;
    const $pending = $Signal(true);
    const $error = $Signal("");
    const $ready = $Signal(false);
    let timeoutID: any;
    if (timeout) {
        timeoutID = setTimeout(() => {
            $error.set(() => "Timed out");
            $pending.set(() => false)
        }, timeout)
    }
    pendingPromises = promise ? [promise] : [];
    const nodeEntities = pending(); // any nested $await calls will collect promises into the pendingPromises array
    const allPromises = Promise.all(pendingPromises);
    pendingPromises = undefined;
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

    if (placeholder && error) {
        return (
            <>
                {$if($pending, 'create', placeholder)}
                {$elseIf($error, error($error()))}
                {$elseIf($ready, () => nodeEntities)}
            </>
        )
    }
    if (placeholder) {
        return (
            <>
                {$if($pending, 'create', placeholder)}
                {$elseIf($ready, () => nodeEntities)}
            </>
        )
    }
    if (error) {
        return (
            <>
                {$if($error, 'create', error($error()))}
                {$elseIf($ready, () => nodeEntities)}
            </>
        )
    }
    return (
        <>
            {$if($ready, 'create', () => nodeEntities)}
        </>
    )
}