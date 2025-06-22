import { component } from "@rue/lumo";
import { Polymorph } from "../../../packages/lumo/src/conditional/Polymorph";


export function TestPolymorph() {
   const $Main = Polymorph({
      'home': () => (
         <Home></Home>
      ),
      'happy': () => (
         <Happy></Happy>
      ),
      'peas': () => (
         <Peas></Peas>
      ),

   })

   const $main = $Main.morphable('home')

   return component(
      <>
         <div>
            <$Main as={$main}></$Main>
         </div>
         <button on:click={e => $main.as('home')}>Home</button>
         <button on:click={e => $main.as('happy')}>Happy</button>
         <button on:click={e => $main.as('peas')}>Two Peas</button>

      </>
   )
}

function Home() {
   return component(
      <>
         <h3>Tadaima</h3>
         <p>🏠</p>
      </>
   )
}
function Happy() {
   return component(
      <>
         <h3>Heee</h3>
         <p>☺️</p>
      </>
   )
}
function Peas() {
   return component(
      <>
         <h3>Wanh-wah</h3>
         <p>🤢🤢</p>
      </>
   )
}