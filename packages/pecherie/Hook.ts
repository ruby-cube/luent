//@-ts-nocheck
import { PerformanceCheck, usePerformanceCheck } from "@rue/dev";
import { Cast, MiscObj, UnionToIntersection } from '@rue/types';
import { Callback, CallbackRemover, Callbacks, ListenerOptions, OneTimeListener, PendingCancelOp, ScheduleCancel, ScheduleRemoval, ScheduleStop, $listen, SustainedListener } from '@rue/flask';
import { noop } from "@rue/utils";

let performanceCheck: PerformanceCheck;
if (__DEV__) performanceCheck = usePerformanceCheck();

export type UseHookState = () => { state: { [key: string]: any }, methods: { [key: string]: (...args: any[]) => void } }

type CastHook<S extends ((data: any) => any) | (() => any)> = S;

export type DevListener<L> = L & { handlers: Callbacks }

export type ContextData<T> = T extends MiscObj ? T : { data: T };

export type DataAsArg<$DAT, USE extends UseHookState> = keyof $DAT extends never ? false : keyof ReturnType<USE>["methods"] extends never ? true : false;
export type HookConfig<LIT, $DAT, USE extends UseHookState> = { hook?: LIT, data?: any, reply?: UseHookState, onceAsDefault?: true, dataAsArg?: DataAsArg<$DAT, USE> };
export type ReturnOfCaster<USE extends UseHookState> = keyof ReturnType<USE>["state"] extends never ? void : ReturnType<USE>["state"];

export function createHook<
    LIT extends `${string}`,
    NME extends CFG extends { hook: infer N } ? N : "[unnamed hook]",
    $DAT extends CFG extends { data: infer C } ? C : {},
    USE extends CFG extends { reply: infer S } ? S extends UseHookState ? S : () => { state: {} } : () => { state: {}, methods: {} },
    ARG extends CFG extends { dataAsArg: true } ? $DAT : { [Key in keyof ({ hook: NME } & ContextData<$DAT> & ReturnType<USE>["methods"])]: ({ hook: NME } & ContextData<$DAT> & ReturnType<USE>["methods"])[Key] },
    CB extends (ctx: ARG) => unknown,
    S extends CFG extends { dataAsArg: true } ? ((arg: $DAT) => ReturnOfCaster<USE>) : keyof $DAT extends never ? (() => ReturnOfCaster<USE>) : ((data: { [Key in keyof $DAT]: $DAT[Key] }) => ReturnOfCaster<USE>),
    CFG extends HookConfig<LIT, $DAT, USE>
>(config?: CFG): [CastHook<S>, CFG extends { onceAsDefault: true } ? OneTimeListener<CB> : SustainedListener<CB>] {
    const _config = config || {} as HookConfig<LIT, $DAT, USE>;
    const { hook, reply, onceAsDefault, dataAsArg } = _config;
    const _hook = hook || "[unnamed hook]" as const;
    const handlers = new Set() as Callbacks;

    function onHook(handler?: Callback, options?: ListenerOptions) {
        if (handler == null) {
            handler = noop;
            options = { once: true }
        }
        // if (hook === "scene-ended") {console.log("LISTEN: Auto Cleanup scheduled"); console.trace()}
        return $listen(handler, options, {
            enroll: (handler) => { //TODO: create some sort of safeguard ... a test? to make sure enroll function properly registers "once"
                handlers.add(handler)
            },
            remove: (handler) => {
                handlers.delete(handler)
            },
            onceAsDefault
        })
    }

    if (__TEST__) {
        onHook.handlers = handlers
    }

    const useHookState = reply || (() => { return { state: {}, methods: {} }; });

    function castHook(data?: $DAT) {
        return runHandlers(_hook, handlers, data, dataAsArg, useHookState, reply) as ReturnOfCaster<USE>
    }

    return [
        castHook as CastHook<S>,
        <Cast>onHook as CFG extends { onceAsDefault: true } ? OneTimeListener<CB> : SustainedListener<CB>
    ];
}


export function runHandlers(hook: string, handlers: Callbacks | undefined, data: MiscObj | undefined, dataAsArg: boolean | undefined, useHookState: UseHookState, reply: UseHookState | undefined) {
    if (__DEV__) performanceCheck.start(hook);
    const { state, methods } = useHookState();

    if (handlers == null || handlers.size == 0) {
        if (__DEV__) performanceCheck.end();
        return state;
    }

    const _data = data || {};
    const arg = dataAsArg ? data : _data instanceof Object ? {
        hook,
        ..._data,
        ...methods
    } : { hook, data, ...methods }

    for (const cb of handlers) {
        if ("isRemover" in cb) cb();
        else cb(arg, __DEV__ ? { hook } : null);
    }

    if (__DEV__) performanceCheck.end();
    return reply === undefined ? undefined : state;
}