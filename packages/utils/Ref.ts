export class Ref<T> {
    readonly o: T | undefined; // o stands for object (as in target) of reference 
    constructor(value?: T){
        this.o = value;
    }
}