import { $schedule, Callback } from "./flaskableListeners";


export function flaskablePromise<T>(promise: Promise<T>): Promise<T> {
    const flaskable = {
        then<TResult1 = T>(
            onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null | undefined,
        ): Promise<TResult1> {
            return makeFlaskableScheduler(onfulfilled, (cb)=>promise.then(cb)) as Promise<TResult1> 
        },

        catch<TResult = never>(
            onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined
        ): Promise<T | TResult> {
            return makeFlaskableScheduler(onrejected, (cb)=>promise.catch(cb)) as Promise<T | TResult>
        },

        finally(
            onfinally?: (() => void) | null | undefined
        ): Promise<T> {
            return makeFlaskableScheduler(onfinally, (cb)=>promise.finally(cb)) as Promise<T>
        }
    } as Promise<T>

    Object.setPrototypeOf(flaskable, promise); // TODO: get rid of setPrototypeOf
    return flaskable;
}



export class FlaskablePromise<T> extends Promise<T> {
    
    constructor(private promise: Promise<T>) {
        super(() => { })
    }

    then<TResult1 = T>(
        onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null | undefined,
    ): Promise<TResult1> {
        return new FlaskablePromise(this.promise.then(onfulfilled))
    }

    catch<TResult = never>(
        onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined
    ): Promise<T | TResult> {
        return new FlaskablePromise(this.promise.catch(onrejected))
    }

    finally(
        onfinally?: (() => void) | null | undefined
    ): Promise<T> {
        return new FlaskablePromise(this.promise.finally(onfinally))
    }
}

function makeFlaskableScheduler(callback: Callback | null | undefined, scheduler: (cb: Callback | null | undefined) => any) {
    if (!callback) {
        return flaskablePromise(scheduler(callback))
    }
    let output: Promise<unknown>;
    $schedule(callback, undefined, {
        enroll(cb) {
            output = scheduler(cb)
        },
        remove() {
        }
    })

    return flaskablePromise(output!);
}

