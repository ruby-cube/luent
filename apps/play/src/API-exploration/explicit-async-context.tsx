//@ts-nocheck
import { atMounted, template, FromTag, listen } from "@rue/lumo";

type ThisComponent = {
   context: any,
   atMounted(): void
}


// TODO: Cases
// [ ] hidden nested await and other async function
// [ ] Component Kits


type LessonInput = FromTag<{
   apple: string
}>

function MessageForm(this: ThisView, {
   apple
}: LessonInput) {

   const thus = this.with({ TextKit, doSomething })

   this.atMounted(() => {

   })

   const files = this.fromApp(FILES)
   const files = this.fromContext(FILES)

   const { $text } = thus.TextKit(files)

   setTimeout(() => {
      thus.doSomething()
   }, 100)



   this.atRemounted(() => {

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
   atMounted() { },
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

   const $text = Ion('hi')

   this.atMounted(() => {

   })

   return {
      $text
   }
}
