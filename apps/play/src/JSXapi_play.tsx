//@ts-nocheck
import { Component } from "@rue/lumo";

export function ListBlock() {
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
        Temp(props) {
            return <div>Eep! I'm not ready {props.frog}</div>
        },
        // timeout: 5000,
        Error(props) {
            return <div>{props.error}</div>
        },
        with: fade
    });

    const $ItemBlock = SuspenseNode({
        Component: ItemBlock,
        Temp(props) {
            return Component(
                <div>Eep! I'm not ready {props.frog}</div>
            )
        },
        Error(props) {
            return Component(
                <div>{props.error}</div>
            )
        },
    });

    const $ItemBlock = TentativeNode({
        Component: ItemBlock,
        Error() {
            return Component(
                <div>{props.error}</div>
            )
        }
    })

    const [$RouterView, RouterLink] = ViewNode({

    })

    const [$MainContent, $mainContent] = MorphicNode({
        Hello(props) {
            return Component(<div>hellow</div>)
        },
        Bye(props) {
            return Component(<div>hellow</div>)
        }
    }, render.with(fade))

    const fade = defineTransition({

    })

    return Component(
        <>
            <div>
                <h1>Choose something</h1>
                {If($active()), show.with(fade, useSelectionKit, o =>
                    <p>hello world</p>
                )}
                {ElseIf($broken()), mount.with(useSelectionKit, o =>
                    <p value={o.$selection}>bye world</p>
                )}
                {Else, create.with(fade,
                    <p>ok world</p>
                )}

                {With(fade, <>
                    {If($list.length === 0), show(
                        <p>hello world</p>
                    )}
                    {ElseIf($broken()), mount(
                        <p>bye world</p>
                    )}
                    {Else,
                        <p>ok world</p>
                    }
                </>)}

                <h1>Do something</h1>
                {For($list).key('id').with(fade, useSelectionKit,
                    (item, $index, o) =>
                        <p>[x] {item}</p>
                )}

                <h1>Teleport something</h1>
                {TeleportTo('body',
                    <p>Weee!</p>
                )}

                <h1>Try something</h1>
                {Try.with(fade, useSelectionKit, o =>
                    <p>trying</p>
                )}
                {Catch.with(fade, error =>
                    <p>{error.message}</p>
                )}


                <h1>Await something</h1>
                {Pend(
                    <p>Loaded</p>
                )}
                {Temp(
                    <p>Loading</p>
                )}
                {Catch(error =>
                    <p>{error.message}</p>
                )}

                <$MainContent as='hello' ref={$mainContent} />
                <button onclick={$mainContent.as('bye')}>bye</button>
            </div>
        </>
    )
}

