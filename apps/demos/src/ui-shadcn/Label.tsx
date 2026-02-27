import { FromTag } from "@rue/lumo"
import { twMerge as mergeClasses } from "tailwind-merge"


function Label({
   $classes,
   ...attributes
}: FromTag<'label'>) { // TODO: Accessible label?

   return (
      <label
         data-slot="label"
         class={(mergeClasses(
            "gap-2 text-sm leading-none font-medium group-data-[disabled=true]:opacity-50 peer-disabled:opacity-50 flex items-center select-none group-data-[disabled=true]:pointer-events-none peer-disabled:cursor-not-allowed",
            $classes()
         ))}
         // class={[$classes,
         //    "gap-2 text-sm leading-none font-medium group-data-[disabled=true]:opacity-50 peer-disabled:opacity-50 flex items-center select-none group-data-[disabled=true]:pointer-events-none peer-disabled:cursor-not-allowed",
         // ]}
         {...attributes}
      ></label>
   )
}

export { Label }
