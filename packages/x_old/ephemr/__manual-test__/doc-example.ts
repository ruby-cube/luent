import { spawnArcher } from "../archer/spawnArcher_x";
import { createHook } from "../../pecherie/Hook";
import { $type } from "../../types";
import { stateRef } from "../State";

const [castInsertText, onInsertText ] = createHook();

function setup(props) {
 
    const visibility = stateRef({
        id: "visibility",
        initial: "visible",
        states: {
            visible(state) {
                state.canBecomeAny();
                state.canBecomeAnyOther();
                state.canBecome("invisible");
                onInsertText(state.$willBecome("translucent"))
            },
            translucent(sate) {

            },
            invisible(state) {

            },
        }
    })

    function reClickBtn() {
        // do stuff;
        visibility.$becomes("invisible")
    }

}


