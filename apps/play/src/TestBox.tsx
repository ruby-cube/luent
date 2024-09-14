import { $Node, mx } from "@rue/lumo";
import {  $, $initializeEffect, o$$, $Signal } from "@rue/muonic";


//tests:
//- reactivity of nested object

export function TestBox() {

    const box$ = o$$({
        position: {
            x: 0,
            y: 0
        }
    })

    const $count = $Signal(0);
    
    function moveRight() {
            box$.position.x = box$.position.x + 10;
    }

    function moveLeft() {
            box$.position.x = box$.position.x - 10;
    }

    const $div = $Node()
    const $anotherCount = $(() => $count())
    $initializeEffect(() => {
        $anotherCount()
    })

    // beforeMount(()=>{
    //     $initializeEffect(() => {
    //         divRef.o.style.transform = `translate(${box$.position.x}px)`
    //         console.log("running effect!!!", divRef.o.style.transform)
    //     }, {phase: 'render'})
    // })

    // const $positionX = $(() => box$.position.x)


    return mx(
        <>
            <div ref={$div} style={[
                'background-color: lightgray',
                o => {
                    o.transform = `translate(${box$.position.x}px)`
                }
            ]}>I'm a box</div>
            <button onclick={moveLeft}>moveLeft</button>
            <button onclick={moveRight}>moveRight</button>
        </>
    )
}