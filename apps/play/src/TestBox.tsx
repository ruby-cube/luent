//@ts-nocheck
import { NodeRef, Try, } from "@rue/lumo";
import { DerivedIon, initializeIonicEffect, Ion, ionize } from "@rue/quarky";


//tests:
//- reactivity of nested object

export function TestBox() {

    const box$ = ionize({
        position: {
            x: 0,
            y: 0
        }
    })

    const $count = Ion(0);

    function moveRight() {
        box$.position.x = box$.position.x + 10;
    }

    function moveLeft() {
        box$.position.x = box$.position.x - 10;
    }

    const $div = NodeRef('div')
    const $anotherCount = DerivedIon(() => $count())
    initializeIonicEffect(() => {
        $anotherCount()
    })

    // beforeMount(()=>{
    //     initializeIonicEffect(() => {
    //         divRef.o.style.transform = `translate(${box$.position.x}px)`
    //         console.log("running effect!!!", divRef.o.style.transform)
    //     }, {phase: Phase.RENDER})
    // })

    // const $positionX = $(() => box$.position.x)


    return (
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

function Hello() {
    return (
        <div>
            {Try(
                <div>hello</div>
            ).Catch(
                <div>error!</div>
            )}
        </div>
    )
}

function Catch(j: any) {

}