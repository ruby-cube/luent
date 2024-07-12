import { Callback, Callbacks, ListenerOptions, OneTimeTargetedListener, $listen, SustainedTargetedListener, initAutoCleanup, PendingCancelOp } from '@rue/flask';
import { ContextData, HookConfig, ReturnOfCaster, runHandlers, UseHookState } from './Hook';
import { noop } from '@rue/utils';
import { Cast, AnyObject } from '@rue/types';





type CastHook<S extends ((target: any, context: any) => any) | ((target: any) => any)> = S;


export function createTargetedHook<
    LIT extends `${string}`,
    NME extends CFG extends { hook: infer N } ? N : "[unnamed hook]",
    $DAT extends CFG extends { data: infer C } ? C : {},
    USE extends CFG extends { reply: infer S } ? S extends UseHookState ? S : () => { state: {} } : () => { state: {}, methods: {} },
    ARG extends CFG extends { dataAsArg: true } ? $DAT : { [Key in keyof ({ hook: NME } & ContextData<$DAT> & ReturnType<USE>["methods"])]: ({ hook: NME } & ContextData<$DAT> & ReturnType<USE>["methods"])[Key] },
    CB extends (ctx: ARG) => unknown,
    S extends CFG extends { dataAsArg: true } ? ((target: $TGT, arg: $DAT) => ReturnOfCaster<USE>) : keyof $DAT extends never ? ((target: $TGT) => ReturnOfCaster<USE>) : ((target: $TGT, data: { [Key in keyof $DAT]: $DAT[Key] }) => ReturnOfCaster<USE>),
    CFG extends HookConfig<LIT, $DAT, USE> & { targetID?: unknown },
    $TGT extends CFG extends { targetID: infer T } ? T extends undefined ? AnyObject : T : AnyObject,
>(config: CFG): [CastHook<S>, CFG extends { onceAsDefault: true } ? OneTimeTargetedListener<$TGT, CB> : SustainedTargetedListener<$TGT, CB>] {
    const _config = config || {} as HookConfig<LIT, $DAT, USE>;
    const { hook, reply, onceAsDefault, dataAsArg } = _config;
    const _hook = hook || "[unnamed hook]" as const;

    const targetMap = new Map() as Map<any, Callbacks>;

    function onHook(target: $TGT, handler?: Callback, options?: ListenerOptions) {
        if (handler == null) {
            handler = noop;
            options = { once: true };
        }
        const existingCallbacks = targetMap.get(target);
        const handlers = existingCallbacks ? existingCallbacks : new Set() as Callbacks;
        if (!existingCallbacks) {
            let pendingAutoCleanups: PendingCancelOp[] | void;
            // let pendingSceneCleanup: PendingCancelOp | void;
            targetMap.set(target, handlers);
            const cleanup = () => {
                targetMap.delete(target);
                if (pendingAutoCleanups) {
                    for (const cleanup of pendingAutoCleanups){
                        cleanup.cancel();}
                    }
                // if (pendingSceneCleanup) pendingSceneCleanup.cancel();
            };
            cleanup.isRemover = true as const;
            pendingAutoCleanups = initAutoCleanup(cleanup)
            // pendingSceneCleanup = initSceneAutoCleanup(cleanup)
        }
        return $listen(handler, options, {
            enroll: (_callback) => {
                handlers.add(_callback);
            },
            remove: (_callback) => {
                handlers.delete(_callback);
            },
            onceAsDefault
        })
    }
    if (__TEST__) {
        onHook.targetMap = targetMap
    }
    const useHookState = reply || (() => { return { state: {}, methods: {} }; });

    function castHook(target: $TGT, data?: $DAT) {
        if (hook === "action-complete") console.log("hook", _hook)
        const handlers = targetMap.get(target);
        runHandlers(_hook, handlers, data, dataAsArg, useHookState, reply)
    }

    return [
        castHook as CastHook<S>,
        <Cast>onHook as CFG extends { onceAsDefault: true } ? OneTimeTargetedListener<$TGT, CB> : SustainedTargetedListener<$TGT, CB>
    ];
}



// USAGE:

// DESIRED API

// const [castInsertText, beforeInsertText] = createTargetedHook({
//     hook: "insert-text",
//     parameter: {
//         hey: "hi"
//     },
//     sustainAsDefault: true,
//     reply: () => {
//         const state = {
//             defaultPrevented: false
//         }
//         return {
//             state,
//             methods: {
//                 preventDefault() {
//                     state.defaultPrevented = true;
//                 }
//             }
//         }
//     }
// })

// beforeInsertText({}, (ctx) => {
//     ctx.hey
//     ctx.hook
// }, { until: (stop) => onPreunmount(stop) });

// const state = castInsertText({}, { hey: "lkj" })
// state.defaultPrevented

// const pendingOp = onInsertText(() => {
//     let stuff = 9
//     console.log("hi");
//     stuff++;
//     return stuff;
// }, { once: true })


// pendingOp.cancel();


// onInsertText(() => {
//     let stuff = 9
//     console.log("hi");
//     stuff++;
//     return stuff;
// }, { toCancel: (cancel) => onInsertEnd(cancel) }) 
//NOTE: This is super tricky. Clean up and running once and where hooks are called will affect how cancelation works... 
// TODO: tease apart the different ways to cancel and whether cleanup of the cancel scheduler is needed...
// FIX: There's a potential for memory leaks here
