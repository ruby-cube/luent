import { jsxDEV } from "/@fs/Users/Ruby/Desktop/ruby-cube/rue/packages/lumo/jsx-runtime/src/index.ts";
import { component, If, Else, ElseIf } from "/@fs/Users/Ruby/Desktop/ruby-cube/rue/packages/lumo/src/index.ts";
import { ion, ionize } from "/@fs/Users/Ruby/Desktop/ruby-cube/rue/packages/quarky/src/index.ts";
export function MountIf() {
   const $count = ion(0, {
      increment() {
         $count.value = $count() + 1;
      }
   });
   const list = ionize({
      count: 0,
      increment(value) {
         return this.count = this.count + value;
      }
   });
   const $active = ion(false, {
      toggle() {
         $active.value = !$active();
      }
   });
   const $ready = ion(false, {
      toggle() {
         $ready.value = !$ready();
      }
   });
   const $isMobile = ion(false, {
      toggle() {
         $isMobile.value = !$isMobile();
      }
   });
   const todos = ionize([{
      name: "bubby",
      date: 0
   }]);
   const $color = ion("lim", {
      change() {
         if ($color() === "lim")
            $color.value = "blu";
         else
            $color.value = "lim";
      }
   });
   return component(
      [
         jsxDEV("button", {
            "on:click": () => ($color.change(),
               todos[0].name += "!"),
            style: {
               color: function $drv10() {
                  return $color() + "e";
               }
            },
            children: () => ["shout"]
         }, void 0, false, {
            fileName: "/Users/Ruby/Desktop/ruby-cube/rue/apps/play/src/TestMountIf.tsx",
            lineNumber: 58,
            columnNumber: 4
         }, this),
         jsxDEV("h1", {
            children: () => ["Hello ", function $drv11() {
               return todos[0].name;
            }
            ]
         }, void 0, false, {
            fileName: "/Users/Ruby/Desktop/ruby-cube/rue/apps/play/src/TestMountIf.tsx",
            lineNumber: 62,
            columnNumber: 34
         }, this),
         jsxDEV("div", {
            children: () => ["hi"]
         }, void 0, false, {
            fileName: "/Users/Ruby/Desktop/ruby-cube/rue/apps/play/src/TestMountIf.tsx",
            lineNumber: 64,
            columnNumber: 15
         }, this),
         $$series(
            If($active, () => [
               "oh",
               jsxDEV("h2", {
                  children: () => ["hi"]
               }, void 0, false, {
                  fileName: "/Users/Ruby/Desktop/ruby-cube/rue/apps/play/src/TestMountIf.tsx",
                  lineNumber: 64,
                  columnNumber: 76
               }, this),
               jsxDEV("h2", {
                  children: () => ["hope"]
               }, void 0, false, {
                  fileName: "/Users/Ruby/Desktop/ruby-cube/rue/apps/play/src/TestMountIf.tsx",
                  lineNumber: 64,
                  columnNumber: 101
               }, this),
               $$series(
                  If($ready, () => [
                     jsxDEV("p", {
                        children: () => ["ready"]
                     }, void 0, false, {
                        fileName: "/Users/Ruby/Desktop/ruby-cube/rue/apps/play/src/TestMountIf.tsx",
                        lineNumber: 64,
                        columnNumber: 155
                     }, this)])
               )
            ]), ElseIf($ready, () => [
               "low",
               jsxDEV("h2", {
                  children: () => ["balloon"]
               }, void 0, false, {
                  fileName: "/Users/Ruby/Desktop/ruby-cube/rue/apps/play/src/TestMountIf.tsx",
                  lineNumber: 64,
                  columnNumber: 215
               }, this)]), Else(() => ["so",
                  jsxDEV("h2", {
                     children: () => ["bye"]
                  }, void 0, false, {
                     fileName: "/Users/Ruby/Desktop/ruby-cube/rue/apps/play/src/TestMountIf.tsx",
                     lineNumber: 64,
                     columnNumber: 265
                  }, this)])),
         jsxDEV("button", {
            "on:click": $active.toggle,
            children: () => ["toggle active"]
         }, void 0, false, {
            fileName: "/Users/Ruby/Desktop/ruby-cube/rue/apps/play/src/TestMountIf.tsx",
            lineNumber: 64,
            columnNumber: 294
         }, this),
         jsxDEV("button", {
            "on:click": $ready.toggle,
            children: () => ["toggle ready"]
         }, void 0, false, {
            fileName: "/Users/Ruby/Desktop/ruby-cube/rue/apps/play/src/TestMountIf.tsx",
            lineNumber: 64,
            columnNumber: 364
         }, this)]);
}
function CounterKit() {
   return {
      $count: ion(0)
   };
}
function ArticleBlock(setup) { }

//# sourceMappingURL=data:application/json;base64,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RUEsU0FBU3VCLGFBQWFDLE9BR25CO0FBRUgiLCJuYW1lcyI6WyJjb21wb25lbnQiLCJJZiIsIkVsc2UiLCJFbHNlSWYiLCJpb24iLCJpb25pemUiLCJNb3VudElmIiwiJGNvdW50IiwiaW5jcmVtZW50Iiwic3RhdGUiLCJsaXN0IiwiY291bnQiLCJ2YWx1ZSIsIiRhY3RpdmUiLCJ0b2dnbGUiLCIkcmVhZHkiLCIkaXNNb2JpbGUiLCJ0b2RvcyIsIm5hbWUiLCJkYXRlIiwiJGNvbG9yIiwiY2hhbmdlIiwiY29sb3IiLCIkZHJ2MTAiLCIkZHJ2MTEiLCIkJHNlcmllcyIsIkNvdW50ZXJLaXQiLCJBcnRpY2xlQmxvY2siLCJzZXR1cCJdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJUZXN0TW91bnRJZi50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgY29tcG9uZW50LCBJZiwgRWxzZSwgZmFkZSwgRWxzZUlmLCBzbGlkZSB9IGZyb20gXCJAcnVlL2x1bW9cIjtcbmltcG9ydCB7IGRlYnVnLCBpb24sIGlvbml6ZSwgd2F0Y2ggfSBmcm9tIFwiQHJ1ZS9xdWFya3lcIjtcbmltcG9ydCB7IEFueU9iamVjdCB9IGZyb20gXCJAcnVlL3R5cGVzXCI7XG5cblxuZXhwb3J0IGZ1bmN0aW9uIE1vdW50SWYoKSB7XG4gICBjb25zdCAkY291bnQgPSBpb24oMCwge1xuICAgICAgaW5jcmVtZW50KCkge1xuICAgICAgICAgJGNvdW50LnN0YXRlID0gJGNvdW50KCkgKyAxXG4gICAgICB9XG4gICB9KVxuXG4gICBjb25zdCBsaXN0ID0gaW9uaXplKHtcbiAgICAgIGNvdW50OiAwLFxuICAgICAgaW5jcmVtZW50KHZhbHVlOiBudW1iZXIpIHtcbiAgICAgICAgIHJldHVybiB0aGlzLmNvdW50ID0gdGhpcy5jb3VudCArIHZhbHVlXG4gICAgICB9XG4gICB9KVxuXG4gICBjb25zdCAkYWN0aXZlID0gaW9uKGZhbHNlLCB7XG4gICAgICB0b2dnbGUoKSB7XG4gICAgICAgICAkYWN0aXZlLnN0YXRlID0gISRhY3RpdmUoKVxuICAgICAgfVxuICAgfSlcblxuICAgY29uc3QgJHJlYWR5ID0gaW9uKGZhbHNlLCB7XG4gICAgICB0b2dnbGUoKSB7XG4gICAgICAgICAkcmVhZHkuc3RhdGUgPSAhJHJlYWR5KClcbiAgICAgIH1cbiAgIH0pXG5cbiAgIGNvbnN0ICRpc01vYmlsZSA9IGlvbihmYWxzZSwge1xuICAgICAgdG9nZ2xlKCkge1xuICAgICAgICAgJGlzTW9iaWxlLnN0YXRlID0gISRpc01vYmlsZSgpXG4gICAgICB9XG4gICB9KVxuXG4gICBjb25zdCB0b2RvcyA9IGlvbml6ZShbeyBuYW1lOiAnYnViYnknLCBkYXRlOiAwIH1dIGFzIHsgbmFtZTogc3RyaW5nLCBkYXRlOiBudW1iZXIgfVtdKVxuXG4gICAvLyBjb25zdCByZW1vdmVkID0gdG9kb3Muc3BsaWNlKDAsIDIpXG5cbiAgIC8vIGZ1bmN0aW9uICRoaSgpIHtcbiAgIC8vIHJldHVybiBcIlwiXG4gICAvLyB9XG4gICBjb25zdCAkY29sb3IgPSBpb24oJ2xpbScsIHtcbiAgICAgIGNoYW5nZSgpIHtcbiAgICAgICAgIGlmICgkY29sb3IoKSA9PT0gJ2xpbScpXG4gICAgICAgICAgICAkY29sb3Iuc3RhdGUgPSAnYmx1J1xuICAgICAgICAgZWxzZVxuICAgICAgICAgICAgJGNvbG9yLnN0YXRlID0gJ2xpbSdcbiAgICAgIH1cbiAgIH0pXG5cbiAgIC8vIHdhdGNoKCRjb2xvciwgKCk9PntcbiAgIC8vICAgIGRlYnVnLnRyYWNlQXN5bmNQYXRoKClcbiAgIC8vIH0pXG4gICAvL05PVEU6IGlmIG8tLXRyYW5zaXQgZHVyYXRpb24gaXMgc2hvcnRlciB0aGFuIG8tLXRyYW5zaXRpb24gZHVyYXRpb24sIGl0IHdpbGwgZGlzYWJsZSBvLS10cmFuc2l0aW9uIHRyYW5zaXRpb25cbiAgIHJldHVybiBjb21wb25lbnQoXG4gICAgICAvLyA8ZGl2PlxuICAgICAgLy8gICAgPGRpdj5oaTwvZGl2PlxuICAgICAgLy8gICAgPGRpdj5ieWU8L2Rpdj5cbiAgICAgIC8vIDwvZGl2PlxuICAgICAgPD5cbiAgICAgICAgIHsvKiA8YnV0dG9uIG9uOmNsaWNrPXsoKSA9PiAoJGNvbG9yLmNoYW5nZSgpLCB0b2Rvc1swXS5uYW1lICs9ICchJyl9IHN0eWxlPXt7IGNvbG9yOiAnbGltZScgfX0+c2hvdXQ8L2J1dHRvbj4gKi99XG4gICAgICAgICA8YnV0dG9uIG9uOmNsaWNrPXsoKSA9PiAoJGNvbG9yLmNoYW5nZSgpLCB0b2Rvc1swXS5uYW1lICs9ICchJyl9IHN0eWxlPXt7IGNvbG9yOiAoJGNvbG9yKCkgKyAnZScpIH19PnNob3V0PC9idXR0b24+XG4gICAgICAgICA8aDE+SGVsbG8geyh0b2Rvc1swXS5uYW1lKX08L2gxPlxuICAgICAgICAgPGRpdj5oaTwvZGl2PlxuICAgICAgICAgey8qIDxvLS10cmFuc2l0aW9uPiAqL31cbiAgICAgICAgICAgIHtJZigkYWN0aXZlLCAoZGVidWcudHJhY2VBc3luY1BhdGgoKSxcbiAgICAgICAgICAgICAgIDw+XG4gICAgICAgICAgICAgICAgICBvaFxuICAgICAgICAgICAgICAgICAgey8qIDxvLS10cmFuc2l0IHdpdGg9e3NsaWRlKHsgeDogLTEwMCwgZHVyYXRpb246IDIyMDAgfSl9PiAqL31cbiAgICAgICAgICAgICAgICAgICAgIDxoMj5oaTwvaDI+XG4gICAgICAgICAgICAgICAgICB7LyogPC9vLS10cmFuc2l0PiAqL31cbiAgICAgICAgICAgICAgICAgIHsvKiA8by0tdHJhbnNpdCB3aXRoPXtzbGlkZSh7IHg6IDEwMCwgZHVyYXRpb246IDIyMDAgfSl9PiAqL31cbiAgICAgICAgICAgICAgICAgICAgIDxoMj5ob3BlPC9oMj5cbiAgICAgICAgICAgICAgICAgIHsvKiA8L28tLXRyYW5zaXQ+ICovfVxuICAgICAgICAgICAgICAgICAge0lmKCRyZWFkeSxcbiAgICAgICAgICAgICAgICAgICAgIDxwPnJlYWR5PC9wPlxuICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgIDwvPlxuICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICB7RWxzZUlmKCRyZWFkeSxcbiAgICAgICAgICAgICAgIDw+XG4gICAgICAgICAgICAgICAgICBsb3dcbiAgICAgICAgICAgICAgICAgIDxoMj5iYWxsb29uPC9oMj5cbiAgICAgICAgICAgICAgIDwvPlxuICAgICAgICAgICAgKX1cbiAgICAgICAgICAgIHtFbHNlKFxuICAgICAgICAgICAgICAgPD5cbiAgICAgICAgICAgICAgICAgIHNvXG4gICAgICAgICAgICAgICAgICA8aDI+YnllPC9oMj5cbiAgICAgICAgICAgICAgIDwvPlxuICAgICAgICAgICAgKX1cbiAgICAgICAgIHsvKiA8L28tLXRyYW5zaXRpb24+ICovfVxuICAgICAgICAgPGJ1dHRvbiBvbjpjbGljaz17JGFjdGl2ZS50b2dnbGV9PnRvZ2dsZSBhY3RpdmU8L2J1dHRvbj5cbiAgICAgICAgIDxidXR0b24gb246Y2xpY2s9eyRyZWFkeS50b2dnbGV9PnRvZ2dsZSByZWFkeTwvYnV0dG9uPlxuICAgICAgICAgey8qIDxDaGlsZCBkb2ctc2xlZD17JGNvbG9yKCkgKyAnZCd9IG9uOmluY3JlbWVudGNsaWNrPXtlID0+IHsgb3BlbigpOyAkYWN0aXZlLnRvZ2dsZSgpfX0+PC9DaGlsZD4gKi99XG4gICAgICA8Lz5cbiAgIClcbn1cblxuXG4vLyBmdW5jdGlvbiBDaGlsZChpbnB1dCA9IGZyb21UYWcoe1xuLy8gICAgJ206ZnJvZ1dlbGwnOiBJb248c3RyaW5nPixcbi8vICAgICdkb2ctc2xlZCc6IElvbjxzdHJpbmc+LFxuLy8gICAgU2xvdDogdjxzdHJpbmc+KCc/JyksXG4vLyAgICAnb246aW5jcmVtZW50Y2xpY2snOiBPbkV2ZW50XG4vLyB9KSkge1xuLy8gICAgY29uc3Qge1Nsb3QsIGVtaXQgfSA9IGlucHV0XG5cbi8vICAgIHJldHVybiBjb21wb25lbnQoXG4vLyAgICAgICA8ZGl2PmNoaWxkPC9kaXY+XG4vLyAgICApXG4vLyB9XG5cbi8vIGZ1bmN0aW9uIENvdW50ZXJCdXR0b24oaW5wdXQgPSBmcm9tVGFnKHtcbi8vICAgIC8vIFNsb3Q6IHY8KCkgPT4gYW55Pixcbi8vICAgICckOmluY3JlbWVudCc6IHY8KCkgPT4gdm9pZD5cbi8vIH0pKSB7XG4vLyAgICAvLyBjb25zdCB7IFNsb3QgfSA9IGlucHV0O1xuLy8gICAgcmV0dXJuIGNvbXBvbmVudChcbi8vICAgICAgICcnXG4vLyAgICAgICAvLyBTbG90KClcbi8vICAgIClcbi8vIH1cblxuLy8gZnVuY3Rpb24gRGlzcGxheUNhcmQoeyBpZCwgdGl0bGUsIGRlc2NyaXB0aW9uIH0pIHtcbi8vICAgICAvLyBzZXR1cCBsb2dpYyBoZXJlLi4uXG4vLyAgICAgZnVuY3Rpb24gc2VsZWN0KCkge1xuXG4vLyAgICAgfVxuXG4vLyAgICAgcmV0dXJuIGNvbXBvbmVudChcbi8vICAgICAgICAgPGRpdiBvbjpjbGljaz17ZSA9PiB7IGlmIChlLnRhcmdldHMoJ3gtc2VsZWN0JykpIHNlbGVjdCgpIH19PlxuLy8gICAgICAgICAgICAgPHAgeC1zZWxlY3Q+e3RpdGxlfTwvcD5cbi8vICAgICAgICAgICAgIDxwIGNvbnRlbnRlZGl0YWJsZT57ZGVzY3JpcHRpb259PC9wPlxuLy8gICAgICAgICAgICAgPGJ1dHRvbiBvbjpjbGljaz17ZSA9PiBvcGVuKGlkKX0+b3BlbjwvYnV0dG9uPlxuLy8gICAgICAgICAgICAgPEFydGljbGVCbG9jayBTbG90S2l0PXtDb3VudGVyS2l0fT57byA9PlxuLy8gICAgICAgICAgICAgICAgIDxwPntvLmZyb2d9PC9wPlxuLy8gICAgICAgICAgICAgfTwvQXJ0aWNsZUJsb2NrPlxuLy8gICAgICAgICA8L2Rpdj5cbi8vICAgICApXG4vLyB9XG5cbi8vIGZ1bmN0aW9uIERpc3BsYXlDYXJkQih7IGlkLCB0aXRsZSwgZGVzY3JpcHRpb24gfSkge1xuLy8gICAgIC8vIHNldHVwIGxvZ2ljIGhlcmUuLi5cbi8vICAgICBmdW5jdGlvbiBzZWxlY3QoKSB7XG5cbi8vICAgICB9XG5cbi8vICAgICByZXR1cm4gY29tcG9uZW50KFxuLy8gICAgICAgICA8ZGl2IG9uOmNsaWNrPXsneC1zZWxlY3QnLCBlID0+IHsgaWYgKGUudGFyZ2V0cygneC1zZWxlY3QnKSkgc2VsZWN0KCkgfX0+XG4vLyAgICAgICAgICAgICA8cCB4LXNlbGVjdD57dGl0bGV9PC9wPlxuLy8gICAgICAgICAgICAgPHAgY29udGVudGVkaXRhYmxlPntkZXNjcmlwdGlvbn08L3A+XG4vLyAgICAgICAgICAgICA8YnV0dG9uIG9uOmNsaWNrPXtlID0+IG9wZW4oaWQpfT5vcGVuPC9idXR0b24+XG4vLyAgICAgICAgICAgICA8QXJ0aWNsZUJsb2NrIFNsb3RLaXQ9e0NvdW50ZXJLaXR9PntvID0+XG4vLyAgICAgICAgICAgICAgICAgPHA+e28uZnJvZ308L3A+XG4vLyAgICAgICAgICAgICB9PC9BcnRpY2xlQmxvY2s+XG4vLyAgICAgICAgIDwvZGl2PlxuLy8gICAgIClcbi8vIH1cblxuZnVuY3Rpb24gQ291bnRlcktpdCgpIHtcbiAgIHJldHVybiB7XG4gICAgICAkY291bnQ6IGlvbigwKVxuICAgfVxufVxuXG5mdW5jdGlvbiBBcnRpY2xlQmxvY2soc2V0dXA6IHtcbiAgIFNsb3Q6IChzZXR1cDogeyBmcm9nOiBzdHJpbmcgfSkgPT4gYW55O1xuICAgU2xvdEtpdDogdHlwZW9mIENvdW50ZXJLaXQgLy9UT0RPOiBhdXRvIGFkZCBSZXR1cm5UeXBlIG9mIFNsb3RLaXQgdG8gc2V0dXAgcHJvcHNcbn0pIHtcblxufVxuLy8gZnVuY3Rpb24gQ291bnRlcigpIHtcbi8vICAgICBjb25zdCBfdGhpcyA9ICR0aGlzQ29tcG9uZW50KClcbi8vICAgICBjb25zdCAkY291bnQgPSBpb24oMClcblxuLy8gICAgIGNvbnN0ICRidXR0b24gPSBOb2RlUmVmKCdidXR0b24nKVxuLy8gICAgIGNvbnN0ICRjb3VudERpdiA9IE5vZGVSZWYoJ2RpdicpXG5cbi8vICAgICAvLyBvbk5vZGVzQ3JlYXRlZChcbi8vICAgICAvLyAgICAgWyRidXR0b24sICRjb3VudERpdl0sXG4vLyAgICAgLy8gICAgIChbYnV0dG9uLCBjb3VudERpdl0pID0+IHtcblxuLy8gICAgIC8vICAgICB9XG4vLyAgICAgLy8gKVxuXG4vLyAgICAgd2F0Y2goJGNvdW50LCAoKSA9PiB7XG4vLyAgICAgICAgIGNvbnNvbGUubG9nKFwic3luYyBwaGFzZVwiKVxuLy8gICAgIH0sIHsgcGhhc2U6IFNZTkMgfSlcblxuLy8gICAgIHdhdGNoKCRjb3VudCwgKCkgPT4ge1xuLy8gICAgICAgICBjb25zb2xlLmxvZyhcInByZS1yZW5kZXIgcGhhc2VcIilcbi8vICAgICB9LCB7IHBoYXNlOiBCRUZPUkVfUkVOREVSIH0pXG5cbi8vICAgICB3YXRjaCgkY291bnQsICgpID0+IHtcbi8vICAgICAgICAgY29uc29sZS5sb2coXCJyZW5kZXIgcGhhc2VcIilcbi8vICAgICB9LCB7IHBoYXNlOiBPTl9SRU5ERVIgfSlcblxuLy8gICAgIHdhdGNoKCRjb3VudCwgKCkgPT4ge1xuLy8gICAgICAgICBjb25zb2xlLmxvZyhcInBvc3QtcmVuZGVyIHBoYXNlXCIpXG4vLyAgICAgfSwgeyBwaGFzZTogQUZURVJfUkVOREVSIH0pXG5cbi8vICAgICBfdGhpcy5vbkNyZWF0ZWQoKCkgPT4ge1xuLy8gICAgICAgICBjb25zb2xlLmxvZyhcImNyZWF0ZWRcIilcbi8vICAgICAgICAgY29uc3QgYnV0dG9uID0gJGJ1dHRvbigpXG4vLyAgICAgICAgIGNvbnN0IGNvdW50RGl2ID0gJGNvdW50RGl2KClcbi8vICAgICAgICAgY29uc29sZS5sb2coXCJub2RlIHJlZlwiLCBidXR0b24sIGNvdW50RGl2KVxuLy8gICAgIH0pXG5cbi8vICAgICAvLyBvblJlbW91bnQoKCkgPT4ge1xuLy8gICAgIC8vICAgICBjb25zb2xlLmxvZyhcImFjdGl2YXRlZCB5b1wiKVxuLy8gICAgIC8vIH0pXG5cbi8vICAgICAvLyBvblVubW91bnQoKCkgPT4ge1xuLy8gICAgIC8vICAgICBjb25zb2xlLmxvZyhcInVubW91bnRcIilcbi8vICAgICAvLyB9KVxuXG4vLyAgICAgX3RoaXMub25EaXNjYXJkKCgpID0+IHtcbi8vICAgICAgICAgY29uc29sZS5sb2coXCJkZXN0cm95ZFwiKVxuLy8gICAgIH0pXG5cbi8vICAgICAkY291bnQuc3RhdGUgPSAxKVxuXG4vLyAgICAgcmV0dXJuIGNvbXBvbmVudChcbi8vICAgICAgICAgPD5cbi8vICAgICAgICAgICAgIDxkaXYgcmVmPXskY291bnREaXZ9PnskY291bnR9PC9kaXY+XG4vLyAgICAgICAgICAgICA8YnV0dG9uIG9uOmNsaWNrLXRoaXMtJGJ1dHRvbi12PXtbJGNvdW50LnN0YXRlID0gJGNvdW50KCkgKyAxKSwgc3RvcFByb3BhZ2F0aW9uXX0gcmVmPXskYnV0dG9ufT5pbmNyZW1lbnQ8L2J1dHRvbiA+XG4vLyAgICAgICAgICAgICB7LyogPENvdW50ZXI+eyRjb3VudCgpfTwvQ291bnRlcj4gKi99XG4vLyAgICAgICAgIDwvPlxuLy8gICAgIClcbi8vIH1cblxuXG4vLyBzbG90OiByZW5kZXJmdW5jdGlvbiwgY29tcG9uZW50LCByZWFkb25seSBpb24sIHByaW1pdGl2ZSB2YWx1ZVxuIl0sImZpbGUiOiIvVXNlcnMvUnVieS9EZXNrdG9wL3J1YnktY3ViZS9ydWUvYXBwcy9wbGF5L3NyYy9UZXN0TW91bnRJZi50c3gifQ==
