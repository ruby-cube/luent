//@ts-nocheck
import { Booleanny } from "@rue/types"
import { AnyIon } from "../ion/Ion"
import { watch } from "./watch"





watchIf($active, () => {


}).elseIf($ready, () => {


}).else(() => {


}, { until: _this.onDiscard })

watchConditional([
    if_($active, () => {

    }),
    elseIf_($ready, () => {

    }),
    else_(() => {

    })
], { until: _this.onDiscard })

const $frogName = asIon($frog, 'name')

watch([$active, $ready, $frogName], () => {
    if ($active() && $frog.name) {
        $frog.name
    }
    else if ($ready()) {

    }
    else {

    }
}, { until: _this.onDiscard })

const $frogName = asIon($frog, 'name')

watchEffect(() => {
    if ($active(X) && $frogName(X)) {

    }
    else if ($ready(X)) {

    }
    else {

    }
}, {
    only: [X, $frog],
    // also: [$frog],
    until: _this.onDiscard
})