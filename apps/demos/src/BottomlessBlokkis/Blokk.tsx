import { For, FromTag, template } from "@rue/lumo";
import { Ion, Ionic } from "@rue/quarky";
import "./Blokk.css"

const GAP = 1;
export const CELL_SIZE = 20;

const degrees = [0, 270, 180, 90] as const

export function Blokk(setup: FromTag<{
    matrix: (1|0)[][],
    shiftX: Ion<number>,
    shiftY: Ion<number>,
    rotation: Ion<number>
}>) {
    const { matrix, $rotation, $shiftX, $shiftY } = setup

    const GRID_SIZE = CELL_SIZE * 4 + GAP * 3;

    const $translate = () => `translate(${$shiftX() * CELL_SIZE}px, ${$shiftY() * CELL_SIZE}px)`
    const $rotate = () => `rotate(${degrees[$rotation()]}deg)`

    return template(
        <div class='blokk-base' style={(`
            --cell-size: ${CELL_SIZE}px;
            --grid-size: ${GRID_SIZE}px;
            --grid-gap: ${GAP}px;
            transform: ${$translate()} ${$rotate()};
        `)}>
            {For(matrix, row =>
                For(row, col => (
                    <div class={`blokk-cell ${(col ? 'filled' : '')}`}></div>
                ))
            )}
        </div>
    )
}