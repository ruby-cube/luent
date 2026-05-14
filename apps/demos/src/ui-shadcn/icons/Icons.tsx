import { Component, FromTag, template } from "@rue/luent";

export function CreateIcon(icon: string) {
   return function Icon(attributes: FromTag) {
      return Component(
         <i data-lucide={icon} {...attributes}></i>
      )
   }
}

export const CheckIcon = CreateIcon('check');
export const ChevronRightIcon = CreateIcon('chevron-right');