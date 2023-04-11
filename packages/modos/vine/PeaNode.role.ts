import { defineRole, Role, PrivateRole, enacts } from '@rue/etre';
import { $type } from '@rue/utils';
import { $Modo } from '../Modo.role';
import { PodNode } from './PodNode.role';
import { IReactive } from '@rue/paravue';
console.log('LOADING PeaNode.role.ts ...');



export type PeaNode = Role<typeof $PeaNode>;
type _PeaNode = PrivateRole<typeof $PeaNode>;

export const $PeaNode = defineRole({
    prereqs: { $Modo },
    interface: $type as IReactive & {
        pod: PodNode | null;
    },

    isDetached() {
        return this.pod == null;
    }
})


if (__DEV__) {
    enacts($PeaNode, {})
}

