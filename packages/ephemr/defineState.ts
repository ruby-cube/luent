import { ScheduleStop } from '@rue/planify';
import { MiscObj } from '@rue/types';
import { Precondition, StateRef, StateTransitions } from './State';


export function defineState<T extends StateTransitions<C>, C extends MiscObj>(
    def: {
        id: string,
        precondition?: (context: C) => Precondition,
        initial: string | ((context: C) => string),
        states: T,
        until?: ScheduleStop,
        context?: C
    },
) {
    return def;
}