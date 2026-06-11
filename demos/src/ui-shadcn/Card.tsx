import { component, template } from "@rue/luent"
import { mergeTailwind } from "../utils/utils"

function Card({
   size = "default",
   $classes,
   ...attributes
}: {
   size?: "default" | "sm"
}) {

   return component(
      <div
         data-slot="card"
         data-size={size}
         class={(mergeTailwind(`ring-foreground/10 bg-card text-card-foreground gap-4 overflow-hidden rounded-xl py-4 text-sm ring-1 has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:gap-3 data-[size=sm]:py-3 data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl group/card flex flex-col`, $classes()))}
         {...attributes}
      ></div>
   )
}


function CardHeader(attributes: {}) {

   return component(
      <div
         data-slot="card-header"
         class={"gap-1 rounded-t-xl px-4 group-data-[size=sm]/card:px-3 [.border-b]:pb-4 group-data-[size=sm]/card:[.border-b]:pb-3 group/card-header @container/card-header grid auto-rows-min items-start has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto]"}
         {...attributes}
      ></div>
   )
}


function CardTitle({
   $classes,
   ...attributes
}: {}) {

   return component(
      <div
         data-slot="card-title"
         class={(mergeTailwind('text-base leading-snug font-medium group-data-[size=sm]/card:text-sm', $classes()))}
         {...attributes}
      ></div>
   )
}


function CardDescription(attributes: {}) {

   return component(
      <div
         data-slot="card-description"
         class={"text-muted-foreground text-sm"}
         {...attributes}
      ></div>
   )
}


function CardAction(attributes: {}) {

   return component(
      <div
         data-slot="card-action"
         class={"col-start-2 row-span-2 row-start-1 self-start justify-self-end"}
         {...attributes}
      ></div>
   )
}


function CardContent({
   $classes,
   ...attributes
}: {}) {

   return component(
      <div
         data-slot="card-content"
         // class={[$classes, 'px-4 group-data-[size=sm]/card:px-3']}
         class={(mergeTailwind('px-4 group-data-[size=sm]/card:px-3', $classes()))}
         {...attributes}
      ></div>
   )
}


function CardFooter({
   $classes,
   ...attributes
}: {}) {

   return component(
      <div
         data-slot="card-footer"
         // class={[$classes, 'bg-muted/50 rounded-b-xl border-t p-4 group-data-[size=sm]/card:p-3 flex items-center']}
         class={(mergeTailwind('bg-muted/50 rounded-b-xl border-t p-4 group-data-[size=sm]/card:p-3 flex items-center', $classes()))}
         {...attributes}
      ></div>
   )
}

export {
   Card,
   CardHeader,
   CardFooter,
   CardTitle,
   CardAction,
   CardDescription,
   CardContent,
}
