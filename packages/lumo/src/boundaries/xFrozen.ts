import { Component } from "../component/InternalComponent";
import { NodeEntity } from "../node/makeNode";

export type MorphConfig = {}

let isFrozen: boolean = false;

export function getFrozenState() {
    const frozen = isFrozen;
    isFrozen = false; // applies to only one conditional node. Once used, it is made undefined.
    return frozen
}

export function Frozen(input: {
    renderSlot: (() => NodeEntity | NodeEntity[]) | NodeEntity | NodeEntity[]
}) {
    const { renderSlot } = input
    if (!(renderSlot instanceof Function)) throw new Error('')

    isFrozen = true;
    const renderedTemplate = renderSlot();
    isFrozen = false;

    return Component(
        renderedTemplate
    )
}
