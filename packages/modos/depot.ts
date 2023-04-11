//-@ts-nocheck
import { $type, uid } from "@rue/utils";
import { createHook , createTargetedHook} from "@rue/pecherie";
import { DataEntry, Dataset, toDatasetName } from "./datasets";
import { ModelsToRevive, _reviveFlatPeasAndProps } from "./revival/flatdata";
import { getModelDef, ModoDef, _IS_LIABLE_POD_, _REVIVE_ } from "./Model";
import { Modo } from "./Modo.role";
import { UID } from "./types";
import { heed, defineMessage, send } from "@rue/archer";
import { DevHookCaster, DevHookListener } from '@rue/planify';
import { useRegistrar } from "@rue/utils";
import { Revived, toRevived } from "./revival/flatten";
import { initLiablePod } from "./vine/PodNode.role";
import { Cast } from "@rue/types";


const [initializers, enrollInitializer] = __DEV__ ? useRegistrar<Function>() : <Cast>null as ReturnType<(typeof useRegistrar<Function>)>;

export function __$initDepotModule() { // will be removed at build time
    __initDepot();

    for (const init of initializers) {
        init();
    }
}


/* Init Depot */

let depot: Map<string, Modo>;
let trash: Map<string, Modo>;

function __initDepot() {
    depot = new Map();
    trash = new Map();
}

// Compiles to:
// let depot = new Map();
// let trash = new Map();

export function getModel(id: string) {
    let model = depot.get(id);
    if (!model) {
        model = trash.get(id);
        if (!__TEST__) console.warn(`[@Rue/Modos] Model ${id} retreived from trash. Investigate (unless caused by running a test.)`)
    }
    if (!model) throw new Error(`[@Rue/Modos] Depot does not have a model registered with this id: ${id}`);
    return model;
}

export function inTrash(model: Modo) {
    return trash.has(model.id)
}



/* Populate Depot */

let castDepotPopulated: DevHookCaster<typeof __initDepotPopulatedHook>;
export let onDepotPopulated: DevHookListener<typeof __initDepotPopulatedHook>;

const __initDepotPopulatedHook = enrollInitializer(() => {
    const hook = createHook({ //TODO: Change to instateModels
        hook: "depot-populated",
        data: $type as {
            datasets: Dataset[];
        }
    });
    castDepotPopulated = hook[0];
    onDepotPopulated = hook[1];
    if (__DEV__) return hook;
})


export function populateDepot(datasets: Dataset[]) { //TODO: how do I guarantee that datasets contains all peas needed to revive flat props? If it's not possible to guarantee, then I need a system of partial revival... currently, I've added guards with error throwing, but not sure if it's enough
    const modelsToRevive: ModelsToRevive = new Map();
    for (const dataset of datasets) {
        const entries = dataset.entries;
        const modoDef = getModelDef(dataset.name);
        const revive = modoDef[_REVIVE_];
        if (revive) {
            const models: Modo[] = [];
            for (const data of entries) {
                const model = setupModel(data, modoDef)
                models.push(model);
                instateModel(model, modoDef); //main ;
            }
            modelsToRevive.set(models, revive);
        }
        else {
            for (const data of entries) {
                const model = setupModel(data, modoDef);
                instateModel(model, modoDef); //main ;
            }
        }
    }
    if (modelsToRevive.size !== 0)
        _reviveFlatPeasAndProps(modelsToRevive); //side 

    castDepotPopulated({
        datasets
    })
}

if (__TEST__) {
    populateDepot.__getDepot = () => depot;
    populateDepot.__getTrash = () => trash;
}




/* Setup Model */

let makingModel = false;

export function isMakingModel() {
    return makingModel;
}

export function setupModel(data: DataEntry, modoDef: ModoDef) {
    const name = modoDef.name;
    makingModel = true;
    const model = modoDef.make(data); //main 
    makingModel = false;
    if (modoDef[_IS_LIABLE_POD_]) initLiablePod();
    model.id = data.id;
    if ("clone" in model) {
        model.clone = () => modoDef.clone(model);
    }
    castModelMade({ model, name: modoDef.name, revived: toRevived(modoDef[_REVIVE_]) })
    // heed(REINSTATE, {
    //     id: model,
    //     do() {
    //         instateModel(model, modoDef);
    //         castReinstated(model, {
    //             model, name, revived: toRevived(modoDef[_REVIVE_])
    //         })
    //     },
    //     until: (stop) => $onDestroyed(model, stop)
    // });

    heed(REINSTATE, model, () => {
        instateModel(model, modoDef);
        castReinstated(model, {
            model, name, revived: toRevived(modoDef[_REVIVE_])
        })
    }, { until: (stop) => $onDestroyed(model, stop) })

    $onDestroyed(model, () => {
        castModelDestroyed({ //for persistence
            id: model.id,
            modelName: name
        })
    })
    return model;
}


/* Create Model */

let castModelCreated: DevHookCaster<typeof __initModelCreatedHook>;
export let onModelCreated: DevHookListener<typeof __initModelCreatedHook>;

const __initModelCreatedHook = enrollInitializer(() => {
    const hook = createHook({
        hook: "model-created",
        data: $type as { model: Modo, modelName: string },
    });
    castModelCreated = hook[0];
    onModelCreated = hook[1];
    if (__DEV__) return hook;
})


export function createModel<MKE extends (data: any) => any>(data: DataEntry, modoDef: ModoDef) {
    const id = _genId();
    const _data = { ...data, id };
    const model = setupModel(_data, modoDef); //main 
    castModelCreated({ model, modelName: modoDef.name })
    instateModel(model, modoDef); //main ;
    return model as ReturnType<MKE> & Modo;
}

export function _genId(): string {
    const newId = uid(12);
    if (depot.has(newId)) return _genId(); //TODO: add user prefix for added uniqueness across collaborators
    return newId;
}



/* Make-Instate-Reinstate Model */

const REINSTATE = defineMessage({
    message: "reinstate",
    targetID: $type as Modo
});

let castModelMade: DevHookCaster<typeof __initModelMadeHook>;
export let onModelMade: DevHookListener<typeof __initModelMadeHook>;

const __initModelMadeHook = enrollInitializer(() => {
    const hook = createHook({
        hook: "model-made",
        data: $type as {
            model: Modo,
            name: string,
            revived: Revived | undefined
        },
    });
    castModelMade = hook[0];
    onModelMade = hook[1];
    if (__DEV__) return hook;
})

let castModelInstated: DevHookCaster<typeof __initModelInstatedHook>;
export let onModelInstated: DevHookListener<typeof __initModelInstatedHook>;

const __initModelInstatedHook = enrollInitializer(() => {
    const hook = createHook({
        hook: "model-instated",
        data: $type as {
            model: Modo,
            name: string,
            revived: Revived | undefined
        },
    });
    castModelInstated = hook[0];
    onModelInstated = hook[1];
    if (__DEV__) return hook;
})

let castModelReinstated: DevHookCaster<typeof __initModelReinstatedHook>;
export let onModelReinstated: DevHookListener<typeof __initModelReinstatedHook>;

const __initModelReinstatedHook = enrollInitializer(() => {
    const hook = createHook({
        hook: "model-reinstated",
        data: $type as {
            model: Modo,
            name: string,
            revived: Revived | undefined
        },
    });
    castModelReinstated = hook[0];
    onModelReinstated = hook[1];
    if (__DEV__) return hook;
})

let castInstated: DevHookCaster<typeof __initInstatedHook>;
export let $onInstated: DevHookListener<typeof __initInstatedHook>;

const __initInstatedHook = enrollInitializer(() => {
    const hook = createTargetedHook({
        hook: "instated",
        data: $type as {
            model: Modo,
            name: string,
            revived: Revived | undefined
        },
    });
    castInstated = hook[0];
    $onInstated = hook[1];
    if (__DEV__) return hook;
})

let castReinstated: DevHookCaster<typeof __initReinstatedHook>;
export let $onReinstated: DevHookListener<typeof __initReinstatedHook>;

const __initReinstatedHook = enrollInitializer(() => {
    const hook = createTargetedHook({
        hook: "reinstated",
        data: $type as {
            model: Modo,
            name: string,
            revived: Revived | undefined
        },
    });
    castReinstated = hook[0];
    $onReinstated = hook[1];
    if (__DEV__) return hook;
})


export function instateModel(model: Modo, modoDef: ModoDef) {
    const uid = model.id;
    if (depot.get(uid)) throw new Error(`[@Rue/Modos] ID Collision: ${uid} already exists in depot. Please make sure unique ids are being assigned.`)
    depot.set(uid, model); //main 
    trash.delete(uid); //main 
    castInstated(model, {
        model,
        name: modoDef.name,
        revived: toRevived(modoDef[_REVIVE_])
    })
    return model;
}

export function reinstateModel(model: Modo) {
    send(REINSTATE, {
        to: model
    });
}







/* Dispose of Model */

let castBeforeDisposedOf: DevHookCaster<typeof __initBeforeDisposedOfHook>;
export let $beforeDisposedOf: DevHookListener<typeof __initBeforeDisposedOfHook>;

const __initBeforeDisposedOfHook = enrollInitializer(() => {
    const hook = createTargetedHook({
        hook: "before-disposed-of",
        data: $type as Modo,
        dataAsArg: true
    });
    castBeforeDisposedOf = hook[0];
    $beforeDisposedOf = hook[1];
    if (__DEV__) return hook;
})


let castDisposedOf: DevHookCaster<typeof __initDisposedOfHook>;
export let $onDisposedOf: DevHookListener<typeof __initDisposedOfHook>;

const __initDisposedOfHook = enrollInitializer(() => {
    const hook = createTargetedHook({
        hook: "disposed-of",
        data: $type as Modo,
        dataAsArg: true
    });
    castDisposedOf = hook[0];
    $onDisposedOf = hook[1];
    if (__DEV__) return hook;
})


// Put model in trash
export function disposeOfModel(model: Modo) {
    castBeforeDisposedOf(model, model)
    const uid = model.id;
    trash.set(uid, model); //main 
    depot.delete(uid); //main 
    castDisposedOf(model, model)
}

export function disposeOfModels(models: Modo[] | Set<Modo> | Map<Modo, any>) {
    if (models instanceof Map) {
        for (const [model] of models) {
            disposeOfModel(model)
        }
    }
    else {
        for (const model of models) {
            disposeOfModel(model)
        }
    }
}



/* Destroy Model */

let castBeforeDestroyed: DevHookCaster<typeof __initBeforeDestroyedHook>;
export let $beforeDestroyed: DevHookListener<typeof __initBeforeDestroyedHook>;

const __initBeforeDestroyedHook = enrollInitializer(() => {
    const hook = createTargetedHook({
        hook: "before-destroyed",
        onceAsDefault: true,
        data: $type as {
            model: Modo
        }
    });
    castBeforeDestroyed = hook[0];
    $beforeDestroyed = hook[1];
    if (__DEV__) return hook
})



let castModelDestroyed: DevHookCaster<typeof __initModelDestroyedHook>;
export let $onModelDestroyed: DevHookListener<typeof __initModelDestroyedHook>;

const __initModelDestroyedHook = enrollInitializer(() => {
    const hook = createHook({
        hook: "model-destroyed",
        data: $type as {
            id: UID,
            modelName: string
        }
    });
    castModelDestroyed = hook[0];
    $onModelDestroyed = hook[1];
    if (__DEV__) return hook;
})



let castDestroyed: DevHookCaster<typeof __initDestroyedHook>;
export let $onDestroyed: DevHookListener<typeof __initDestroyedHook>;

const __initDestroyedHook = enrollInitializer(() => {
    const hook = createTargetedHook({
        hook: "destroyed",
        data: $type as {
            id: UID
        },
        onceAsDefault: true
    });
    castDestroyed = hook[0];
    $onDestroyed = hook[1];
    if (__DEV__) return hook
})

// Completely remove model
export function destroyModel(model: Modo) {
    castBeforeDestroyed(model, { model })
    const uid = model.id;
    depot.delete(uid); //main 
    trash.delete(uid); //main 
    castDestroyed(model, { id: uid });
}

export function emptyDepotTrash() {
    for (const model of trash) {
        //QUESTION: Should this be where model destroyed is called?
    }
    trash.clear(); //main  
}



