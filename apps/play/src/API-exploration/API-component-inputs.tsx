//@ts-nocheck
import { component, FromTag } from "@rue/lumo";
import { Ion } from "@rue/quarky";
import { isFunction } from "@rue/utils";

// TODO:
// [ ] validation and normalization
// [ ] 


export function Component(input: FromTag<{
   'mu?:value': Ion<string>
   'mu:count': Ion<number>
   'mu:item': Ionic<{ name: string }>
   details: Ionic<{ address: string }>
   start: number
}>) {
   const { mu, details, start } = input
   const { $: { value, count }, item } = mu

   const { mu: { $value: $input, $count, item }, details, start, $value } = input

   return component(
      <></>
   )
}

// FUNCTIONS AS DERIVATION IONS? ... basically what watchers receive

