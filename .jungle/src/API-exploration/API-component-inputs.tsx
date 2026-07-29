//@ts-nocheck
import { Component, template } from "luent";
import { Ion } from "@luent/quarky";
import { isFunction } from "@luent/utils";

// TODO:
// [ ] validation and normalization
// [ ] 


export function Component(input: {
   'mu?:value': Ion<string>
   'mu:count': Ion<number>
   'mu:item': Ionic<{ name: string }>
   details: Ionic<{ address: string }>
   start: number
}) {
   const { mu, details, start } = input
   const { $: { value, count }, item } = mu

   const { mu: { $value: $input, $count, item }, details, start, $value } = input

   return Component(
      <></>
   )
}

// FUNCTIONS AS DERIVATION IONS? ... basically what watchers receive

