import { EqualTypes, typeTest } from "../../dev/type-test";
import { PendingOp } from "../../flask/PendingOp";
<<<<<<< HEAD
import { $lifetime, $tilStop, ActiveListener, Callback, OneTimeTargetedListener, SustainedTargetedListener } from "../../flask/flaskedListeners";
=======
import { $lifetime, $tilStop, ActiveListener, Callback, OneTimeTargetedListener, SustainedTargetedListener } from "../../flask/flask";
>>>>>>> main
import { useEventListener } from "../event-listeners";


{//CASE: No config
    const onMouseDown = useEventListener("mousedown");
    typeTest<EqualTypes<typeof onMouseDown, SustainedTargetedListener<EventTarget, (ctx: Event) => unknown>>>(true);

    // CASE: mouse event, no options
    onMouseDown(document, (e) => {
        typeTest<EqualTypes<typeof e, MouseEvent>>(true);
    })

    // CASE: $lifetime option
    const listener = onMouseDown(document, (e) => {
    }, { $lifetime })
    typeTest<EqualTypes<typeof listener, ActiveListener>>(true);

    {    // CASE: $tilStop option
        const listener = onMouseDown(document, (e) => {
        }, { $tilStop })
        typeTest<EqualTypes<typeof listener, ActiveListener>>(true);
    }

    {    // CASE: event listener options, no listener options
        const listener = onMouseDown(document, (e) => {
        }, { capture: true })
        typeTest<EqualTypes<typeof listener, ActiveListener>>(true);
    }

    {    // CASE: once option
        const pendingOp = onMouseDown(document, (e) => {
            return 9;
        }, { once: true })
        typeTest<EqualTypes<typeof pendingOp, PendingOp<number>>>(true);
    }

    {    // CASE: unlessCanceled option
        const onMouseUp = useEventListener("mouseup");
        const pendingOp = onMouseDown(document, (e) => {
            return 9;
        }, { unlessCanceled: (cancel) => onMouseUp(document, cancel) })
        typeTest<EqualTypes<typeof pendingOp, PendingOp<number>>>(true);
    }

    {    // CASE: unlessCanceled option, malformed--must return PendingCancelOp
        onMouseDown(document, (e) => {
            return 9;
            //@ts-expect-error
        }, { unlessCanceled: () => onMouseUp })
    }

    {    // CASE: unlessCanceled option, malformed type
        onMouseDown(document, (e) => {
            return 9;
            //@ts-expect-error
        }, { unlessCanceled: true })
    }

    {    // CASE: sustain option
        const listener = onMouseDown(document, (e) => {
        }, { sustain: true })
        typeTest<EqualTypes<typeof listener, ActiveListener>>(true);
    }

    {    // CASE: until option

        const onMouseUp = useEventListener("mouseup")
        const listener = onMouseDown(document, (e) => {
        }, { until(stop) { onMouseUp(document, stop) } })
        typeTest<EqualTypes<typeof listener, ActiveListener>>(true);
    }

    {    // CASE: until option, malformed type
        onMouseDown(document, (e) => {
            //@ts-expect-error
        }, { until: true })
    }

    {    // CASE: until option, malformed--parameter missing
        //@ts-expect-error
        onMouseDown(document, (e) => {
        }, { until: () => { } })
    }

}

{//CASE: Once as default 
    const onMouseDown = useEventListener("beforeinput")
    // typeTest<EqualTypes<typeof onMouseDown, OneTimeTargetedListener<EventTarget, (ctx: Event) => unknown>>>(true);

    // CASE: input event
    onMouseDown(document, (e) => {
        typeTest<EqualTypes<typeof e, InputEvent>>(true);
    })

    // CASE: $lifetime option
    const listener = onMouseDown(document, (e) => {
    }, { $lifetime })
    typeTest<EqualTypes<typeof listener, ActiveListener>>(true);

    {    // CASE: $tilStop option
        const listener = onMouseDown(document, (e) => {
        }, { $tilStop })
        typeTest<EqualTypes<typeof listener, ActiveListener>>(true);
    }

    {    // CASE: event listener options, no listener options
        const listener = onMouseDown(document, (e) => {
        }, { capture: true })
        typeTest<EqualTypes<typeof listener, ActiveListener>>(true);
    }

    {    // CASE: once option
        const pendingOp = onMouseDown(document, (e) => {
            return 9;
        }, { once: true })
        typeTest<EqualTypes<typeof pendingOp, PendingOp<number>>>(true);
    }

    {    // CASE: unlessCanceled option
        const onMouseUp = useEventListener("mouseup");
        const pendingOp = onMouseDown(document, (e) => {
            return 9;
        }, { unlessCanceled: (cancel) => onMouseUp(document, cancel) })
        typeTest<EqualTypes<typeof pendingOp, PendingOp<number>>>(true);
    }

    {    // CASE: unlessCanceled option, malformed--must return PendingCancelOp
        onMouseDown(document, (e) => {
            return 9;
            //@ts-expect-error
        }, { unlessCanceled: () => onMouseUp })
    }

    {    // CASE: unlessCanceled option, malformed type
        onMouseDown(document, (e) => {
            return 9;
            //@ts-expect-error
        }, { unlessCanceled: true })
    }

    {    // CASE: sustain option
        const listener = onMouseDown(document, (e) => {
        }, { sustain: true })
        typeTest<EqualTypes<typeof listener, ActiveListener>>(true);
    }

    {    // CASE: until option

        const onMouseUp = useEventListener("mouseup")
        const listener = onMouseDown(document, (e) => {
        }, { until(stop) { onMouseUp(document, stop) } })
        typeTest<EqualTypes<typeof listener, ActiveListener>>(true);
    }

    {    // CASE: until option, malformed type
        onMouseDown(document, (e) => {
            //@ts-expect-error
        }, { until: true })
    }

    {    // CASE: until option, malformed--parameter missing
        //@ts-expect-error
        onMouseDown(document, (e) => {
        }, { until: () => { } })
    }
}