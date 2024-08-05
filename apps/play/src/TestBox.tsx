import { beforeMount, NodeRef } from "@rue/lumo";
import { useReactivity, initializeEffect } from "@rue/muonic";

const { o$$$, mu, $, set } = useReactivity();

//tests:
//- reactivity of nested object

export function TextBox() {

    const box$ = o$$$({
        position: {
            x: 0,
            y: 0
        }
    })

    const $count = $(0);
    function moveRight() {
        // set($count, count => count + 1)
        mu(box$, o => {
            o.position.x = o.position.x + 10;
        })
    }

    function moveLeft() {
        // set($count, count => count - 1)
        mu(box$, o => {
            o.position.x = o.position.x - 10;
        })
    }

    const divRef = new NodeRef()
const $anotherCount = $(()=>$count())
    initializeEffect(()=>{
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