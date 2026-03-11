import { If, template, Else, ElseIf, FromTag, atMounted, atCreated, atRemounted, atDemount, atUnmount, atDiscard, For, atMount, atRemount, css } from "@rue/lumo";
import { instantUpdate, Ion, Ionic } from "@rue/quarky";
import "./style.css"

function Counter(input: FromTag<{
   label: string,
   logHook?: (msg: string) => void
}>
) {
   const { label, logHook } = input
   const $count = Ion(0, {
      increment() {
         this.value++
      },
      decrement() {
         this.value--
      }
   })

   if (logHook) {
      atCreated(() => {
         logHook("freshly created")
      })

      atMount(initial => {
         logHook(`the initial mount? --${initial}`)
      })

      atRemount(() => {
         logHook('remounted')
      })

      atDiscard(() => {
         logHook('destroying view...')
      })

      atUnmount(final => {
         logHook(`unmounting view... The final unmount? --${final}`)
      })

      atDemount(() => {
         logHook('demounting...')
      })
   }


   return template(
      <div>
         <div>{label}: {$count}</div>
         <button on:click={e => $count.increment()}>+</button>
         <button on:click={e => $count.decrement()}>-</button>
      </div>
   )
}

export function TestCreateMountShow() {
   const $brave = Ion(true, {
      toggle() {
         this.value = !this.value
      }
   })

   const $mood = Ion('happy' as "happy" | "sad", {
      toggle() {
         this.value = this.value === 'happy' ? 'sad' : 'happy'
      }
   })

   return template(
      <article style="width: 33vw">
         <h1>View Activation: Create/Show/Mount</h1>

         <hr></hr>
         <h3>Show/hide an element</h3>
         <section>
            <code>{'<div show-if={$condition}>'}</code>
            <p>This toggles css <span class="code">display: none</span> on a single element</p>
            <div class='container'>
               <div class='container' style="height: 60px">
                  <div show-if={$brave} class='emoji'>
                     😳
                  </div>
               </div>
               <div style="font-size: x-small">{`(he's shy)`}</div>
               <button style="width: 5em" on:click={e => $brave.toggle()}>{($brave() ? 'hide' : 'show')}</button>
            </div>
         </section>

         <hr></hr>
         <h3>Show/hide a view</h3>
         <section>
            <code>
               {'<show-view>'}<br />
               {'   '}<span class="bracket">{`{`}</span>{`If(...)`}<span class="bracket">{`}`}</span><br />
               {'   '}<span class="bracket">{`{`}</span>{'ElseIf(...)'}<span class="bracket">{`}`}</span>
            </code>
            <p>This toggles css <span class='code'>display: none</span> for a conditional series</p>
            <div class='container'>
               <div class='container' style="height: 60px">
                  <show-view>
                     {If(($mood() === 'happy'),
                        <span class='emoji'>😃</span>
                     )}
                     {Else(
                        <span class='emoji'>😞</span>
                     )}
                  </show-view>
               </div>
               <div style="font-size: x-small">{`(he's bipolar)`}</div>
               <button style="width: 9em" on:click={e => $mood.toggle()}>swing mood</button>
            </div>
         </section>

         <hr></hr>
         <h3>Create/destroy a view</h3>
         <section>{() => {
            const $tab = Ion(1)

            return <>
               <code>
                  <span class="bracket">{`{`}</span>{`If(...)`}<span class="bracket">{`}`}</span><br />
                  <span class="bracket">{`{`}</span>{'ElseIf(...)'}<span class="bracket">{`}`}</span>
               </code>
               <p>
                  {`This creates and destroys views of a conditional series. State is not preserved.
                  Conditional series default to create-destroy mode, so the`}<span class='code'>{`<create-view>`}</span>
                  {`tag is not necessary. However it can be convenient for applying transitions or as a base activation type
                  for further fine-grained configurations (see Mix and match activation types)`}
               </p>
               <div class='container'>
                  <button style="width: 5em" on:click={e => { $tab.value = 1 }}>home</button>
                  <button style="width: 6em" on:click={e => { $tab.value = 2 }}>garden</button>
                  <div class='container' style="height: 160px">
                     {If(($tab() === 1),
                        <div>
                           <p class='emoji'>🏠</p>
                           <div style="font-size: x-small">
                              <Counter label='home'></Counter>
                           </div>
                        </div>
                     )}
                     {Else(
                        <div>
                           <p class='emoji'>🌺 🍄 🍀</p>
                           <div class="garden" style="font-size: x-small">
                              <Counter label='garden'></Counter>
                           </div>
                        </div>
                     )}
                     <aside>(state is not preserved!)</aside>
                  </div>
               </div>
            </>
         }}
         </section>

         <hr></hr>
         <h3>Mount/Demount a view</h3>
         <section>{() => {
            const $tab = Ion(1)
            // const $tab1 = Remountable()

            return <>
               <code>{'<remount-view>'}</code>
               <p>
                  {`This mounts, demounts, and remounts views of a conditional series, preserving state when demounted. 
                  Remountable views can also be destroyed. (not yet implemented)`}
               </p>
               <div class='container'>
                  <button style="width: 5em" on:click={e => { $tab.value = 1 }}>home</button>
                  <button style="width: 6em" on:click={e => { $tab.value = 2 }}>garden</button>
                  <div class='container' style="height: 160px">
                     <remount-view>
                        {If(($tab() === 1), /* $tab1, */
                           <div>
                              <p>🏠</p>
                              <div style="font-size: x-small">
                                 <Counter label='home'></Counter>
                              </div>
                           </div>
                        )}
                        {Else(
                           <div>
                              <p>🌺 🍄 🍀</p>
                              <div class="garden" style="font-size: x-small">
                                 <Counter label='garden'></Counter>
                              </div>
                           </div>
                        )}
                        <aside>(state is preserved!!)</aside>
                     </remount-view>
                  </div>
               </div>
            </>
         }}
         </section>

         <hr></hr>
         <h3>Mix and match activation types</h3>
         <section>{() => {
            const $tab = Ion(1)

            return <>
               <code>
                  <span class="bracket">{`{`}</span>{`If($condition, 'remount',`}<br />
                  {`   <Component></Component>`}<br />
                  {`)`}<span class="bracket">{`}`}</span>
               </code>
               <p>
                  {`On rare occasions you may want to create-destroy most views 
                  in a series but preserve the state of a particular view. Activation
                  types may be mixed and matched by passing 'create' or 'remount'
                  as the second to last parameter of the conditional function (If/ElseIf/Else)`}
               </p>
               <div class='container'>
                  <button style="width: 5em" on:click={e => { $tab.value = 1 }}>home</button>
                  <button style="width: 6em" on:click={e => { $tab.value = 2 }}>garden</button>
                  <button style="width: 5em" on:click={e => { $tab.value = 0 }}>door</button>
                  <div class='container' style="height: 160px">
                     {If(($tab() === 1),
                        <div>
                           <p>🏠</p>
                           <div style="font-size: x-small">
                              <Counter label='home'></Counter>
                              <aside>(created: state is NOT preserved!)</aside>
                           </div>
                        </div>
                     )}
                     {ElseIf(($tab() === 2), 'remount',
                        <div>
                           <p>🌺 🍄 🍀</p>
                           <div class="garden" style="font-size: x-small">
                              <Counter label='garden'></Counter>
                              <aside>(mounted: state is preserved!!)</aside>
                           </div>
                        </div>
                     )}
                     {Else('remount',
                        <div>
                           <span class='emoji'>😳</span>
                           <p>nothing to see here ...</p>
                        </div>
                     )}
                  </div>
               </div>
            </>
         }}
         </section>

         <hr></hr>
         <h3>View Lifecycle Hooks</h3>
         <section>{() => {
            const $tab = Ion(1)
            const logs = Ionic([] as string[])

            function log(msg: string) {
               logs.push(msg)
            }

            return <>
               <code>
                  {`atMounted(initial => {`}<br />
                  {`   console.log('the very first mount?', initial)`}<br />
                  {`})`}
               </code>
               <p>
                  {`Lifecycle hooks are available to perform tasks after view has mounted 
                  and before the view is unmounted. Views cast the following hooks:`}
                  <ul>
                     <li><code>atCreated</code> casted on the initial mount</li>
                     <li><code>atRemounted</code> casted when remounted</li>
                     <li><code>atMounted</code> casted on initial mount and remounts</li>
                     <li><code>atDiscard</code> casted just before view is destroyed</li>
                     <li><code>atDemount</code> casted just before view unmounts but not when destroyed</li>
                     <li><code>atUnmount</code> casted just before view is destroyed or unmounted</li>
                  </ul>
                  {`Here the Counter component calls each of the 
                  lifecycle hooks and logs them. WARNING: There will be obnoxious dialog boxes popping up as you navigate the tabs`}
               </p>
               <div class='container'>
                  <button style="width: 5em" on:click={e => { $tab.value = 1 }}>home</button>
                  <button style="width: 6em" on:click={e => { $tab.value = 2 }}>garden</button>
                  <div class='container' style="height: 160px">
                     {If(($tab() === 1),
                        <div>
                           <p>🏠</p>
                           <div style="font-size: x-small">
                              <Counter label='home' logHook={log}></Counter>
                              <aside>(created: state is NOT preserved!)</aside>
                           </div>
                        </div>
                     )}
                     {ElseIf(($tab() === 2), 'remount',
                        <div>
                           <p>🌺 🍄 🍀</p>
                           <div class="garden" style="font-size: x-small">
                              <Counter label='garden' logHook={log}></Counter>
                              <aside>(mounted: state is preserved!!)</aside>
                           </div>
                        </div>
                     )}
                     <aside style="position: fixed; width: 180px; top: 0; left: 0; bottom: 0; background-color: #eee">
                        LOGS:
                        <ul>
                           {For(logs, $log =>
                              <span style="font-size: x-small">
                                 - {$log}<br />
                              </span>
                           )}
                        </ul>
                     </aside>
                  </div>
               </div>
            </>
         }}
         </section>
      </article >
   )
      .style(css`
      hr {
         border: none;
         border-bottom: 1px solid #ddd;
      }

      section {
         margin-bottom: 6em
      }

      article {
         text-align: left
      }

      aside {
         padding: 1em;
         font-size: small;
      }

      .container {
         text-align: center
      }

      code {
         padding-block: .5em;
         white-space: pre;
         background-color: #eee;
      }

      .code {
         padding: .25em .75em;
         background-color: #eee;
         font-family: monospace;
         border-radius: 5px;
      }

      .garden button {
         background-color: #efd;
      }

      .emoji {
         font-size: xx-large
      }

      .bracket {
         color: #999
      }

      button {
         text-align: center;
         margin: .25em
      }
   `)
}



export function TestDerivedConditional() {
   const $count = Ion(0, {
      increment() {
         this.value++
      },
      decrement() {
         this.value--
      }

   })
   const $doubleCount = Ion(() => $count() * 2)

   const $aActive = Ion(true, {
      toggle() {
         $aActive.value = !$aActive.value
      }
   })

   const $bActive = Ion(true, {
      toggle() {
         $bActive.value = !$bActive.value
      }
   })


   const $cActive = Ion(false, {
      toggle() {
         $cActive.value = !$cActive.value
      }
   })


   const $dActive = Ion(false, {
      toggle() {
         $dActive.value = !$dActive.value
      }
   })



   return template(
      <article>
         <div>{$count}</div>
         <div>{($count() + 1)}</div>
         <div>{$doubleCount}</div>
         <button on:click={e => $count.increment()}>+</button>
         <button on:click={e => $count.decrement()}>-</button>

         {If(($doubleCount() > 3), 'create',
            <p>(0) doublecount is greater than 3!</p>
         )}


         {If(($doubleCount() > 0), 'create',
            <p>(1) doublecount is greater than 0!</p>
         )}
         {If(($count() > 3), 'create',
            <p>(2) count is greater than 3!</p>
         )}
         {If(($count() > 0), 'create',
            <p>(3) count is greater than 0!</p>
         )}
         {/*          

         {If($active,
            <p>doublecount is greater than 3!</p>
         )}
         {If(($doubleCount() > 3),
            <p>doublecount is greater than 3!</p>
         )}
         {If(($doubleCount() > 0), 'remount',
            <p>doublecount is greater than 0!</p>
         )}
         {If(($count() > 3), 'remount',
            <p>count is greater than 3!</p>
         )}
         {If(($count() > 0), 'show',
            <p>count is greater than 0!</p>
         )}

         {If(($doubleCount() > 3), 'create',
            <p>doublecount is greater than 3!</p>
         )}
         {If(($doubleCount() > 0), 'remount',
            <p>doublecount is greater than 0!</p>
         )}
         {If(($count() > 3), 'remount',
            <p>count is greater than 3!</p>
         )}
         {If(($count() > 0), 'show',
            <p>count is greater than 0!</p>
         )}

         <vvv:mount />
         {If($doubleCount() > 3, 'create',
            <p>doublecount is greater than 3!</p>
         )}
         {If($doubleCount() > 0, 'remount',
            <p>doublecount is greater than 0!</p>
         )}
         {If($count() > 3, 'remount',
            <p>count is greater than 3!</p>
         )}
         {If($count() > 0, 'show',
            <p>count is greater than 0!</p>
         )} */}

         {/* <div>{$count}</div> */}
         {/* <div>{$doubleCount}</div> */}
         {/* <button on:click={e => $aActive.toggle()}>toggle A (mount)</button> */}
         {/* <button on:click={$bActive.toggle}>toggle B (create)</button> */}
         {/* <button on:click={$cActive.toggle}>toggle C (mount)</button>
         <button on:click={$dActive.toggle}>toggle D (show)</button> */}
         {/* <button on:click={$count.decrement}>-</button> */}
         {/* {If($aActive, 'create',
            <p>A ACTIVE</p>
         )}
         {ElseIf($bActive, 'remount',
            <p>A GONE f</p>
         )}
         {Else('show',
            <p>A GONE</p>
         )}
         {If($bActive, 'create',
            <p>B ACTIVE</p>
         )}
         {Else('create',
            <p>B GONE</p>
         )} */}
         {/* {If($cActive, 'remount',
            <p>C ACTIVE</p>
         )}
         {If($dActive, 'show',
            <p>D ACTIVE</p>
         )} */}



      </article>
   )
}