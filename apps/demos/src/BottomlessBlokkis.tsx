import { getFlask } from "@rue/flask";
import { atDiscard, atMount, atUnmount, createRoot, For, FromTag, If, template } from "@rue/lumo";
import { instantUpdate, Interval, Ion, Ionic, queueTask } from "@rue/quarky";
import { As } from "../../../packages/lumo/src/conditional/As";

type Rotation = 0 | 1 | 2 | 3

const BOARD_COLUMNS = 20
const BOARD_ROWS = 20

export function BottomlessBlokkis() {

    const $blokk = Ion(createBlokk(), {
        next() {
            this.value = createBlokk()
        }
    })

    function createBlokk() {
        return Ionic(new BlokkState(randomShape(), BOARD_COLUMNS / 2 - 2, randomRotation()))
    }

    function randomShape() {
        const index = Math.abs(Math.floor(Math.random() * shapes.length - 1))
        return shapes[index]
    }

    function randomRotation() {
        return Math.floor(Math.random() * 4) as Rotation;
    }

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
            $blokk.next()
            return;
        }
        blokk.moveDown()
    }

    function rotate() {
        const blokk = $blokk()
        if (!blokk) return;
        blokk.rotate()
    }

    function isFlushRight(blokk: BlokkState) {
        return blokk.rightEdge === BOARD_COLUMNS
    }

    function isBottomedOut(blokk: BlokkState) {
        return blokk.topEdge === BOARD_ROWS
    }

    function isFlushLeft(blokk: BlokkState) {
        return blokk.leftEdge === 0
    }

    return template(
        <div class='container'>
            <div class='header'>
                <h1>Bottomless Blokkis</h1>
                The game where you never win or lose
            </div>
            <div class='board'>
                {As($blokk,
                    <Blokk
                        at:create={dropBlock()}
                        blokk={$blokk()}
                    ></Blokk>
                )}
            </div>
            <div class='console'>
                <div class='move-btn-group'>
                    <button class='rotate-btn' on:click={rotate}>{`R`}</button>
                    <button class='move-left' on:click={moveLeft}>{`<`}</button>
                    <button class='move-right' on:click={moveRight}>{`>`}</button>
                    <button class='move-down' on:click={moveDown}>{`v`}</button>
                </div>
            </div>
        </div>
    )
        .css`
            body {
                font-family: 'Avenir Next';
                display: flex;
                margin: 0;
                min-height: 100vh;
                background-color: white;
                justify-content: center;
            }

            button {
                padding: 1em;
                width: 4em;
                height: 4em;
            }

            .move-btn-group {
                display: grid;
                grid-template-columns: 1fr 1fr 1fr;
                grid-template-rows: auto auto;
                gap: 0.5em;
                width: 8em;
                height: 8em;
            }

            .move-left { 
                grid-column: 1; 
                grid-row: 1; 
                justify-self: start; 
            }
            .move-right { 
                grid-column: 3; 
                grid-row: 1; 
                justify-self: end; 
            }
            .move-down { 
                grid-column: 2; 
                grid-row: 2; 
                justify-self: center; 
            }

            .rotate-btn {
                border-radius: 50%;
                border: 0px solid
            }

            .header {
                position: absolute;
                left: 0;
                right: 0;
                background-color: white;
                padding: 0px 1em;
            }

            .container {
                display: flex;
                flex-direction: column;
                min-height: 100vh;
                box-sizing: border-box;
                background-color: grey;
                z-index: 99
            }

            .board {
                display: grid;
                grid-template-columns: repeat(${BOARD_COLUMNS}, ${CELL_SIZE}px);
                grid-template-rows: repeat(${BOARD_ROWS}, ${CELL_SIZE}px);
                position: relative;
                z-index: 1;
                background-color: pink;
            }
                
            .console {
                display: grid;
                position: relative;
                z-index: 2;
                background-color: gray;
                flex-grow: 1;
                align-items: center;
                justify-items: center;
            }
        `
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

const degrees = [0, 270, 180, 90] as const

class BlokkState {
    public shiftY: number

    constructor(
        public matrix: (0 | 1)[][],
        public shiftX: number,
        public rotation: Rotation
    ) {
        this.shiftY = this.computeInitialShiftY(rotation)
    }

    moveDown() {
        this.shiftY++
    }

    moveRight() {
        this.shiftX++
    }

    moveLeft() {
        this.shiftX--
    }

    rotate() {
        const newRotation = ((this.rotation + 1) % 4) as Rotation;
        const bounds = this.getOccupiedBounds(newRotation);
        const minShiftX = -bounds.minC;
        const maxShiftX = BOARD_COLUMNS - (bounds.maxC + 1);
        this.shiftX = Math.min(Math.max(this.shiftX, minShiftX), maxShiftX);
        this.rotation = newRotation;
    }

    // # adjustments since not all shapes are flush to edge of base grid
    get rightEdge() {
        const b = this.getOccupiedBounds(this.rotation)
        return this.shiftX + (b.maxC + 1)
    }

    get leftEdge() {
        const b = this.getOccupiedBounds(this.rotation)
        return this.shiftX + b.minC
    }

    get topEdge() {
        const b = this.getOccupiedBounds(this.rotation)
        return this.shiftY + b.minR
    }

    get bottomEdge() {
        const b = this.getOccupiedBounds(this.rotation)
        return this.shiftY + (b.maxR + 1)
    }

    computeInitialShiftY(rotation: Rotation) {
        // Use the shared rotation-aware bounds helper to avoid duplicated logic.
        const b = this.getOccupiedBounds(rotation);
        // place so bottom-most filled cell's bottom is at y=0
        return -(b.maxR + 1);
    }

    getOccupiedBounds(rotation: Rotation) {
        const { matrix } = this
        const N = matrix.length;
        const stepsMap = [0, 3, 2, 1] as const;
        const steps = stepsMap[rotation];

        let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
        for (let r = 0; r < N; r++) {
            for (let c = 0; c < N; c++) {
                if (!matrix[r][c]) continue;
                let newR: number, newC: number;
                if (steps === 0) { newR = r; newC = c; }
                else if (steps === 1) { newR = c; newC = (N - 1) - r; }
                else if (steps === 2) { newR = (N - 1) - r; newC = (N - 1) - c; }
                else /* steps === 3 */ { newR = (N - 1) - c; newC = r; }

                if (newR < minR) minR = newR;
                if (newR > maxR) maxR = newR;
                if (newC < minC) minC = newC;
                if (newC > maxC) maxC = newC;
            }
        }

        // If no filled cells, return full bounds
        if (minR === Infinity) return { minR: 0, maxR: N - 1, minC: 0, maxC: N - 1 };
        return { minR, maxR, minC, maxC };
    }
}

const GAP = 1;
const CELL_SIZE = 20;


function Blokk(setup: FromTag<{
    blokk: Ionic<BlokkState>
}>) {
    const { blokk } = setup

    const GRID_SIZE = CELL_SIZE * 4 + GAP * 3;

    const $translate = () => `translate(${blokk.shiftX * CELL_SIZE}px, ${blokk.shiftY * CELL_SIZE}px)`
    const $rotate = () => `rotate(${degrees[blokk.rotation]}deg)`

    return template(
        <div class='blokk-base' style={{
            'transform': (`${$translate()} ${$rotate()}`),
        }}>
            {For(blokk.matrix, row =>
                For(row, col => (
                    <div class={`blokk-cell ${(col ? 'filled' : '')}`}></div>
                ))
            )}
        </div>
    )
        .css`
            .blokk-base {
                width: ${GRID_SIZE}px;
                height: ${GRID_SIZE}px;
                display: grid;
                grid-gap: ${GAP}px;
                grid-template-columns: repeat(4, 1fr);
                grid-template-rows: repeat(4, 1fr);
                // background-color: #eee;
            }

            .blokk-cell {
                width: ${CELL_SIZE}px;
                height: ${CELL_SIZE}px;
            }
            
            .blokk-cell.filled {
                background-color: #aaa;
            }
        `
}

if (__STYLE__)
    createRoot(() =>
        <BottomlessBlokkis></BottomlessBlokkis>
    ).mount('#root')

