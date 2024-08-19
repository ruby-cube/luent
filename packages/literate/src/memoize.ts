import { SSRComponent } from "./SSRComponent";


const cache: Map<string, any> = new Map()

export async function memoize<T extends (...args: any[]) => SSRComponent>(key: string, run: () => any) {
    let result = cache.get(key);
    if (!result) {
        result = await run();
        cache.set(key, result);
    }
    return result;
}