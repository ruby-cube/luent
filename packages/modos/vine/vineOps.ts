import { $type } from "@rue/utils";
import {  Mutable } from "@rue/types";
import { connectPodToLonePea, disconnectPodFromLonePea, LonePea } from "./LonePea.role";
import { connectPodToPeapodPea, disconnectPodFromPeapodPea, PeapodPea } from "./PeapodPea.role";
import { PodNode, connectPeaToPod, disconnectPeaFromPod } from "./PodNode.role";
import * as ThisModule from "./vineOps"

export const VineOps__ = $type as typeof ThisModule;




export function connectLonePeaAndPod(pod: Mutable<PodNode>, pea: Mutable<LonePea>, isVinePea: boolean | undefined) {
    connectPeaToPod(pod, pea); //main 
    if (isVinePea) connectPodToLonePea(pea, pod); //main 
}

export function updateLonePeaConnections(pod: Mutable<PodNode>, pea: Mutable<LonePea>, prevPea: Mutable<LonePea>, isVinePea: boolean | undefined) {
    disconnectPeaFromPod(pod, prevPea); //main 
    connectPeaToPod(pod, pea); //main 
    if (isVinePea) {
        disconnectPodFromLonePea(prevPea, pod) //main 
        connectPodToLonePea(pea, pod); //main 
    }

}





export function connectPeasAndPod(pod: Mutable<PodNode>, peapod: Mutable<PeapodPea>[], isVinePea: boolean | undefined) {
    const limit = peapod.length;
    for (let i = 0; i < limit; i++) {
        const pea = peapod[i];
        connectPeaToPod(pod, pea) //main 
        if (isVinePea) connectPodToPeapodPea(peapod[i], pod, i); //main 
    }
}

export function updatePeapodConnections(pod: Mutable<PodNode>, peapod: Mutable<PeapodPea>[], prevPeapod: Mutable<PeapodPea>[], isVinePea: boolean | undefined) {
    const limit = Math.max(peapod.length, prevPeapod.length);
    const droppedPeas = new Set() as Set<PeapodPea>;
    for (let i = 0; i < limit; i++) {
        const prevPea = prevPeapod[i];
        const pea = peapod[i];
        if (pea) {
            connectPeaToPod(pod, pea) //main 
            if (isVinePea) connectPodToPeapodPea(pea, pod, i); //main 
            droppedPeas.delete(pea);
        }
        if (prevPea === pea) continue;
        if (prevPea) droppedPeas.add(prevPea);
    }
    for (const droppedPea of droppedPeas) {
        disconnectPeaFromPod(pod, droppedPea); //main 
        if (isVinePea) disconnectPodFromPeapodPea(droppedPea, pod) //main 
    }
}