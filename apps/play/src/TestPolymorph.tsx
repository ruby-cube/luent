import { component, For, fromApp, fromCommons, fromGlobal, FromTag, provideAppwide, provideGlobal } from "@rue/lumo";
import { Morphable, Polymorph } from "../../../packages/lumo/src/conditional/Polymorph";
import { ion } from "@rue/quarky";
import "./style.css"

type File = { name: string }

export function TestPolymorph() {
   const files = [{ name: 'kermit' }, { name: 'sir robin' }, { name: '(the brave)' }]

   // const $Main = Polymorph({
   //    '/home': () => (
   //       <Home></Home>
   //    ),
   //    '/happy': () => (
   //       <Happy></Happy>
   //    ),
   //    '/peas': () => (
   //       <Peas></Peas>
   //    ),
   //    '/*': () => (
   //       <Missing></Missing>
   //    )
   //    // 'file': (file = fromCommons(FILES).get($fileID)) => (
   //    //    <File file={file} />
   //    // )
   // })

   const $Main = Polymorph([
      ['/home', () =>
         <Home></Home>
      ],
      ['/happy', () =>
         <Happy></Happy>
      ],
      ['/peas', () =>
         <Peas></Peas>
      ],
      // ['/*', () =>
      //    <Missing></Missing>
      // ]
      ['/file', (file: File) =>
         <File file={file} />
      ]
   ])

   const pathMap = {
      '/': '/home',
   }

   function toPolymorphKey(path: string, $Polymorph: { has: (key: string) => boolean }) {
      if ($Polymorph.has(path)) return path
      if (path in pathMap) return pathMap[path]
      return pathMatch(path)
   }

   function pathMatch(path: string) {

   }

   // - push url to history
   // - update $route input ions based on url
   // - get state based on route input values (may require fetching data)
   // - 

   const $main = $Main.morphable(toPolymorphKey(window.location.pathname, $Main))
   // history.replaceState({ page: 'home' }, '', '/home')



   window.addEventListener('popstate', (e) => {
      console.log('popstate', e)
      console.log('history', window.location.pathname)
      $main.as(window.location.pathname, e.state?.input)
   })

   window.addEventListener('hashchange', (e) => {
      console.log('hashchange', e)
   })

   return component(
      <>
         <div>
            {/* <$Main as={'peas'}></$Main> */}
            <$Main as={$main}></$Main>
         </div>
         <button on:click={e => { $main.as('/home'); history.pushState({}, "", '/home') }}>Home</button>
         <button on:click={e => { $main.as('/happy'); history.pushState({}, "", '/happy') }}>Happy</button>
         <button on:click={e => { $main.as('/peas'); history.pushState({}, "", '/peas') }}>Two Peas</button>
         {/* <button on:click={e => $main.as('happy')}>Happy</button>
         <button on:click={e => $main.as('peas')}>Two Peas</button> */}
         {For(files, file =>
            <>
               <button on:click={e => { $main.as('/file', file); history.pushState({ input: file }, "", '/file') }}>{file.name}</button>
               <button on:click={e => $main.discard('/file', file)}>[X]</button>
            </>
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
   const $message = ion('hi')

   return component(
      <>
         <h3>Heee</h3>
         <p>☺️</p>
         <input mu:value={$message}></input>
         <p>{$message}</p>
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

function Missing() {
   return component(
      <>
         <h3>404</h3>
         <p>😩</p>
      </>
   )
}



function File(input : FromTag<{
   file: { name: string }
}>) {
   const { file } = input



   return component(
      <>
         <h3>File:</h3>
         <p>{file.name}</p>
      </>
   )
}