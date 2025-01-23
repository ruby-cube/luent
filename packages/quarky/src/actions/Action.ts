//@ts-nocheck
import { TypedKey } from "@rue/lumo";
import { AtomicIon, isAtomicIon } from "../ion/AtomicIon";
import { ObservedProp } from "../ionize/ObservedProp";
import { Phase, RenderCycle, useRenderCycle } from "../effects/RenderCycle";
import { PropIon } from "../ionize/PropIon";


//TODO: 
// - action nesting
// - state rollback
// - history/state record

class ActionRecord {
    success: boolean = true

    constructor() {

    }

    nestedActions?: ActionRecord[]

    tracked: Set<AtomicIon | PropIon> = new Set()

    trackChange(reactivePrimitive: AtomicIon | PropIon) {
        if (this.tracked.has(reactivePrimitive)) return;
        this.tracked.add(reactivePrimitive);
        watch(subject, ({newState, oldState}) => {
            if (!action.success) {
                subject.value = oldState
            }
        })
    }
    //TODO: trackMutation, recordChange? recordMutation? for history

    trackMutation(){

    }
}


type Action = (...args: unknown[]) => unknown

const actionMap: Map<string | TypedKey<Action>, Action> = new Map()

/**
 * Limitation: Actions must be synchronous. Perform any asynchronous calls before action is performed and perform action after asynchronous tasks are completed 
*/
function registerAction(actionKey: string | TypedKey<Action>, actionFn: Action) {
    actionMap.set(actionKey, actionFn)
}

function getAction(actionKey: string | TypedKey<(...args: unknown[]) => unknown>) {
    const action = actionMap.get(actionKey)
    if (!action) throw new Error(`Action not found. ${String(actionKey)} must be registered as an action`)
    return action
}


// Action stack
let currentAction: undefined | ActionRecord
let prevAction: undefined | ActionRecord

function getCurrentAction() {
    return currentAction;
}

function pushAction(action: ActionRecord) {
    prevAction = currentAction;
    currentAction = action
}

function popAction() {
    currentAction = prevAction;
    prevAction = undefined;
}

/**
 * Limitation: 
 * - Actions must be synchronous. Perform any asynchronous calls before action is performed and perform action after asynchronous tasks are completed 
 * - Actions must be performed BEFORE the render phase of a render cycle.
*/
function doAction(actionKey: string | TypedKey<(...args: unknown[]) => unknown>, args: unknown[], propagatesError: boolean = true) {
    const renderCycle = useRenderCycle()
    if (renderCycle.phase > Phase.BEFORE_RENDER) throw new Error('doAction can only be called before render. Make sure doAction call is not nested in a watcher effect that is scheduled for the render or post-render phase')
    const action = new ActionRecord(actionKey, args)
    try {
        pushAction(action)
        emitBeforeAction(actionKey, action)
        const output = getAction(actionKey)(...args)
        emitAfterAction(actionKey, action)
        return [output, null]
    }
    catch (err) {
        if (propagatesError) {
            if (typeof err === 'string')
                throw new Error(err)
            else throw new Error(err.message)
        }
        return [null, err]
    }
    finally {
        popAction()
    }
}


function trackAction(reactivePrimitive: AtomicIon | PropIon) {
    const action = getCurrentAction();
    if (!action) return;
    action.trackChange(reactivePrimitive)
}


/* 
EXAMPLE:

const [output, err] =
    doAction(INSERT_TEXT, [word, index])

if (err) {
    displayErrorMessage(err)
}
else {
    storeResult(output)
} 
*/

