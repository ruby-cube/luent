//@ts-nocheck
import { Component, fromContext, teleportTo } from "@rue/lumo";
import { $setup } from "../../../packages/lumo/src/component/$setup";
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
                {morphic({ with: fade },
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

                <div freeze>{$count()}</div>
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
                {morphic(
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
                {morphic(
                    If($active, { type: 'show/hide', use: CounterKit }, o =>
                        Context.with(COUNT, o.$count)
                            .around(
                                <p>
                                    hello world
                                    <button>click</button>
                                </p>
                            )
                    )
                )}
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
                    <p>Flies in and out</p>
                )}
                <footer>(c) 2024</footer>

                {morphic(
                    If($editable,
                        <p>hello world</p>
                    ),
                    ElseIf($broken,
                        <p>bye world</p>
                    ),
                    Else(
                        <p>ok world</p>
                    )
                )}

                {morphic(fade(10), 'show/hide',
                    If($active,
                        <div>hello</div>
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
                {(
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

                <h1>Choose something</h1>
                {If($list.length === 0,
                    <p>hello world</p>
                )}
                {If($broken, // this is a new conditional series unrelated to the above
                    <p>bye world</p>
                )}

                <h1>Do something</h1>
                {freeze(
                    For(list, (item, $index, o) =>
                        <p>[x] {item}</p>
                    )
                )}

                <h1>Do something</h1>
                {freeze(
                    For(list, (item, $index, o) =>
                        <p>[x] {item}</p>
                    ),
                    Empty(
                        <p>Nothing here</p>
                    )
                )}

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
                <button onclick={$mainContent.as('bye')}>bye</button>
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