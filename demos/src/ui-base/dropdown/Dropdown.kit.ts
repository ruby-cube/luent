import { ionic, Ionic, queueTask, toRaw } from "luent"
import { DATA_ATTRIBUTE_POPOVER, getPopoverID, Popover } from "../../../../packages/luent-ui/src/base/popover/Popover.kit"


function DropdownKit<I extends { [key: string]: any }>() {
   const dropdown = ionic(new DropdownModel(
      'below',
      'start',
      .75
   ), {
      '-devName': 'dropdown'
   })

   const anchorName = toRaw(dropdown).anchorName = '--popover-anchor-' + getPopoverID()

   return {
      menu: {
         open() {
            queueTask(() => {
               dropdown.show()
            })
         },
         close() {
            dropdown.hide()
         },
         anchor(node: HTMLElement) {
            node.style.anchorName
               = anchorName
            node.setAttribute(DATA_ATTRIBUTE_POPOVER, anchorName)
         }
      },
      dropdown: dropdown as IonicDropdown
   }
}

class DropdownModel extends Popover {

}



export type IonicDropdown = Ionic<Readonly<DropdownModel>>


export {
   DropdownKit
}