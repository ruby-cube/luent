import { AnyObject } from "@rue/types";
import { NodeEntity } from "../node/makeNode";
import { Component } from "../component/InternalComponent";

export type DubiousNodeInput = {
   standby?: (error: Error) => NodeEntity | NodeEntity[]
   Slot: () => NodeEntity | NodeEntity[]
}

export function createDubiousNode<T extends AnyObject>(input: DubiousNodeInput) {
    const { Slot } = input;

    let output;
    try {
        output = Slot()
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

