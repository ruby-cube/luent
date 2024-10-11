import { DerivedIon } from "../derivations/DerivedIon";
import { Ion } from "../ion/Ion";
import { IonicModel } from "../ionize/ionize";
import { PropIon } from "../ionize/PropIon";

class ThisEffect {
    newValue?: any;
    oldValue?: any;
    watchSubject: IonicModel | DerivedIon | Ion | PropIon | (IonicModel | DerivedIon | Ion | PropIon)[];
    mutations: MutationRecord[]
}
