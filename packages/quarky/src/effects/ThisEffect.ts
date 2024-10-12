import { AnyIon } from "../ion/AnyIon";
import { IonicModel } from "../ionize/ionize";
import { MutationRecord } from "./watch";

export class ThisEffect {

    
    constructor(
        public watchSubject: IonicModel | AnyIon | (IonicModel | AnyIon)[],
        public mutations: MutationRecord[]
    ) { }

    private cleanups?: (() => void)[]

    onCleanup(cleanUp: () => void) {
        if (!this.cleanups) {
            this.cleanups = [cleanUp]
            return;
        }
        this.cleanups.push(cleanUp)
    }
}

let currentEffect: ThisEffect | undefined;
let prevEffect: ThisEffect | undefined;

export function pushEffect(effect: ThisEffect) {
    prevEffect = currentEffect;
    currentEffect = effect;
}

export function popEffect() {
    currentEffect = prevEffect;
    prevEffect = undefined;
}

export function $thisEffect() {
    if (!currentEffect) throw new Error('$thisEffect can only be called synchronously within a reactive effect')
    return currentEffect;
}

export function runCleanups(effect: ThisEffect | undefined) {
    if (!effect) return;
    //@ts-expect-error readonly
    const cleanups = effect.cleanups
    if (!cleanups) return;
    for (const cleanUp of cleanups) {
        cleanUp()
    }
}