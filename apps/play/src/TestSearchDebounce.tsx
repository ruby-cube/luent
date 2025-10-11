import { component, For, SuspenseIon } from "@rue/lumo";
import { Ion } from "@rue/quarky";
import { isObjectLiteral } from "@rue/utils";

type Article = { id: number, word: string }


export function TestSearchDebounce() {

   const $searchTerm = Ion('')

   const $articles = SuspenseIon([] as Article[], () => {
      return fetchArticles($searchTerm(), {debounce: 100})
   })

   return component(
      <>
         <input id='search' value={$searchTerm} on:input={(e) => $searchTerm.value = e.currentTarget!.value}></input>
         {For($articles, m => m.id, (article) =>
            <div>{article.word}</div>
         )}
      </>
   )
}


function Debounced<T extends (...args: any[]) => any>(ms: number, fn: T) {
   let id: NodeJS.Timeout;

   return (...args: Parameters<T>) => {
      if (id)
         clearTimeout(id)
      return new Promise<ReturnType<T>>(resolve => {
         id = setTimeout(() => {
            resolve(fn(...args))
         }, ms)
      }).then(res => res)
   }
}

function Debouncer() {
   let id: NodeJS.Timeout;
   return function debounce<T>(ms: number, fn: () => T): Promise<T> {
      if (id)
         clearTimeout(id)
      return new Promise<T>(resolve => {
         id = setTimeout(() => {
            resolve(fn())
         }, ms)
      })
   }
}

let _id = 0

// const debounce = Debouncer()

// function fetchArticles(searchTerm: string, options: { debounce: number }): Promise<{ id: number, word: string }[]> {
//    if (options?.debounce)
//       return debounce(options?.debounce, () => fetcher(searchTerm)).then(res => res)
//    else {
//       return fetcher(searchTerm)
//    }
// }

const fetchArticles = toDebounceable(fetcher)

function fetcher(searchTerm: string) {
   return new Promise<Article[]>(resolve =>
      setTimeout(() => resolve([{ id: _id++, word: searchTerm }]), 50)
   )
}

type MakeLastParamOptional<T extends (...args: any) => any> =
   T extends (...args: infer P) => infer R
   ? P extends [...infer Rest, infer Last]
   ? (...args: [...Rest, Last?]) => R
   : T // no params, leave as-is
   : never;

type DebounceOptionsFn = (options?: { debounce: number }) => any

type Debounceable<F extends (...args: any[]) => any> = F extends (...args: infer P) => infer R ? MakeLastParamOptional<(...args: [...P, ...Parameters<DebounceOptionsFn>]) => R> : never

function toDebounceable<F extends (...args: any[]) => any>(fn: F): Debounceable<F> {

   const debounce = Debouncer()

   function debounceable(...args: Parameters<F>): ReturnType<F> {
      const maybeOptions = args.at(-1)

      if (isObjectLiteral(maybeOptions) && maybeOptions.debounce)
         return debounce(maybeOptions.debounce, () => fn(...args)).then(res => res) as ReturnType<F>
      else {
         return fn(...args)
      }
   }

   return debounceable as unknown as Debounceable<F>
}


type LastParameter<T extends (...args: any) => any> =
   T extends (...args: infer P) => any
   ? P extends [...infer _, infer Last]
   ? Last
   : never
   : never;

type AllButLastParameter<T extends (...args: any) => any> =
   T extends (...args: infer P) => any
   ? P extends [...infer Params, infer _]
   ? Params
   : never
   : never;


// function fetcher(searchTerm: string) {
//    return new Promise<Article[]>(resolve =>
//       setTimeout(() => resolve([{ id: _id++, word: searchTerm }]), 50)
//    )
// }