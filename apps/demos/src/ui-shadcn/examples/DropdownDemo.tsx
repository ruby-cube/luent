//@ts-nocheck

import { Context, ContextKey, fromContext, FromTag, RawJSXNode, RenderSlot, template } from "@rue/luent"
import { DropdownKit, IonicDropdown } from "../../ui-base/dropdown/Dropdown.kit"
import { DropdownContent, DropdownRoot, DropdownTail } from "../../ui-base/dropdown/Dropdown";

type DropdownMenu = {
   open(): void;
   close(): void;
   anchor(node: HTMLElement): void
}

const DROPDOWN = ContextKey<IonicDropdown>()

function DropdownMenu(setup: FromTag<{
   'Slot:Face': (menu: DropdownMenu) => RawJSXNode
}>) {
   const { Slot } = setup
   const { dropdown, menu } = DropdownKit()

   return template(
      <Context provide={DROPDOWN(dropdown)}>
         {Slot.Face(menu)}
         {Slot()}
      </Context>
   )
}

function Dropdown(setup: FromTag<{ Slot: RenderSlot }>) {
   const { Slot } = setup
   const dropdown = fromContext(DROPDOWN)

   return template(
      <o--body>
         <DropdownRoot dropdown={dropdown}>
            <DropdownContent>{Slot()}</DropdownContent>
            <DropdownTail></DropdownTail>
         </DropdownRoot>
      </o--body>
   )
}

export function DropdownMenuDemo() {

   return template(
      <DropdownMenu Slot:Face={menu =>
         <Button on:click={e => menu.open()} at:create={menu.anchor} variant="outline">Open</Button>
      }>
         const menu = MenuKit()
         
         <Dropdown className="w-40" align="start">
            <DropdownGroup>
               <DropdownLabel>My Account</DropdownLabel>
               <DropdownItem>
                  Profile <DropdownShortcut>⇧⌘P</DropdownShortcut>
               </DropdownItem>
               <DropdownItem>
                  Billing <DropdownShortcut>⌘B</DropdownShortcut>
               </DropdownItem>
               <DropdownItem>
                  Settings <DropdownShortcut>⌘S</DropdownShortcut>
               </DropdownItem>
            </DropdownGroup>

            <DropdownSeparator />

            <DropdownGroup>
               <DropdownItem>Team</DropdownItem>
               <DropdownSubmenu Slot:Face={menu =>
                  <DropdownItem on:click={e => menu.open()}>Invite users</DropdownItem>
               }>
                  <DropdownSub>
                     <DropdownItem>Email</DropdownItem>
                     <DropdownItem>Message</DropdownItem>
                     <DropdownSeparator />
                     <DropdownItem>More...</DropdownItem>
                  </DropdownSub>
               </DropdownSubmenu>
               <DropdownItem>
                  New Team <DropdownShortcut>⌘+T</DropdownShortcut>
               </DropdownItem>
            </DropdownGroup>

            <DropdownSeparator />

            <DropdownGroup>
               <DropdownItem>GitHub</DropdownItem>
               <DropdownItem>Support</DropdownItem>
               <DropdownItem disabled>API</DropdownItem>
            </DropdownGroup>

            <DropdownSeparator />

            <DropdownGroup>
               <DropdownItem>
                  Log out <DropdownShortcut>⇧⌘Q</DropdownShortcut>
               </DropdownItem>
            </DropdownGroup>
         </Dropdown>
      </DropdownMenu>
   )
}
