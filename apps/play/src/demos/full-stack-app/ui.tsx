






import { component, fromTag } from "@rue/lumo";

// - dispatch definition: converts fileData type to File model
//   - FileData type
// - UI
// - File Class implementation
// - File Interface & Key

// #region Dispatches
const GET_FILE = defineDispatchGET(FILE, async ($id: Ion<number>) => {

}, {
   options
})
// #endregion


// #region View


const FILE = DispatchKey(Ionized<File>)

function View(
   { $id } = fromTag<{
      id: Ion<number>
   }>()
) {
   const file = dispatch(GET_FILE, { $id })

   return component(
      <>

      </>
   )
}


// #endregion



function dispatchGET(...args: any) {

}

function DispatchKey(...args: any) {

}