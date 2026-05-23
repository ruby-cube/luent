//@ts-nocheck
import { component, template, Stream } from "@rue/luent";

export function Chalkboard() {

   const deleteText = Action(async ({ run }) => {
      await run(() => db.deleteText(text))
   })

   function reKeypress() {
      await deleteText.doAction()
   }

   return component(
      <div>
         {If(deleteText.$pending,
            <div></div>
         )}
      </div>
   )
}