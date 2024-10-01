//@ts-nocheck

import { Else, If } from "@rue/lumo";

function ListBlock() {

    // for if you don't want to track effect
    watchCases(
        If($active, () => {
            $height() // <-- Will not be tracked
        }),
        ElseIf($bored, () => {

        }),
        Else(() => {

        })
    )

    // for if you want to track all reactives 
    initializeIonicEffect(() => {
        if ($active() && $bored()) {
            $height() // tracked
        }
        else if ($bored()) {

        }
        else {

        }
    })
}
