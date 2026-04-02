import { template, createRoot } from "@rue/lumo"
import { asIonic, Ion, Ionic } from "@rue/quarky"

/* 
Tests:
- Ionic model: set shallow property reactivity
- Ionic model: extended methods
- style update: style object, transform property
- compiler derivation shorthand in styles object
*/


export function TestMoveBox() {
   const INCREMENT = 10

   const box = asIonic({ x: 0, y: 0 }, {
      reset() {
         this.x = 0;
         this.y = 0;
      },
      moveRight() {
         this.x += INCREMENT
      },
      moveLeft() {
         this.x -= INCREMENT
      },
      moveUp() {
         this.y -= INCREMENT
      },
      moveDown() {
         this.y += INCREMENT
      }
   })

   return template(
      <div data-test={JSON.stringify({ "INCREMENT": INCREMENT })}>
         <div style='display: grid; width: 100%; height: 500px; place-items: center'>
            <div id='box' style={{ backgroundColor: "#53D0F6", width: '50px', height: '50px', transform: (`translate(${box.x}px, ${box.y}px)`) }}></div>
         </div>
         <hr></hr>
         <div style="text-align: center">
            <button style='width: 2em' on:click={e => box.moveUp()}>^</button>
            <br />
            <button style='width: 2em' on:click={e => box.moveLeft()}>{'<'}</button>
            <button style='width: 2em' on:click={e => box.reset()}>o</button>
            <button style='width: 2em' on:click={e => box.moveRight()}>{'>'}</button>
            <br />
            <button style='width: 2em' on:click={e => box.moveDown()}>V</button>
         </div>
      </div>
   )
}

if (__TEST__) createRoot(TestMoveBox).mount('#root')