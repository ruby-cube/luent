import { component, atDiscard, ComponentRef, createRoot, NodeRef, template } from "@rue/luent";
import { ion } from "@rue/quarky";
import { As } from "../../../../packages/luent/src/conditional/As";
import { Blokk, CELL_SIZE } from "./Blokk";
import './BottomlessBlokkis.css'

const BOARD_COLUMNS = 20
const BOARD_ROWS = 20
const BLOKK_GRID = 4

export function BottomlessBlokkis() {

    const $activeBlokk = ion(0, {
        next() {
            this.value = ($activeBlokk() + 1) % 2;
        }
    })

    const $blokk = NodeRef(Blokk)

    function dropBlock() {
        const id = setInterval(moveDown, 1000)
        atDiscard(() => clearInterval(id))
    }

    function moveRight() {
        const blokk = $blokk()
        if (!blokk || isFlushRight(blokk)) return;
        blokk.moveRight()
    }

    function moveLeft() {
        const blokk = $blokk()
        if (!blokk || isFlushLeft(blokk)) return;
        blokk.moveLeft()
    }

    function moveDown() {
        const blokk = $blokk()
        if (!blokk) return;
        if (isBottomedOut(blokk)) {
            $activeBlokk.next()
            return;
        }
        blokk.moveDown()
    }

    function rotate() {
        const blokk = $blokk()
        if (!blokk) return;
        blokk.rotate()
        while (blokk.rightEdge > BOARD_COLUMNS) {
            blokk.moveLeft()
        }
        while (blokk.leftEdge < 0) {
            blokk.moveRight()
        }
    }

    function isFlushRight(blokk: ComponentRef<typeof Blokk>) {
        return blokk.rightEdge === BOARD_COLUMNS
    }

    function isBottomedOut(blokk: ComponentRef<typeof Blokk>) {
        return blokk.topEdge === BOARD_ROWS
    }

    function isFlushLeft(blokk: ComponentRef<typeof Blokk>) {
        return blokk.leftEdge === 0
    }

    return component(
        <div class='container'>
            <div class='header'>
                <h1>Bottomless Blokkis</h1>
                ... where you can never win or lose
            </div>
            <div class='board' style={`
                --board-columns: ${BOARD_COLUMNS};
                --board-rows: ${BOARD_ROWS};
                --cell-size: ${CELL_SIZE}px;
            `}>
                {As($activeBlokk,
                    <Blokk
                        at:mount={dropBlock()}
                        ref={$blokk}
                        shapes={shapes}
                        initialX={BOARD_COLUMNS / 2 - BLOKK_GRID / 2}
                    ></Blokk>
                )}
            </div>
            <div class='console'>
                <div class='console-btns'>
                    <button class='rotate-btn' on:click={rotate}>⟲</button>
                    <button class='move-left' on:click={moveLeft}>{`◀`}</button>
                    <button class='move-right' on:click={moveRight}>{`▶`}</button>
                    <button class='move-down' on:click={moveDown}>{`▼`}</button>
                </div>
            </div>
        </div>
    )
}

const shapes: (0 | 1)[][][] = [
    // s
    [
        [0, 0, 0, 0],
        [0, 0, 1, 1],
        [0, 1, 1, 0],
        [0, 0, 0, 0]
    ],
    // o
    [
        [0, 0, 0, 0],
        [0, 1, 1, 0],
        [0, 1, 1, 0],
        [0, 0, 0, 0]
    ],
    // z
    [
        [0, 0, 0, 0],
        [1, 1, 0, 0],
        [0, 1, 1, 0],
        [0, 0, 0, 0]
    ],
    // l
    [
        [0, 0, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 1, 0]
    ],
    // L
    [
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 1, 0],
        [0, 0, 0, 0]
    ],
    // J
    [
        [0, 0, 1, 0],
        [0, 0, 1, 0],
        [0, 1, 1, 0],
        [0, 0, 0, 0]
    ],
    // T
    [
        [0, 0, 0, 0],
        [1, 1, 1, 0],
        [0, 1, 0, 0],
        [0, 0, 0, 0]
    ]
]




// if (__STYLE__)
//     createRoot(() =>
//         <BottomlessBlokkis></BottomlessBlokkis>
//     ).mount('#root')

