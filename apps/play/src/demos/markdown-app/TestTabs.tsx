import { component, For, If } from "@rue/lumo";
import { MarkdownApp } from "./markdown-app";
import { AtomicIon, ion, ionize } from "@rue/quarky";

export function TabApp() {
   const data = ionize(
      [{ id: 0, markdown: '# Sunny Day' }, { id: 2, markdown: '# Hola' }, { id: 3, markdown: '# Does this work?' }]
   )

   // const data = ionize({ id: 0, markdown: '# Sunny Day' })
   const $active = ion(true, {
      toggle() {
         $active.state = !$active()
      }
   })
   const $open = ion(true, {
      toggle() {
         $open.state = !$open()
      }
   })
   const $markdown = ion('# Something Special')

   return component(
      <>
         <button on:click={$open.toggle}>open</button>
         <button on:click={$active.toggle}>toggle</button>
         {/* {For(data, item => item.id, (item) => (
            <MarkdownApp nu:markdown={ions(item).$markdown}></MarkdownApp>
         ))} */}
         {
         If($open, 'create', 
         If($active, 'mount',
            <MarkdownApp nu:markdown={$markdown}></MarkdownApp>
            // <MarkdownApp nu:markdown={ions(data).$markdown}></MarkdownApp>
         )
         )
         }
      </>
   )
}

function ions<T>(model: T): Ions<T> {
   return model as Ions<T>
}

type Ions<T> = {
   [K in keyof T as K extends string ? `$${K}` : K]: AtomicIon<T[K]>
}

function Sidebar() {

}

function Tabs() {

}

function MainView() {

}
