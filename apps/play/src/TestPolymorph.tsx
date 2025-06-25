//@ts-nocheck
import { component, For, fromApp, fromCommons, fromGlobal, fromTag, provideAppwide, provideGlobal } from "@rue/lumo";
import { Polymorph } from "../../../packages/lumo/src/conditional/Polymorph";
import { ion, ionicTask } from "@rue/quarky";
import { watch } from "fs";
import { FILE } from "dns";

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
      'file': (file = fromCommons(FILES).get($fileID)) => (
         <File file={file} />
      )
   })

   // const $Sidebar = RouteView({ $user, $hash }, o =>
   //    [
   //       [route`/home/${o.user}${o.hash}`, ({ $user, $hash }) =>
   //          <>
   //             <Home>{hash}</Home>
   //             <p>Welcome, {user}</p>
   //          </>
   //       ]
   //    ])

   $route.input.$search

   const { $search } = fromRoute()

   const $Sidebar = RouteView([
      // [route`/home/${$user}?${{ search: $search, answer: $answer }}#${$section}`, () =>
      //    <>
      //       <Home>{$section}</Home>
      //       <p>Welcome, {$user}</p>
      //    </>
      // ],
      [route`/home/${$user}?search=${$search}&answer=${$answer}#${$section}`, r =>
         <>
            <Home>{$section}</Home>
            <p>Welcome, {$user}</p>
         </>
      ]
   ])

   const { $userID, $section } = $route.input
   const { $file } = $route.derived

   const USER_ROUTE = route`/user/${$user}`

   function wantIon(ion: Ion<string>) {

   }

   wantIon(null as Suspense<string>)


   function fetchFile(FILE, $userID: Ion<string>, $fileID: Ion<string>) {
      const $file = fromApp(FILE)
      if ($file) return $file;

      const $file = suspension($file => {
         const id = $userID() + $fileID()
         const existing = files.get(id)
         if (existing) $file.state = existing;
         else fetch(`http://${$userID()}/${$fileID()}`)
            .then(response => response.json())
            .then(value => {
               value
               files.set(id, value)
            })
      }, { awaitBoundary: '@boundary' })

      provideAppwide(FILE, $file)
      return $file;
   }


   const fetchFile = defineAppwide('$file', ($userID: Ion<string>, $fileID: Ion<string>) => {
      return suspense($file => {
         const id = $userID() + $fileID()
         const existing = files.get(id)
         if (existing) $file.state = existing;
         else fetch(`http://${$userID()}/${$fileID()}`)
            .then(response => response.json())
            .then(value => {
               value
               files.set(id, value)
            })
      }, { mustAwait: true })
   })


   const $Sidebar = RouteView([
      [route`/${$userID}#${$section}`, () =>
         <>
            <Home>{$section}</Home>
            <p>Welcome, {$user}</p>
         </>
      ],
      // with suspense // How do we tell if $file is synchronous or suspenseful? //TODO: Resolved type marker ResolvedIon<File>
      [route`/${$userID}/${$fileID}#${$section}`, {
         loading: () => (
            <Loading />
         ),
         timeout: 500,
         catch: err => (
            <div>{err}</div>
         ),
         render: () => (
            <File id={$fileID()} file={$file()} />
         ),
         preserve: true,
      }],
      // without suspense (if $file returns undefined) // type: Ion<File | undefined>
      [route`/${$userID}/${$fileID}`, {
         render: () => (
            <>
               {Await(($file = fetchFile($userID, $fileID)) =>
                  <File id={$fileID()} file={$file} />
               )}
               {Meanwhile({ timeout: 500 },
                  <Loading />
               )}
               {Catch(err =>
                  <div>{err}</div>
               )}
            </>
         ),
         preserve: true,
         beforeEnter() {

         },
         beforeLeave() {

         }
      }],
      [route`/${$userID}#${$section}`, {
         redirect: USER_ROUTE
      }],
      [USER_ROUTE, {
         render: () => (
            <User id={$user}></User>
         )
      }]
   ])

   // const $Main = Polymorph([
   //    ['home', () =>
   //       <Home></Home>
   //    ],
   //    ['happy', () =>
   //       <Happy></Happy>
   //    ],
   //    ['peas', () =>
   //       <Peas></Peas>
   //    ],
   //    ['file', (file: File) =>
   //       <File file={file} />
   //    ]
   // ])

   // - push url to history
   // - update $route input ions based on url
   // - get state based on route input values (may require fetching data)
   // - 


   function getfiles() {
      const $state = ion(undefined);

      ionicTask(w => {
         const res = await fetch(`files/${w($id)}`)
         res.json().then(v => $state.state = v)
      })

      return $state
   }

   const { $route, RouteView, $RouteView } = createRouter({
      input: {
         userID: {
            beforeViewRender(id) {
               // validate
            }
         },
         fileID: {
            beforeViewRender(id) {

            }
         },
         searchTerm: {

         },
         firstName: {

         },
         lastName: {

         }
      },
      routes: []
   }) // { $route, RouteView, $RouteView } optional $RouteView component if config passed into createRouter

   const { $route, RouteView } = getRouter() // calls `fromApp(ROUTER)` internally

   const $main = $Main.morphable('home')
   // history.replaceState({ page: 'home' }, '', '/home')

   const $route = {
      to: as,
      as
   }

   const $hash = ion('#chapter-1')

   $route.as`/ home#chapter - one`

   $route.to`/file/${file.id}`


   function as(...args: any[]) {
      history.replaceState({}, '', `/ home${$hash()}`)

      // console.log('array', args)
      // return `/ home${ $hash() }`
   }

   function route<T>(...args: T) {
      return args
   }


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
   const $message = ion('hi')

   return component(
      <>
         <h3>Heee</h3>
         <p>☺️</p>
         <input mu:value={$message}></input>
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

function File(input = fromTag<{
   file?: { name: string }
}>()) {
   const { file } = input

   return component(
      <>
         <h3>File:</h3>
         <p>{file.name}</p>
      </>
   )
}