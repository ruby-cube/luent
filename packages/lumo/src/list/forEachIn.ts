import { _DynamicNodePod, _NodePod } from "../node/NodePod";
import { NodeEntity } from "../node/makeNode";
import { normalizeToArray } from "@rue/utils";
import { $listen, Callback, collectEffects, EffectFlask, ListenerOptions } from "@rue/flask";
import { isReactiveModel, ReactiveModel, Readonly, Signal, $Signal, hasSignal, ReactiveSignal } from "@rue/muonic";
import { makeDynamicNode } from "../dynamic/makeDynamicNode";
import { DynamicNode } from "../dynamic/DynamicNode";


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
        public dynamicNodes: DynamicNode[]
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

// let activeList: ListRenderKit | null = null
// let outerList: ListRenderKit | null = null

const listSetupStack: ListRenderKit[] = [];

export function pushList(list: ListRenderKit) {
    // outerList = activeList;
    // activeList = list

    listSetupStack.push(list)
}

export function popList() {
    // activeList = outerList;
    // outerList = null;
    return listSetupStack.pop()
}


export function isSettingUpList() {
    return listSetupStack.length !== 0;
}

export function isUpdatingList() {
    const activeList = listSetupStack.at(-1)
    return activeList && activeList.isUpdating;
}

export function onListUpdated(task: (toFromIndices: [number, number][]) => void, options: ListenerOptions) {
    const list = listSetupStack.at(-1);
    if (!list) throw new Error(`onListUpdated hook must be called during list setup`)
    return $listen(task, options, {
        enroll(cb) {
            list.onUpdatedTasks.add(cb);
        },
        remove(cb) {
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
    const list = hasSignal(data) ? data() : <Collection<T>>data;
    const _list = list instanceof Array ? list : list //TODO: need to implement for sets, maps, and objects
    const isDynamic = isReactiveModel(data) || hasSignal(data);

    const indices: Signal<number>[] = []
    const dynamicNodes: DynamicNode[] = []

    const listRenderKit = new ListRenderKit(render, domNodes, data, indices, idKey, dynamicNodes)

    pushList(listRenderKit);
    let i = 0;
    while (i < _list.length) {
        const $index = $Signal(i)
        const item = _list[i]
        currentItem = item;
        $currentIndex = $index;
        indices.push($index)

        if (isDynamic){
            const dynamicNode = makeDynamicNode(renderListItem)
            dynamicNodes.push(dynamicNode)
        }
        else {
            renderListItem()
        }

        function renderListItem(){
            domNodes.push(normalizeToArray(render(item, $index)));
        }

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





