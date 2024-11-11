//@ts-nocheck
import { Component, fromContext, teleportTo } from "@rue/lumo";
import { $setup } from "../../../packages/lumo/src/component/X_$setup";
export function ListBlock(setup = $setup()) {

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
        Temp: (props) =>
            Component(<div>Eep! I'm not ready {props.frog}</div>)
        ,
        // timeout: 5000,
        Error: (props) =>
            Component(<div>{props.error}</div>)
        ,
        with: fade
    });


    const $ItemBlock = SuspenseNode({
        Pending: ItemBlock,
        PlaceHolder: (props) =>
            Component(
                <div>Eep! I'm not ready {props.frog}</div>
            )
        ,
        Error: (props) =>
            Component(
                <div>{props.error}</div>
            )
        ,
    });

    const $ItemBlock = TentativeNode({
        Tentative: ItemBlock,
        Error: ({ error }) =>
            Component(
                <div>{error}</div>
            )
    })

    const [$RouterView, RouterLink] = Router({

    })

    const [$MainContent, $mainContent] = MorphicNode({
        Hello(props) {
            return Component(
                <div>hellow</div>
            )
        },
        Bye(props) {
            return Component(
                <div>hellow</div>
            )
        }
    }, { with: fade, type: 'mount/unmount' })

    const fade = Transition({

    })

    const moveUpDown = Animation({

    })



    return Component(
        <>
            <div>
                <h1>Choose something</h1>

                <h1>hello</h1>
                {If($active,
                    <p>hey</p>
                )}
                <div>
                    <p>hi ho</p>
                    <p>hi ho</p>
                </div>

                <h1>hello</h1>
                <Context with={{
                    [FROG]: new Frog(),
                    [CAT]: cat
                }}>
                    <Morph with={fadeInOut}>{(
                        If($active,
                            <p>hey</p>
                        )
                    )}</Morph>
                </Context>

                <Context with={[
                    [FROG, new Frog()],
                    [CAT, cat]
                ]}>
                    <Transition {...tab_fade_slide} in={delay(30).fade()}>{(
                        If($active,
                            <p transition={fade(200)} onTransitionStart={e => console.log('hi')} class='frog'>
                                hey
                            </p>
                        )
                    )}</Transition>
                    <Portal to='body'>
                        <p>hi</p>
                    </Portal>
                </Context>

                <Context with={{ [FROG]: frog, [CAT]: cat }}>
                    <Morph with={fadeInOut}>{(
                        If($active,
                            <p>hey</p>
                        )
                    )}</Morph>
                    {teleportTo('body',
                        <p>hi</p>
                    )}
                </Context>

                <div>
                    <p>hi ho</p>
                    <p>hi ho</p>
                </div>

                <h1>hello</h1>
                <Frozen>{[
                    If($active(),
                        <p>hey</p>
                    ),
                    Else(
                        <p>Bye</p>
                    )
                ]}</Frozen>
                <div>
                    <i-o io={fade}>
                        <p>hi ho</p>
                    </i-o>
                    <p>hi ho</p>
                </div>

                <h1>hello</h1>
                <phase-change io={fade}>{[
                    If($active(),
                        <div>
                            <p>hey</p>
                            <i-o io={slideleft} on:start={doSomething}>
                                <List />
                                <h1>hello</h1>
                                <div>
                                    <Item></Item>
                                    <p>hi ho</p>
                                    <p>hi ho</p>
                                </div>
                            </i-o>
                            <hr />
                            <i-o io={slideright}>
                                <Article />
                            </i-o>
                            <p>hi ho</p>
                        </div>
                    ),
                    Else(
                        <p>Bye</p>
                    )
                ]}</phase-change>

                <Try catch={Error} setup={SelectionKit}>
                    <h1>hello</h1>
                    <div>
                        <Item></Item>
                        <p>hi ho</p>
                        <p>hi ho</p>
                    </div>
                </Try>

                <Suspense hold={Placeholder} catch={Error} setup={SelectionKit}>{o => [
                    <h1>hello</h1>,
                    <div>
                        <p>hi ho</p>
                        <p>hi ho</p>
                    </div>
                ]}</Suspense>

                {teleportTo('body',
                    <p>hi</p>
                )}

                <Portal to='body'>
                    <p>hi</p>
                </Portal>

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

                <Morph type='create/destroy'>{[
                    If($active(),
                        <p>hello world</p>
                    ),
                    ElseIf($broken(), { use: SelectionKit }, o => [
                        <p value={o.$selection}>bye world</p>,
                        <hr />
                    ]),
                    Else(
                        <p>ok world</p>,
                        <p>bye world</p>
                    )
                ]}</Morph>

                <Morph type='show/hide'>{(
                    If($active(),
                        <p>hello world</p>,
                    ),
                    ElseIf($broken(), { use: SelectionKit }, o => [
                        <p value={o.$selection}>bye world</p>,
                        <hr />
                    ]),
                    Else(
                        <p>ok world</p>,
                        <p>bye world</p>
                    )
                )}</Morph >

                <$Node type='show/hide'>
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
                </$Node>


                {
                    morphic({ with: fade },
                        If($active, { type: 'show/hide' }, o =>
                            <p>hello world</p>,
                        ),
                        ElseIf($broken, { use: SelectionKit }, o =>
                            <p value={o.$selection}>bye world</p>
                        ),
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
                    If($active, { type: 'show/hide', use: CounterKit }, o =>
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

                <Frog.Provider value={new Frog()}>
                    <Article content={fromContext(Cat)} />
                </Frog.Provider>

                {Context.with(Frog, new Frog()).around(
                    <Article content={fromContext(Cat)} />
                )}
                {Context
                    .with(Frog, new Frog())
                    .with(Cat, new Cat())
                    .around(
                        <Article content={fromContext(Cat)} />
                    )}

                {Context
                    .with(Frog, new Frog())
                    .with(Cat, new Cat())
                    .around(morphic(
                        If($list.length === 0, {
                            with: fadeInOut,
                            use: SelectionKit
                        }, o =>
                            <p>hello world</p>
                        ),
                        ElseIf($broken,
                            <p>bye world</p>
                        ),
                        Else(
                            <p>ok world</p>,
                            teleportTo('body',
                                <dialog></dialog>
                            )
                        )
                    ), teleportTo('body',
                        <dialog></dialog>
                    ))}

                {Context
                    .with(Frog, new Frog())
                    .with(Cat, new Cat())
                    .around(
                        If($list.length === 0, {
                            with: fadeInOut, use: SelectionKit
                        }, o =>
                            <p>hello world</p>
                        ),
                        ElseIf($broken,
                            <p>bye world</p>
                        ),
                        Else(
                            <p>ok world</p>
                        )
                    )}

                <button on:click={increment}                >
                    Clicked {count} {count === 1 ? 'time' : 'times'}
                </button>

                <h1>How is this?</h1>
                {morphic(fadeInOut,
                    If($editable,
                        <p>
                            Flies in and out
                        </p>
                    ),
                    If($active,
                        <div>
                            hi
                        </div>
                    ),
                    Else(
                        <article>
                            le sigh.
                        </article>
                    )
                )}
                <footer>(c) 2024</footer>

                <h1>How is this?</h1>
                {If($editable,
                    <p>
                        Flies in and out
                    </p>
                )}
                <footer>(c) 2024</footer>

                <h1>How is this?</h1>
                {freeze(
                    If($editable,
                        <p>
                            Flies in and out
                        </p>
                    )
                )}
                <footer>(c) 2024</footer>

                <h1>How is this?</h1>
                {morphic(fadeInOut,
                    If($editable,
                        <p>
                            Flies in and out
                        </p>
                    )
                )}
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

                {morphic(fade(10), 'show/hide',
                    If($active,
                        <div>hello</div>,
                        <p>how</p>
                    ),
                    ElseIf($something, { in: fly({ duration: 10 }), out: fade },
                        <div>bye</div>
                    ),
                    ElseIf($something,
                        <div>bye</div>
                    )
                )}

                // winner
                <h1>Do something</h1>
                <div>
                    <li>title</li>
                    <input />
                </div>

                <Morphic with={fade}>
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
                </Morphic>

                {morphic(fade,
                    Match(key,
                        Case('hello',
                            <p>hello world</p>
                        ),
                        Case('bye',
                            <p>bye world</p>
                        ),
                        Default(
                            <p>ok world</p>
                        )
                    )
                )}
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
                <Render setup={WeekKit}>{o => [
                    If($list.length === 0,
                        <p>hello world</p>
                    ),
                    If($broken(),
                        <p>bye world</p>
                    ),
                    Else(
                        <p>ok world</p>
                    )
                ]}</Render>

                <h1>Choose something</h1>
                {If($list.length === 0,
                    <p>hello world</p>
                )}
                {If($broken, // this is a new conditional series unrelated to the above
                    <p>bye world</p>
                )}

                <h1>Do something</h1>

                <Port type='todos' welcome settle item='id' transport>{
                    For($list, (item, $index, o) =>
                        <p>[x] {item}</p>,
                    )}</Port>

                <h1>Do something</h1>
                {[freeze,
                    For(list, (item, $index, o) =>
                        <p>[x] {item}</p>
                    ),
                    Or(
                        <p>Nothing here</p>
                    )
                ]}
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

export function NumberedBoxes(input = getAttributes({ num: v<number> })) {
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