import { AnyObject } from "@rue/types";
import { hasSignal, ReactiveSignal } from "@rue/muonic/DerivedSignal";
import { isReactiveModel, ReactiveModel } from "@rue/muonic/useReactiveModels";
import { _DynamicNodePod, _NodePod } from "../node/NodePod";
import { Signal, useSignals } from "@rue/muonic/useSignals";
import { NodeEntity } from "../node/makeNode";
import { normalizeToArray } from "@rue/utils";
import { $listen, Callback, collectEffects, Flask, ListenerOptions } from "@rue/flask";
import { DOMNode } from "../component/InternalComponent";

export const _listReactivity = useSignals()

export type RenderItem<T = any> = (item: T, $index: Signal<number>) => NodeEntity[] | NodeEntity
// type ListData = AnyObject | any[] | Set<any> | Map<any, any> | ReactiveModel<AnyObject[] | Set<any> | Map<any, any> | AnyObject> //TODO: Implement for maps, sets, and objects. Not sure about updating behavior. What about strings and iterating over characters?
export type ListData<T = any> = Collection<T> | ReactiveModel<Collection<T>> | ReactiveSignal<Collection<T>>
export type UniqueItem = any;
type Collection<T> = T[]  //TODO: add sets and maps
// | Set<T>

export class ListRenderKit<T = any> {
    constructor(
        public renderItem: RenderItem<T>, //QUESTION: Does this need the context object?
        public initialNodeEntities: NodeEntity[][],
        public data: ListData,
        public indices: Signal<number>[],
        public idKey: string | undefined,
        public flasks: Flask[]
    ) { }

    isUpdating = false;

    runUpdate(update: () => void) {
        this.isUpdating = true;
        update();
        this.isUpdating = false;
    }


    onUpdatedTasks: Set<Function> = new Set()

    castUpdated(toFromIndices: [number, number][]) {
        for (const task of this.onUpdatedTasks) {
            task(toFromIndices)
        }
    }
}

let activeList: ListRenderKit | null = null
let outerList: ListRenderKit | null = null

export function pushList(list: ListRenderKit) {
    outerList = activeList;
    activeList = list
}

export function popList() {
    activeList = outerList;
    outerList = null;
}

export function isSettingUpList() {
    return !!activeList;
}

export function isUpdatingList() {
    return activeList && activeList.isUpdating;
}

export function onListUpdated(task: (toFromIndices: [number, number][]) => void, options: ListenerOptions) {
    const list = activeList;
    if (!list) throw new Error(`onListUpdated hook must be called during list setup`)
    return $listen(task, options, {
        enroll(cb) {
            list.onUpdatedTasks.add(cb);
        },
        remove(cb) {
            console.log('deleting list task')
            console.trace()
            list.onUpdatedTasks.delete(cb)
        }
    })
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

export function forEachIn<T>(data: Collection<T>, render: RenderItem<T>, idKey?: string): ListRenderKit // static list
export function forEachIn<T>(data: ReactiveModel<Collection<T>> | ReactiveSignal<Collection<T>>, render: RenderItem<T>, idKey?: string): ListRenderKit // dynamic list
export function forEachIn<T>(data: ReactiveModel<Collection<T>> | ReactiveSignal<Collection<T>>, render: RenderItem<T>, idKey?: string): ListRenderKit // dynamic list
export function forEachIn<T>(data: ListData<T>, render: RenderItem<T>, idKey?: string): ListRenderKit {
    const domNodes: (NodeEntity | NodeEntity[])[] = [];
    const list = hasSignal(data) ? data() : data;
    const _list = list instanceof Array ? list : list //TODO: need to implement for sets, maps, and objects
    const isDynamic = isReactiveModel(data) || hasSignal(data);

    const indices: Signal<number>[] = []
    const flasks: Flask[] = []

    const listRenderKit = new ListRenderKit(render, domNodes, data, indices, idKey, flasks)

    pushList(listRenderKit);
    let i = 0;
    while (i < _list.length) {
        const $index = _listReactivity.$(i)
        const item = _list[i]
        currentItem = item;
        $currentIndex = $index;
        indices.push($index)
        collectEffects((flask, outerFlask) => {
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
    popList();

    return listRenderKit;
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





