//@-ts-nocheck
import { getKeyPathValue, KeyPath, toKeyPath, $type } from "@rue/utils";
import { onActionCompleted, onActionStart } from '@rue/actionry';
import { createHook } from '@rue/pecherie';
import { $tilStop, OneTimeListener, beginScene } from "@rue/planify";
import { onChange } from "@rue/paravue";
import { Modo } from "../Modo.role";
import { ModoSymbol } from "../Model";
import { $onDestroyed, onModelMade } from "../depot";




type KeyPathString = string;
type UndoableChange = {
    model: Modo;
    keyPath: KeyPath;
    value: any;
    oldValue: any;
}
type KeyPathConfig = (KeyPathString)[]

const undoablesMap: Map<string, KeyPathConfig> = new Map(); //GLOBAL 

export function enrollUndoableProps<T>(modoSymbol: ModoSymbol<T>, config: (keyof T)[] | KeyPathConfig) {
    const modelName = modoSymbol.description;
    if (__DEV__ && undoablesMap.has(modelName)) console.warn(`${modelName} is already registered as undoable.`)
    undoablesMap.set(modelName, config as KeyPathConfig); //main 
}






let addToHistory: (changes: UndoableChange[]) => void;

export function initHistory(addToHistoryCB: (changes: UndoableChange[]) => void, onAppMounted: OneTimeListener) {
    addToHistory = addToHistoryCB; //main 
    watchUndoableProps(); //main 
    onAppMounted(() => {
        setupBatching(); //main 
    })
}



const [castUndoablePropChanged, onUndoablePropChanged] = createHook({ //GLOBAL
    hook: "undoable-prop-changed",
    data: $type as UndoableChange
})

function watchUndoableProps() {
    onModelMade((ctx) => {
        const { model, name } = ctx;
        if (isUndoable(name)) {
            const undoableProps = undoablesMap.get(name)!;
            for (const keyPathString of undoableProps) { //TODO: do this after first paint? (map model to persistedProps onModelMade to be accessed later). Measure performance
                const keyPath = toKeyPath(keyPathString);

                const watcher = onChange(() => getKeyPathValue(model, keyPath), (value, oldValue) => {   // Does this need effectScope for cleanup?
                    castUndoablePropChanged({
                        model,
                        keyPath,
                        value,
                        oldValue
                    })
                }, { $tilStop }) //main 

                $onDestroyed(model, watcher.stop)
            }
        }
    })
}

function isUndoable(modelName: string) {
    return undoablesMap.has(modelName)
}

function setupBatching() {
    onActionStart((action) => {
        const actionScene = beginScene(() => {
            const undoableBatch: UndoableChange[] = [];

            onUndoablePropChanged((change) => {
                undoableBatch.push(change); //main 
            });

            onActionCompleted(action, () => {
                addToHistory(undoableBatch); //main 
                actionScene.end();
            }, { once: true })
        });
    })
}





