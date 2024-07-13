import { AnyObject } from "@rue/types";
import { getWithoutTracking } from "../muonic/DependencyTracker";
import { hasSignal, ReactiveSignal } from "../muonic/useDerivedSignal";
import { NodeEntity } from "./mx";
import { isReactive, ReactiveObject } from "../muonic/useReactivize";
import { NodeRef } from "./NodeRef";
import { _NodePod } from "./NodePod";


export type RenderItem<T = any> = (item: T, i: number) => NodeEntity[] //TODO: don't require an array
// type ListData = AnyObject | any[] | Set<any> | Map<any, any> | ReactiveObject<AnyObject[] | Set<any> | Map<any, any> | AnyObject> //TODO: Implement for maps, sets, and objects. Not sure about updating behavior. What about strings and iterating over characters?
type ListData = any[] | ReactiveObject<AnyObject[] | UniqueItem[]> | ReactiveSignal<AnyObject[] | UniqueItem>
export type UniqueItem = any;

export class ListRenderKit<T = any> {
    constructor(
        public renderItem: RenderItem<T>, //QUESTION: Does this need the context object?
        public initialNodeEntities: NodeEntity[][],
        public data: ListData,
        public idKey?: string,
    ) { }
}

export function mxsFor(render: RenderItem, data: any[]): ListRenderKit // static list
export function mxsFor(render: RenderItem, data: ReactiveObject<UniqueItem[]> | ReactiveSignal<UniqueItem[]>): ListRenderKit // dynamic list
export function mxsFor(render: RenderItem, data: ReactiveObject<AnyObject[]> | ReactiveSignal<AnyObject>, idKey: string): ListRenderKit // dynamic list
export function mxsFor(render: RenderItem, data: ListData, idKey: string ='ID'): ListRenderKit {
    const domNodes = [];
    const list = hasSignal(data) ? data() : data;
    // if (isReactive(data) && !idKey) throw new Error("idKey required for reactive list rendering")
    let i = 0;

    while (i < list.length) {
        domNodes.push(render(list[i], i))
        i++;
    }
    return new ListRenderKit(render, domNodes, data, idKey);
}


// const list$ = reactivize([])

// // ["peach", "pear"]
// // ["peach"]

// watch(list$, (newList, oldList) => {

// })
