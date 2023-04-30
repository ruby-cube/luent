export async function after<T>(promise: Promise<T>) {
    try {
        const result = await promise
        return [result, null]
    }
    catch (err) {
        return [null, err]
    }
}