//@ts-nocheck
import { atAttach, template, listen } from "luent";

type ThisComponent = {
   context: any,
   atAttach(): void
}


// TODO: Cases
// [ ] hidden nested await and other async function
// [ ] component Kits


type LessonInput = {
   apple: string
}

function MessageForm(this: ThisView, {
   apple
}: LessonInput) {

   const thus = this.with({ TextKit, doSomething })

   this.atAttach(() => {

   })

   const files = this.fromRoot(FILES)
   const files = this.fromContext(FILES)

   const { $text } = thus.TextKit(files)

   setTimeout(() => {
      thus.doSomething()
   }, 100)



   this.atRemount(() => {

   })

   this.listen(document, 'click', () => {

   })

   let timeoutID: number;

   this.watch($text, () => {
      if (timeoutID) clearTimeout(timeoutID);

      setTimeout(() => {

      }, 100)
   })

   this.watch($text, async () => {
      const timeoutID = setTimeout(() => {

      })

      atCleanup(() => clearTimeout(timeoutID))

      await __postrender__()
   })



   return II(
      <>
         <div></div>
      </>
   )
}

const compo = {
   atAttach() { },
   with(methods) {
      return new Proxy(this, {
         get(target, key) {
            if (key in methods) return methods[key].bind(target);
            return target[key]
         }
      })
   }
}


function doSomething(this: ThisView) {
   const files = this.getFromApp(FILES)
}

function TextKit(this: ThisView, files: any) {

   const $text = ion('hi')

   this.atAttach(() => {

   })

   return {
      $text
   }
}
