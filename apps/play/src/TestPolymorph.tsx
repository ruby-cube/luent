import { component, For, fromTag } from "@rue/lumo";
import { Polymorph } from "../../../packages/lumo/src/conditional/Polymorph";

type File = { name: string }
export function TestPolymorph() {
   const files = [{ name: 'kermit' }, { name: 'sir robin' }, { name: '(the brave)' }]
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
      'file': (file: File) => (
         <File file={file} />
      )
   })

   const $main = $Main.morphable('home')

   return component(
      <>
         <div>
            {/* <$Main as={'peas'}></$Main> */}
            <$Main as={$main}></$Main>
         </div>
         <button on:click={e => $main.as('home')}>Home</button>
         <button on:click={e => $main.as('happy')}>Happy</button>
         <button on:click={e => $main.as('peas')}>Two Peas</button>
         {For(files, file => 
            <button on:click={e => $main.as('file', file)}>{file.name}</button>
         )}
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

function File(input = fromTag<{ file: { name: string } }>()) {
   const { file } = input

   return component(
      <>
         <h3>File:</h3>
         <p>{file.name}</p>
      </>
   )
}