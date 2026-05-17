import { $of, Component, createRoot, css, Else, For, FromTag, If, RenderSlot, Style } from "@rue/luent";
import { ion, Ion, ionic } from "@rue/quarky";

type TagClass = any // TODO

export function FantasyGame() {
   return Component(
      <Panel title="Powerset">
         <Powerset limit={10}></Powerset>
      </Panel>
   )
}

function Panel(setup: FromTag<{
   title: string,
   Slot: RenderSlot
}>) {
   const { title, Slot } = setup

   const opened = ion(true)

   return Component(
      <>
         <div class='panel'>
            <div class='top-bar'>{title}
               <button on:click={() => opened.value = !opened.value}>
                  {() => opened() ? '-' : '+'}
               </button>
            </div>
            <div show-if={opened} class='panel-body'>{Slot()}</div>
         </div>
         {Style(css`
            .panel {
               width: 25vh;
               user-select: none;
            }

            .panel button {
               border: none;
               background-color: goldenrod;
               border-radius: 5px;
            }

            .panel .top-bar {
               display: flex;
               align-items: center;
               justify-content: space-between;
               gap: .5rem;
               background-color: gold;
               padding: .25rem;
            }

            .panel-body {
               background-color: black;
               border: 1px solid #333;
            }
         `)}
      </>
   )
}

function Powerset(setup: FromTag<{
   existing?: string[]
   limit: number,
   class?: Ion<TagClass>
}>) {
   const { existing = [], limit, $class } = setup;
   const powers = ['🍀', '🍄', '✨', '🌱', '🔥', '☄️', '💎', '🔮', '⚗️', '🪵', '🫧']
   const powerset = ionic([...existing], {
      addRandomPower() {
         this.push(powers[Math.floor(Math.random() * powers.length)])
      }
   })
   const count = ion(() => powerset.length)
   // const count = $of(powerset).length // FIX:
   const remaining = ion(() => limit - count())

   return Component(
      <>
         <div class={['powerset-panel', $class]}>
            <ul class='powerset-list'>
               {For(powerset, power =>
                  <li class='power-chip'>{power}</li>
               )}
            </ul>
            
            <div class='panel-footer'>
               <button
                  class='add-power-button'
                  disabled={() => count() === limit}
                  on:click={() => powerset.addRandomPower()}
                  >
                  +
               </button>
            
               <div class='stats'>
                  <span class='stats-label'>Total</span>
                  <span class='stats-value'>{count}/{limit}</span>
               </div>
            </div>
            
            {If(remaining,
               <>
                  <div class='message'>You have {remaining} slots left.</div>
                  <div class='message'>You started with {existing.length} powers.</div>
               </>
            )}
            {Else(
               <div class='message'>Powerset complete.</div>
            )}
         </div>
         {Style(css`
            body {
               background-color: black;
               font-family: 'Courier New'
            }
               
            .powerset-panel {
               width: 100%;
               display: grid;
               gap: 0;
               padding: 1rem;
               border: 2px solid #d4af37;
               border-radius: .625rem;
               background: linear-gradient(180deg, #1a0e2e 0%, #2d1b4e 100%);
               box-shadow: 0 0 20px rgba(212, 175, 55, .25), inset 0 0 10px rgba(138, 43, 226, .1);
            }
         
            .powerset-panel > * + * {
               margin-top: .75rem;
            }
         
            .powerset-list {
               margin: .25rem;
               padding: .5rem;
               list-style: none;
               display: flex;
               flex-wrap: wrap;
               gap: .5rem;
               border-radius: .5rem;
               background: linear-gradient(135deg, #0f0618 0%, #1a0e2e 100%);
               min-height: 2.75rem;
            }
         
            .power-chip {
               width: 2rem;
               height: 2rem;
               display: grid;
               place-items: center;
               border-radius: .4rem;
               border: 2px solid #d4af37;
               background: linear-gradient(135deg, #3d2817 0%, #2d1b4e 100%);
               font-size: 1.1rem;
               box-shadow: 0 0 8px rgba(212, 175, 55, .3);
            }
         
            .panel-footer {
               display: flex;
               align-items: center;
               justify-content: space-between;
               gap: .5rem;
            }
         
            .add-power-button {
               margin: .25rem;
               border: 1px solid #8a2be2;
               border-radius: .4rem;
               padding: .5rem .8rem;
               font-size: .85rem;
               font-weight: 700;
               text-transform: uppercase;
               letter-spacing: .05em;
               color: #d4af37;
               background: linear-gradient(135deg, #3d1f5c 0%, #2d1b4e 100%);
               cursor: pointer;
               transition: all .2s ease;
            }
         
            .add-power-button:hover:enabled {
               background: linear-gradient(135deg, #5a2e7d 0%, #3d2817 100%);
               box-shadow: 0 0 12px rgba(138, 43, 226, .4), 0 0 6px rgba(212, 175, 55, .2);
               transform: translateY(-2px);
            }
         
            .add-power-button:disabled {
               cursor: not-allowed;
               opacity: .4;
            }
         
            .stats {
               display: flex;
               align-items: baseline;
               gap: .4rem;
               color: #d4af37;
            }
         
            .stats-label {
               font-size: .75rem;
               text-transform: uppercase;
               letter-spacing: .05em;
               color: #8a2be2;
            }
         
            .stats-value {
               font-size: 1.1rem;
               font-weight: 700;
            }
         
            .message {
               border-radius: .45rem;
               padding: .55rem .65rem;
               font-size: .8rem;
               line-height: 1.4;
               margin: .25rem;
               background: linear-gradient(135deg, #2d1b4e 0%, #1a0e2e 100%);
               color: #d4af37;
            }
         `)}
      </>
   )
}
