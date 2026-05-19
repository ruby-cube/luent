//@ts-nocheck
import { Component, template, fromGround } from "@rue/luent";
import { Polymorph } from "../../../../packages/luent/src/conditional/x_Polymorph";

// A: We provide route parameters via context and tag
// B: We allow access to a global route ion where you can access route parameters


//QUESTION: Do we need to distinguish path parameters, query parameters, and hash? They feel different

declare global {
   function getRouter(): typeof router
}

const SITE_POLICY = 'site-policy'

const something = [
   {
      name: SITE_POLICY,
      path: '/site-policy/*'
   },
   {
      name: USER_HOMEPAGE,
      path: '/{username?}',
      filter: { username: u => /[A-Z]/.test(u) },
      nested: [
         {
            name: USER_DOCUMENT,
            path: '/{docID}',
         }
      ]
   }
] as const

function createRouter<const T>(routes: T) {
   return routes
}

const router = createRouter([
   {
      name: SITE_POLICY,
      path: '/site-policy/*'
   },
   {
      name: USER_HOMEPAGE,
      path: '/{username?}',
      filter: { username: u => /[A-Z]/.test(u) },
      nested: [
         {
            name: USER_DOCUMENT,
            path: '/{docID}',
         }
      ]
   }
])
// as { $route, createRouteView, $RouteView }

// [ ] named routes
// [ ] filters
// 

function withParams<T>(...args: T): T extends [strings[], `${infer A}`] ? A : never {
   return args;
}



const $RouteView = createRouteView([
   [SITE_POLICY, () =>
      <SitePolicy></SitePolicy>
   ],
])


$route.to(SITE_POLICY)



function numbersOnly(str: string) {
   return /\d+/.test(str)
}

export function SomeChild() {

   const $searchTerm = ion('')

   $route.path.username
   $route.query.username
   $route.query.search
   $route.hash


   function search() {


      $route.navigate`/u/${$username()}/search/?${$route.query}&search=${$searchTerm()}#${$section()}`

      $route.navigate`/${$username()}/search/?${{
         search: $searchTerm()
      }}`



      $route.navigate`#about`

      $route.navigate({
         hash: 'about'
      })

      $route.to({
         query: {
            search: $searchTerm
         }
      })

      $route.to('search', {
         query: {
            search: $searchTerm()
         }
      })

   }

   return Component(
      <div>
         <input mu:value={$searchTerm} />
         <button on:click={search}>SEARCH</button>
      </div>
   )
}


// PREVIOUSLY


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



      const $route = {
         to: as,
         as
      }
   
      const $hash = ion('#chapter-1')
   
      $route.as(`/home#chapter-one`)
   
      $route.navigate(`/file/${file.id}`)
   
   
      function as(...args: any[]) {
         history.replaceState({}, '', `/ home${$hash()}`)
   
         // console.log('array', args)
         // return `/ home${ $hash() }`
      }
   
      function route<T>(...args: T) {
         return args
      }


      
         function getfiles() {
            const $state = ion(undefined);
      
            queueIonicTask(() => {
               const res = await fetch(`files/${$id()}`)
               res.json().then(v => $state.value = v)
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
      
         const { $route, RouteView } = getRouter() // calls `fromGround(ROUTER)` internally
      


            const fetchFile = defineAppwide('$file', ($userID: Ion<string>, $fileID: Ion<string>) => {
               return createSuspenseIon($file => {
                  const api = `/${$userID()}/${$fileID()}`
                  const cached = files.get(api)
                  if (cached) $file.value = cached; // or let browser cache it!
                  else fetch(api)
                     .then(response => response.json())
                     .then(value => {
                        value
                        files.set(api, value) // cache it
                     })
               }, { awaited: true })
            })
         
         
            const $Sidebar = RouteView([
               [route`/${$userID}#${$section}`, () =>
                  <>
                     <Home>{$section}</Home>
                     <p>Welcome, {$user}</p>
                  </>
               ],
               // with suspense // How do we tell if $file is synchronous or suspenseful? // TODO: Resolved type marker ResolvedIon<File>
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
                           If($file,
                              <File id={$fileID()} file={$file} />)
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