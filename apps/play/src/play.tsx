//@ts-nocheck

import { $else, $if } from "@rue/lumo";

function ListBlock() {

    // for if you don't want to track effect
    watchCases(
        $if($active, () => {
            $height() // <-- Will not be tracked
        }),
        $elseIf($bored, () => {

        }),
        $else(() => {

        })
    )

    // for if you want to track all reactives 
    initializeReactiveEffect(() => {
        if ($active() && $bored()) {
            $height() // tracked
        }
        else if ($bored()) {

        }
        else {

        }
    })
}
