import { For, FromTag, HandleEvent, template } from "@rue/lumo";
import { Ion, Ionic } from "@rue/quarky";
import "./Blokk.css"

export const CELL_SIZE = 20;

const degrees = [0, 270, 180, 90] as const

export function Blokk(setup: FromTag<{
    matrix: (1 | 0)[][],
    shiftX: Ion<number>,
    shiftY: Ion<number>,
    rotation: Ion<number>,
    color?: Ion<string>,
    gap?: number
}>) {
    const { matrix, ørotation, øshiftX, øshiftY, øcolor = Ion('#564747'), gap = 1, emit } = setup

    const GRID_SIZE = CELL_SIZE * 4 + gap * 3;

    const $translate = () => `translate(${øshiftX() * CELL_SIZE}px, ${øshiftY() * CELL_SIZE}px)`
    const $rotate = () => `rotate(${degrees[ørotation()]}deg)`

    return template(
        <div class='blokk-base' style={(`
            --background-color: ${øcolor()};
            --cell-size: ${CELL_SIZE}px;
            --grid-size: ${GRID_SIZE}px;
            --grid-gap: ${gap}px;
            transform: ${$translate()} ${$rotate()};
        `)}
            on:mouseenter={e => { console.log('ENTER'); emit('mouseenter', e) }}
            on:mouseleave={e => { console.log('LEAVE'); emit('mouseleave', e) }}
        >
            {For(matrix, row =>
                For(row, col => (
                    <div class={`blokk-cell ${col ? 'filled' : ''}`}></div>
                ))
            )}
        </div>
    )
}