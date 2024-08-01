import { AnyObject } from "@rue/types";
import { hasSignal, ReactiveSignal } from "@rue/muonic/DerivedSignal";
import { isReactive, ReactiveObject } from "@rue/muonic/useReactiveObjects";
import { _DynamicNodePod, _NodePod } from "../node/NodePod";
import { Signal, useSignals } from "@rue/muonic/useSignals";
import { NodeEntity } from "../node/makeNode";
import { normalizeToArray } from "@rue/utils";
import { collectEffects, Flask } from "@rue/flask";
import { DOMNode } from "../component/component";

export const _listReactivity = useSignals()

export type RenderItem<T = any> = (item: T, $index: Signal<number>) => NodeEntity[] | NodeEntity
// type ListData = AnyObject | any[] | Set<any> | Map<any, any> | ReactiveObject<AnyObject[] | Set<any> | Map<any, any> | AnyObject> //TODO: Implement for maps, sets, and objects. Not sure about updating behavior. What about strings and iterating over characters?
export type ListData = any[] | ReactiveObject<AnyObject[] | UniqueItem[]> | ReactiveSignal<AnyObject[] | UniqueItem>
export type UniqueItem = any;

export class ListRenderKit<T = any> {
    constructor(
        public renderItem: RenderItem<T>, //QUESTION: Does this need the context object?
        public initialNodeEntities: NodeEntity[][],
        public data: ListData,
        public indices: Signal<number>[],
        public idKey: string | undefined,
        public flasks: Flask[]
    ) { }
}

// let settingUpList: boolean = false;
let currentItem: any;
let $currentIndex: Signal<number> | undefined;

export function getCurrentItemAndIndex(): [any, Signal<number>] | [undefined, undefined] {
    if ($currentIndex === undefined) return [undefined, undefined]
    return [currentItem, $currentIndex]
}

export function setCurrentItemAndIndex(item: any, $index: Signal<number>) {
    currentItem = item;
    $currentIndex = $index;
}

// export function isSettingUpList() {
//     return settingUpList;
// }

export function forEachIn(data: any[], render: RenderItem, idKey?: string): ListRenderKit // static list
export function forEachIn(data: ReactiveObject<UniqueItem[]> | ReactiveSignal<UniqueItem[]>, render: RenderItem, idKey?: string): ListRenderKit // dynamic list
export function forEachIn(data: ReactiveObject<AnyObject[]> | ReactiveSignal<AnyObject>, render: RenderItem, idKey?: string): ListRenderKit // dynamic list
export function forEachIn(data: ListData, render: RenderItem, idKey?: string): ListRenderKit {
    const domNodes: (NodeEntity | NodeEntity[])[] = [];
    const list = hasSignal(data) ? data() : data;
    const isDynamic = isReactive(data) || hasSignal(data);

    const indices = []
    const flasks: Flask[] = []

    let i = 0;
    while (i < list.length) {
        const $index = _listReactivity.$(i)
        const item = list[i]
        currentItem = item;
        $currentIndex = $index;
        indices.push($index)
        collectEffects((flask, outerFlask) => {
            console.log("outerflask", outerFlask)
            domNodes.push(normalizeToArray(render(item, $index)));
            if (isDynamic) {
                flasks.push(flask);
            }
            outerFlask?.onDisposal(flask.dispose)
        })
        i++;
    }
    currentItem = undefined;
    $currentIndex = undefined;

    return new ListRenderKit(render, domNodes, data, indices, idKey, flasks);
}


export class DynamicIndices {
    current: Signal<number>[];
    constructor(indices: Signal<number>[]) {
        this.current = indices
    }
    update(newIndices: Signal<number>[]) {
        this.current = newIndices
    }
}





