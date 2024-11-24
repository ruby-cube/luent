import { ion, __addDevName, AtomicIon } from "../../../quarky/src";
import { Else, ElseIf, If } from "../conditional/If";
import { Component, ComponentSetup } from "../component/InternalComponent";
import { AnyObject } from "@rue/types";
import { NodeEntity } from "../node/makeNode";


const pendingPromisesStack: Promise<any>[][] = []

export function pend(promiseValue: Promise<any> | Promise<any>[]) {
    if (pendingPromisesStack.length === 0) throw new Error('pend must eventually be handled by a Suspense call in a parent component. If you want to handle the promise with a placeholder and error view in this component, use Suspense instead');
    const promise = promiseValue instanceof Array ?
        Promise.all(promiseValue)
        : promiseValue
    const pendingPromises = pendingPromisesStack.at(-1)!;
    pendingPromises.push(promise)
    return promise;
}


export function Suspense<T extends AnyObject>(input: {
    timeout?: number,
    hold?: () => NodeEntity | NodeEntity[]
    catch?: (error: Error) => NodeEntity | NodeEntity[]
    setup?: () => T
    Slot: (o?: T) => NodeEntity | NodeEntity[]
}) {
    const { Slot, hold: renderPlaceholder = () => undefined, timeout, setup, catch: renderError = () => undefined } = input;
    const $pending = ion(true);
    const $error: AtomicIon<Error> = ion();
    const $ready = ion(false);
    if (__DEV__) __addDevName($pending, "$pending");

    let timeoutID: any;
    if (timeout) {
        timeoutID = setTimeout(() => {
            $error.as(new Error("Timed out"));
            $pending.as(false)
        }, timeout)
    }

    // collect promises
    const pendingPromises: Promise<unknown>[] = []
    pendingPromisesStack.push(pendingPromises);
    const output = Slot(setup?.()); // any nested pend calls will collect promises into the pendingPromises array
    const allPromises = Promise.all(pendingPromises);
    pendingPromisesStack.pop();
    allPromises
        .then(() => {
            clearTimeout(timeoutID)
            $pending.as(false)
            $ready.as(true)
        })
        .catch(err => {
            $error.as(typeof err === 'string' ? new Error(err) : err);
            $pending.as(false)
        })

    return Component(
        <>
            {[
                If($pending, renderPlaceholder),
                ElseIf($error, () => renderError($error())),
                Else(() => output)
            ]}
        </>
    )
}