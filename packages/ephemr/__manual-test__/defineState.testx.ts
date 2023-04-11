import { D } from "vitest/dist/types-5872e574";
import { onUnmounted, Ref, ref } from "vue";
import { r, r$ } from "../../paravue/reactivity";
import { useEventListener } from "../../thread/event-listeners";
import { $type, Cast, Consolidate } from "../../types";
import { defineState } from "../defineState";
import { StateRef, stateRef } from "../State";


const onClick = useEventListener("click");

export const Location = defineState({
    id: "location",
    initial: "outside",
    states: {
        outside(state, ctx) {
            onClick(ctx.insideBtn.value, state.$willBecome("inside"));
        },
        inside(state, ctx) {
            ctx.insideBtn
            onClick(ctx.outsideBtn.value, state.$willBecome("outside"))
        }
    },
    context: $type as {
        insideBtn: Ref<Node>,
        outsideBtn: Ref<Node>,
    }
})


const insideBtn = ref(document.createElement("button"))
const outsideBtn = ref(document.createElement("button"))

const walkingBtn = ref(document.createElement("button"))
const runningBtn = ref(document.createElement("button"))
const sniffingBtn = ref(document.createElement("button"))



const location = stateRef(Location, {
    insideBtn,
    outsideBtn,
})

export const OutdoorActivity = defineState({
    id: "outdoor",
    precondition: (ctx) => [[ctx.location, "outside"]],
    initial: (context) => (context.happy ? "sniffing" : "walking"),
    states: {
        walking(state, ctx) {
            onClick(r(ctx.runningBtn), state.$willBecome("running"))
            onClick(r(ctx.sniffingBtn), state.$willBecome("sniffing"))
        },
        running(state, ctx) {
            onClick(r(ctx.walkingBtn), state.$willBecome("walking"))
            onClick(r(ctx.sniffingBtn), state.$willBecome("sniffing"))
        },
        sniffing(state, ctx) {
            onClick(r(ctx.runningBtn), state.$willBecome("running"))
            onClick(r(ctx.walkingBtn), state.$willBecome("walking"))
        }
    },
    context: $type as {
        location: StateRef;
        happy: boolean;
        walkingBtn: Ref<Node>;
        runningBtn: Ref<Node>;
        sniffingBtn: Ref<Node>;
    }
})



const outdoorActivity = stateRef(OutdoorActivity, {
    happy: true,
    location,
    runningBtn,
    sniffingBtn,
    walkingBtn
});