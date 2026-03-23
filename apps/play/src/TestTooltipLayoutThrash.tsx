//@ts-nocheck
import { template, If, NodeRef, Portal, RenderSlot, FromTag, atCreate } from '@rue/lumo';
import { $layout, Ion, queueLayout } from '@rue/quarky';
import './TestTooltip.css'


export function TestTooltip() {

   return template(
      <div>
         <ButtonWithTooltip>{{
            Content: (
               'Hover over me (tooltip below)'
            ),
            Tooltip: (
               <div>
                  This tooltip does not fit above the button.
                  <br />
                  This is why it's displayed below instead!
               </div>
            ),
            Description: (
               <p>{description}</p>
            )
         }}</ButtonWithTooltip>

         {/* <ButtonWithTooltip
            Slot:Description={(
               <p>{description}</p>
            )}
            Slot:Tooltip={(
               <div>
                  This tooltip does not fit above the button.
                  <br />
                  This is why it's displayed below instead!
               </div>
            )}
            Slot={(
               'Hover over me (tooltip below)'
            )}
         ></ButtonWithTooltip> */}

         <div style={{ height: '100px' }} />

         <ButtonWithTooltip>{{
            Content: () => (
               'Hover over me (tooltip above)'
            ),
            Tooltip: () => (
               <div>
                  This tooltip fits above the button.
               </div>
            )
         }}</ButtonWithTooltip>

         <div style={{ height: '100px' }} ></div>

         <ButtonWithTooltip>{{
            Content: () => (
               'Hover over me (tooltip above)'
            ),
            Tooltip: () => (
               <div>
                  This tooltip fits above the button.
               </div>
            )
         }}</ButtonWithTooltip>
      </div>
   );
}

type ButtonWithTooltipInput = FromTag<{
   Slot: {
      Content: RenderSlot,
      Tooltip: RenderSlot
   }
}>

export function ButtonWithTooltip({ Slot }: ButtonWithTooltipInput) {
   const $targetRect = Ion(null as Rect | null)

   return template(
      <>
         <button
            innerHTML={}
            on:pointerenter={e => { $targetRect.value = e.currentTarget.getBoundingClientRect() }}
            on:pointerleave={e => { $targetRect.value = null }}
         >
            {Slot.Content()}
         </button>

         {If($targetRect,
            <Tooltip targetRect={$targetRect()!}>
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

   const $div = NodeRef('div');
   const $height = Ion(undefined as number | undefined)

   // queueLayout(() => {
   //    const height = $div()?.getBoundingClientRect().height
   //    if (height != null) $height.value = height;
   // })

   atCreate(async () => {
      await $layout()
      console.log('reading layout')
      const height = $div()?.getBoundingClientRect().height
      if (height != null) $height.value = height;
   })


   // async {
   //    await $layout() ...:
   //       const height = $div()?.getBoundingClientRect().height;
   //       if (height != null) $height.value = height
   // }

   // prevent looped layout thrashing w/ measureLayout
   // atMounted(async () => {
   //    const height = await layout(() =>
   //       $div()?.getBoundingClientRect().height
   //    )
   //    if (height != null) $height.value = height;
   // })

   const shiftX = targetRect.left

   const $shiftY = Ion(() => {
      const height = $height()
      if (height === undefined) return 0;
      const y = targetRect.top - height;
      return y < 0 ? targetRect.bottom : y;
   })

   return template(
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


// async function doSomething() {
//    const res = await fetchCities()
//    const cities = await res.JSON()
//    const id = doSomething(cities)
//    const [cats] = await Promise.all([cities.store.fetchOther(id), $render()])
//    console.log(cats)
// }


// const doSomething = Async(() => {
//    return (
//       oo.await(fetchCities, res => res.JSON())
//          .then(o => (doSomething(o), o))
//          .await(o => [o.JSON(), $render()], ([cats]) => {
//             console.log(cats)
//          })
//    )
// })

// const doSomething = Async(() => ooo
//    .await(fetchCities, res => ({
//       res
//    }))
//    .await(c => c.res.JSON(), (cities, c, co = {}) => (
//       co.ash = console.log('context', c),
//       co.store = console.log('context', c),
//       {
//          id: doSomething(cities, co.ash),
//          cities
//       }
//    ))
//    .await(c => c.res.JSON(), (cities, c) => (
//       console.log('context', c),
//       {
//          ...c,
//          id: doSomething(cities),
//          cities
//       }
//    ))
//    .await(c => [c.cities.store.fetchOther(c.id), $render()], ([cats], c) => (
//       console.log(cats), c
//    ))
//    .await($render, (_, c) => c.cities)
// )

// const doSomething = Async(() => ooo
//    .await(fetchCities)
//    .await(res => res.JSON(), cities =>
//       [...cities, 'o']
//    )
// )






// const doSomething = Async(() => ooo
//    .await(fetchCities)
//    .await(res => res.JSON(), cities => ({
//       id: doSomething(cities),
//       cities
//    }))
//    .await(co => [co.cities.store.fetchOther(co.id), co.$render()], ([cats], co) => {
//       console.log(cats, co.id)
//    })
//    .await($tick, (x, co) => {
//       console.log(co.cities)
//    })
// )


// const doSomething = Async(() => {
//    return (
//       ooo.await(fetchCities)
//          .await(res => res.JSON(), cities => ({
//             id: doSomething(cities), cities
//          }))
//          .await(o => [o.cities.store.fetchOther(o.id), $render()], ([cats], o) => {
//             console.log(cats)
//          })
//    )
// })


// const doSomething = Async(() => {


//    return ooo
//       .await(fetchCities, res => ({
//          res
//       }))
//       .await(co => co.res.JSON(), cities => ({
//          cities
//       }))
//       .await($render)
//       .await($tick, (x, o) =>
//          console.log(o.cities)
//       )
// })