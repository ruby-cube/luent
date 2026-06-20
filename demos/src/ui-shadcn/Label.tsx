import { FromTag, WithRef, } from "@rue/luent"


function Label({
  ...bindings
}: WithRef<'label'>) { // TODO: Accessible label?

  return (
    <label
      data-slot="label"
      class="gap-2 text-sm leading-none font-medium group-data-[disabled=true]:opacity-50 peer-disabled:opacity-50 flex items-center select-none group-data-[disabled=true]:pointer-events-none peer-disabled:cursor-not-allowed"
      auto-bind={bindings}
    ></label>
  )
}

export { Label }
