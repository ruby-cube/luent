import { atMounted, FromTag, If, NodeRef, Portal, RenderSlot, template } from "@rue/lumo";
import { Ion } from "@rue/quarky";
import './TestTooltip.css'


export function TestTooltip2() {
   return template(
      <div>
         <ButtonWithTooltip
            tooltip={() =>
               <div>
                  This tooltip does not fit above the button.
                  <br />
                  This is why it's displayed below instead!
               </div>
            }
         >
            Hover over me (tooltip above)
         </ButtonWithTooltip>
         <div style={{ height: '50px' }} />
         <ButtonWithTooltip
            tooltip={() =>
               <div>This tooltip fits above the button</div>
            }
         >
            Hover over me (tooltip below)
         </ButtonWithTooltip>
         <div style={{ height: '50px' }} />
         <ButtonWithTooltip
            tooltip={() =>
               <div>This tooltip fits above the button</div>
            }
         >
            Hover over me (tooltip below)
         </ButtonWithTooltip>
      </div>
   );
}

type TargetRect = { left: number, top: number, right: number, bottom: number }

function ButtonWithTooltip({ tooltip, Slot, ...rest }: FromTag<{ tooltip: RenderSlot }>) {
   const $targetRect = Ion(null as null | TargetRect)
   const $button = NodeRef('button');
   return template(
      <>
         <button
            {...rest}
            ref={$button}
            on:pointerenter={() => {
               const rect = $button()!.getBoundingClientRect();
               $targetRect.value = {
                  left: rect.left,
                  top: rect.top,
                  right: rect.right,
                  bottom: rect.bottom,
               };
            }}
            on:pointerleave={() => {
               console.log('pointer leave')
               $targetRect.value = null
            }}
         >{Slot()}</button>
         {/* <o--body> */}
         {If($targetRect,
            <Tooltip targetRect={$targetRect()!}>
               {tooltip()}
            </Tooltip>
         )}
         {/* </o--body> */}
      </>
   );
}



function Tooltip({ Slot, targetRect }: FromTag<{ Slot: RenderSlot, targetRect: TargetRect }>) {
   const $div = NodeRef('div');
   const $height = Ion(0)

   atMounted(() => {
      // const { height } = $div()!.getBoundingClientRect();
      // $height.value = height
      // console.log('Measured tooltip height: ' + height);
   });

   const shiftX = targetRect.left

   const $shiftY = Ion(() => {
      const height = $height()
      if (height === undefined) return 0;
      const y = targetRect.top - height;
      return y < 0 ? targetRect.bottom : y;
   })

   return template(
      <o--body>
            <div
               style={{
                  position: 'absolute',
                  pointerEvents: 'none',
                  left: '0px',
                  top: '0px',
                  transform: (`translate3d(${shiftX}px, ${$shiftY()}px, 0px)`)
               }}
            >
               <div ref={$div} class="tooltip">
                  {Slot()}
               </div>
            </div>
      </o--body>
   );
}


