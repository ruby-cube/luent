"use client"

import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui"
// import { CheckIcon, ChevronRightIcon } from "lucide-react"
import { FromTag } from "@rue/lumo"
import { mergeTailwind } from "../utils/utils"
import { CheckIcon, ChevronRightIcon } from "./icons/Icons"

function DropdownMenu({
   ...attributes
}: FromTag<typeof DropdownMenuPrimitive.Root>) {
   return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...attributes} />
}

function DropdownMenuPortal({
   ...attributes
}: FromTag<typeof DropdownMenuPrimitive.Portal>) {
   return (
      <DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal" {...attributes} />
   )
}

function DropdownMenuTrigger({
   ...attributes
}: FromTag<typeof DropdownMenuPrimitive.Trigger>) {
   return (
      <DropdownMenuPrimitive.Trigger
         data-slot="dropdown-menu-trigger"
         {...attributes}
      />
   )
}

function DropdownMenuContent({
   æclasses,
   align = "start",
   sideOffset = 4,
   ...attributes
}: FromTag<typeof DropdownMenuPrimitive.Content>) {
   return (
      <DropdownMenuPrimitive.Portal>
         <DropdownMenuPrimitive.Content
            data-slot="dropdown-menu-content"
            sideOffset={sideOffset}
            align={align}
            class={mergeTailwind("data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 ring-foreground/10 bg-popover text-popover-foreground min-w-32 rounded-lg p-1 shadow-md ring-1 duration-100 z-50 max-h-(--radix-dropdown-menu-content-available-height) w-(--radix-dropdown-menu-trigger-width) origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto data-[state=closed]:overflow-hidden", æclasses())}
            {...attributes}
         />
      </DropdownMenuPrimitive.Portal>
   )
}

function DropdownMenuGroup({
   ...attributes
}: FromTag<typeof DropdownMenuPrimitive.Group>) {
   return (
      <DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...attributes} />
   )
}

function DropdownMenuItem({
   æclasses,
   inset,
   variant = "default",
   ...attributes
}: FromTag<typeof DropdownMenuPrimitive.Item> & {
   inset?: boolean
   variant?: "default" | "destructive"
}) {
   return (
      <DropdownMenuPrimitive.Item
         data-slot="dropdown-menu-item"
         data-inset={inset}
         data-variant={variant}
         class={mergeTailwind(
            "focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:text-destructive not-data-[variant=destructive]:focus:**:text-accent-foreground gap-1.5 rounded-md px-1.5 py-1 text-sm data-inset:pl-7 [&_svg:not([class*='size-'])]:size-4 group/dropdown-menu-item relative flex cursor-default items-center outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
            æclasses()
         )}
         {...attributes}
      />
   )
}

function DropdownMenuCheckboxItem({
   æclasses,
   children,
   checked,
   inset,
   ...attributes
}: FromTag<typeof DropdownMenuPrimitive.CheckboxItem> & {
   inset?: boolean
}) {
   return (
      <DropdownMenuPrimitive.CheckboxItem
         data-slot="dropdown-menu-checkbox-item"
         data-inset={inset}
         class={mergeTailwind(
            "focus:bg-accent focus:text-accent-foreground focus:**:text-accent-foreground gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm data-inset:pl-7 [&_svg:not([class*='size-'])]:size-4 relative flex cursor-default items-center outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
            æclasses()
         )}
         checked={checked}
         {...attributes}
      >
         <span
            class="absolute right-2 flex items-center justify-center pointer-events-none"
            data-slot="dropdown-menu-checkbox-item-indicator"
         >
            <DropdownMenuPrimitive.ItemIndicator>
               <CheckIcon />
            </DropdownMenuPrimitive.ItemIndicator>
         </span>
         {children}
      </DropdownMenuPrimitive.CheckboxItem>
   )
}

function DropdownMenuRadioGroup({
   ...attributes
}: FromTag<typeof DropdownMenuPrimitive.RadioGroup>) {
   return (
      <DropdownMenuPrimitive.RadioGroup
         data-slot="dropdown-menu-radio-group"
         {...attributes}
      />
   )
}

function DropdownMenuRadioItem({
   æclasses,
   children,
   inset,
   ...attributes
}: FromTag<typeof DropdownMenuPrimitive.RadioItem> & {
   inset?: boolean
}) {
   return (
      <DropdownMenuPrimitive.RadioItem
         data-slot="dropdown-menu-radio-item"
         data-inset={inset}
         class={mergeTailwind(
            "focus:bg-accent focus:text-accent-foreground focus:**:text-accent-foreground gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm data-inset:pl-7 [&_svg:not([class*='size-'])]:size-4 relative flex cursor-default items-center outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
            æclasses()
         )}
         {...attributes}
      >
         <span
            class="absolute right-2 flex items-center justify-center pointer-events-none"
            data-slot="dropdown-menu-radio-item-indicator"
         >
            <DropdownMenuPrimitive.ItemIndicator>
               <CheckIcon />
            </DropdownMenuPrimitive.ItemIndicator>
         </span>
         {children}
      </DropdownMenuPrimitive.RadioItem>
   )
}

function DropdownMenuLabel({
   æclasses,
   inset,
   ...attributes
}: FromTag<typeof DropdownMenuPrimitive.Label> & {
   inset?: boolean
}) {
   return (
      <DropdownMenuPrimitive.Label
         data-slot="dropdown-menu-label"
         data-inset={inset}
         class={mergeTailwind("text-muted-foreground px-1.5 py-1 text-xs font-medium data-inset:pl-7", æclasses())}
         {...attributes}
      />
   )
}

function DropdownMenuSeparator({
   æclasses,
   ...attributes
}: FromTag<typeof DropdownMenuPrimitive.Separator>) {
   return (
      <DropdownMenuPrimitive.Separator
         data-slot="dropdown-menu-separator"
         class={mergeTailwind("bg-border -mx-1 my-1 h-px", æclasses)}
         {...attributes}
      />
   )
}

function DropdownMenuShortcut({
   æclasses,
   ...attributes
}: FromTag<"span">) {
   return (
      <span
         data-slot="dropdown-menu-shortcut"
         class={mergeTailwind("text-muted-foreground group-focus/dropdown-menu-item:text-accent-foreground ml-auto text-xs tracking-widest", æclasses())}
         {...attributes}
      />
   )
}

function DropdownMenuSub({
   ...attributes
}: FromTag<typeof DropdownMenuPrimitive.Sub>) {
   return <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...attributes} />
}

function DropdownMenuSubTrigger({
   æclasses,
   inset,
   children,
   ...attributes
}: FromTag<typeof DropdownMenuPrimitive.SubTrigger> & {
   inset?: boolean
}) {
   return (
      <DropdownMenuPrimitive.SubTrigger
         data-slot="dropdown-menu-sub-trigger"
         data-inset={inset}
         class={mergeTailwind(
            "focus:bg-accent focus:text-accent-foreground data-open:bg-accent data-open:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground gap-1.5 rounded-md px-1.5 py-1 text-sm data-inset:pl-7 [&_svg:not([class*='size-'])]:size-4 flex cursor-default items-center outline-hidden select-none [&_svg]:pointer-events-none [&_svg]:shrink-0",
            æclasses()
         )}
         {...attributes}
      >
         {children}
         <ChevronRightIcon class="mergeTailwind-rtl-flip ml-auto" />
      </DropdownMenuPrimitive.SubTrigger>
   )
}

function DropdownMenuSubContent({
   æclasses,
   ...attributes
}: FromTag<typeof DropdownMenuPrimitive.SubContent>) {
   return (
      <DropdownMenuPrimitive.SubContent
         data-slot="dropdown-menu-sub-content"
         class={mergeTailwind("data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 ring-foreground/10 bg-popover text-popover-foreground min-w-[96px] rounded-lg p-1 shadow-lg ring-1 duration-100 z-50 origin-(--radix-dropdown-menu-content-transform-origin) overflow-hidden", æclasses())}
         {...attributes}
      />
   )
}

export {
   DropdownMenu,
   DropdownMenuPortal,
   DropdownMenuTrigger,
   DropdownMenuContent,
   DropdownMenuGroup,
   DropdownMenuLabel,
   DropdownMenuItem,
   DropdownMenuCheckboxItem,
   DropdownMenuRadioGroup,
   DropdownMenuRadioItem,
   DropdownMenuSeparator,
   DropdownMenuShortcut,
   DropdownMenuSub,
   DropdownMenuSubTrigger,
   DropdownMenuSubContent,
}
