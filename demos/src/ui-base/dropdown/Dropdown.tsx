import { component, $fromContext, beforeUnmount, atAttach, ComponentTag, Context, ContextKey, css, fromContext, If, listen, NodeRef, RawJSXNode, RenderSlot, style, template, FromTag } from "@rue/luent"
import { Ion, toIon } from "@rue/quarky"
import { maybeFlip, positionTail } from "../../../../packages/luent-ui/src/base/popover/Popover.kit";
import { PopoverRoot } from "../../../../packages/luent-ui/src/base/popover/Popover";
import { IonicDropdown } from "./Dropdown.kit";

// TODO:
// [] hideDelay should never be greater than delay, clamp hideDelay to delay if it is greater
// [] if the tooltip blocks the trigger hover, we end up with a weird toggling the tooltip on-off-on-off situation

function DropdownRoot(setup: FromTag<{
   ref?: NodeRef<'div'>;
   Slot: RenderSlot;
   dropdown: IonicDropdown
}>) {
   const { dropdown, ...rest } = setup

   return (

      <PopoverRoot popover={dropdown} {...rest}></PopoverRoot> // TODO: how do I prevent over wrapping of Slot? 
   )
}




export {
   PopoverContent as DropdownContent,
   PopoverTail as DropdownTail,
} from '../../../../packages/luent-ui/src/base/popover/Popover'

export { DropdownRoot }