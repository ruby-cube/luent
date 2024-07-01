export type NodeID = number;


export class VineNodeDepot<T> extends Map<NodeID, T> {

    currentID: number = 0;

    genID() {
        //TODO: replace with better implementation
        // check if id exists in depot table
        return this.currentID++;
    }
}
