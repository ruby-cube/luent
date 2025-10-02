import { $listen, Flask, SustainedListenerOptions } from "@rue/flask";
import { ListKit } from "./List";

const listSetupStack: ListKit[] = [];

export function pushList(list: ListKit) {
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

export function onListUpdated(task: (toFromIndices: [number, number][]) => void, flask: Flask) {
   const list = listSetupStack.at(-1);
   if (!list) throw new Error(`onListUpdated hook must be called during list setup`)
   list.afterUpdateTasks.add(task);
   flask.onDiscard(() =>
      list.afterUpdateTasks.delete(task)
   )
}

export function onBeforeListUpdate(task: () => void, flask: Flask) {
   const list = listSetupStack.at(-1);
   if (!list) throw new Error(`onListUpdated hook must be called during list setup`)
   list.beforeUpdateTasks.add(task);
   flask.onDiscard(() => {
      list.beforeUpdateTasks.delete(task)
   })
}