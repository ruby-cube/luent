<<<<<<< HEAD
import { ActiveListener } from "../../flask/flaskableListeners";
import { sceneSetup } from "../../flask/Scene";
=======
import { ActiveListener } from "../../flask/flask";
import { beginScene } from "../../flask/Scene";
>>>>>>> main
import { useEventListener } from "../../lumo/src/element/event-listeners";


const onMouseDown = useEventListener("mousedown");
const onMouseLeave = useEventListener("mouseleave");
const onMouseEnter = useEventListener("mouseenter");
const onMouseUp = useEventListener("mouseup");
const onMouseMove = useEventListener("mousemove");
const onClick = useEventListener("click");

export async function reMouseDown(e: MouseEvent) {
    const scene = sceneSetup()
    const { target } = e;
    if (target === null) return;
    let action: "click" | "dragdrop" = "click";
    let mouseMoveListener: ActiveListener;


    onMouseLeave(target, () => {
        initDrag();
    }, { until: scene.onEnded })

    onMouseEnter(target, () => {
        stopDrag();
    }, { until: scene.onEnded })



    function initDrag() {
        action = "dragdrop"
        mouseMoveListener =
            onMouseMove(document, (e) => {
                console.log("moving object")
            }, { until: scene.onEnded })
    }

    function stopDrag() {
        action = "click"
        mouseMoveListener.stop();
    }


    await onMouseUp(document, (e) => {
        if (action === "dragdrop") {
            console.log("dropped object");
        }
        scene.end();
    });

    if (action === "click") {
        onClick(target, () => {
            console.log("clicked")
        }, { once: true })
    }
}

onMouseDown(document.getElementById("event-test")!, reMouseDown);