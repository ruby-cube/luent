import { NodeEntity } from "./mx";

const allSlots: WeakSet<Slot> = new WeakSet()

export type Slot = () => NodeEntity[]


export function slot(slot: Slot) {
    allSlots.add(slot);
    return slot;
}

export function mxSlot() {

}

export function isSlot(maybeSlot: any): maybeSlot is Slot {
    return allSlots.has(maybeSlot)
}