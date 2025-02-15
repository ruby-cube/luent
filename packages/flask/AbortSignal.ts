import { isFunction } from "@rue/utils";
import { Listener } from "./Listener";


type Task = ()=>void

export type AbortSignal = (() => void) | OnAbort

export type OnAbort = (task: Task) => Listener

export function AbortSignal() {
    let cleanups: Set<() => void> | null = new Set()

    return function abort(cleanup?: any) {
        if (cleanup && cleanups) {
            cleanups.add(cleanup)
            return {
                stop() {
                    if (!cleanups) return;
                    cleanups.delete(cleanup)
                    if (cleanups.size === 0) {
                        cleanups = null;
                    }
                }
            }
        }
        else if (cleanups) {
            for (const cleanup of cleanups) {
                cleanup()
            }
            cleanups = null;
        }
    }
}

export function isAbortSignal(value: any): value is AbortSignal {
    return  isFunction(value) && value.name === 'abort'
}