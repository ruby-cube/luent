//@-ts-nocheck
import { getKeyPathValue, KeyPath, toKeyPath, $type } from "@rue/utils";
import { Modo } from '../Modo.role';
import { onActionCompleted, onActionStart } from '@rue/actionry';
import { createHook } from '@rue/pecherie';
import { $onDestroyed, $onModelDestroyed, onModelCreated, onModelMade } from "../depot";
import { $tilStop, OneTimeListener, beginScene } from "@rue/planify";
import { onChange } from "@rue/paravue";
import { ModoSymbol } from "../Model";
import { flatten, wasRevived } from "../revival/flatten";



type KeyPathString = string;
type DBKeyPathString = string;
type ChangeToPersist = {
    model: Modo;
    dbKeyPath: KeyPath;
    keyPath: KeyPath;
    value: any;
    oldValue: any;
}
type KeyPathConfig = (KeyPathString | [KeyPathString, DBKeyPathString])[]

const persistenceMap: Map<string, KeyPathConfig> = new Map(); //GLOBAL 

export function enrollPersistedProps<T>(modoSymbol: ModoSymbol<T>, config: (keyof T)[] | KeyPathConfig) {
    const modelName = modoSymbol.description;
    if (__DEV__ && persistenceMap.has(modelName)) console.warn(`${modelName} is already being persisted.`)
    persistenceMap.set(modelName, config as KeyPathConfig); //main 
}





const [castPersistableDestroyed, onPersistableDestroyed] = createHook({ //GLOBAL
    hook: "persistable-destroyed",
    data: $type as {
        id: string,
        modelName: String
    }
})
const [castPersistableCreated, onPersistableCreated] = createHook({ //GLOBAL
    hook: "persistable-created",
    data: $type as {
        id: string,
        model: Modo,
        modelName: String
    }
})

//QUESTION: should create, patch, and destroy be put in the same batch? or should they be separate transactions?
// can you mix PUT, PATCH, etc in the same transaction?
let persistData: (changes: ChangeToPersist[]) => void;

export function initPersistence(persistDataCB: (changes: ChangeToPersist[]) => void, onAppMounted: OneTimeListener) {
    persistData = persistDataCB; //main 
    onModelCreated((ctx) => {
        if (isPersistable(ctx.modelName)) {
            const { model, modelName } = ctx;
            castPersistableCreated({
                id: model.id,
                model,
                modelName
            })
        }
    })
    watchPersistedProps(); //main 
    $onModelDestroyed((ctx) => {
        if (isPersistable(ctx.modelName)) {
            const { id, modelName } = ctx;
            castPersistableDestroyed({
                id,
                modelName
            })
        }
    })
    onAppMounted(() => {
        setupBatchChanges(); //main 
    })
}





const [castPersistedPropChanged, onPersistedPropChanged] = createHook({ //GLOBAL
    hook: "persisted-prop-changed",
    data: $type as ChangeToPersist
})

function watchPersistedProps() {
    onModelMade((ctx) => {
        if (isPersistable(ctx.name)) {
            const { name, revived } = ctx;
            const model = ctx.model;
            const persistedProps = persistenceMap.get(name)!;
            for (const prop of persistedProps) { //TODO: do this after first paint? (map model to persistedProps onModelMade to be accessed later). Measure performance
                const propIsKeyPathString = typeof prop === "string"
                const keyPathString = propIsKeyPathString ? prop : prop[0];
                const dbKeyPathString = propIsKeyPathString ? prop : prop[1];
                const keyPath = toKeyPath(keyPathString);
                const dbKeyPath = propIsKeyPathString ? keyPath : toKeyPath(dbKeyPathString)
                const _wasRevived = wasRevived(keyPathString, revived);

                const watcher = onChange(() => getKeyPathValue(model, keyPath), (value, oldValue) => {   // Does this need effectScope for cleanup?
                    castPersistedPropChanged({
                        model,
                        dbKeyPath,
                        keyPath,
                        value: _wasRevived ? flatten(value) : value,
                        oldValue: _wasRevived ? flatten(oldValue) : oldValue
                    })
                }, { $tilStop }) //main 

                $onDestroyed(model, watcher.stop)
            }
        }
    })
}

function isPersistable(modelName: string) {
    return persistenceMap.has(modelName)
}

function setupBatchChanges() {
    onActionStart((action) => {
        const actionScene = beginScene(() => {
            const persistenceBatch: ChangeToPersist[] = [];

            onPersistableCreated(() => {
                //QUESTION: should created be pushed into the same persistenceBatch or a separate batch?
            })

            onPersistedPropChanged((change) => {
                persistenceBatch.push(change); //main 
            });

            onPersistableDestroyed(() => {

            })

            onActionCompleted(action, () => {
                persistData(persistenceBatch); //main 
                actionScene.end();
            }, { once: true })
        });
    })
}






// async and race conditions / overlapping event flows
// if a property is changed by event A and event B, but promises cause eventA to resolve after eventB, do you discard event A's change? if so, how?
// for undo, you need to preserve the change by event A
// for persistence you need to discard the change by event A












