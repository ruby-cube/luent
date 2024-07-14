import { NodeEntity } from "./mX";

const allSlots: WeakSet<Slot> = new WeakSet()

export type Slot = () => NodeEntity[]


export function slot(slot: Slot) {
    allSlots.add(slot);
    return slot;
}

export function _mXSlot() {

}

export function isSlot(maybeSlot: any): maybeSlot is Slot {
    return allSlots.has(maybeSlot)
}