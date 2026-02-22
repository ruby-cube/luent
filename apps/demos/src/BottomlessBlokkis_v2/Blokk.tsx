import { For, FromTag, template } from "@rue/lumo";
import { Ionic } from "@rue/quarky";
import { BlokkModel, Rotation } from "./BlokkModel";
import "./Blokk.css"
import { AnyObject } from "@rue/types";

const GAP = 1;
export const CELL_SIZE = 20;

const degrees = [0, 270, 180, 90] as const

export function Blokk({ shapes }: FromTag<{ shapes: (0 | 1)[][][] }>) {
    const blokk = Ionic(new BlokkModel(randomShape(), randomRotation()))

    function randomShape() {
        const index = Math.abs(Math.floor(Math.random() * shapes.length - 1))
        return shapes[index]
    }

    function randomRotation() {
        return Math.floor(Math.random() * 4) as Rotation;
    }

    const GRID_SIZE = CELL_SIZE * 4 + GAP * 3;

    const $translate = () => `translate(${blokk.shiftX * CELL_SIZE}px, ${blokk.shiftY * CELL_SIZE}px)`
    const $rotate = () => `rotate(${degrees[blokk.rotation]}deg)`

    return template(
        <div class='blokk-base' style={(`
            --cell-size: ${CELL_SIZE}px;
            --grid-size: ${GRID_SIZE}px;
            --grid-gap: ${GAP}px;
            transform: ${$translate()} ${$rotate()};
        `)}>
            {For(blokk.matrix, row =>
                For(row, col => (
                    <div class={`blokk-cell ${(col ? 'filled' : '')}`}></div>
                ))
            )}
        </div>
    )
        .ref(Ionic({
            // $rightEdge: blokk.$rightEdge,
            // $leftEdge: blokk.$leftEdge,
            // $topEdge: blokk.$topEdge,
        }, {
            initX: blokk.initX,
            moveRight: blokk.moveRight,
            moveLeft: blokk.moveLeft,
            moveDown: blokk.moveDown,
            rotate: blokk.rotate,
            // get rightEdge() { return blokk.rightEdge },
            // get leftEdge() { return blokk.leftEdge },
            // get topEdge() { return blokk.topEdge }
        }))
}






function bind<T, K extends keyof T>(obj: T, key: K): T[K] extends Function ? T[K] : never {
    //@ts-expect-error
    return obj[key].bind(obj)
}