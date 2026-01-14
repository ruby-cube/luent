// @ts-nocheck
import { component, If, measureLayout, GetNode, atMounted, Portal, RenderSlot, FromTag } from '@rue/lumo';
import { Ion, MutableIon } from '@rue/quarky';


export function TestTooltip() {

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

type ButtonWithTooltipInput = FromTag<{
   Slot: {
      Default: RenderSlot,
      Tooltip: RenderSlot
   }
}>

export function ButtonWithTooltip({ Slot }: ButtonWithTooltipInput) {
   const $targetRect = Ion(null as Rect | null)

   return component(
      <>
         <button
            on:pointerenter={e => { $targetRect.value = e.currentTarget.getBoundingClientRect() }}
            on:pointerleave={e => { $targetRect.value = null }}
         >
            {Slot.Default()}
         </button>

         {If($targetRect, $targetRect =>
            <Tooltip targetRect={$targetRect()}>
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

// NOTE: There is inherently layout thrashing here. It's not 100% preventable.
// What we can do is prevent a LOOP of layout thrashing by batching layout measuring with measureLayout
// Not super necessary in this case because it's highly unlikely more than one tooltip will be generated at a time

export function Tooltip(input: FromTag<{
   Slot: RenderSlot
   targetRect: Rect
}>) {
   const { Slot, targetRect } = input

   const $div = GetNode('div');
   const $height = Ion(undefined as number | undefined)

   atMounted(() => {
      ooo.await($layout, () =>
         $div()?.getBoundingClientRect().height
      )
      ooo.await($render, height => {
         if (height != null) $height.value = height;
      })
   })

   // atMounted(({ ooo }) => {
   //    ooo.await($layout)
   //       .then(() => $div()?.getBoundingClientRect().height)
   //    ooo.await($render)
   //       .then(hg => { if (hg != null) $height.value = hg; })
   //    ooo.await(tick, () => {
   //       console.log('this runs after tick resolves which is awaited once layout resolves')
   //    })
   // })
   const doSomething = Async(() => {
      oo.await(fetchCities, res => (
         res.JSON()
      ))
         .then(cities=> {

         })
      oo.await([$piped, $render], cities => (
         cities
      ))
      oo.await($tick, () => {
         console.log($pipeout)
      })
      return oo.pipeout
   })

   const doSomething = Async(() => {
      oo.await(fetchCities, res => res.JSON())
      oo.await([$piped, $render], cities => cities)
      oo.await($tick, () => console.log($pipeout))
      return $awaited()
   })

   atMounted(Async(() => {
      oo.await($layout, () => (
         $div()?.getBoundingClientRect().height
      ))
      oo.await($render, () => {
         if ($pipeout() != null) $height.value = $pipeout();
      })
      oo.await($tick, () => {
         console.log('this runs after tick resolves which is awaited once layout resolves')
      })
   }))


   // prevent looped layout thrashing w/ measureLayout
   atMounted(async () => {
      const height = await layout(() =>
         $div()?.getBoundingClientRect().height
      )
      if (height != null) $height.value = height;
   })

   const shiftX = targetRect.left

   const $shiftY = Ion(() => {
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
            <div node={$div} class="tooltip">
               {Slot()}
            </div>
         </div>
      )
   )
}