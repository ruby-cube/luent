import { beforeUninstall, component, As } from "@rue/luent";
import { ionic, ion, Ionic } from "@rue/quarky";
import { Blokk, CELL_SIZE } from "./Blokk";
import { BlokkModel, makeBlokk, Rotation } from "./makeBlokk";
import './BottomlessBlokkis.css'


const BOARD_COLUMNS = 20
const BOARD_ROWS = 20

export function BottomlessBlokkis() {

  const $blokk = ion(createBlokk(), {
    next() {
      this.value = createBlokk()
    }
  })

  const BLOKK_COLOR = '#223344'
  const $blokkColor = ion(BLOKK_COLOR)

  function createBlokk() {
    return ionic(makeBlokk(randomShape(), BOARD_COLUMNS / 2 - 2, randomRotation()))
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
    beforeUninstall(() => clearInterval(id))
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
    while (blokk.rightEdge > BOARD_COLUMNS) {
      blokk.moveLeft()
    }
    while (blokk.leftEdge < 0) {
      blokk.moveRight()
    }
  }

  function isFlushRight(blokk: Ionic<BlokkModel>) {
    return blokk.rightEdge === BOARD_COLUMNS
  }

  function isBottomedOut(blokk: Ionic<BlokkModel>) {
    return blokk.topEdge === BOARD_ROWS
  }

  function isFlushLeft(blokk: Ionic<BlokkModel>) {
    return blokk.leftEdge === 0
  }

  return component(
    <div class='container'>
      <div class='header'>
        <h1>Bottomless Blokkis</h1>
        A game for contemplating the void
      </div>
      <div
        class='board'
        style={`
                    --board-columns: ${BOARD_COLUMNS};
                    --board-rows: ${BOARD_ROWS};
                    --cell-size: ${CELL_SIZE}px;
                `}
      >
        {As($blokk,
          <Blokk
            pre:install={dropBlock}
            matrix={$blokk()!.matrix}
            shiftX={($blokk()!.shiftX)}
            shiftY={($blokk()!.shiftY)}
            rotation={($blokk()!.rotation)}

            color={$blokkColor}
            gap={1}
            on:mouseenter={e => $blokkColor.value = 'red'}
            on:mouseleave={e => $blokkColor.value = BLOKK_COLOR}
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

