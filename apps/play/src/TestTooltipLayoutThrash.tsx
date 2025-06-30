import { component, Else, For, fromTag, If, JSXNode, measureLayout, nodeRef, onMounted, Portal, RawJSXNode, RenderFunction } from '@rue/lumo';
import { Ion, ion, watch } from '@rue/quarky';


export function TestTooltipApp() {

   return component(
      <div>
         {/* <ButtonWithTooltip>
            {{
               buttonText: () => 'Hover over me (tooltip below)',
               tooltip: () =>
                  <div>
                     This tooltip does not fit above the button.
                     <br />
                     This is why it's displayed below instead!
                  </div>
            }}
         </ButtonWithTooltip>
         <div style={{ height: '100px' }} />
         <ButtonWithTooltip>
            {{
               buttonText: () => 'Hover over me (tooltip below)',
               tooltip: () =>
                  <div>
                     This tooltip does not fit above the button.
                     <br />
                     This is why it's displayed below instead!
                  </div>
            }}
         </ButtonWithTooltip>


         <div style={{ height: '100px' }} />
         <ButtonWithTooltip>
            {{
               buttonText: () => 'Hover over me (tooltip below)',
               tooltip: () =>
                  <div>
                     This tooltip does not fit above the button.
                     <br />
                     This is why it's displayed below instead!
                  </div>
            }}
         </ButtonWithTooltip> */}

         <ButtonWithTooltip>
            Hover over me (tooltip below)

            <Slot tooltip>
               <div>
                  This tooltip does not fit above the button.
                  <br />
                  This is why it's displayed below instead!
               </div>
            </Slot>
         </ButtonWithTooltip>

         <div style={{ height: '50px' }} />
      </div>
   );
}

function Slot<T>(input: T): T {
   return component(<></>) as T
}

export function ButtonWithTooltip(input = fromTag<{
   Slot: {
      default: RenderFunction,
      tooltip: RenderFunction
   }
}>()) {
   const { Slot } = input
   const $targetRect = ion(null as Rect | null)
   const $button = nodeRef('button');

   return component(
      <>
         <button
            ref={$button}
            on:pointerenter={() => { $targetRect.state = $button()!.getBoundingClientRect(); }}
            on:pointerleave={() => { $targetRect.state = null }}
         >
            {Slot.default()}
         </button>
         {If($targetRect,
            <Tooltip targetRect={$targetRect}>
               {Slot.tooltip()}
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


export function Tooltip({ Slot, targetRect } = fromTag<{
   Slot: RenderFunction
   targetRect: Rect
}>()) {
   const $div = nodeRef('div')
   const $height = ion(undefined as number | undefined)

   onMounted(async () => {
      const height = await measureLayout(() => $div()!.getBoundingClientRect().height)
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
            <div ref={$div} class="tooltip">
               {Slot()}
            </div>
         </div>
      )
   )
}





// function Portal({ Slot, to } = fromTag<{
//    Slot: any,
//    to: string
// }>()) {
//    return component(
//       Slot()
//    )
// }
