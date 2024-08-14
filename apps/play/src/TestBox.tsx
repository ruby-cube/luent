import { beforeMount, NodeRef } from "@rue/lumo";
import {  $, initializeEffect, toDeepReactive, toSignal } from "@rue/muonic";


//tests:
//- reactivity of nested object

export function TextBox() {

    const box$ = toDeepReactive({
        position: {
            x: 0,
            y: 0
        }
    })

    const $count = toSignal(0);
    
    function moveRight() {
            box$.position.x = box$.position.x + 10;
    }

    function moveLeft() {
            box$.position.x = box$.position.x - 10;
    }

    const divRef = new NodeRef()
    const $anotherCount = $(() => $count())
    initializeEffect(() => {
        $anotherCount()
    })

    // beforeMount(()=>{
    //     initializeEffect(() => {
    //         divRef.o.style.transform = `translate(${box$.position.x}px)`
    //         console.log("running effect!!!", divRef.o.style.transform)
    //     }, {phase: 'render'})
    // })

    // const $positionX = $(() => box$.position.x)


    return (
        <>
            <div ref={divRef} style={[
                'background-color: lightgray',
                o => {
                    o.transform = `translate(${box$.position.x}px)`
                }
            ]}>I'm a box</div>
            <button onclick={moveRight}>moveRight</button>
            <button onclick={moveLeft}>moveLeft</button>
        </>
    )
}