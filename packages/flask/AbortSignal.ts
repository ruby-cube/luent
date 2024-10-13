import { PendingCancelOp } from "./PendingCancelOp";



export type AbortSignal = () => void
export type RegisterAbortSignal = (cleanup: () => void) => PendingCancelOp

export function AbortSignal(): () => void {
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
    return value instanceof Function && value.name === 'abort'
}