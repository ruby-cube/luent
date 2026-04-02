import { $fromContext, atDiscard, atMounted, ComponentTag, Context, ContextKey, css, fromContext, FromTag, If, listen, NodeRef, RawJSXNode, RenderSlot, style, template } from "@rue/luent"
import { Ion, toIon } from "@rue/quarky"
import { maybeFlip, positionTail } from "../popover/Popover.kit";
import { PopoverRoot } from "../popover/Popover";
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

   return template(
      <PopoverRoot popover={dropdown} {...rest}></PopoverRoot> // TODO: how do I prevent over wrapping of Slot? 
   )
}




export {
   PopoverContent as DropdownContent,
   PopoverTail as DropdownTail,
} from '../popover/Popover'

export { DropdownRoot }