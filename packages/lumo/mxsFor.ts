import { getWithoutTracking } from "../muonic/DependencyTracker";
import { hasSignal, ReactiveSignal } from "../muonic/useDerivedSignal";
import { DOMNode, InternalComponent } from "./component";
import { NodeEntity } from "./mx";


type RenderItem<T = any> = (item: T, i: number) => NodeEntity[]
type ListData = any[] | Set<any> | Map<any, any> | ReactiveSignal<any[] | Set<any> | Map<any, any>>

export class ListRenderKit<T = any> {
    constructor(
        public renderItem: RenderItem<T> | DOMNode, //QUESTION: Does this need the context object?
        public initialNodeEntities: NodeEntity[][],
        public data: ListData,
    ) { }
}

export function mxsFor(render: RenderItem, data: ListData) {
    const domNodes = [];
    const list = hasSignal(data) ? getWithoutTracking(data) : data;
    let i = 0;

    while (i < list.length) {
        domNodes.push(render(list[i], i))
        i++;
    }
    return new ListRenderKit(render, domNodes, data);
}