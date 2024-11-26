import { AnyObject } from "@rue/types";
import { NodeEntity } from "../node/makeNode";
import { Component } from "../component/InternalComponent";


export function createDubiousNode<T extends AnyObject>(input: {
    standby?: (error: Error) => NodeEntity | NodeEntity[]
    setup?: () => T
    Slot: (o?: T) => NodeEntity | NodeEntity[]
}) {
    const { setup, Slot } = input;

    let output;
    try {
        output = Slot(setup?.())
    }
    catch (err) {
        if (input.standby){
            output = input.standby(err instanceof Error ? err : new Error(<string>err))
        }
        else {
            return undefined;
        }
    }
    finally {
        return Component(
            output
        )
    }
}

