import { Component, For, FromTag, $from } from "@rue/luent";
import { Ion, ion } from "@rue/quarky";
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
   console.log('Blokk')
   const { matrix, $rotation, $shiftX, $shiftY, $color = ion('#564747'), gap = 1, emit } = $from(setup)

   const GRID_SIZE = CELL_SIZE * 4 + gap * 3;

   const $translate = () => `translate(${$shiftX() * CELL_SIZE}px, ${$shiftY() * CELL_SIZE}px)`
   const $rotate = () => `rotate(${degrees[$rotation()]}deg)`

   return Component(
      <div class='blokk-base' style={(`
            --background-color: ${$color()};
            --cell-size: ${CELL_SIZE}px;
            --grid-size: ${GRID_SIZE}px;
            --grid-gap: ${gap}px;
            transform: ${$translate()} ${$rotate()};
            `)}
         on:mouseenter={e => { console.log('ENTER'); emit.mouseenter?.(e) }}
         on:mouseleave={e => { console.log('LEAVE'); emit.mouseleave?.(e) }}
      >
         {For(matrix, row =>
            For(row, col => (
               <div class={`blokk-cell ${col ? 'filled' : ''}`}></div>
            ))
         )}
      </div>
   )
}