export class Ref<T> {
    o: T | undefined; // o stands for object (as in target) of reference 
    constructor(value?: T){
        this.o = value;
    }
}