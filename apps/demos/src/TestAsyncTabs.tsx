//@ts-nocheck
import { instantUpdate, Ion, swiftUpdate, Interval, $activeUpdate, getActiveUpdate, Ionic, load, getAwaiting, $suspense, SuspenseIon } from "@rue/quarky";
import "./TestAsyncTabs.css";
import { Await, Meanwhile, component, Suspense, ElseIf, FromTag, Case, Default, For, atMounted, Match, If } from "@rue/lumo";
import { createAsSeries, As } from "../../../packages/lumo/src/conditional/As";

// Modified Demo from Solid.js 

function Loading() {
   return component('loading...')
}

export function TestAsyncTabs() {
   const tabNames = ['Un', 'Deux', 'Trois', 'Quatre', 'Cinq', 'Six'] as const
   const tabViews: any[] = []
   const allTabs = [0, 1, 2, 3, 4, 5]
   const openTabs = Ionic([0, 1, 2, 3, 4, 5])
   const $tab = Ion(0);
   const $count = Ion(0);

   function openTab(tab: number) {
      if (openTabs.indexOf(tab) === -1) {
         openTabs.push(tab)
      }
      $tab.value = tab
   }

   function closeTab(tab: number) {
      openTabs.splice(openTabs.indexOf(tab), 1)
   }

   // setInterval(() => {
   //    $count.value++
   // }, 1000)
   const $tabSuspense = SuspenseIon()

   return component(<>
      <ul class="inline">
         {For(allTabs, m => m, tab => (
            <li class={{ selected: ($tab() === tab) }} on:click={e => { openTab(tab) }}>
               {tabNames[tab]}
            </li>
         ))}
      </ul>
      <hr></hr>
      <ul class="inline">
         {For(openTabs, m => m, tab => (
            <li class={{ selected: ($tab() === tab) }} on:click={e => { $tab.value = tab }}>
               {tabNames[tab]}
               <span style="padding: 1em" on:click={e => {
                  console.log('discarding', tab, $tab())
                  tabViews[tab]?.discard()
                  const index = openTabs.indexOf(tab)
                  if ($tab() === tab) {
                     $tab.value = openTabs[index + 1] ?? openTabs[index - 1]
                     console.log('switch')
                  }
                  closeTab(tab)
                  e.stopPropagation()
               }}>x</span>
            </li>
         ))}
         {/* <li on:click={e => $tab.value = 1.5}>1.5</li>
         <li on:click={e => $tab.value = 1.25}>1.25</li> */}
      </ul>

      {Await($suspense =>
         <div class={{ 'tab': true, 'pending': $suspense }}>
            <remount-view>
               {As($tab, (view) => (
                  <div at:mount={() => (tabViews[$tab()] = view)}>
                     <Tab page={tabNames[$tab()]} count={$count} />
                  </div>
               ))}
               {Default(
                  <div>No tabs open</div>
               )}
            </remount-view>
         </div>
      )}
      {Meanwhile(o => o.initial &&
         <Loading></Loading>
      )}

      {/* </> */}
      {/* {Meanwhile(o => o.initial && 'loading...')} */}
      {/* <Match x={$tab} view='remount'>
            {Case(0, view =>
               <div at:create={() => tabViews[0] = view}>
                  <Tab page="Un" count={$count} />
               </div>
            )}
            {Case(1, view => {
               atMounted(() => console.log('atMounted'))
               return (
                  <div at:mounted={() => { console.log('### creating', 1), tabViews[1] = view }}>
                     <Tab page="Deux" count={$count} />
                  </div>
               )
            })}
            {Case(1.25)}
            {Case(1.5)}
            {Case(2, view =>
               <div at:create={() => tabViews[2] = view}>
                  <Tab page="Trois" count={$count} />
               </div>
            )}
            {Case(3, view =>
               <div at:create={() => tabViews[3] = view}>
                  <Tab page="Quatre" count={$count} />
               </div>
            )}
            {Case(4, view =>
               <div at:create={() => tabViews[4] = view}>
                  <Tab page="Cinq" count={$count} />
               </div>
            )}
            {Case(5, view =>
               <div at:create={() => tabViews[5] = view}>
                  <Tab page={tabNames[5]} count={$count} />
               </div>
            )}
            {Default(
               <div>No tabs open</div>
            )}
         </Match> */}
      {/* <render-view meanwhile={o => o.initial && 'loading...'}>
         <div class={{ 'tab': true, 'pending': $suspense }}>
            <remount-view>
               {If(($tab() === 0), view =>
                  <div at:create={() => tabViews[0] = view}>
                     <Tab page="Un" count={$count} />
                  </div>
               )}
               {ElseIf(($tab() === 1), view => {
                  atMounted(() => console.log('atMounted'))
                  return (
                     <div at:mounted={() => { console.log('### creating', 1), tabViews[1] = view }}>
                        <Tab page="Deux" count={$count} />
                     </div>
                  )
               })}
               {ElseIf(($tab() === 2), view =>
                  <div at:create={() => tabViews[2] = view}>
                     <Tab page="Trois" count={$count} />
                  </div>
               )}
               {ElseIf(($tab() === 3), view =>
                  <div at:create={() => tabViews[3] = view}>
                     <Tab page="Quatre" count={$count} />
                  </div>
               )}
               {ElseIf(($tab() === 4), view =>
                  <div at:create={() => tabViews[4] = view}>
                     <Tab page="Cinq" count={$count} />
                  </div>
               )}
               {ElseIf(($tab() === 5), view =>
                  <div at:create={() => tabViews[5] = view}>
                     <Tab page={tabNames[5]} count={$count} />
                  </div>
               )}
               {Else(
                  <div>No tabs open</div>
               )}
            </remount-view>
         </div>
      </render-view> */}

      {/* // )} */}
      {/* {Meanwhile(o =>
         o.initial && "Loading..."
      )} */}

   </>);
};




const CONTENT = {
   Un: `All by myself... 😭`,
   Deux: `Two peas in a pod 🤢🤢`,
   Trois: `🙈 🙉 🙊\n ...no evil`,
   Quatre: `🌸 🌺 🍄 🍀`,
   Cinq: `fall colors\n🌾 🌰 🍂 🐌 🍁`,
   Six: `🎲`
};

function Tab(input: FromTag<{
   page: keyof typeof CONTENT,
   count: Ion<number>
}>) {
   const { page, $count } = input

   const $localCount = Ion(0, {
      increment() {
         this.value++
      }
   })

   const $time = Ion(undefined, {
      '-fetch': db.fetchTime,
      '-awaited': true
   });

   return component(<>
      <div class="tab-content">
         <p style="font-size: xx-large">{CONTENT[page]}</p>
         This content is for page "{page}" after {($time()?.toFixed())}ms.
         <h3>{$count}</h3>
         <h3>{$localCount}</h3>
         <button on:click={e => $localCount.increment()}>+</button>
      </div>
   </>
   );
};

const db = {
   fetchTime() {
      return new Promise<number>((resolve) => {
         const delay = 2000;
         setTimeout(() => resolve(delay), delay);
      })
   }
}