import { component, For, FromTag } from "@rue/luent";
import { Ion, ion } from "@rue/quarky";
import "./Blokk.css"

export const CELL_SIZE = 20;

const degrees = [0, 270, 180, 90] as const

export function Blokk(setup: FromTag<'div', {
  matrix: (1 | 0)[][],
  shiftX: Ion<number>,
  shiftY: Ion<number>,
  rotation: Ion<number>,
  color?: Ion<string>,
  gap?: number
}>) {
  const { matrix, $rotation, $shiftX, $shiftY, $color = ion('#564747'), gap = 1, ...rest } = setup

  const GRID_SIZE = CELL_SIZE * 4 + gap * 3;

  const $translate = () => `translate(${$shiftX() * CELL_SIZE}px, ${$shiftY() * CELL_SIZE}px)`
  const $rotate = () => `rotate(${degrees[$rotation()]}deg)`

  return component(
    <div class='blokk-base' style={(`
        --background-color: ${$color()};
        --cell-size: ${CELL_SIZE}px;
        --grid-size: ${GRID_SIZE}px;
        --grid-gap: ${gap}px;
        transform: ${$translate()} ${$rotate()};
      `)}
    >
      {For(matrix, row =>
        For(row, col => (
          <div class={`blokk-cell ${col ? 'filled' : ''}`}
            auto-bind={col ? rest : undefined}
          ></div>
        ))
      )}
    </div>
  )
}