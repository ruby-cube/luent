import { mx } from "@rue/lumo";

function PrePhase(){

    function clickOuterDivA(){
        console.log("CLICK outer A")
    }

    function clickInnerDivA(){
        console.log("CLICK inner A")
    }

    function clickOuterDivB(){
        console.log("CLICK outer B")
    }

    function clickInnerDivB(){
        console.log("CLICK inner B")
    }

    function mousedownOuterDiv(){
        console.log("DOWN outer")
    }

    function mousedownInnerDiv(){
        console.log("DOWN inner")
    }

    

    return mx(
        <div id="outer">
            <div id="inner"></div>
        </div>
    )
}