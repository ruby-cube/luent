//@ts-nocheck
import { Component, fromContext, Suspense, teleportTo } from "@rue/lumo";
import { $setup } from "../../../packages/lumo/src/component/X_$setup";
import { noop } from "@rue/utils";
import { M } from "vite/dist/node/types.d-aGj9QkWt";
export function ListBlock(setup = $setup()) {

   const $List = PortNode({ send: true, settle: true, receive: 300 }, $list =>      
         For($list, o => o, (item, $index) =>
         <transit.node>
            <p>[x] {item}</p>,
         </transit.node>
      )
   )
const hi = () =>
   <$List for={$list}/>

   const $ItemBlock = LazyNode({
      load: () => {
         const promise = import('./SideBlock').then(({ SideBlock }) => SideBlock)
         return new Promise((resolve: (SideBlock: ComponentSetup) => void, reject) => {
            setTimeout(() => {
               promise.then((SideBlock) => {
                  resolve(SideBlock)
               })
            }, 6000) // simulate network latency
         })
      },
      onIdle: true,
      with: fade
   });


   // const $ItemBlock = SuspenseNode({
   //     Pending: ItemBlock,
   //     PlaceHolder: (props) =>
   //         Component(
   //             <div>Eep! I'm not ready {props.frog}</div>
   //         )
   //     ,
   //     Error: (props) =>
   //         Component(
   //             <div>{props.error}</div>
   //         )
   //     ,
   // });

   // const $ItemBlock = TentativeNode({
   //     Tentative: ItemBlock,
   //     Error: ({ error }) =>
   //         Component(
   //             <div>{error}</div>
   //         )
   // })
   class Frog {
      name = 'sir robin'
   }

   const [$RouterView, RouterLink] = Router({

   })

   const [$MainContent, $mainContent] = MorphicNode({
      hello: input =>
         <div>hello</div>
      ,
      bye: input =>
         <div>good bye</div>

   }, { type: 'mount' })

   const fade = Transition({

   })

   const moveUpDown = Animation({

   })

   let active = true;
   let ready = true;

   if (active) {

   }
   else if (ready) {

   }
   else {

   }
   for (const item of items) {

   }

   return Component(
      <>
         <div>
            <div>
               <$ If={$active}>
                  <SomeComponent />
               </$>
               <$ ElseIf={$ready}>
                  <SomeComponent />
               </$>
               <$ Else>
                  <SomeComponent />
               </$>
            </div>
            <div>
            <swap:show-hide/>
               {[If($active,
                  <SomeComponent />
               ),
               ElseIf($ready,
                  <div>hi ho</div>
               ),
               Else(
                  <SomeComponent />
               )]}
            </div>
            <div>
               {If($active,
                  <SomeComponent />
               )}
               {ElseIf($ready,
                  <div>hi ho</div>
               )}
               {Else(
                  <SomeComponent />
               )}
            </div>
            <div>
               {[
                  If($active,
                     <SomeComponent />
                  ),
                  ElseIf($ready,
                     <SomeComponent />
                  ),
                  Else(
                     <SomeComponent />
                  )
               ]}
            </div>
            <div>
               <$ If={$active}>
                  <div>hi ho</div>
               </$>
               <$ ElseIf={$ready}>
                  <div>hi ho</div>
               </$>
               <$ Else>
                  <div>hi ho</div>
               </$>
            </div>
            <div>
               {[
                  If($active,
                     <div>hi ho</div>
                  ),
                  ElseIf($ready,
                     <div>hi ho</div>
                  ),
                  Else(
                     <div>hi ho</div>
                  )
               ]}
            </div>
            <div>
               <If case={$active}>
                  <SomeComponent />
                  <div>hi ho</div>
               </If>
               <ElseIf case={$ready}>
                  <div>hi ho</div>
                  <div>hi ho</div>
               </ElseIf>
               <Else>
                  <div>hi ho</div>
                  <div>hi ho</div>
               </Else>
            </div>

            <div>
               {[If($active, <>
                  <SomeComponent />
                  <div>hi ho</div>
               </>
               ),
               ElseIf($ready, <>
                  <div>hi ho</div>
                  <div>hi ho</div>
               </>
               ),
               Else(<>
                  <div>hi ho</div>
                  <div>hi ho</div>
               </>
               )]}
            </div>

            <div>
               {[
                  If($active, <>
                     <SomeComponent />
                     <div>hi ho</div>
                  </>
                  ),
                  ElseIf($ready, <>
                     <div>hi ho</div>
                     <div>hi ho</div>
                  </>
                  ),
                  Else(<>
                     <div>hi ho</div>
                     <div>hi ho</div>
                  </>
                  )
               ]}
            </div>

            <div>
               <$ Match={$key}>
                  <$ Case={'funny'}>
                     <p>hi ho</p>
                     <p>hi ho</p>
                  </$>
                  <$ Case={'store'}>
                     <p>hi ho</p>
                     <p>hi ho</p>
                  </$>
                  <$ Default>
                     <p>hi ho</p>
                     <p>hi ho</p>
                  </$>
               </$>
            </div>

            <port-node type='todos' send='200' settle='200' receive='30'>
               {For($list, o => o, (item, $index) =>
                  <transit-node>
                     <p>[x] {item}</p>,
                  </transit-node>
               )}
            </port-node>

            <div>
               <Column class='some-thing active' width={$width}>
                  {m => <>
                     <SomeComponent />
                     login: {m.fullname}
                     <SomeComponent />
                  </>}
               </Column>
            </div>
            <div>
               <Column class='some-thing active' width={$width}>
                  {{
                     title: m =>
                        <SomeComponent>
                           login: {m.fullname}
                        </SomeComponent>
                     ,
                     description: m =>
                        <div>{m.description}</div>
                  }}
               </Column>
            </div>
            <div>
               <suspense-node await={$data} standin={renderLoadingView}>
                  {(o = SelectionKit(), <>
                     <SomeComponent/>
                     login: {o.fullname}
                     <SomeComponent/>
                  </>)}
               </suspense-node>
            </div>
            <div>
               <dubious-node standby={renderError}>
                  <SomeComponent />
                  <SomeComponent />
               </dubious-node>
            </div>

            <h1>Choose something</h1>

            <phasic-node>
               {For({ hold: Loading, catch: Error },
                  <>
                     <Item dog={$dog} />
                     <div>
                        <p>hi ho</p>
                        <p>hi ho</p>
                     </div>
                  </>
               )}
            </phasic-node>

            <h1>hello</h1>
            {If($active,
               <p>hey</p>
            )}
            <div>
               <p>hi ho</p>
               <p>hi ho</p>
            </div>

            <$List />

            <h1>hello</h1>
            <context-node with={{ [FROG]: new Frog(), [_cat_]: cat }}>
               {If($active,
                  <p>hey</p>
               )}
            </context-node>



            <context-node with={{ [FROG]: frog, [_cat_]: cat }}>
               <List />
               <h1>hello</h1>
               <div>
                  <Item></Item>
                  <p>hi ho</p>
                  <p>hi ho</p>
               </div>
            </context-node>

            <div>
               <p>hi ho</p>
               <p>hi ho</p>
            </div>

            <h1>hello</h1>
            {[
               If($active(),
                  <p>hey</p>
               ),
               Else(
                  <p>Bye</p>
               )
            ]}
            <div>
               <transit-node io={fade}>
                  <p>hi ho</p>
               </transit-node>
               <p>hi ho</p>
            </div>

            <h1>hello</h1>
            <div>
               <phasic-node with={fade}>
                  {[If($active(), { type: 'mount' },
                     <div>
                        <p>hey</p>
                     </div>
                  ),
                  ElseIf($ready(),
                     <div>
                        <p>hey</p>
                     </div>
                  )]}
               </phasic-node>
            </div>

            <div>
               {[If($active(), { 'with': fade, type: 'mount' },
                  <div>
                     <p>hey</p>
                  </div>

               ),
               ElseIf($ready(),
                  <div>
                     <p>hey</p>
                  </div>
               )]}
            </div>

            <div>
               {swap({ 'with': fade, type: 'mount' },
                  If($active(),
                     <div>
                        <p>hey</p>
                     </div>

                  ),
                  ElseIf($ready(),
                     <div>
                        <p>hey</p>
                     </div>
                  )
               )}
            </div>
            <div>
               <phasic-node with={fade({ duration: 30 })}>
                  {{ swap: 'show/hide' }}
                  {[If($active, 'mount',
                     <div>
                        <p>hey</p>
                     </div>

                  ),
                  ElseIf($ready,
                     <div>
                        <p>hey</p>
                     </div>
                  )]}
               </phasic-node>
            </div>
            <div>
               <phasic-node with={fade({ duration: 30 })}>
                  <swap:show-hide/>
                  {If($active, 'mount',
                     <div>
                        <p>hey</p>
                     </div>
                  )}
                  {ElseIf($ready,
                     <div>
                        <p>hey</p>
                     </div>
                  )}
               </phasic-node>
            </div>
            <div>
               <phasic-node swap='show-hide' with={fade({ duration: 30 })}>
                  {If($active, 'mount',
                     <div>
                        <p>hey</p>
                     </div>
                  )}
                  {ElseIf($ready,
                     <div>
                        <p>hey</p>
                     </div>
                  )}
               </phasic-node>
            </div>

            {/* 

                // should preserve type be applied to the entire series or eachs statement?

                // show
                // create
                // remount

                // match/case
                // if
                // morphic node
                <Try catch={Error} setup={SelectionKit}>{o =>
                    <>
                        <h1>hello</h1>
                        <div>
                            <Item></Item>
                            <p>hi ho</p>
                            <p>hi ho</p>
                        </div>
                    </>
                }</Try> */}


            {/* <Suspense hold={Placeholder} catch={Error} setup={SelectionKit}>{o =>
                    <>
                        <h1>hello</h1>
                        <div>
                            <p>hi ho</p>
                            <p>hi ho</p>
                        </div>
                    </>
                }</Suspense> */}

            {Await({ hold: <p>loading...</p>, catch: Error },
               (o = SelectionKit(),
                  <>
                     <h1>hello</h1>
                     <div>
                        <p>hi ho</p>
                        <p>{o.name}</p>
                     </div>
                  </>
               )
            )}

            <portal-node to='body'>
               <p>hi</p>
            </portal-node>

            <div>Stuff here</div>


            {/* {If($active()),
                    <p>hello world</p>
                }
                {ElseIf($broken()),
                    <p value={o.$selection}>bye world</p>
                }
                {Else,
                    <p>ok world</p>
                } */}

            {
               // compiled:
               // - transform sequence expression to array
               // - transofrm condition calls to functions $active() to $active and list.length === 0 to () => list.length === 0
            }

            <h1>Something Here</h1>

            {[
               If($active, <>
                  <p>hello world</p>
               </>),
               ElseIf($broken, { setup: SelectionKit }, m => <>
                  <p value={m.$selection}>bye world</p>
                  <p>bye world</p>
               </>),
               Else(<>
                  <p>ok world</p>
                  <p>bye world</p>
               </>)
            ]}

            {[
               If($active,
                  <p>hello world</p>
               ),
               ElseIf($broken, m => <>
                  <p value={m.$selection}>bye world</p>
                  <p>bye world</p>
               </>),
               Else(<>
                  <p>ok world</p>
                  <p>bye world</p>
               </>)
            ]}

            <div>
               <If case={$active}>
                  <p>hello world</p>
               </If>
               <ElseIf case={$broken}>
                  <p value={o.$selection}>bye world</p>
               </ElseIf>
               <Else>
                  <p>ok world</p>
                  <p>bye world</p>
               </Else>
            </div>


            {
               morphic({ with: fade },
                  If($active, { type: 'show' }, o =>
                     <p>hello world</p>,
                  ),
                  ElseIf($broken, (o = SelectionKit(),
                     <p value={o.$selection}>bye world</p>
                  )),
                  Else({ with: fade }, () =>
                     <p>ok world</p>
                  )
               )}

            <div value={{ z: $active() }}>{{ z: $count() }}</div>

            <div>
               {If(open,
                  If(entering,
                     <p>Hi</p>
                  ),
                  Else(
                     <p>Bye</p>
                  )
               )}
            </div>

            <h1>Something Here</h1>
            {(
               If($active, { type: 'show' }, o =>
                  Context(
                     w(COUNT, o.$count),
                     w(FROG, ionize(Frog())),
                     <p>
                        hello world
                        <button>click</button>
                     </p>
                  )
               )
            )}

            <h1>Something Here</h1>
            {(
               If($broken, { use: SelectionKit }, o =>
                  Context(
                     where(COUNT, o.$count),
                     where(FROG, o.$frog),
                     <p value={o.$selection}>bye world</p>
                  )
               ),
               Else({ with: fade },
                  <p>ok world</p>
               )
            )}

            {If($active,
               [
                  If($broken,
                     <p>brocken</p>
                  ),
                  Else(
                     <div>help</div>
                  )
               ]
            )}


            {/* {morphic(
                    If($list.length === 0, 'show', fade, SelectionKit, o =>
                        <p>hello world</p>
                    ),
                    If($broken(),
                        <p>bye world</p>
                    ),
                    Else(
                        <p>ok world</p>
                    )
                )} */}
            {/* , mount_unmount, create_destroy */}


            <button on:click={increment}                >
               Clicked {count} {count === 1 ? 'time' : 'times'}
            </button>


            <footer>(c) 2024</footer>

            <h1>How is this?</h1>
            {If($editable,
               <p>
                  Flies in and out
               </p>
            )}
            <footer>(c) 2024</footer>

            <h1>How is this?</h1>

            <footer>(c) 2024</footer>

            <h1>How is this?</h1>

            <footer>(c) 2024</footer>

            <h1>How is this?</h1>
            {If($editable,
               <p>Flies in and out</p>,
               <div>sldof</div>
            )}
            <footer>(c) 2024</footer>

            {[
               If($editable,
                  <p>hello world</p>
               ),
               ElseIf($broken,
                  <p>bye world</p>
               ),
               Else(
                  <p>ok world</p>
               )
            ]}


            <h1>Do something</h1>
            <div>
               <li>title</li>
               <input />
            </div>

            <div>
               <phasic.node with={fade}>
               <swap />
                  {Match(key,
                     Case('hello',
                        <p>hello world</p>
                     ),
                     Case('bye',
                        <p>bye world</p>
                     ),
                     Default(
                        <p>ok world</p>
                     )
                  )}
               </phasic.node>
            </div>

            <div>
               {match($key, { 'with': fade },
                  Case('hello',
                     <p>hello world</p>
                  ),
                  Case('bye',
                     <p>bye world</p>
                  ),
                  Default(
                     <p>ok world</p>
                  )
               )}
            </div>

            <div>
               {Match({ z: $key },
                  Case('hello',
                     <p>hello world</p>
                  ),
                  Case('bye',
                     <p>bye world</p>
                  ),
                  Default(
                     <p>ok world</p>
                  )
               )}
            </div>
            <footer>(c) 2024</footer>

                // winner
            <h1>Do something</h1>
            <div>
               <li>title</li>
               <input />
            </div>
            {morphic(
               If($list.length === 0,
                  <p>hello world</p>
               ),
               If($broken(),
                  <p>bye world</p>
               ),
               Else(
                  <p>ok world</p>
               )
            )}
            <footer>(c) 2024</footer>

            <h1>Choose something</h1>
            {Conditional({ setup: WeekKit }, o => [
               If($list.length === 0,
                  <p>hello world</p>
               ),
               If($broken(),
                  <p>bye world</p>
               ),
               Else(
                  <p>ok world</p>
               )
            ])}

            <h1>Choose something</h1>

            <phasic-node>{[
               If($list.length === 0, { setup: MouseKit }, o => [
                  <p>hello world</p>,
                  <p>hello world</p>
               ]),
               ElseIf($broken(), [
                  <p>bye world</p>,
                  <p>bye world</p>
               ]),
               Else([
                  <p>ok world</p>,
                  <p>ok world</p>
               ])
            ]}</phasic-node>

            <phasic.node with={fade}>
               {[If({ z: $active }, (o = 9,
                  <>
                     <transit.node>
                        <p>hello world</p>
                     </transit.node>
                     <transit.node>
                        <p>hello world</p>
                     </transit.node>
                  </>
               )),
               ElseIf($broken,
                  <>
                     <p>bye world</p>
                     <p>bye world</p>
                  </>
               ),
               Else(
                  <>
                     <p>ok world</p>
                     <p>ok world</p>
                     <portal.node to='#body'>

                     </portal.node>
                  </>
               )]}
            </phasic.node>


            <phasic.node with={fade}>
               {Match(key, { type: 'show' },
                  Case('hello',
                     <p>hello world</p>
                  ),
                  Case('bye',
                     <p>bye world</p>
                  ),
                  Default(
                     <p>ok world</p>
                  )
               )}
            </phasic.node>

            <phasic-node>
               <If case={$list.length === 0} setup={MouseKit}>{o => <>
                  <p>hello world</p>
                  <p>hello world</p>
               </>}</If>
               <ElseIf case={$broken()}>
                  <p>bye world</p>
                  <p>bye world</p>
               </ElseIf>
               <Else>
                  <p>bye world</p>
                  <p>bye world</p>
               </Else>
            </phasic-node>

            <item-port type='todos'>

               {For({ z: $list }, o => o.id, (item, $index, o) =>
                  <p>[x] {item}</p>,

               )}
            </item-port>

            <item-port type='todos'>{
               For($list, (item, $index, o) =>
                  <p>[x] {item}</p>
               )
            }</item-port>

            <phasic-node>
               {If($list.length === 0)}
               <p>hello world</p>
               <$ else if={$broken()}>
                  <p>bye world</p>
               </$>
               <$ else>
                  <p>bye world</p>
               </$>
            </phasic-node>

            <h1>Choose something</h1>
            {If($list.length === 0,
               <p>hello world</p>
            )}
            {If($broken, // this is a new conditional series unrelated to the above
               <p>bye world</p>
            )}

            <h1>Do something</h1>

            <port.node type='todos' send='200' settle='200' receive='30'>
               {For($list, o => o, (item, $index) =>
                  <transit.node>
                     <p>[x] {item}</p>,
                  </transit.node>
               )}
            </port.node>

            <port.node type='todos' receive settle send>
               {For($list, (item, $index) =>
                  <p>[x] {item}</p>,
               )}
            </port.node>

            <h1>Do something</h1>
            {freeze(
               For(list, (item, $index) =>
                  <p>[x] {item}</p>
               ),
               Or(
                  <p>Nothing here</p>
               )
            )}
            {[
               For(list, (item, $index, o) =>
                  <p>[x] {item}</p>
               )
            ]}

            <h1>Do something</h1>
            {morphic(fade,
               For($list, { key: 'id', use: SelectionKit }, (item, $index, o) =>
                  <p>[x] {item}</p>
               )
            )}

            <h1>Do something</h1>
            {For($list, { key: 'id', use: SelectionKit, }, (item, $index, o) =>
               <p>[x] {item}</p>
            )}

            <h1>Do something</h1>
            <div>
               <li>title</li>
               <input />
            </div>
            {morphic(fadeInOut,
               For($list,
                  <p>[x] {item}</p>
               )
            )}
            <footer>(c) 2024</footer>

            <h1>Do something</h1>
            <div>
               <li>title</li>
               <input />
            </div>
            {For($list,
               <p>[x] {item}</p>
            )}
            <footer>(c) 2024</footer>

            <h1>Teleport something</h1>
            {TeleportTo('body',
               <p>Weee!</p>
            )}





            <$MainContent as='hello' ref={$mainContent} />
            <button on:click={$mainContent.as('bye')}>bye</button>
         </div >
      </>
   )
}

function Lolly() {
   const $frog = ionize({ name: 'kermit' })

   return Component(
      <>
         {Context(
            set(FROG, $frog),
            set(COUNT, 0),
            <Dobby>Precioussss</Dobby>
         )}
      </>
   )
}


function Dobby() {

}

export function NumberedBoxes(input = fromTag({ num: v<number> })) {
   const { num } = prep(input)

   return Component(
      <>
         <div class='box'>{count}</div>
         {[
            Repeat(num, (count, index) =>
               <div class='box'>{count}</div>
            )
         ]}
         <div class='box'>{count}</div>
      </>
   )
}