import { component, template, For, fromRoot, fromContext, fromGround, If, provideRoot, provideGround } from "@rue/luent";
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
   //    // 'file': (file = fromContext(FILES).get($fileID)) => (
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
   ], { preserve: true })

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

   // const $main = $Main.morphable('/home')
   const $main = $Main.Morphable(toPolymorphKey(window.location.pathname, $Main))
   // history.replaceState({ page: 'home' }, '', '/home')


   window.addEventListener('popstate', (e) => {
      console.log('popstate', e)
      console.log('history', window.location.pathname)
      $main.as(window.location.pathname, e.value?.input)
   })

   window.addEventListener('hashchange', (e) => {
      console.log('hashchange', e)
   })

   function routeTo(key: string, state?: { input: object }) {
      $main.as(key, state?.input)
      history.pushState(state ?? {}, "", key)
   }

   return (

      <>
         <div>
            {/* <$Main as={'peas'}></$Main> */}
            <div>up above</div>
            <$Main as={$main}></$Main>
         </div>
         <button on:click={e => routeTo('/home')}>Home</button>
         <button on:click={e => routeTo('/happy')}>Happy</button>
         <button on:click={e => routeTo('/peas')}>Two Peas</button>
         {/* <button on:click={e => $main.as('happy')}>Happy</button>
         <button on:click={e => $main.as('peas')}>Two Peas</button> */}
         {For(files, m => m, file =>
            <>
               <button on:click={e => routeTo('/file', { input: file })}>{file.name}</button>
               <button on:click={e => { $main.discard('/file', file); routeTo('/home') }}>[X]</button>
            </>
         )}
      </>
   )
}

function Home() {
   return (

      <>
         <h3>Tadaima</h3>
         <p>🏠</p>
      </>
   )
}

function Happy() {
   const $message = ion('hi')

   return (

      <>
         <h3>Heee</h3>
         <p>☺️</p>
         <input mu:value={$message}></input>
         <p>{$message}</p>
      </>
   )
}

function Peas() {
   return (

      <>
         <h3>Wanh-wah</h3>
         <p>🤢🤢</p>
      </>
   )
}

function Missing() {
   return (

      <>
         <h3>404</h3>
         <p>😩</p>
      </>
   )
}



function File(input: {
   file: { name: string }
}) {
   const { file } = input

   return (

      <>
         <h3>File:</h3>
         <p>{file.name}</p>
      </>
   )
}