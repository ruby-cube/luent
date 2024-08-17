import { useIncrementalID } from "@rue/utils";
import { ActiveListener } from "./ActiveListener";
import { PendingOp } from "./PendingOp";
import { EffectFlask, getFlask } from "./flask";

export let shouldWarnNoCleanup = false;

const listenersWithNoCleanup = new Set();

export function markNoCleanup(listener: ActiveListener | PendingOp) {
    listenersWithNoCleanup.add(listener);
}

export function unmarkNoCleanup(listener: ActiveListener | PendingOp) {
    listenersWithNoCleanup.delete(listener)
}

export function configureFlask(config: {
    warnNoCleanup: boolean
}) {
    shouldWarnNoCleanup = config.warnNoCleanup
    //@ts-expect-error
    window.warnNoCleanup = () => {
        let warned = false;
        for (const listener of listenersWithNoCleanup) {
            //@ts-expect-error
             warned = listener.warnNoCleanup();
        }
        if (!warned) console.log('Everything looks good :) All flaskable listeners have cleanup strategies.')
    }
}

export const genIncrementalId = __DEV__ ? useIncrementalID() : undefined;

export const setUpCleanupWarning = __DEV__ ? (listener: ActiveListener | PendingOp, cleanupFn: Function | null | undefined, flask: EffectFlask | null) => {
    if (shouldWarnNoCleanup) {
        if (!flask && !cleanupFn) {
            const listenerID = genIncrementalId!();
            //@ts-expect-error
            listener.warnNoCleanup = () => {
                console.warn(`FLASKABLE_LISTENER_#${listenerID} has not been cleaned up. Make sure there's a cleanup strategy in place.`)
                return true;
            }
            console.log(`Listener flagged as potentially having no cleanup. Call 'warnNoCleanup' in console and look for listener id: FLASKABLE_LISTENER_#${listenerID}`)
            console.trace(`FLASKABLE_LISTENER_#${listenerID} trace:`)
            markNoCleanup(listener)
        }
    }
} : undefined