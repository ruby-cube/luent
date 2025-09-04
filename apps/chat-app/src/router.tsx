import { fromGlobal, Polymorph, provideGlobal } from "@rue/lumo"

export function Router(config: Parameters<typeof Polymorph>[0]) {

   const $View = Polymorph(config)

   const $route = $View.Morphable(window.location.pathname)

   window.addEventListener('popstate', (e) => {
      $route.as(window.location.pathname, e.state?.input)
   })

   function routeTo(key: string, state?: { input: object }) {
      $route.as(key, state?.input)
      history.pushState(state ?? {}, "", key)
   }


   provideGlobal('$route', () => $route())
   provideGlobal('routeTo', routeTo)

   return { $View, $route, routeTo }
}

export function useRouter() {
   return {
      get $route() { return fromGlobal('$route') },
      get routeTo() { return fromGlobal('routeTo') },
   }
}
