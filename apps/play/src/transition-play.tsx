import { component } from "@rue/lumo";
import { fade } from "../../../packages/lumo/src/transition/transitions";

// fade-in-out with different transitions

function TransitionTest() {
    return component(
        <div>
            <div on:copy={() => { }}>
                <phasic-node both={fade}>
                    <p>hi</p>
                </phasic-node>
            </div>
        </div>
    )
}