//@ts-nocheck
import { $Node, InternalComponent, NodeEntity } from "@rue/lumo"
import { AnyObject } from "@rue/types"


function ParentBlock() {

    function Title(render: (words) => any) {
        return ({ words }) => mx({
            title: 'sort'
        }, render(words))
    }


    return mx({
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

    return mx(
        <div>
            <Slot ref={page} />
        </div>
    )
}

function SlottedBlock() {
    return mx(
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

