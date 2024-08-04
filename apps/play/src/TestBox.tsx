import { useReactivity } from "@rue/muonic";

const { o$$$, mu, $ } = useReactivity();

//tests:
//- reactivity of nested object

export function TextBox() {

    const box$ = o$$$({
        position: {
            x: 0,
            y: 0
        }
    })

    function moveRight() {
        mu(box$, o => {
            o.position.x = o.position.x + 1;
        })
    }

    function moveLeft() {
        mu(box$, o => {
            o.position.x = o.position.x - 1;
        })
    }


    return (
        <>
            <div>position x: {$(() => box$.position.x)}</div>
            <button onclick={moveRight}>moveRight</button>
            <button onclick={moveLeft}>moveLeft</button>
        </>
    )
}