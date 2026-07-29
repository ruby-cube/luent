import { debug, useIncrementalID } from "@luent/utils";
import { Listener, Until } from "./Listener";
import { Flask } from "./Flask";

export let shouldWarnNoCleanup = false;

const listenersWithNoCleanup = new Set();

export function markNoCleanup(listener: Listener) {
    listenersWithNoCleanup.add(listener);
}

export function unmarkNoCleanup(listener: Listener) {
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
        if (!warned) debug.log('Everything looks good :) All flaskable listeners have cleanup strategies.')
    }
}

export const genIncrementalId =  __DEV__ ? useIncrementalID() : undefined;

export const setUpCleanupWarning =  __DEV__ ? (listener: Listener, until: Until | undefined, flask: Flask | undefined) => {
    if (shouldWarnNoCleanup) {
        if (!flask && !until) {
            const listenerID = genIncrementalId!();
            //@ts-expect-error
            listener.warnNoCleanup = () => {
               debug.warn(`FLASKABLE_LISTENER_#${listenerID} has not been cleaned up. Make sure there's a cleanup strategy in place.`)
                return true;
            }
            debug.log(`PausableListener flagged as potentially having no cleanup. Call 'warnNoCleanup' in console and look for listener id: FLASKABLE_LISTENER_#${listenerID}`)
            debug.trace(`FLASKABLE_LISTENER_#${listenerID} trace:`)
            markNoCleanup(listener)
        }
    }
} : undefined