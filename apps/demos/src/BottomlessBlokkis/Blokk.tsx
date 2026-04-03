import { For, FromTag, HandleEvent, template } from "@rue/luent";
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
   const { matrix, ærotation, æshiftX, æshiftY, æcolor = ion('#564747'), gap = 1, emit } = setup

   const GRID_SIZE = CELL_SIZE * 4 + gap * 3;

   const ætranslate = () => `translate(${æshiftX() * CELL_SIZE}px, ${æshiftY() * CELL_SIZE}px)`
   const ærotate = () => `rotate(${degrees[ærotation()]}deg)`

   return template(
      <div class='blokk-base' style={(`
            --background-color: ${æcolor()};
            --cell-size: ${CELL_SIZE}px;
            --grid-size: ${GRID_SIZE}px;
            --grid-gap: ${gap}px;
            transform: ${ætranslate()} ${ærotate()};
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