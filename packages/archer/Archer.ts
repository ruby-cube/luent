//@-ts-nocheck
import { PerformanceCheck, usePerformanceCheck } from "@rue/dev";
import { Cast, MiscObj } from '@rue/types';
import { Callback, CallbackRemover, ListenerOptions, $listen, SustainedListenerReturn, MaybeBadScheduler, OneTimeListenerReturn } from '@rue/planify';
import { ContextData, HookConfig, ReturnOfCaster, UseHookState } from '@rue/pecherie';


let performanceCheck: PerformanceCheck;
if (__DEV__) performanceCheck = usePerformanceCheck();

type MessageConfig<LIT = string, $DAT = any, USE extends UseHookState = typeof _useHookState> = Omit<HookConfig<LIT, $DAT, USE>, "hook"> & {
    message?: LIT | undefined;
    targetID?: unknown;
}

type TargetID = any
type CallbackMap = Map<TargetID, Callback | CallbackRemover<void>>

const messageMap: Map<MessageConfig, CallbackMap> = new Map() //TODO: Clean up?? Is it necessary?

export function defineMessage<
    CFG extends MessageConfig<LIT, $DAT, USE>,
    LIT extends `${string}`,
    $DAT extends CFG extends { data: infer C } ? C : {},
    USE extends CFG extends { reply: infer S } ? S extends UseHookState ? S : () => { state: {} } : () => { state: {}, methods: {} },
>(config: CFG) {
    messageMap.set(config as MessageConfig, new Map() as CallbackMap)
    return config;
}


const _useHookState = () => { return { state: {}, methods: {} }; };

export function send<
    MSG extends MessageConfig,
    $TGT extends MSG extends { targetID: infer T } ? T extends undefined ? MiscObj : T : MiscObj,
    $DAT extends MSG extends { data: infer C } ? C : {},
    USE extends MSG extends { reply: infer S } ? S extends UseHookState ? S : () => { state: {} } : () => { state: {}, methods: {} },
    D extends MSG extends { dataAsArg: true } ? $DAT : keyof $DAT extends never ? never : { [Key in keyof $DAT]: $DAT[Key] },
>(MESSAGE: MSG, destination: { to: $TGT }, data?: D): ReturnOfCaster<USE> {
    const { message, reply, dataAsArg } = MESSAGE;
    const { to: targetID } = destination;
    const callbackMap = messageMap.get(MESSAGE);
    if (callbackMap == null) throw new Error("Cannot find callbackMap") //TODO: write a more helpful error message
    const cb = callbackMap.get(targetID);
    const useHookState = reply || _useHookState;
    if (__DEV__) performanceCheck.start(message || "[undefined message]");
    const { state, methods } = useHookState();
    if (!cb) {
        performanceCheck.end()
        return state as ReturnOfCaster<USE>;
    }

    const _data = data || {};
    const arg = dataAsArg ? data : _data instanceof Object ? {
        message,
        ..._data,
        ...methods
    } : { message, data, ...methods }

    // if ("isRemover" in cb) cb();
    // else 
    cb(arg);

    if (__DEV__) performanceCheck.end();
    return reply === undefined ? <ReturnOfCaster<USE>>undefined : <ReturnOfCaster<USE>>state;
}


// export type HeedReturn<MSG, CB extends Callback, OPT extends ListenerOptions> = MSG extends { onceAsDefault: true } ? OneTimeListenerReturn<CB, OPT, CB extends MaybeBadScheduler<OPT, CB> ? CB : never, MaybeBadScheduler<OPT, CB>> : SustainedListenerReturn<CB, OPT, CB extends MaybeBadScheduler<OPT, CB> ? CB : never, MaybeBadScheduler<OPT, CB>>;

export function re<
    MSG extends MessageConfig,
    NME extends MSG extends { message: infer N } ? N : undefined,
    USE extends MSG extends { reply: infer S } ? S extends UseHookState ? S : () => { state: {} } : () => { state: {}, methods: {} },
    ARG extends MSG extends { dataAsArg: true } ? $DAT : { [Key in keyof ({ message: NME } & ContextData<$DAT> & ReturnType<USE>["methods"])]: ({ message: NME } & ContextData<$DAT> & ReturnType<USE>["methods"])[Key] },
    $TGT extends MSG extends { targetID: infer T } ? T extends undefined ? MiscObj : T : MiscObj,
    $DAT extends MSG extends { data: infer C } ? C : {},
    OPT extends ListenerOptions,
    CB extends (ctx: ARG) => unknown,
>(MESSAGE: MSG, id: $TGT, callback: CB, options?: OPT): CB {
    const { onceAsDefault } = MESSAGE;
    const callbackMap = messageMap.get(MESSAGE);
    if (callbackMap == null) throw new Error("Cannot find callbackMap") //TODO: write a more helpful error message

    $listen(callback, options, {
        enroll: (callback) => {
            callbackMap.set(id, callback)
        },
        remove: () => {
            callbackMap.delete(id)
        },
        onceAsDefault
    })

    return callback;
}


