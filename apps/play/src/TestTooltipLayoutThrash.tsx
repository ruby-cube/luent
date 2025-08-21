import { component, If, JSXNode, measureLayout, NodeRef, atMounted, Portal, RawJSXNode, RenderFunction, RenderSlot, FromTag } from '@rue/lumo';
import { Ion, ion, isNonNull, watch } from '@rue/quarky';


export function TestTooltipApp() {

   return component(
      <div>
         <ButtonWithTooltip>
            <Slot>
               Hover over me (tooltip below)
            </Slot>

            <Slot Tooltip>
               <div>
                  This tooltip does not fit above the button.
                  <br />
                  This is why it's displayed below instead!
               </div>
            </Slot>
         </ButtonWithTooltip>

         <div style={{ height: '100px' }} />

         <ButtonWithTooltip>
            <Slot>
               Hover over me (tooltip above)
            </Slot>

            <Slot Tooltip>
               <div>
                  This tooltip fits above the button.
               </div>
            </Slot>
         </ButtonWithTooltip>

         <div style={{ height: '100px' }} ></div>

         <ButtonWithTooltip>
            <Slot>
               Hover over me (tooltip above)
            </Slot>

            <Slot Tooltip>
               <div>
                  This tooltip fits above the button.
               </div>
            </Slot>
         </ButtonWithTooltip>
      </div>
   );
}


export function ButtonWithTooltip({ Slot }: FromTag<{
   Slot: {
      Default: RenderSlot,
      Tooltip: RenderSlot
   }
}>) {
   const $targetRect = ion(null as Rect | null)

   return component(
      <>
         <button
            on:pointerenter={e => { $targetRect.state = e.target.getBoundingClientRect() }}
            on:pointerleave={e => { $targetRect.state = null }}
         >
            {Slot.Default()}
         </button>
         {If($targetRect, v =>
            <Tooltip targetRect={v($targetRect)()}>
               {Slot.Tooltip()}
            </Tooltip>
         )}
      </>
   );
}


type Rect = { left: number, top: number, bottom: number }



// 1) WRITE: mount tooltip in wrong position
// 2) READ: measure tooltip height (FORCED LAYOUT)
// 3) set tooltip height 
// 4) WRITE: triggers style change that repositions tooltip
// 5) BROWSER LAYOUT
// 6) BROWSER PAINT

// There is inherently layout thrashing here. It's not preventable.
// What we can do is prevent a LOOP of layout thrashing if this had to happen in a loop
// 


export function Tooltip(input: FromTag<{
   Slot: RenderSlot
   targetRect: Rect
}>) {
   const { Slot, targetRect } = input

   const div = NodeRef('div')
   const $height = ion(undefined as number | undefined)

   atMounted(async () => {
      const divNode = div.node;
      if (!divNode) return;
      const height = await measureLayout(() => divNode.getBoundingClientRect().height)
      $height.state = height;
   })

   const shiftX = targetRect.left
   const $shiftY = ion(() => {
      const height = $height()
      if (height === undefined) return 0;
      const y = targetRect.top - height;
      return y < 0 ? targetRect.bottom : y;
   })

   return component(
      Portal('body',
         <div
            style={{
               position: 'absolute',
               pointerEvents: 'none',
               left: 0,
               top: 0,
               transform: (`translate3d(${shiftX}px, ${$shiftY()}px, 0)`)
            }}
         >
            <div ref={div} class="tooltip">
               {Slot()}
            </div>
         </div>
      )
   )
}





// function Portal({ Slot, to } : FromTag<{
//    Slot: any,
//    to: string
// }>) {
//    return component(
//       Slot()
//    )
// }
