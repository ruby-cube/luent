import { defineRole, Role, PrivateRole } from '@rue/etre';
import { Mutable } from '@rue/types';
import { PodNode } from './PodNode.role';
import { $PeaNode } from './PeaNode.role';
import { enacts } from '../../etre/typecheck';
console.log('LOADING LonePea.role.ts ...');



export type LonePea = Role<typeof $LonePea>;
type _LonePea = PrivateRole<typeof $LonePea>;

export const $LonePea = defineRole({
    prereqs: { $PeaNode },
})

export function connectPodToLonePea(pea: Mutable<_LonePea>, pod: PodNode) {
    pea.pod = pod; //main 
}

export function disconnectPodFromLonePea(pea: Mutable<_LonePea>, pod: PodNode) {
    if (pea.pod === pod) pea.pod = null; //main 
}

if (__DEV__){
    enacts($LonePea, {})
}






