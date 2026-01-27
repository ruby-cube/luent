


// class PromiseLike<T> implements Promise<T> {

//    private tasks: (() => void)[] = []

//    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined): Promise<TResult1 | TResult2> {
//       this.tasks.push(() => { console.log('snuck in'), onfulfilled?.('' as T), console.log('snuck out') })
//    }
//    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined): Promise<T | TResult> {
//       throw new Error("Method not implemented.");
//    }
//    finally(onfinally?: (() => void) | null | undefined): Promise<T> {
//       throw new Error("Method not implemented.");
//    }
//    [Symbol.toStringTag]: string = 'string'
// }