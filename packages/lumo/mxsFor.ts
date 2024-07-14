import { AnyObject } from "@rue/types";
import { getWithoutTracking } from "../muonic/DependencyTracker";
import { hasSignal, ReactiveSignal } from "../muonic/useDerivedSignal";
import { _internalReactivity, NodeEntity, normalizeRenderOutput } from "./mX";
import { isReactive, ReactiveObject } from "../muonic/useReactivize";
import { NodeRef } from "./NodeRef";
import { _NodePod } from "./NodePod";
import { Signal } from "../muonic/useSignalize";


export type RenderItem<T = any> = (item: T, $index: Signal<number>) => NodeEntity[] | NodeEntity
// type ListData = AnyObject | any[] | Set<any> | Map<any, any> | ReactiveObject<AnyObject[] | Set<any> | Map<any, any> | AnyObject> //TODO: Implement for maps, sets, and objects. Not sure about updating behavior. What about strings and iterating over characters?
type ListData = any[] | ReactiveObject<AnyObject[] | UniqueItem[]> | ReactiveSignal<AnyObject[] | UniqueItem>
export type UniqueItem = any;

export class ListRenderKit<T = any> {
    constructor(
        public renderItem: RenderItem<T>, //QUESTION: Does this need the context object?
        public initialNodeEntities: NodeEntity[][],
        public data: ListData,
        public indices: Signal<number>[]
    ) { }
}

export function _mXsFor(render: RenderItem, data: any[]): ListRenderKit // static list
export function _mXsFor(render: RenderItem, data: ReactiveObject<UniqueItem[]> | ReactiveSignal<UniqueItem[]>): ListRenderKit // dynamic list
export function _mXsFor(render: RenderItem, data: ReactiveObject<AnyObject[]> | ReactiveSignal<AnyObject>): ListRenderKit // dynamic list
export function _mXsFor(render: RenderItem, data: ListData): ListRenderKit {
    const domNodes = [];
    const list = hasSignal(data) ? data() : data;

    const indices = []

    let i = 0;
    while (i < list.length) {
        const $index = _internalReactivity.$(i)
        indices.push($index)
        domNodes.push(normalizeRenderOutput(render(list[i], $index)))
        i++;
    }

    
    return new ListRenderKit(render, domNodes, data, indices);
}



// const list$ = o$([])

// // ["peach", "pear"]
// // ["peach"]

// watch(list$, (newList, oldList) => {

// })
