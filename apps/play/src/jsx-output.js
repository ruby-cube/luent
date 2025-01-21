import { Fragment, jsx } from "/@fs/Users/Ruby/Desktop/ruby-cube/rue/packages/lumo/jsx-runtime/src/index.ts";
import { component, If, Else, ElseIf, slide, fromTag, v } from "/@fs/Users/Ruby/Desktop/ruby-cube/rue/packages/lumo/src/index.ts";
import { ion, ionize } from "/@fs/Users/Ruby/Desktop/ruby-cube/rue/packages/quarky/src/index.ts";
export function MountIf() {
   const $count = ion(0, {
      increment() {
         $count.state = $count() + 1;
      }
   });
   const $active = ion(true, {
      toggle() {
         $active.state = !$active();
      }
   });
   const $ready = ion(true, {
      toggle() {
         $ready.state = !$ready();
      }
   });
   const $isMobile = ion(false, {
      toggle() {
         $isMobile.state = !$isMobile();
      }
   });
   const todos = ionize([{
      name: "bubby"
   }]);
   const removed = todos.splice(0, 2);
   return component(
      [
         jsx("h1", {
            children: () => ["Hello ", todos[0]]
         }),
         jsx("$--transition", {
            children: () => [
               If($active, () =>
                  ["oh",
                     jsx("$--transit", {
                        with: slide({
                           x: -100,
                           duration: 2200
                        }),
                        children: () => [
                           jsx("h2", {
                              children: () => ["hi"]
                           })]
                     }),
                     jsx("$--transit", {
                        with: slide({
                           x: 100,
                           duration: 2200
                        }),
                        children: () => [
                           jsx("h2", {
                              children: () => ["hope"]
                           })]
                     }), If($ready, () => [
                        jsx("p", {
                           children: () => ["ready"]
                        })])]),
               ElseIf($ready, () =>
                  ["low",
                     jsx("h2", {
                        children: () => ["balloon"]
                     })]),
               Else(() =>
                  ["so",
                     jsx("h2", {
                        children: () => ["bye"]
                     })
                  ])
            ]
         }),
         jsx("button", {
            "on:click": function $$1() {
               return $active.toggle;
            },
            children: () => ["toggle active"]
         }),
         jsx("button", {
            "on:click": function $$2() {
               return $ready.toggle;
            },
            children: () => ["toggle ready"]
         })]);
}
