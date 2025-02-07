import { MaybeIonicAtom } from "../ionic/IonicAtom";
import { Watchable } from "../watch/Watched";

export type PrimaryMuon = MaybeIonicAtom & Watchable





/**
* Managed Atomic Muon
* - writable state property
* - optional methods
* ---lazily bind `this` to muon so you can just pass the method instead of wrapping in arrow function
* - reactivity (ion) or inert (neutron)
* - auto-ionize state if initialized with ionized state
* 
* Managed Derivation Ion
* - memoization
* ---retracking
* - provide previous state to derivation
*  */

/** 
* Instead of writing all this:
*
* let _count: number = 0;
*
* function $count() {
*    return _count;
* }
*
* Object.defineProperties($count, {
*    // writable state property
*    state: {
*       get() {
*          return _count;
*       },
*       set(count: number) {
*          _count = count;
*       }
*    },
*    // methods
*    increment: {
*
*    }
* }) 
* 
* 
* */