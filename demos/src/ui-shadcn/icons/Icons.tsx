import { component, FromTag, template } from "luent";

export function CreateIcon(icon: string) {
   return function Icon(attributes: FromTag) {
      return (
         <i data-lucide={icon} {...attributes}></i>
      )
   }
}

export const CheckIcon = CreateIcon('check');
export const ChevronRightIcon = CreateIcon('chevron-right');