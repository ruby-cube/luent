import { AnyObject } from "@rue/types";
import { NodeEntity } from "../node/makeNode";
import { Component } from "../component/InternalComponent";


export function Try<T extends AnyObject>(input: {
    catch?: (error: Error) => NodeEntity | NodeEntity[]
    setup?: () => T
    renderSlot: (o?: T) => NodeEntity | NodeEntity[]
}) {
    const { setup, renderSlot } = input;

    let output;
    try {
        output = renderSlot(setup?.())
    }
    catch (err) {
        output = input.catch?.(err instanceof Error ? err : new Error(<string>err))
    }
    finally {
        return Component(
            output
        )
    }
}

