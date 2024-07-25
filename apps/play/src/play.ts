//@ts-nocheck

function ListBlock() {


    return {
        render: () => [
            $mount(o => {
                if ($isActive()) return keep(o =>
                    mE('div', [
                        mO(ListBlock),
                        mE('div', [
                            "hello"
                        ], 'div')
                    ], xDiv),
                    0)

                else if ($isReady()) return keep(o =>
                    mE('p', ['none']),
                    1)

                else if ($isDone()) return keep(o =>
                    mE('p', ['done']),
                    2)

                else return keep(o =>
                    'nothing',
                    3)
            }),
        ]
    }
}

export class ConditionalKit {
    constructor(
        public conditionalKits: ConditionalRenderKit[], // $condition, render
        public initialNodeEntities: NodeEntity[],
        public $initialConditions: ReactiveSignal<boolean[]>,
        public initialIndex: number,
    ) { }
}

/* 
How does mE store nodeEntities without ref??
*/