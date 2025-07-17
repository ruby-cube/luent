import { SustainedListenerOptions } from "@rue/flask";
import type { ListRenderKit } from "./ListRenderKit";

const listSetupStack: ListRenderKit[] = [];

export function pushList(list: ListRenderKit) {
   listSetupStack.push(list)
}

export function popList() {
   return listSetupStack.pop()
}


export function isSettingUpList() {
   return listSetupStack.length !== 0;
}

// export function isUpdatingList() {
//     const activeList = listSetupStack.at(-1)
//     return activeList && activeList.isUpdating;
// }

export function onListUpdated(task: (toFromIndices: [number, number][]) => void) {
   const list = listSetupStack.at(-1);
   if (!list) throw new Error(`onListUpdated hook must be called during list setup`)
   list.afterUpdateTasks.add(task)
   const flask = list.outerFlask
   flask.onDiscard(() => list.afterUpdateTasks.delete(task));
}

export function onBeforeListUpdate(task: () => void, options?: SustainedListenerOptions) {
   const list = listSetupStack.at(-1);
   if (!list) throw new Error(`onListUpdated hook must be called during list setup`)
   list.afterUpdateTasks.add(task)
   const flask = list.outerFlask
   flask.onDiscard(() => list.beforeUpdateTasks.delete(task));
}