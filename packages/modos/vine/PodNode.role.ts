import { defineRole, Role, PrivateRole, enacts } from '@rue/etre';
import { $type, } from '@rue/utils';
import { Cast } from '@rue/types';
import { $Modo } from '../Modo.role';
import { disposeOfModel, getModel, inTrash, onModelMade, reinstateModel } from '../depot';
import { PeaNode } from './PeaNode.role';
import { beforeDisposedOf, onDestroyed, onInstated, onMade } from '../lifecycle-hooks';
import { onActionCompleted, onActionStart } from '@rue/actionry';
import { createHook } from '@rue/pecherie';
import { $lifetime, beginScene } from '@rue/planify';
console.log('LOADING Pod.role.ts ...');


export type PodNode = Role<typeof $PodNode>
type _PodNode = PrivateRole<typeof $PodNode>

export const $PodNode = defineRole({
    prereqs: { $Modo },
})

export function initLiablePod() {
    onInstated((model) => {
        if (peasMap.get(model) == null)
            peasMap.set(<PodNode><Cast>model, new Set());
        else reinstatePeas(model);
    }, { until: () => onDestroyed })
    beforeDisposedOf((model) => {
        disposeOfPeas(model);
    })
}

function disposeOfPeas(pod: PodNode) {
    const peas = peasMap.get(pod);
    if (peas) {
        for (const pea of peas) {
            disposeOfModel(pea); //main  ::depot 
        }
    }
}

function reinstatePeas(pod: PodNode) {
    const peas = peasMap.get(pod);
    console.log("Reinstating peas!!!!!", peas)
    if (peas) {
        for (const pea of peas) {
            if (inTrash(pea)) reinstateModel(pea); //main  ::depot
        }
    }
}

if (__DEV__) {
    enacts($PodNode, {})
}


///




const peasMap: WeakMap<PodNode, Set<PeaNode>> = new WeakMap();  // collect peas so they can be disposed of if pod is disposed of
// export const detachedPeas: Set<PeaNode> = new Set(); // collect peas for batch disposal
// export const reattachedPeas: Set<PeaNode> = new Set(); // collect peas for batch instatement

const [castPeaConnected, onPeaConnected] = createHook({
    hook: "pea-connected",
    data: $type as PeaNode,
    dataAsArg: true
})

export function connectPeaToPod(pod: PodNode, pea: PeaNode) {
    const peas = peasMap.get(pod);
    if (peas && !peas.has(pea)) {
        peas.add(pea); //main 
        castPeaConnected(pea);
        // if (!getModel(pea.id)) reinstateModel(pea); //NOTE: If-check to prevent double instatement (from populateDepot and revivePeas)
    }
}


const [castPeaDisconnected, onPeaDisconnected] = createHook({
    hook: "pea-disconnected",
    data: $type as PeaNode,
    dataAsArg: true
})


export function disconnectPeaFromPod(pod: PodNode, pea: PeaNode) {
    peasMap.get(pod)?.delete(pea); //main 
    castPeaDisconnected(pea);
}


///


onActionStart((action) => {
    beginScene((actionScene) => {
        const detachedPeas: Set<PeaNode> = new Set(); // collect peas for batch disposal
        const reattachedPeas: Set<PeaNode> = new Set(); // collect peas for batch instatement

        onPeaDisconnected((pea) => {
            if (!reattachedPeas.has(pea)) {
                detachedPeas.add(pea);
            }
        })

        onPeaConnected((pea) => {
            detachedPeas.delete(pea);
            if (inTrash(pea)) {
                reattachedPeas.add(pea);
            }
        })

        onActionCompleted(action, () => {
            disposeOfDetachedPeas(detachedPeas);
            reinstateReattachedPeas(reattachedPeas);
            actionScene.end();
        })
    })
}, { $lifetime })


function disposeOfDetachedPeas(detachedPeas: Set<PeaNode>) {
    for (const pea of detachedPeas) {
        disposeOfModel(pea);
    }
    detachedPeas.clear();
}

function reinstateReattachedPeas(reattachedPeas: Set<PeaNode>) {
    for (const pea of reattachedPeas) {
        reinstateModel(pea);
    }
    reattachedPeas.clear();
}

///


// export function duplicateHomogenousPeas(peas: PeapodPea[], duplicatorFn: Function) {
//     const clones = []
//     for (const pea of peas) {
//         clones.push(duplicatorFn(pea));
//     }
//     return clones;
// }

// export function duplicateMixedPeas(peas: PeapodPea[], duplicatorFnMap: Map<ModelDef, Function>) {
//     const clones: PeapodPea[] = [];
//     if (peas.length === 0) return clones;
//     for (const pea of peas) {
//         const duplicator = duplicatorFnMap.get(modelDefOf(pea))!
//         clones.push(duplicator(pea));
//     }
//     return clones;
// }





