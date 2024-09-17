//@ts-nocheck
import { $Node, InternalComponent, NodeEntity } from "@rue/lumo"
import { AnyObject } from "@rue/types"


function ParentBlock() {

    function Title(render: (words) => any) {
        return ({ words }) => ({
            title: 'sort'
        }, render(words))
    }


    return ({
        increment,
        decrement
    },

        <FrameBlock>
            {({ words }) =>
                <h1>{words}</h1>
            }
        </FrameBlock>
    )
}


function FrameBlock({ Slot }: {
    Slot: {
        Title: () => SlotComponent<{ title: string }>,
        SlottedBlock: () => SlotComponent
    }
}) {
    const page = $Node(Slot)

    return (
        <div>
            <Slot ref={page} />
        </div>
    )
}

function SlottedBlock() {
    return (
        <div>hi</div>
    )
}

function Title() {

}



// mO should return a render function if . How does it know it's a render slot function and not a component?

function App() {
    return mE("div", {
        Slot: mO(Parent, {
            Slot: mO(Child, {})
        })
    });
}

