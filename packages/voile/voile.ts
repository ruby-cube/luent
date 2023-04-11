import { MiscObj } from "@rue/types";


const completedChecks: Set<Function> | null = (__DEV__) ? new Set() : null;

export function useVoile<
    CFG extends {
        __prereqs__?: (Function | Function[])[] | true;
        check: {
            (...args: any[]): boolean | MiscObj;
            context?: MiscObj
        },
    },
    CB extends CFG extends { check: infer C } ? C : never
>(config: CFG) {
    const {check, __prereqs__ } = config;
 
    if (__DEV__) {
        function _check(...args: any[]) {
            completedChecks!.add(_check);
            if (__prereqs__ instanceof Array) {
                for (const prereq of __prereqs__) {
                    if (prereq instanceof Array) {
                        let success = false;
                        for (const _prereq of prereq) {
                            if (completedChecks!.has(_prereq)) success = true
                        }
                        if (!success) {
                            console.warn(`[Voile] The current check function's registered prereqs (${prereq}) have not yet run. Make sure the prereqs precedes current check during control flow`)
                        }
                    }
                    else if (!completedChecks!.has(prereq)) {
                        console.warn(`[Voile] The current check function's registered prereqs (${prereq.name}) has not yet run. Make sure the prereq precedes current check during control flow`)
                    }
                }
            }
            const returnValue = check(...args);
            if (returnValue instanceof Object) {
                check.context = returnValue
            }
            return returnValue;
        }
        return _check as CB;
    }
    return ((...args: any[]) => {
        const returnValue = check(...args);
        if (returnValue instanceof Object) {
            check.context = returnValue
        }
        return returnValue;
    }) as CB
}


/* USAGE */

if (__DOCU__) {
    const mustInsertBullet = useVoile({  //TODO: Build optimization. If check doesn't return object, remove useVoile();
        __prereqs__: [], //TODO: Build optimization. remove __prereqs__:
        check(text: string) {
            return {
                bullet: "hey"
            }
        },
    })
}