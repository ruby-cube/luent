import { computed, ComputedRef, nextTick, onMounted, Ref, ref } from 'vue';
import { ExtensibleRef, set$, r$, isSettingUpComponent } from '@rue/paravue';
import { createHook } from '@rue/pecherie';
import { ScheduleStop, beginScene, Scene } from '@rue/planify';
import { addPS } from '@rue/thread';
import { $type } from '@rue/utils';
import { MiscObj } from '@rue/types';

type StateValue = string | null

const _connectSubstate = Symbol("connectSubstate");
const _init = Symbol("initState")

const [castBeforeStateTransition, beforeStateTransition] = createHook({
    hook: "before-state-transition",
    data: $type as {
        state: State;
        currentValue: string | null;
        nextState: string | null;
    },
})

function isInitialValue(initial: StateValue | (() => StateValue)): initial is StateValue {
    return typeof initial === "string" || initial === null
}


class State extends ExtensibleRef {

    private initialValue: StateValue;
    private preconditions: Set<StateRef> | null;
    private substateMap: Map<StateValue, State[]> | undefined;
    private stateIsValid: ComputedRef<boolean> | Ref<boolean>;
    private stateValue: Ref<StateValue>;

    constructor(
        public id: string,
        private states: StateTransitions,
        private initial: StateValue | ((context?: MiscObj) => StateValue),
        precondition: Precondition | PreconditionGetter | undefined,
        private until: ScheduleStop | undefined,
        private context: MiscObj | undefined
    ) {
        super();

        const initialValue = this.initialValue = isInitialValue(initial) ? initial : initial(context);
        this.history = [initialValue];
        const preconditions = this.preconditions = precondition ? new Set() : null;
        const _precondition = precondition instanceof Function ? precondition(context as StateRefs) : precondition;

        let superstatesRegistered = false;
        const stateIsValid = this.stateIsValid = _precondition ? computed(() => {
            let success = false;
            for (const superstate of _precondition) {
                if (superstate instanceof Array) {
                    success = superstate[0].is(superstate[1]);
                    preconditions!.add(superstate[0]);
                }
                else {
                    success = superstate.value !== null;
                    preconditions!.add(superstate);
                }
                if (superstatesRegistered && success) break;
            }
            superstatesRegistered = true;
            return success;
        }) : ref(true);

        const stateValue: Ref<StateValue> = this.stateValue = r$(stateIsValid) ? ref(initialValue) : ref(null);
        this.cStateValue = precondition ? computed(() => r$(stateIsValid) ? r$(stateValue) : null) : computed(() => r$(stateValue));

        if (_precondition) {
            for (const superstate of _precondition) {
                if (superstate instanceof Array) {
                    superstate[0][_connectSubstate](this, superstate[1])
                }
                else {
                    superstate[_connectSubstate](this);
                }
            }
        }
        else {
            if (isSettingUpComponent()) {
                onMounted(() => this.initTransitions(initialValue))
            }
            else {
                addPS(() => this.initTransitions(initialValue))
            }
        }
    }

    private currentlyInitiating: StateValue = null;
    private validTargetStatesMap: Map<string, Set<StateValue>> = new Map();

    // canBecome(stateValue: StateValue) {
    //     const currentlyInitiating = this.currentlyInitiating;
    //     if (__DEV__) __validateCanBecomeCall(currentlyInitiating);
    //     const validTargetStatesMap = this.validTargetStatesMap;
    //     const existingSet = validTargetStatesMap.get(currentlyInitiating!);
    //     const validStateValues = existingSet ? existingSet.add(stateValue) : new Set([stateValue])
    //     if (!existingSet) validTargetStatesMap.set(currentlyInitiating!, validStateValues);
    // }

    // canBecomeAny() {
    //     const states = this.states;
    //     for (const key in states) {
    //         this.canBecome(key);
    //     }
    // }

    // canBecomeAnyOther() {
    //     const states = this.states;
    //     for (const key in states) {
    //         if (key === this.currentlyInitiating) continue;
    //         this.canBecome(key);
    //     }
    // }

    $willBecome(stateValue: StateValue) {
        if (__DEV__) __validateCanBecomeCall(this.currentlyInitiating);
        if (__DEV__) __validateStateValue(stateValue, this.states);
        const initState = () => { this.$becomes(stateValue) }
        initState.if = (condition: (context: MiscObj | undefined) => boolean) => {
            return () => {
                if (condition(this.context)) {
                    this.$becomes(stateValue);
                }
            };
        }
        return initState;
    }

    $becomes(stateValue: StateValue) {
        // if (__DEV__) __validateTargetState(this.value, stateValue, this.validTargetStatesMap);
        castBeforeStateTransition({
            state: this,
            currentValue: this.value,
            nextState: stateValue
        });
        if (r$(this.stateIsValid)) {
            set$(this.stateValue, stateValue);
            this.initTransitions(stateValue);
        }
        else {
            set$(this.stateValue, null)
        }
    }

    $mayBecome(stateValue: StateValue) {
        if (__DEV__) __validateTargetState(this.value, stateValue, this.validTargetStatesMap);
        if (!isValidTargetState(this.currentlyInitiating, stateValue, this.validTargetStatesMap)) return;
        castBeforeStateTransition({
            state: this,
            currentValue: this.value,
            nextState: stateValue
        });
        if (r$(this.stateIsValid)) {
            set$(this.stateValue, stateValue);
            this.initTransitions(stateValue);
        }
        else {
            set$(this.stateValue, null)
        }
    }

    private cStateValue: ComputedRef<StateValue> | Ref<StateValue>;

    is(stateValue: StateValue) {
        return r$(this.cStateValue) === stateValue;
    }

    get value() {
        return r$(this.cStateValue);
    }

    // private _final: boolean = false;
    // becomesFinal() { 
    //     this._final = true;
    // }
    isFinal() {
        if (this.value === null) return false; //QUESTION: not sure about this. If a state is invalid because of unmet preconditions, can it be in its final state?
        return this.validTargetStatesMap.get(this.value) == null;
    }

    private history: StateValue[];
    getHistory() {
        return [...this.history];
    }

    [_connectSubstate](stateRef: State, stateValue?: string) {
        let substateMap = this.substateMap;
        if (substateMap === undefined)
            substateMap = this.substateMap = new Map();

        if (stateValue) {
            this.enrollSubstate(stateValue, stateRef);
        }
        else {
            const states = this.states
            for (const key in states) {
                this.enrollSubstate(key, stateRef)
            }
        }

    }

    private enrollSubstate(stateValue: string, substate: State) {
        if (__DEV__) __validateStateValue(stateValue, this.states);
        const substates = this.substateMap!.get(stateValue);
        if (substates) {
            substates.push(substate)
        }
        else {
            this.substateMap!.set(stateValue, [substate])
        }
    }

    [_init]() {
        const initial = this.initial
        set$(this.stateValue, isInitialValue(initial) ? initial : initial(this.context));
        addPS(() => {
            this.initTransitions(this.initialValue)
        })
    }

    private initSubstates(stateValue: string) {
        const substateMap = this.substateMap;
        if (substateMap == null) return;
        const substates = substateMap.get(stateValue);
        if (substates == null) return;
        for (const substate of substates) {
            substate[_init]();
        }
    }

    private currentState: Scene | undefined;

    private initTransitions(value: StateValue) {
        if (value === null) return;
        const transition = this.states[value].transition;
        if (transition == null) return;

        this.currentState =
            beginScene((scene) => {
                this.currentlyInitiating = value;
                transition(this, this.context);
                this.initSubstates(value)
                beforeStateTransition((ctx) => {
                    const preconditions = this.preconditions
                    const nextState = ctx.nextState;
                    const transitioningState = ctx.state;
                    if (nextState && nextState in this.states || preconditions && preconditions.has(transitioningState)) {
                        scene.end();
                    }
                })
                const until = this.until;
                if (until) {
                    function stop() {
                        scene.end();
                    }
                    stop.isRemover = true as const;
                    until(stop); //TODO: init auto cleanup!
                }
                this.currentlyInitiating = null;
            })
    }

};






// const [castStateTransitioned, onStateTransitioned] = createHook({
//     hook: "state-transitioned",
//     data: $type as {
//         currentState: string | null
//     },
//     onceAsDefault: true
// })

type TransitionCondition = (context: any) => boolean

type TargetStates = {
    [key: string]: true | TransitionCondition;
}

export type StateTransitions<C extends any = any> = {
    [key: string]: {
        canBecome?: TargetStates;
        transition?: (state: State, context: C) => void;
        isFinal?: boolean;
    }
};
// type InitState = {
//     (): void;
//     once: true;
// }
export type Precondition = (StateRef | [StateRef, string])[];
export type PreconditionGetter = (context: any) => Precondition;
type StateRefs = { [key: string]: StateRef }

export function stateRef<
    D extends {
        id: string,
        precondition?: Precondition | PreconditionGetter,
        initial: StateValue | ((context: any) => StateValue),
        states: StateTransitions,
        until?: ScheduleStop
    },
    T extends D extends { states: infer S } ? S : never,
>(def: D, context?: D extends { context?: infer X } ? X : undefined) {
    const { id, initial, states, precondition, until, } = def;
    return new State(id, states, initial, precondition, until, context) as StateRef<keyof T>;
}

export type StateRef<StateValues = string> = ExtensibleRef & Omit<State, "$willBecome" | "becomesFinal" | "canBecome" | "canBecomeAny" | "canBecomeAnyOther">


function __validateStateValue(stateValue: StateValue, states: StateTransitions) {
    if (stateValue == null || stateValue in states) return;
    throw new Error(`Invalid stateValue. Use one of the following values: ${JSON.stringify(Object.keys(states))}`)
}

function __validateTargetState(currentState: StateValue, targetState: StateValue, targetMap: Map<string, Set<StateValue>>) {
    if (currentState == null) return; //QUESTION: I'm not thinking clearly enough.. currently, allowing null states to transition to any value, but I don't know if this is correct.
    const targets = targetMap.get(currentState);
    if (targets == null) throw new Error("No target stateValues exist for this state. The state is either in its final state or no target states have been registered. Register target states with 'canBecome' methods");
    if (targets.has(targetState)) return;
    throw new Error(`Invalid stateValue. Use one of the following values: ${JSON.stringify(Object.keys(targets))}`)
}

function isValidTargetState(currentState: StateValue, targetState: StateValue, targetMap: Map<string, Set<StateValue>>) {
    if (currentState == null) return true; //QUESTION: I'm not thinking clearly enough.. currently, allowing null states to transition to any value, but I don't know if this is correct.
    const targets = targetMap.get(currentState);
    if (targets == null) return false;
    if (targets.has(targetState)) return true;
    return false;
}

function __validateCanBecomeCall(currentlyInitiating: StateValue) {
    if (currentlyInitiating == null) {
        throw new Error("Cannot call 'canBecome' methods outside of state initiation scope");
    }
}

export function onlyIf(condition: (context: MiscObj | undefined) => boolean) {
    return condition;
}

    // private __validateDependents(value: StateValue) {
    //     const dependents = this.dependents;
    //     if (dependents && (dependents.has(value) || dependents.has("all")) && this.validatingSubstates === false) throw new Error(`The state '${value}' in '${this.id}' must init substates `)
    //     this.validatingSubstates = false;
    // }




    // private validatingSubstates = false;
    // private validateSubstates(stateRef: State, substates: State[]) {
    //     this.validatingSubstates = true;
    //     const currentState = stateRef.value;
    //     const dependents = this.dependents;
    //     if (dependents === undefined) throw new Error(`Must register state: [${stateRef.id}, '${currentState}'] as precondition for its substates`)
    //     if (currentState) {
    //         const _substates = dependents.get(currentState);
    //         const _substatesForAll = dependents.get("all");
    //         const substatesSet = new Set(substates);
    //         for (const substate of substates) {
    //             if (!(_substates && _substates.has(substate) || _substatesForAll && _substatesForAll.has(substate)))
    //                 throw new Error(`The substate (${substate.id}) must register precondition [${stateRef.id}, '${currentState}'] `)
    //         }
    //         if (_substates) {
    //             for (const substate of _substates) {
    //                 if (!substatesSet.has(substate))
    //                     throw new Error(`The state '${currentState}' in '${stateRef.id}' must init substate '${substate.id}' `)
    //             }
    //         }
    //         if (_substatesForAll) {
    //             for (const substate of _substatesForAll) {
    //                 if (!substatesSet.has(substate))
    //                     throw new Error(`The state '${currentState}' in '${stateRef.id}' must init substate '${substate.id}' `)
    //             }
    //         }
    //     }
    // }


// // parallel states
// // compound states

// const Location = stateRef({
//     initial: "outside",
//     states: {
//         outside(state) {
//             onMouseDown(element, state.$willBecome("inside"));
//         },
//         inside(state) {
//             this.active(state)
//             onMouseUp(element, state.$willBecome("outside"));
//         },
//         off(state) {
//             state.final();
//         }
//     }
// })

// const State = stateRef({
//     precondition: ({ location }) => location.is("outside") || location.is("inside"),
//     initial: "active",
//     states: {
//         active(state, ctx) {
//             onMouseDown(ctx.element, state.$willBecome("locked"));
//         },
//         locked(state, ctx) {
//             this.active(state, ctx);
//             onMouseUp(ctx.element, state.$willBecome("active"));
//         },
//         off(state) {
//             state.final();
//         }
//     }
// })


// const location = Location.use({
//     until: scene.ended,
//     context: {
//         element
//     }
// });

// const state = State.use({
//     until: scene.ended,
//     context: {
//         element,
//     },
//     precondition: {
//         location
//     }
// });


// // extend state
// LocationState.extend({

// })

// state.is("active");
// state.isFinal()
// state.currentState()
// state.getHistory()