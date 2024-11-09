import { Component } from "@rue/lumo";
import { fade } from "../../../packages/lumo/src/transition/transitions";

// fade-in-out with different transitions

//NOTE: each sort of transition needs to be registered in the type definitions...
// each colon attribute needs to be in type defs too...


function TransitionTest() {
    return Component(
        <div>
            <div on:copy={() => { }}>
                <phase-change both={fade}>
                    <p>hi</p>
                </phase-change>
            </div>
        </div>
    )
}